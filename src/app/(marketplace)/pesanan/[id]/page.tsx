'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  CreditCard,
  Store,
  Truck,
  MapPin,
  ExternalLink,
  Loader2,
  X,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Order } from '@/types';
import { getOrderById, cancelOrder } from '@/lib/services/orderService';
import { formatRupiah, formatDateTime, formatOpeningTime } from '@/lib/utils';
import { STORE_IDENTITY } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase/config';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { ProductImage } from '@/components/ui/ProductImage';

function DetailPesananContent() {
  const params = useParams();
  const { settings } = useStoreSettings();

  const orderId = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Upload Bukti Bayar State
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [senderBank, setSenderBank] = useState('BCA');
  const [senderAccountName, setSenderAccountName] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  // Pembatalan Pesanan State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Berubah pikiran / ingin memesan produk lain');
  const [cancelling, setCancelling] = useState(false);

  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);

  const loadOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  // Hitung mundur 1 jam batas bayar & reservasi
  useEffect(() => {
    if (!order || order.orderStatus !== 'PENDING_PAYMENT' || !order.expiresAt) return;

    const checkExpiry = () => {
      const now = new Date().getTime();
      const expiry = new Date(order.expiresAt!).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft(null);
        setIsExpired(true);
        cancelOrder(order.id, 'CUSTOMER', 'Batas waktu pembayaran 1 jam telah habis.');
        loadOrder();
        return true;
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ minutes, seconds });
        return false;
      }
    };

    // Eksekusi langsung saat mount/order termuat
    const isAlreadyExpired = checkExpiry();
    if (isAlreadyExpired) return;

    const interval = setInterval(() => {
      if (checkExpiry()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

  const handleCopyAccount = (accNumber: string) => {
    navigator.clipboard.writeText(accNumber);
    setCopiedBank(true);
    toast.success(`Nomor rekening ${accNumber} disalin`, 'Tersalin');
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      const err = 'Format berkas bukti transfer harus gambar (JPG, PNG, WebP).';
      setAlertMsg({ type: 'error', text: err });
      toast.error(err, 'Format Tidak Sesuai');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      const err = 'Ukuran gambar maksimal 2MB.';
      setAlertMsg({ type: 'error', text: err });
      toast.error(err, 'Ukuran Terlalu Besar');
      return;
    }

    setProofFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setPreviewUrl(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile || !order) {
      const err = 'Pilih foto slip bukti pembayaran transfer terlebih dahulu.';
      setAlertMsg({ type: 'error', text: err });
      toast.error(err, 'Bukti Diperlukan');
      return;
    }

    setUploadingProof(true);
    setAlertMsg(null);

    try {
      let downloadUrl = previewUrl;
      try {
        const storageRef = ref(storage, `payment_proofs/${order.id}_${Date.now()}`);
        const snap = await uploadBytes(storageRef, proofFile);
        downloadUrl = await getDownloadURL(snap.ref);
      } catch (uploadErr) {
        console.warn('Storage fallback data URL:', uploadErr);
      }

      const now = new Date().toISOString();
      const paymentDocId = `PAY-${order.id}`;

      await setDoc(doc(db, 'payments', paymentDocId), {
        id: paymentDocId,
        orderId: order.id,
        paymentMethod: 'BANK_TRANSFER',
        amount: order.totalAmount,
        proofImageUrl: downloadUrl,
        senderBank,
        senderAccountName: senderAccountName.trim() || order.customerName,
        uploadedAt: now,
        status: 'PENDING_VERIFICATION',
      });

      await updateDoc(doc(db, 'orders', order.id), {
        orderStatus: 'WAITING_VERIFICATION',
        paymentStatus: 'PENDING_VERIFICATION',
        updatedAt: now,
      });

      const succ = 'Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin toko.';
      setAlertMsg({ type: 'success', text: succ });
      toast.success(succ, 'Bukti Terkirim');
      loadOrder();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || 'Gagal mengunggah bukti pembayaran.';
      setAlertMsg({ type: 'error', text: errMsg });
      toast.error(errMsg, 'Gagal Mengunggah');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setCancelling(true);
    try {
      const res = await cancelOrder(order.id, 'CUSTOMER', cancelReason);
      if (!res.success) {
        const err = res.message || 'Gagal membatalkan pesanan.';
        setAlertMsg({ type: 'error', text: err });
        toast.error(err, 'Gagal');
      } else {
        const succ = 'Pesanan berhasil dibatalkan dan stok telah dikembalikan.';
        setAlertMsg({ type: 'success', text: succ });
        toast.info(succ, 'Pesanan Dibatalkan');
        setCancelModalOpen(false);
        loadOrder();
      }
    } catch (err: any) {
      const errTxt = err.message || 'Terjadi kesalahan sistem.';
      setAlertMsg({ type: 'error', text: errTxt });
      toast.error(errTxt, 'Kesalahan Sistem');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-[#1A1613]">
        <Loader2 className="w-6 h-6 animate-spin text-[#C06A28] mb-2" />
        <p className="text-xs text-[#5C5248]">Memuat detail pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <h2 className="font-display text-xl text-[#1A1613] font-semibold">Pesanan Tidak Ditemukan</h2>
        <Link
          href="/pesanan"
          className="inline-block px-5 py-2.5 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs uppercase tracking-wider font-semibold rounded-xl shadow-xs transition"
        >
          Kembali ke Riwayat Pesanan
        </Link>
      </div>
    );
  }

  const isPending = order.orderStatus === 'PENDING_PAYMENT';
  const isWaitingVerif = order.orderStatus === 'WAITING_VERIFICATION';
  const isPaid = order.orderStatus === 'PAID' || order.orderStatus === 'PROCESSING';
  const isCompleted = order.orderStatus === 'COMPLETED';
  const isCancelled = order.orderStatus === 'CANCELLED';
  const isRejected = order.paymentStatus === 'REJECTED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/pesanan"
            className="p-2.5 border border-[#E8E2D8] bg-white rounded-xl text-[#1A1613] hover:bg-[#FAF7F2] hover:border-[#C06A28] transition-colors shadow-xs"
            aria-label="Kembali ke Riwayat Pesanan"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="font-display text-2xl text-[#1A1613] font-semibold tracking-tight">
                Pesanan #{order.id}
              </h1>
              <span className="text-xs text-[#8C827A] font-mono">• {formatDateTime(order.createdAt)}</span>
            </div>
            <p className="text-xs text-[#5C5248] mt-0.5 font-light">
              Pemesan: <span className="font-medium text-[#1A1613]">{order.customerName}</span> ({order.customerPhone})
            </p>
          </div>
        </div>

        {isPending && (
          <button
            onClick={() => setCancelModalOpen(true)}
            className="px-3.5 py-1.5 border border-red-200 text-[#C62828] hover:bg-red-50 rounded-xl text-xs font-semibold transition self-start sm:self-auto cursor-pointer shadow-xs"
          >
            Batalkan Pesanan
          </button>
        )}
      </div>

      {alertMsg && (
        <div
          className={`p-4 border rounded-2xl text-xs flex items-center justify-between shadow-xs ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50/80 text-[#2E7D32] border-emerald-200'
              : 'bg-red-50/80 text-[#C62828] border-red-200'
          }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="text-[#8C827A] hover:text-[#1A1613] font-bold p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Countdown Timer Banner / Cash Notice */}
      {isPending && order.paymentMethod === 'CASH' ? (
        <div className="bg-[#FDF9F5] text-[#1A1613] p-5 sm:p-6 border border-[#E8E2D8] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E2D8] flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-[#C06A28]" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-semibold text-sm text-[#1A1613]">Pembayaran Tunai di Kasir Gerai Fisik</h3>
              <p className="text-xs text-[#5C5248] font-light leading-relaxed">
                Pesanan Anda telah direservasi selama 60 menit. Silakan datang ke gerai Pengkol Jepara dan selesaikan pembayaran di kasir sebelum batas waktu:
              </p>
            </div>
          </div>
          <div className="border border-[#E8E2D8] rounded-xl px-5 py-2.5 text-center bg-white shadow-xs shrink-0">
            {timeLeft ? (
              <div>
                <span className="font-mono text-xl font-bold text-[#C06A28] tracking-wider tabular-nums block">
                  {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-mono text-[#8C827A] uppercase font-semibold">Sisa Reservasi</span>
              </div>
            ) : (
              <span className="text-xs text-[#C62828] font-semibold">Waktu Reservasi Habis</span>
            )}
          </div>
        </div>
      ) : isPending ? (
        <div className="bg-[#FDF9F5] text-[#1A1613] p-5 sm:p-6 border border-[#E8E2D8] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E2D8] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-[#C06A28] animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-semibold text-sm text-[#1A1613]">Selesaikan Pembayaran Transfer Bank</h3>
              <p className="text-xs text-[#5C5248] font-light leading-relaxed">
                Stok produk direservasi selama 60 menit. Harap selesaikan transfer sebelum batas waktu:
              </p>
            </div>
          </div>

          <div className="border border-[#E8E2D8] rounded-xl px-5 py-2.5 text-center bg-white shadow-xs shrink-0">
            {timeLeft ? (
              <span className="font-mono text-xl font-bold text-[#C06A28] tracking-wider tabular-nums">
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </span>
            ) : (
              <span className="text-xs text-[#C62828] font-semibold">Waktu Pembayaran Habis</span>
            )}
          </div>
        </div>
      ) : null}

      {/* Status Notice Banners */}
      {isWaitingVerif && (
        <div className="bg-[#EEF4FA] border border-[#D0E1F3] rounded-2xl p-5 text-[#1E3A5F] flex items-start gap-3 text-xs shadow-xs">
          <Clock className="w-4 h-4 text-[#1E3A5F] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Bukti Pembayaran Sedang Diverifikasi</p>
            <p className="text-[#1E3A5F]/85 mt-0.5 leading-relaxed">
              Staf gerai Jeha sedang mencocokkan mutasi rekening. Status pesanan akan otomatis diperbarui setelah disetujui.
            </p>
          </div>
        </div>
      )}

      {isPaid && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 text-[#2E7D32] flex items-start gap-3 text-xs shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Pembayaran Sah & Pesanan Sedang Diproses</p>
            <p className="text-[#2E7D32]/85 mt-0.5 leading-relaxed">
              {order.fulfillmentMethod === 'PICKUP'
                ? 'Pesanan sedang disiapkan di gerai Pengkol Jepara dan siap Anda ambil.'
                : 'Pesanan sedang dikemas aman untuk diserahkan ke jasa kurir ekspedisi.'}
            </p>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="bg-red-50/80 border border-red-200 rounded-2xl p-5 text-[#C62828] flex items-start gap-3 text-xs shadow-xs">
          <AlertCircle className="w-4 h-4 text-[#C62828] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Pesanan Dibatalkan</p>
            <p className="text-[#C62828]/85 mt-0.5 leading-relaxed">
              Alasan: {order.cancellationReason || 'Pembatalan transaksi'}. Kuantitas stok produk telah dikembalikan ke etalase gerai.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 text-[#B25E00] flex items-start gap-3 text-xs shadow-xs">
          <AlertTriangle className="w-4 h-4 text-[#B25E00] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Bukti Pembayaran Perlu Diperbaiki</p>
            <p className="mt-0.5 leading-relaxed">
              Alasan: <span className="font-semibold">{order.paymentRejectionReason || 'Nominal tidak sesuai atau gambar bukti kurang jelas.'}</span> Silakan unggah kembali slip bukti transfer yang valid.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column: Items & Fulfillment Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-[#E8E2D8] bg-white rounded-2xl p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#C06A28] font-bold border-b border-[#F0EBE1] pb-3">
              Rincian Item Dipesan
            </h2>
            <div className="divide-y divide-[#F0EBE1]">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 border border-[#E8E2D8] rounded-xl overflow-hidden shrink-0 bg-[#FAF7F2]">
                      <ProductImage
                        src={item.imageThumbnail}
                        alt={item.productName}
                        aspectRatio="square"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A1613]">{item.productName}</p>
                      <p className="text-[11px] text-[#8C827A] font-mono tabular-nums">
                        {item.quantity} {item.unit} × {formatRupiah(item.price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-[#1A1613] tabular-nums font-mono">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Subtotal & Shipping Breakdown */}
            <div className="pt-3 border-t border-[#F0EBE1] space-y-2 text-xs text-[#5C5248]">
              <div className="flex justify-between">
                <span>Subtotal Produk</span>
                <span className="font-semibold text-[#1A1613] tabular-nums font-mono">{formatRupiah(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Kirim ({order.fulfillmentMethod === 'PICKUP' ? 'Ambil di Gerai' : 'Ekspedisi'})</span>
                <span className={`font-semibold tabular-nums font-mono ${order.shippingFee === 0 ? 'text-[#2E7D32]' : 'text-[#1A1613]'}`}>
                  {order.shippingFee === 0 ? 'GRATIS' : formatRupiah(order.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-[#F0EBE1] text-sm text-[#1A1613] font-medium">
                <span>Total Tagihan</span>
                <span className="text-lg font-bold tabular-nums font-mono text-[#C06A28]">{formatRupiah(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Fulfillment Details Card */}
          <div className="border border-[#E8E2D8] bg-white rounded-2xl p-6 space-y-3 shadow-xs">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#C06A28] font-bold border-b border-[#F0EBE1] pb-3 flex items-center gap-2">
              {order.fulfillmentMethod === 'PICKUP' ? (
                <>
                  <Store className="w-3.5 h-3.5 text-[#C06A28]" />
                  <span>Pengambilan Mandiri di Gerai</span>
                </>
              ) : (
                <>
                  <Truck className="w-3.5 h-3.5 text-[#C06A28]" />
                  <span>Pengiriman Kurir Ekspedisi</span>
                </>
              )}
            </h2>

            {order.fulfillmentMethod === 'PICKUP' ? (
              <div className="space-y-2 text-xs text-[#5C5248] pt-1">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#C06A28] shrink-0 mt-0.5" />
                  <span className="text-[#1A1613] font-medium leading-relaxed">{STORE_IDENTITY.address}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#5C5248] pl-6">
                  <Clock className="w-3.5 h-3.5 text-[#C06A28] shrink-0" />
                  <span>Buka setiap hari mulai pukul {formatOpeningTime(STORE_IDENTITY.openingTime)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-xs text-[#5C5248] pt-1">
                <p><strong className="text-[#1A1613]">Penerima:</strong> {order.shippingAddress?.recipientName} ({order.shippingAddress?.phoneNumber})</p>
                <p><strong className="text-[#1A1613]">Alamat:</strong> {order.shippingAddress?.addressLine}, {order.shippingAddress?.city}</p>
                <p><strong className="text-[#1A1613]">Kurir:</strong> {order.shippingAddress?.courierName || 'J&T Express'}</p>
                {order.shippingAddress?.trackingNumber && (
                  <div className="p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl mt-2 space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] block">Nomor Resi Pengiriman:</span>
                    <span className="font-mono font-bold text-xs text-[#1A1613]">{order.shippingAddress.trackingNumber}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Payment Instructions & Proof Upload */}
        <div className="lg:col-span-5 space-y-6">
          {order.paymentMethod === 'CASH' ? (
            <div className="border border-[#E8E2D8] bg-white rounded-2xl p-6 space-y-4 shadow-xs">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#C06A28] font-bold border-b border-[#F0EBE1] pb-3 flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-[#C06A28]" />
                <span>Pembayaran Tunai di Kasir Toko</span>
              </h2>

              <p className="text-xs text-[#5C5248] leading-relaxed font-light">
                Metode penyerahan barang adalah <strong className="text-[#1A1613]">Ambil di Gerai</strong> dengan pembayaran langsung tunai di kasir toko fisik.
              </p>

              <div className="border border-[#E8E2D8] rounded-xl bg-[#FAF7F2] p-4 text-center space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A]">Total Tagihan Kasir</span>
                <p className="text-2xl font-bold text-[#1A1613] font-mono tabular-nums">
                  {formatRupiah(order.totalAmount)}
                </p>
              </div>

              <div className="p-4 bg-[#FDF9F5] border border-[#E8E2D8] rounded-xl space-y-2 text-xs text-[#1A1613]">
                <p className="font-bold text-xs flex items-center gap-1.5 text-[#C06A28]">
                  <Store className="w-3.5 h-3.5" />
                  <span>Instruksi Pengambilan & Kasir:</span>
                </p>
                <p className="text-[#5C5248] leading-relaxed text-[11px]">
                  1. Datang ke gerai fisik Oleh-Oleh Khas Jepara Jeha di Pengkol, Jepara.<br />
                  2. Tunjukkan kode/ID Pesanan <strong className="text-[#1A1613]">#{order.id}</strong> kepada kasir.<br />
                  3. Lakukan pembayaran tunai di kasir gerai untuk menerima pesanan Anda.
                </p>
              </div>
            </div>
          ) : (
            <div className="border border-[#E8E2D8] bg-white rounded-2xl p-6 space-y-5 shadow-xs">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#C06A28] font-bold border-b border-[#F0EBE1] pb-3 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-[#C06A28]" />
                <span>Instruksi Transfer Bank / QRIS</span>
              </h2>

              <p className="text-xs text-[#5C5248] leading-relaxed font-light">
                Silakan lakukan transfer bank sejumlah nominal tepat berikut:
              </p>

              <div className="border border-[#E8E2D8] rounded-xl bg-[#FAF7F2] p-4 text-center space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A]">Nominal Tepat</span>
                <p className="text-2xl font-bold text-[#1A1613] font-mono tabular-nums">
                  {formatRupiah(order.totalAmount)}
                </p>
                {order.bankDestination && (
                  <span className="inline-block mt-1 text-[11px] text-[#C06A28] font-semibold">
                    Tujuan Dipilih: {order.bankDestination}
                  </span>
                )}
              </div>

              {/* Bank Account List */}
              <div className="space-y-3 pt-1">
                {settings.bankAccounts && settings.bankAccounts.length > 0 ? (
                  settings.bankAccounts.map((acc, idx) => (
                    <div key={idx} className={`p-3.5 bg-white border ${order.bankDestination?.includes(acc.bankName) ? 'border-[#C06A28] ring-1 ring-[#C06A28]/20 bg-[#FDF9F5]' : 'border-[#E8E2D8]'} rounded-xl flex items-center justify-between text-xs shadow-xs`}>
                      <div>
                        <span className="font-bold text-[#1A1613] block">{acc.bankName}</span>
                        <span className="font-mono text-sm font-semibold text-[#1A1613] block mt-0.5">{acc.accountNumber}</span>
                        <span className="text-[10px] text-[#8C827A]">a.n. {acc.accountHolder}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyAccount(acc.accountNumber)}
                        className="p-2 border border-[#E8E2D8] rounded-lg hover:border-[#C06A28] hover:bg-[#FAF7F2] transition text-[#1A1613] cursor-pointer"
                        title="Salin Nomor Rekening"
                      >
                        {copiedBank ? <Check className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5 text-[#C06A28]" />}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 bg-white border border-[#E8E2D8] rounded-xl flex items-center justify-between text-xs shadow-xs">
                    <div>
                      <span className="font-bold text-[#1A1613] block">BCA (Bank Central Asia)</span>
                      <span className="font-mono text-sm font-semibold text-[#1A1613] block mt-0.5">821-098-7654</span>
                      <span className="text-[10px] text-[#8C827A]">a.n. Oleh Oleh Khas Jepara Jeha</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyAccount('8210987654')}
                      className="p-2 border border-[#E8E2D8] rounded-lg hover:border-[#C06A28] hover:bg-[#FAF7F2] transition text-[#1A1613] cursor-pointer"
                    >
                      {copiedBank ? <Check className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5 text-[#C06A28]" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Already uploaded proof preview */}
              {order.paymentProofUrl && (
                <div className="pt-3 border-t border-[#F0EBE1] space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#5C5248] font-bold block">
                    Bukti Pembayaran Terunggah:
                  </span>
                  <div className="w-full h-40 border border-[#E8E2D8] rounded-xl bg-[#FAF7F2] p-2 overflow-hidden">
                    { }
                    <img src={order.paymentProofUrl} alt="Bukti Transfer" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}

              {/* Proof Upload Form */}
              {(isPending || isRejected) && !isPaid && !isCompleted && !isCancelled && (
                <form onSubmit={handleSubmitProof} className="space-y-4 pt-4 border-t border-[#F0EBE1] text-xs">
                  <h3 className="font-bold text-[#1A1613] flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px]">
                    <Upload className="w-3.5 h-3.5 text-[#C06A28]" />
                    <span>{isRejected || order.paymentProofUrl ? 'Unggah Ulang Bukti Transfer' : 'Unggah Bukti Transfer'}</span>
                  </h3>

                  <div>
                    <label className="block text-[#1A1613] font-medium mb-1">Bank Pengirim</label>
                    <select
                      value={senderBank}
                      onChange={(e) => setSenderBank(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2]/50 border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white cursor-pointer transition"
                    >
                      <option value="BCA">BCA</option>
                      <option value="BRI">BRI</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BNI">BNI</option>
                      <option value="Bank Jateng">Bank Jateng</option>
                      <option value="QRIS">QRIS / E-Wallet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#1A1613] font-medium mb-1">Nama Pemilik Rekening Pengirim</label>
                    <input
                      type="text"
                      required
                      value={senderAccountName}
                      onChange={(e) => setSenderAccountName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2]/50 border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[#1A1613] font-medium mb-1">Foto Bukti Transfer</label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleProofChange}
                      className="w-full text-xs text-[#5C5248] file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-[#C06A28] file:text-white file:rounded-lg cursor-pointer"
                    />
                    {previewUrl && (
                      <div className="w-full h-32 border border-[#E8E2D8] rounded-xl bg-white mt-2 p-1 overflow-hidden">
                        { }
                        <img src={previewUrl} alt="Slip" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={uploadingProof || !proofFile}
                    className="w-full py-3 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {uploadingProof ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      <span>Kirim Bukti Pembayaran</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full p-6 border border-[#E8E2D8] rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <h3 className="font-display font-semibold text-base text-[#1A1613]">Konfirmasi Pembatalan</h3>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="text-[#8C827A] hover:text-[#1A1613] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5C5248] leading-relaxed">
              Apakah Anda yakin ingin membatalkan pesanan <strong className="text-[#1A1613]">#{order.id}</strong>? Stok produk yang telah direservasi akan segera dikembalikan ke etalase toko.
            </p>

            <form onSubmit={handleCancelOrder} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[#1A1613] font-medium mb-1">Alasan Pembatalan</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28]"
                >
                  <option value="Berubah pikiran / ingin memesan produk lain">Berubah pikiran / ingin memesan produk lain</option>
                  <option value="Salah memilih metode penyerahan">Salah memilih metode penyerahan</option>
                  <option value="Batas waktu transfer hampir habis">Batas waktu transfer hampir habis</option>
                  <option value="Alasan lainnya">Alasan lainnya</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F0EBE1]">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2 border border-[#E8E2D8] bg-[#FAF7F2] hover:bg-white text-[#1A1613] text-xs font-semibold rounded-xl cursor-pointer transition"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 bg-[#9B1C1C] text-white hover:bg-[#771D1D] text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  {cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DetailPesananDanPembayaranPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center p-12 text-center text-xs text-[#8C7E66]">
          Memuat detail pesanan...
        </div>
      }
    >
      <DetailPesananContent />
    </React.Suspense>
  );
}
