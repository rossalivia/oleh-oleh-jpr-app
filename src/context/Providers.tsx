'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { ToastProvider } from './ToastContext';
import { StoreSettingsProvider } from './StoreSettingsContext';
import { NotificationProvider } from './NotificationContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <StoreSettingsProvider>
        <AuthProvider>
          <NotificationProvider>
            <CartProvider>{children}</CartProvider>
          </NotificationProvider>
        </AuthProvider>
      </StoreSettingsProvider>
    </ToastProvider>
  );
}
