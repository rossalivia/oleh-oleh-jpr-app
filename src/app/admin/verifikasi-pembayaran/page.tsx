'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { PaymentProof, Order } from '@/types';
import { getAllPayments, approvePayment, rejectPayment } from '@/lib/services/paymentService';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function AdminVerifikasiPembayaranPage() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [payments, setPayments] = useState<Array<PaymentProof & { order?: Order }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ALL'>('PENDING');

  // Modal Image Preview State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Modal Tolak Pembayaran
  const [rejectingItem, setRejectingItem] = useState<{ paymentId: string; orderId: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Nominal transfer tidak sesuai dengan total tagihan');
  const [processingAction, setProcessingAction] = useState(false);

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllPayments();
      setPayments(data);
    } catch (err: any) {
      console.error(err);
      setAlert({ type: 'error', text: 'Gagal memuat daftar pembayaran.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (paymentId: string, orderId: string) => {
    if (!confirm('Apakah Anda yakin ingin MENYETUJUI bukti pembayaran ini? Status pesanan akan otomatis berganti ke PAID dan masuk ke laporan penjualan.')) {
      return;
    }

    setProcessingAction(true);
    try {
      const verifier = profile?.displayName || user?.displayName || 'Admin Toko';
      const res = await approvePayment(paymentId, orderId, verifier);
      if (!res.success) {
        const failTxt = res.message || 'Gagal memverifikasi pembayaran.';
        setAlert({ type: 'error', text: failTxt });
        toast.error(failTxt, 'Verifikasi Gagal');
      } else {
        const succTxt = 'Bukti transfer berhasil diverifikasi! Pesanan otomatis berstatus Lunas (PAID).';
        setAlert({ type: 'success', text: succTxt });
        toast.success(succTxt, 'Pembayaran Diverifikasi!');
        loadData();
      }
    } catch (err: any) {
      const errTxt = err.message || 'Terjadi kesalahan sistem.';
      setAlert({ type: 'error', text: errTxt });
      toast.error(errTxt, 'Kesalahan Sistem');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;

    setProcessingAction(true);
    try {
      const verifier = profile?.displayName || user?.displayName || 'Admin Toko';
      const res = await rejectPayment(
        rejectingItem.paymentId,
        rejectingItem.orderId,
        rejectionReason.trim(),
        verifier
      );

      if (!res.success) {
        const failTxt = res.message || 'Gagal menolak pembayaran.';
        setAlert({ type: 'error', text: failTxt });
        toast.error(failTxt, 'Penolakan Gagal');
      } else {
        const succTxt = 'Bukti transfer telah ditolak. Catatan alasan telah diteruskan ke pelanggan.';
        setAlert({ type: 'success', text: succTxt });
        toast.warning(succTxt, 'Bukti Transfer Ditolak');
        setRejectingItem(null);
        loadData();
      }
    } catch (err: any) {
      const errTxt = err.message || 'Terjadi kesalahan sistem.';
      setAlert({ type: 'error', text: errTxt });
      toast.error(errTxt, 'Kesalahan Sistem');
    } finally {
      setProcessingAction(false);
    }
  };

  const pendingPayments = payments.filter((p) => p.status === 'PENDING_VERIFICATION');
  const displayedPayments = activeTab === 'PENDING' ? pendingPayments : payments;

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C06A28] animate-pulse"></span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#C06A28] font-bold">
              Rekonsiliasi Transfer Bank & QRIS
            </span>
          </div>
          <h1 className="font-display text-2xl text-[#1A1613] font-semibold tracking-tight mt-1 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#C06A28]" />
            <span>Verifikasi Pembayaran Pelanggan</span>
          </h1>
          <p className="font-sans text-xs text-[#5C5248] mt-0.5 font-light">
            Tinjau bukti transfer manual bank atau QRIS yang diunggah pelanggan marketplace Jeha.
          </p>
        </div>
      </div>

      {alert && (
        <div
          className={`p-4 border rounded-2xl text-xs font-sans font-medium flex items-center justify-between shadow-xs ${
            alert.type === 'success'
              ? 'bg-emerald-50/80 text-[#2E7D32] border-emerald-200'
              : 'bg-red-50/80 text-[#9B1C1C] border-red-200'
          }`}
        >
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)} className="text-[#8C827A] hover:text-[#1A1613] font-bold cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-3">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 text-xs font-sans font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'PENDING'
              ? 'bg-[#1A1613] text-white shadow-xs'
              : 'bg-white text-[#5C5248] hover:text-[#1A1613] border border-[#E8E2D8]'
          }`}
        >
          <span>Perlu Verifikasi</span>
          <span className="px-1.5 py-0.5 bg-[#FDF9F5] text-[#C06A28] font-mono text-[10px] font-bold border border-[#E8E2D8] rounded-md">
            {pendingPayments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 text-xs font-sans font-semibold rounded-xl transition cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-[#1A1613] text-white shadow-xs'
              : 'bg-white text-[#5C5248] hover:text-[#1A1613] border border-[#E8E2D8]'
          }`}
        >
          <span>Semua Riwayat ({payments.length})</span>
        </button>
      </div>

      {/* Table Bukti Pembayaran (Desktop) & Card List (Mobile) */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl overflow-hidden shadow-xs">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#F0EBE1] text-[#5C5248] font-mono text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3.5 px-5">Slip Transfer</th>
                <th className="py-3.5 px-4">ID Pesanan</th>
                <th className="py-3.5 px-4">Bank & Pengirim</th>
                <th className="py-3.5 px-4">Nominal Tagihan</th>
                <th className="py-3.5 px-4">Waktu Unggah (WIB)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE1]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#5C5248]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C06A28]" />
                    <span>Memuat data bukti transfer...</span>
                  </td>
                </tr>
              ) : displayedPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#5C5248]">
                    {activeTab === 'PENDING'
                      ? 'Tidak ada bukti transfer baru yang menunggu verifikasi.'
                      : 'Belum ada riwayat pembayaran tercatat.'}
                  </td>
                </tr>
              ) : (
                displayedPayments.map((p) => {
                  const isPending = p.status === 'PENDING_VERIFICATION';
                  const isVerified = p.status === 'VERIFIED';
                  const isRejected = p.status === 'REJECTED';

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF7F2]/60 transition">
                      {/* Thumbnail slip */}
                      <td className="py-3.5 px-5">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(p.proofImageUrl)}
                          className="w-14 h-14 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl overflow-hidden relative group shrink-0 cursor-pointer block shadow-2xs"
                          title="Klik untuk memperbesar gambar slip"
                        >
                          <img
                            src={p.proofImageUrl}
                            alt="Slip Transfer"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <Eye className="w-4 h-4" />
                          </div>
                        </button>
                      </td>

                      {/* ID Pesanan & Nama Pelanggan */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/pesanan/${p.orderId}`}
                          target="_blank"
                          className="font-mono font-bold text-[#1A1613] hover:text-[#C06A28] inline-flex items-center gap-1 transition"
                        >
                          <span>{p.orderId}</span>
                          <ExternalLink className="w-3 h-3 text-[#8C827A]" />
                        </Link>
                        <span className="text-[11px] text-[#5C5248] block mt-0.5 font-sans font-medium">
                          {p.order?.customerName || '-'}
                        </span>
                      </td>

                      {/* Bank Pengirim & Nama Rekening */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#1A1613] block">{p.senderBank || 'BCA'}</span>
                        <span className="text-[11px] text-[#5C5248] block">
                          a.n. {p.senderAccountName || '-'}
                        </span>
                      </td>

                      {/* Nominal */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1A1613] tabular-nums">
                        {formatRupiah(p.amount)}
                      </td>

                      {/* Waktu */}
                      <td className="py-3.5 px-4 text-[#5C5248] whitespace-nowrap font-mono text-[11px]">
                        {formatDateTime(p.uploadedAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-mono font-bold border rounded-full ${
                            isVerified
                              ? 'bg-emerald-50 text-[#2E7D32] border-emerald-200'
                              : isRejected
                              ? 'bg-red-50 text-[#9B1C1C] border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isVerified ? 'Telah Disetujui' : isRejected ? 'Ditolak' : 'Menunggu'}
                        </span>
                        {p.verifiedBy && (
                          <span className="text-[10px] text-[#8C827A] block mt-0.5 font-mono">
                            Oleh: {p.verifiedBy}
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-5 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(p.id, p.orderId)}
                              disabled={processingAction}
                              className="px-3.5 py-1.5 bg-[#C06A28] hover:bg-[#A8571B] text-white font-sans font-semibold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                              title="Setujui dan konfirmasi pembayaran"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              <span>Setujui</span>
                            </button>
                            <button
                              onClick={() => setRejectingItem({ paymentId: p.id, orderId: p.orderId })}
                              disabled={processingAction}
                              className="px-3 py-1.5 bg-white hover:bg-red-50 text-[#9B1C1C] font-sans font-semibold text-xs rounded-xl transition flex items-center gap-1 border border-red-200 disabled:opacity-50 cursor-pointer shadow-xs"
                              title="Tolak bukti transfer tidak valid"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[#8C827A] text-xs font-mono font-medium">Selesai Ditinjau</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Alternative View */}
        <div className="block md:hidden divide-y divide-[#F0EBE1] p-4">
          {loading ? (
            <div className="py-12 text-center text-[#5C5248] text-xs">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C06A28]" />
              <span>Memuat data bukti transfer...</span>
            </div>
          ) : displayedPayments.length === 0 ? (
            <div className="py-12 text-center text-[#5C5248] text-xs">
              {activeTab === 'PENDING'
                ? 'Tidak ada bukti transfer baru yang menunggu verifikasi.'
                : 'Belum ada riwayat pembayaran tercatat.'}
            </div>
          ) : (
            displayedPayments.map((p) => {
              const isPending = p.status === 'PENDING_VERIFICATION';
              const isVerified = p.status === 'VERIFIED';
              const isRejected = p.status === 'REJECTED';

              return (
                <div key={p.id} className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#1A1613] text-xs">{p.orderId}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold border rounded-full ${
                        isVerified
                          ? 'bg-emerald-50 text-[#2E7D32] border-emerald-200'
                          : isRejected
                          ? 'bg-red-50 text-[#9B1C1C] border-red-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {isVerified ? 'Telah Disetujui' : isRejected ? 'Ditolak' : 'Menunggu'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPreviewImage(p.proofImageUrl)}
                      className="w-16 h-16 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl overflow-hidden relative group shrink-0"
                    >
                      <img
                        src={p.proofImageUrl}
                        alt="Slip"
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <div className="text-xs space-y-0.5 flex-1 min-w-0">
                      <p className="font-display font-semibold text-[#1A1613] truncate">Bank {p.senderBank} (a.n. {p.senderAccountName})</p>
                      <p className="font-mono font-bold text-[#1A1613] tabular-nums">{formatRupiah(p.amount)}</p>
                      <p className="font-mono text-[11px] text-[#5C5248]">{formatDateTime(p.uploadedAt)}</p>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0EBE1]">
                      <button
                        onClick={() => setRejectingItem({ paymentId: p.id, orderId: p.orderId })}
                        className="px-3.5 py-1.5 bg-white text-[#9B1C1C] text-xs font-sans font-semibold rounded-xl border border-red-200 shadow-xs"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => handleApprove(p.id, p.orderId)}
                        className="px-4 py-1.5 bg-[#C06A28] text-white text-xs font-sans font-semibold rounded-xl hover:bg-[#A8571B] shadow-xs"
                      >
                        Setujui Slip
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Zoom Preview Gambar Slip */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white max-w-xl w-full p-5 border border-[#E8E2D8] rounded-2xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <span className="font-display text-sm font-semibold text-[#1A1613]">Bukti Transfer Pelanggan</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 text-[#8C827A] hover:text-[#1A1613] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-[#FAF7F2] p-3 border border-[#E8E2D8] rounded-xl">
              { }
              <img
                src={previewImage}
                alt="Detail Bukti Transfer"
                className="max-w-full h-auto object-contain rounded-lg"
              />
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-5 py-2.5 bg-[#1A1613] text-white text-xs font-sans font-semibold rounded-xl cursor-pointer hover:bg-black shadow-xs transition"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tolak Pembayaran */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full p-6 border border-[#E8E2D8] rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <h3 className="font-display font-semibold text-base text-[#1A1613]">Tolak Bukti Transfer</h3>
              <button onClick={() => setRejectingItem(null)} className="p-1 text-[#8C827A] hover:text-[#1A1613]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#5C5248] font-bold mb-1">
                  Alasan Penolakan
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Jelaskan alasan slip ditolak agar pelanggan dapat mengunggah bukti yang benar..."
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl font-sans text-[#1A1613] focus:outline-none focus:border-[#C06A28]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#F0EBE1]">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 bg-white hover:bg-[#FAF7F2] text-[#5C5248] border border-[#E8E2D8] font-sans font-semibold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-5 py-2 bg-[#9B1C1C] hover:bg-[#771D1D] text-white font-sans font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-70 cursor-pointer shadow-xs transition"
                >
                  {processingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Tolak Bukti Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
