'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  Calculator,
  ShoppingBag,
  CreditCard,
  Users,
  Receipt,
  BarChart3,
  Settings,
  ArrowLeft,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { STORE_IDENTITY } from '@/lib/constants';
import { useStoreSettings } from '@/context/StoreSettingsContext';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export default function AdminSidebar({ onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const { settings } = useStoreSettings();

  const menuGroups = [
    {
      group: 'Operasional Toko',
      items: [
        { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Kasir / PoS', href: '/admin/pos', icon: Calculator },
        { label: 'Kelola Pesanan', href: '/admin/pesanan', icon: ShoppingBag },
        { label: 'Verifikasi Pembayaran', href: '/admin/verifikasi-pembayaran', icon: CreditCard },
      ],
    },
    {
      group: 'Katalog & Inventaris',
      items: [
        { label: 'Master Produk', href: '/admin/produk', icon: Package },
        { label: 'Kategori Produk', href: '/admin/kategori', icon: Layers },
        { label: 'Inventaris & Stok', href: '/admin/inventaris', icon: Boxes },
      ],
    },
    {
      group: 'Data & Keuangan',
      items: [
        { label: 'Riwayat Transaksi', href: '/admin/transaksi', icon: Receipt },
        { label: 'Laporan Penjualan', href: '/admin/laporan', icon: BarChart3 },
        { label: 'Data Pelanggan', href: '/admin/pelanggan', icon: Users },
      ],
    },
    {
      group: 'Konfigurasi',
      items: [
        { label: 'Pengaturan Gerai', href: '/admin/pengaturan', icon: Settings },
      ],
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="w-64 bg-[#1A1613] text-[#FAF7F2] flex flex-col h-full border-r border-[#2E2823] select-none">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-[#2E2823] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#C06A28] text-white font-display font-bold flex items-center justify-center text-sm rounded-xl shrink-0 shadow-xs border border-[#C06A28]/40">
            {settings.logoUrl ? (
               
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
            ) : (
              'JH'
            )}
          </div>
          <div className="overflow-hidden">
            <h2 className="font-display font-semibold text-sm truncate text-[#FAF7F2]">
              {settings.storeName || STORE_IDENTITY.name}
            </h2>
            <span className="text-[9px] uppercase font-mono tracking-widest text-[#A89F91] block">
              Panel Operasional
            </span>
          </div>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-[#A89F91] hover:text-white rounded-lg transition"
            aria-label="Tutup Menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation List by Group */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar text-xs">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <span className="px-3 text-[9px] font-mono uppercase tracking-widest text-[#8C827A] block mb-1 font-bold">
              {group.group}
            </span>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-3 px-3 py-2.5 font-medium rounded-xl transition-all ${
                      active
                        ? 'bg-[#C06A28]/20 text-[#FAF7F2] font-semibold border-l-2 border-[#C06A28] pl-2.5'
                        : 'text-[#A89F91] hover:text-[#FAF7F2] hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#C06A28]' : 'text-[#8C827A]'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer User Info & Exit */}
      <div className="p-4 border-t border-[#2E2823] space-y-2 bg-[#14110E]">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-[#A89F91] hover:text-white hover:bg-white/5 rounded-xl transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#C06A28]" />
          <span>Lihat Etalase Toko</span>
        </Link>

        <div className="pt-2 border-t border-[#2E2823] flex items-center justify-between text-xs px-3">
          <div className="truncate max-w-[140px]">
            <p className="font-semibold text-white truncate text-xs">{profile?.displayName || 'Staf Toko'}</p>
            <span className="text-[10px] text-[#A89F91] font-mono uppercase tracking-wider">{profile?.role || 'Admin'}</span>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 text-[#A89F91] hover:text-[#C06A28] rounded-lg transition"
            title="Keluar dari Panel"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
