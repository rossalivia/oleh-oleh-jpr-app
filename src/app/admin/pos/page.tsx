'use client';

import React, { useEffect, useState } from 'react';
import {
  Calculator,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  DollarSign,
  QrCode,
  ArrowRight,
  RotateCcw,
  Store,
  Loader2,
  AlertCircle,
  X,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { Product, Category, Transaction } from '@/types';
import { getProducts } from '@/lib/services/productService';
import { getCategories } from '@/lib/services/categoryService';
import { createPosTransaction } from '@/lib/services/posService';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { STORE_IDENTITY } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { ProductImage } from '@/components/ui/ProductImage';

interface PosCartItem {
  product: Product;
  quantity: number;
}

export default function PointOfSalePage() {
  const { user, profile } = useAuth();
  const { settings } = useStoreSettings();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');

  // Keranjang Kasir
  const [cart, setCart] = useState<PosCartItem[]>([]);

  // Pembayaran Kasir
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'TRANSFER'>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferRef, setTransferRef] = useState<string>('');
  const [qrisRef, setQrisRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submittingTrx, setSubmittingTrx] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Set default bank destination when settings load
  useEffect(() => {
    if (settings.bankAccounts && settings.bankAccounts.length > 0 && !selectedBank) {
      setSelectedBank(`${settings.bankAccounts[0].bankName} - ${settings.bankAccounts[0].accountNumber} (a.n. ${settings.bankAccounts[0].accountHolder})`);
    } else if (!selectedBank) {
      setSelectedBank('BCA - 821-098-7654 (a.n. Oleh Oleh Khas Jepara Jeha)');
    }
  }, [settings.bankAccounts, selectedBank]);

  // Modal Struk Selesai
  const [completedTrx, setCompletedTrx] = useState<Transaction | null>(null);

  const loadCatalog = async () => {
    setLoadingProducts(true);
    try {
      const [prods, cats] = await Promise.all([
        getProducts({ onlyActive: true }),
        getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    const existingIndex = cart.findIndex((i) => i.product.id === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > product.stock) {
        setErrorMsg(`Stok "${product.name}" hanya tersisa ${product.stock} ${product.unit}.`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity = currentQty + 1;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    setErrorMsg('');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const existing = cart.find((i) => i.product.id === productId);
    if (!existing) return;

    if (quantity <= 0) {
      setCart(cart.filter((i) => i.product.id !== productId));
      return;
    }

    if (quantity > existing.product.stock) {
      setErrorMsg(`Stok "${existing.product.name}" maksimal ${existing.product.stock} ${existing.product.unit}.`);
      return;
    }

    setCart(cart.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
    setErrorMsg('');
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived(0);
    setTransferAmount(0);
    setTransferRef('');
    setQrisRef('');
    setNotes('');
    setErrorMsg('');
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const changeAmount = Math.max(0, cashReceived - totalAmount);

  // Sync transfer amount when totalAmount changes if not customized
  useEffect(() => {
    if (totalAmount > 0 && transferAmount === 0) {
      setTransferAmount(totalAmount);
    }
  }, [totalAmount]);

  // Quick cash buttons
  const quickCashOptions = [
    totalAmount,
    Math.ceil(totalAmount / 10000) * 10000,
    Math.ceil(totalAmount / 50000) * 50000,
    100000,
  ].filter((v, idx, arr) => v >= totalAmount && arr.indexOf(v) === idx && v > 0);

  const handleFinishTransaction = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'CASH' && cashReceived < totalAmount) {
      const warnTxt = `Uang tunai diterima (${formatRupiah(cashReceived)}) kurang dari total belanja (${formatRupiah(totalAmount)}).`;
      setErrorMsg(warnTxt);
      toast.warning(warnTxt, 'Uang Kurang');
      return;
    }

    if (paymentMethod === 'TRANSFER' && transferAmount > 0 && transferAmount < totalAmount) {
      const warnTxt = `Nominal transfer (${formatRupiah(transferAmount)}) kurang dari total belanja (${formatRupiah(totalAmount)}).`;
      setErrorMsg(warnTxt);
      toast.warning(warnTxt, 'Nominal Transfer Kurang');
      return;
    }

    setSubmittingTrx(true);
    setErrorMsg('');

    try {
      const cashierName = profile?.displayName || user?.displayName || 'Kasir Staf';
      const cashierId = user?.uid || 'CASHIER_DEFAULT';
      const finalTransferAmount = transferAmount > 0 ? transferAmount : totalAmount;

      const res = await createPosTransaction({
        cashierId,
        cashierName,
        items: cart,
        paymentMethod,
        cashReceived: paymentMethod === 'CASH' ? cashReceived : finalTransferAmount,
        bankDestination: paymentMethod === 'TRANSFER' ? (selectedBank || 'BCA - 821-098-7654') : undefined,
        transferReference: paymentMethod === 'TRANSFER' ? transferRef.trim() : (paymentMethod === 'QRIS' ? qrisRef.trim() : undefined),
        notes: notes.trim() || undefined,
      });

      if (!res.success || !res.transaction) {
        const failTxt = res.message || 'Gagal memproses transaksi kasir.';
        setErrorMsg(failTxt);
        toast.error(failTxt, 'Transaksi Gagal');
      } else {
        toast.success(`Transaksi kasir senilai ${formatRupiah(totalAmount)} berhasil dicatat!`, 'Penjualan Selesai');
        setCompletedTrx(res.transaction);
        clearCart();
        loadCatalog();
      }
    } catch (err: any) {
      const errTxt = err.message || 'Terjadi kesalahan sistem saat transaksi.';
      setErrorMsg(errTxt);
      toast.error(errTxt, 'Kesalahan Sistem');
    } finally {
      setSubmittingTrx(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = !selectedCatId || p.categoryId === selectedCatId;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C06A28] animate-pulse"></span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#C06A28] font-bold">
              Terminal Kasir Langsung • Gerai Fisik Jepara
            </span>
          </div>
          <h1 className="font-display text-2xl text-[#1A1613] font-semibold tracking-tight mt-1 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#C06A28]" />
            <span>Kasir Digital Point of Sale</span>
          </h1>
          <p className="font-sans text-xs text-[#5C5248] mt-0.5 font-light">
            Gerai: <span className="font-semibold text-[#1A1613]">{STORE_IDENTITY.name}</span> • Staf: <span className="font-semibold text-[#1A1613]">{profile?.displayName || 'Staf Kasir'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#5C5248] bg-[#FAF7F2] px-3.5 py-1.5 border border-[#E8E2D8] rounded-xl shadow-xs">
          <Receipt className="w-3.5 h-3.5 text-[#C06A28]" />
          <span className="font-semibold">Printer Termal Siap</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50/80 border border-red-200 text-[#9B1C1C] text-xs flex items-center gap-2.5 rounded-xl shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span className="font-sans font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Kolom Kiri Katalog Produk Kasir & Kolom Kanan Nota Belanja */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Katalog Cepat */}
        <div className="lg:col-span-7 space-y-4">
          {/* Bar Pencarian & Filter Kategori */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C827A] absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Pindai barcode / cari SKU / nama oleh-oleh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#FAF7F2]/50 border border-[#E8E2D8] rounded-xl text-xs font-sans text-[#1A1613] placeholder:text-[#8C827A] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
              />
            </div>

            {/* Category Filter Horizontal Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => setSelectedCatId('')}
                className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-lg transition cursor-pointer ${
                  !selectedCatId
                    ? 'bg-[#1A1613] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5C5248] hover:text-[#1A1613] hover:bg-[#FDF9F5] border border-[#E8E2D8]'
                }`}
              >
                Semua Kategori
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCatId(c.id)}
                  className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-lg transition cursor-pointer ${
                    selectedCatId === c.id
                      ? 'bg-[#C06A28] text-white shadow-xs'
                      : 'bg-[#FAF7F2] text-[#5C5248] hover:text-[#1A1613] hover:bg-[#FDF9F5] border border-[#E8E2D8]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Produk Kasir */}
          {loadingProducts ? (
            <div className="p-16 text-center text-[#5C5248] text-xs bg-white border border-[#E8E2D8] rounded-2xl shadow-xs">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C06A28]" />
              <span>Memuat katalog produk kasir...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white p-12 text-center text-[#5C5248] text-xs border border-[#E8E2D8] rounded-2xl shadow-xs">
              Tidak ada produk yang cocok dengan pencarian kasir.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    className={`bg-white border rounded-2xl text-left p-3 flex flex-col justify-between transition cursor-pointer group shadow-xs ${
                      isOutOfStock
                        ? 'border-[#E8E2D8] opacity-50 cursor-not-allowed bg-[#FAF7F2]'
                        : 'border-[#E8E2D8] hover:border-[#C06A28] hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="relative aspect-square w-full bg-[#FAF7F2] rounded-xl overflow-hidden mb-2 border border-[#E8E2D8]">
                        <ProductImage
                          src={p.mainImage}
                          alt={p.name}
                          aspectRatio="square"
                          category={p.categoryName}
                        />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#1A1613]/90 text-white z-10 rounded">
                          {p.sku}
                        </span>
                      </div>
                      <h4 className="font-display text-xs text-[#1A1613] font-semibold line-clamp-1 group-hover:text-[#C06A28] transition">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#F0EBE1] flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#1A1613] tabular-nums">
                        {formatRupiah(p.price)}
                      </span>
                      <span className={`font-mono text-[10px] ${isOutOfStock ? 'text-rose-600 font-bold' : 'text-[#8C827A]'}`}>
                        {isOutOfStock ? 'Habis' : `${p.stock} ${p.unit}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Nota Keranjang Kasir & Input Pembayaran */}
        <div className="lg:col-span-5 bg-white border border-[#E8E2D8] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs sticky top-20">
          <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
            <h2 className="font-display text-sm text-[#1A1613] tracking-wide font-semibold">
              Daftar Belanja Pelanggan ({cart.length})
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="font-mono text-[11px] text-[#8C827A] hover:text-[#C62828] flex items-center gap-1 cursor-pointer font-medium transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>Kosongkan</span>
              </button>
            )}
          </div>

          {/* Cart Item Rows */}
          {cart.length === 0 ? (
            <div className="py-12 text-center text-[#5C5248] text-xs space-y-2 bg-[#FAF7F2] border border-dashed border-[#E8E2D8] rounded-xl p-6">
              <Calculator className="w-6 h-6 mx-auto text-[#C06A28]" />
              <p className="font-display text-sm text-[#1A1613] font-semibold">Keranjang kasir masih kosong</p>
              <p className="text-[11px] text-[#5C5248]">Pilih produk di sebelah kiri untuk menambah ke transaksi gerai.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between text-xs py-2 border-b border-[#F0EBE1]">
                  <div className="max-w-[170px]">
                    <p className="font-display text-xs font-semibold text-[#1A1613] truncate">{product.name}</p>
                    <p className="font-mono text-[10px] text-[#8C827A]">
                      {formatRupiah(product.price)} / {product.unit}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center border border-[#E8E2D8] bg-[#FAF7F2] rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-6 h-6 hover:bg-white text-[#1A1613] flex items-center justify-center transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-mono font-bold text-xs text-[#1A1613]">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.stock}
                        className="w-6 h-6 hover:bg-white text-[#1A1613] flex items-center justify-center disabled:opacity-40 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-mono font-bold text-[#1A1613] w-18 text-right tabular-nums text-xs">
                      {formatRupiah(product.price * quantity)}
                    </span>

                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-[#8C827A] hover:text-[#C62828] p-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subtotal & Total Ledger */}
          <div className="border border-[#E8E2D8] rounded-xl bg-[#FAF7F2] p-4">
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#5C5248] font-bold">
                Total Tagihan Kasir
              </span>
              <span className="font-mono text-2xl font-bold text-[#C06A28] tabular-nums">
                {formatRupiah(totalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Method Switcher */}
          <div className="space-y-3 pt-2 text-xs">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-[#5C5248] font-bold">
              Metode Pembayaran Kasir
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 px-2 text-xs font-sans font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'bg-[#1A1613] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5C5248] hover:text-[#1A1613] border border-[#E8E2D8]'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('QRIS')}
                className={`py-2 px-2 text-xs font-sans font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'QRIS'
                    ? 'bg-[#1A1613] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5C5248] hover:text-[#1A1613] border border-[#E8E2D8]'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`py-2 px-2 text-xs font-sans font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'TRANSFER'
                    ? 'bg-[#1A1613] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5C5248] hover:text-[#1A1613] border border-[#E8E2D8]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Transfer</span>
              </button>
            </div>

            {/* Input Tunai & Kembalian jika Tunai */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-3 pt-2 bg-[#FAF7F2] p-4 border border-[#E8E2D8] rounded-xl">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#5C5248] font-bold mb-1">
                    Uang Tunai Diterima (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-[#E8E2D8] rounded-xl font-mono font-bold text-sm text-[#1A1613] focus:outline-none focus:border-[#C06A28]"
                  />
                </div>

                {/* Quick cash pills */}
                {totalAmount > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {quickCashOptions.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCashReceived(opt)}
                        className="px-2.5 py-1 bg-white hover:bg-[#FDF9F5] hover:border-[#C06A28] text-[#1A1613] font-mono text-[11px] font-semibold border border-[#E8E2D8] rounded-lg transition cursor-pointer shadow-xs"
                      >
                        {formatRupiah(opt)}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-baseline text-xs pt-2 border-t border-[#E8E2D8]">
                  <span className="font-mono text-[11px] text-[#5C5248] font-bold">Kembalian:</span>
                  <span className="font-mono font-bold text-base text-[#2E7D32] tabular-nums">
                    {formatRupiah(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Input Transfer Bank di Kasir */}
            {paymentMethod === 'TRANSFER' && (
              <div className="space-y-3 pt-2 bg-[#FAF7F2] p-4 border border-[#E8E2D8] rounded-xl">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#5C5248] font-bold mb-1">
                    Rekening Bank Tujuan Toko *
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28] cursor-pointer font-medium"
                  >
                    {settings.bankAccounts && settings.bankAccounts.length > 0 ? (
                      settings.bankAccounts.map((b, idx) => (
                        <option key={idx} value={`${b.bankName} - ${b.accountNumber} (a.n. ${b.accountHolder})`}>
                          {b.bankName} - {b.accountNumber} ({b.accountHolder})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="BCA - 821-098-7654 (a.n. Oleh Oleh Khas Jepara Jeha)">
                          BCA - 821-098-7654 (a.n. Toko Jeha)
                        </option>
                        <option value="Bank Jateng - 3-002-12345-6 (a.n. Oleh Oleh Khas Jepara Jeha)">
                          Bank Jateng - 3-002-12345-6 (a.n. Toko Jeha)
                        </option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#5C5248] font-bold">
                      Nominal yang Ditransfer (Rp) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setTransferAmount(totalAmount)}
                      className="text-[10px] text-[#C06A28] hover:underline cursor-pointer font-bold"
                    >
                      Sesuai Total ({formatRupiah(totalAmount)})
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={transferAmount || ''}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    placeholder={String(totalAmount)}
                    className="w-full px-3 py-2 bg-white border border-[#E8E2D8] rounded-xl font-mono font-bold text-sm text-[#1A1613] focus:outline-none focus:border-[#C06A28]"
                  />
                  <p className="text-[10px] text-[#8C827A] mt-1 font-light">
                    Total tagihan belanja kasir: <strong className="text-[#1A1613]">{formatRupiah(totalAmount)}</strong>
                  </p>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#5C5248] font-bold mb-1">
                    No. Referensi / Nama Pengirim (Opsional)
                  </label>
                  <input
                    type="text"
                    value={transferRef}
                    onChange={(e) => setTransferRef(e.target.value)}
                    placeholder="Contoh: Ref BCA 12345 / Pak Budi"
                    className="w-full px-3 py-2 bg-white border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28]"
                  />
                </div>
              </div>
            )}

            {/* Input QRIS di Kasir */}
            {paymentMethod === 'QRIS' && (
              <div className="space-y-3 pt-2 bg-[#FAF7F2] p-4 border border-[#E8E2D8] rounded-xl">
                <div className="p-3 bg-white border border-[#E8E2D8] rounded-xl text-center space-y-1 shadow-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] block font-bold">
                    Total Pembayaran QRIS
                  </span>
                  <p className="font-mono text-xl font-bold text-[#1A1613]">{formatRupiah(totalAmount)}</p>
                  <p className="text-[10px] text-[#5C5248] font-light">
                    Arahkan pelanggan scan stiker / layar QRIS toko di meja kasir.
                  </p>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#5C5248] font-bold mb-1">
                    ID Transaksi QRIS / Approval Code / RRN (Opsional)
                  </label>
                  <input
                    type="text"
                    value={qrisRef}
                    onChange={(e) => setQrisRef(e.target.value)}
                    placeholder="Contoh: RRN-20261014-9988"
                    className="w-full px-3 py-2 bg-white border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28]"
                  />
                </div>
              </div>
            )}

            {/* Catatan Tambahan Kasir */}
            <div className="pt-1">
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#8C827A] mb-1 font-bold">
                Catatan Transaksi (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Titip di etalase / packing kardus"
                className="w-full px-3 py-2 bg-[#FAF7F2]/60 border border-[#E8E2D8] rounded-xl text-xs text-[#1A1613] focus:outline-none focus:border-[#C06A28] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Tombol Simpan Transaksi */}
          <button
            onClick={handleFinishTransaction}
            disabled={cart.length === 0 || submittingTrx}
            className="w-full py-3.5 px-4 bg-[#C06A28] hover:bg-[#A8571B] text-white font-sans font-semibold text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {submittingTrx ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Menyimpan & Potong Stok...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Selesaikan Transaksi & Cetak Struk</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Cetak Struk Belanja Kasir (Printable) */}
      {completedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white max-w-sm w-full p-6 border border-[#E8E2D8] rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <span className="font-mono text-xs font-bold text-[#C06A28] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Transaksi Berhasil Dicatat
              </span>
              <button
                onClick={() => setCompletedTrx(null)}
                className="p-1 text-[#8C827A] hover:text-[#1A1613] cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Layout Struk Termal Kasir */}
            <div id="thermal-receipt" className="p-5 bg-[#FAF7F2] border border-dashed border-[#D4CBC0] rounded-xl space-y-3 text-xs font-mono">
              <div className="text-center space-y-0.5">
                <h3 className="font-display font-bold text-sm text-[#1A1613]">{STORE_IDENTITY.name}</h3>
                <p className="text-[10px] text-[#5C5248] leading-tight">{STORE_IDENTITY.address}</p>
                <p className="text-[10px] text-[#8C827A] pt-1">Kasir: {completedTrx.cashierName}</p>
              </div>

              <div className="border-t border-b border-dashed border-[#D4CBC0] py-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#5C5248]">No. Trx:</span>
                  <span className="font-bold text-[#1A1613]">{completedTrx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C5248]">Waktu:</span>
                  <span className="text-[#1A1613]">{formatDateTime(completedTrx.transactionTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C5248]">Metode:</span>
                  <span className="font-semibold text-[#1A1613]">{completedTrx.paymentMethod}</span>
                </div>
                {completedTrx.paymentMethod === 'TRANSFER' && completedTrx.bankDestination && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#5C5248]">Tujuan:</span>
                    <span className="font-medium text-[#1A1613] text-right truncate max-w-[160px]">
                      {completedTrx.bankDestination}
                    </span>
                  </div>
                )}
                {completedTrx.transferReference && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#5C5248]">Ref:</span>
                    <span className="font-medium text-[#1A1613] text-right truncate max-w-[160px]">
                      {completedTrx.transferReference}
                    </span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-1 text-[11px] py-1 border-b border-dashed border-[#D4CBC0]">
                {completedTrx.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <div>
                      <p className="font-semibold text-[#1A1613]">{item.productName}</p>
                      <p className="text-[10px] text-[#8C827A]">{item.quantity} × {formatRupiah(item.price)}</p>
                    </div>
                    <span className="font-bold text-[#1A1613]">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Total & Kembalian */}
              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between font-bold text-xs text-[#1A1613]">
                  <span>TOTAL:</span>
                  <span className="text-[#C06A28]">{formatRupiah(completedTrx.totalAmount)}</span>
                </div>
                {completedTrx.cashReceived && (
                  <>
                    <div className="flex justify-between text-[#5C5248]">
                      <span>Tunai Diterima:</span>
                      <span>{formatRupiah(completedTrx.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between text-[#5C5248]">
                      <span>Kembalian:</span>
                      <span className="font-bold text-[#2E7D32]">{formatRupiah(completedTrx.cashChange || 0)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-3 text-[10px] text-[#5C5248]">
                <p>Matur Suwun Sanget Atas Kunjungan Anda!</p>
                <p className="font-bold text-[#1A1613] mt-0.5">Oleh-Oleh Khas Jepara Jeha</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 px-4 bg-[#1A1613] hover:bg-black text-white text-xs font-sans font-semibold tracking-wide rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Cetak Struk (Print)</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedTrx(null)}
                className="py-2.5 px-4 bg-[#FAF7F2] hover:bg-white text-[#1A1613] border border-[#E8E2D8] hover:border-[#C06A28] text-xs font-sans font-semibold rounded-xl transition cursor-pointer shadow-xs"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
