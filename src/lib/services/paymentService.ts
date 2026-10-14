import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PaymentProof, Order, Transaction } from '@/types';
import { removeUndefinedFields } from '@/lib/utils';

const PAYMENTS_COLLECTION = 'payments';
const ORDERS_COLLECTION = 'orders';
const TRANSACTIONS_COLLECTION = 'transactions';

/**
 * Mengambil semua data pembayaran yang perlu diverifikasi admin
 */
export async function getPendingPayments(): Promise<Array<PaymentProof & { order?: Order }>> {
  try {
    const q = query(
      collection(db, PAYMENTS_COLLECTION),
      where('status', '==', 'PENDING_VERIFICATION'),
      orderBy('uploadedAt', 'desc')
    );
    const snap = await getDocs(q);

    const results: Array<PaymentProof & { order?: Order }> = [];
    for (const d of snap.docs) {
      const paymentData = { id: d.id, ...d.data() } as PaymentProof;
      // Ambil data pesanan terkait
      const orderSnap = await getDoc(doc(db, ORDERS_COLLECTION, paymentData.orderId));
      const orderData = orderSnap.exists() ? ({ id: orderSnap.id, ...orderSnap.data() } as Order) : undefined;
      results.push({ ...paymentData, order: orderData });
    }
    return results;
  } catch (err) {
    console.warn('Gagal memuat pending payments dari Firestore:', err);
    return [];
  }
}

/**
 * Mengambil seluruh riwayat pembayaran
 */
export async function getAllPayments(): Promise<Array<PaymentProof & { order?: Order }>> {
  try {
    const q = query(collection(db, PAYMENTS_COLLECTION), orderBy('uploadedAt', 'desc'));
    const snap = await getDocs(q);

    const results: Array<PaymentProof & { order?: Order }> = [];
    for (const d of snap.docs) {
      const paymentData = { id: d.id, ...d.data() } as PaymentProof;
      const orderSnap = await getDoc(doc(db, ORDERS_COLLECTION, paymentData.orderId));
      const orderData = orderSnap.exists() ? ({ id: orderSnap.id, ...orderSnap.data() } as Order) : undefined;
      results.push({ ...paymentData, order: orderData });
    }
    return results;
  } catch (err) {
    console.warn('Gagal memuat seluruh payments:', err);
    return [];
  }
}

/**
 * Memverifikasi bukti transfer (SETUJUI / VALID) secara atomik
 */
export async function approvePayment(
  paymentId: string,
  orderId: string,
  verifierName: string
): Promise<{ success: boolean; message?: string }> {
  const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);

  try {
    await runTransaction(db, async (transaction) => {
      const paymentSnap = await transaction.get(paymentRef);
      if (!paymentSnap.exists()) throw new Error('Data bukti pembayaran tidak ditemukan.');

      const paymentData = paymentSnap.data() as PaymentProof;
      if (paymentData.status === 'VERIFIED') throw new Error('Pembayaran ini sudah diverifikasi sebelumnya.');

      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) throw new Error('Pesanan terkait tidak ditemukan.');
      const orderData = orderSnap.data() as Order;

      const now = new Date().toISOString();

      // 1. Perbarui status pembayaran
      transaction.update(paymentRef, {
        status: 'VERIFIED',
        verifiedBy: verifierName,
        verifiedAt: now,
      });

      // 2. Perbarui status pesanan menjadi READY_FOR_PICKUP (jika ambil di toko) atau PROCESSING (jika kirim)
      const nextStatus = orderData.fulfillmentMethod === 'PICKUP' ? 'READY_FOR_PICKUP' : 'PROCESSING';
      transaction.update(orderRef, {
        orderStatus: nextStatus,
        paymentStatus: 'SUCCESS',
        updatedAt: now,
      });

      // 3. Buat dokumen Transaksi Keuangan Resmi (masuk ke buku kas / omzet)
      const trxId = `TRX-${orderData.id}`;
      const trxRef = doc(db, TRANSACTIONS_COLLECTION, trxId);
      const newTransaction: Transaction = {
        id: trxId,
        channel: 'MARKETPLACE',
        orderId: orderData.id,
        items: orderData.items || [],
        totalAmount: orderData.totalAmount || 0,
        paymentMethod: paymentData.paymentMethod === 'QRIS' ? 'QRIS' : 'TRANSFER',
        transactionTime: now,
        status: 'COMPLETED',
        cashierName: verifierName || 'Admin Verifikasi',
      };
      transaction.set(trxRef, removeUndefinedFields(newTransaction));
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error saat approvePayment:', err);
    return { success: false, message: err.message || 'Gagal memverifikasi pembayaran.' };
  }
}

/**
 * Menolak bukti transfer yang tidak valid
 */
export async function rejectPayment(
  paymentId: string,
  orderId: string,
  rejectionReason: string,
  verifierName: string
): Promise<{ success: boolean; message?: string }> {
  const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);

  try {
    const now = new Date().toISOString();

    await updateDoc(paymentRef, {
      status: 'REJECTED',
      rejectionReason,
      verifiedBy: verifierName,
      verifiedAt: now,
    });

    await updateDoc(orderRef, {
      paymentStatus: 'REJECTED',
      orderStatus: 'PENDING_PAYMENT',
      paymentRejectionReason: rejectionReason,
      updatedAt: now,
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error rejectPayment:', err);
    return { success: false, message: err.message || 'Gagal menolak pembayaran.' };
  }
}
