'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  CreditCard,
  Boxes,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { AppNotification } from '@/types';
import { formatDateTime } from '@/lib/utils';

interface NotificationCenterProps {
  darkTheme?: boolean;
}

export default function NotificationCenter({ darkTheme = false }: NotificationCenterProps) {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'UNREAD') return !n.read;
    return true;
  });

  const handleNotificationClick = (item: AppNotification) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'inventory':
        return <Boxes className="w-4 h-4 text-amber-600" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'system':
      default:
        return <Info className="w-4 h-4 text-[#C96A45]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Lonceng Notifikasi */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Pusat Notifikasi"
        className={`relative p-2 rounded-md transition flex items-center justify-center ${
          darkTheme
            ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
            : 'border border-[#EAE8E2] hover:bg-[#FAF9F6] text-[#242424]'
        }`}
      >
        <Bell className={`w-4 h-4 ${darkTheme ? 'text-white' : 'text-[#242424]'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 min-w-[18px] text-[10px] font-bold bg-[#C96A45] text-white rounded-full flex items-center justify-center tabular-nums">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Notifikasi */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-[#EAE8E2] z-50 overflow-hidden text-[#242424] animate-in fade-in zoom-in-95 duration-150">
          {/* Header Popover */}
          <div className="px-4 py-3 bg-[#FAF9F6] border-b border-[#EAE8E2] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#242424]">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-medium bg-[#FAF0EB] text-[#C96A45] px-2 py-0.5 rounded border border-[#ECD9D0]">
                  {unreadCount} baru
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-medium text-[#C96A45] hover:text-[#B35633] flex items-center gap-1 transition p-1 rounded"
                  title="Tandai semua telah dibaca"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tandai Dibaca</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-[#8C8C8C] hover:text-[#242424] rounded hover:bg-[#FAF9F6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tab: Semua vs Belum Dibaca */}
          <div className="px-3 pt-2 pb-1 border-b border-[#EAE8E2] flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#242424] text-white'
                  : 'text-[#666666] hover:text-[#242424] hover:bg-[#FAF9F6]'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('UNREAD')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                activeTab === 'UNREAD'
                  ? 'bg-[#242424] text-white'
                  : 'text-[#666666] hover:text-[#242424] hover:bg-[#FAF9F6]'
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {/* List Notifikasi */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#EAE8E2]">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center text-[#8C8C8C] space-y-2">
                <Bell className="w-8 h-8 mx-auto text-[#DFDCD3] stroke-1" />
                <p className="text-xs font-medium text-[#666666]">Tidak ada notifikasi baru</p>
                <p className="text-[11px] text-[#8C8C8C]">
                  {activeTab === 'UNREAD'
                    ? 'Semua notifikasi Anda sudah dibaca.'
                    : 'Aktivitas atau status pesanan akan tampil di sini.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-[#FAF9F6] transition cursor-pointer flex items-start gap-3 text-left ${
                    !notif.read ? 'bg-[#FAF0EB]/60' : ''
                  }`}
                >
                  <div className="p-2 rounded bg-white border border-[#EAE8E2] shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          !notif.read ? 'font-semibold text-[#242424]' : 'font-medium text-[#666666]'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#C96A45] shrink-0"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#666666] line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-[#8C8C8C]">
                      <span>{formatDateTime(notif.createdAt)}</span>
                      {notif.link && (
                        <span className="text-[#C96A45] flex items-center gap-0.5 font-medium hover:underline">
                          <span>Buka</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Popover */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-[#FAF9F6] border-t border-[#EAE8E2] flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={clearNotifications}
                className="text-[#8C8C8C] hover:text-[#C62828] transition cursor-pointer"
              >
                Bersihkan Riwayat
              </button>
              <span className="text-[#8C8C8C]">Pusat Notifikasi Toko Jeha</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
