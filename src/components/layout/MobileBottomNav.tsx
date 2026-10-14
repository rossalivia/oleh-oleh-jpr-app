'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, ShoppingBag, ClipboardList, User, Store } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalQuantity } = useCart();
  const { user, isAdmin, isCashier } = useAuth();

  // Do not show bottom nav inside admin backoffice
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    {
      label: 'Beranda',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'Katalog',
      href: '/katalog',
      icon: Compass,
      isActive: pathname.startsWith('/katalog') || pathname.startsWith('/produk'),
    },
    {
      label: 'Keranjang',
      href: '/keranjang',
      icon: ShoppingBag,
      isActive: pathname === '/keranjang',
      badge: totalQuantity > 0 ? (totalQuantity > 99 ? '99+' : totalQuantity) : null,
    },
    {
      label: 'Pesanan',
      href: '/pesanan',
      icon: ClipboardList,
      isActive: pathname.startsWith('/pesanan'),
    },
    {
      label: (isAdmin || isCashier) ? 'Toko' : (user ? 'Akun' : 'Masuk'),
      href: (isAdmin || isCashier) ? '/admin/dashboard' : (user ? '/pesanan' : '/login'),
      icon: (isAdmin || isCashier) ? Store : User,
      isActive: pathname === '/login' || pathname.startsWith('/admin'),
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E2D8] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
      aria-label="Navigasi Bawah Ponsel"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors min-w-[56px] ${
                active
                  ? 'text-[#C06A28]'
                  : 'text-[#8A8379] hover:text-[#1A1613]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#C06A28] text-white text-[9px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center tabular-nums shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${active ? 'font-semibold text-[#C06A28]' : 'font-normal'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
