'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Store,
  ExternalLink,
  Loader2,
  Eye,
  Check,
  X,
  ArrowRight,
  PackageCheck,
  Sparkles,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { getAllOrders, cancelOrder, updateOrderStatusAndSyncTransaction } from '@/lib/services/orderService';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function AdminPesananPage() {
  const toast = useToast();
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'PICKUP' | 'SHIPPING'>('ALL');

  // Modal Ubah Status / Resi
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('PROCESSING');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (err: any) {
      console.error(err);
      setAlert({ type: 'error', text: 'Gagal memuat daftar pesanan.' });
      toast.error('Gagal memuat daftar pesanan.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setTrackingNumber(order.shippingAddress?.trackingNumber || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    try {
      const res = await updateOrderStatusAndSyncTransaction({
        orderId: selectedOrder.id,
        newStatus,
        trackingNumber: trackingNumber.trim() || undefined,
        operatorName: profile?.displayName || user?.displayName || 'Admin Toko',
      });

      if (!res.success) {
        throw new Error(res.message || 'Gagal memperbarui status pesanan.');
      }

      const succMsg = `Status pesanan #${selectedOrder.id.slice(-6)} berhasil diperbarui ke ${newStatus}.`;
      setAlert({ type: 'success', text: succMsg });
      toast.success(succMsg, 'Status Pesanan Berubah');
      setSelectedOrder(null);
      loadOrders();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || 'Gagal memperbarui status.';
      setAlert({ type: 'error', text: errMsg });
      toast.error(errMsg, 'Gagal Memperbarui');
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm);

    const matchStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    const matchChannel =
      channelFilter === 'ALL' || o.fulfillmentMethod === channelFilter;

    return matchSearch && matchStatus && matchChannel;
  });

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C06A28]"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#C06A28] font-semibold">
              Kanal Pemesanan Marketplace Online
            </span>
          </div>
          <h1 className="font-display font-medium text-2xl text-[#1A1613] tracking-tight mt-1">
            Kelola Pesanan Pelanggan
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#7A7067] mt-0.5">
            Pantau dan proses pesanan masuk, atur nomor resi kurir, atau tandai pesanan siap diambil di gerai.
          </p>
        </div>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-xl border text-xs font-sans font-medium flex items-center justify-between ${
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

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A89F91] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari ID Pesanan, Nama, atau No HP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-sans text-[#1A1613] placeholder:text-[#A89F91] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-sans font-medium text-[#1A1613] focus:outline-none focus:border-[#C06A28]"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING_PAYMENT">Menunggu Bayar</option>
            <option value="WAITING_VERIFICATION">Menunggu Verifikasi</option>
            <option value="PAID">Sudah Dibayar</option>
            <option value="PROCESSING">Diproses / Dikemas</option>
            <option value="READY_FOR_PICKUP">Siap Ambil di Toko</option>
            <option value="SHIPPED">Dalam Pengiriman</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>

          {/* Fulfillment Filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as any)}
            className="px-3.5 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-sans font-medium text-[#1A1613] focus:outline-none focus:border-[#C06A28]"
          >
            <option value="ALL">Semua Penyerahan</option>
            <option value="PICKUP">Ambil di Gerai (Pickup)</option>
            <option value="SHIPPING">Jasa Ekspedisi (Kurir)</option>
          </select>
        </div>
      </div>

      {/* Orders Table (Desktop) & Card List (Mobile) */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E8E2D8] text-[#7A7067] font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-5">ID Pesanan</th>
                <th className="py-3.5 px-4">Waktu (WIB)</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Metode Penyerahan</th>
                <th className="py-3.5 px-4">Total Akhir</th>
                <th className="py-3.5 px-4">Status Pesanan</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#7A7067]">
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-[#C06A28] border-t-transparent rounded-full mb-2"></div>
                    <p>Memuat daftar pesanan marketplace...</p>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#7A7067]">
                    <ShoppingBag className="w-8 h-8 text-[#A89F91] mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-[#1A1613]">Tidak ada pesanan yang sesuai filter</p>
                    <p className="text-[11px] text-[#7A7067] mt-0.5">Ubah parameter pencarian atau pilih status lain.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF7F2]/60 transition">
                    <td className="py-3.5 px-5 font-mono font-medium text-[#1A1613]">
                      #{o.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4 text-[#7A7067] whitespace-nowrap font-mono text-[11px]">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-display font-medium text-[#1A1613] block">{o.customerName}</span>
                      <span className="text-[11px] text-[#7A7067] block font-mono">{o.customerPhone}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 text-[10px] font-mono font-medium rounded-full bg-[#FAF7F2] text-[#1A1613] border border-[#E8E2D8] inline-flex items-center gap-1.5">
                          {o.fulfillmentMethod === 'PICKUP' ? (
                            <>
                              <Store className="w-3 h-3 text-[#C06A28]" />
                              <span>Ambil di Gerai</span>
                            </>
                          ) : (
                            <>
                              <Truck className="w-3 h-3 text-[#2E4A62]" />
                              <span>Ekspedisi</span>
                            </>
                          )}
                        </span>
                        <span className="block text-[10px] font-mono text-[#A89F91]">
                          {o.paymentMethod === 'CASH'
                            ? '💵 Tunai di Kasir'
                            : o.paymentMethod === 'QRIS'
                            ? '📱 QRIS Online'
                            : '💳 Transfer Bank'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#1A1613] tabular-nums">
                      {formatRupiah(o.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-mono font-medium rounded-full border ${
                          o.orderStatus === 'PAID' || o.orderStatus === 'COMPLETED'
                            ? 'bg-[#F0FDF4] text-[#166534] border-[#DCFCE7]'
                            : o.orderStatus === 'CANCELLED'
                            ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FEE2E2]'
                            : o.orderStatus === 'WAITING_VERIFICATION'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : o.orderStatus === 'SHIPPED'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-[#FAF0E6] text-[#C06A28] border-[#ECD9C6]'
                        }`}
                      >
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/pesanan/${o.id}`}
                          target="_blank"
                          className="p-2 rounded-xl text-[#7A7067] hover:text-[#1A1613] hover:bg-[#FAF7F2] transition border border-[#E8E2D8]"
                          title="Buka Halaman Detail Pesanan"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openStatusModal(o)}
                          className="px-3.5 py-1.5 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs font-sans font-medium rounded-xl transition cursor-pointer shadow-xs"
                        >
                          Kelola
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List Alternative */}
        <div className="block md:hidden divide-y divide-[#E8E2D8] p-4">
          {loading ? (
            <div className="py-12 text-center text-[#7A7067] text-xs">
              <div className="inline-block animate-spin w-5 h-5 border-2 border-[#C06A28] border-t-transparent rounded-full mb-2"></div>
              <span>Memuat daftar pesanan...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-[#7A7067] text-xs">
              Tidak ada pesanan yang sesuai dengan filter.
            </div>
          ) : (
            filteredOrders.map((o) => (
              <div key={o.id} className="py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-medium text-[#1A1613] text-xs">#{o.id.slice(-8).toUpperCase()}</span>
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-mono font-medium rounded-full border ${
                      o.orderStatus === 'PAID' || o.orderStatus === 'COMPLETED'
                        ? 'bg-[#F0FDF4] text-[#166534] border-[#DCFCE7]'
                        : o.orderStatus === 'CANCELLED'
                        ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FEE2E2]'
                        : o.orderStatus === 'WAITING_VERIFICATION'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-[#FAF0E6] text-[#C06A28] border-[#ECD9C6]'
                    }`}
                  >
                    {o.orderStatus}
                  </span>
                </div>

                <div className="text-xs space-y-0.5">
                  <p className="font-display font-medium text-[#1A1613]">{o.customerName} <span className="font-mono text-[#7A7067] font-normal">({o.customerPhone})</span></p>
                  <p className="font-mono text-[11px] text-[#7A7067]">{formatDateTime(o.createdAt)}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-medium rounded-full bg-[#FAF7F2] text-[#1A1613] border border-[#E8E2D8] inline-flex items-center gap-1">
                    {o.fulfillmentMethod === 'PICKUP' ? (
                      <>
                        <Store className="w-3 h-3 text-[#C06A28]" />
                        <span>Pickup</span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-3 h-3 text-[#2E4A62]" />
                        <span>Ekspedisi</span>
                      </>
                    )}
                  </span>
                  <span className="font-mono font-semibold text-[#1A1613] text-sm tabular-nums">
                    {formatRupiah(o.totalAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D8]">
                  <Link
                    href={`/pesanan/${o.id}`}
                    target="_blank"
                    className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] text-[#1A1613] hover:bg-white text-xs font-sans font-medium rounded-xl flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat</span>
                  </Link>
                  <button
                    onClick={() => openStatusModal(o)}
                    className="px-4 py-1.5 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs font-sans font-medium rounded-xl cursor-pointer"
                  >
                    Kelola Status
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Kelola Status Pesanan */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E8E2D8] space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div>
                <h3 className="font-display font-medium text-base text-[#1A1613]">Kelola Status Pesanan</h3>
                <p className="text-xs text-[#7A7067] font-mono mt-0.5">#{selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg text-[#7A7067] hover:text-[#1A1613] hover:bg-[#FAF7F2] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">
                  Status Baru Pesanan
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl font-sans font-medium text-[#1A1613] focus:outline-none focus:border-[#C06A28]"
                >
                  <option value="PENDING_PAYMENT">PENDING_PAYMENT (Menunggu Bayar)</option>
                  <option value="WAITING_VERIFICATION">WAITING_VERIFICATION (Menunggu Verifikasi)</option>
                  <option value="PAID">PAID (Pembayaran Diterima)</option>
                  <option value="PROCESSING">PROCESSING (Sedang Dikemas)</option>
                  <option value="READY_FOR_PICKUP">READY_FOR_PICKUP (Siap Diambil di Toko)</option>
                  <option value="SHIPPED">SHIPPED (Diserahkan ke Kurir)</option>
                  <option value="COMPLETED">COMPLETED (Pesanan Selesai)</option>
                  <option value="CANCELLED">CANCELLED (Batalkan Pesanan)</option>
                </select>
              </div>

              {newStatus === 'SHIPPED' && (
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">
                    Nomor Resi Pengiriman Kurir
                  </label>
                  <input
                    type="text"
                    required
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Contoh: JNT1234567890"
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl font-mono text-[#1A1613] focus:outline-none focus:border-[#C06A28]"
                  />
                  <span className="text-[10px] text-[#7A7067] mt-1 block font-sans">
                    Nomor resi ini akan dapat dilihat langsung oleh pelanggan pada halaman pesanannya.
                  </span>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-[#FAF7F2] hover:bg-white text-[#7A7067] hover:text-[#1A1613] border border-[#E8E2D8] rounded-xl font-sans font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-[#C06A28] hover:bg-[#A8571B] text-white rounded-xl font-sans font-medium flex items-center gap-1.5 disabled:opacity-70 cursor-pointer shadow-sm"
                >
                  {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : null}
                  <span>Perbarui Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
