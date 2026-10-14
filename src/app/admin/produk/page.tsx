'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Archive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Product, Category } from '@/types';
import { getProducts, toggleProductActive, seedProductsIfEmpty } from '@/lib/services/productService';
import { getCategories } from '@/lib/services/categoryService';
import { formatRupiah } from '@/lib/utils';
import { STORE_IDENTITY } from '@/lib/constants';
import { useToast } from '@/context/ToastContext';

export default function AdminProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'lowStock'>('all');
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
      setProducts(prods);
      setCategories(cats);
    } catch (err: any) {
      console.error(err);
      setActionMsg({ type: 'error', text: 'Gagal memuat data produk.' });
      toast.error('Gagal memuat data produk.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleActive = async (product: Product) => {
    try {
      const newStatus = !product.isActive;
      await toggleProductActive(product.id, newStatus);
      const msg = `Produk "${product.name}" berhasil ${newStatus ? 'diaktifkan' : 'diarsipkan'}.`;
      setActionMsg({
        type: 'success',
        text: msg,
      });
      toast.success(msg, 'Status Produk Berubah');
      loadData();
    } catch (err: any) {
      const errMsg = err.message || 'Gagal mengubah status produk.';
      setActionMsg({ type: 'error', text: errMsg });
      toast.error(errMsg, 'Gagal');
    }
  };

  const handleReSeed = async () => {
    setLoading(true);
    await seedProductsIfEmpty();
    await loadData();
    const msg = 'Katalog 12 produk khas Jepara berhasil dimuat ulang!';
    setActionMsg({ type: 'success', text: msg });
    toast.success(msg, 'Produk Dimuat');
  };

  // Filter logic
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = !selectedCategory || p.categoryId === selectedCategory;

    let matchStatus = true;
    if (statusFilter === 'active') matchStatus = p.isActive;
    if (statusFilter === 'archived') matchStatus = !p.isActive;
    if (statusFilter === 'lowStock') matchStatus = p.stock <= (p.lowStockThreshold || STORE_IDENTITY.defaultLowStockThreshold);

    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-display font-medium text-[#1A1613] tracking-tight">Katalog & Master Produk</h1>
            <span className="px-3 py-1 text-xs font-mono font-medium rounded-full bg-[#FAF0E6] text-[#C06A28] border border-[#ECD9C6]">
              {products.length} SKU Terdaftar
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#7A7067] mt-1">
            Kelola master data oleh-oleh khas Jepara, harga ritel, status etalase, dan stok inventaris toko.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleReSeed}
            className="px-3.5 py-2.5 bg-[#FAF7F2] hover:bg-white border border-[#E8E2D8] hover:border-[#C06A28] text-[#1A1613] text-xs font-medium rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Muat data awal 12 produk khas Jepara jika kosong"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#C06A28]" />
            <span>Muat Data Awal</span>
          </button>
          <Link
            href="/admin/produk/tambah"
            className="px-4 py-2.5 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs font-medium rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Tambah Produk Baru</span>
          </Link>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border ${
            actionMsg.type === 'success'
              ? 'bg-[#FAF0E6] text-[#C06A28] border-[#ECD9C6]'
              : 'bg-[#FEF2F2] text-[#991B1B] border-[#FEE2E2]'
          }`}
        >
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="text-[#7A7067] hover:text-[#1A1613] font-bold text-base">
            ×
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A89F91] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama produk atau SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] placeholder:text-[#A89F91] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs focus:outline-none focus:border-[#C06A28] font-medium text-[#1A1613]"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3.5 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs focus:outline-none focus:border-[#C06A28] font-medium text-[#1A1613]"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif Saja</option>
            <option value="archived">Diarsipkan (Nonaktif)</option>
            <option value="lowStock">Stok Menipis (Peringatan)</option>
          </select>
        </div>
      </div>

      {/* Products Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E8E2D8] text-[#7A7067] font-medium uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5">Produk</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Harga Jual</th>
                <th className="py-3.5 px-4">Stok Fisik</th>
                <th className="py-3.5 px-4">Status Etalase</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#7A7067]">
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-[#C06A28] border-t-transparent rounded-full mb-2"></div>
                    <p>Memuat katalog produk khas Jepara...</p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#7A7067]">
                    <Package className="w-8 h-8 text-[#A89F91] mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-[#1A1613]">Tidak ada produk yang cocok</p>
                    <p className="text-[11px] text-[#7A7067] mt-0.5">Coba sesuaikan kata kunci pencarian atau ubah filter.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock <= (p.lowStockThreshold || STORE_IDENTITY.defaultLowStockThreshold);
                  return (
                    <tr key={p.id} className="hover:bg-[#FAF7F2]/60 transition">
                      {/* Product Name + Image */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] overflow-hidden relative shrink-0 border border-[#E8E2D8]">
                            {p.mainImage ? (
                              <img
                                src={p.mainImage}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as any).src =
                                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#A89F91] font-mono text-xs">
                                JH
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-[#1A1613] text-sm block">{p.name}</span>
                            <span className="text-[11px] text-[#7A7067] block truncate max-w-[220px]">
                              {p.description}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono text-[#7A7067] text-[11px]">
                        {p.sku}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-[#FAF7F2] text-[#7A7067] border border-[#E8E2D8] text-[11px] font-medium">
                          {p.categoryName || 'Tanpa Kategori'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#1A1613]">
                        {formatRupiah(p.price)}
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs ${p.stock === 0 ? 'text-red-600 font-bold' : isLow ? 'text-amber-700 font-bold' : 'text-[#1A1613] font-medium'}`}>
                            {p.stock} {p.unit}
                          </span>
                          {isLow && (
                            <span
                              className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1"
                              title={`Batas stok rendah: ${p.lowStockThreshold}`}
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Stok Menipis</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-mono rounded-full font-medium ${
                              p.isActive
                                ? 'bg-[#FAF0E6] text-[#C06A28] border border-[#ECD9C6]'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}
                          >
                            {p.isActive ? 'Aktif' : 'Diarsipkan'}
                          </span>
                          {p.isPublished && p.isActive && (
                            <span className="px-2.5 py-0.5 text-[10px] font-mono rounded-full bg-white text-[#1A1613] border border-[#E8E2D8]">
                              Katalog
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/produk/${p.id}/edit`}
                            className="p-2 rounded-xl hover:bg-[#FAF0E6] text-[#7A7067] hover:text-[#C06A28] transition"
                            title="Edit Data Produk"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleToggleActive(p)}
                            className="p-2 rounded-xl hover:bg-[#FAF0E6] text-[#7A7067] hover:text-[#C06A28] transition cursor-pointer"
                            title={p.isActive ? 'Arsipkan Produk (Nonaktif)' : 'Aktifkan Kembali'}
                          >
                            {p.isActive ? <Archive className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Alternative View */}
        <div className="block md:hidden divide-y divide-[#E8E2D8] p-3 space-y-3">
          {loading ? (
            <p className="text-center py-8 text-[#7A7067] text-xs">Memuat katalog produk...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center py-8 text-[#7A7067] text-xs">Tidak ada produk yang cocok dengan pencarian.</p>
          ) : (
            filteredProducts.map((p) => {
              const isLow = p.stock <= (p.lowStockThreshold || STORE_IDENTITY.defaultLowStockThreshold);
              return (
                <div key={p.id} className="pt-3 first:pt-0 bg-white rounded-xl p-3.5 border border-[#E8E2D8] space-y-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-[#FAF7F2] overflow-hidden relative shrink-0 border border-[#E8E2D8]">
                      {p.mainImage ? (
                        <img
                          src={p.mainImage}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src =
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#A89F91] font-mono text-xs">
                          JH
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-medium text-xs text-[#1A1613] truncate">{p.name}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-mono shrink-0 rounded-full border ${
                          p.isActive ? 'bg-[#FAF0E6] text-[#C06A28] border-[#ECD9C6]' : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {p.isActive ? 'Aktif' : 'Arsip'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#7A7067] block">{p.sku}</span>
                      <span className="text-[11px] text-[#7A7067] block truncate">{p.categoryName || 'Tanpa Kategori'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-[#E8E2D8]">
                    <div>
                      <span className="text-[10px] text-[#7A7067] block">Harga</span>
                      <span className="font-mono font-semibold text-xs text-[#1A1613]">{formatRupiah(p.price)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7A7067] block">Stok</span>
                      <div className="flex items-center gap-1">
                        <span className={`font-mono text-xs ${p.stock === 0 ? 'text-red-600 font-bold' : isLow ? 'text-amber-700 font-bold' : 'text-[#1A1613]'}`}>
                          {p.stock} {p.unit}
                        </span>
                        {isLow && (
                          <span className="px-1.5 py-0.5 text-[9px] font-mono rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            Rendah
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/produk/${p.id}/edit`}
                        className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#FAF0E6] text-[#7A7067] hover:text-[#C06A28] border border-[#E8E2D8] transition"
                        title="Edit Data Produk"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleToggleActive(p)}
                        className="p-2 rounded-xl bg-[#FAF7F2] hover:bg-[#FAF0E6] text-[#7A7067] hover:text-[#C06A28] border border-[#E8E2D8] transition cursor-pointer"
                        title={p.isActive ? 'Arsipkan' : 'Aktifkan'}
                      >
                        {p.isActive ? <Archive className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
