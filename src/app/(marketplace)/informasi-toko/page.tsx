'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  ExternalLink,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { STORE_IDENTITY } from '@/lib/constants';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { formatOpeningTime } from '@/lib/utils';

export default function InformasiTokoPage() {
  const { settings } = useStoreSettings();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Editorial Profile Header */}
      <div className="border-b border-[#E8E2D8] pb-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C06A28]" />
          <span className="text-[11px] tracking-widest uppercase text-[#C06A28] font-mono font-bold">
            Profil Gerai Fisik • Jepara
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#1A1613] text-[#FAF7F2] flex items-center justify-center font-display font-bold text-2xl shrink-0 shadow-xs border border-[#C06A28]/30">
            {settings.logoUrl ? (
               
              <img src={settings.logoUrl} alt="Logo Toko" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              'JH'
            )}
          </div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-[#1A1613] font-semibold tracking-tight">
              {settings.storeName || STORE_IDENTITY.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#8C827A] mt-1 font-medium">
              {settings.tagline || 'Pusat Aneka Camilan, Makanan Khas & Kerajinan Asli Kota Ukir Jepara'}
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#5C5248] leading-relaxed max-w-3xl font-light pt-2">
          Oleh-Oleh Khas Jepara Jeha didirikan sebagai gerai kurasi kuliner tradisional pesisir dan kerajinan khas Kabupaten Jepara. Kami bermitra langsung dengan produsen kuliner tradisional aren horog-horog, pemanggang kacang oven pasir, perajin tenun ikat Troso, dan pemahat kayu jati untuk memastikan keaslian mutu setiap produk yang kami sediakan.
        </p>
      </div>

      {/* Grid Informasi Gerai */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
        {/* Kolom 1: Alamat & Lokasi */}
        <div className="border border-[#E8E2D8] bg-white rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="space-y-1">
            <span className="text-[11px] tracking-widest uppercase text-[#C06A28] block font-mono font-bold">
              Lokasi Gerai Fisik
            </span>
            <h2 className="font-display text-xl text-[#1A1613] font-semibold">
              Alamat Lengkap
            </h2>
          </div>

          <div className="space-y-3 text-xs text-[#5C5248]">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#C06A28] shrink-0 mt-0.5" />
              <p className="leading-relaxed font-semibold text-[#1A1613]">
                {settings.address || STORE_IDENTITY.address}
              </p>
            </div>
            <p className="text-[11px] text-[#8C827A] pl-6.5 leading-relaxed font-light">
              Wilayah: Pengkol VII, Kecamatan Jepara, Kabupaten Jepara, Jawa Tengah
            </p>
          </div>

          <div className="pt-2">
            <a
              href={settings.googleMapsUrl || STORE_IDENTITY.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs uppercase tracking-wider font-semibold transition-colors rounded-xl shadow-xs cursor-pointer"
            >
              <span>Buka Petunjuk Arah di Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 text-white" />
            </a>
          </div>
        </div>

        {/* Kolom 2: Jam Operasional & Layanan */}
        <div className="border border-[#E8E2D8] bg-white rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="space-y-1">
            <span className="text-[11px] tracking-widest uppercase text-[#C06A28] block font-mono font-bold">
              Operasional Harian
            </span>
            <h2 className="font-display text-xl text-[#1A1613] font-semibold">
              Waktu Layanan
            </h2>
          </div>

          <div className="space-y-3 text-xs text-[#5C5248]">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#C06A28] shrink-0" />
              <p className="font-semibold text-[#1A1613]">
                Buka setiap hari mulai pukul {formatOpeningTime(settings.openingTime || STORE_IDENTITY.openingTime)}
              </p>
            </div>
            <p className="text-[11px] text-[#8C827A] pl-6.5">
              Zona Waktu Resmi: Asia/Jakarta (WIB)
            </p>
            {settings.whatsappNumber && (
              <div className="flex items-center gap-2.5 pt-2 border-t border-[#F0EBE1] text-[#1A1613]">
                <MessageCircle className="w-4 h-4 text-[#C06A28] shrink-0" />
                <span className="font-mono text-xs">WhatsApp: {settings.whatsappNumber}</span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Link
              href="/katalog"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#E8E2D8] bg-[#FAF7F2] text-[#1A1613] hover:border-[#C06A28] hover:bg-white text-xs uppercase tracking-wider font-semibold transition-colors rounded-xl shadow-xs cursor-pointer"
            >
              <span>Lihat Produk yang Siap Dipesan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
