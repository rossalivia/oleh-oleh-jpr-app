'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Search,
  Filter,
  Store,
  Globe,
  Clock,
  Printer,
  Eye,
  CheckCircle2,
  X,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Transaction } from '@/types';
import { getRecentTransactions } from '@/lib/services/posService';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { STORE_IDENTITY } from '@/lib/constants';

export default function RiwayatTransaksiAdminPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'POS' | 'MARKETPLACE'>('ALL');
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await getRecentTransactions(100);
      setTransactions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const filteredTrx = transactions.filter((t) => {
    const matchSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.cashierName && t.cashierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.orderId && t.orderId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchChannel = channelFilter === 'ALL' || t.channel === channelFilter;

    return matchSearch && matchChannel;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C06A28]"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#C06A28] font-semibold">
              Buku Kas & Log Transaksi Penjualan
            </span>
          </div>
          <h1 className="font-display font-medium text-2xl text-[#1A1613] tracking-tight mt-1 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#C06A28]" />
            <span>Riwayat Transaksi Toko Jeha</span>
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#7A7067] mt-0.5">
            Log lengkap seluruh transaksi fisik kasir (PoS) dan pesanan online marketplace untuk audit omzet terpusat.
          </p>
        </div>

        <span className="font-mono text-xs text-[#7A7067] bg-[#FAF7F2] px-3.5 py-1.5 rounded-xl border border-[#E8E2D8] self-start sm:self-auto shadow-xs">
          Total: <span className="font-semibold text-[#1A1613]">{transactions.length}</span> Transaksi
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A89F91] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari ID transaksi, kasir, atau order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-sans text-[#1A1613] placeholder:text-[#A89F91] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as any)}
            className="px-3.5 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-sans font-medium text-[#1A1613] focus:outline-none focus:border-[#C06A28]"
          >
            <option value="ALL">Semua Saluran (PoS + Online)</option>
            <option value="POS">Hanya Kasir Toko Fisik (PoS)</option>
            <option value="MARKETPLACE">Hanya Marketplace Online</option>
          </select>
        </div>
      </div>

      {/* Transactions Table (Desktop) & Card List (Mobile) */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E8E2D8] text-[#7A7067] font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3.5 px-5">ID Transaksi</th>
                <th className="py-3.5 px-4">Waktu (WIB)</th>
                <th className="py-3.5 px-4">Saluran Penjualan</th>
                <th className="py-3.5 px-4">Operator / Kasir</th>
                <th className="py-3.5 px-4">Metode Bayar</th>
                <th className="py-3.5 px-4">Total Belanja</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#7A7067]">
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-[#C06A28] border-t-transparent rounded-full mb-2"></div>
                    <p>Memuat log transaksi...</p>
                  </td>
                </tr>
              ) : filteredTrx.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#7A7067]">
                    <Receipt className="w-8 h-8 text-[#A89F91] mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-[#1A1613]">Tidak ada transaksi yang cocok dengan filter</p>
                  </td>
                </tr>
              ) : (
                filteredTrx.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAF7F2]/60 transition">
                    <td className="py-3.5 px-5 font-mono font-medium text-[#1A1613]">
                      #{t.id.slice(-8).toUpperCase()}
                      {t.orderId && (
                        <span className="block font-mono text-[10px] text-[#A89F91]">
                          Ref: #{t.orderId.slice(-6).toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#7A7067] whitespace-nowrap font-mono text-[11px]">
                      {formatDateTime(t.transactionTime)}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.channel === 'POS' && (t.orderId || t.fulfillmentMethod === 'PICKUP') ? (
                        <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7] inline-flex items-center gap-1.5">
                          <Store className="w-3 h-3 text-[#166534]" />
                          <span>Ambil Gerai • Tunai Kasir</span>
                        </span>
                      ) : t.channel === 'POS' ? (
                        <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-[#FAF0E6] text-[#C06A28] border border-[#ECD9C6] inline-flex items-center gap-1.5">
                          <Store className="w-3 h-3 text-[#C06A28]" />
                          <span>Kasir Gerai (PoS)</span>
                        </span>
                      ) : t.fulfillmentMethod === 'PICKUP' ? (
                        <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1.5">
                          <Store className="w-3 h-3 text-blue-700" />
                          <span>Ambil Gerai • Non-Tunai</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-[#FAF7F2] text-[#7A7067] border border-[#E8E2D8] inline-flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-[#7A7067]" />
                          <span>Marketplace Ekspedisi</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-sans font-medium text-[#1A1613]">
                      {t.cashierName || 'Sistem Otomatis'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#1A1613]">
                      <div>{t.paymentMethod}</div>
                      {t.bankDestination && (
                        <span className="block text-[10px] text-[#A89F91] truncate max-w-[140px]">
                          {t.bankDestination.split('(')[0]}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#1A1613] tabular-nums">
                      {formatRupiah(t.totalAmount)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedTrx(t)}
                        className="px-3.5 py-1.5 bg-[#FAF7F2] hover:bg-[#FAF0E6] text-[#1A1613] hover:text-[#C06A28] border border-[#E8E2D8] hover:border-[#C06A28] text-xs font-sans font-medium rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer"
                        title="Tinjau dan cetak ulang struk"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#C06A28]" />
                        <span>Struk</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-[#E8E2D8] p-4">
          {loading ? (
            <div className="py-12 text-center text-[#7A7067] text-xs">
              <div className="inline-block animate-spin w-5 h-5 border-2 border-[#C06A28] border-t-transparent rounded-full mb-2"></div>
              <span>Memuat data transaksi...</span>
            </div>
          ) : filteredTrx.length === 0 ? (
            <div className="py-12 text-center text-[#7A7067] text-xs">
              Tidak ada data transaksi.
            </div>
          ) : (
            filteredTrx.map((t) => (
              <div key={t.id} className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-medium text-[#1A1613] text-xs">#{t.id.slice(-8).toUpperCase()}</span>
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-[#FAF7F2] text-[#1A1613] border border-[#E8E2D8]">
                    {t.channel}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-mono text-[11px] text-[#7A7067]">{formatDateTime(t.transactionTime)}</span>
                  <span className="font-mono font-semibold text-[#1A1613] tabular-nums">{formatRupiah(t.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D8]">
                  <span className="font-sans text-xs text-[#7A7067]">{t.cashierName || 'Kasir'} • {t.paymentMethod}</span>
                  <button
                    onClick={() => setSelectedTrx(t)}
                    className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] hover:border-[#C06A28] text-[#1A1613] text-xs font-sans font-medium rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#C06A28]" />
                    <span>Cetak</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Preview Struk Belanja */}
      {selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#E8E2D8] space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <span className="font-mono text-xs font-medium text-[#C06A28] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Salinan Transaksi Sah
              </span>
              <button
                onClick={() => setSelectedTrx(null)}
                className="p-1 rounded-lg text-[#7A7067] hover:text-[#1A1613] hover:bg-[#FAF7F2] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Layout Struk Cetak */}
            <div id="thermal-receipt" className="p-5 bg-[#FAF7F2] rounded-xl border border-dashed border-[#E8E2D8] space-y-3 text-xs font-mono">
              <div className="text-center space-y-0.5">
                <h3 className="font-display font-medium text-sm text-[#1A1613]">{STORE_IDENTITY.name}</h3>
                <p className="text-[10px] text-[#7A7067] leading-tight">{STORE_IDENTITY.address}</p>
                <p className="text-[10px] text-[#A89F91] pt-1">
                  Saluran: {selectedTrx.channel === 'POS' ? 'Gerai Fisik (PoS)' : 'Marketplace Online'}
                </p>
                <p className="text-[10px] text-[#A89F91]">Operator: {selectedTrx.cashierName}</p>
              </div>

              <div className="border-t border-b border-dashed border-[#E8E2D8] py-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#7A7067]">No. Trx:</span>
                  <span className="font-medium text-[#1A1613]">#{selectedTrx.id.slice(-8).toUpperCase()}</span>
                </div>
                {selectedTrx.orderId && (
                  <div className="flex justify-between">
                    <span className="text-[#7A7067]">No. Order:</span>
                    <span className="text-[#1A1613]">#{selectedTrx.orderId.slice(-8).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#7A7067]">Waktu:</span>
                  <span className="text-[#1A1613]">{formatDateTime(selectedTrx.transactionTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A7067]">Metode:</span>
                  <span className="font-medium text-[#1A1613]">{selectedTrx.paymentMethod}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1 text-[11px] py-1 border-b border-dashed border-[#E8E2D8]">
                {selectedTrx.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <div>
                      <p className="font-medium text-[#1A1613]">{item.productName}</p>
                      <p className="text-[10px] text-[#A89F91]">{item.quantity} × {formatRupiah(item.price)}</p>
                    </div>
                    <span className="font-medium text-[#1A1613]">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Total & Kembalian */}
              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between font-medium text-xs text-[#1A1613]">
                  <span>TOTAL:</span>
                  <span className="font-mono">{formatRupiah(selectedTrx.totalAmount)}</span>
                </div>
                {selectedTrx.cashReceived && (
                  <>
                    <div className="flex justify-between text-[#7A7067]">
                      <span>Tunai Diterima:</span>
                      <span className="font-mono">{formatRupiah(selectedTrx.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between text-[#7A7067]">
                      <span>Kembalian:</span>
                      <span className="font-mono font-medium text-[#C06A28]">{formatRupiah(selectedTrx.cashChange || 0)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-3 text-[10px] text-[#A89F91]">
                <p>Matur Suwun Sanget Atas Kunjungan Anda!</p>
                <p className="font-medium text-[#1A1613]">Oleh-Oleh Khas Jepara Jeha</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2.5 px-4 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs font-sans font-medium rounded-xl tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Ulang (Print)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTrx(null)}
                className="py-2.5 px-4 bg-[#FAF7F2] hover:bg-white text-[#1A1613] border border-[#E8E2D8] rounded-xl text-xs font-sans font-medium transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
