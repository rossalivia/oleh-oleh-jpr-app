'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase/config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { STORE_IDENTITY } from '@/lib/constants';
import { Lock, Mail, User, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { user, profile } = useAuth();
  const { settings } = useStoreSettings();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [roleSelection, setRoleSelection] = useState<'customer' | 'cashier' | 'admin'>('customer');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Jika sudah login, redirect sesuai role
  React.useEffect(() => {
    if (user && profile) {
      if (profile.role === 'admin' || profile.role === 'cashier') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        await updateProfile(newUser, { displayName: name });

        await setDoc(doc(db, 'users', newUser.uid), {
          uid: newUser.uid,
          email: newUser.email,
          displayName: name,
          role: roleSelection,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        toast.success(`Akun "${name}" berhasil didaftarkan`, 'Pendaftaran Berhasil');

        if (roleSelection === 'admin' || roleSelection === 'cashier') {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Selamat datang kembali di Jeha Jepara', 'Masuk Berhasil');
        router.push('/');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setErrorMsg('Email atau kata sandi tidak cocok.');
        toast.error('Email atau kata sandi tidak cocok.', 'Gagal Masuk');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Email sudah terdaftar. Silakan masuk.');
        toast.error('Email ini sudah terdaftar. Silakan masuk langsung.', 'Email Terdaftar');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Kata sandi minimal 6 karakter.');
        toast.error('Kata sandi terlalu pendek (minimal 6 karakter).', 'Kata Sandi Lemah');
      } else {
        const msg = err.message || 'Terjadi kesalahan saat otentikasi.';
        setErrorMsg(msg);
        toast.error(msg, 'Gagal');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setErrorMsg('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const userDocRef = doc(db, 'users', googleUser.uid);
      const snap = await getDoc(userDocRef);

      let targetRole: 'customer' | 'cashier' | 'admin' = 'customer';

      if (!snap.exists()) {
        targetRole = isRegister ? roleSelection : 'customer';
        await setDoc(userDocRef, {
          uid: googleUser.uid,
          email: googleUser.email || '',
          displayName: googleUser.displayName || 'Pelanggan Google',
          role: targetRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        targetRole = snap.data().role || 'customer';
      }

      toast.success(
        `Selamat datang, ${googleUser.displayName || 'Pelanggan'}!`,
        'Masuk Akun Google Berhasil'
      );

      if (targetRole === 'admin' || targetRole === 'cashier') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (err.code === 'auth/popup-blocked') {
        const msg = 'Jendela pop-up login Google diblokir peramban. Harap izinkan pop-up.';
        setErrorMsg(msg);
        toast.error(msg, 'Pop-Up Terblokir');
        return;
      }
      const msg = err.message || 'Gagal masuk menggunakan akun Google.';
      setErrorMsg(msg);
      toast.error(msg, 'Gagal Autentikasi Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] px-4 py-16">
      <div className="max-w-md w-full border border-[#EAE8E2] bg-white p-8 sm:p-10 shadow-xs space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-1">
            <div className="w-12 h-12 bg-[#FAF0EB] text-[#C96A45] font-display font-bold flex items-center justify-center text-xl border border-[#ECD9D0] shrink-0 overflow-hidden">
              {mounted && settings.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                'JH'
              )}
            </div>
          </Link>
          <h1 className="font-display text-2xl text-[#242424] font-medium tracking-tight">
            {(mounted && settings.storeName) || STORE_IDENTITY.name}
          </h1>
          <p className="text-xs text-[#666666] font-mono uppercase tracking-wider">
            {isRegister ? 'Pendaftaran Akun Baru' : 'Masuk ke Akun Toko'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] text-xs">
            {errorMsg}
          </div>
        )}

        {/* Tab Masuk / Daftar */}
        <div className="grid grid-cols-2 border border-[#EAE8E2]">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg('');
            }}
            className={`py-2 text-xs uppercase tracking-wider font-medium transition-colors ${
              !isRegister
                ? 'bg-[#242424] text-white'
                : 'bg-white text-[#666666] hover:text-[#242424]'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg('');
            }}
            className={`py-2 text-xs uppercase tracking-wider font-medium transition-colors ${
              isRegister
                ? 'bg-[#242424] text-white'
                : 'bg-white text-[#666666] hover:text-[#242424]'
            }`}
          >
            Daftar
          </button>
        </div>

        {/* Google Auth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading || googleLoading}
          className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF9F6] text-[#242424] font-medium text-xs border border-[#EAE8E2] transition flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#C96A45]" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.41 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.41l4.03-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.59 1.25 6.59l4.03 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
              />
            </svg>
          )}
          <span>Lanjutkan dengan Akun Google</span>
        </button>

        <div className="relative flex items-center justify-center text-[10px] uppercase font-mono tracking-widest text-[#666666]">
          <span className="bg-white px-2">Atau gunakan email</span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block text-[#242424] font-medium mb-1">Nama Lengkap</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama pemesan"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAE8E2] text-[#242424] focus:outline-none focus:border-[#C96A45]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#242424] font-medium mb-1">Alamat Email</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@domain.com"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAE8E2] text-[#242424] focus:outline-none focus:border-[#C96A45]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#242424] font-medium mb-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAE8E2] text-[#242424] focus:outline-none focus:border-[#C96A45]"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-[#242424] font-medium mb-1">Peran Akses</label>
              <select
                value={roleSelection}
                onChange={(e) => setRoleSelection(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-[#EAE8E2] text-xs text-[#242424] focus:outline-none focus:border-[#C96A45]"
              >
                <option value="customer">Pelanggan Toko</option>
                <option value="cashier">Staf Kasir (PoS)</option>
                <option value="admin">Administrator Toko</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#C96A45] hover:bg-[#B35633] text-white text-xs uppercase tracking-wider font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <span>{isRegister ? 'Daftar Akun Baru' : 'Masuk ke Akun'}</span>
            )}
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link href="/" className="text-xs text-[#666666] hover:text-[#C96A45] transition-colors">
            ← Kembali ke Beranda Toko
          </Link>
        </div>
      </div>
    </div>
  );
}
