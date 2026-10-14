'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X, MapPin, Store, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { STORE_IDENTITY } from '@/lib/constants';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import NotificationCenter from '@/components/layout/NotificationCenter';
import { formatOpeningTime } from '@/lib/utils';

export default function Navbar() {
  const pathname = usePathname();
  const { totalQuantity } = useCart();
  const { user, profile, isCashier, isAdmin, logout } = useAuth();
  const { settings } = useStoreSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Beranda', href: '/' },
    { label: 'Katalog Kurasi', href: '/katalog' },
    { label: 'Gerai & Lokasi', href: '/informasi-toko' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-[#1A1613] border-b border-[#E8E2D8] transition-colors shadow-2xs">
      {/* Top Banner Operasional Toko */}
      <div className="bg-[#FAF7F2] text-[#5E5851] text-[11px] py-1.5 px-4 border-b border-[#E8E2D8]/80 tracking-wide font-sans">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C06A28] inline-block animate-pulse" />
            <span className="font-medium text-[#1A1613]">
              Buka {formatOpeningTime(settings.openingTime || STORE_IDENTITY.openingTime)}
            </span>
            <span className="text-[#DDD4C6] hidden sm:inline">•</span>
            <span className="text-[#5E5851] hidden sm:inline">Gerai Fisik: Jl. KH. Moliki, Pengkol, Jepara</span>
          </div>
          <a
            href={settings.googleMapsUrl || STORE_IDENTITY.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#C06A28] hover:text-[#A8571B] font-medium transition"
          >
            <MapPin className="w-3 h-3 text-[#C06A28]" />
            <span className="hidden xs:inline">Petunjuk Arah Google Maps</span>
            <span className="xs:hidden">Peta</span>
          </a>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-17">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded bg-[#1A1613] text-[#FAF7F2] flex items-center justify-center font-display font-semibold text-sm shrink-0 border border-[#C06A28]/30 shadow-xs group-hover:border-[#C06A28] transition-colors">
              {settings.logoUrl ? (
                 
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover rounded" />
              ) : (
                <span className="tracking-wider">JH</span>
              )}
            </div>
            <div>
              <span className="font-display font-semibold text-base sm:text-lg tracking-tight block text-[#1A1613] group-hover:text-[#C06A28] transition-colors leading-tight">
                {settings.storeName || STORE_IDENTITY.name}
              </span>
              <span className="text-[10px] text-[#8A8379] tracking-wider uppercase block font-sans">
                Otentik Khas Kota Ukir Jepara
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 font-sans">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 text-xs uppercase tracking-wider font-medium transition-colors rounded-md relative ${
                    active
                      ? 'text-[#1A1613] font-semibold bg-[#FAF7F2]'
                      : 'text-[#5E5851] hover:text-[#1A1613] hover:bg-[#FAF7F2]/60'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-1 left-3.5 right-3.5 h-0.5 bg-[#C06A28] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* Notification Center */}
            <NotificationCenter darkTheme={false} />

            {/* Cart Button */}
            <Link
              href="/keranjang"
              className="relative p-2.5 rounded-md hover:bg-[#FAF7F2] text-[#1A1613] transition flex items-center justify-center border border-[#E8E2D8] hover:border-[#C06A28]"
              aria-label="Keranjang Belanja"
            >
              <ShoppingBag className="w-4 h-4 text-[#1A1613]" />
              {totalQuantity > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#C06A28] text-white text-[10px] font-bold rounded-full min-w-4.5 h-4.5 px-1 flex items-center justify-center tabular-nums shadow-xs">
                  {totalQuantity > 99 ? '99+' : totalQuantity}
                </span>
              )}
            </Link>

            {/* Backoffice Shortcut if Staff */}
            {(isAdmin || isCashier) && (
              <Link
                href="/admin/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1A1613] hover:bg-[#2E2823] text-white text-xs font-medium transition shadow-xs"
              >
                <Store className="w-3.5 h-3.5 text-[#C06A28]" />
                <span>Panel Toko</span>
              </Link>
            )}

            {/* User Profile or Login */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#E8E2D8]">
                <Link
                  href="/pesanan"
                  className="hidden sm:inline-block text-xs text-[#5E5851] hover:text-[#1A1613] font-medium transition"
                >
                  Pesanan Saya
                </Link>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#FAF7F2] border border-[#E8E2D8] text-[#1A1613] flex items-center justify-center font-display font-medium text-xs">
                    {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <button
                    onClick={() => logout()}
                    className="text-[11px] text-[#8A8379] hover:text-[#C5221F] transition hidden md:inline-block cursor-pointer font-sans"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs px-3.5 py-1.5 rounded-md bg-[#C06A28] hover:bg-[#A8571B] text-white transition font-medium shadow-xs"
              >
                Masuk
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#1A1613] hover:text-[#C06A28] focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#EAE8E2] px-5 py-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium flex items-center justify-between transition-colors ${
                    active
                      ? 'bg-[#FAF9F6] text-[#C96A45] font-semibold border-l-2 border-[#C96A45]'
                      : 'text-[#666666] hover:text-[#242424] hover:bg-[#FAF9F6]'
                  }`}
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-[#8C8C8C]" />
                </Link>
              );
            })}
            {user && (
              <Link
                href="/pesanan"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-md text-sm text-[#666666] hover:text-[#242424] flex items-center justify-between"
              >
                <span>Pesanan Saya</span>
                <ChevronRight className="w-4 h-4 text-[#8C8C8C]" />
              </Link>
            )}
            {(isAdmin || isCashier) && (
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-md text-sm text-[#242424] font-medium bg-[#FAF9F6] border border-[#EAE8E2] flex items-center justify-between mt-2"
              >
                <span>Panel Admin & Kasir</span>
                <ChevronRight className="w-4 h-4 text-[#C96A45]" />
              </Link>
            )}
          </nav>

          <div className="pt-4 border-t border-[#EAE8E2] flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-[#666666]">
                  Akun: <strong className="text-[#242424]">{profile?.displayName || user.email}</strong>
                </span>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-[#C96A45] hover:underline cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-md bg-[#242424] hover:bg-[#3D3D3D] text-white font-medium text-xs tracking-wider uppercase transition"
              >
                Masuk / Daftar Akun
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
