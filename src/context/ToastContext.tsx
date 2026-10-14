'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, message, title };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title = 'Berhasil') => showToast(message, 'success', title),
    [showToast]
  );

  const error = useCallback(
    (message: string, title = 'Gagal / Perhatian') => showToast(message, 'error', title),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title = 'Peringatan') => showToast(message, 'warning', title),
    [showToast]
  );

  const info = useCallback(
    (message: string, title = 'Informasi') => showToast(message, 'info', title),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div
        role="region"
        aria-label="Notifikasi Aplikasi"
        className="fixed top-5 right-5 z-[99999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          let icon = <Info className="w-4 h-4 text-[#C96A45] shrink-0 mt-0.5" />;
          let borderAccent = 'border-l-4 border-l-[#C96A45]';

          if (toast.type === 'success') {
            icon = <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />;
            borderAccent = 'border-l-4 border-l-[#047857]';
          } else if (toast.type === 'error') {
            icon = <AlertCircle className="w-4 h-4 text-[#9B1C1C] shrink-0 mt-0.5" />;
            borderAccent = 'border-l-4 border-l-[#9B1C1C]';
          } else if (toast.type === 'warning') {
            icon = <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />;
            borderAccent = 'border-l-4 border-l-[#B45309]';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 bg-white border border-[#EAE8E2] shadow-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 text-xs font-sans ${borderAccent}`}
            >
              {icon}
              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#242424] font-semibold mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs leading-relaxed text-[#666666]">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-[#8C8C8C] hover:text-[#242424] transition p-1 shrink-0 cursor-pointer"
                aria-label="Tutup notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast harus digunakan di dalam ToastProvider');
  }
  return context;
}
