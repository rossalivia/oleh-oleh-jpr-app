'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Clock,
  AlertTriangle,
  CreditCard,
  Calculator,
  Plus,
  ArrowRight,
  TrendingUp,
  Receipt,
  Store,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { STORE_IDENTITY } from '@/lib/constants';
import { formatRupiah } from '@/lib/utils';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getSalesReport } from '@/lib/services/reportService';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeProducts: 0,
    categoriesCount: 0,
    pendingPayments: 0,
    waitingVerification: 0,
    processingOrders: 0,
    todaySales: 0,
    totalTransactions: 0,
    lowStockCount: 0,
  });

  useEffect(() => {
    async function loadDashboardMetrics() {
      try {
        const [productsSnap, categoriesSnap, ordersSnap, todayReport] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'orders')),
          getSalesReport('today'),
        ]);

        let activeProd = 0;
        let lowStock = 0;
        productsSnap.forEach((doc) => {
          const data = doc.data();
          if (data.isActive) activeProd++;
          if (data.stock <= (data.lowStockThreshold || STORE_IDENTITY.defaultLowStockThreshold)) {
            lowStock++;
          }
        });

        let pendPay = 0;
        let waitVerif = 0;
        let procOrder = 0;
        ordersSnap.forEach((doc) => {
          const data = doc.data();
          if (data.orderStatus === 'PENDING_PAYMENT') pendPay++;
          if (data.orderStatus === 'WAITING_VERIFICATION') waitVerif++;
          if (data.orderStatus === 'PROCESSING' || data.orderStatus === 'PAID') procOrder++;
        });

        setStats({
          activeProducts: activeProd,
          categoriesCount: categoriesSnap.size,
          pendingPayments: pendPay,
          waitingVerification: waitVerif,
          processingOrders: procOrder,
          todaySales: todayReport.totalRevenue,
          totalTransactions: todayReport.totalTransactions,
          lowStockCount: lowStock,
        });
      } catch (err) {
        console.warn('Memuat metrics dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardMetrics();
  }, []);

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C06A28] animate-pulse"></span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#C06A28] font-bold">
              Gerai Operasional Aktif • Asia/Jakarta (WIB)
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#1A1613] tracking-tight font-semibold">
            Pusat Kendali Toko Jeha
          </h1>
          <p className="text-xs sm:text-sm text-[#5C5248] font-sans max-w-xl font-light leading-relaxed">
            {STORE_IDENTITY.name} — Pengkol, Jepara. Kelola katalog kurasi, pantau antrean verifikasi transfer, jalankan kasir gerai fisik, dan awasi mutasi inventaris.
          </p>
        </div>

        {/* Tactical Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/pos"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C06A28] hover:bg-[#A8571B] text-white font-sans text-xs font-semibold tracking-wide rounded-xl transition shadow-xs"
          >
            <Calculator className="w-4 h-4 text-white" />
            <span>Buka Kasir (PoS)</span>
          </Link>
          <Link
            href="/admin/verifikasi-pembayaran"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FAF7F2] hover:bg-white text-[#1A1613] border border-[#E8E2D8] hover:border-[#C06A28] font-sans text-xs font-semibold tracking-wide rounded-xl transition shadow-xs"
          >
            <CreditCard className="w-4 h-4 text-[#C06A28]" />
            <span>Verifikasi Slip</span>
            {stats.waitingVerification > 0 && (
              <span className="px-1.5 py-0.5 bg-[#FDF9F5] text-[#C06A28] border border-[#E8E2D8] font-mono text-[10px] font-bold rounded-md">
                {stats.waitingVerification}
              </span>
            )}
          </Link>
          <Link
            href="/admin/produk"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FAF7F2] hover:bg-white text-[#1A1613] border border-[#E8E2D8] hover:border-[#C06A28] font-sans text-xs font-semibold tracking-wide rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#1A1613]" />
            <span>Kelola Produk</span>
          </Link>
        </div>
      </div>

      {/* Ledger Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Penjualan Hari Ini */}
        <div className="border border-[#E8E2D8] bg-white rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#5C5248] font-bold">
              Penjualan Hari Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FDF9F5] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#C06A28]" />
            </div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-[#1A1613] tabular-nums">
              {loading ? '...' : formatRupiah(stats.todaySales)}
            </div>
            <p className="font-mono text-[11px] text-[#8C827A] mt-1 font-medium">
              {loading ? '...' : `${stats.totalTransactions} Transaksi Selesai`}
            </p>
          </div>
          <Link
            href="/admin/laporan"
            className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-[#C06A28] hover:text-[#A8571B] pt-2 border-t border-[#F0EBE1] transition"
          >
            <span>Buka Laporan Omzet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metric 2: Verifikasi Pembayaran */}
        <div className="border border-[#E8E2D8] bg-white rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#5C5248] font-bold">
              Verifikasi Slip Transfer
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EEF4FA] flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-[#1E3A5F]" />
            </div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-[#1A1613] tabular-nums flex items-baseline gap-2">
              <span>{loading ? '...' : stats.waitingVerification}</span>
              <span className="font-sans text-xs text-[#8C827A] font-normal">Antrean</span>
            </div>
            <p className="font-mono text-[11px] text-[#8C827A] mt-1 font-medium">
              Menunggu validasi admin 1-klik
            </p>
          </div>
          <Link
            href="/admin/verifikasi-pembayaran"
            className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-[#C06A28] hover:text-[#A8571B] pt-2 border-t border-[#F0EBE1] transition"
          >
            <span>Tinjau Bukti Transfer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metric 3: Pesanan Perlu Diproses */}
        <div className="border border-[#E8E2D8] bg-white rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#5C5248] font-bold">
              Pesanan Diproses
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#2E7D32]" />
            </div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-[#1A1613] tabular-nums flex items-baseline gap-2">
              <span>{loading ? '...' : stats.processingOrders}</span>
              <span className="font-sans text-xs text-[#8C827A] font-normal">Pesanan</span>
            </div>
            <p className="font-mono text-[11px] text-[#8C827A] mt-1 font-medium">
              Siap dikemas / menunggu kurir
            </p>
          </div>
          <Link
            href="/admin/pesanan"
            className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-[#C06A28] hover:text-[#A8571B] pt-2 border-t border-[#F0EBE1] transition"
          >
            <span>Kelola Pesanan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metric 4: Peringatan Stok Rendah */}
        <div className="border border-[#E8E2D8] bg-white rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#5C5248] font-bold">
              Stok Kritis / Rendah
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-[#C62828]" />
            </div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-[#1A1613] tabular-nums flex items-baseline gap-2">
              <span>{loading ? '...' : stats.lowStockCount}</span>
              <span className="font-sans text-xs text-[#8C827A] font-normal">Item</span>
            </div>
            <p className="font-mono text-[11px] text-[#8C827A] mt-1 font-medium">
              Mendekati ambang batas minimum
            </p>
          </div>
          <Link
            href="/admin/inventaris"
            className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-[#C06A28] hover:text-[#A8571B] pt-2 border-t border-[#F0EBE1] transition"
          >
            <span>Restock Barang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Action Queue & Catalog Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Antrean Operasional & Status Master Data */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-[#E8E2D8] bg-white rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-[#F0EBE1] flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#C06A28]" />
                <h2 className="font-display text-sm text-[#1A1613] tracking-wide font-semibold">
                  Status Katalog & Master Inventaris
                </h2>
              </div>
              <Link
                href="/admin/produk"
                className="font-mono text-[11px] text-[#C06A28] hover:text-[#A8571B] uppercase tracking-wider font-bold transition"
              >
                Lihat Seluruh Katalog →
              </Link>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl space-y-1">
                <span className="font-mono text-[11px] uppercase text-[#5C5248] tracking-wider font-bold">
                  Produk Aktif
                </span>
                <div className="font-mono text-2xl font-bold text-[#1A1613] tabular-nums">
                  {loading ? '...' : stats.activeProducts} Produk
                </div>
                <p className="font-sans text-xs text-[#5C5248] pt-1 font-light">
                  Siap tampil di etalase pelanggan & terminal kasir POS
                </p>
              </div>

              <div className="p-4 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl space-y-1">
                <span className="font-mono text-[11px] uppercase text-[#5C5248] tracking-wider font-bold">
                  Kategori Terdaftar
                </span>
                <div className="font-mono text-2xl font-bold text-[#1A1613] tabular-nums">
                  {loading ? '...' : stats.categoriesCount} Kategori
                </div>
                <p className="font-sans text-xs text-[#5C5248] pt-1 font-light">
                  Makanan khas, kain tenun Troso, kerajinan ukir Jepara
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 text-xs text-[#5C5248] leading-relaxed font-sans border-t border-[#F0EBE1] pt-4 font-light">
              Semua mutasi stok fisik (PoS) maupun pesanan online disinkronkan secara atomik via Firestore Transaction dengan garansi integritas saldo inventaris riil.
            </div>
          </div>

          {/* Quick Actions List */}
          <div className="border border-[#E8E2D8] bg-white rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="font-display text-sm text-[#1A1613] font-semibold tracking-wide">
              Akses Cepat Alur Kerja Harian
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/admin/pos"
                className="p-4 border border-[#E8E2D8] hover:border-[#C06A28] bg-[#FAF7F2] hover:bg-white rounded-xl transition group block shadow-xs"
              >
                <div className="font-mono text-[10px] uppercase text-[#5C5248] group-hover:text-[#C06A28] mb-1 font-bold">
                  Terminal Kasir
                </div>
                <div className="font-sans text-xs font-semibold text-[#1A1613] flex items-center justify-between">
                  <span>Kasir Toko (PoS)</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#8C827A] group-hover:text-[#C06A28] transition" />
                </div>
              </Link>

              <Link
                href="/admin/pesanan"
                className="p-4 border border-[#E8E2D8] hover:border-[#C06A28] bg-[#FAF7F2] hover:bg-white rounded-xl transition group block shadow-xs"
              >
                <div className="font-mono text-[10px] uppercase text-[#5C5248] group-hover:text-[#C06A28] mb-1 font-bold">
                  Pemesanan Daring
                </div>
                <div className="font-sans text-xs font-semibold text-[#1A1613] flex items-center justify-between">
                  <span>Pesanan Masuk</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#8C827A] group-hover:text-[#C06A28] transition" />
                </div>
              </Link>

              <Link
                href="/admin/transaksi"
                className="p-4 border border-[#E8E2D8] hover:border-[#C06A28] bg-[#FAF7F2] hover:bg-white rounded-xl transition group block shadow-xs"
              >
                <div className="font-mono text-[10px] uppercase text-[#5C5248] group-hover:text-[#C06A28] mb-1 font-bold">
                  Rekonsiliasi
                </div>
                <div className="font-sans text-xs font-semibold text-[#1A1613] flex items-center justify-between">
                  <span>Buku Transaksi</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#8C827A] group-hover:text-[#C06A28] transition" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Parameter Bisnis & Kebijakan Toko */}
        <div className="lg:col-span-5 border border-[#E8E2D8] bg-white rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-[#F0EBE1] bg-[#FAF7F2] flex items-center gap-2">
            <Store className="w-4 h-4 text-[#C06A28]" />
            <h2 className="font-display text-sm text-[#1A1613] tracking-wide font-semibold">
              Parameter Operasional Toko
            </h2>
          </div>

          <div className="p-6 space-y-4 text-xs font-sans">
            <div className="flex items-start justify-between py-2 border-b border-[#F0EBE1] gap-4">
              <span className="text-[#5C5248]">Batas Waktu Reservasi Stok (Timeout)</span>
              <span className="font-mono font-bold text-[#1A1613] text-right">
                {STORE_IDENTITY.orderReservationTimeoutMinutes} Menit (1 Jam)
              </span>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-[#F0EBE1] gap-4">
              <span className="text-[#5C5248]">Kanal Pemenuhan Pesanan</span>
              <span className="font-semibold text-[#1A1613] text-right">
                Pickup Toko (Bebas Ongkir) & Kurir
              </span>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-[#F0EBE1] gap-4">
              <span className="text-[#5C5248]">Metode Pembayaran Terminal Kasir</span>
              <span className="font-semibold text-[#1A1613] text-right">
                Tunai (Cash), QRIS & Transfer Bank
              </span>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-[#F0EBE1] gap-4">
              <span className="text-[#5C5248]">Verifikasi Pembayaran Daring</span>
              <span className="font-bold text-[#C06A28] text-right">
                Validasi 1-Klik Otomatis Admin
              </span>
            </div>

            <div className="flex items-start justify-between py-2 border-b border-[#F0EBE1] gap-4">
              <span className="text-[#5C5248]">Rekapitulasi Keuangan</span>
              <span className="font-semibold text-[#1A1613] text-right">
                Pencatatan Tunggal (Anti-Duplikasi)
              </span>
            </div>

            <div className="pt-2">
              <Link
                href="/admin/pengaturan"
                className="w-full py-2.5 px-4 bg-[#FAF7F2] hover:bg-white text-[#1A1613] border border-[#E8E2D8] hover:border-[#C06A28] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <span>Kelola Parameter & Pengaturan Toko</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C06A28]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
