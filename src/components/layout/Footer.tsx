'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, ExternalLink } from 'lucide-react';
import { STORE_IDENTITY } from '@/lib/constants';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { formatOpeningTime } from '@/lib/utils';

export default function Footer() {
  const currentYear = 2026;
  const { settings } = useStoreSettings();

  return (
    <footer className="bg-[#FAF7F2] text-[#1A1613] border-t border-[#E8E2D8] mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 pb-12 border-b border-[#E8E2D8]">
          {/* Brand & Provenance */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-[#1A1613] text-[#FAF7F2] flex items-center justify-center font-display font-semibold text-sm shrink-0 border border-[#C06A28]/40 shadow-xs">
                {settings.logoUrl ? (
                   
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover rounded" />
                ) : (
                  <span className="tracking-wider">JH</span>
                )}
              </div>
              <span className="font-display font-semibold text-xl text-[#1A1613] tracking-tight">
                {settings.storeName || STORE_IDENTITY.name}
              </span>
            </div>
            <p className="text-xs text-[#5E5851] leading-relaxed max-w-sm">
              Kurasi resmi aneka kudapan otentik pesisir, kopi robusta Tempur lereng Muria, tenun ikat Troso, dan kerajinan kayu jati asli langsung dari perajin dan dapur lokal Jepara.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#8A8379]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E7E34]" />
              <span>Gerai Fisik Aktif • Pengkol VII, Jepara, Jawa Tengah</span>
            </div>
          </div>

          {/* Operational Hours & Physical Store */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#1A1613]">
              Gerai Fisik & Kunjungan
            </h4>
            <div className="space-y-2.5 text-xs text-[#5E5851]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C06A28] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{settings.address || STORE_IDENTITY.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#C06A28] shrink-0" />
                <span>Buka setiap hari mulai pukul {formatOpeningTime(settings.openingTime || STORE_IDENTITY.openingTime)}</span>
              </div>
            </div>
            <div className="pt-2">
              <a
                href={settings.googleMapsUrl || STORE_IDENTITY.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#C06A28] hover:text-[#A8571B] font-medium hover:underline"
              >
                <span>Buka Rute Navigasi Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#C06A28]" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#1A1613]">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2 text-xs text-[#5E5851]">
              <li>
                <Link href="/" className="hover:text-[#C06A28] transition-colors">
                  Beranda Toko
                </Link>
              </li>
              <li>
                <Link href="/katalog" className="hover:text-[#C06A28] transition-colors">
                  Katalog Semua Produk
                </Link>
              </li>
              <li>
                <Link href="/informasi-toko" className="hover:text-[#C06A28] transition-colors">
                  Profil & Informasi Gerai
                </Link>
              </li>
              <li>
                <Link href="/keranjang" className="hover:text-[#C06A28] transition-colors">
                  Keranjang Belanja
                </Link>
              </li>
              <li>
                <Link href="/pesanan" className="hover:text-[#C06A28] transition-colors">
                  Lacak Pesanan Saya
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#8A8379]">
          <p>© {currentYear} {settings.storeName || STORE_IDENTITY.name}. Seluruh hak cipta dilindungi.</p>
          <p className="tracking-wide">Otentik • Berkualitas • Tradisi Pesisir & Seni Ukir Jepara</p>
        </div>
      </div>
    </footer>
  );
}
