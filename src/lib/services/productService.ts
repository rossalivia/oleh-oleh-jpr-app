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
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product } from '@/types';
import { INITIAL_PRODUCTS } from './seedData';
import { adjustStockAtomic } from './inventoryService';

const COLLECTION_NAME = 'products';

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  onlyPublished?: boolean;
  onlyActive?: boolean;
}

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);

    let products: Product[] = [];
    if (snapshot.empty) {
      // Auto-seed data awal jika Firestore masih kosong
      await seedProductsIfEmpty();
      products = INITIAL_PRODUCTS.map((p) => ({
        ...p,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    } else {
      products = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
      // Jika produk di Firestore belum lengkap 12 produk, sinkronkan otomatis
      if (products.length < INITIAL_PRODUCTS.length) {
        seedProductsIfEmpty().catch(() => {});
        const existingIds = new Set(products.map((p) => p.id));
        for (const initP of INITIAL_PRODUCTS) {
          if (!existingIds.has(initP.id)) {
            products.push({
              ...initP,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    // Filter di aplikasi
    if (filters) {
      if (filters.onlyActive) {
        products = products.filter((p) => p.isActive);
      }
      if (filters.onlyPublished) {
        products = products.filter((p) => p.isPublished && p.isActive);
      }
      if (filters.categoryId) {
        products = products.filter((p) => p.categoryId === filters.categoryId);
      }
      if (filters.search) {
        const term = filters.search.toLowerCase().trim();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.sku.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term)
        );
      }
    }

    return products;
  } catch (err) {
    console.warn('Gagal membaca produk dari Firestore, fallback ke seed lokal:', err);
    let fallback = INITIAL_PRODUCTS.map((p) => ({
      ...p,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (filters) {
      if (filters.onlyActive) fallback = fallback.filter((p) => p.isActive);
      if (filters.onlyPublished) fallback = fallback.filter((p) => p.isPublished && p.isActive);
      if (filters.categoryId) fallback = fallback.filter((p) => p.categoryId === filters.categoryId);
      if (filters.search) {
        const term = filters.search.toLowerCase().trim();
        fallback = fallback.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.sku.toLowerCase().includes(term)
        );
      }
    }
    return fallback;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      const found = INITIAL_PRODUCTS.find((p) => p.id === id);
      return found ? { ...found, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : null;
    }
    return { id: snap.id, ...snap.data() } as Product;
  } catch (err) {
    console.error('Error getProductById:', err);
    const found = INITIAL_PRODUCTS.find((p) => p.id === id);
    return found ? { ...found, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : null;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('slug', '==', slug));
    const snap = await getDocs(q);
    if (snap.empty) {
      const found = INITIAL_PRODUCTS.find((p) => p.slug === slug);
      return found ? { ...found, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : null;
    }
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Product;
  } catch (err) {
    console.error('Error getProductBySlug:', err);
    const found = INITIAL_PRODUCTS.find((p) => p.slug === slug);
    return found ? { ...found, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : null;
  }
}

export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  userUid: string
): Promise<{ success: boolean; productId?: string; message?: string }> {
  // Validasi field wajib
  if (!data.name?.trim()) return { success: false, message: 'Nama produk wajib diisi' };
  if (!data.sku?.trim()) return { success: false, message: 'SKU unik wajib diisi' };
  if (data.price <= 0) return { success: false, message: 'Harga jual harus lebih besar dari 0' };
  if (data.stock < 0) return { success: false, message: 'Stok tidak boleh bernilai negatif' };

  try {
    // Cek duplikasi SKU
    const skuQuery = query(collection(db, COLLECTION_NAME), where('sku', '==', data.sku.trim()));
    const skuSnap = await getDocs(skuQuery);
    if (!skuSnap.empty) {
      return { success: false, message: `SKU '${data.sku}' sudah digunakan oleh produk lain.` };
    }

    const productId = `prod-${data.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const now = new Date().toISOString();

    const productDoc = {
      ...data,
      id: productId,
      sku: data.sku.trim().toUpperCase(),
      createdAt: now,
      updatedAt: now,
    };
    const sanitizedDoc = Object.fromEntries(
      Object.entries(productDoc).filter(([_, v]) => v !== undefined)
    );

    await setDoc(doc(db, COLLECTION_NAME, productId), sanitizedDoc);

    // Catat mutasi stok awal jika stok > 0
    if (data.stock > 0) {
      await adjustStockAtomic({
        productId,
        delta: data.stock,
        reason: 'Penambahan stok awal produk baru',
        performedBy: userUid,
        referenceId: `NEW-PROD-${productId}`,
        type: 'RESTOCK',
      });
    }

    return { success: true, productId };
  } catch (err: any) {
    console.error('Error createProduct:', err);
    return { success: false, message: err.message || 'Gagal menyimpan produk.' };
  }
}

export async function updateProduct(
  id: string,
  data: Partial<Product>,
  userUid: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const existing = await getProductById(id);
    if (!existing) return { success: false, message: 'Produk tidak ditemukan.' };

    // Cek SKU jika diubah
    if (data.sku && data.sku !== existing.sku) {
      const skuQuery = query(collection(db, COLLECTION_NAME), where('sku', '==', data.sku.trim()));
      const skuSnap = await getDocs(skuQuery);
      if (!skuSnap.empty && skuSnap.docs[0].id !== id) {
        return { success: false, message: `SKU '${data.sku}' sudah digunakan produk lain.` };
      }
    }

    // Jika stok diedit secara eksplisit di form edit
    if (typeof data.stock === 'number' && data.stock !== existing.stock) {
      const delta = data.stock - existing.stock;
      const adjustRes = await adjustStockAtomic({
        productId: id,
        delta,
        reason: 'Penyesuaian manual melalui formulir edit produk',
        performedBy: userUid,
        referenceId: `EDIT-PROD-${id}`,
        type: 'MANUAL_ADJUSTMENT',
      });
      if (!adjustRes.success) {
        return { success: false, message: adjustRes.message || 'Gagal mengubah stok produk.' };
      }
    }

    const now = new Date().toISOString();
    const docRef = doc(db, COLLECTION_NAME, id);
    const mergedData = {
      ...existing,
      ...data,
      updatedAt: now,
    };
    // Hapus seluruh nilai undefined agar Firestore setDoc selalu valid
    const sanitizedData = Object.fromEntries(
      Object.entries(mergedData).filter(([_, v]) => v !== undefined)
    );
    await setDoc(docRef, sanitizedData, { merge: true });

    return { success: true };
  } catch (err: any) {
    console.error('Error updateProduct:', err);
    return { success: false, message: err.message || 'Gagal memperbarui produk.' };
  }
}

export async function toggleProductActive(id: string, isActive: boolean): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    isActive,
    updatedAt: new Date().toISOString(),
  });
}

export async function seedProductsIfEmpty(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    const existingIds = new Set(snap.docs.map((d) => d.id));
    const now = new Date().toISOString();
    for (const prod of INITIAL_PRODUCTS) {
      if (!existingIds.has(prod.id)) {
        await setDoc(doc(db, COLLECTION_NAME, prod.id), {
          ...prod,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  } catch (err) {
    console.warn('Seed products terlewati:', err);
  }
}
