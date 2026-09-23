import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Eye,
  Images,
  Palette,
  CheckCircle2,
  Phone,
  Layers,
  Sparkles,
  Zap,
  Cpu,
  Camera,
  BatteryCharging,
  Sliders,
  Check,
  Award
} from 'lucide-react';
import { Product, ProductVariant } from '../types.ts';
import { formatNPR } from '../utils/formatters.ts';
import { DataStorageService } from '../services/dataStorage.ts';
import { SeoService } from '../services/seoService.ts';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onExchangeWithThis: (product: Product) => void;
  onOrderProduct: (product: Product) => void;
}

// Apple Official Color Swatch Map
const COLOR_SWATCH_MAP: Record<string, { bg: string; border: string }> = {
  'Desert Titanium': { bg: '#c5b49e', border: '#a3927d' },
  'Natural Titanium': { bg: '#9f9891', border: '#7c7670' },
  'White Titanium': { bg: '#e3e4e5', border: '#c7c8c9' },
  'Black Titanium': { bg: '#3c3b37', border: '#22211e' },
  'Blue Titanium': { bg: '#3a444d', border: '#252c33' },
  'Ultramarine': { bg: '#47638f', border: '#2f4464' },
  'Teal': { bg: '#8bb9b6', border: '#639693' },
  'Pink': { bg: '#e9b5b9', border: '#ca8a90' },
  'White': { bg: '#f2f2f2', border: '#d9d9d9' },
  'Black': { bg: '#232528', border: '#0f1012' },
  'Midnight': { bg: '#1f2024', border: '#121316' },
  'Starlight': { bg: '#f0eae1', border: '#d6cdbf' },
  'Blue': { bg: '#a3b8c8', border: '#7b95a8' },
  'Purple': { bg: '#d1cdda', border: '#aba6b8' },
  'Deep Purple': { bg: '#4d3f54', border: '#332938' },
  'Space Black': { bg: '#2e2c2f', border: '#19181a' },
  'Green': { bg: '#cad5c8', border: '#9fb09c' },
  'Yellow': { bg: '#fae79d', border: '#dfca79' },
  '(PRODUCT)RED': { bg: '#ba0c2f', border: '#8b0923' }
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onExchangeWithThis,
  onOrderProduct
}) => {
  const storeSettings = DataStorageService.getStoreSettings();
  const rawWa = storeSettings.whatsapp || storeSettings.phone1 || '9847460603';
  const cleanWa = rawWa.replace(/[^0-9]/g, '');
  const finalWa = cleanWa.startsWith('977') ? cleanWa : `977${cleanWa}`;

  // Variants handling
  const variants: ProductVariant[] = useMemo(() => {
    if (!product) return [];
    return product.variants && product.variants.length > 0
      ? product.variants
      : [
          {
            storage: product.storage || '128GB',
            price: product.price,
            originalPrice: product.originalPrice,
            availability: product.availability || 'In Stock'
          }
        ];
  }, [product]);

  const allPhotos: string[] = useMemo(() => {
    if (!product) return ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80'];
    const list: string[] = [];
    if (product.image) list.push(product.image);
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    if (product.additionalImages && Array.isArray(product.additionalImages)) {
      product.additionalImages.forEach(img => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list.length > 0
      ? list
      : ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80'];
  }, [product]);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(() => variants[0] || {
    storage: '128GB',
    price: 0,
    availability: 'In Stock'
  });
  const [selectedColor, setSelectedColor] = useState<string>(
    product?.color || (product?.availableColors && product.availableColors[0]) || 'Standard'
  );
  const [activePhoto, setActivePhoto] = useState<string>(product?.image || allPhotos[0]);

  useEffect(() => {
    if (product) {
      SeoService.setProductSeo(product);

      const initialVar = (product.variants && product.variants.length > 0) ? product.variants[0] : {
        storage: product.storage || '128GB',
        price: product.price,
        originalPrice: product.originalPrice,
        availability: product.availability || 'In Stock'
      };
      setSelectedVariant(initialVar);
      const initialCol = product.color || (product.availableColors && product.availableColors[0]) || 'Standard';
      setSelectedColor(initialCol);
      if (product.colorImages && product.colorImages[initialCol]) {
        setActivePhoto(product.colorImages[initialCol]);
      } else {
        setActivePhoto(product.image || allPhotos[0]);
      }

      return () => {
        SeoService.resetToDefaultSeo();
      };
    }
  }, [product, allPhotos]);

  if (!product) return null;

  const isApple = product.brand.toLowerCase() === 'apple' || product.category.toLowerCase() === 'iphone';
  const isPreOwned = product.condition === 'Used' || product.condition === 'Pre-Owned' || product.condition === 'Refurbished';
  const stockCount = typeof product.stock === 'number' ? Math.max(0, product.stock) : 0;
  const isOutOfStock = stockCount <= 0 || product.availability === 'Out of Stock' || product.availability === 'Sold Out';

  // When user clicks a color, switch to that color's specific image if provided
  const handleSelectColor = (col: string) => {
    setSelectedColor(col);
    if (product.colorImages && product.colorImages[col]) {
      setActivePhoto(product.colorImages[col]);
    }
  };

  const currentPrice = selectedVariant.price || product.price;
  const currentOriginalPrice = selectedVariant.originalPrice || product.originalPrice;

  // Approximate trade in deduction
  const tradeInEstimate = Math.round(currentPrice * 0.4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#161617] text-white rounded-3xl shadow-2xl border border-white/10 overflow-hidden my-auto max-h-[94vh] flex flex-col font-sans">
        
        {/* Apple Style Top Header Strip */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1d1d1f] border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/90 uppercase tracking-wider">
              {isApple ? ' Apple Official Model' : product.brand}
            </span>
            <span className="text-xs text-[#86868b] hidden sm:inline">
              Traffic Chowk, Butwal • Pandey Mobile Store
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#86868b] hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 no-scrollbar">
          
          {/* Visual Breadcrumb Navigation Trail */}
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-[#86868b] border-b border-white/5 pb-3">
            <button
              type="button"
              onClick={onClose}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Home
            </button>
            <span className="text-white/30">/</span>
            <button
              type="button"
              onClick={onClose}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {product.category || (product.brand === 'Apple' ? 'iPhone' : 'Smartphones')}
            </button>
            <span className="text-white/30">/</span>
            <span className="text-white font-semibold truncate max-w-[200px] sm:max-w-md">
              {product.name}
            </span>
          </nav>

          {/* Main Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Left Photo & Gallery Column */}
            <div className="md:col-span-5 space-y-4">
              
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-b from-[#222226] to-[#161617] border border-white/10 flex items-center justify-center p-4">
                <img
                  src={activePhoto}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                />
                
                {/* Floating Apple Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-md ${
                    isPreOwned ? 'bg-slate-200 text-black font-black' : 'bg-emerald-500 text-black font-extrabold'
                  }`}>
                    {isPreOwned ? 'Certified Pre-Owned' : 'Brand New Seal Pack'}
                  </span>
                  {isPreOwned && product.batteryHealth && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/80 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                      🔋 {product.batteryHealth} Battery Health
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3 z-10">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-md ${
                    isOutOfStock ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {isOutOfStock ? 'Out of Stock (स्टक सकिएको)' : `In Stock • ${stockCount} Units Available`}
                  </span>
                </div>
              </div>

              {/* Photo Thumbnails */}
              {allPhotos.length > 1 && (
                <div className="flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar">
                  {allPhotos.map((photo, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActivePhoto(photo)}
                      className={`relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        activePhoto === photo
                          ? 'border-white scale-105 shadow-md'
                          : 'border-white/20 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Assurance Trust Box */}
              <div className="p-4 rounded-2xl bg-[#1d1d1f] border border-white/10 space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Pandey Mobile Store Guarantee</span>
                </div>
                <p className="text-[#86868b] leading-relaxed">
                  {product.warranty || '1 Year Official Brand Warranty with Nepal VAT Bill and 15 Days Store Testing Replacement.'}
                </p>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#a1a1a6]">
                  <span>✓ 100% IMEI Verified</span>
                  <span>✓ Nepal VAT Bill</span>
                  <span>✓ Genuine Apple Parts</span>
                </div>
              </div>

            </div>

            {/* Right Details Column */}
            <div className="md:col-span-7 space-y-6">
              
              {/* Title & Tagline */}
              <div>
                <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">
                  {isApple ? 'Apple Intelligence & Flagship Lineup' : product.brand}
                </p>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                  {product.name}
                </h1>
                {selectedColor && (
                  <p className="text-sm text-[#86868b] mt-1">
                    Finish in <span className="text-white font-medium">{selectedColor}</span>
                  </p>
                )}
              </div>

              {/* Pricing Box (Apple Style) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#1d1d1f] border border-white/10 space-y-2">
                <div className="flex items-baseline space-x-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {formatNPR(currentPrice)}
                  </span>
                  {currentOriginalPrice && currentOriginalPrice > currentPrice && (
                    <span className="text-base text-[#86868b] line-through">
                      {formatNPR(currentOriginalPrice)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-400 font-medium">
                  Exchange Offer: From <strong>{formatNPR(Math.max(currentPrice - tradeInEstimate, 10000))}</strong> with old smartphone trade-in at Butwal store.
                </p>
              </div>

              {/* Color Finish Selector (Apple Style Swatches) */}
              {product.availableColors && product.availableColors.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider">
                      Finish: <span className="text-white font-normal">{selectedColor}</span>
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {product.availableColors.map((col) => {
                      const swatch = COLOR_SWATCH_MAP[col] || { bg: '#86868b', border: '#555' };
                      const isSelected = selectedColor === col;
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => handleSelectColor(col)}
                          title={col}
                          className={`w-9 h-9 rounded-full relative transition-all duration-200 cursor-pointer flex items-center justify-center ${
                            isSelected
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-[#161617] scale-110'
                              : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: swatch.bg,
                            border: `1.5px solid ${swatch.border}`
                          }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white filter drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Storage Capacity Selector (Apple Style Cards) */}
              {variants.length > 1 && (
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider block">
                    Select Storage Capacity:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {variants.map((variant) => {
                      const isSelected = selectedVariant.storage === variant.storage;
                      return (
                        <button
                          key={variant.storage}
                          type="button"
                          onClick={() => setSelectedVariant(variant)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-white bg-white/10 text-white ring-1 ring-white'
                              : 'border-white/15 bg-white/5 text-[#a1a1a6] hover:border-white/30 hover:text-white'
                          }`}
                        >
                          <div className="text-sm font-bold">{variant.storage}</div>
                          <div className="text-xs text-white/80 mt-0.5">{formatNPR(variant.price)}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Apple Intelligence / Highlights Callout */}
              {isApple && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 space-y-1.5">
                  <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-slate-200" />
                    <span>Apple Intelligence Ready</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Camera Control, Super Retina XDR OLED, A18/A18 Pro generation architecture, and next-level battery endurance.
                  </p>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="space-y-1.5 text-xs text-[#a1a1a6] leading-relaxed">
                  <p>{product.description}</p>
                </div>
              )}

            </div>

          </div>

          {/* Technical Specifications Section (Apple Exact Breakdown) */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="border-t border-white/10 pt-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-slate-300" />
                <span>Technical Specifications & Hardware</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {Object.entries(product.specs).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-3 rounded-xl bg-[#1d1d1f] border border-white/5 flex flex-col justify-between space-y-1"
                  >
                    <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider capitalize">
                      {key}
                    </span>
                    <span className="text-white font-medium leading-relaxed">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Fixed CTA Actions */}
        <div className="p-4 sm:p-6 bg-[#1d1d1f] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          <button
            type="button"
            onClick={() => {
              onClose();
              onExchangeWithThis(product);
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-300" />
            <span>Exchange Old Smartphone (Valuation)</span>
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <a
              href={`https://wa.me/${finalWa}?text=${encodeURIComponent(
                `Hello ${storeSettings.storeName}, I want to inquire/purchase ${product.name} (${selectedVariant.storage || ''} ${selectedColor || ''}) priced at ${formatNPR(currentPrice)}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all text-center cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              WhatsApp Inquiry
            </a>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOrderProduct({
                  ...product,
                  price: currentPrice,
                  storage: selectedVariant.storage,
                  color: selectedColor
                });
              }}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-white hover:bg-white/90 text-black font-bold text-xs sm:text-sm transition-all shadow-lg cursor-pointer"
            >
              {isOutOfStock ? 'स्टक छैन (Pre-Order)' : 'Buy / Hold at Store'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
