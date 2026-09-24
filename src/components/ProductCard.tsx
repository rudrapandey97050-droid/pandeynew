import React, { useState } from 'react';
import {
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Star,
  Eye,
  Images,
  Layers,
  Cpu
} from 'lucide-react';
import { Product } from '../types.ts';
import { formatNPR } from '../utils/formatters.ts';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onExchangeWithThis: (product: Product) => void;
  onOrderProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onExchangeWithThis,
  onOrderProduct
}) => {
  const [imgError, setImgError] = useState(false);
  const [selectedColorState, setSelectedColorState] = useState<string | null>(null);
  const isPreOwned = product.condition === 'Used' || product.condition === 'Pre-Owned' || product.condition === 'Refurbished';
  
  const allPhotos = product.images && product.images.length > 0
    ? product.images
    : product.image
      ? [product.image]
      : [];

  // Color-specific photo if clicked, otherwise product cover image
  const colorPhoto = selectedColorState && product.colorImages && product.colorImages[selectedColorState];
  const displayImage = imgError
    ? 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80'
    : colorPhoto || product.image || (allPhotos[0] || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80');

  const isOutOfStock =
    product.availability === 'Out of Stock' ||
    product.availability === 'Sold Out' ||
    (typeof product.stock === 'number' &&
      product.stock <= 0 &&
      product.availability !== 'In Stock' &&
      product.availability !== 'Available' &&
      product.availability !== 'Limited Stock');
  const isPreOrder = product.availability === 'Pre-Order';
  const isLimited = product.availability === 'Limited Stock' || (typeof product.stock === 'number' && product.stock > 0 && product.stock <= 2);
  const stockCount = typeof product.stock === 'number' && product.stock > 0
    ? product.stock
    : (isOutOfStock ? 0 : 5);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
      
      {/* Image & Badges */}
      <div
        className="relative h-56 bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center"
        onClick={() => onSelectProduct(product)}
      >
        <img
          src={displayImage}
          alt={product.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Top-Left Badges: Condition & Battery */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start z-10">
          <span
            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${
              isPreOwned
                ? 'bg-slate-800 text-white font-black'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {isPreOwned ? 'Pre-Owned / Used' : 'Brand New Sealed'}
          </span>

          {isPreOwned && product.batteryHealth && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/90 text-white backdrop-blur-xs shadow-xs flex items-center space-x-1">
              <span>🔋</span>
              <span>{product.batteryHealth} Health</span>
            </span>
          )}

          {product.conditionGrade && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950/85 text-indigo-200 backdrop-blur-xs shadow-xs">
              {product.conditionGrade}
            </span>
          )}
        </div>

        {/* Top-Right Badges: Availability & Discounts */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1 z-10">
          {isOutOfStock ? (
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-xs">
              Out of Stock (स्टक सकिएको)
            </span>
          ) : isPreOrder ? (
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-600 text-white shadow-xs">
              Pre-Order
            </span>
          ) : isLimited ? (
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-600 text-white shadow-xs flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>Limited Stock ({stockCount})</span>
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-xs flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>In Stock ({stockCount})</span>
            </span>
          )}

          {product.isBestSeller && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white shadow-xs flex items-center space-x-0.5">
              <Star className="w-3 h-3 fill-white" />
              <span>Best Seller</span>
            </span>
          )}
          
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-xs">
              Save {formatNPR(product.originalPrice - product.price)}
            </span>
          )}

          {allPhotos.length > 1 && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs flex items-center space-x-1 shadow-xs">
              <Images className="w-3 h-3" />
              <span>{allPhotos.length} Photos</span>
            </span>
          )}
        </div>

        {/* Quick View overlay on hover */}
        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-3.5 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-xl shadow-lg flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>View Full Specs</span>
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        
        <div>
          {/* Brand & Storage / RAM / Color */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="font-bold text-indigo-600 uppercase tracking-wider">{product.brand}</span>
            <div className="flex items-center space-x-1.5 font-medium text-slate-600">
              {product.storage && <span>{product.storage}</span>}
              {product.storage && product.ram && <span>•</span>}
              {product.ram && <span>{product.ram} RAM</span>}
            </div>
          </div>

          {/* Product Title / Model */}
          <h3
            onClick={() => onSelectProduct(product)}
            className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors line-clamp-1 cursor-pointer"
          >
            {product.name}
          </h3>

          {/* Color tag & Color Swatches if available */}
          {(product.colorImages && Object.keys(product.colorImages).length > 0) ? (
            <div className="mt-1 flex flex-wrap items-center gap-1.5 pt-0.5">
              {Object.keys(product.colorImages).map((cName) => {
                const isSelected = (selectedColorState || product.color) === cName;
                return (
                  <button
                    key={cName}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedColorState(cName);
                    }}
                    title={`View ${cName} photo`}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {cName}
                  </button>
                );
              })}
            </div>
          ) : product.color ? (
            <div className="mt-1 flex items-center space-x-1.5 text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
              <span className="font-medium text-slate-600">{product.color}</span>
            </div>
          ) : null}

          {/* Pricing */}
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-base sm:text-lg font-black text-slate-900">
              {formatNPR(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                {formatNPR(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Warranty tag */}
          <div className="mt-2 text-[11px] text-slate-600 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{product.warranty || 'Store Warranty Guarantee'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          
          {/* Exchange button */}
          <button
            type="button"
            onClick={() => onExchangeWithThis(product)}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Exchange Old Phone For This</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSelectProduct(product)}
              className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors text-center cursor-pointer"
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => isOutOfStock ? onSelectProduct(product) : onOrderProduct(product)}
              className={`py-2 font-bold text-xs rounded-xl transition-colors text-center shadow-xs cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  : 'bg-slate-900 hover:bg-indigo-600 text-white'
              }`}
            >
              {isOutOfStock ? 'स्टक छैन (Pre-Order)' : 'Order / Hold'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
