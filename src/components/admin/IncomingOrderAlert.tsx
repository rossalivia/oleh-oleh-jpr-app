'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellRing,
  ShoppingBag,
  ExternalLink,
  X,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Order } from '@/types';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

/**
 * Memainkan nada chime lembut (Web Audio API) tanpa perlu unduhan file eksternal
 */
export function playChimeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Nada 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Nada 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.18);
    gain2.gain.setValueAtTime(0.3, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.7);
  } catch (err) {
    console.warn('Audio chime tidak diizinkan atau tidak didukung:', err);
  }
}

export default function IncomingOrderAlert() {
  const router = useRouter();
  const toast = useToast();
  const [activeAlert, setActiveAlert] = useState<Order | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Menyimpan ID pesanan yang sudah pernah diketahui agar tidak berbunyi berulang saat load awal
  const isInitialLoad = useRef(true);
  const knownOrderIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Dengarkan order terbaru dari Firestore
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];

        // Hitung order pending / verifikasi
        const needingAttention = orders.filter(
          (o) => o.orderStatus === 'PENDING_PAYMENT' || o.orderStatus === 'WAITING_VERIFICATION'
        );
        setPendingCount(needingAttention.length);

        if (isInitialLoad.current) {
          // Tandai order yang sudah ada saat aplikasi pertama dimuat
          orders.forEach((o) => knownOrderIds.current.add(o.id));
          isInitialLoad.current = false;
          return;
        }

        // Cek apakah ada order baru yang belum pernah tercatat
        for (const change of snapshot.docChanges()) {
          if (change.type === 'added') {
            const newOrder = { id: change.doc.id, ...change.doc.data() } as Order;

            if (!knownOrderIds.current.has(newOrder.id)) {
              knownOrderIds.current.add(newOrder.id);

              // Mainkan suara alert jika diizinkan
              if (soundEnabled) {
                playChimeSound();
              }

              // Tampilkan banner alert pesanan masuk
              setActiveAlert(newOrder);

              // Tampilkan toast pop up
              toast.info(
                `Pesanan #${newOrder.id.slice(-6)} dari ${newOrder.customerName || 'Pelanggan'} (${formatRupiah(newOrder.totalAmount)}) telah masuk!`,
                '🔔 Pesanan Baru Masuk!'
              );
            }
          }
        }
      },
      (error) => {
        console.warn('Gagal mendengarkan pesanan masuk secara real-time:', error);
      }
    );

    return () => unsubscribe();
  }, [soundEnabled, toast]);

  const handleOpenOrder = () => {
    if (activeAlert) {
      router.push('/admin/pesanan');
      setActiveAlert(null);
    }
  };

  const handleTestChime = () => {
    playChimeSound();
    toast.info('Suara notifikasi pesanan berhasil diuji!', 'Uji Notifikasi Suara');
  };

  return (
    <>
      {/* Tombol Status Suara & Lencana Notifikasi di Top Bar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSoundEnabled((prev) => !prev)}
          className={`px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 transition border ${
            soundEnabled
              ? 'bg-[#FAF0EB] text-[#C96A45] border-[#ECD9D0]'
              : 'bg-white text-[#666666] hover:bg-[#FAF9F6] border-[#EAE8E2]'
          }`}
          title={soundEnabled ? 'Suara notifikasi pesanan aktif' : 'Suara notifikasi pesanan dibisukan'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#C96A45]" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline text-[11px] font-mono">
            {soundEnabled ? 'Suara ON' : 'Suara OFF'}
          </span>
        </button>

        <Link
          href="/admin/pesanan"
          className="relative p-2 bg-white hover:bg-[#FAF9F6] text-[#242424] transition border border-[#EAE8E2] flex items-center justify-center"
          title="Lihat Daftar Pesanan Masuk"
        >
          <Bell className="w-4 h-4 text-[#242424]" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] text-[10px] font-bold bg-[#C96A45] text-white flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </Link>
      </div>

      {/* Floating Alert Pop-up Modal untuk Pesanan Baru Masuk */}
      {activeAlert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white p-5 shadow-xl border border-[#ECD9D0] animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-[#FAF0EB] text-[#C96A45] flex items-center justify-center shrink-0 border border-[#ECD9D0]">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-[#242424] flex items-center gap-1">
                  <span>Pesanan Baru Masuk!</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#C96A45]" />
                </h4>
                <span className="text-[10px] text-[#666666] font-mono">
                  #{activeAlert.id.slice(-8)} • {formatDateTime(activeAlert.createdAt)}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveAlert(null)}
              className="p-1 text-[#666666] hover:text-[#242424] hover:bg-[#FAF9F6]"
              title="Tutup Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 p-3 bg-[#FAF9F6] border border-[#EAE8E2] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#666666]">Pemesan:</span>
              <span className="font-medium text-[#242424]">{activeAlert.customerName || 'Pelanggan'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666666]">Metode:</span>
              <span className="font-medium text-[#C96A45]">
                {activeAlert.fulfillmentMethod === 'PICKUP' ? 'Ambil di Gerai Jeha' : 'Kirim Ekspedisi'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-[#EAE8E2]">
              <span className="text-[#666666]">Total Tagihan:</span>
              <span className="font-mono font-semibold text-sm text-[#242424]">
                {formatRupiah(activeAlert.totalAmount)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenOrder}
              className="flex-1 py-2 px-3 bg-[#C96A45] hover:bg-[#B35633] text-white text-xs font-medium transition flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-white" />
              <span>Buka Menu Pesanan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAlert(null)}
              className="py-2 px-3 bg-white hover:bg-[#FAF9F6] text-[#666666] text-xs font-medium border border-[#EAE8E2] transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
