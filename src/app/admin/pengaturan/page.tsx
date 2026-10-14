'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Save,
  Store,
  MapPin,
  Clock,
  Phone,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Upload,
  Trash2,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import { StoreSettings } from '@/types';
import { getStoreSettings, updateStoreSettings } from '@/lib/services/settingsService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { compressImage } from '@/lib/utils';

export default function PengaturanTokoPage() {
  const { user, profile, isAdmin } = useAuth();
  const toast = useToast();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState<number>(5);
  const [cancellationNotice, setCancellationNotice] = useState('');

  // Bank Accounts
  const [bank1Name, setBank1Name] = useState('');
  const [bank1Number, setBank1Number] = useState('');
  const [bank1Holder, setBank1Holder] = useState('');

  const [bank2Name, setBank2Name] = useState('');
  const [bank2Number, setBank2Number] = useState('');
  const [bank2Holder, setBank2Holder] = useState('');

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const data = await getStoreSettings();
        setSettings(data);

        setStoreName(data.storeName ?? '');
        setTagline(data.tagline ?? '');
        setLogoUrl(data.logoUrl ?? '');
        setAddress(data.address ?? '');
        setGoogleMapsUrl(data.googleMapsUrl ?? '');
        setOpeningTime(data.openingTime ?? '');
        setClosingTime(data.closingTime ?? '');
        setPhoneNumber(data.phoneNumber ?? '');
        setWhatsappNumber(data.whatsappNumber ?? '');
        setDefaultLowStockThreshold(data.defaultLowStockThreshold ?? 5);
        setCancellationNotice(data.cancellationPolicyNotice ?? '');

        if (data.bankAccounts && data.bankAccounts.length > 0) {
          setBank1Name(data.bankAccounts[0].bankName ?? '');
          setBank1Number(data.bankAccounts[0].accountNumber ?? '');
          setBank1Holder(data.bankAccounts[0].accountHolder ?? '');

          if (data.bankAccounts.length > 1) {
            setBank2Name(data.bankAccounts[1].bankName ?? '');
            setBank2Number(data.bankAccounts[1].accountNumber ?? '');
            setBank2Holder(data.bankAccounts[1].accountHolder ?? '');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File yang dipilih harus berupa berkas gambar (PNG, JPG, WebP).', 'Format Tidak Sesuai');
      return;
    }

    setUploadingLogo(true);
    try {
      const compressed = await compressImage(file, 400, 0.85);
      setLogoUrl(compressed);
      toast.success('Foto logo toko berhasil dipilih! Klik Simpan Pengaturan di bawah.', 'Logo Toko Diperbarui');
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mengompres gambar logo: ' + (err.message || 'Error'), 'Gagal Unggah');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    toast.info('Foto logo toko dihapus dari formulir. Klik Simpan untuk memperbarui.', 'Logo Dihapus');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Hanya pengguna peran Administrator yang berwenang mengubah pengaturan toko.', 'Akses Dibatasi');
      setAlert({ type: 'error', text: 'Hanya pengguna dengan peran Administrator yang berwenang mengubah pengaturan toko.' });
      return;
    }

    setSaving(true);
    setAlert(null);

    const bankAccounts = [];
    if (bank1Number.trim()) {
      bankAccounts.push({
        bankName: bank1Name.trim() || 'BCA',
        accountNumber: bank1Number.trim(),
        accountHolder: bank1Holder.trim() || storeName,
      });
    }
    if (bank2Number.trim()) {
      bankAccounts.push({
        bankName: bank2Name.trim() || 'Bank Jateng',
        accountNumber: bank2Number.trim(),
        accountHolder: bank2Holder.trim() || storeName,
      });
    }

    try {
      const res = await updateStoreSettings(
        {
          storeName: storeName.trim(),
          tagline: tagline.trim(),
          logoUrl: logoUrl.trim(),
          address: address.trim(),
          googleMapsUrl: googleMapsUrl.trim(),
          openingTime: openingTime.trim(),
          closingTime: closingTime.trim(),
          phoneNumber: phoneNumber.trim(),
          whatsappNumber: whatsappNumber.trim(),
          defaultLowStockThreshold: Number(defaultLowStockThreshold),
          cancellationPolicyNotice: cancellationNotice.trim(),
          bankAccounts,
        },
        profile?.displayName || user?.displayName || 'Administrator'
      );

      if (!res.success) {
        const failTxt = res.message || 'Gagal menyimpan pengaturan.';
        setAlert({ type: 'error', text: failTxt });
        toast.error(failTxt, 'Penyimpanan Gagal');
      } else {
        const succTxt = 'Pengaturan operasional dan logo toko Jeha berhasil diperbarui di database!';
        setAlert({ type: 'success', text: succTxt });
        toast.success(succTxt, 'Pengaturan Tersimpan');
      }
    } catch (err: any) {
      const errTxt = err.message || 'Terjadi kesalahan sistem.';
      setAlert({ type: 'error', text: errTxt });
      toast.error(errTxt, 'Kesalahan Sistem');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[#7A7067] text-xs">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-[#C06A28] border-t-transparent rounded-full mb-2"></div>
        <p>Memuat konfigurasi toko...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Editorial Header */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C06A28]"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#C06A28] font-semibold">
              Parameter Sistem & Profil Toko
            </span>
          </div>
          <h1 className="font-display font-medium text-2xl text-[#1A1613] tracking-tight mt-1 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#C06A28]" />
            <span>Pengaturan Toko & Operasional</span>
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#7A7067] mt-0.5">
            Konfigurasi identitas resmi, jam buka operasional, rekening bank transfer, dan batas stok minimum.
          </p>
        </div>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-xl text-xs font-sans font-medium flex items-center justify-between border ${
            alert.type === 'success'
              ? 'bg-[#FAF0E6] text-[#C06A28] border-[#ECD9C6]'
              : 'bg-[#FEF2F2] text-[#991B1B] border-[#FEE2E2]'
          }`}
        >
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)} className="text-[#7A7067] hover:text-[#1A1613] cursor-pointer font-bold text-base">
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs font-sans">
        {/* Bagian 1: Identitas Toko */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-xs font-mono font-medium text-[#1A1613] uppercase tracking-wider flex items-center gap-2 border-b border-[#E8E2D8] pb-3">
            <Store className="w-4 h-4 text-[#C06A28]" />
            <span>Identitas Resmi Toko</span>
          </h2>

          {/* Upload Foto / Logo Toko */}
          <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8]">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-2.5">
              Foto / Logo Resmi Toko
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl bg-white border border-[#E8E2D8] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {logoUrl ? (
                   
                  <img
                    src={logoUrl}
                    alt="Logo Toko"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-[#A89F91]">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50 text-[#C06A28]" />
                    <span className="text-[9px] block leading-tight">Belum Ada</span>
                  </div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-[#1A1613] hover:bg-black text-white font-medium rounded-xl transition text-xs shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-white" />
                    <span>{uploadingLogo ? 'Memproses...' : 'Pilih Foto / Logo Toko'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FAF7F2] text-red-600 border border-[#E8E2D8] font-medium rounded-xl transition text-xs cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#7A7067] leading-relaxed">
                  Unggah foto toko atau berkas logo (PNG, JPG, WebP). Gambar otomatis dioptimalkan agar responsif dan muncul pada nota kasir PoS, header, serta profil resmi toko.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">
                Nama Toko <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl font-medium text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">Tagline Singkat</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">
              Alamat Lengkap Gerai Fisik <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">
              Tautan Resmi Google Maps <span className="text-red-600">*</span>
            </label>
            <div className="flex gap-2.5">
              <input
                type="url"
                required
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl font-mono text-[11px] text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
              />
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-[#FAF7F2] hover:bg-white border border-[#E8E2D8] rounded-xl text-[#1A1613] transition flex items-center justify-center shrink-0 shadow-xs"
                title="Buka URL Google Maps"
              >
                <ExternalLink className="w-4 h-4 text-[#C06A28]" />
              </a>
            </div>
          </div>
        </div>

        {/* Bagian 2: Jam Operasional & Kontak */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xs font-mono font-medium text-[#1A1613] uppercase tracking-wider flex items-center gap-2 border-b border-[#E8E2D8] pb-3">
            <Clock className="w-4 h-4 text-[#C06A28]" />
            <span>Jam Operasional & Kontak Toko</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">
                Jam Buka <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                placeholder="07.00 WIB"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl font-medium text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
              />
              <span className="text-[10px] text-[#7A7067] mt-1 block">Zona waktu resmi: Asia/Jakarta (WIB)</span>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">
                Jam Tutup <span className="text-[#A89F91] font-normal">(Belum Dikonfirmasi)</span>
              </label>
              <input
                type="text"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                placeholder="Biarkan kosong jika belum ditentukan"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">
                Nomor WhatsApp Toko <span className="text-[#A89F91] font-normal">(Belum Dikonfirmasi)</span>
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="Biarkan kosong hingga dikonfirmasi pemilik toko"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">
                Nomor Telepon Toko <span className="text-[#A89F91] font-normal">(Belum Dikonfirmasi)</span>
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Biarkan kosong jika belum ada"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Bagian 3: Rekening Pembayaran Resmi Toko */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xs font-mono font-medium text-[#1A1613] uppercase tracking-wider flex items-center gap-2 border-b border-[#E8E2D8] pb-3">
            <CreditCard className="w-4 h-4 text-[#C06A28]" />
            <span>Rekening Bank Transfer Resmi Toko</span>
          </h2>

          <div className="space-y-4">
            {/* Rekening 1 */}
            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-3">
              <span className="font-mono text-[11px] font-medium text-[#1A1613] uppercase tracking-wider block">
                Rekening Bank 1 (Utama)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nama Bank (misal: BCA)"
                  value={bank1Name}
                  onChange={(e) => setBank1Name(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-[#E8E2D8] rounded-xl font-medium text-[#1A1613] text-xs focus:outline-none focus:border-[#C06A28]"
                />
                <input
                  type="text"
                  placeholder="Nomor Rekening"
                  value={bank1Number}
                  onChange={(e) => setBank1Number(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-[#E8E2D8] rounded-xl font-mono font-medium text-[#1A1613] text-xs focus:outline-none focus:border-[#C06A28]"
                />
                <input
                  type="text"
                  placeholder="Nama Pemilik Rekening"
                  value={bank1Holder}
                  onChange={(e) => setBank1Holder(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-[#E8E2D8] rounded-xl text-[#1A1613] text-xs focus:outline-none focus:border-[#C06A28]"
                />
              </div>
            </div>

            {/* Rekening 2 */}
            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] space-y-3">
              <span className="font-mono text-[11px] font-medium text-[#1A1613] uppercase tracking-wider block">
                Rekening Bank 2 (Opsional)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nama Bank (misal: Bank Jateng)"
                  value={bank2Name}
                  onChange={(e) => setBank2Name(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-[#E8E2D8] rounded-xl font-medium text-[#1A1613] text-xs focus:outline-none focus:border-[#C06A28]"
                />
                <input
                  type="text"
                  placeholder="Nomor Rekening"
                  value={bank2Number}
                  onChange={(e) => setBank2Number(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-[#E8E2D8] rounded-xl font-mono font-medium text-[#1A1613] text-xs focus:outline-none focus:border-[#C06A28]"
                />
                <input
                  type="text"
                  placeholder="Nama Pemilik Rekening"
                  value={bank2Holder}
                  onChange={(e) => setBank2Holder(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-[#E8E2D8] rounded-xl text-[#1A1613] text-xs focus:outline-none focus:border-[#C06A28]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bagian 4: Parameter Kebijakan Toko & Stok */}
        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xs font-mono font-medium text-[#1A1613] uppercase tracking-wider flex items-center gap-2 border-b border-[#E8E2D8] pb-3">
            <AlertTriangle className="w-4 h-4 text-[#C06A28]" />
            <span>Kebijakan Operasional & Ambang Stok</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">
                Batas Default Peringatan Stok Rendah (Unit)
              </label>
              <input
                type="number"
                min="1"
                required
                value={defaultLowStockThreshold}
                onChange={(e) => setDefaultLowStockThreshold(Number(e.target.value))}
                className="w-48 px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl font-medium text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
              />
              <span className="text-[10px] text-[#7A7067] mt-1 block">
                Produk dengan stok di bawah nilai ini otomatis memicu peringatan restock pada dashboard.
              </span>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#7A7067] font-medium mb-1.5">
                Pemberitahuan Kebijakan Pembatalan Pesanan
              </label>
              <textarea
                rows={2}
                value={cancellationNotice}
                onChange={(e) => setCancellationNotice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#C06A28] hover:bg-[#A8571B] text-white font-medium rounded-xl transition flex items-center gap-2 disabled:opacity-50 min-h-[44px] cursor-pointer shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Pengaturan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Seluruh Pengaturan Toko</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
