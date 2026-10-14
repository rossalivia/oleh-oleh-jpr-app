'use client';

import React, { useState } from 'react';
import { Utensils, Trees } from 'lucide-react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  aspectRatio?: 'portrait' | 'square' | 'video' | 'auto';
  category?: string;
  isCuratedNotice?: boolean;
}

export function ProductImage({
  src,
  alt,
  className = '',
  aspectRatio = 'portrait',
  category = '',
  isCuratedNotice = false,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if image is a known mismatched legacy placeholder
  const isSuspiciousLegacy =
    !src ||
    src.includes('photo-1546069901-ba9599a7e63c') || // salad bowl
    src.includes('photo-1509440159596-0249088772ff'); // sourdough bread

  const aspectClass =
    aspectRatio === 'portrait'
      ? 'aspect-[4/5]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'video'
      ? 'aspect-[16/10]'
      : '';

  // If error or intentionally flagged for authentic craft plate
  if (hasError || (isSuspiciousLegacy && isCuratedNotice)) {
    return (
      <div
        className={`relative w-full ${aspectClass} bg-[#FAF9F6] border border-[#EAE8E2] flex flex-col items-center justify-between p-5 text-center select-none overflow-hidden group ${className}`}
      >
        {/* Subtle heritage corner label */}
        <div className="w-full flex items-center justify-between text-[10px] tracking-wider uppercase font-mono text-[#8C8C8C]">
          <span>JEHA</span>
          <span>JEPARA</span>
        </div>

        <div className="space-y-2 max-w-[200px]">
          <div className="w-10 h-10 mx-auto rounded-full bg-white border border-[#EAE8E2] flex items-center justify-center text-[#C96A45]">
            {category.toLowerCase().includes('kerajinan') || category.toLowerCase().includes('suvenir') ? (
              <Trees className="w-5 h-5 text-[#C96A45]" />
            ) : (
              <Utensils className="w-5 h-5 text-[#C96A45]" />
            )}
          </div>
          <h4 className="font-display font-medium text-xs sm:text-sm text-[#242424] leading-snug line-clamp-2">
            {alt}
          </h4>
          <span className="inline-block text-[11px] text-[#737373] border-t border-[#EAE8E2] pt-1">
            Produk Khas Asli Jepara
          </span>
        </div>

        <div className="w-full pt-2 border-t border-[#EAE8E2] flex items-center justify-center gap-1.5 text-[10px] text-[#8C8C8C]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C96A45]" />
          <span>Kurasi Resmi Jeha</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${aspectClass} overflow-hidden bg-[#FAF9F6] ${className}`}>
      { }
      <img
        src={src || ''}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
          isLoading ? 'scale-102 blur-xs' : 'scale-100 blur-0'
        }`}
      />
    </div>
  );
}
