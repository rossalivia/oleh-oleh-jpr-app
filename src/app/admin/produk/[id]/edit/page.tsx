'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Upload, AlertCircle, Image as ImageIcon, Archive, Sparkles } from 'lucide-react';
import { Category, Product } from '@/types';
import { getCategories } from '@/lib/services/categoryService';
import { getProductById, updateProduct } from '@/lib/services/productService';
import { useAuth } from '@/context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { compressImage } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export default function EditProdukPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const { user } = useAuth();
  const toast = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [unit, setUnit] = useState('pcs');
  const [mainImage, setMainImage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPublished, setIsPublished] = useState(true);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadInitial() {
      try {
        const [cats, prod] = await Promise.all([
          getCategories(),
          getProductById(productId),
        ]);
        setCategories(cats);

        if (prod) {
          setName(prod.name ?? '');
          setSlug(prod.slug ?? '');
          setSku(prod.sku ?? '');
          setCategoryId(prod.categoryId ?? '');
          setDescription(prod.description ?? '');
          setPrice(prod.price ?? 0);
          setCostPrice(prod.costPrice ?? 0);
          setStock(prod.stock ?? 0);
          setLowStockThreshold(prod.lowStockThreshold ?? 5);
          setUnit(prod.unit ?? 'pcs');
          setMainImage(prod.mainImage ?? '');
          setIsActive(prod.isActive ?? true);
          setIsPublished(prod.isPublished ?? true);
        } else {
          setErrorMsg('Produk tidak ditemukan dalam sistem.');
        }
      } catch (e: any) {
        setErrorMsg(e.message || 'Gagal memuat data produk.');
      } finally {
        setLoading(false);
      }
    }
    if (productId) {
      loadInitial();
    }
  }, [productId]);

  // Upload handler via Client Compression & Instant Preview
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Format file harus berupa gambar.');
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
        const res = await fetch(compressedDataUrl);
        const blob = await res.blob();
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storageRef = ref(storage, `products/${Date.now()}_${cleanFileName}`);
        const snap = await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
        return await getDownloadURL(snap.ref);
      };

      const timeoutTask = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Storage timeout')), 3000)
      );

      Promise.race([uploadTask(), timeoutTask])
        .then((downloadUrl) => {
          if (downloadUrl) {
            setMainImage(downloadUrl);
          }
        })
        .catch(() => {
          // Jika Firebase Storage belum aktif di Firebase Console, tetap aman memakai gambar terkompresi
        });
    } catch (err: any) {
      console.error('Gagal memproses gambar:', err);
      const msg = 'Gagal memproses gambar: ' + (err.message || 'Format tidak didukung');
      setErrorMsg(msg);
      toast.error(msg, 'Gagal Unggah');
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
    if (!sku.trim()) {
      toast.warning('SKU wajib diisi.', 'Form Belum Lengkap');
      return setErrorMsg('SKU wajib diisi.');
    }
    if (price <= 0) {
      toast.warning('Harga jual harus lebih dari Rp 0.', 'Form Belum Lengkap');
      return setErrorMsg('Harga jual harus lebih dari Rp 0.');
    }
    if (stock < 0) {
      toast.warning('Stok tidak boleh negatif.', 'Form Belum Lengkap');
      return setErrorMsg('Stok tidak boleh negatif.');
    }

    setSubmitting(true);
    try {
      const selectedCat = categories.find((c) => c.id === categoryId);
      const res = await updateProduct(
        productId,
        {
          name: name.trim(),
          slug: slug.trim(),
          sku: sku.trim().toUpperCase(),
          categoryId,
          categoryName: selectedCat?.name || 'Makanan Khas Jepara',
          description: description.trim(),
          price: Number(price),
          costPrice: Number(costPrice) || 0,
          stock: Number(stock),
          lowStockThreshold: Number(lowStockThreshold),
          unit: unit.trim(),
          mainImage,
          isActive,
          isPublished,
        },
        user?.uid || 'ADMIN_USER'
      );

      if (!res.success) {
        const failMsg = res.message || 'Gagal memperbarui produk.';
        setErrorMsg(failMsg);
        toast.error(failMsg, 'Penyimpanan Gagal');
      } else {
        const okMsg = `Perubahan produk "${name}" berhasil disimpan ke sistem!`;
        setSuccessMsg(okMsg);
        toast.success(okMsg, 'Berhasil Disimpan!');
        setTimeout(() => {
          router.push('/admin/produk');
        }, 1200);
      }
    } catch (err: any) {
      const errTxt = err.message || 'Terjadi kesalahan sistem.';
      setErrorMsg(errTxt);
      toast.error(errTxt, 'Kesalahan Sistem');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center text-[#7A7067]">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-[#C06A28] border-t-transparent mb-3"></div>
        <p className="text-xs">Memuat rincian data produk...</p>
      </div>
    );
  }

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
            <h1 className="text-xl sm:text-2xl font-display font-medium text-[#1A1613]">Edit Produk: {name}</h1>
            <p className="text-xs text-[#7A7067] font-mono mt-0.5">ID: {productId} • SKU: {sku}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">Nama Produk</label>
            <input
              type="text"
              required
              value={name ?? ''}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] placeholder:text-[#A89F91] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">SKU Unik</label>
            <input
              type="text"
              required
              value={sku ?? ''}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-mono font-medium text-[#1A1613] uppercase focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">Kategori</label>
            <select
              value={categoryId ?? ''}
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
          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">Satuan</label>
            <input
              type="text"
              value={unit ?? ''}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="bungkus, pcs, kotak"
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">Harga Jual (Rp)</label>
            <input
              type="number"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-mono font-semibold text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">Harga Modal / HPP (Rp)</label>
            <input
              type="number"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-mono text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">
              Stok Fisik Tersedia
            </label>
            <input
              type="number"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-mono font-medium text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            />
            <span className="text-[10px] text-[#7A7067] mt-1 block">
              Perubahan stok manual di sini akan otomatis dicatat pada riwayat mutasi inventaris.
            </span>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#1A1613] mb-1.5">
              Batas Peringatan Stok Rendah
            </label>
            <input
              type="number"
              min="1"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-mono text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            />
          </div>
        </div>

        {/* Foto */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#1A1613]">Foto Produk</label>
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
                  <span>Ganti Berkas Gambar</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                {uploadingImage && (
                  <span className="text-xs text-[#C06A28] font-mono flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C06A28]" /> Mengunggah...
                  </span>
                )}
              </div>
              <input
                type="url"
                value={mainImage ?? ''}
                onChange={(e) => setMainImage(e.target.value)}
                placeholder="Atau tempel URL gambar..."
                className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] placeholder:text-[#A89F91] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Deskripsi */}
        <div>
          <label className="block text-xs font-medium text-[#1A1613] mb-1.5">Deskripsi</label>
          <textarea
            rows={3}
            value={description ?? ''}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] placeholder:text-[#A89F91] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
          />
        </div>

        {/* Status */}
        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#E8E2D8]">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1A1613]">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#C06A28] focus:ring-[#C06A28] border-[#E8E2D8]"
            />
            <span>Produk Aktif (Uncheck untuk mengarsipkan)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1A1613]">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded text-[#C06A28] focus:ring-[#C06A28] border-[#E8E2D8]"
            />
            <span>Tampilkan di Marketplace</span>
          </label>
        </div>

        {/* Buttons */}
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
                <span>Menyimpan Perubahan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
