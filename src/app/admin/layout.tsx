'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Menu, Clock } from 'lucide-react';
import { STORE_IDENTITY } from '@/lib/constants';
import IncomingOrderAlert from '@/components/admin/IncomingOrderAlert';
import NotificationCenter from '@/components/layout/NotificationCenter';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { formatOpeningTime } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { settings } = useStoreSettings();

  return (
    <ProtectedRoute allowedRoles={['admin', 'cashier']}>
      <div className="flex h-screen bg-[#FAF7F2] text-[#1A1613] overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex h-full shrink-0">
          <AdminSidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#1A1613] z-10 shadow-2xl">
              <AdminSidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Admin Header Bar */}
          <header className="h-16 bg-white border-b border-[#E8E2D8] px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-2 text-[#1A1613] hover:bg-[#FAF7F2] rounded-xl transition"
                aria-label="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <span className="font-display font-semibold text-sm text-[#1A1613] truncate">
                  {settings.storeName || STORE_IDENTITY.name}
                </span>
                <span className="hidden sm:inline text-[10px] font-mono text-[#8C827A] border-l border-[#E8E2D8] pl-2.5">
                  Pengkol, Jepara
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 text-xs text-[#5C5248] border border-[#E8E2D8] px-3 py-1.5 bg-[#FAF7F2] rounded-xl shadow-xs">
                <Clock className="w-3.5 h-3.5 text-[#C06A28]" />
                <span className="font-mono text-[11px] font-semibold">Buka {formatOpeningTime(settings.openingTime || STORE_IDENTITY.openingTime)}</span>
              </div>
              <IncomingOrderAlert />
              <NotificationCenter />
            </div>
          </header>

          {/* Page Body Viewport */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
