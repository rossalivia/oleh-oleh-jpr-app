'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Store,
  Truck,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { getCustomerOrders } from '@/lib/services/orderService';
import { useAuth } from '@/context/AuthContext';
import { formatRupiah, formatDateTime } from '@/lib/utils';

export default function RiwayatPesananPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    async function fetchOrders() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await getCustomerOrders(user.uid);
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'PROCESSING') {
      return ['PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED'].includes(o.orderStatus);
    }
    return o.orderStatus === filterStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return { label: 'Menunggu Pembayaran', style: 'text-[#C06A28] bg-[#FDF9F5] border-[#E8E2D8]' };
      case 'WAITING_VERIFICATION':
        return { label: 'Verifikasi Pembayaran', style: 'text-[#1E3A5F] bg-[#EEF4FA] border-[#D0E1F3]' };
      case 'PAID':
      case 'PROCESSING':
        return { label: 'Diproses / Dikemas', style: 'text-[#2E7D32] bg-[#F2F7F2] border-[#C8E6C9]' };
      case 'READY_FOR_PICKUP':
        return { label: 'Siap Diambil di Gerai', style: 'text-[#C06A28] bg-[#FAF0EB] border-[#ECD9D0]' };
      case 'SHIPPED':
        return { label: 'Dalam Pengiriman', style: 'text-[#1E3A5F] bg-[#EEF4FA] border-[#D0E1F3]' };
      case 'COMPLETED':
        return { label: 'Selesai', style: 'text-[#2E7D32] bg-[#F2F7F2] border-[#C8E6C9]' };
      case 'CANCELLED':
        return { label: 'Dibatalkan', style: 'text-[#C62828] bg-[#FDF2F2] border-[#FFCDD2]' };
      default:
        return { label: status, style: 'text-[#5C5248] bg-[#FAF7F2] border-[#E8E2D8]' };
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E8E2D8] pb-5">
        <div className="space-y-1">
          <span className="text-[11px] font-mono tracking-widest uppercase text-[#C06A28] block font-bold">
            Aktivitas Pembelian
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-[#1A1613] font-semibold tracking-tight">
            Riwayat Pesanan
          </h1>
          <p className="text-xs text-[#5C5248] font-light">
            Lacak status pembayaran, penyiapan produk di gerai, dan pengiriman oleh-oleh Anda.
          </p>
        </div>
        <Link
          href="/katalog"
          className="text-xs uppercase tracking-wider text-[#C06A28] hover:text-[#A8571B] font-semibold inline-flex items-center gap-1.5 transition"
        >
          <span>Pilih Produk Lain</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E8E2D8] scrollbar-none">
        {[
          { key: 'ALL', label: 'Semua Pesanan' },
          { key: 'PENDING_PAYMENT', label: 'Menunggu Bayar' },
          { key: 'WAITING_VERIFICATION', label: 'Verifikasi' },
          { key: 'PROCESSING', label: 'Diproses' },
          { key: 'COMPLETED', label: 'Selesai' },
        ].map((tab) => {
          const active = filterStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all rounded-lg cursor-pointer ${
                active ? 'bg-[#C06A28] text-white shadow-xs' : 'text-[#5C5248] hover:text-[#1A1613] hover:bg-[#FAF7F2]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[#8C827A] flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#C06A28]" />
          <span>Memuat riwayat pesanan...</span>
        </div>
      ) : !user ? (
        <div className="py-20 text-center border border-[#E8E2D8] bg-white rounded-2xl p-8 space-y-4 shadow-xs">
          <p className="font-display text-lg text-[#1A1613] font-semibold">Silakan Masuk Terlebih Dahulu</p>
          <p className="text-xs text-[#5C5248] max-w-sm mx-auto font-light leading-relaxed">
            Masuk dengan akun Anda untuk melihat seluruh riwayat belanja dan status pelacakan pesanan Anda.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition"
            >
              Masuk ke Akun
            </Link>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center border border-[#E8E2D8] bg-white rounded-2xl p-8 space-y-3 shadow-xs">
          <p className="font-display text-lg text-[#1A1613] font-semibold">Belum Ada Pesanan Tercatat</p>
          <p className="text-xs text-[#5C5248] font-light leading-relaxed">
            Anda belum memiliki riwayat pesanan pada filter ini.
          </p>
          <div className="pt-2">
            <Link
              href="/katalog"
              className="inline-block px-5 py-2.5 border border-[#C06A28] text-[#C06A28] text-xs uppercase tracking-wider font-semibold hover:bg-[#FDF9F5] transition-colors rounded-xl shadow-xs"
            >
              Mulai Belanja di Katalog
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => {
            const badge = getStatusBadge(o.orderStatus);
            return (
              <div
                key={o.id}
                className="border border-[#E8E2D8] bg-white rounded-2xl p-5 sm:p-6 space-y-4 hover:border-[#C06A28] transition-all shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0EBE1] pb-4">
                  <div className="space-y-0.5">
                    <span className="font-mono text-xs font-bold text-[#1A1613]">
                      #{o.id}
                    </span>
                    <span className="text-[11px] text-[#8C827A] block font-light">
                      Dibuat pada {formatDateTime(o.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 text-[10px] font-mono tracking-wider uppercase border rounded-full font-bold ${badge.style}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-[#5C5248] flex items-center gap-1 font-mono font-medium">
                      {o.fulfillmentMethod === 'PICKUP' ? (
                        <>
                          <Store className="w-3.5 h-3.5 text-[#C06A28]" />
                          <span>Ambil di Gerai</span>
                        </>
                      ) : (
                        <>
                          <Truck className="w-3.5 h-3.5 text-[#5C5248]" />
                          <span>Kirim Ekspedisi</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="space-y-1.5 text-xs">
                  {o.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[#5C5248]">
                      <span>
                        {item.productName} <span className="text-[#8C827A] font-mono">× {item.quantity}</span>
                      </span>
                      <span className="tabular-nums font-mono text-[#1A1613] font-medium">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#F0EBE1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-[#8C827A] block font-medium">Total Pembayaran</span>
                    <span className="font-bold text-base text-[#1A1613] tabular-nums">
                      {formatRupiah(o.totalAmount)}
                    </span>
                  </div>

                  <Link
                    href={`/pesanan/${o.id}`}
                    className="px-4 py-2 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs uppercase tracking-wider font-semibold transition-colors inline-flex items-center gap-1.5 self-end sm:self-auto rounded-xl shadow-xs"
                  >
                    <span>Rincian Pesanan</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
