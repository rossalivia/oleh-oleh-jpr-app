'use client';

import React, { useEffect, useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  History,
  PlusCircle,
  MinusCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  PackageCheck,
  Sparkles,
} from 'lucide-react';
import { Product, InventoryMovement } from '@/types';
import { getProducts } from '@/lib/services/productService';
import { getInventoryMovements, adjustStockAtomic } from '@/lib/services/inventoryService';
import { formatDateTime } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { STORE_IDENTITY } from '@/lib/constants';

export default function AdminInventarisPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Adjustment Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, moves] = await Promise.all([
        getProducts(),
        getInventoryMovements(undefined, 40),
      ]);
      setProducts(prods);
      setMovements(moves);
    } catch (err: any) {
      console.error(err);
      setAlert({ type: 'error', text: 'Gagal memuat data inventaris.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdjustModal = (product: Product, type: 'ADD' | 'SUBTRACT') => {
    setSelectedProduct(product);
    setAdjustType(type);
    setAdjustQty(1);
    setAdjustReason(type === 'ADD' ? 'Restock dari perajin/supplier' : 'Barang rusak / sampling tester');
    setModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (adjustQty <= 0) {
      setAlert({ type: 'error', text: 'Kuantitas penyesuaian harus lebih dari 0.' });
      return;
    }
    if (!adjustReason.trim()) {
      setAlert({ type: 'error', text: 'Alasan mutasi stok wajib diisi untuk audit.' });
      return;
    }

    setSubmittingAdjust(true);
    const delta = adjustType === 'ADD' ? adjustQty : -adjustQty;

    try {
      const res = await adjustStockAtomic({
        productId: selectedProduct.id,
        delta,
        reason: adjustReason.trim(),
        performedBy: user?.displayName || user?.email || 'Admin Staf',
        referenceId: `ADJ-${Date.now()}`,
        type: 'MANUAL_ADJUSTMENT',
      });

      if (!res.success) {
        const failTxt = res.message || 'Gagal mengubah stok.';
        setAlert({ type: 'error', text: failTxt });
        toast.error(failTxt, 'Mutasi Stok Gagal');
      } else {
        const succTxt = `Stok "${selectedProduct.name}" berhasil disesuaikan! (Stok baru: ${res.resultingStock} ${selectedProduct.unit})`;
        setAlert({
          type: 'success',
          text: succTxt,
        });
        toast.success(succTxt, 'Stok Berhasil Disesuaikan');
        setModalOpen(false);
        loadData();
      }
    } catch (e: any) {
      const errTxt = e.message || 'Terjadi kesalahan sistem.';
      setAlert({ type: 'error', text: errTxt });
      toast.error(errTxt, 'Kesalahan Sistem');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  // Filter low stock products
  const lowStockProducts = products.filter(
    (p) => p.stock <= (p.lowStockThreshold || STORE_IDENTITY.defaultLowStockThreshold)
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C06A28]"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#C06A28] font-semibold">
              Manajemen Logistik & Pergudangan
            </span>
          </div>
          <h1 className="text-2xl font-display font-medium text-[#1A1613] tracking-tight mt-1">
            Inventaris & Mutasi Stok Fisik
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7067] mt-0.5">
            Pantau stok fisik real-time toko Jeha, kelola restock perajin, dan tinjau audit trail mutasi inventaris.
          </p>
        </div>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border ${
            alert.type === 'success'
              ? 'bg-[#FAF0E6] text-[#C06A28] border-[#ECD9C6]'
              : 'bg-[#FEF2F2] text-[#991B1B] border-[#FEE2E2]'
          }`}
        >
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)} className="text-[#7A7067] hover:text-[#1A1613] font-bold text-base">
            ×
          </button>
        </div>
      )}

      {/* Peringatan Stok Rendah (Low Stock Alert Banner) */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50/70 rounded-2xl border border-amber-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-amber-900 font-medium text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <span>Peringatan Kritis: {lowStockProducts.length} Produk Mencapai Batas Minimum Stok</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl p-3.5 border border-amber-200/70 flex items-center justify-between shadow-xs"
              >
                <div>
                  <p className="font-medium text-xs text-[#1A1613] truncate max-w-[170px]">{p.name}</p>
                  <p className="text-[11px] text-[#7A7067] font-mono mt-0.5">
                    Sisa: <span className="text-red-600 font-semibold">{p.stock}</span> / Min: {p.lowStockThreshold} {p.unit}
                  </p>
                </div>
                <button
                  onClick={() => openAdjustModal(p, 'ADD')}
                  className="px-3 py-1.5 bg-[#C06A28] text-white text-[11px] font-medium rounded-lg hover:bg-[#A8571B] transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-white" />
                  <span>Restock</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabel Ringkasan Stok Produk & Tombol Quick Adjust */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-display font-medium text-[#1A1613] flex items-center gap-2 uppercase tracking-wider">
            <Boxes className="w-4 h-4 text-[#C06A28]" />
            <span>Ketersediaan Stok Fisik Produk</span>
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#A89F91] absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama produk / SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] placeholder:text-[#A89F91] focus:outline-none focus:border-[#C06A28] font-medium"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E8E2D8] text-[#7A7067] font-medium uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-5">Nama Produk</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Stok Fisik</th>
                  <th className="py-3 px-4">Batas Rendah</th>
                  <th className="py-3 px-5 text-right">Penyesuaian Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]">
                {filteredProducts.map((p) => {
                  const isLow = p.stock <= (p.lowStockThreshold || STORE_IDENTITY.defaultLowStockThreshold);
                  return (
                    <tr key={p.id} className="hover:bg-[#FAF7F2]/60 transition">
                      <td className="py-3 px-5 font-medium text-[#1A1613]">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-[#7A7067] text-[11px]">{p.sku}</td>
                      <td className="py-3 px-4 text-[#7A7067]">{p.categoryName}</td>
                      <td className="py-3 px-4">
                        <span className={`font-mono font-semibold ${p.stock === 0 ? 'text-red-600' : isLow ? 'text-amber-700' : 'text-[#1A1613]'}`}>
                          {p.stock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#7A7067] font-mono">{p.lowStockThreshold} {p.unit}</td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openAdjustModal(p, 'ADD')}
                            className="py-1 px-3 bg-[#FAF0E6] hover:bg-[#F3E2D1] text-[#C06A28] border border-[#ECD9C6] font-medium text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer"
                            title="Tambah Stok (Restock)"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-[#C06A28]" />
                            <span>Tambah</span>
                          </button>
                          <button
                            onClick={() => openAdjustModal(p, 'SUBTRACT')}
                            disabled={p.stock === 0}
                            className="py-1 px-3 bg-white hover:bg-[#FAF7F2] text-[#7A7067] border border-[#E8E2D8] font-medium text-[11px] rounded-lg transition flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                            title="Kurangi Stok (Kerusakan/Koreksi)"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                            <span>Kurang</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Alternative View */}
          <div className="block md:hidden divide-y divide-[#E8E2D8] p-3">
            {filteredProducts.map((p) => {
              const isLow = p.stock <= (p.lowStockThreshold || STORE_IDENTITY.defaultLowStockThreshold);
              return (
                <div key={p.id} className="py-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-xs text-[#1A1613]">{p.name}</p>
                      <p className="text-[10px] text-[#7A7067] font-mono">{p.sku} • {p.categoryName}</p>
                    </div>
                    <span className={`font-mono font-semibold text-xs ${p.stock === 0 ? 'text-red-600' : isLow ? 'text-amber-700' : 'text-[#1A1613]'}`}>
                      {p.stock} {p.unit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#7A7067]">Min: {p.lowStockThreshold} {p.unit}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openAdjustModal(p, 'ADD')}
                        className="px-3 py-1.5 bg-[#FAF0E6] text-[#C06A28] border border-[#ECD9C6] font-medium text-[11px] rounded-lg flex items-center gap-1"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>Restock</span>
                      </button>
                      <button
                        onClick={() => openAdjustModal(p, 'SUBTRACT')}
                        disabled={p.stock === 0}
                        className="px-3 py-1.5 bg-white text-[#7A7067] border border-[#E8E2D8] font-medium text-[11px] rounded-lg flex items-center gap-1 disabled:opacity-40"
                      >
                        <MinusCircle className="w-3 h-3" />
                        <span>Kurangi</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Audit Trail: Riwayat Mutasi Stok (inventoryMovements) */}
      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-display font-medium text-[#1A1613] flex items-center gap-2 uppercase tracking-wider">
          <History className="w-4 h-4 text-[#C06A28]" />
          <span>Riwayat Mutasi Stok Terakhir (Audit Trail)</span>
        </h2>

        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E8E2D8] text-[#7A7067] font-medium uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Waktu (WIB)</th>
                  <th className="py-3 px-4">Produk / SKU</th>
                  <th className="py-3 px-4">Tipe Mutasi</th>
                  <th className="py-3 px-4">Perubahan (Delta)</th>
                  <th className="py-3 px-4">Sebelum → Sesudah</th>
                  <th className="py-3 px-4">Alasan & Referensi</th>
                  <th className="py-3 px-4">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[#7A7067]">
                      Belum ada catatan mutasi stok tercatat.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const isPositive = m.quantityDelta > 0;
                    return (
                      <tr key={m.id} className="hover:bg-[#FAF7F2]/60 transition">
                        <td className="py-2.5 px-4 text-[#7A7067] whitespace-nowrap font-mono text-[11px]">
                          {formatDateTime(m.timestamp)}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-[#1A1613]">
                          {m.productName}
                          <span className="block text-[10px] text-[#7A7067] font-mono">{m.sku}</span>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-[#FAF7F2] text-[#1A1613] border border-[#E8E2D8]">
                            {m.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          <span
                            className={`inline-flex items-center gap-0.5 font-semibold text-xs ${
                              isPositive ? 'text-[#C06A28]' : 'text-red-600'
                            }`}
                          >
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {isPositive ? `+${m.quantityDelta}` : m.quantityDelta}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#7A7067]">
                          {m.previousStock} → <span className="font-semibold text-[#1A1613]">{m.resultingStock}</span>
                        </td>
                        <td className="py-2.5 px-4 text-[#7A7067] max-w-xs">
                          <span className="font-medium text-[#1A1613]">{m.reason}</span>
                          <span className="block text-[10px] text-[#7A7067] font-mono truncate">{m.referenceId}</span>
                        </td>
                        <td className="py-2.5 px-4 text-[#7A7067]">{m.performedBy}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Alternative View */}
          <div className="block md:hidden divide-y divide-[#E8E2D8] p-3 space-y-3">
            {movements.length === 0 ? (
              <p className="text-center py-6 text-[#7A7067] text-xs">Belum ada catatan mutasi stok tercatat.</p>
            ) : (
              movements.map((m) => {
                const isPositive = m.quantityDelta > 0;
                return (
                  <div key={m.id} className="pt-3 first:pt-0 bg-white rounded-xl p-3 border border-[#E8E2D8] space-y-2 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-xs text-[#1A1613]">{m.productName}</h4>
                        <span className="text-[10px] font-mono text-[#7A7067]">{m.sku}</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-0.5 font-mono font-semibold text-xs px-2 py-0.5 rounded-full border ${
                          isPositive ? 'bg-[#FAF0E6] text-[#C06A28] border-[#ECD9C6]' : 'bg-[#FEF2F2] text-[#991B1B] border-[#FEE2E2]'
                        }`}
                      >
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {isPositive ? `+${m.quantityDelta}` : m.quantityDelta}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] bg-[#FAF7F2] rounded-lg border border-[#E8E2D8] px-2.5 py-1.5 text-[#7A7067]">
                      <span>Stok: <span className="font-mono">{m.previousStock} → <strong className="text-[#1A1613]">{m.resultingStock}</strong></span></span>
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-white border border-[#E8E2D8] text-[#1A1613]">{m.type}</span>
                    </div>

                    <div className="text-[11px] text-[#7A7067]">
                      <p className="font-medium text-[#1A1613]">{m.reason}</p>
                      {m.referenceId && <p className="text-[10px] font-mono text-[#7A7067] truncate">{m.referenceId}</p>}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#7A7067] pt-1 border-t border-[#E8E2D8]">
                      <span>{formatDateTime(m.timestamp)}</span>
                      <span>Oleh: {m.performedBy}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Quick Adjustment */}
      {modalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E8E2D8] space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div>
                <h3 className="font-display font-medium text-base text-[#1A1613]">
                  {adjustType === 'ADD' ? 'Tambah Stok (Restock)' : 'Kurangi Stok Fisik'}
                </h3>
                <p className="text-xs text-[#7A7067] font-mono mt-0.5">{selectedProduct.name} ({selectedProduct.sku})</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-[#7A7067] hover:text-[#1A1613] hover:bg-[#FAF7F2] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] p-3 text-xs flex justify-between items-center text-[#7A7067]">
              <span>Stok saat ini:</span>
              <span className="font-mono font-semibold text-sm text-[#1A1613]">{selectedProduct.stock} {selectedProduct.unit}</span>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#1A1613] mb-1.5">
                  Jumlah {adjustType === 'ADD' ? 'Penambahan' : 'Pengurangan'} ({selectedProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  max={adjustType === 'SUBTRACT' ? selectedProduct.stock : 9999}
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl font-mono font-medium text-sm text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1A1613] mb-1.5">
                  Alasan Perubahan Stok (Wajib untuk Audit)
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Contoh: Kiriman baru dari perajin Troso / Barang reject..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-[#FAF7F2] hover:bg-white text-[#7A7067] hover:text-[#1A1613] border border-[#E8E2D8] rounded-xl font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className="px-5 py-2 bg-[#C06A28] hover:bg-[#A8571B] text-white rounded-xl font-medium flex items-center gap-1.5 disabled:opacity-70 cursor-pointer shadow-sm"
                >
                  {submittingAdjust ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <PackageCheck className="w-3.5 h-3.5 text-white" />}
                  <span>Terapkan Mutasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
