import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, X, Smartphone, Check, ChevronDown, Package, Camera, Barcode } from 'lucide-react';
import { Product } from '../../types.ts';
import { QuickAddProductModal } from './QuickAddProductModal.tsx';
import { BarcodeScannerModal } from './BarcodeScannerModal.tsx';

interface ProductSearchSelectProps {
  selectedProductId?: string;
  productName: string;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onManualNameChange: (name: string) => void;
  onProductCreated?: (product: Product) => void;
  placeholder?: string;
}

export const ProductSearchSelect: React.FC<ProductSearchSelectProps> = ({
  selectedProductId,
  productName,
  products,
  onSelectProduct,
  onManualNameChange,
  onProductCreated,
  placeholder = 'Search model, brand or GB...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find currently selected product if any
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find(p => p.id === selectedProductId) || null;
  }, [selectedProductId, products]);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      // Show first 15 products if no search
      return products.slice(0, 15);
    }
    return products.filter(p => {
      const nameMatch = p.name?.toLowerCase().includes(q);
      const brandMatch = p.brand?.toLowerCase().includes(q);
      const modelMatch = p.model?.toLowerCase().includes(q);
      const storageMatch = p.storage?.toLowerCase().includes(q);
      const ramMatch = p.ram?.toLowerCase().includes(q);
      return nameMatch || brandMatch || modelMatch || storageMatch || ramMatch;
    }).slice(0, 25);
  }, [products, searchTerm]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (prod: Product) => {
    onSelectProduct(prod);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchTerm('');
    onManualNameChange('');
    // Deselect product
    onSelectProduct({
      id: '',
      name: '',
      brand: 'Apple',
      category: 'Smartphones',
      condition: 'New',
      price: 0,
      image: ''
    });
    setIsOpen(true);
  };

  const handleBarcodeScanned = (scannedCode: string) => {
    const q = scannedCode.trim().toLowerCase();
    const matched = products.find(p => 
      p.id.toLowerCase() === q ||
      p.name?.toLowerCase().includes(q) ||
      (p.model && p.model.toLowerCase().includes(q))
    );

    if (matched) {
      handleSelect(matched);
    } else {
      setSearchTerm(scannedCode.trim());
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-1">
      {/* Selected Product Pill or Search Input */}
      {selectedProduct ? (
        <div className="flex items-center justify-between p-1.5 bg-indigo-50/80 border border-indigo-200 rounded-lg text-xs">
          <div className="flex items-center space-x-2 truncate pr-1">
            <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] shrink-0">
              <Check className="w-3 h-3" />
            </span>
            <div className="truncate">
              <span className="font-bold text-slate-900 truncate block">
                {selectedProduct.name}
              </span>
              <span className="text-[10px] text-indigo-700 font-mono">
                Rs.{(selectedProduct.discountPrice || selectedProduct.price).toLocaleString()} • Stock: {selectedProduct.stock || 0}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsBarcodeScannerOpen(true)}
              className="text-slate-400 hover:text-emerald-600 p-1 rounded hover:bg-emerald-50 transition-colors"
              title="Scan barcode with camera"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold px-1.5 py-0.5 rounded hover:bg-indigo-100 transition-colors"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              className="w-full pl-7 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {/* Camera Barcode Scanner Button */}
          <button
            type="button"
            onClick={() => setIsBarcodeScannerOpen(true)}
            className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1 transition-colors cursor-pointer"
            title="Scan Barcode / IMEI with Camera (क्यामराबाट बारकोड स्क्यान)"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Scan</span>
          </button>

          {/* Quick Add Button right next to search */}
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(true)}
            className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1 transition-colors cursor-pointer"
            title="Add new product (Only GB & Variant, no photo/color)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ New</span>
          </button>
        </div>
      )}

      {/* Product Name Display / Manual Override Input */}
      <input
        type="text"
        required
        placeholder="Product / Item Description..."
        value={productName}
        onChange={(e) => onManualNameChange(e.target.value)}
        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500 shadow-2xs"
      />

      {/* Floating Search Dropdown */}
      {isOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden max-h-72 flex flex-col animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Dropdown Header */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-600">
              {filteredProducts.length} Models Found
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsQuickAddOpen(true);
              }}
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ Quick Add Product</span>
            </button>
          </div>

          {/* Search Results List */}
          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  कुनै मोडल फेला परेन &ldquo;<strong className="text-slate-800">{searchTerm}</strong>&rdquo;
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsBarcodeScannerOpen(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>क्यामराबाट स्क्यान गर्नुहोस्</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsQuickAddOpen(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>नयाँ सामानको रूपमा थप्नुहोस्</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const priceVal = p.discountPrice || p.price;
                const isMatch = selectedProductId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className={`w-full text-left p-2.5 hover:bg-indigo-50/60 transition-colors flex items-center justify-between group cursor-pointer ${
                      isMatch ? 'bg-indigo-50 border-l-2 border-indigo-600' : ''
                    }`}
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded uppercase">
                          {p.brand}
                        </span>
                        <span className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-700">
                          {p.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                        {p.storage && (
                          <span className="font-semibold text-slate-700 bg-slate-100 px-1 rounded">
                            {p.storage}
                          </span>
                        )}
                        {p.ram && (
                          <span>{p.ram}</span>
                        )}
                        <span>•</span>
                        <span className={Number(p.stock) > 0 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                          Stock: {p.stock || 0}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">{p.condition}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-slate-900 text-xs block">
                        Rs.{priceVal.toLocaleString()}
                      </span>
                      {p.originalPrice && p.originalPrice > priceVal && (
                        <span className="text-[10px] text-slate-400 line-through font-mono">
                          Rs.{p.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Quick Add Product Modal */}
      <QuickAddProductModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        initialSearchTerm={searchTerm}
        onSuccess={(created) => {
          if (onProductCreated) {
            onProductCreated(created);
          }
          onSelectProduct(created);
        }}
      />

      {/* Mobile Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Phone Barcode & IMEI Scanner"
        subtitle="मोबाइल क्यामराबाट फोनको बारकोड वा IMEI स्क्यान गर्नुहोस्"
      />
    </div>
  );
};
