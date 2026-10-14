import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { InventoryMovement, Product } from '@/types';

const MOVEMENTS_COLLECTION = 'inventoryMovements';
const PRODUCTS_COLLECTION = 'products';

interface StockAdjustmentParams {
  productId: string;
  delta: number; // Negatif jika berkurang (misal -2), positif jika restock (misal +10)
  reason: string;
  performedBy: string;
  referenceId: string; // Order ID, Transaction ID, atau Manual Adjustment Code
  type: InventoryMovement['type'];
}

/**
 * Melakukan mutasi stok secara ATOMIK menggunakan Firestore runTransaction.
 * Menjamin stok tidak bernilai negatif dan mencatat audit trail mutasi stok secara bersamaan.
 */
export async function adjustStockAtomic(params: StockAdjustmentParams): Promise<{
  success: boolean;
  previousStock: number;
  resultingStock: number;
  message?: string;
}> {
  const { productId, delta, reason, performedBy, referenceId, type } = params;
  const productRef = doc(db, PRODUCTS_COLLECTION, productId);
  const movementRef = doc(collection(db, MOVEMENTS_COLLECTION));

  try {
    const result = await runTransaction(db, async (transaction) => {
      const prodSnapshot = await transaction.get(productRef);
      if (!prodSnapshot.exists()) {
        throw new Error(`Produk dengan ID ${productId} tidak ditemukan.`);
      }

      const prodData = prodSnapshot.data() as Product;
      const currentStock = prodData.stock || 0;
      const resultingStock = currentStock + delta;

      if (resultingStock < 0) {
        throw new Error(
          `Gagal merubah stok: Sisa stok saat ini (${currentStock} ${prodData.unit}) tidak mencukupi permintaan pengurangan ${Math.abs(delta)}.`
        );
      }

      const now = new Date().toISOString();

      // 1. Perbarui stok produk
      transaction.update(productRef, {
        stock: resultingStock,
        updatedAt: now,
      });

      // 2. Buat catatan mutasi stok di audit trail
      const movementData: InventoryMovement = {
        id: movementRef.id,
        productId,
        productName: prodData.name,
        sku: prodData.sku,
        type,
        quantityDelta: delta,
        previousStock: currentStock,
        resultingStock,
        referenceId,
        reason,
        performedBy,
        timestamp: now,
      };

      transaction.set(movementRef, movementData);

      return {
        previousStock: currentStock,
        resultingStock,
      };
    });

    return {
      success: true,
      previousStock: result.previousStock,
      resultingStock: result.resultingStock,
    };
  } catch (error: any) {
    console.error('Transaksi atomik mutasi stok gagal:', error);
    return {
      success: false,
      previousStock: 0,
      resultingStock: 0,
      message: error.message || 'Gagal memperbarui stok secara atomik.',
    };
  }
}

/**
 * Mengambil riwayat mutasi stok (audit trail)
 */
export async function getInventoryMovements(productId?: string, limitCount = 50): Promise<InventoryMovement[]> {
  try {
    let q = query(collection(db, MOVEMENTS_COLLECTION), orderBy('timestamp', 'desc'), limit(limitCount));
    if (productId) {
      q = query(
        collection(db, MOVEMENTS_COLLECTION),
        where('productId', '==', productId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryMovement));
  } catch (err) {
    console.warn('Gagal memuat inventoryMovements dari Firestore:', err);
    return [];
  }
}
