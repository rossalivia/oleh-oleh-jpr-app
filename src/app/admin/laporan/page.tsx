'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Store,
  Globe,
  Receipt,
  Download,
  Calendar,
  Layers,
  Award,
  Loader2,
  DollarSign,
  ArrowUpRight,
  Truck,
  CreditCard,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { SalesReportSummary, getSalesReport, exportTransactionsToCSV } from '@/lib/services/reportService';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { STORE_IDENTITY } from '@/lib/constants';
import { useToast } from '@/context/ToastContext';

export default function LaporanPenjualanPage() {
  const toast = useToast();
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | 'all'>('30days');
  const [report, setReport] = useState<SalesReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await getSalesReport(timeRange);
      setReport(data);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat ringkasan laporan.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [timeRange]);

  const handleExportCSV = () => {
    if (!report || report.recentTransactions.length === 0) {
      toast.warning('Tidak ada data transaksi pada rentang waktu ini untuk diekspor.', 'Data Kosong');
      return;
    }
    exportTransactionsToCSV(report.recentTransactions, `laporan-omzet-jeha-${timeRange}.csv`);
    toast.success('Berkas rekap transaksi CSV berhasil diunduh ke perangkat Anda!', 'Ekspor Berhasil');
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C06A28]"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#C06A28] font-semibold">
              Rekapitulasi Keuangan & Performa Bisnis
            </span>
          </div>
          <h1 className="font-display font-medium text-2xl text-[#1A1613] tracking-tight mt-1 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#C06A28]" />
            <span>Laporan Omzet & Penjualan</span>
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#7A7067] mt-0.5">
            Pendapatan sah terealisasi dari kasir fisik gerai (langsung & pickup tunai) dan pesanan non-tunai marketplace.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={!report || report.recentTransactions.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C06A28] hover:bg-[#A8571B] text-white font-sans text-xs font-medium rounded-xl tracking-wide transition disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Berkas CSV Detail</span>
        </button>
      </div>

      {/* Filter Waktu (Time Range Pills) */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-xs text-[#7A7067] font-medium flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#C06A28]" />
          <span>Rentang Waktu Laporan:</span>
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(
            [
              { key: 'today', label: 'Hari Ini' },
              { key: '7days', label: '7 Hari Terakhir' },
              { key: '30days', label: '30 Hari Terakhir' },
              { key: 'all', label: 'Semua Periode' },
            ] as const
          ).map((r) => (
            <button
              key={r.key}
              onClick={() => setTimeRange(r.key)}
              className={`px-4 py-1.5 text-xs font-sans font-medium rounded-xl transition cursor-pointer ${
                timeRange === r.key
                  ? 'bg-[#C06A28] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#7A7067] hover:text-[#1A1613] border border-[#E8E2D8] hover:border-[#C06A28]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omzet */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-sm space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#A89F91]">
            Total Omzet Terealisasi
          </span>
          <div className="font-mono text-2xl font-semibold text-[#1A1613] tabular-nums">
            {loading ? '...' : formatRupiah(report?.totalRevenue || 0)}
          </div>
          <p className="font-sans text-xs text-[#7A7067]">
            Total kasir fisik + marketplace
          </p>
        </div>

        {/* Total Uang Kasir Gerai Fisik */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-sm space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#A89F91] flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-[#C06A28]" />
            <span>Uang Masuk Kasir Gerai</span>
          </span>
          <div className="font-mono text-2xl font-semibold text-[#1A1613] tabular-nums">
            {loading ? '...' : formatRupiah(report?.posRevenue || 0)}
          </div>
          <div className="font-sans text-[11px] text-[#7A7067] space-y-0.5">
            <p>• POS Langsung: <span className="font-medium text-[#1A1613]">{formatRupiah(report?.directPosRevenue || 0)}</span></p>
            <p>• Pickup Tunai: <span className="font-medium text-[#1A1613]">{formatRupiah(report?.pickupCashRevenue || 0)}</span></p>
          </div>
        </div>

        {/* Marketplace Non-Tunai */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-sm space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#A89F91] flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#2E4A62]" />
            <span>Marketplace Non-Tunai</span>
          </span>
          <div className="font-mono text-2xl font-semibold text-[#1A1613] tabular-nums">
            {loading ? '...' : formatRupiah(report?.marketplaceRevenue || 0)}
          </div>
          <div className="font-sans text-[11px] text-[#7A7067] space-y-0.5">
            <p>• Pickup TF/QRIS: <span className="font-medium text-[#1A1613]">{formatRupiah(report?.pickupTransferRevenue || 0)}</span></p>
            <p>• Ekspedisi TF/QRIS: <span className="font-medium text-[#1A1613]">{formatRupiah(report?.shippingTransferRevenue || 0)}</span></p>
          </div>
        </div>

        {/* Total Transaksi & Rata-rata */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-sm space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#A89F91]">
            Volume & Rata-rata Order
          </span>
          <div className="font-mono text-2xl font-semibold text-[#1A1613] tabular-nums">
            {loading ? '...' : `${report?.totalTransactions || 0} Trx`}
          </div>
          <p className="font-sans text-xs text-[#7A7067]">
            Rata-rata: <span className="font-medium text-[#1A1613]">{formatRupiah(report?.averageOrderValue || 0)}</span> / transaksi
          </p>
        </div>
      </div>

      {/* 4-Stream Breakdown: POS Direct, Pickup Cash, Pickup Transfer, Shipping Transfer */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
          <h2 className="font-display font-medium text-sm text-[#1A1613] tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#C06A28]" />
            <span>Distribusi Aliran Dana & Saluran Penjualan</span>
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#A89F91]">
            Rekonsiliasi Lengkap
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Stream 1: Direct POS */}
          <div className="p-4 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#7A7067] flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#C06A28]" />
                <span>Kasir Fisik Langsung</span>
              </span>
              <span className="text-[11px] font-mono text-[#7A7067]">{report?.directPosCount || 0} Trx</span>
            </div>
            <p className="font-mono text-xl font-bold text-[#1A1613] tabular-nums">
              {formatRupiah(report?.directPosRevenue || 0)}
            </p>
            <p className="text-[11px] text-[#7A7067] leading-tight">
              Transaksi belanja langsung di meja kasir gerai Pengkol Jepara.
            </p>
          </div>

          {/* Stream 2: Pickup Cash (Paid at Cashier) */}
          <div className="p-4 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#7A7067] flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pickup - Tunai di Kasir</span>
              </span>
              <span className="text-[11px] font-mono text-[#7A7067]">{report?.pickupCashCount || 0} Trx</span>
            </div>
            <p className="font-mono text-xl font-bold text-emerald-700 tabular-nums">
              {formatRupiah(report?.pickupCashRevenue || 0)}
            </p>
            <p className="text-[11px] text-[#7A7067] leading-tight">
              Pesanan online diambil di gerai & diserahkan tunai ke kasir toko.
            </p>
          </div>

          {/* Stream 3: Pickup Transfer / QRIS */}
          <div className="p-4 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#7A7067] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Pickup - Transfer / QRIS</span>
              </span>
              <span className="text-[11px] font-mono text-[#7A7067]">{report?.pickupTransferCount || 0} Trx</span>
            </div>
            <p className="font-mono text-xl font-bold text-blue-700 tabular-nums">
              {formatRupiah(report?.pickupTransferRevenue || 0)}
            </p>
            <p className="text-[11px] text-[#7A7067] leading-tight">
              Pesanan ambil di gerai dibayar via transfer bank / QRIS toko.
            </p>
          </div>

          {/* Stream 4: Shipping Transfer / QRIS */}
          <div className="p-4 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#7A7067] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#C06A28]" />
                <span>Ekspedisi - Transfer / QRIS</span>
              </span>
              <span className="text-[11px] font-mono text-[#7A7067]">{report?.shippingTransferCount || 0} Trx</span>
            </div>
            <p className="font-mono text-xl font-bold text-[#1A1613] tabular-nums">
              {formatRupiah(report?.shippingTransferRevenue || 0)}
            </p>
            <p className="text-[11px] text-[#7A7067] leading-tight">
              Pesanan kirim kurir ke alamat pembeli via transfer bank / QRIS.
            </p>
          </div>
        </div>
      </div>

      {/* Top Products & Channel Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Produk Paling Laris */}
        <div className="lg:col-span-6 rounded-2xl border border-[#E8E2D8] bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#E8E2D8] bg-[#FAF7F2] flex items-center justify-between">
            <h2 className="font-display font-medium text-sm text-[#1A1613] tracking-wide flex items-center gap-2">
              <Award className="w-4 h-4 text-[#C06A28]" />
              <span>Peringkat Produk Terlaris</span>
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#A89F91]">Top Penjualan</span>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="py-12 text-center text-[#7A7067] text-xs">
                <div className="inline-block animate-spin w-5 h-5 border-2 border-[#C06A28] border-t-transparent rounded-full mb-2"></div>
                <p>Memuat data produk terlaris...</p>
              </div>
            ) : !report?.topProducts || report.topProducts.length === 0 ? (
              <div className="py-12 text-center text-[#7A7067] text-xs">
                Belum ada data penjualan pada periode ini.
              </div>
            ) : (
              <div className="space-y-4">
                {report.topProducts.map((p, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-sans font-medium text-[#1A1613]">
                        {idx + 1}. {p.productName}
                      </span>
                      <span className="font-mono font-medium text-[#1A1613] tabular-nums">
                        {p.quantitySold} terjual ({formatRupiah(p.revenue)})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#FAF7F2] rounded-full border border-[#E8E2D8] overflow-hidden">
                      <div
                        className="h-full bg-[#C06A28] rounded-full"
                        style={{
                          width: `${Math.min(100, (p.quantitySold / (report.topProducts[0]?.quantitySold || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Persentase Kas vs Daring */}
        <div className="lg:col-span-6 rounded-2xl border border-[#E8E2D8] bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#E8E2D8] bg-[#FAF7F2] flex items-center justify-between">
            <h2 className="font-display font-medium text-sm text-[#1A1613] tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C06A28]" />
              <span>Persentase Aliran Kas & Bank</span>
            </h2>
          </div>

          <div className="p-6 space-y-4 text-xs font-sans">
            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-[#1A1613] flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#C06A28]" />
                  <span>Uang Kasir Fisik Gerai</span>
                </span>
                <span className="font-mono font-medium text-[#1A1613] tabular-nums">
                  {formatRupiah(report?.posRevenue || 0)}
                </span>
              </div>
              <div className="w-full h-2 bg-white rounded-full border border-[#E8E2D8] overflow-hidden">
                <div
                  className="h-full bg-[#C06A28] rounded-full"
                  style={{
                    width: `${report?.totalRevenue ? Math.round(((report?.posRevenue || 0) / report.totalRevenue) * 100) : 0}%`,
                  }}
                />
              </div>
              <p className="font-mono text-[11px] text-[#7A7067] text-right">
                {report?.totalRevenue ? Math.round(((report?.posRevenue || 0) / report.totalRevenue) * 100) : 0}% dari total omzet
              </p>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-[#1A1613] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#2E4A62]" />
                  <span>Rekening Bank / QRIS Online</span>
                </span>
                <span className="font-mono font-medium text-[#1A1613] tabular-nums">
                  {formatRupiah(report?.marketplaceRevenue || 0)}
                </span>
              </div>
              <div className="w-full h-2 bg-white rounded-full border border-[#E8E2D8] overflow-hidden">
                <div
                  className="h-full bg-[#2E4A62] rounded-full"
                  style={{
                    width: `${report?.totalRevenue ? Math.round(((report?.marketplaceRevenue || 0) / report.totalRevenue) * 100) : 0}%`,
                  }}
                />
              </div>
              <p className="font-mono text-[11px] text-[#7A7067] text-right">
                {report?.totalRevenue ? Math.round(((report?.marketplaceRevenue || 0) / report.totalRevenue) * 100) : 0}% dari total omzet
              </p>
            </div>

            <div className="pt-2 text-xs text-[#7A7067] font-sans leading-relaxed border-t border-[#E8E2D8]">
              Uang pesanan online yang diambil di gerai dengan pembayaran tunai di kasir otomatis dicatat sebagai penerimaan kas fisik gerai sehingga mutasi laci kasir gerai selalu cocok dengan uang fisik.
            </div>
          </div>
        </div>
      </div>

      {/* Riwayat Transaksi Buku Kas Terakhir */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm space-y-4 overflow-hidden">
        <div className="p-5 border-b border-[#E8E2D8] bg-[#FAF7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-medium text-sm text-[#1A1613] tracking-wide flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#C06A28]" />
              <span>Buku Kas & Riwayat Transaksi Terealisasi</span>
            </h2>
            <p className="text-xs text-[#7A7067] mt-0.5">
              Daftar transaksi yang terekam pada periode terpilih ({report?.recentTransactions.length || 0} entri).
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#A89F91]">
            Urutan: Terbaru ke Terlama
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-[#7A7067] text-xs">
              <div className="inline-block animate-spin w-5 h-5 border-2 border-[#C06A28] border-t-transparent rounded-full mb-2"></div>
              <span>Memuat buku kas transaksi...</span>
            </div>
          ) : !report?.recentTransactions || report.recentTransactions.length === 0 ? (
            <div className="py-12 text-center text-[#7A7067] text-xs">
              Tidak ada data transaksi pada periode ini.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D8] bg-[#FAF7F2] font-mono text-[10px] uppercase tracking-wider text-[#7A7067]">
                  <th className="py-3 px-5">ID Transaksi</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Kategori & Aliran Dana</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-5">Kasir / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]">
                {report.recentTransactions.slice(0, 50).map((t) => {
                  const isPickup = t.fulfillmentMethod === 'PICKUP' || (t.notes && (t.notes.includes('Pickup') || t.notes.includes('Ambil di Gerai') || t.notes.includes('Ambil di Toko')));
                  const isCash = t.paymentMethod === 'CASH';

                  let badgeColor = 'bg-[#FAF0E6] text-[#C06A28] border-[#ECD9C6]';
                  let badgeText = 'Kasir Langsung';

                  if (t.channel === 'POS' && (t.orderId || isPickup)) {
                    badgeColor = 'bg-[#F0FDF4] text-[#166534] border-[#DCFCE7]';
                    badgeText = 'Pickup • Tunai Kasir';
                  } else if (t.channel === 'MARKETPLACE' && isPickup) {
                    if (isCash) {
                      badgeColor = 'bg-[#F0FDF4] text-[#166534] border-[#DCFCE7]';
                      badgeText = 'Pickup • Tunai Kasir';
                    } else {
                      badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                      badgeText = 'Pickup • Non-Tunai';
                    }
                  } else if (t.channel === 'MARKETPLACE') {
                    badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
                    badgeText = 'Ekspedisi • Non-Tunai';
                  }

                  return (
                    <tr key={t.id} className="hover:bg-[#FAF7F2]/60 transition">
                      <td className="py-3 px-5 font-mono font-medium text-[#1A1613] whitespace-nowrap">
                        #{t.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#7A7067] whitespace-nowrap text-[11px]">
                        {formatDateTime(t.transactionTime)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-medium font-mono border rounded-full ${badgeColor}`}>
                          {badgeText}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-[#1A1613] whitespace-nowrap">
                        {t.paymentMethod}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#1A1613] whitespace-nowrap tabular-nums">
                        {formatRupiah(t.totalAmount)}
                      </td>
                      <td className="py-3 px-5 text-[#7A7067] max-w-[200px] truncate text-[11px]">
                        {t.bankDestination || t.transferReference || t.cashierName || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
