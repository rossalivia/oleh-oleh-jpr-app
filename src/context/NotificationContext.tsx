'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppNotification } from '@/types';
import { useAuth } from './AuthContext';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin, isCashier } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const storageKey = `jeha_notifications_${user ? user.uid : 'guest'}`;

  // 1. Muat dari localStorage saat inisialisasi
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        // Notifikasi bawaan awal selamat datang
        const initialNotif: AppNotification = {
          id: 'welcome-notif',
          title: 'Selamat Datang di Toko Jeha',
          message: 'Pusat oleh-oleh khas Jepara terpercaya. Temukan aneka makanan khas dan cinderamata ukir terbaik.',
          type: 'system',
          link: '/katalog',
          read: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications([initialNotif]);
      }
    } catch (e) {
      console.warn('Gagal membaca notifikasi lokal:', e);
    }
  }, [storageKey]);

  // 2. Simpan setiap perubahan ke localStorage
  const saveNotifications = (newList: AppNotification[]) => {
    setNotifications(newList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newList));
    } catch (e) {
      console.warn('Gagal menyimpan notifikasi:', e);
    }
  };

  const addNotification = (item: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: AppNotification = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    saveNotifications([newNotif, ...notifications.slice(0, 49)]); // Simpan hingga 50 notif
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearNotifications = () => {
    saveNotifications([]);
  };

  // 3. Listener Real-time Otomatis
  useEffect(() => {
    // A. Jika Admin / Kasir: dengarkan pesanan baru & bukti transfer
    if (isAdmin || isCashier) {
      try {
        const qOrders = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const unsub = onSnapshot(qOrders, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              // Cek apakah baru dibuat dalam 30 menit terakhir
              const createdTime = new Date(data.createdAt).getTime();
              const isRecent = Date.now() - createdTime < 30 * 60 * 1000;
              if (isRecent) {
                const orderNotifId = `order-notif-${change.doc.id}`;
                setNotifications((prev) => {
                  if (prev.some((n) => n.id === orderNotifId)) return prev;
                  const item: AppNotification = {
                    id: orderNotifId,
                    title: 'Pesanan Baru Diterima',
                    message: `Pesanan #${change.doc.id.slice(-6)} dari ${data.customerName || 'Pelanggan'} senilai Rp ${Number(data.totalAmount || 0).toLocaleString('id-ID')}`,
                    type: 'order',
                    link: `/admin/pesanan`,
                    read: false,
                    createdAt: data.createdAt || new Date().toISOString(),
                  };
                  const updated = [item, ...prev.slice(0, 49)];
                  try {
                    localStorage.setItem(storageKey, JSON.stringify(updated));
                  } catch (_) {}
                  return updated;
                });
              }
            }
          });
        });

        return () => unsub();
      } catch (err) {
        console.warn('Realtime admin order notifications error:', err);
      }
    }

    // B. Jika Pelanggan yang Login: dengarkan status pesanan miliknya
    if (user && !isAdmin && !isCashier) {
      try {
        const qCustomerOrders = query(
          collection(db, 'orders'),
          where('customerId', '==', user.uid),
          limit(10)
        );

        const unsubCustomer = onSnapshot(qCustomerOrders, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'modified') {
              const data = change.doc.data();
              const modNotifId = `cust-order-${change.doc.id}-${data.orderStatus}`;

              let statusLabel = '';
              if (data.orderStatus === 'PAID') statusLabel = 'Pembayaran Dikonfirmasi Lunas';
              else if (data.orderStatus === 'PROCESSING') statusLabel = 'Pesanan Sedang Dikemas';
              else if (data.orderStatus === 'READY_FOR_PICKUP') statusLabel = 'Pesanan Siap Diambil di Toko';
              else if (data.orderStatus === 'SHIPPED') statusLabel = 'Pesanan Telah Diserahkan ke Kurir';
              else if (data.orderStatus === 'COMPLETED') statusLabel = 'Pesanan Selesai';
              else if (data.orderStatus === 'CANCELLED') statusLabel = 'Pesanan Dibatalkan';

              if (statusLabel) {
                setNotifications((prev) => {
                  if (prev.some((n) => n.id === modNotifId)) return prev;
                  const item: AppNotification = {
                    id: modNotifId,
                    title: statusLabel,
                    message: `Status pesanan #${change.doc.id.slice(-6)} kini telah diperbarui menjadi "${statusLabel}".`,
                    type: data.orderStatus === 'CANCELLED' ? 'error' : 'success',
                    link: `/pesanan/${change.doc.id}`,
                    read: false,
                    createdAt: data.updatedAt || new Date().toISOString(),
                  };
                  const updated = [item, ...prev.slice(0, 49)];
                  try {
                    localStorage.setItem(storageKey, JSON.stringify(updated));
                  } catch (_) {}
                  return updated;
                });
              }
            }
          });
        });

        return () => unsubCustomer();
      } catch (err) {
        console.warn('Realtime customer order notifications error:', err);
      }
    }
  }, [user, isAdmin, isCashier, storageKey]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
