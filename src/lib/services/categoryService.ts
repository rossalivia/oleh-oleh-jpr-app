import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Category } from '@/types';
import { INITIAL_CATEGORIES } from './seedData';

const COLLECTION_NAME = 'categories';

export async function getCategories(): Promise<Category[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('displayOrder', 'asc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      // Jika masih kosong di Firestore, seed secara otomatis dan kembalikan data awal
      await seedCategoriesIfEmpty();
      return INITIAL_CATEGORIES;
    }
    const cats = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
    if (cats.length < INITIAL_CATEGORIES.length) {
      seedCategoriesIfEmpty().catch(() => {});
      const existingIds = new Set(cats.map((c) => c.id));
      for (const initC of INITIAL_CATEGORIES) {
        if (!existingIds.has(initC.id)) {
          cats.push(initC);
        }
      }
    }
    return cats;
  } catch (err) {
    console.warn('Gagal membaca categories dari Firestore, fallback ke seed lokal:', err);
    return INITIAL_CATEGORIES;
  }
}

export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Category;
  } catch (err) {
    console.error('Error getCategoryById:', err);
    return INITIAL_CATEGORIES.find((c) => c.id === id) || null;
  }
}

export async function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = `cat-${data.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const now = new Date().toISOString();
  const docRef = doc(db, COLLECTION_NAME, id);
  const cleanData: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) cleanData[k] = v;
  }
  await setDoc(docRef, {
    ...cleanData,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const now = new Date().toISOString();
  const cleanData: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) cleanData[k] = v;
  }
  await setDoc(
    docRef,
    {
      ...cleanData,
      updatedAt: now,
    },
    { merge: true }
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

export async function toggleCategoryActive(id: string, isActive: boolean): Promise<void> {
  await updateCategory(id, { isActive });
}

export async function seedCategoriesIfEmpty(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    const existingIds = new Set(snap.docs.map((d) => d.id));
    const now = new Date().toISOString();
    for (const cat of INITIAL_CATEGORIES) {
      if (!existingIds.has(cat.id)) {
        await setDoc(doc(db, COLLECTION_NAME, cat.id), {
          ...cat,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  } catch (err) {
    console.warn('Seed categories ke Firestore terlewati:', err);
  }
}
