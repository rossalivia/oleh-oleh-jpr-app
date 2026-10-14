'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  X,
  Search,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  FolderTree,
  Sparkles,
} from 'lucide-react';
import { Category, Product } from '@/types';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
  seedCategoriesIfEmpty,
} from '@/lib/services/categoryService';
import { getProducts } from '@/lib/services/productService';
import { useToast } from '@/context/ToastContext';
import { compressImage } from '@/lib/utils';

export default function AdminKategoriPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Modal Delete Confirmation
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([getCategories(), getProducts()]);
      setCategories(cats);
      setProducts(prods);
    } catch (e: any) {
      console.error(e);
      toast.error('Gagal memuat data kategori: ' + (e.message || ''), 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setDisplayOrder(categories.length + 1);
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name ?? '');
    setSlug(cat.slug ?? '');
    setDescription(cat.description ?? '');
    setImageUrl(cat.imageUrl ?? '');
    setDisplayOrder(cat.displayOrder ?? 1);
    setIsActive(cat.isActive ?? true);
    setShowModal(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa berkas gambar (PNG, JPG, WebP).', 'Format Tidak Didukung');
      return;
    }

    setUploadingImage(true);
    try {
      const compressed = await compressImage(file, 400, 0.85);
      setImageUrl(compressed);
      toast.success('Foto ikon kategori berhasil diproses!', 'Gambar Terunggah');
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal memproses gambar: ' + (err.message || 'Error'), 'Gagal Unggah');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const newStatus = !cat.isActive;
      await toggleCategoryActive(cat.id, newStatus);
      toast.success(
        `Kategori "${cat.name}" berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`,
        'Status Kategori Diperbarui'
      );
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mengubah status kategori: ' + (err.message || ''), 'Error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error('Nama dan slug kategori wajib diisi.', 'Form Belum Lengkap');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim() || undefined,
          displayOrder: Number(displayOrder) || 1,
          isActive,
        });
        toast.success(`Kategori "${name}" berhasil diperbarui.`, 'Kategori Diperbarui');
      } else {
        await createCategory({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim() || undefined,
          displayOrder: Number(displayOrder) || 1,
          isActive,
        });
        toast.success(`Kategori "${name}" berhasil ditambahkan.`, 'Kategori Dibuat');
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menyimpan kategori: ' + (err.message || ''), 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    const linkedCount = productCountMap[deletingCategory.id] || 0;
    if (linkedCount > 0) {
      toast.error(
        `Tidak dapat menghapus: Masih ada ${linkedCount} produk terhubung ke kategori ini. Ubah atau hapus produk terlebih dahulu.`,
        'Kategori Masih Digunakan'
      );
      setDeletingCategory(null);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteCategory(deletingCategory.id);
      toast.success(`Kategori "${deletingCategory.name}" berhasil dihapus.`, 'Kategori Dihapus');
      setDeletingCategory(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal menghapus kategori: ' + (err.message || ''), 'Gagal Hapus');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReSeed = async () => {
    setLoading(true);
    try {
      await seedCategoriesIfEmpty();
      await loadData();
      toast.success('Kategori bawaan khas Jepara berhasil dipulihkan!', 'Seed Selesai');
    } catch (err: any) {
      toast.error('Gagal memuat kategori awal: ' + (err.message || ''), 'Gagal');
    }
  };

  // Product count map
  const productCountMap = categories.reduce((acc, cat) => {
    acc[cat.id] = products.filter((p) => p.categoryId === cat.id).length;
    return acc;
  }, {} as Record<string, number>);

  // Filtered categories
  const filteredCategories = categories.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchStatus = true;
    if (statusFilter === 'active') matchStatus = c.isActive;
    if (statusFilter === 'inactive') matchStatus = !c.isActive;

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C06A28]"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#C06A28] font-semibold">
              Manajemen Taksonomi & Katalog
            </span>
          </div>
          <h1 className="font-display font-medium text-2xl text-[#1A1613] tracking-tight mt-1 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#C06A28]" />
            <span>Kategori Produk Khas Jepara</span>
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#7A7067] mt-0.5">
            Atur pengelompokan produk khas Jepara (Makanan Tradisional, Kerajinan Ukir, Tenun Troso, dsb).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleReSeed}
            className="px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] hover:bg-white hover:border-[#C06A28] text-[#1A1613] text-xs font-sans font-medium rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Pulihkan kategori bawaan jika kosong"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#C06A28]" />
            <span>Muat Data Awal</span>
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs font-sans font-medium rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A89F91] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari kategori, slug, deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-sans text-[#1A1613] placeholder:text-[#A89F91] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-[#7A7067] font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-[#C06A28]" />
            <span>Status:</span>
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-sans font-medium rounded-xl transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#C06A28] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#7A7067] hover:text-[#1A1613] border border-[#E8E2D8]'
            }`}
          >
            Semua ({categories.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3.5 py-1.5 text-xs font-sans font-medium rounded-xl transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-[#C06A28] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#7A7067] hover:text-[#1A1613] border border-[#E8E2D8]'
            }`}
          >
            Aktif ({categories.filter((c) => c.isActive).length})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3.5 py-1.5 text-xs font-sans font-medium rounded-xl transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-[#1A1613] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#7A7067] hover:text-[#1A1613] border border-[#E8E2D8]'
            }`}
          >
            Nonaktif ({categories.filter((c) => !c.isActive).length})
          </button>
        </div>
      </div>

      {/* Categories Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E8E2D8] text-[#7A7067] font-mono uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-16 text-center">Urutan</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Slug URL</th>
                <th className="py-3 px-4">Deskripsi</th>
                <th className="py-3 px-4 text-center">Jumlah Produk</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#7A7067]">
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-[#C06A28] border-t-transparent rounded-full mb-2"></div>
                    <p>Memuat data kategori...</p>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#7A7067]">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#C06A28]" />
                    <p className="font-medium text-[#1A1613]">Tidak ada kategori yang sesuai filter</p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF7F2]/60 transition">
                    <td className="py-3 px-4 font-mono font-medium text-[#7A7067] text-center">
                      <span className="w-7 h-7 bg-[#FAF7F2] rounded-lg border border-[#E8E2D8] inline-flex items-center justify-center font-medium text-xs text-[#1A1613]">
                        {c.displayOrder}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center overflow-hidden shrink-0">
                          {c.imageUrl ? (
                             
                            <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            <FolderTree className="w-5 h-5 text-[#A89F91]" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-[#1A1613]">{c.name}</div>
                          <div className="text-[10px] text-[#A89F91] font-mono">ID: {c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#7A7067]">{c.slug}</td>
                    <td className="py-3 px-4 text-[#7A7067] max-w-xs truncate">{c.description || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 text-[11px] font-mono font-medium rounded-full bg-[#FAF7F2] text-[#1A1613] border border-[#E8E2D8]">
                        {productCountMap[c.id] || 0} Produk
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-mono font-medium rounded-full transition cursor-pointer border ${
                          c.isActive
                            ? 'bg-[#FAF0E6] text-[#C06A28] border-[#ECD9C6]'
                            : 'bg-[#FAF7F2] text-[#A89F91] border-[#E8E2D8]'
                        }`}
                        title="Klik untuk mengubah status aktif"
                      >
                        {c.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{c.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg text-[#7A7067] hover:text-[#1A1613] hover:bg-[#FAF7F2] border border-[#E8E2D8] transition cursor-pointer"
                          title="Edit Kategori"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(c)}
                          className="p-1.5 rounded-lg text-[#A89F91] hover:text-red-700 hover:bg-[#FAF7F2] border border-[#E8E2D8] transition cursor-pointer"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Alternative View */}
        <div className="block md:hidden divide-y divide-[#E8E2D8] p-3 space-y-3">
          {loading ? (
            <p className="text-center py-8 text-[#7A7067] text-xs">Memuat data kategori...</p>
          ) : filteredCategories.length === 0 ? (
            <p className="text-center py-8 text-[#7A7067] text-xs">Tidak ada kategori yang cocok dengan pencarian.</p>
          ) : (
            filteredCategories.map((c) => (
              <div key={c.id} className="pt-3 first:pt-0 bg-white rounded-xl p-3 border border-[#E8E2D8] space-y-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center overflow-hidden shrink-0">
                    {c.imageUrl ? (
                       
                      <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <FolderTree className="w-5 h-5 text-[#A89F91]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-medium text-xs text-[#1A1613] truncate">{c.name}</h4>
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`px-2 py-0.5 text-[10px] font-mono font-medium shrink-0 rounded-full transition border ${
                          c.isActive
                            ? 'bg-[#FAF0E6] text-[#C06A28] border-[#ECD9C6]'
                            : 'bg-[#FAF7F2] text-[#A89F91] border-[#E8E2D8]'
                        }`}
                      >
                        {c.isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </div>
                    <span className="text-[10px] font-mono text-[#A89F91] block">{c.slug}</span>
                    {c.description && <p className="text-[11px] text-[#7A7067] line-clamp-1 mt-0.5">{c.description}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D8]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-[#FAF7F2] text-[#7A7067] border border-[#E8E2D8]">
                      Urutan: {c.displayOrder}
                    </span>
                    <span className="px-2.5 py-0.5 text-[10px] font-mono font-medium rounded bg-[#FAF7F2] text-[#1A1613] border border-[#E8E2D8]">
                      {productCountMap[c.id] || 0} Produk
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-white text-[#1A1613] border border-[#E8E2D8] transition cursor-pointer"
                      title="Edit Kategori"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingCategory(c)}
                      className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-white text-red-700 border border-[#E8E2D8] transition cursor-pointer"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E8E2D8] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <h3 className="font-display font-medium text-base text-[#1A1613] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#C06A28]" />
                <span>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-[#7A7067] hover:text-[#1A1613] hover:bg-[#FAF7F2] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">
                  Nama Kategori <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Contoh: Kerajinan Ukiran Jati"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">
                  Slug URL <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-[#1A1613] font-mono focus:outline-none focus:border-[#C06A28]"
                />
              </div>

              {/* Upload Foto / Ikon Kategori */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">Foto / Ikon Kategori</label>
                <div className="flex items-center gap-3.5 p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8]">
                  <div className="w-14 h-14 rounded-xl bg-white border border-[#E8E2D8] flex items-center justify-center overflow-hidden shrink-0 relative shadow-inner">
                    {imageUrl ? (
                       
                      <img src={imageUrl} alt="Kategori" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-[#A89F91]" />
                    )}
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1613] hover:bg-black text-white font-medium text-[11px] rounded-lg transition">
                      <Upload className="w-3 h-3 text-[#FAF7F2]" />
                      <span>{uploadingImage ? 'Mengompres...' : 'Pilih Gambar'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="ml-2 inline-flex items-center gap-1 px-2.5 py-1.5 text-red-600 hover:bg-white rounded-lg text-[11px] font-medium transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                    <span className="block text-[10px] text-[#A89F91]">JPG/PNG/WebP, otomatis dioptimalkan</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">
                  Urutan Tampil (Display Order) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-[#1A1613] focus:outline-none focus:border-[#C06A28]"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi kategori..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-[#C06A28] focus:ring-[#C06A28] cursor-pointer"
                />
                <label htmlFor="catActive" className="text-xs font-medium text-[#1A1613] cursor-pointer">
                  Kategori Aktif & Ditampilkan di Katalog Pelanggan
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#FAF7F2] hover:bg-white text-[#1A1613] border border-[#E8E2D8] rounded-xl font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-5 py-2 bg-[#C06A28] hover:bg-[#A8571B] text-white rounded-xl font-medium flex items-center gap-1.5 disabled:opacity-70 cursor-pointer shadow-sm"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E8E2D8] space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF0E6] text-[#C06A28] flex items-center justify-center mx-auto border border-[#ECD9C6]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-medium text-base text-[#1A1613]">Hapus Kategori Ini?</h3>
              <p className="text-xs text-[#7A7067] mt-1 leading-relaxed">
                Anda akan menghapus kategori <span className="font-semibold text-[#1A1613]">&quot;{deletingCategory.name}&quot;</span>.
                {productCountMap[deletingCategory.id] > 0 && (
                  <span className="block mt-1 text-red-600 font-medium">
                    Perhatian: Terdapat {productCountMap[deletingCategory.id]} produk terhubung dengan kategori ini.
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingCategory(null)}
                className="flex-1 px-4 py-2 bg-[#FAF7F2] hover:bg-white text-[#1A1613] border border-[#E8E2D8] rounded-xl text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
