'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatRupiah } from '@/lib/utils';
import { ProductImage } from '@/components/ui/ProductImage';

export default function KeranjangPage() {
  const { items, updateQuantity, removeFromCart, clearCart, subtotal, totalQuantity } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 sm:py-28 px-4 text-center space-y-4 font-sans text-[#1A1613]">
        <div className="w-16 h-16 bg-white text-[#C06A28] flex items-center justify-center mx-auto border border-[#E8E2D8] rounded-2xl shadow-2xs">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-medium text-[#1A1613]">
          Keranjang Belanja Anda Kosong
        </h1>
        <p className="text-xs sm:text-sm text-[#5E5851] max-w-sm mx-auto leading-relaxed font-light">
          Belum ada oleh-oleh khas Jepara yang dipilih. Silakan jelajahi ragam kuliner tradisional dan kriya seni kota ukir kami.
        </p>
        <div className="pt-3">
          <Link
            href="/katalog"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs uppercase tracking-wider font-medium transition-colors rounded-lg shadow-xs cursor-pointer"
          >
            <span>Mulai Pilih Produk</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8 font-sans text-[#1A1613]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E8E2D8] pb-5">
        <div>
          <span className="text-[10px] tracking-wider uppercase text-[#C06A28] block font-semibold">
            Pemeriksaan Pesanan
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-[#1A1613] font-medium tracking-tight">
            Keranjang Belanja
          </h1>
          <p className="text-xs text-[#5E5851] mt-1 font-light">
            {totalQuantity} item terpilih dari gerai Jeha Jepara
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-[#C5221F] hover:underline transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Kosongkan Keranjang</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-8 border border-[#E8E2D8] rounded-xl divide-y divide-[#E8E2D8] bg-white overflow-hidden shadow-2xs">
          {items.map(({ product, quantity }) => {
            const itemSubtotal = product.price * quantity;
            return (
              <div
                key={product.id}
                className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 border border-[#E8E2D8] rounded-lg overflow-hidden shrink-0 bg-[#FAF7F2]">
                    <ProductImage
                      src={product.mainImage}
                      alt={product.name}
                      category={product.categoryName}
                      aspectRatio="square"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-[#8A8379] block">
                      {product.categoryName || 'Khas Jepara'}
                    </span>
                    <Link
                      href={`/produk/${product.slug}`}
                      className="font-medium text-xs sm:text-sm text-[#1A1613] hover:text-[#C06A28] line-clamp-1 transition-colors"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-[#5E5851] tabular-nums font-mono">
                      {formatRupiah(product.price)} / {product.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8E2D8]">
                  {/* Quantity Controller */}
                  <div className="flex items-center border border-[#E8E2D8] rounded-lg bg-[#FAF7F2]">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-[#1A1613] hover:bg-white rounded-l-lg transition cursor-pointer"
                      aria-label="Kurangi kuantitas"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-semibold tabular-nums text-[#1A1613]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      disabled={quantity >= product.stock}
                      className="w-8 h-8 flex items-center justify-center text-[#1A1613] hover:bg-white disabled:opacity-30 rounded-r-lg transition cursor-pointer"
                      aria-label="Tambah kuantitas"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total & Remove */}
                  <div className="text-right min-w-[90px]">
                    <span className="font-semibold text-xs sm:text-sm text-[#1A1613] tabular-nums font-mono block">
                      {formatRupiah(itemSubtotal)}
                    </span>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-[11px] text-[#C5221F] hover:underline transition mt-0.5 cursor-pointer font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Column */}
        <div className="lg:col-span-4 border border-[#E8E2D8] bg-white rounded-xl p-6 sm:p-7 space-y-6 shadow-2xs">
          <h2 className="font-display text-lg text-[#1A1613] font-medium border-b border-[#E8E2D8] pb-3">
            Ringkasan Pesanan
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-[#5E5851]">
              <span>Total Kuantitas</span>
              <span className="font-medium text-[#1A1613]">{totalQuantity} item</span>
            </div>
            <div className="flex justify-between text-[#5E5851]">
              <span>Subtotal Produk</span>
              <span className="font-semibold text-[#1A1613] tabular-nums font-mono">
                {formatRupiah(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#5E5851]">
              <span>Biaya Pengambilan / Kirim</span>
              <span className="text-[#8A8379]">Dihitung di checkout</span>
            </div>

            <div className="border-t border-[#E8E2D8] pt-4 flex justify-between items-baseline">
              <span className="font-medium text-[#1A1613] text-sm">Perkiraan Total</span>
              <span className="text-xl font-bold text-[#1A1613] tabular-nums font-mono">
                {formatRupiah(subtotal)}
              </span>
            </div>
          </div>

          <div className="pt-1 space-y-2.5">
            <Link
              href="/checkout"
              className="w-full py-3.5 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs uppercase tracking-wider font-medium transition-colors flex items-center justify-center gap-2 rounded-lg shadow-xs cursor-pointer"
            >
              <span>Lanjut ke Formulir Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/katalog"
              className="w-full py-2.5 text-center text-xs text-[#5E5851] hover:text-[#1A1613] font-medium transition-colors block"
            >
              ← Lanjut Belanja Oleh-Oleh Lain
            </Link>
          </div>

          <p className="text-[11px] text-[#8A8379] border-t border-[#E8E2D8] pt-4 leading-relaxed font-light">
            Stok barang akan otomatis tereservasi selama 60 menit setelah pesanan berhasil diterbitkan di checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
