import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Order, OrderItemSnapshot, Product, OrderStatus, PaymentStatus, FulfillmentMethod, Transaction } from '@/types';
import { STORE_IDENTITY } from '@/lib/constants';
import { removeUndefinedFields } from '@/lib/utils';

const ORDERS_COLLECTION = 'orders';
const PRODUCTS_COLLECTION = 'products';

interface CreateOrderParams {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{ productId: string; quantity: number }>;
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod?: 'BANK_TRANSFER' | 'QRIS' | 'CASH';
  bankDestination?: string;
  paymentProofUrl?: string;
  shippingAddress?: {
    recipientName: string;
    phoneNumber: string;
    addressLine: string;
    city: string;
    postalCode?: string;
    courierName?: string;
  };
  notes?: string;
}

/**
 * Membuat pesanan baru dengan validasi harga sisi server dan reservasi stok atomik.
 */
export async function createOrder(params: CreateOrderParams): Promise<{
  success: boolean;
  orderId?: string;
  message?: string;
}> {
  const {
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    items,
    fulfillmentMethod,
    paymentMethod = 'BANK_TRANSFER',
    bankDestination,
    paymentProofUrl,
    shippingAddress,
    notes,
  } = params;

  if (!items || items.length === 0) {
    return { success: false, message: 'Keranjang belanja kosong.' };
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderId = `ORD-${dateStr}-${randomSuffix}`;
  const now = new Date();
  const createdAtIso = now.toISOString();

  // Batas bayar 60 menit (1 jam)
  const expiresAt = new Date(now.getTime() + STORE_IDENTITY.orderReservationTimeoutMinutes * 60 * 1000).toISOString();

  try {
    // Jalankan transaksi atomik untuk validasi harga riil dari database dan pengurangan stok
    const result = await runTransaction(db, async (transaction) => {
      let calculatedSubtotal = 0;
      const orderItemSnapshots: OrderItemSnapshot[] = [];

      // 1. TAHAP PEMBACAAN (READS): Validasi & ambil semua data produk terlebih dahulu
      const validatedProducts: Array<{
        productRef: any;
        prodData: Product;
        quantity: number;
        newStock: number;
        itemSubtotal: number;
      }> = [];

      for (const item of items) {
        if (item.quantity <= 0) {
          throw new Error('Kuantitas produk tidak valid.');
        }

        const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
        const prodSnap = await transaction.get(productRef);

        if (!prodSnap.exists()) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        }

        const prodData = prodSnap.data() as Product;

        if (!prodData.isActive) {
          throw new Error(`Produk "${prodData.name}" saat ini tidak aktif.`);
        }

        if (prodData.stock < item.quantity) {
          throw new Error(
            `Stok untuk "${prodData.name}" tidak mencukupi (Tersedia: ${prodData.stock} ${prodData.unit}, Diminta: ${item.quantity}).`
          );
        }

        const itemSubtotal = prodData.price * item.quantity;
        calculatedSubtotal += itemSubtotal;
        const newStock = prodData.stock - item.quantity;

        validatedProducts.push({
          productRef,
          prodData,
          quantity: item.quantity,
          newStock,
          itemSubtotal,
        });
      }

      // 2. TAHAP PENULISAN (WRITES): Eksekusi seluruh mutasi & penulisan dokumen setelah semua get() selesai
      for (const item of validatedProducts) {
        // Deduksi/reservasi stok
        transaction.update(item.productRef, {
          stock: item.newStock,
          updatedAt: createdAtIso,
        });

        // Catat snapshot data produk tepercaya
        orderItemSnapshots.push({
          productId: item.prodData.id,
          productName: item.prodData.name,
          sku: item.prodData.sku,
          price: item.prodData.price,
          quantity: item.quantity,
          subtotal: item.itemSubtotal,
          unit: item.prodData.unit || 'pcs',
          imageThumbnail: item.prodData.mainImage,
        });

        // Buat log mutasi stok
        const moveRef = doc(collection(db, 'inventoryMovements'));
        const moveData = removeUndefinedFields({
          id: moveRef.id,
          productId: item.prodData.id,
          productName: item.prodData.name,
          sku: item.prodData.sku,
          type: 'ONLINE_ORDER_RESERVED',
          quantityDelta: -item.quantity,
          previousStock: item.prodData.stock,
          resultingStock: item.newStock,
          referenceId: orderId,
          reason: `Reservasi stok pesanan online (${orderId})`,
          performedBy: customerName || 'PELANGGAN',
          timestamp: createdAtIso,
        });
        transaction.set(moveRef, moveData);
      }

      // Ongkir: Rp 0 jika Pickup, flat Rp 15.000 jika ekspedisi kurir (standar pulau Jawa)
      const shippingFee = fulfillmentMethod === 'PICKUP' ? 0 : 15000;
      const totalAmount = calculatedSubtotal + shippingFee;

      // 2. Buat dokumen Order (Pastikan tidak ada properti bernilai undefined untuk Firestore)
      const isProofProvided = !!(paymentProofUrl && paymentProofUrl.trim());
      const initialOrderStatus: OrderStatus = isProofProvided ? 'WAITING_VERIFICATION' : 'PENDING_PAYMENT';
      const initialPaymentStatus: PaymentStatus = isProofProvided ? 'PENDING_VERIFICATION' : 'UNPAID';

      const newOrderPayload: any = {
        id: orderId,
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        items: orderItemSnapshots,
        subtotal: calculatedSubtotal,
        shippingFee,
        totalAmount,
        orderStatus: initialOrderStatus,
        paymentStatus: initialPaymentStatus,
        channel: 'MARKETPLACE',
        fulfillmentMethod,
        paymentMethod,
        bankDestination: bankDestination || (paymentMethod === 'CASH' ? 'KASIR_GERAI' : 'BCA'),
        paymentProofUrl: paymentProofUrl || undefined,
        expiresAt,
        createdAt: createdAtIso,
        updatedAt: createdAtIso,
      };

      if (notes && notes.trim()) {
        newOrderPayload.notes = notes.trim();
      }

      if (fulfillmentMethod === 'SHIPPING' && shippingAddress) {
        newOrderPayload.shippingAddress = shippingAddress;
      }

      const sanitizedOrder = removeUndefinedFields(newOrderPayload);

      const orderRef = doc(db, ORDERS_COLLECTION, orderId);
      transaction.set(orderRef, sanitizedOrder);

      // Jika bukti pembayaran transfer disertakan langsung di checkout
      if (isProofProvided) {
        const payRef = doc(db, 'payments', `PAY-${orderId}`);
        const payPayload = removeUndefinedFields({
          id: `PAY-${orderId}`,
          orderId,
          paymentMethod: paymentMethod === 'QRIS' ? 'QRIS' : 'BANK_TRANSFER',
          amount: totalAmount,
          proofImageUrl: paymentProofUrl,
          senderBank: bankDestination || 'BCA',
          senderAccountName: customerName,
          uploadedAt: createdAtIso,
          status: 'PENDING_VERIFICATION',
        });
        transaction.set(payRef, payPayload);
      }

      return { orderId };
    });

    return { success: true, orderId: result.orderId };
  } catch (error: any) {
    console.error('Error saat membuat pesanan:', error);
    return {
      success: false,
      message: error.message || 'Gagal memproses pesanan. Silakan coba kembali.',
    };
  }
}

/**
 * Mengambil pesanan berdasarkan ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const snap = await getDoc(doc(db, ORDERS_COLLECTION, orderId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Order;
  } catch (err) {
    console.error('Error getOrderById:', err);
    return null;
  }
}

/**
 * Mengambil daftar pesanan pelanggan
 */
export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
  } catch (err) {
    try {
      // Fallback query tanpa orderBy untuk menangani kasus composite index Firestore belum terpasang
      const fallbackQuery = query(
        collection(db, ORDERS_COLLECTION),
        where('customerId', '==', customerId)
      );
      const snap = await getDocs(fallbackQuery);
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (innerErr) {
      console.warn('Gagal memuat pesanan pelanggan:', innerErr);
      return [];
    }
  }
}

/**
 * Mengambil semua pesanan untuk admin
 */
export async function getAllOrders(): Promise<Order[]> {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
  } catch (err) {
    console.warn('Gagal memuat semua pesanan:', err);
    return [];
  }
}

/**
 * Memperbarui status pesanan dan secara otomatis MENYINKRONKAN dokumen transaksi keuangan
 * ke koleksi 'transactions' agar seluruh omzet (baik Pickup maupun Ekspedisi) tercatat resmi
 * di riwayat transaksi toko dan laporan penjualan.
 */
export async function updateOrderStatusAndSyncTransaction(params: {
  orderId: string;
  newStatus: OrderStatus;
  trackingNumber?: string;
  operatorName?: string;
}): Promise<{ success: boolean; message?: string }> {
  const { orderId, newStatus, trackingNumber, operatorName } = params;
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);

  try {
    const snap = await getDoc(orderRef);
    if (!snap.exists()) {
      return { success: false, message: 'Pesanan tidak ditemukan.' };
    }
    const orderData = snap.data() as Order;
    const now = new Date().toISOString();

    const updateData: any = {
      orderStatus: newStatus,
      updatedAt: now,
    };

    if (newStatus === 'SHIPPED' && trackingNumber?.trim()) {
      updateData['shippingAddress.trackingNumber'] = trackingNumber.trim();
    }

    // Jika status diubah ke CANCELLED, panggil cancelOrder untuk mengembalikan kuantitas stok secara atomik
    if (newStatus === 'CANCELLED') {
      return await cancelOrder(orderId, 'ADMIN', 'Dibatalkan oleh Admin melalui panel pesanan');
    }

    // Jika pesanan beralih ke status sukses terealisasi, pastikan paymentStatus SUCCESS
    const isRealizedSale = ['PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'COMPLETED'].includes(newStatus);
    if (isRealizedSale && orderData.paymentStatus !== 'SUCCESS') {
      updateData.paymentStatus = 'SUCCESS';
    }

    // Perbarui dokumen pesanan
    await updateDoc(orderRef, removeUndefinedFields(updateData));

    // Sinkronkan ke koleksi transactions (Buku Kas & Riwayat Transaksi Toko)
    const trxId = `TRX-${orderData.id}`;
    const trxRef = doc(db, 'transactions', trxId);
    const trxSnap = await getDoc(trxRef);

    if (isRealizedSale) {
      if (!trxSnap.exists()) {
        const isCashPickup = orderData.fulfillmentMethod === 'PICKUP' && orderData.paymentMethod === 'CASH';
        const newTrx: Transaction = {
          id: trxId,
          channel: isCashPickup ? 'POS' : 'MARKETPLACE',
          orderId: orderData.id,
          items: orderData.items || [],
          totalAmount: orderData.totalAmount || 0,
          paymentMethod: isCashPickup ? 'CASH' : (orderData.paymentMethod === 'QRIS' ? 'QRIS' : 'TRANSFER'),
          fulfillmentMethod: orderData.fulfillmentMethod,
          bankDestination: orderData.bankDestination,
          transactionTime: orderData.createdAt || now,
          status: 'COMPLETED',
          cashierName: operatorName || (isCashPickup ? 'Kasir Gerai Fisik' : 'Admin Toko'),
          notes: isCashPickup
            ? 'Pesanan Ambil di Gerai - Bayar Tunai Kasir Toko'
            : (orderData.fulfillmentMethod === 'PICKUP'
              ? 'Pesanan Ambil di Gerai - Lunas Transfer Bank/QRIS'
              : 'Pesanan Kirim Ekspedisi - Lunas Transfer Bank/QRIS'),
        };
        await setDoc(trxRef, removeUndefinedFields(newTrx));
      } else {
        const existingTrx = trxSnap.data() as Transaction;
        if (existingTrx.status !== 'COMPLETED') {
          await updateDoc(trxRef, { status: 'COMPLETED' });
        }
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error in updateOrderStatusAndSyncTransaction:', err);
    return { success: false, message: err.message || 'Gagal memperbarui status pesanan.' };
  }
}

/**
 * Membatalkan pesanan dan mengembalikan stok secara atomik
 */
export async function cancelOrder(
  orderId: string,
  cancelledBy: 'CUSTOMER' | 'ADMIN',
  reason: string
): Promise<{ success: boolean; message?: string }> {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);

  try {
    await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) {
        throw new Error('Pesanan tidak ditemukan.');
      }

      const orderData = orderSnap.data() as Order;

      // Cek status yang boleh dibatalkan
      if (orderData.orderStatus === 'CANCELLED') {
        throw new Error('Pesanan sudah dalam status dibatalkan.');
      }

      if (cancelledBy === 'CUSTOMER' && orderData.orderStatus !== 'PENDING_PAYMENT') {
        throw new Error('Pesanan yang sudah dibayar atau sedang diproses tidak dapat dibatalkan langsung oleh pelanggan.');
      }

      // 1. TAHAP PEMBACAAN (READS): Baca semua dokumen produk yang ada di pesanan
      const productsToRestore: Array<{
        prodRef: any;
        item: OrderItemSnapshot;
        prodData: Product;
        restoredStock: number;
      }> = [];

      for (const item of orderData.items) {
        const prodRef = doc(db, PRODUCTS_COLLECTION, item.productId);
        const prodSnap = await transaction.get(prodRef);
        if (prodSnap.exists()) {
          const prodData = prodSnap.data() as Product;
          const restoredStock = prodData.stock + item.quantity;
          productsToRestore.push({
            prodRef,
            item,
            prodData,
            restoredStock,
          });
        }
      }

      // 2. TAHAP PENULISAN (WRITES): Eksekusi seluruh mutasi & penulisan setelah semua get() selesai
      const now = new Date().toISOString();

      // Kembalikan stok setiap item pesanan & buat catatan mutasi audit
      for (const p of productsToRestore) {
        transaction.update(p.prodRef, {
          stock: p.restoredStock,
          updatedAt: now,
        });

        // Catat mutasi pengembalian stok
        const moveRef = doc(collection(db, 'inventoryMovements'));
        const moveData = removeUndefinedFields({
          id: moveRef.id,
          productId: p.item.productId,
          productName: p.item.productName,
          sku: p.item.sku,
          type: 'ORDER_CANCELLED',
          quantityDelta: p.item.quantity,
          previousStock: p.prodData.stock,
          resultingStock: p.restoredStock,
          referenceId: orderId,
          reason: `Pengembalian stok dari pembatalan pesanan (${orderId}): ${reason}`,
          performedBy: cancelledBy,
          timestamp: now,
        });
        transaction.set(moveRef, moveData);
      }

      // Perbarui status order
      const updatePayload = removeUndefinedFields({
        orderStatus: 'CANCELLED',
        paymentStatus: 'EXPIRED',
        cancellationReason: reason,
        cancelledBy,
        cancelledAt: now,
        updatedAt: now,
      });
      transaction.update(orderRef, updatePayload);
    });

    // Batalkan / void dokumen transaksi keuangan jika sebelumnya sudah terbentuk (misal pesanan sempat dibayar)
    try {
      const trxId = `TRX-${orderId}`;
      const trxRef = doc(db, 'transactions', trxId);
      const trxSnap = await getDoc(trxRef);
      if (trxSnap.exists()) {
        await updateDoc(trxRef, {
          status: 'VOIDED',
          voidReason: reason || 'Pesanan dibatalkan',
          voidedBy: cancelledBy,
        });
      }
    } catch (trxErr) {
      console.warn('Gagal membatalkan transaksi keuangan:', trxErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error saat membatalkan pesanan:', err);
    return { success: false, message: err.message || 'Gagal membatalkan pesanan.' };
  }
}

/**
 * Operasi eksplisit untuk merekonsiliasi seluruh pesanan selesai/terbayar (termasuk Pickup)
 * yang belum memiliki dokumen fisik di koleksi transactions.
 * Dijalankan secara terkontrol tanpa menimbulkan efek samping pada query baca laporan.
 */
export async function syncOrderTransactionsManually(): Promise<{ success: boolean; syncedCount: number; message?: string }> {
  try {
    const ordersSnap = await getDocs(query(collection(db, ORDERS_COLLECTION)));
    const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
    const realizedStatuses = ['PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'COMPLETED'];
    let syncedCount = 0;

    for (const ord of orders) {
      if (realizedStatuses.includes(ord.orderStatus)) {
        const trxId = `TRX-${ord.id}`;
        const trxRef = doc(db, 'transactions', trxId);
        const trxSnap = await getDoc(trxRef);

        if (!trxSnap.exists()) {
          const newTrx: Transaction = {
            id: trxId,
            channel: 'MARKETPLACE',
            orderId: ord.id,
            items: ord.items || [],
            totalAmount: ord.totalAmount || 0,
            paymentMethod: ord.fulfillmentMethod === 'PICKUP' ? 'CASH' : 'TRANSFER',
            transactionTime: ord.createdAt || new Date().toISOString(),
            status: 'COMPLETED',
            cashierName: ord.customerName ? `Online (${ord.customerName})` : 'Marketplace Online',
          };
          await setDoc(trxRef, removeUndefinedFields(newTrx));
          syncedCount++;
        }
      }
    }

    return { success: true, syncedCount };
  } catch (err: any) {
    console.error('Error syncOrderTransactionsManually:', err);
    return { success: false, syncedCount: 0, message: err.message || 'Gagal merekonsiliasi transaksi.' };
  }
}

