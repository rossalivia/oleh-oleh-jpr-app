import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Transaction, Order } from '@/types';
import { formatDateTime } from '@/lib/utils';

export interface TopProductSummary {
  productName: string;
  sku: string;
  quantitySold: number;
  totalAmount: number;
  revenue: number;
}

export interface SalesReportSummary {
  totalRevenue: number;
  totalTransactions: number;
  // POS & Physical Cashier
  posRevenue: number; // directPosRevenue + pickupCashRevenue
  posTransactions: number;
  posTransactionsCount: number;
  directPosRevenue: number;
  directPosCount: number;
  pickupCashRevenue: number; // Marketplace order pickup paid in cash at cashier
  pickupCashCount: number;

  // Marketplace & Non-cash
  marketplaceRevenue: number; // pickupTransferRevenue + shippingTransferRevenue
  marketplaceTransactionsCount: number;
  onlineRevenue: number;
  onlineTransactions: number;
  pickupTransferRevenue: number; // Marketplace order pickup paid via Transfer/QRIS
  pickupTransferCount: number;
  shippingTransferRevenue: number; // Marketplace order shipping paid via Transfer/QRIS
  shippingTransferCount: number;

  averageOrderValue: number;
  topProducts: TopProductSummary[];
  topSellingProducts: TopProductSummary[];
  recentTransactions: Transaction[];
}

export async function getSalesReport(
  timeRange: 'today' | '7days' | '30days' | 'all' = '30days'
): Promise<SalesReportSummary> {
  try {
    let snap;
    try {
      const q = query(
        collection(db, 'transactions'),
        where('status', '==', 'COMPLETED'),
        orderBy('transactionTime', 'desc')
      );
      snap = await getDocs(q);
    } catch (indexErr) {
      // Fallback query tanpa composite index jika Firestore belum memiliki index komposit
      const fallbackQ = query(collection(db, 'transactions'), orderBy('transactionTime', 'desc'));
      snap = await getDocs(fallbackQ);
    }

    const allTrx: Transaction[] = [];
    const coveredOrderIds = new Set<string>();

    snap.forEach((d) => {
      const trx = { id: d.id, ...d.data() } as Transaction;
      // Jangan hitung transaksi voided
      if (trx.status && trx.status === 'VOIDED') return;
      allTrx.push(trx);
      if (trx.orderId) {
        coveredOrderIds.add(trx.orderId);
      }
      if (trx.id.startsWith('TRX-')) {
        coveredOrderIds.add(trx.id.replace('TRX-', ''));
      }
    });

    // Rekonsiliasi order yang sudah terbayar / selesai (termasuk Pickup) yang belum tercatat di transactions
    try {
      const ordersSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
      const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      const realizedStatuses = ['PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'COMPLETED'];

      for (const ord of orders) {
        if (realizedStatuses.includes(ord.orderStatus) && !coveredOrderIds.has(ord.id)) {
          const isPickupCash = ord.fulfillmentMethod === 'PICKUP' && ord.paymentMethod === 'CASH';
          const synTrx: Transaction = {
            id: `TRX-${ord.id}`,
            channel: isPickupCash ? 'POS' : 'MARKETPLACE',
            orderId: ord.id,
            fulfillmentMethod: ord.fulfillmentMethod,
            items: ord.items || [],
            totalAmount: ord.totalAmount || 0,
            paymentMethod: ord.paymentMethod || (ord.fulfillmentMethod === 'PICKUP' ? 'CASH' : 'TRANSFER'),
            transactionTime: ord.createdAt || new Date().toISOString(),
            status: 'COMPLETED',
            bankDestination: ord.bankDestination,
            notes: isPickupCash ? 'Pesanan Ambil di Gerai (Tunai Kasir)' : (ord.fulfillmentMethod === 'PICKUP' ? 'Pesanan Ambil di Gerai (Transfer/QRIS)' : 'Pesanan Kirim Ekspedisi'),
            cashierName: isPickupCash ? 'Kasir Gerai Fisik (Pickup Online)' : (ord.customerName ? `Online (${ord.customerName})` : 'Marketplace Online'),
          };

          allTrx.push(synTrx);
          coveredOrderIds.add(ord.id);
        }
      }
    } catch (ordErr) {
      console.warn('Gagal memuat pesanan untuk rekonsiliasi laporan:', ordErr);
    }

    const now = new Date();
    let startTime = 0;

    if (timeRange === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startTime = startOfDay.getTime();
    } else if (timeRange === '7days') {
      startTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    } else if (timeRange === '30days') {
      startTime = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    }

    let totalRevenue = 0;
    let posRevenue = 0;
    let posCount = 0;
    let directPosRevenue = 0;
    let directPosCount = 0;
    let pickupCashRevenue = 0;
    let pickupCashCount = 0;

    let onlineRevenue = 0;
    let onlineCount = 0;
    let pickupTransferRevenue = 0;
    let pickupTransferCount = 0;
    let shippingTransferRevenue = 0;
    let shippingTransferCount = 0;

    const productMap = new Map<string, { productName: string; sku: string; quantitySold: number; totalAmount: number }>();
    const filteredTrx: Transaction[] = [];

    for (const trx of allTrx) {
      const trxTime = new Date(trx.transactionTime).getTime();

      if (timeRange === 'all' || trxTime >= startTime) {
        filteredTrx.push(trx);
        const amount = trx.totalAmount || 0;
        totalRevenue += amount;

        const isPickup = trx.fulfillmentMethod === 'PICKUP' || (trx.notes && (trx.notes.includes('Pickup') || trx.notes.includes('Ambil di Gerai') || trx.notes.includes('Ambil di Toko')));
        const isCash = trx.paymentMethod === 'CASH';

        if (trx.channel === 'POS') {
          if (trx.orderId || (isPickup && isCash)) {
            // Pesanan marketplace pickup yang uangnya diserahkan tunai di kasir gerai
            pickupCashRevenue += amount;
            pickupCashCount++;
            posRevenue += amount;
            posCount++;
          } else {
            // Transaksi langsung di mesin kasir POS
            directPosRevenue += amount;
            directPosCount++;
            posRevenue += amount;
            posCount++;
          }
        } else {
          // Channel MARKETPLACE
          if (isPickup && isCash) {
            // Pickup bayar tunai di gerai: uang masuk ke kasir gerai fisik!
            pickupCashRevenue += amount;
            pickupCashCount++;
            posRevenue += amount;
            posCount++;
          } else if (isPickup) {
            // Pickup bayar transfer / QRIS
            pickupTransferRevenue += amount;
            pickupTransferCount++;
            onlineRevenue += amount;
            onlineCount++;
          } else {
            // Kirim ekspedisi bayar transfer / QRIS
            shippingTransferRevenue += amount;
            shippingTransferCount++;
            onlineRevenue += amount;
            onlineCount++;
          }
        }

        // Aggregate top selling products
        for (const item of trx.items || []) {
          const key = item.productId || item.productName;
          const existing = productMap.get(key) || {
            productName: item.productName,
            sku: item.sku,
            quantitySold: 0,
            totalAmount: 0,
          };

          existing.quantitySold += item.quantity;
          existing.totalAmount += item.subtotal || item.price * item.quantity;
          productMap.set(key, existing);
        }
      }
    }

    // Urutkan transaksi terakhir descending
    filteredTrx.sort((a, b) => new Date(b.transactionTime).getTime() - new Date(a.transactionTime).getTime());

    const topProducts: TopProductSummary[] = Array.from(productMap.values())
      .map((p) => ({
        productName: p.productName,
        sku: p.sku,
        quantitySold: p.quantitySold,
        totalAmount: p.totalAmount,
        revenue: p.totalAmount,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    const totalTransactions = filteredTrx.length;
    const averageOrderValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    return {
      totalRevenue,
      totalTransactions,
      posRevenue,
      posTransactions: posCount,
      posTransactionsCount: posCount,
      directPosRevenue,
      directPosCount,
      pickupCashRevenue,
      pickupCashCount,
      marketplaceRevenue: onlineRevenue,
      marketplaceTransactionsCount: onlineCount,
      onlineRevenue,
      onlineTransactions: onlineCount,
      pickupTransferRevenue,
      pickupTransferCount,
      shippingTransferRevenue,
      shippingTransferCount,
      averageOrderValue,
      topProducts,
      topSellingProducts: topProducts,
      recentTransactions: filteredTrx,
    };
  } catch (err) {
    console.warn('Gagal mengagregasi laporan penjualan:', err);
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      posRevenue: 0,
      posTransactions: 0,
      posTransactionsCount: 0,
      directPosRevenue: 0,
      directPosCount: 0,
      pickupCashRevenue: 0,
      pickupCashCount: 0,
      marketplaceRevenue: 0,
      marketplaceTransactionsCount: 0,
      onlineRevenue: 0,
      onlineTransactions: 0,
      pickupTransferRevenue: 0,
      pickupTransferCount: 0,
      shippingTransferRevenue: 0,
      shippingTransferCount: 0,
      averageOrderValue: 0,
      topProducts: [],
      topSellingProducts: [],
      recentTransactions: [],
    };
  }
}

/**
 * Menghasilkan file CSV dan memicu download otomatis dengan pemisahan kategori yang detail
 */
export function exportTransactionsToCSV(transactions: Transaction[], filename = 'laporan-penjualan-jeha.csv') {
  const headers = [
    'ID Transaksi',
    'Waktu (WIB)',
    'Saluran',
    'Kategori Transaksi',
    'Metode Penyerahan',
    'Metode Pembayaran',
    'Total Belanja (Rp)',
    'Kasir / Rekening Tujuan',
    'Catatan / Referensi',
    'Jumlah Item',
  ];

  const rows = transactions.map((t) => {
    const isPickup = t.fulfillmentMethod === 'PICKUP' || (t.notes && (t.notes.includes('Pickup') || t.notes.includes('Ambil di Gerai') || t.notes.includes('Ambil di Toko')));
    const isCash = t.paymentMethod === 'CASH';

    let kategori = 'Kasir Fisik Langsung';
    if (t.channel === 'POS' && (t.orderId || isPickup)) {
      kategori = 'Online Pickup - Tunai di Kasir Gerai';
    } else if (t.channel === 'MARKETPLACE' && isPickup) {
      kategori = isCash ? 'Online Pickup - Tunai di Kasir Gerai' : `Online Pickup - Non-Tunai (${t.paymentMethod})`;
    } else if (t.channel === 'MARKETPLACE') {
      kategori = `Online Kurir Ekspedisi - Non-Tunai (${t.paymentMethod})`;
    }

    const penyerahan = isPickup ? 'Ambil di Gerai' : (t.channel === 'POS' ? 'Langsung di Gerai' : 'Kirim Ekspedisi');
    const operator = t.bankDestination || t.cashierName || 'Kasir Gerai';
    const ref = t.transferReference || t.notes || '-';

    return [
      `"${t.id}"`,
      `"${formatDateTime(t.transactionTime)}"`,
      `"${t.channel === 'POS' ? 'POS Gerai Fisik' : 'Marketplace Online'}"`,
      `"${kategori}"`,
      `"${penyerahan}"`,
      `"${t.paymentMethod}"`,
      t.totalAmount,
      `"${operator}"`,
      `"${ref}"`,
      t.items?.reduce((sum, i) => sum + i.quantity, 0) || 0,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
