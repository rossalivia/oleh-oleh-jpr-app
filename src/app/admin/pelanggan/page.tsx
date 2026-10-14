'use client';

import React, { useEffect, useState } from 'react';
import { Users, Search, Mail, Phone, Shield, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function DataPelangganPage() {
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadUsers() {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const list: UserProfile[] = [];
        snap.forEach((doc) => {
          list.push({ uid: doc.id, ...doc.data() } as UserProfile);
        });
        setUsersList(list);
      } catch (err) {
        console.warn('Gagal memuat users:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const filteredUsers = usersList.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phoneNumber && u.phoneNumber.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C06A28]"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#C06A28] font-semibold">
              Basis Data Pengguna & Pelanggan
            </span>
          </div>
          <h1 className="font-display font-medium text-2xl text-[#1A1613] tracking-tight mt-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C06A28]" />
            <span>Data Pelanggan & Pengguna</span>
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#7A7067] mt-0.5">
            Daftar akun pelanggan terdaftar dan staf toko yang memiliki akses sistem.
          </p>
        </div>

        <span className="font-mono text-xs text-[#7A7067] bg-[#FAF7F2] px-3.5 py-1.5 rounded-xl border border-[#E8E2D8] self-start sm:self-auto shadow-xs">
          Total: <span className="font-semibold text-[#1A1613]">{usersList.length}</span> Akun
        </span>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#A89F91] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama pelanggan, email, atau no telepon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs font-sans text-[#1A1613] placeholder:text-[#A89F91] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Users Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E8E2D8] text-[#7A7067] font-mono uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-5">Nama Pengguna</th>
                <th className="py-3.5 px-4">Alamat Email</th>
                <th className="py-3.5 px-4">No. Telepon / WhatsApp</th>
                <th className="py-3.5 px-4">Peran (Role)</th>
                <th className="py-3.5 px-5">Terdaftar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-[#7A7067]">
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-[#C06A28] border-t-transparent rounded-full mb-2"></div>
                    <p>Memuat data pengguna...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-[#7A7067]">
                    <Users className="w-8 h-8 text-[#A89F91] mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-[#1A1613]">Belum ada data pelanggan yang cocok</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-[#FAF7F2]/60 transition">
                    <td className="py-3.5 px-5 font-medium text-[#1A1613]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FAF0E6] text-[#C06A28] font-semibold text-xs flex items-center justify-center border border-[#ECD9C6]">
                          {(u.displayName || 'P').charAt(0).toUpperCase()}
                        </div>
                        <span>{u.displayName || 'Pelanggan'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#7A7067] font-mono text-[11px]">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4 text-[#7A7067]">
                      {u.phoneNumber || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-mono font-medium rounded-full border ${
                          u.role === 'admin'
                            ? 'bg-[#1A1613] text-white border-[#1A1613]'
                            : u.role === 'cashier'
                            ? 'bg-[#FAF0E6] text-[#C06A28] border-[#ECD9C6]'
                            : 'bg-[#FAF7F2] text-[#7A7067] border-[#E8E2D8]'
                        }`}
                      >
                        {u.role || 'customer'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[#A89F91] font-mono text-[11px]">
                      {u.createdAt ? formatDateTime(u.createdAt) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Alternative View */}
        <div className="block md:hidden divide-y divide-[#E8E2D8] p-3 space-y-3">
          {loading ? (
            <p className="text-center py-8 text-[#7A7067] text-xs">Memuat data pengguna...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center py-8 text-[#7A7067] text-xs">Belum ada data pelanggan yang cocok.</p>
          ) : (
            filteredUsers.map((u) => (
              <div key={u.uid} className="pt-3 first:pt-0 bg-white rounded-xl p-3 border border-[#E8E2D8] space-y-2 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#FAF0E6] text-[#C06A28] font-semibold text-xs flex items-center justify-center border border-[#ECD9C6] shrink-0">
                      {(u.displayName || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-xs text-[#1A1613]">{u.displayName || 'Pelanggan'}</h4>
                      <span className="text-[10px] font-mono text-[#A89F91] block">{u.email}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-medium shrink-0 rounded-full border ${
                      u.role === 'admin'
                        ? 'bg-[#1A1613] text-white border-[#1A1613]'
                        : u.role === 'cashier'
                        ? 'bg-[#FAF0E6] text-[#C06A28] border-[#ECD9C6]'
                        : 'bg-[#FAF7F2] text-[#7A7067] border-[#E8E2D8]'
                    }`}
                  >
                    {u.role || 'customer'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#7A7067] bg-[#FAF7F2] rounded-lg px-2.5 py-1.5 border border-[#E8E2D8]">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#A89F91]" />
                    <span>{u.phoneNumber || 'Tanpa No. HP'}</span>
                  </span>
                  <span className="text-[10px] text-[#A89F91] font-mono">
                    {u.createdAt ? formatDateTime(u.createdAt) : '-'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
