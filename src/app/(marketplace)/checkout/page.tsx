'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Store,
  Truck,
  Loader2,
  AlertCircle,
  MapPin,
  Clock,
  CheckCircle,
  CreditCard,
  Banknote,
  Upload,
  Copy,
  Check,
  QrCode,
  ImageIcon,
  X,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { createOrder } from '@/lib/services/orderService';
import { formatRupiah, formatOpeningTime, compressImage } from '@/lib/utils';
import { STORE_IDENTITY } from '@/lib/constants';
import { FulfillmentMethod } from '@/types';
import { ProductImage } from '@/components/ui/ProductImage';

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const { items, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { settings } = useStoreSettings();

  // 1. Fulfillment Method
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('PICKUP');

  // 2. Customer Contact Data
  const [customerName, setCustomerName] = useState(profile?.displayName || user?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phoneNumber || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');

  // 3. Shipping Address Form (if SHIPPING)
  const [recipientName, setRecipientName] = useState(profile?.displayName || '');
  const [shippingPhone, setShippingPhone] = useState(profile?.phoneNumber || '');
  const [city, setCity] = useState('Jepara');
  const [addressLine, setAddressLine] = useState('');
  const [courierName, setCourierName] = useState('J&T Express');

  // 4. Payment Method & Direct Proof Upload
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CASH'>('BANK_TRANSFER');
  const [selectedBankIndex, setSelectedBankIndex] = useState<number>(0);
  const [copiedBank, setCopiedBank] = useState(false);
  const [proofImage, setProofImage] = useState<string>('');
  const [compressingImage, setCompressingImage] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="font-display text-2xl text-[#1A1613] font-semibold">Keranjang Belanja Kosong</h2>
        <p className="text-xs text-[#5C5248] font-light leading-relaxed">
          Silakan tambahkan produk oleh-oleh khas Jepara sebelum melakukan checkout.
        </p>
        <Link
          href="/katalog"
          className="inline-block px-6 py-3 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs uppercase tracking-wider font-semibold rounded-xl transition shadow-xs"
        >
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const shippingFee = fulfillmentMethod === 'PICKUP' ? 0 : 15000;
  const grandTotal = subtotal + shippingFee;

  // Rekening Bank Toko (dari Pengaturan atau Default)
  const bankAccounts = settings?.bankAccounts && settings.bankAccounts.length > 0
    ? settings.bankAccounts
    : [
        {
          bankName: 'BCA (Bank Central Asia)',
          accountNumber: '2470394821',
          accountHolder: 'Oleh-Oleh Khas Jepara Jeha',
        },
        {
          bankName: 'Bank Jateng',
          accountNumber: '30081948201',
          accountHolder: 'Oleh-Oleh Khas Jepara Jeha',
        },
      ];

  const currentBank = bankAccounts[selectedBankIndex] || bankAccounts[0];

  const handleCopyAccountNumber = () => {
    if (!currentBank?.accountNumber) return;
    navigator.clipboard.writeText(currentBank.accountNumber);
    setCopiedBank(true);
    toast.success(`Nomor rekening ${currentBank.accountNumber} berhasil disalin!`, 'Salin Berhasil');
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const handleProofImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Berkas harus berupa gambar (PNG, JPG, WebP).', 'Format Tidak Didukung');
      return;
    }

    setCompressingImage(true);
    try {
      const compressed = await compressImage(file, 800, 0.8);
      setProofImage(compressed);
      toast.success('Foto bukti transfer berhasil dipilih dan siap dikonfirmasi!', 'Bukti Terlampir');
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal memproses gambar bukti transfer.', 'Gagal Unggah');
    } finally {
      setCompressingImage(false);
    }
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validasi Kontak
    if (!customerName.trim()) {
      setErrorMsg('Nama pemesan wajib diisi.');
      toast.error('Nama pemesan wajib diisi.', 'Form Belum Lengkap');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg('Nomor WhatsApp / Telepon wajib diisi untuk konfirmasi.');
      toast.error('Nomor WhatsApp / Telepon wajib diisi.', 'Form Belum Lengkap');
      return;
    }

    // Validasi Pengiriman Ekspedisi
    if (fulfillmentMethod === 'SHIPPING') {
      if (!addressLine.trim()) {
        setErrorMsg('Alamat lengkap pengiriman wajib diisi.');
        toast.error('Alamat lengkap pengiriman wajib diisi.', 'Alamat Kosong');
        return;
      }
      if (!city.trim()) {
        setErrorMsg('Kota tujuan pengiriman wajib diisi.');
        toast.error('Kota tujuan pengiriman wajib diisi.', 'Kota Kosong');
        return;
      }
    }

    setSubmitting(true);
    try {
      const orderPayload: any = {
        customerId: user?.uid || `GUEST-${Date.now()}`,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || 'tamu@oleh-oleh-jeha.com',
        customerPhone: customerPhone.trim(),
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        fulfillmentMethod,
        paymentMethod,
        bankDestination: paymentMethod === 'BANK_TRANSFER' ? currentBank.bankName : 'KASIR_GERAI',
        paymentProofUrl: paymentMethod === 'BANK_TRANSFER' && proofImage ? proofImage : undefined,
        notes: notes.trim(),
      };

      if (fulfillmentMethod === 'SHIPPING') {
        orderPayload.shippingAddress = {
          recipientName: recipientName.trim() || customerName.trim(),
          phoneNumber: shippingPhone.trim() || customerPhone.trim(),
          addressLine: addressLine.trim(),
          city: city.trim(),
          courierName,
        };
      }

      const res = await createOrder(orderPayload);

      if (!res.success || !res.orderId) {
        const err = res.message || 'Gagal memproses pesanan.';
        setErrorMsg(err);
        toast.error(err, 'Gagal Checkout');
      } else {
        clearCart();
        toast.success(`Pesanan #${res.orderId.slice(-6)} berhasil dibuat!`, 'Pesanan Diterbitkan');
        router.push(`/pesanan/${res.orderId}`);
      }
    } catch (err: any) {
      const errTxt = err.message || 'Terjadi kesalahan sistem saat checkout.';
      setErrorMsg(errTxt);
      toast.error(errTxt, 'Kesalahan Sistem');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[#E8E2D8] pb-5">
        <Link
          href="/keranjang"
          className="p-2.5 border border-[#E8E2D8] bg-white rounded-xl text-[#1A1613] hover:bg-[#FAF7F2] hover:border-[#C06A28] transition-colors cursor-pointer shadow-xs"
          aria-label="Kembali ke keranjang"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#C06A28] font-bold">
            Tahap Terakhir
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-[#1A1613] font-semibold tracking-tight">
            Checkout Pembelian
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50/80 border border-red-200 rounded-xl text-[#9B1C1C] text-xs font-medium flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleProcessCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Input Columns */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Contact Form */}
          <div className="border border-[#E8E2D8] bg-white rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#C06A28] font-bold">
                1. Identitas Pemesan
              </h2>
              <span className="text-[10px] text-[#8C827A] font-medium">Wajib diisi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#1A1613] font-medium mb-1.5">
                  Nama Lengkap <span className="text-[#C06A28]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama pemesan"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2]/50 border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] placeholder-[#8C827A] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[#1A1613] font-medium mb-1.5">
                  Nomor WhatsApp / HP <span className="text-[#C06A28]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2]/50 border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] placeholder-[#8C827A] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-[#1A1613] font-medium mb-1.5">
                Alamat Email (Untuk Tanda Terima)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="email@domain.com"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2]/50 border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] placeholder-[#8C827A] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Section 2: Fulfillment Method */}
          <div className="border border-[#E8E2D8] bg-white rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#C06A28] font-bold">
                2. Metode Penyerahan Barang
              </h2>
              <span className="text-[10px] text-[#8C827A] font-medium">Pilih opsi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pickup */}
              <button
                type="button"
                onClick={() => setFulfillmentMethod('PICKUP')}
                className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                  fulfillmentMethod === 'PICKUP'
                    ? 'border-[#C06A28] bg-[#FDF9F5] shadow-xs ring-1 ring-[#C06A28]/20'
                    : 'border-[#E8E2D8] hover:border-[#D4CBC0] bg-[#FAF7F2]/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${fulfillmentMethod === 'PICKUP' ? 'bg-[#C06A28] text-white' : 'bg-[#E8E2D8]/50 text-[#5C5248]'}`}>
                    <Store className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#2E7D32] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    Bebas Ongkir
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm text-[#1A1613]">
                    Ambil di Gerai (Store Pickup)
                  </h3>
                  <p className="text-[11px] text-[#5C5248] mt-1 leading-relaxed">
                    Diambil langsung di gerai Pengkol Jepara.
                  </p>
                </div>
              </button>

              {/* Shipping */}
              <button
                type="button"
                onClick={() => {
                  setFulfillmentMethod('SHIPPING');
                  setPaymentMethod('BANK_TRANSFER');
                }}
                className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                  fulfillmentMethod === 'SHIPPING'
                    ? 'border-[#C06A28] bg-[#FDF9F5] shadow-xs ring-1 ring-[#C06A28]/20'
                    : 'border-[#E8E2D8] hover:border-[#D4CBC0] bg-[#FAF7F2]/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${fulfillmentMethod === 'SHIPPING' ? 'bg-[#C06A28] text-white' : 'bg-[#E8E2D8]/50 text-[#5C5248]'}`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#1A1613] bg-[#E8E2D8]/60 px-2 py-0.5 rounded-full font-bold">
                    Rp 15.000
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm text-[#1A1613]">
                    Kirim Ekspedisi Kurir
                  </h3>
                  <p className="text-[11px] text-[#5C5248] mt-1 leading-relaxed">
                    Dikemas aman langsung ke alamat tujuan.
                  </p>
                </div>
              </button>
            </div>

            {/* Pickup Info */}
            {fulfillmentMethod === 'PICKUP' && (
              <div className="border border-[#E8E2D8] rounded-xl bg-[#FAF7F2] p-4 space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#C06A28] shrink-0 mt-0.5" />
                  <span className="text-[#1A1613] font-medium leading-relaxed">{STORE_IDENTITY.address}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#5C5248] pl-6">
                  <Clock className="w-3.5 h-3.5 text-[#C06A28] shrink-0" />
                  <span>Jadwal gerai: Buka mulai pukul {formatOpeningTime(STORE_IDENTITY.openingTime)}</span>
                </div>
              </div>
            )}

            {/* Shipping Form */}
            {fulfillmentMethod === 'SHIPPING' && (
              <div className="space-y-4 pt-4 border-t border-[#F0EBE1] text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#1A1613] font-medium mb-1.5">
                      Nama Penerima <span className="text-[#C06A28]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={recipientName || customerName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Nama penerima paket"
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2]/50 border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[#1A1613] font-medium mb-1.5">
                      Kota / Kabupaten <span className="text-[#C06A28]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Semarang / Kudus / Jepara..."
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2]/50 border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#1A1613] font-medium mb-1.5">
                    Alamat Lengkap (Jalan, RT/RW, Kelurahan, Kecamatan) <span className="text-[#C06A28]">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Contoh: Jl. Pemuda No. 12, RT 01/RW 02, Kel. Kauman..."
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2]/50 border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1613] font-medium mb-1.5">Layanan Ekspedisi</label>
                  <select
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2]/50 border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition cursor-pointer"
                  >
                    <option value="J&T Express">J&T Express (Tarif Standar Rp 15.000)</option>
                    <option value="JNE Regular">JNE Regular (Tarif Standar Rp 15.000)</option>
                    <option value="Pos Indonesia">Pos Indonesia (Tarif Standar Rp 15.000)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Payment Method & Transfer Proof */}
          <div className="border border-[#E8E2D8] bg-white rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
              <h2 className="text-xs font-mono uppercase tracking-widest text-[#C06A28] font-bold">
                3. Metode Pembayaran
              </h2>
              <span className="text-[10px] text-[#8C827A] font-medium">Pilih pembayaran</span>
            </div>

            <div className="space-y-3">
              {/* Opsi 1: Transfer Bank Manual / QRIS */}
              <label
                className={`p-4 border rounded-xl flex items-start gap-3.5 cursor-pointer transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-[#C06A28] bg-[#FDF9F5] shadow-xs ring-1 ring-[#C06A28]/20'
                    : 'border-[#E8E2D8] hover:border-[#D4CBC0] bg-[#FAF7F2]/30'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'BANK_TRANSFER'}
                  onChange={() => setPaymentMethod('BANK_TRANSFER')}
                  className="accent-[#C06A28] mt-1 cursor-pointer"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs sm:text-sm text-[#1A1613] flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#C06A28]" />
                      <span>Transfer Bank Manual / QRIS Toko</span>
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#C06A28] font-bold bg-[#FDF9F5] px-2 py-0.5 border border-[#E8E2D8] rounded-md">
                      Daring
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C5248] leading-relaxed">
                    Transfer ke rekening resmi toko (BCA / Bank Jateng) atau scan QRIS. Bukti transfer dapat diunggah langsung di bawah.
                  </p>
                </div>
              </label>

              {/* Opsi 2: Bayar Tunai di Kasir Gerai (Khusus Ambil di Toko) */}
              {fulfillmentMethod === 'PICKUP' ? (
                <label
                  className={`p-4 border rounded-xl flex items-start gap-3.5 cursor-pointer transition-all ${
                    paymentMethod === 'CASH'
                      ? 'border-[#C06A28] bg-[#FDF9F5] shadow-xs ring-1 ring-[#C06A28]/20'
                      : 'border-[#E8E2D8] hover:border-[#D4CBC0] bg-[#FAF7F2]/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'CASH'}
                    onChange={() => setPaymentMethod('CASH')}
                    className="accent-[#C06A28] mt-1 cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs sm:text-sm text-[#1A1613] flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-[#C06A28]" />
                        <span>Bayar Tunai di Kasir Gerai (Saat Pengambilan)</span>
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#2E7D32] font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded-md">
                        Tunai Gerai
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5C5248] leading-relaxed">
                      Barang disiapkan di gerai Pengkol Jepara. Anda membayarkan uang tunai langsung kepada kasir saat mengambil pesanan di toko.
                    </p>
                  </div>
                </label>
              ) : (
                <div className="p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-[#8C827A] text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#8C827A] shrink-0" />
                  <span>Metode bayar tunai di tempat hanya tersedia untuk pilihan Ambil di Gerai (Store Pickup).</span>
                </div>
              )}
            </div>

            {/* Kotak Rekening & Form Unggah Bukti TF jika memilih Transfer Bank */}
            {paymentMethod === 'BANK_TRANSFER' && (
              <div className="p-4 sm:p-5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl space-y-4 text-xs font-sans">
                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#5C5248] font-bold block">
                    Pilih Rekening Tujuan Transfer Toko
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {bankAccounts.map((b, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedBankIndex(idx)}
                        className={`p-3 text-left border rounded-xl transition cursor-pointer ${
                          selectedBankIndex === idx
                            ? 'border-[#C06A28] bg-white text-[#1A1613] shadow-xs ring-1 ring-[#C06A28]/20'
                            : 'border-[#E8E2D8] bg-white/60 text-[#5C5248] hover:bg-white'
                        }`}
                      >
                        <p className="font-bold text-xs text-[#1A1613]">{b.bankName}</p>
                        <p className="font-mono text-[11px] text-[#C06A28] font-semibold mt-0.5">{b.accountNumber}</p>
                        <p className="text-[10px] text-[#8C827A] truncate mt-0.5">a.n. {b.accountHolder}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detail Rekening Terpilih & Tombol Salin */}
                <div className="p-3.5 bg-white border border-[#E8E2D8] rounded-xl flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <span className="text-[10px] text-[#8C827A] uppercase font-mono block">No. Rekening Tujuan ({currentBank.bankName}):</span>
                    <span className="font-mono text-sm sm:text-base font-bold text-[#1A1613] tracking-wider">
                      {currentBank.accountNumber}
                    </span>
                    <span className="block text-[10px] text-[#5C5248]">a.n. {currentBank.accountHolder}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAccountNumber}
                    className="px-3 py-1.5 border border-[#E8E2D8] hover:border-[#C06A28] hover:bg-[#FAF7F2] text-[#1A1613] text-xs font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer shrink-0"
                  >
                    {copiedBank ? <Check className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5 text-[#C06A28]" />}
                    <span>{copiedBank ? 'Tersalin' : 'Salin Rekening'}</span>
                  </button>
                </div>

                {/* Unggah Bukti Transfer Langsung */}
                <div className="pt-2 border-t border-[#E8E2D8] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-[#1A1613] font-bold flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-[#C06A28]" />
                      <span>Lampirkan Foto Bukti Transfer (Opsional Sekarang)</span>
                    </label>
                    <span className="text-[10px] text-[#8C827A]">Bisa dilampirkan nanti</span>
                  </div>

                  <div className="p-4 bg-white border border-dashed border-[#D4CBC0] rounded-xl text-center space-y-2">
                    {proofImage ? (
                      <div className="space-y-2">
                        <div className="relative max-w-xs mx-auto aspect-video bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg overflow-hidden">
                          { }
                          <img src={proofImage} alt="Bukti Transfer" className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setProofImage('')}
                            className="absolute top-1.5 right-1.5 p-1 bg-black/70 text-white rounded-md hover:bg-black transition cursor-pointer"
                            title="Hapus bukti transfer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[11px] text-[#2E7D32] font-medium flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Foto bukti transfer siap diverifikasi admin!</span>
                        </span>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          id="checkoutProof"
                          accept="image/*"
                          onChange={handleProofImageChange}
                          disabled={compressingImage}
                          className="hidden"
                        />
                        <label
                          htmlFor="checkoutProof"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FAF7F2] hover:bg-white text-[#1A1613] border border-[#E8E2D8] hover:border-[#C06A28] rounded-xl text-xs font-medium cursor-pointer transition shadow-xs"
                        >
                          {compressingImage ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C06A28]" />
                              <span>Mengompres Foto...</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-3.5 h-3.5 text-[#C06A28]" />
                              <span>Pilih Foto Slip / Tangkapan Layar m-Banking</span>
                            </>
                          )}
                        </label>
                        <p className="text-[10px] text-[#8C827A] mt-1.5">
                          Format JPG, PNG, atau WebP. Gambar dikompres otomatis agar hemat kuota.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="pt-2 text-xs">
              <label className="block text-[#1A1613] font-medium mb-1.5">
                Catatan Tambahan untuk Toko (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Kemasan untuk hadiah / waktu pengambilan perkiraan jam 14.00"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2]/50 border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Order Summary Column */}
        <div className="lg:col-span-5 border border-[#E8E2D8] bg-white rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs sticky top-24">
          <h2 className="font-display text-lg text-[#1A1613] font-semibold border-b border-[#F0EBE1] pb-3">
            Rincian Pembayaran
          </h2>

          {/* Item previews */}
          <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-[#F0EBE1] pr-1">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center justify-between text-xs pt-3 first:pt-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 border border-[#E8E2D8] rounded-lg overflow-hidden shrink-0 bg-[#FAF7F2]">
                    <ProductImage
                      src={product.mainImage}
                      alt={product.name}
                      category={product.categoryName}
                      aspectRatio="square"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-[#1A1613] line-clamp-1">{product.name}</p>
                    <p className="text-[10px] text-[#8C827A] tabular-nums font-mono">
                      {quantity} × {formatRupiah(product.price)}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-xs text-[#1A1613] tabular-nums">
                  {formatRupiah(product.price * quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Cost breakdown */}
          <div className="space-y-3 pt-4 border-t border-[#F0EBE1] text-xs text-[#5C5248]">
            <div className="flex justify-between">
              <span>Subtotal Produk</span>
              <span className="font-semibold text-[#1A1613] tabular-nums">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Penyerahan ({fulfillmentMethod === 'PICKUP' ? 'Ambil Toko' : 'Ekspedisi Kurir'})</span>
              <span className={`font-semibold tabular-nums ${shippingFee === 0 ? 'text-[#2E7D32]' : 'text-[#1A1613]'}`}>
                {shippingFee === 0 ? 'GRATIS' : formatRupiah(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Metode Bayar</span>
              <span className="font-medium text-[#1A1613]">
                {paymentMethod === 'CASH' ? 'Tunai di Kasir Gerai' : `Transfer (${currentBank.bankName})`}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-[#F0EBE1] text-sm text-[#1A1613]">
              <span className="font-medium">Total Pembayaran</span>
              <span className="text-xl font-bold tabular-nums text-[#C06A28]">
                {formatRupiah(grandTotal)}
              </span>
            </div>
          </div>

          {/* Policy Note */}
          <div className="border border-[#E8E2D8] rounded-xl bg-[#FAF7F2] p-4 text-[11px] text-[#5C5248] space-y-1">
            <p className="font-semibold text-[#1A1613] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#C06A28]" />
              <span>
                {paymentMethod === 'CASH'
                  ? 'Batas Waktu Reservasi Kasir: 60 Menit (1 Jam)'
                  : 'Batas Waktu Reservasi Transfer: 60 Menit (1 Jam)'}
              </span>
            </p>
            <p className="leading-relaxed font-light">
              {paymentMethod === 'CASH'
                ? 'Stok produk direservasi selama 60 menit. Silakan datang ke gerai Pengkol Jepara dan sebutkan nomor pesanan kepada kasir toko untuk pembayaran tunai.'
                : 'Stok produk direservasi selama 60 menit. Bukti transfer yang Anda lampirkan akan langsung diverifikasi oleh admin toko.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Memproses Pesanan...</span>
              </>
            ) : (
              <>
                <span>
                  {paymentMethod === 'CASH'
                    ? 'Konfirmasi Pesanan Ambil di Toko'
                    : (proofImage ? 'Kirim Pesanan & Bukti Transfer' : 'Konfirmasi & Buat Pesanan')}
                </span>
                <CheckCircle className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
