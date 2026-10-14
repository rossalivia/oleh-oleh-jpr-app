'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { STORE_IDENTITY } from '@/lib/constants';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { ProductImage } from '@/components/ui/ProductImage';
import { Product } from '@/types';
import { getProducts } from '@/lib/services/productService';
import { formatRupiah, formatOpeningTime } from '@/lib/utils';
import {
  ArrowRight,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Truck,
  Store,
  ChevronRight,
  Compass,
  Award,
} from 'lucide-react';

export default function HomePage() {
  const { settings } = useStoreSettings();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const prods = await getProducts({ onlyPublished: true, onlyActive: true });
        // Display 8 featured products for a balanced 4-column desktop grid
        setFeaturedProducts(prods.slice(0, 8));
      } catch (err) {
        console.warn('Error loading featured products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const collections = [
    {
      title: 'Kudapan Tradisional Pesisir',
      desc: 'Horog-horog aren, kacang oven sangrai pasir khas Jepara, kerupuk tengiri segar, dan carang madu legit renyah.',
      href: '/katalog?kategori=makanan-khas',
      provenance: 'Dapur Otentik Pesisir',
      badge: 'Resep Turun-Temurun',
      icon: '🍜',
    },
    {
      title: 'Tenun Ikat Troso & Ukir Jati',
      desc: 'Kain tenun ikat ATBM asli perajin Desa Troso dan kerajinan kriya kayu jati solid karya maestro ukir Jepara.',
      href: '/katalog?kategori=kerajinan-suvenir',
      provenance: 'Kriya Budaya Lokal',
      badge: '100% Buatan Tangan',
      icon: '🪵',
    },
    {
      title: 'Kopi Tempur & Buah Tangan',
      desc: 'Kopi Robusta lereng Gunung Muria dari Desa Wisata Tempur dan ragam cenderamata pilihan pelancong.',
      href: '/katalog?kategori=oleh-oleh-pilihan',
      provenance: 'Lereng Gunung Muria',
      badge: 'Favorit Wisatawan',
      icon: '☕',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-24 font-sans text-[#1A1613]">
      {/* Editorial Cover Hero */}
      <section className="bg-gradient-to-b from-white via-[#FAF7F2] to-[#FAF7F2] border-b border-[#E8E2D8] pt-12 sm:pt-18 pb-16 sm:pb-22 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle decorative artisan aura */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C06A28]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#1E3A5F]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
          {/* Left Column: Headline, Narrative & Primary Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E8E2D8] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#1E7E34] animate-pulse" />
              <span className="text-[11px] font-medium text-[#1A1613] tracking-wide">
                Gerai Fisik Buka Hari Ini • Pengkol, Jepara
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#1A1613] leading-[1.14]">
                Buah Tangan Pesisir & Kriya Abadi Kota Ukir.
              </h1>
              <p className="text-sm sm:text-base text-[#5E5851] leading-relaxed max-w-xl font-light">
                Menghadirkan kudapan tradisional otentik, kopi robusta lereng Muria Desa Tempur, kain tenun ikat Troso, dan ukiran kayu jati asli langsung dari perajin dan dapur lokal Jepara.
              </p>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <Link
                href="/katalog"
                className="px-6 py-3.5 bg-[#C06A28] hover:bg-[#A8571B] text-white font-medium text-xs tracking-wider uppercase transition-all inline-flex items-center gap-2 rounded-md shadow-sm hover:shadow cursor-pointer"
              >
                <span>Jelajahi Katalog Lengkap</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/informasi-toko"
                className="px-6 py-3.5 bg-white border border-[#E8E2D8] hover:border-[#C06A28] text-[#1A1613] hover:text-[#C06A28] font-medium text-xs tracking-wider uppercase transition-colors rounded-md shadow-2xs cursor-pointer inline-flex items-center gap-2"
              >
                <Store className="w-3.5 h-3.5 text-[#C06A28]" />
                <span>Kunjungi Gerai Fisik</span>
              </Link>
            </div>

            {/* 3 Core Trust Badges */}
            <div className="pt-6 border-t border-[#E8E2D8]/80 grid grid-cols-3 gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="font-display font-semibold text-[#1A1613] text-sm block">100% Asli</span>
                <span className="text-[11px] text-[#8A8379] leading-tight block">Perajin & Dapur Jepara</span>
              </div>
              <div className="space-y-0.5 border-l border-[#E8E2D8] pl-4">
                <span className="font-display font-semibold text-[#1A1613] text-sm block">Bebas Ongkir</span>
                <span className="text-[11px] text-[#8A8379] leading-tight block">Ambil Langsung di Gerai</span>
              </div>
              <div className="space-y-0.5 border-l border-[#E8E2D8] pl-4">
                <span className="font-display font-semibold text-[#1A1613] text-sm block">Kirim Cepat</span>
                <span className="text-[11px] text-[#8A8379] leading-tight block">Kemasan Aman Ekspedisi</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Showcase Card & Store Identity */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#E8E2D8] rounded-xl p-6 sm:p-7 shadow-sm space-y-6 relative">
              <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-[#1A1613] text-white flex items-center justify-center font-display font-bold text-xs">
                    JH
                  </div>
                  <div>
                    <h2 className="font-display font-medium text-sm text-[#1A1613]">
                      {settings.storeName || STORE_IDENTITY.name}
                    </h2>
                    <span className="text-[10px] text-[#8A8379] block">Pusat Oleh-Oleh Pengkol, Jepara</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#FDF5ED] text-[#C06A28] border border-[#F3DEC9] text-[10px] font-medium">
                  Terkurasi
                </span>
              </div>

              {/* Showcase Spotlight Items */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-wider text-[#8A8379] font-medium block">
                  Unggulan Daerah Minggu Ini
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg space-y-1">
                    <span className="text-[10px] text-[#C06A28] font-medium block">Camilan Gurih</span>
                    <h3 className="font-medium text-xs text-[#1A1613] line-clamp-1">Kacang Oven Pasir</h3>
                    <p className="font-mono text-xs font-semibold text-[#1A1613]">Rp 25.000</p>
                  </div>
                  <div className="p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg space-y-1">
                    <span className="text-[10px] text-[#1E3A5F] font-medium block">Kriya Troso</span>
                    <h3 className="font-medium text-xs text-[#1A1613] line-clamp-1">Kain Tenun Troso</h3>
                    <p className="font-mono text-xs font-semibold text-[#1A1613]">Rp 175.000</p>
                  </div>
                </div>
              </div>

              {/* Physical Visit Prompt */}
              <div className="p-3.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#C06A28] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#5E5851] leading-snug">
                    <strong className="text-[#1A1613]">Gerai Pengkol:</strong> {settings.address || STORE_IDENTITY.address}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#E8E2D8] text-[11px]">
                  <span className="text-[#8A8379]">Buka pukul {formatOpeningTime(settings.openingTime || STORE_IDENTITY.openingTime)}</span>
                  <a
                    href={settings.googleMapsUrl || STORE_IDENTITY.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C06A28] hover:underline font-medium"
                  >
                    Buka Peta Google →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Editorial Collections Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E8E2D8]">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C06A28]" />
              <span className="text-[10px] tracking-wider uppercase text-[#8A8379] font-medium">
                Pusat Kurasi
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-[#1A1613] font-medium">
              Tiga Warisan Tradisi Jepara
            </h2>
          </div>
          <Link
            href="/katalog"
            className="text-xs uppercase tracking-wider text-[#C06A28] hover:text-[#A8571B] font-semibold inline-flex items-center gap-1 transition"
          >
            <span>Semua Kategori</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {collections.map((col, idx) => (
            <Link
              key={idx}
              href={col.href}
              className="bg-white border border-[#E8E2D8] hover:border-[#C06A28] rounded-xl p-6 sm:p-7 group transition-all shadow-2xs hover:shadow-sm block space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{col.icon}</span>
                <span className="text-[10px] tracking-wider uppercase font-medium px-2 py-0.5 rounded bg-[#FAF7F2] text-[#8A8379] border border-[#E8E2D8]">
                  {col.badge}
                </span>
              </div>

              <div>
                <span className="text-[11px] tracking-wider uppercase text-[#C06A28] font-medium block mb-1">
                  {col.provenance}
                </span>
                <h3 className="font-display text-lg sm:text-xl text-[#1A1613] font-semibold group-hover:text-[#C06A28] transition-colors flex items-center justify-between">
                  <span>{col.title}</span>
                  <ArrowRight className="w-4 h-4 text-[#8A8379] group-hover:text-[#C06A28] group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-xs text-[#5E5851] mt-2 leading-relaxed">
                  {col.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Showcase (4-Column Breathable Grid) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#E8E2D8]">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C06A28]" />
              <span className="text-[10px] tracking-wider uppercase text-[#8A8379] font-medium">
                Katalog Produk Pilihan
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-[#1A1613] font-medium">
              Karya Asli & Kudapan Terlaris
            </h2>
          </div>
          <Link
            href="/katalog"
            className="text-xs uppercase tracking-wider text-[#C06A28] hover:text-[#A8571B] font-semibold inline-flex items-center gap-1 transition"
          >
            <span>Lihat Seluruh Katalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Cards Grid: 2 cols on mobile, 3 on tablet, 4 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 pt-7">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#E8E2D8] p-3 space-y-3 animate-pulse">
                <div className="aspect-[4/5] bg-[#FAF7F2] rounded-lg" />
                <div className="h-4 bg-[#FAF7F2] rounded w-3/4" />
                <div className="h-3 bg-[#FAF7F2] rounded w-1/2" />
              </div>
            ))
          ) : (
            featuredProducts.map((p) => {
              const isLowStock = p.stock > 0 && p.stock <= (p.lowStockThreshold || 5);
              const isOutOfStock = p.stock <= 0;

              return (
                <Link
                  key={p.id}
                  href={`/produk/${p.slug}`}
                  className="bg-white border border-[#E8E2D8] hover:border-[#C06A28] rounded-xl overflow-hidden group transition-all shadow-2xs hover:shadow-sm flex flex-col"
                >
                  {/* Image container */}
                  <div className="relative overflow-hidden bg-[#FAF7F2]">
                    <ProductImage
                      src={p.mainImage}
                      alt={p.name}
                      category={p.categoryName}
                      aspectRatio="portrait"
                      isCuratedNotice={true}
                    />

                    {/* Stock Pill Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded bg-[#C5221F] text-white text-[10px] font-medium">
                          Habis
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded bg-[#FEF8ED] text-[#B76500] border border-[#FEE2B8] text-[10px] font-medium">
                          Sisa {p.stock}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-white/90 backdrop-blur-xs text-[#5E5851] border border-[#E8E2D8] text-[10px] font-medium">
                          Tersedia
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#8A8379] block">
                        {p.categoryName || 'Khas Jepara'}
                      </span>
                      <h3 className="font-medium text-xs sm:text-sm text-[#1A1613] group-hover:text-[#C06A28] line-clamp-2 transition-colors leading-snug">
                        {p.name}
                      </h3>
                    </div>

                    <div className="pt-2 border-t border-[#E8E2D8]/80 flex items-baseline justify-between">
                      <div>
                        <span className="font-mono text-sm sm:text-base font-semibold text-[#1A1613] tabular-nums">
                          {formatRupiah(p.price)}
                        </span>
                        <span className="text-[10px] text-[#8A8379] ml-1 font-sans">/{p.unit}</span>
                      </div>
                      <span className="text-[11px] text-[#C06A28] font-medium group-hover:underline flex items-center gap-0.5">
                        Lihat <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Honest Provenance & Craftsmanship Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1A1613] text-[#FAF7F2] rounded-2xl p-8 sm:p-12 lg:p-14 relative overflow-hidden shadow-sm">
          {/* Subtle amber gradient aura */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#C06A28]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-[#FDF5ED]">
              <Sparkles className="w-3.5 h-3.5 text-[#C06A28]" />
              <span>Komitmen Mutu & Autentisitas Jeha</span>
            </div>

            <h2 className="font-display text-2xl sm:text-4xl text-white font-medium leading-tight">
              Kurasi Langsung dari Tangan Perajin & Dapur Tradisional Jepara.
            </h2>

            <p className="text-xs sm:text-sm text-[#DDD4C6] leading-relaxed font-light">
              Kami bekerja sama langsung dengan keluarga perajin tenun ikat ATBM di Desa Troso, pengolah tepung pohon aren horog-horog pesisir, pemanggang kacang oven tradisional pasir, petani kopi lereng Muria di Desa Tempur, dan para pengukir kayu jati solid. Tanpa perantara yang mengaburkan keaslian rasa dan mutu kriya.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href="/informasi-toko"
                className="px-5 py-3 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs uppercase tracking-wider font-medium rounded-md transition shadow-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Profil Gerai & Lokasi Lengkap</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/katalog"
                className="px-5 py-3 border border-white/20 hover:border-white text-white text-xs uppercase tracking-wider font-medium rounded-md transition cursor-pointer"
              >
                Katalog Produk Kami
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
