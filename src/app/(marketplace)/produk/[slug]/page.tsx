'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  Check,
  ShieldCheck,
  MapPin,
  Minus,
  Plus,
  Loader2,
  ArrowLeft,
  Truck,
  Store,
  Sparkles,
} from 'lucide-react';
import { Product } from '@/types';
import { getProductBySlug } from '@/lib/services/productService';
import { formatRupiah } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { STORE_IDENTITY } from '@/lib/constants';
import { ProductImage } from '@/components/ui/ProductImage';

function DetailProdukContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      setLoading(true);
      try {
        const p = await getProductBySlug(slug);
        setProduct(p);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-[#1A1613]">
        <Loader2 className="w-6 h-6 animate-spin text-[#C06A28] mb-2" />
        <p className="text-xs text-[#5E5851]">Memuat rincian produk khas Jepara...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="font-display text-2xl text-[#1A1613]">Produk Tidak Ditemukan</h2>
        <p className="text-xs text-[#5E5851]">
          Produk yang Anda cari mungkin telah diarsipkan atau belum dipublikasikan di katalog.
        </p>
        <Link
          href="/katalog"
          className="inline-block px-5 py-2.5 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs uppercase tracking-wider font-medium rounded-lg transition shadow-xs"
        >
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || STORE_IDENTITY.defaultLowStockThreshold);

  const handleAdd = () => {
    if (isOutOfStock) return;
    const res = addToCart(product, quantity);
    if (res.success) {
      setToastMsg(`${quantity} ${product.unit} "${product.name}" ditambahkan ke keranjang`);
      setTimeout(() => setToastMsg(null), 2500);
    } else {
      setToastMsg(res.message || 'Gagal menambahkan');
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    router.push('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-8 font-sans text-[#1A1613]">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A1613] text-[#FAF7F2] px-4 py-3 rounded-lg shadow-lg border border-[#C06A28]/30 flex items-center gap-2.5 text-xs animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-[#C06A28]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Back to Catalog Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#8A8379]">
        <Link href="/katalog" className="hover:text-[#C06A28] transition-colors flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Katalog Produk</span>
        </Link>
        <span>/</span>
        <span className="text-[#5E5851]">{product.categoryName || 'Khas Jepara'}</span>
        <span>/</span>
        <span className="text-[#1A1613] truncate max-w-xs font-semibold">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left Column: Product Frame */}
        <div className="lg:col-span-6">
          <div className="border border-[#E8E2D8] bg-white rounded-2xl overflow-hidden shadow-2xs sticky top-24">
            <ProductImage
              src={product.mainImage}
              alt={product.name}
              category={product.categoryName}
              aspectRatio="portrait"
              isCuratedNotice={true}
            />
          </div>
        </div>

        {/* Right Column: Narrative & Order Form */}
        <div className="lg:col-span-6 space-y-7">
          <div className="space-y-3 pb-6 border-b border-[#E8E2D8]">
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase tracking-wider font-mono text-[11px] text-[#C06A28] font-semibold bg-[#FDF5ED] px-2.5 py-0.5 rounded border border-[#F3DEC9]">
                {product.categoryName || 'Khas Jepara'}
              </span>
              <span className="font-mono text-[11px] text-[#8A8379]">SKU: {product.sku}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-[#1A1613] font-medium tracking-tight leading-snug">
              {product.name}
            </h1>

            <div className="pt-1 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-[#1A1613] tabular-nums">
                {formatRupiah(product.price)}
              </span>
              <span className="text-xs text-[#8A8379]">/{product.unit}</span>
            </div>

            {/* Stock Indicator */}
            <div className="pt-1">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#FDF2F2] text-[#C5221F] border border-[#F8B4B4] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5221F]" />
                  <span>Stok Habis di Gerai</span>
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#FEF8ED] text-[#B76500] border border-[#FEE2B8] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B76500] animate-pulse" />
                  <span>Stok Terbatas (Tersisa {product.stock} {product.unit})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#F0F9F1] text-[#1E7E34] border border-[#C3E6CB] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E7E34]" />
                  <span>Tersedia Siap Ambil / Kirim ({product.stock} {product.unit})</span>
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#8A8379] font-medium">
              Deskripsi & Komposisi Tradisi
            </h3>
            <p className="text-xs sm:text-sm text-[#484848] leading-relaxed whitespace-pre-line font-light">
              {product.description}
            </p>
          </div>

          {/* Quantity Selector & Action Buttons */}
          <div className="border border-[#E8E2D8] bg-white rounded-xl p-6 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#1A1613] uppercase tracking-wider">
                Jumlah Pesanan:
              </span>
              <div className="flex items-center border border-[#E8E2D8] rounded-lg bg-[#FAF7F2]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="w-9 h-9 flex items-center justify-center text-[#1A1613] hover:bg-white disabled:opacity-30 transition rounded-l-lg cursor-pointer"
                  aria-label="Kurangi kuantitas"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-12 text-center font-semibold text-xs tabular-nums text-[#1A1613]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock || isOutOfStock}
                  className="w-9 h-9 flex items-center justify-center text-[#1A1613] hover:bg-white disabled:opacity-30 transition rounded-r-lg cursor-pointer"
                  aria-label="Tambah kuantitas"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-3 border-t border-[#E8E2D8] text-xs">
              <span className="text-[#8A8379]">Subtotal Produk:</span>
              <span className="font-mono text-xl font-bold text-[#1A1613] tabular-nums">
                {formatRupiah(product.price * quantity)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className="py-3 px-4 border border-[#C06A28] text-[#C06A28] hover:bg-[#FDF5ED] text-xs uppercase tracking-wider font-medium transition-colors flex items-center justify-center gap-1.5 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>+ Keranjang</span>
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="py-3 px-4 bg-[#C06A28] hover:bg-[#A8571B] text-white text-xs uppercase tracking-wider font-medium transition-colors rounded-lg disabled:opacity-40 shadow-xs cursor-pointer"
              >
                Beli Sekarang
              </button>
            </div>
          </div>

          {/* Reassurance Notes */}
          <div className="border border-[#E8E2D8] bg-[#FAF7F2] rounded-xl p-5 space-y-3 text-xs text-[#5E5851]">
            <div className="flex items-center gap-2 text-[#1A1613] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#C06A28]" />
              <span>Jaminan Mutu Asli Jepara</span>
            </div>
            <div className="space-y-1.5 text-[11px] leading-relaxed">
              <div className="flex items-start gap-2">
                <Store className="w-3.5 h-3.5 text-[#C06A28] shrink-0 mt-0.5" />
                <span><strong>Bebas Ongkir:</strong> Dapat diambil langsung di gerai Pengkol Jepara.</span>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="w-3.5 h-3.5 text-[#C06A28] shrink-0 mt-0.5" />
                <span><strong>Kirim Ekspedisi:</strong> Dikemas dengan bubble wrap tebal dan kardus kokoh ke seluruh Indonesia.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Purchase Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8E2D8] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-[#8A8379] block uppercase tracking-wider font-mono">
              Total ({quantity} {product.unit})
            </span>
            <span className="font-mono text-base font-bold text-[#1A1613] tabular-nums block truncate">
              {formatRupiah(product.price * quantity)}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center border border-[#E8E2D8] rounded-lg bg-[#FAF7F2] h-9">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                className="w-7 h-full flex items-center justify-center text-[#1A1613] disabled:opacity-30 cursor-pointer"
                aria-label="Kurangi kuantitas"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center font-bold text-xs tabular-nums text-[#1A1613]">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock || isOutOfStock}
                className="w-7 h-full flex items-center justify-center text-[#1A1613] disabled:opacity-30 cursor-pointer"
                aria-label="Tambah kuantitas"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className="h-9 px-3 border border-[#C06A28] text-[#C06A28] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-[#FDF5ED] disabled:opacity-40 cursor-pointer transition-colors"
              title="Tambah ke Keranjang"
              aria-label="Tambah ke Keranjang"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="h-9 px-3.5 bg-[#C06A28] hover:bg-[#A8571B] text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-40 whitespace-nowrap cursor-pointer transition-colors"
            >
              Beli Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DetailProdukPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center p-12 text-center text-xs text-[#8A8379]">
          Memuat rincian produk...
        </div>
      }
    >
      <DetailProdukContent />
    </React.Suspense>
  );
}
