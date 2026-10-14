'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, ShoppingBag, Check, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Product, Category } from '@/types';
import { getProducts } from '@/lib/services/productService';
import { getCategories } from '@/lib/services/categoryService';
import { formatRupiah } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { ProductImage } from '@/components/ui/ProductImage';

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialCategorySlug = searchParams.get('kategori') || '';

  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name-asc'>('default');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [prods, cats] = await Promise.all([
          getProducts({ onlyActive: true, onlyPublished: true }),
          getCategories(),
        ]);
        setProducts(prods);
        setCategories(cats);

        if (initialCategorySlug) {
          const matched = cats.find((c) => c.slug === initialCategorySlug);
          if (matched) setSelectedCatId(matched.id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [initialCategorySlug]);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock <= 0) return;

    const res = addToCart(product, 1);
    if (res.success) {
      setToastMsg(`"${product.name}" ditambahkan ke keranjang`);
      setTimeout(() => setToastMsg(null), 2500);
    } else {
      setToastMsg(res.message || 'Gagal menambahkan ke keranjang');
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  // Filter & Sort
  const filteredProducts = products
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = !selectedCatId || p.categoryId === selectedCatId;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 font-sans text-[#1A1613]">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A1613] text-[#FAF7F2] px-4 py-3 rounded-lg shadow-lg border border-[#C06A28]/30 flex items-center gap-2.5 text-xs animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-[#C06A28]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Editorial Header */}
      <div className="border-b border-[#E8E2D8] pb-6 sm:pb-8">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C06A28]" />
            <span className="text-[10px] tracking-wider uppercase text-[#C06A28] font-semibold">
              Kurasi Asli Kota Ukir Jepara
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-[#1A1613] font-medium tracking-tight">
            Katalog Produk & Kriya Daerah
          </h1>
          <p className="text-xs sm:text-sm text-[#5E5851] leading-relaxed font-light">
            Jelajahi seluruh kudapan khas pesisir, kopi robusta lereng Muria Desa Tempur, kain tenun ikat Troso, dan miniatur ukir kayu jati. Seluruh produk disajikan langsung dari dapur dan bengkel perajin Jepara.
          </p>
        </div>
      </div>

      {/* Category Pills & Search Filter */}
      <div className="space-y-4">
        {/* Horizontal Category Nav */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCatId('')}
            className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
              selectedCatId === ''
                ? 'bg-[#1A1613] text-[#FAF7F2] shadow-xs'
                : 'bg-white text-[#5E5851] hover:text-[#1A1613] border border-[#E8E2D8] hover:border-[#C06A28]'
            }`}
          >
            Semua Produk ({products.length})
          </button>
          {categories.map((c) => {
            const active = selectedCatId === c.id;
            const count = products.filter((p) => p.categoryId === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCatId(c.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-[#C06A28] text-white shadow-xs'
                    : 'bg-white text-[#5E5851] hover:text-[#1A1613] border border-[#E8E2D8] hover:border-[#C06A28]'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#8A8379] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari nama oleh-oleh, bahan, atau perajin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E8E2D8] rounded-lg text-xs text-[#1A1613] placeholder-[#8A8379] focus:outline-none focus:border-[#C06A28] focus:ring-1 focus:ring-[#C06A28] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8A8379] whitespace-nowrap">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white border border-[#E8E2D8] rounded-lg text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28] cursor-pointer"
            >
              <option value="default">Kurasi Standar</option>
              <option value="price-asc">Harga Terendah</option>
              <option value="price-desc">Harga Tertinggi</option>
              <option value="name-asc">Nama A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 pt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E8E2D8] p-3 space-y-3 animate-pulse">
              <div className="aspect-[4/5] bg-[#FAF7F2] rounded-lg" />
              <div className="h-4 bg-[#FAF7F2] rounded w-3/4" />
              <div className="h-3 bg-[#FAF7F2] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center border border-[#E8E2D8] bg-white rounded-xl p-8 space-y-3 shadow-2xs">
          <p className="font-display text-lg text-[#1A1613]">Tidak ada produk yang cocok</p>
          <p className="text-xs text-[#5E5851]">
            Coba ubah kata kunci pencarian atau pilih kategori lain.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCatId('');
            }}
            className="text-xs text-[#C06A28] hover:text-[#A8571B] underline pt-1 cursor-pointer font-medium"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 pt-4">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock > 0 && p.stock <= (p.lowStockThreshold || 5);

            return (
              <div
                key={p.id}
                className="group flex flex-col justify-between border border-[#E8E2D8] bg-white rounded-xl hover:border-[#C06A28] transition-all shadow-2xs hover:shadow-sm overflow-hidden"
              >
                <Link href={`/produk/${p.slug}`} className="block">
                  <div className="relative overflow-hidden bg-[#FAF7F2]">
                    <ProductImage
                      src={p.mainImage}
                      alt={p.name}
                      category={p.categoryName}
                      aspectRatio="portrait"
                      isCuratedNotice={true}
                    />
                    {/* Stock Badges */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded bg-[#C5221F] text-white text-[10px] font-medium">
                          Habis
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded bg-[#FEF8ED] text-[#B76500] border border-[#FEE2B8] text-[10px] font-medium">
                          Sisa {p.stock}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#8A8379] block">
                      {p.categoryName || 'Khas Jepara'}
                    </span>
                    <h3 className="font-medium text-xs sm:text-sm text-[#1A1613] group-hover:text-[#C06A28] line-clamp-2 transition-colors leading-snug">
                      {p.name}
                    </h3>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="font-mono text-sm sm:text-base font-semibold text-[#1A1613] tabular-nums">
                        {formatRupiah(p.price)}
                      </span>
                      <span className="text-[10px] text-[#8A8379] font-sans">/{p.unit}</span>
                    </div>
                  </div>
                </Link>

                <div className="p-4 pt-0">
                  <button
                    onClick={(e) => handleAddToCart(p, e)}
                    disabled={isOutOfStock}
                    className={`w-full py-2 px-3 text-xs uppercase tracking-wider font-medium border transition-colors flex items-center justify-center gap-1.5 rounded-lg cursor-pointer ${
                      isOutOfStock
                        ? 'border-[#E8E2D8] text-[#8A8379] cursor-not-allowed bg-[#FAF7F2]'
                        : 'border-[#C06A28] text-[#C06A28] hover:bg-[#C06A28] hover:text-white shadow-2xs'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{isOutOfStock ? 'Stok Habis' : '+ Keranjang'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs text-[#8A8379]">
          Memuat katalog kurasi Jeha...
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
