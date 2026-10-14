import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StoreSettings } from '@/types';
import { STORE_IDENTITY } from '@/lib/constants';

const SETTINGS_DOC_REF = doc(db, 'storeSettings', 'general');

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: STORE_IDENTITY.name,
  tagline: STORE_IDENTITY.tagline,
  logoUrl: '',
  address: STORE_IDENTITY.address,
  googleMapsUrl: STORE_IDENTITY.googleMapsUrl,
  openingTime: STORE_IDENTITY.openingTime,
  closingTime: '', // Belum dikonfirmasi (dikosongkan)
  operationalDays: 'Buka Setiap Hari',
  phoneNumber: '', // Belum dikonfirmasi
  whatsappNumber: '', // Belum dikonfirmasi
  bankAccounts: [
    {
      bankName: 'BCA (Bank Central Asia)',
      accountNumber: '8210987654',
      accountHolder: 'Oleh Oleh Khas Jepara Jeha',
    },
    {
      bankName: 'Bank Jateng',
      accountNumber: '2001099887',
      accountHolder: 'Oleh Oleh Khas Jepara Jeha',
    },
  ],
  defaultLowStockThreshold: STORE_IDENTITY.defaultLowStockThreshold,
  cancellationPolicyNotice:
    'Pesanan online yang belum dibayar akan direservasi selama 60 menit (1 jam). Jika melewati batas waktu tanpa unggah bukti transfer, pesanan otomatis dibatalkan dan stok dikembalikan.',
};

/**
 * Mengambil pengaturan toko dari Firestore (fallback ke DEFAULT_STORE_SETTINGS)
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const snap = await getDoc(SETTINGS_DOC_REF);
    if (!snap.exists()) {
      return DEFAULT_STORE_SETTINGS;
    }
    return { ...DEFAULT_STORE_SETTINGS, ...snap.data() } as StoreSettings;
  } catch (err) {
    console.warn('Gagal membaca storeSettings dari Firestore, fallback:', err);
    return DEFAULT_STORE_SETTINGS;
  }
}

/**
 * Memperbarui pengaturan toko di Firestore
 */
export async function updateStoreSettings(
  settings: Partial<StoreSettings>,
  updatedBy: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const now = new Date().toISOString();
    const cleanSettings: Record<string, any> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined) {
        cleanSettings[key] = value;
      }
    }
    await setDoc(
      SETTINGS_DOC_REF,
      {
        ...cleanSettings,
        updatedAt: now,
        updatedBy,
      },
      { merge: true }
    );
    return { success: true };
  } catch (err: any) {
    console.error('Error saat updateStoreSettings:', err);
    return { success: false, message: err.message || 'Gagal menyimpan pengaturan toko.' };
  }
}

/**
 * Berlangganan (realtime onSnapshot) pembaruan pengaturan & logo toko dari Firestore
 */
export function subscribeStoreSettings(
  callback: (settings: StoreSettings) => void
): () => void {
  try {
    const unsubscribe = onSnapshot(
      SETTINGS_DOC_REF,
      (snap) => {
        if (!snap.exists()) {
          callback(DEFAULT_STORE_SETTINGS);
          return;
        }
        callback({ ...DEFAULT_STORE_SETTINGS, ...snap.data() } as StoreSettings);
      },
      (err) => {
        console.warn('Realtime listener storeSettings error, fallback:', err);
        callback(DEFAULT_STORE_SETTINGS);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Gagal memasang subscribeStoreSettings:', err);
    callback(DEFAULT_STORE_SETTINGS);
    return () => {};
  }
}

