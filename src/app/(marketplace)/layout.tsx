import React, { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#242424]">
      <Suspense fallback={<div className="h-16 bg-white border-b border-[#EAE8E2]" />}>
        <Navbar />
      </Suspense>
      <main className="flex-1 pb-16 md:pb-0">
        <Suspense fallback={<div className="p-8 text-center text-xs">Memuat...</div>}>
          {children}
        </Suspense>
      </main>
      <Footer />
      <Suspense fallback={null}>
        <MobileBottomNav />
      </Suspense>
    </div>
  );
}

