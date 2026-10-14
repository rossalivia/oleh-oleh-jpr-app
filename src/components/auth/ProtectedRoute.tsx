'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { ShieldAlert, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
  children,
  allowedRoles = ['customer', 'cashier', 'admin'],
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-[#242424]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C96A45] mb-3" />
        <p className="text-xs font-mono uppercase tracking-wider text-[#666666]">Memverifikasi hak akses...</p>
      </div>
    );
  }

  // Jika belum login sama sekali
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 bg-[#FAF9F6]">
        <div className="max-w-md w-full bg-white p-8 border border-[#EAE8E2] shadow-sm text-center">
          <div className="w-12 h-12 bg-[#FAF0EB] text-[#C96A45] border border-[#ECD9D0] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-display font-medium text-[#242424] mb-2">Akses Terbatas</h2>
          <p className="text-xs font-sans text-[#666666] mb-6 leading-relaxed">
            Anda harus masuk ke akun terdaftar untuk mengakses halaman ini.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 bg-[#C96A45] hover:bg-[#B35633] text-white text-xs font-sans font-medium transition cursor-pointer text-center"
            >
              Masuk Sekarang
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 px-4 bg-[#FAF9F6] hover:bg-white text-[#242424] border border-[#EAE8E2] text-xs font-sans font-medium transition text-center cursor-pointer"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Cek apakah role diizinkan
  const isAllowed = role && allowedRoles.includes(role);
  if (!isAllowed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 bg-[#FAF9F6]">
        <div className="max-w-md w-full bg-white p-8 border border-[#EAE8E2] shadow-sm text-center">
          <div className="w-12 h-12 bg-[#9B1C1C]/10 text-[#9B1C1C] border border-[#9B1C1C]/20 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-display font-medium text-[#242424] mb-2">Akses Ditolak</h2>
          <p className="text-xs font-sans text-[#666666] mb-6 leading-relaxed">
            Akun Anda ({role || 'tamu'}) tidak memiliki izin untuk membuka halaman administrasi ini.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full py-2.5 px-4 bg-[#242424] hover:bg-black text-white text-xs font-sans font-medium transition cursor-pointer text-center"
            >
              Ganti Akun
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 px-4 bg-[#FAF9F6] hover:bg-white text-[#242424] border border-[#EAE8E2] text-xs font-sans font-medium transition text-center cursor-pointer"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
