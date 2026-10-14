'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CartItem, Product } from '@/types';
import { useToast } from './ToastContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => { success: boolean; message?: string };
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  clearCart: () => void;
  totalQuantity: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => ({ success: false }),
  removeFromCart: () => {},
  updateQuantity: () => ({ success: false }),
  clearCart: () => {},
  totalQuantity: 0,
  subtotal: 0,
});

const CART_STORAGE_KEY = 'jeha_marketplace_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Muat keranjang dari LocalStorage saat pertama render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        queueMicrotask(() => {
          setItems(parsed);
          setIsLoaded(true);
        });
        return;
      }
    } catch (e) {
      console.error('Gagal membaca keranjang lokal:', e);
    }
    queueMicrotask(() => {
      setIsLoaded(true);
    });
  }, []);

  // Simpan keranjang ke LocalStorage setiap ada mutasi
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error('Gagal menyimpan keranjang lokal:', e);
      }
    }
  }, [items, isLoaded]);

  const addToCart = (product: Product, quantity = 1) => {
    if (quantity <= 0) return { success: false, message: 'Kuantitas harus lebih dari 0' };

    const existingIndex = items.findIndex((i) => i.product.id === product.id);
    const currentQty = existingIndex > -1 ? items[existingIndex].quantity : 0;
    const requestedQty = currentQty + quantity;

    if (requestedQty > product.stock) {
      const msg = `Stok tidak mencukupi. Tersedia hanya ${product.stock} ${product.unit}`;
      toast.error(msg, 'Stok Terbatas');
      return {
        success: false,
        message: msg,
      };
    }

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity = requestedQty;
      setItems(updated);
    } else {
      setItems([...items, { product, quantity }]);
    }

    toast.success(`${product.name} (${quantity} ${product.unit}) berhasil ditambahkan ke keranjang!`, 'Keranjang Belanja');
    return { success: true };
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const existingIndex = items.findIndex((i) => i.product.id === productId);
    if (existingIndex === -1) return { success: false, message: 'Produk tidak ada di keranjang' };

    const targetItem = items[existingIndex];
    if (quantity <= 0) {
      removeFromCart(productId);
      return { success: true };
    }

    if (quantity > targetItem.product.stock) {
      return {
        success: false,
        message: `Stok maksimal hanya ${targetItem.product.stock} ${targetItem.product.unit}`,
      };
    }

    const updated = [...items];
    updated[existingIndex].quantity = quantity;
    setItems(updated);
    return { success: true };
  };

  const removeFromCart = (productId: string) => {
    const item = items.find((i) => i.product.id === productId);
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
    if (item) {
      toast.info(`${item.product.name} dihapus dari keranjang.`, 'Keranjang Diperbarui');
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalQuantity,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
