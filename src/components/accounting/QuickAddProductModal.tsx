import React, { useState } from 'react';
import { X, Smartphone, Plus, Check } from 'lucide-react';
import { Product, ProductCondition } from '../../types.ts';
import { AccountingStorageService } from '../../services/accountingStorage.ts';

interface QuickAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: Product) => void;
  initialSearchTerm?: string;
}

const COMMON_BRANDS = [
  'Apple',
  'Samsung',
  'Xiaomi',
  'Redmi',
  'POCO',
  'OnePlus',
  'Vivo',
  'Realme',
  'HONOR',
  'Other'
];

const STORAGE_CHOICES = ['64GB', '128GB', '256GB', '512GB', '1TB'];
const VARIANT_CHOICES = ['4GB RAM', '6GB RAM', '8GB RAM', '12GB RAM', '16GB RAM', 'Standard', 'Global'];

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialSearchTerm = ''
}) => {
  const [brand, setBrand] = useState('Apple');
  const [name, setName] = useState(initialSearchTerm);
  const [storage, setStorage] = useState('128GB');
  const [customStorage, setCustomStorage] = useState('');
  const [variant, setVariant] = useState('8GB RAM');
  const [customVariant, setCustomVariant] = useState('');
  const [condition, setCondition] = useState<ProductCondition>('New');
  const [price, setPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handlePriceChange = (val: string) => {
    const num = val === '' ? '' : Number(val);
    setPrice(num);
    // Auto-calculate suggested purchase cost at ~85%
    if (typeof num === 'number' && num > 0 && costPrice === '') {
      setCostPrice(Math.round(num * 0.85));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('कृपया मोडलको नाम (Model Name) प्रविष्टि गर्नुहोस्।');
      return;
    }
    if (price === '' || price <= 0) {
      setErrorMsg('कृपया बिक्री मूल्य (Rate / Price) प्रविष्टि गर्नुहोस्।');
      return;
    }

    const finalStorage = storage === 'custom' ? customStorage.trim() : storage;
    const finalVariant = variant === 'custom' ? customVariant.trim() : variant;

    // Construct full descriptive name
    const parts = [name.trim()];
    if (finalStorage) parts.push(finalStorage);
    if (finalVariant && finalVariant !== 'Standard') parts.push(`(${finalVariant})`);
    const fullDisplayName = parts.join(' ');

    const newProduct: Product = {
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: fullDisplayName,
      brand: brand || 'Other',
      model: name.trim(),
      category: brand === 'Apple' ? 'iPhone' : 'Smartphones',
      condition: condition,
      conditionGrade: condition === 'New' ? 'Brand New' : 'Grade A',
      price: Number(price),
      discountPrice: Number(price),
      storage: finalStorage || '128GB',
      ram: finalVariant || '8GB',
      stock: Number(stock) || 1,
      // Default clean placeholder image for internal schema compatibility (no user upload required)
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
      images: [],
      warranty: condition === 'New' ? '1 Year Brand Warranty' : '30 Days Testing Warranty',
      description: `${brand} ${name.trim()} - Storage: ${finalStorage}, Variant: ${finalVariant}`
    };

    try {
      AccountingStorageService.saveInventoryItem(newProduct);
      onSuccess(newProduct);
      onClose();
    } catch (err) {
      console.error('Failed to save quick product', err);
      setErrorMsg('सामान सेभ गर्दा त्रुटि भयो। पुनः प्रयास गर्नुहोस्।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center space-x-1.5">
                <span>द्रुत नयाँ सामान थप्नुहोस् (Quick Add Product)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                GB र भेरियन्ट मात्र (फोटो र कलर चाहिँदैन)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Brand & Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Brand (ब्रान्ड) *
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-hidden focus:border-indigo-500"
              >
                {COMMON_BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Condition (अवस्था) *
              </label>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setCondition('New')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                    condition === 'New'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  New (नयाँ)
                </button>
                <button
                  type="button"
                  onClick={() => setCondition('Pre-Owned')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                    condition === 'Pre-Owned'
                      ? 'bg-amber-50 border-amber-500 text-amber-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Pre-Owned
                </button>
              </div>
            </div>
          </div>

          {/* Model / Product Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Model Name (फोन / मोडलको नाम) *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. iPhone 16 Pro Max, Galaxy S24 Ultra, Redmi Note 13"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Storage / GB Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Storage / GB (भण्डारण) *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {STORAGE_CHOICES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStorage(st);
                    setCustomStorage('');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                    storage === st
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setStorage('custom')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                  storage === 'custom'
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Other
              </button>
            </div>
            {storage === 'custom' && (
              <input
                type="text"
                placeholder="Type custom GB (e.g. 32GB, 2TB, etc.)"
                value={customStorage}
                onChange={(e) => setCustomStorage(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:border-indigo-500"
              />
            )}
          </div>

          {/* Variant / RAM Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Variant / RAM (भेरियन्ट) *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {VARIANT_CHOICES.map((va) => (
                <button
                  key={va}
                  type="button"
                  onClick={() => {
                    setVariant(va);
                    setCustomVariant('');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                    variant === va
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {va}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setVariant('custom')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                  variant === 'custom'
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Other
              </button>
            </div>
            {variant === 'custom' && (
              <input
                type="text"
                placeholder="Type custom variant (e.g. 18GB RAM, US Spec, etc.)"
                value={customVariant}
                onChange={(e) => setCustomVariant(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:border-indigo-500"
              />
            )}
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Selling Rate (Rs.) *
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 145000"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cost Price (खरिद)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Est. cost"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:bg-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Initial Stock (मौज्दात)
              </label>
              <input
                type="number"
                min="1"
                value={stock}
                onChange={(e) => setStock(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Note */}
          <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
            💡 <strong>द्रुत प्रविष्टि:</strong> यहाँ सामान थप्दा फोटो र कलर चाहिँदैन। सेभ गरेपछि तुरुन्त बिलको लाइनमा मोडल र दर भरिनेछ।
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save & Select Product</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
