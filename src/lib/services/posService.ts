import {
  collection,
  doc,
  getDocs,
  runTransaction,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Transaction, OrderItemSnapshot, Product, Order } from '@/types';
import { removeUndefinedFields } from '@/lib/utils';

const TRANSACTIONS_COLLECTION = 'transactions';
const PRODUCTS_COLLECTION = 'products';
const MOVEMENTS_COLLECTION = 'inventoryMovements';

interface CreatePosTransactionParams {
  cashierId: string;
  cashierName: string;
  items: Array<{ product: Product; quantity: number }>;
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER';
  cashReceived?: number;
  bankDestination?: string;
  transferReference?: string;
  notes?: string;
}

/**
 * Menyimpan transaksi Kasir (PoS) secara atomik, memotong stok toko fisik seketika,
 * dan mencatat riwayat mutasi stok POS_SALE.
 */
export async function createPosTransaction(params: CreatePosTransactionParams): Promise<{
  success: boolean;
  transaction?: Transaction;
  message?: string;
}> {
  const {
    cashierId,
    cashierName,
    items,
    paymentMethod,
    cashReceived,
    bankDestination,
    transferReference,
    notes,
  } = params;

  if (!items || items.length === 0) {
    return { success: false, message: 'Keranjang kasir kosong.' };
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const trxId = `TRX-POS-${dateStr}-${randomSuffix}`;
  const now = new Date().toISOString();

  try {
    const resultTrx = await runTransaction(db, async (transaction) => {
      // 1. TAHAP PEMBACAAN (READS): Baca & validasi semua produk terlebih dahulu
      const validatedItems: Array<{
        productRef: any;
        currentProd: Product;
        quantity: number;
        newStock: number;
        subtotal: number;
      }> = [];

      let totalAmount = 0;

      for (const { product, quantity } of items) {
        if (quantity <= 0) throw new Error('Kuantitas produk kasir harus lebih dari 0.');

        const productRef = doc(db, PRODUCTS_COLLECTION, product.id);
        const prodSnap = await transaction.get(productRef);

        if (!prodSnap.exists()) {
          throw new Error(`Produk "${product.name}" tidak ditemukan di database.`);
        }

        const currentProd = prodSnap.data() as Product;
        if (currentProd.stock < quantity) {
          throw new Error(
            `Stok "${currentProd.name}" tidak mencukupi untuk penjualan kasir (Tersedia: ${currentProd.stock} ${currentProd.unit}, Diminta: ${quantity}).`
          );
        }

        const subtotal = currentProd.price * quantity;
        totalAmount += subtotal;
        const newStock = currentProd.stock - quantity;

        validatedItems.push({
          productRef,
          currentProd,
          quantity,
          newStock,
          subtotal,
        });
      }

      // 2. TAHAP PENULISAN (WRITES): Eksekusi seluruh update & set setelah semua get selesai
      const orderItemSnapshots: OrderItemSnapshot[] = [];

      for (const item of validatedItems) {
        // Potong stok fisik toko
        transaction.update(item.productRef, {
          stock: item.newStock,
          updatedAt: now,
        });

        // Simpan snapshot item transaksi
        orderItemSnapshots.push({
          productId: item.currentProd.id,
          productName: item.currentProd.name,
          sku: item.currentProd.sku,
          price: item.currentProd.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          unit: item.currentProd.unit || 'pcs',
          imageThumbnail: item.currentProd.mainImage,
        });

        // Catat mutasi stok
        const moveRef = doc(collection(db, MOVEMENTS_COLLECTION));
        transaction.set(moveRef, {
          id: moveRef.id,
          productId: item.currentProd.id,
          productName: item.currentProd.name,
          sku: item.currentProd.sku,
          type: 'POS_SALE',
          quantityDelta: -item.quantity,
          previousStock: item.currentProd.stock,
          resultingStock: item.newStock,
          referenceId: trxId,
          reason: `Penjualan langsung kasir fisik (${trxId})`,
          performedBy: cashierName || 'KASIR',
          timestamp: now,
        });
      }

      const received = cashReceived || totalAmount;
      const change = Math.max(0, received - totalAmount);

      const trxData: Transaction = removeUndefinedFields({
        id: trxId,
        channel: 'POS',
        cashierId,
        cashierName,
        items: orderItemSnapshots,
        totalAmount,
        paymentMethod,
        bankDestination: paymentMethod === 'TRANSFER' ? bankDestination : undefined,
        transferReference: (paymentMethod === 'TRANSFER' || paymentMethod === 'QRIS') ? transferReference : undefined,
        notes,
        cashReceived: received,
        cashChange: change,
        transactionTime: now,
        status: 'COMPLETED',
      });

      const trxDocRef = doc(db, TRANSACTIONS_COLLECTION, trxId);
      transaction.set(trxDocRef, trxData);

      return trxData;
    });

    return { success: true, transaction: resultTrx };
  } catch (err: any) {
    console.error('Error saat transaksi kasir PoS:', err);
    return { success: false, message: err.message || 'Gagal memproses transaksi kasir.' };
  }
}

/**
 * Mengambil transaksi kasir & marketplace terakhir dengan rekonsiliasi otomatis
 * untuk memastikan seluruh pesanan yang telah dibayar/selesai (termasuk Pickup)
 * tampil di riwayat transaksi dan kasir.
 */
export async function getRecentTransactions(limitCount = 50): Promise<Transaction[]> {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      orderBy('transactionTime', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    const transactions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));

    // Kumpulkan seluruh orderId yang sudah memiliki dokumen transaksi
    const coveredOrderIds = new Set<string>();
    for (const trx of transactions) {
      if (trx.orderId) {
        coveredOrderIds.add(trx.orderId);
      }
      if (trx.id.startsWith('TRX-ORD-')) {
        coveredOrderIds.add(trx.id.replace('TRX-', ''));
      }
    }

    // Ambil pesanan yang berstatus sukses namun belum tercatat di transactions (misal transaksi pickup terdahulu)
    try {
      const ordersSnap = await getDocs(
        query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50))
      );
      const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      const realizedStatuses = ['PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'COMPLETED'];

      for (const ord of orders) {
        if (realizedStatuses.includes(ord.orderStatus) && !coveredOrderIds.has(ord.id)) {
          // Buat record transaksi sintetis
          const synTrx: Transaction = {
            id: `TRX-${ord.id}`,
            channel: 'MARKETPLACE',
            orderId: ord.id,
            items: ord.items || [],
            totalAmount: ord.totalAmount || 0,
            paymentMethod: ord.fulfillmentMethod === 'PICKUP' ? 'CASH' : 'TRANSFER',
            transactionTime: ord.createdAt || new Date().toISOString(),
            status: 'COMPLETED',
            cashierName: ord.customerName ? `Online (${ord.customerName})` : 'Marketplace Online',
          };

          transactions.push(synTrx);
          coveredOrderIds.add(ord.id);
        }
      }
    } catch (orderErr) {
      console.warn('Rekonsiliasi pesanan orders ke riwayat transaksi dilewati:', orderErr);
    }

    // Urutkan kembali berdasarkan transactionTime descending
    return transactions
      .sort((a, b) => new Date(b.transactionTime).getTime() - new Date(a.transactionTime).getTime())
      .slice(0, limitCount);
  } catch (err) {
    console.warn('Gagal memuat transactions:', err);
    return [];
  }
}
