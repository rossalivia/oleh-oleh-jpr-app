'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Upload, AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Category } from '@/types';
import { getCategories } from '@/lib/services/categoryService';
import { createProduct } from '@/lib/services/productService';
import { useAuth } from '@/context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { compressImage } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export default function TambahProdukPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [unit, setUnit] = useState('pcs');
  const [mainImage, setMainImage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPublished, setIsPublished] = useState(true);

  // Upload & UI status
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const cats = await getCategories();
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCats(false);
      }
    }
    init();
  }, []);

  // Auto-generate slug & sku saat nama produk diinput
  const handleNameChange = (val: string) => {
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug);
    if (!sku) {
      const randomCode = Math.floor(100 + Math.random() * 900);
      setSku(`JPR-${val.slice(0, 3).toUpperCase()}-${randomCode}`);
    }
  };

  // Upload handler via Client Compression & Instant Preview
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Format file harus berupa gambar (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran gambar maksimal 10MB.');
      return;
    }

    setUploadingImage(true);
    setErrorMsg('');
    try {
      // 1. Kompresi gambar di client secara instan (< 70 KB)
      const compressedDataUrl = await compressImage(file, 800, 0.7);

      // 2. Pasang langsung gambar ke form agar preview instan & langsung siap disimpan!
      setMainImage(compressedDataUrl);
      setUploadingImage(false);
      toast.info('Gambar produk berhasil dimuat & siap disimpan!', 'Foto Terpilih');

      // 3. (Opsional di latar belakang) coba upload ke Firebase Storage dengan batas timeout 3 detik
      const uploadTask = async () => {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Firebase Storage timeout')), 3500)
          );
          const actualUpload = async () => {
            const fileName = `products/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const storageRef = ref(storage, fileName);
            await uploadBytes(storageRef, file);
            return await getDownloadURL(storageRef);
          };
          const downloadUrl = await Promise.race([actualUpload(), timeoutPromise]);
          if (downloadUrl) {
            setMainImage(downloadUrl as string);
          }
        } catch {
          // Tetap gunakan compressedDataUrl yang sudah valid
        }
      };
      uploadTask();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal memproses gambar: ' + (err.message || 'Error tidak diketahui'));
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      toast.warning('Nama produk wajib diisi.', 'Form Belum Lengkap');
      return setErrorMsg('Nama produk wajib diisi.');
    }
    if (!categoryId) {
      toast.warning('Pilih salah satu kategori produk.', 'Form Belum Lengkap');
      return setErrorMsg('Kategori produk wajib dipilih.');
    }
    if (price <= 0) {
      toast.warning('Harga jual harus lebih dari Rp 0.', 'Form Belum Lengkap');
      return setErrorMsg('Harga jual harus lebih dari Rp 0.');
    }
    if (stock < 0) {
      toast.warning('Stok awal tidak boleh negatif.', 'Form Belum Lengkap');
      return setErrorMsg('Stok awal tidak boleh bernilai negatif.');
    }

    setSubmitting(true);
    try {
      const selectedCat = categories.find((c) => c.id === categoryId);
      const res = await createProduct(
        {
          name: name.trim(),
          slug: slug.trim() || `prod-${Date.now()}`,
          sku: sku.trim().toUpperCase(),
          categoryId,
          categoryName: selectedCat?.name || 'Kategori Umum',
          description: description.trim(),
          price: Number(price),
          costPrice: Number(costPrice) || 0,
          stock: Number(stock),
          lowStockThreshold: Number(lowStockThreshold),
          unit: unit.trim() || 'pcs',
          mainImage:
            mainImage ||
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
          galleryImages: [],
          isActive,
          isPublished,
        },
        user?.uid || 'ADMIN_SYSTEM'
      );

      if (!res.success) {
        const failMsg = res.message || 'Gagal menyimpan produk.';
        setErrorMsg(failMsg);
        toast.error(failMsg, 'Penyimpanan Gagal');
      } else {
        const okMsg = `Produk "${name}" berhasil ditambahkan ke katalog toko!`;
        setSuccessMsg(okMsg);
        toast.success(okMsg, 'Produk Berhasil Dibuat!');
        setTimeout(() => {
          router.push('/admin/produk');
        }, 1200);
      }
    } catch (err: any) {
      const errTxt = err.message || 'Terjadi kesalahan sistem saat menyimpan produk.';
      setErrorMsg(errTxt);
      toast.error(errTxt, 'Kesalahan Sistem');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 sm:p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <Link
            href="/admin/produk"
            className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-[#7A7067] hover:text-[#1A1613] hover:border-[#C06A28] transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-medium text-[#1A1613]">Tambah Produk Baru</h1>
            <p className="text-xs text-[#7A7067] mt-0.5">
              Lengkapi informasi produk oleh-oleh khas Jepara untuk etalase marketplace dan kasir POS.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#991B1B] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-[#FAF0E6] border border-[#ECD9C6] text-xs text-[#C06A28] font-medium">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E8E2D8] p-6 sm:p-8 shadow-sm space-y-6">
        {/* Baris 1: Nama & Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Contoh: Horog-horog Goreng Gurih"
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] placeholder:text-[#A89F91] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">
              Slug URL (Otomatis)
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#7A7067] font-mono focus:outline-none"
            />
          </div>
        </div>

        {/* Baris 2: SKU & Kategori */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">
              SKU Unik <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="JPR-MKN-XXX"
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-mono font-medium text-[#1A1613] uppercase focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            />
            <span className="text-[10px] text-[#7A7067] mt-1 block">
              Mencegah duplikasi data inventaris fisik dan transaksi kasir.
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Baris 3: Harga Jual & Harga Modal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">
              Harga Jual (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-mono font-semibold text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">
              Harga Modal / HPP (Rp) <span className="text-[#7A7067] font-normal">(Akses Admin)</span>
            </label>
            <input
              type="number"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-mono text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            />
          </div>
        </div>

        {/* Baris 4: Stok Awal, Batas Stok Rendah & Satuan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">
              Stok Awal Fisik <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-mono font-medium text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">
              Batas Stok Rendah (Alert)
            </label>
            <input
              type="number"
              min="1"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-mono text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">
              Satuan Produk
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="bungkus, pcs, besek, kotak"
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            />
          </div>
        </div>

        {/* Baris 5: Foto Utama */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#1A1613]">
            Foto Produk (Firebase Storage / URL Relevan)
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-24 h-24 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] overflow-hidden relative shrink-0 flex items-center justify-center shadow-inner">
              {mainImage ? (
                <img src={mainImage} alt="Pratinjau" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-[#A89F91]" />
              )}
            </div>
            <div className="space-y-2.5 flex-1 w-full">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-4 py-2 bg-[#FAF7F2] hover:bg-[#FAF0E6] text-[#1A1613] hover:text-[#C06A28] text-xs font-medium rounded-xl border border-[#E8E2D8] transition flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#C06A28]" />
                  <span>Unggah Berkas Gambar</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {uploadingImage && (
                  <span className="text-xs text-[#C06A28] font-mono flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C06A28]" /> Mengunggah...
                  </span>
                )}
              </div>
              <input
                type="url"
                value={mainImage}
                onChange={(e) => setMainImage(e.target.value)}
                placeholder="Atau tempel URL gambar langsung..."
                className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] placeholder:text-[#A89F91] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Deskripsi */}
        <div>
          <label className="block text-xs font-medium text-[#1A1613] mb-1.5">
            Deskripsi Produk Khas Jepara
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan keistimewaan, bahan baku, atau nilai khas oleh-oleh Jepara ini..."
            className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] placeholder:text-[#A89F91] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
          />
        </div>

        {/* Status Publikasi & Status Aktif */}
        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#E8E2D8]">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1A1613]">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#C06A28] focus:ring-[#C06A28] border-[#E8E2D8]"
            />
            <span>Produk Aktif</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1A1613]">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded text-[#C06A28] focus:ring-[#C06A28] border-[#E8E2D8]"
            />
            <span>Publikasikan ke Marketplace Toko</span>
          </label>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E8E2D8]">
          <Link
            href="/admin/produk"
            className="px-4 py-2.5 bg-[#FAF7F2] hover:bg-white text-[#7A7067] hover:text-[#1A1613] border border-[#E8E2D8] text-xs font-medium rounded-xl transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting || uploadingImage}
            className="px-6 py-2.5 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs font-medium rounded-xl transition flex items-center gap-2 disabled:opacity-70 cursor-pointer shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Menyimpan ke Database...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>Simpan Produk</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
