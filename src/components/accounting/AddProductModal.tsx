import React, { useState } from 'react';
import {
  X,
  Package,
  Upload,
  Sparkles,
  Check,
  Smartphone,
  Tag,
  DollarSign,
  Shield,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { Product, ProductCondition, ProductAvailability } from '../../types.ts';
import { DataStorageService } from '../../services/dataStorage.ts';
import { AccountingStorageService } from '../../services/accountingStorage.ts';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (product: Product) => void;
  editingProduct?: Product | null;
}

const BRANDS = [
  'Apple',
  'Samsung',
  'Vivo',
  'POCO',
  'HONOR',
  'Redmi',
  'Xiaomi',
  'OnePlus',
  'Realme',
  'Accessories',
  'Other'
];

const CATEGORIES = [
  'Smartphones',
  'iPhone',
  'Tablets',
  'Smartwatches',
  'AirPods & Audio',
  'Accessories',
  'Chargers & Cables'
];

const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB', 'N/A'];
const RAM_OPTIONS = ['4GB', '6GB', '8GB', '12GB', '16GB', 'N/A'];

const SAMPLE_IMAGES = [
  { label: 'iPhone 16 Pro Desert', url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80' },
  { label: 'iPhone Black', url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80' },
  { label: 'Samsung Galaxy', url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80' },
  { label: 'Modern Smartphone', url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80' },
  { label: 'AirPods / Audio', url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80' }
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingProduct
}) => {
  const isEditing = !!editingProduct;

  const [name, setName] = useState(editingProduct?.name || '');
  const [brand, setBrand] = useState(editingProduct?.brand || 'Apple');
  const [customBrand, setCustomBrand] = useState('');
  const [category, setCategory] = useState(editingProduct?.category || 'Smartphones');
  const [condition, setCondition] = useState<ProductCondition>(editingProduct?.condition || 'New');
  const [conditionGrade, setConditionGrade] = useState(editingProduct?.conditionGrade || 'Grade A+');
  const [batteryHealth, setBatteryHealth] = useState(editingProduct?.batteryHealth || '100%');
  
  const [storage, setStorage] = useState(editingProduct?.storage || '128GB');
  const [ram, setRam] = useState(editingProduct?.ram || '8GB');
  const [color, setColor] = useState(editingProduct?.color || 'Black');
  
  const [price, setPrice] = useState<number | ''>(editingProduct?.price || '');
  const [originalPrice, setOriginalPrice] = useState<number | ''>(editingProduct?.originalPrice || '');
  const [costPrice, setCostPrice] = useState<number | ''>(
    editingProduct?.costPrice || (editingProduct?.price ? Math.round(editingProduct.price * 0.85) : '')
  );
  
  const [stock, setStock] = useState<number>(typeof editingProduct?.stock === 'number' ? editingProduct.stock : 1);
  const [warranty, setWarranty] = useState(editingProduct?.warranty || '1 Year Official Brand Warranty');
  const [image, setImage] = useState(editingProduct?.image || SAMPLE_IMAGES[0].url);
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [initialImei, setInitialImei] = useState('');
  const [showOnStorefront, setShowOnStorefront] = useState(!editingProduct?.isHidden);
  
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('कृपया ४ MB भन्दा सानो फोटो छनोट गर्नुहोस्।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('कृपया उत्पादन / फोनको नाम प्रविष्ट गर्नुहोस्।');
      return;
    }

    const finalBrand = brand === 'Other' ? (customBrand.trim() || 'Other') : brand;
    const finalPrice = typeof price === 'number' ? price : Number(price) || 0;
    const finalCost = typeof costPrice === 'number' ? costPrice : Number(costPrice) || Math.round(finalPrice * 0.85);
    const finalOriginalPrice = originalPrice ? Number(originalPrice) : undefined;
    const finalStock = Math.max(0, Number(stock) || 0);

    const availability: ProductAvailability = finalStock > 0
      ? (finalStock <= 2 ? 'Limited Stock' : 'In Stock')
      : 'Out of Stock';

    try {
      if (isEditing && editingProduct) {
        const updated = DataStorageService.updateProduct(editingProduct.id, {
          name: name.trim(),
          brand: finalBrand,
          category,
          condition,
          conditionGrade: condition !== 'New' ? conditionGrade : undefined,
          batteryHealth: condition !== 'New' ? batteryHealth : undefined,
          storage: storage !== 'N/A' ? storage : undefined,
          ram: ram !== 'N/A' ? ram : undefined,
          color: color.trim() || undefined,
          price: finalPrice,
          originalPrice: finalOriginalPrice,
          costPrice: finalCost,
          stock: finalStock,
          availability,
          warranty,
          image: image.trim() || SAMPLE_IMAGES[0].url,
          description: description.trim(),
          isHidden: !showOnStorefront
        });

        AccountingStorageService.recordAuditLog(
          'edit',
          'inventory',
          editingProduct.id,
          `Updated product '${name}' in inventory (Price: Rs. ${finalPrice}, Stock: ${finalStock})`,
          'Admin'
        );

        if (updated) onSuccess(updated);
      } else {
        const newProductData = {
          name: name.trim(),
          brand: finalBrand,
          category,
          condition,
          conditionGrade: condition !== 'New' ? conditionGrade : undefined,
          batteryHealth: condition !== 'New' ? batteryHealth : undefined,
          storage: storage !== 'N/A' ? storage : undefined,
          ram: ram !== 'N/A' ? ram : undefined,
          color: color.trim() || undefined,
          price: finalPrice,
          originalPrice: finalOriginalPrice,
          costPrice: finalCost,
          stock: finalStock,
          availability,
          warranty,
          image: image.trim() || SAMPLE_IMAGES[0].url,
          description: description.trim(),
          isHidden: !showOnStorefront
        };

        const created = DataStorageService.addProduct(newProductData);

        // If user entered initial IMEI, record into Accounting Purchases/Stock Registry
        if (initialImei.trim()) {
          const settings = AccountingStorageService.getSettings();
          const purNum = `${settings.purchasePrefix || 'PUR-'}${settings.nextPurchaseNumber || 2001}`;
          AccountingStorageService.savePurchase({
            id: 'pur_init_' + Date.now(),
            invoiceNumber: purNum,
            billNumber: 'OPENING-STOCK',
            invoiceDate: new Date().toISOString().slice(0, 10),
            supplierId: 'sup_opening',
            supplierName: 'Opening Stock Entry',
            supplierPhone: '071-540000',
            items: [{
              id: 'pur_item_' + Date.now(),
              productId: created.id,
              productName: created.name,
              brand: created.brand,
              model: created.model || created.name,
              imeiOrSerial: initialImei.trim(),
              warrantyMonths: 12,
              qty: 1,
              purchaseCost: finalCost,
              expectedSellingPrice: finalPrice,
              totalAmount: finalCost
            }],
            subtotal: finalCost,
            discountTotal: 0,
            taxTotal: 0,
            grandTotal: finalCost,
            paidAmount: finalCost,
            dueAmount: 0,
            paymentStatus: 'paid',
            paymentMethod: 'Cash',
            paymentAccountId: 'acc_cash',
            notes: `Initial opening stock entry for ${created.name}`,
            status: 'active',
            createdBy: 'Admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          // Also explicitly register in the dedicated IMEI Vault (भण्डारण)
          AccountingStorageService.saveImeiVaultItem({
            id: 'imei_vault_' + Date.now(),
            imei: initialImei.trim(),
            productId: created.id,
            productName: created.name,
            brand: created.brand,
            model: created.model || created.name,
            status: 'In Stock',
            purchaseCost: finalCost,
            purchaseBill: purNum,
            purchaseDate: new Date().toISOString().slice(0, 10),
            supplierName: 'Opening Stock Entry',
            notes: `Initial opening stock for ${created.name}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        AccountingStorageService.recordAuditLog(
          'create',
          'inventory',
          created.id,
          `Added new product '${name}' via Accounting Platform (Price: Rs. ${finalPrice}, Stock: ${finalStock})`,
          'Admin'
        );

        onSuccess(created);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('उत्पादन सेभ गर्दा त्रुटि भयो। कृपया पुनः प्रयास गर्नुहोस्।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[94vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Edit Product in Accounting (उत्पादन विवरण सम्पादन)' : 'Add New Product in Accounting (नयाँ उत्पादन थप्नुहोस्)'}
              </h3>
              <p className="text-xs text-slate-400">
                Directly syncs to website inventory, accounting stock ledger, and profit valuation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Smartphone className="w-4 h-4 text-purple-600" />
              १. आधारभूत विवरण (Basic Details)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Product / Phone Model Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPhone 16 Pro Max 256GB Desert Titanium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Brand (ब्रान्ड)</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {BRANDS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {brand === 'Other' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Custom Brand Name</label>
                  <input
                    type="text"
                    placeholder="Enter brand name..."
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Category (वर्ग)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Condition (अवस्था)</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ProductCondition)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="New">New (सिलप्याक नयाँ)</option>
                  <option value="Pre-Owned">Pre-Owned (सेकेन्ड ह्यान्ड)</option>
                  <option value="Used">Used</option>
                  <option value="Refurbished">Refurbished</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Storage</label>
                <select
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {STORAGE_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">RAM</label>
                <select
                  value={ram}
                  onChange={(e) => setRam(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {RAM_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Color (रङ)</label>
                <input
                  type="text"
                  placeholder="e.g. Natural Titanium"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            {condition !== 'New' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-amber-950 block mb-1">Condition Grade</label>
                  <select
                    value={conditionGrade}
                    onChange={(e) => setConditionGrade(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-amber-200 rounded-lg font-semibold"
                  >
                    <option value="Grade A+ (Like New)">Grade A+ (Like New / नयाँ जस्तै)</option>
                    <option value="Grade A (Excellent)">Grade A (उत्कृष्ट)</option>
                    <option value="Grade B (Good)">Grade B (राम्रो)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-amber-950 block mb-1">Battery Health</label>
                  <input
                    type="text"
                    placeholder="e.g. 98% Or Original"
                    value={batteryHealth}
                    onChange={(e) => setBatteryHealth(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-amber-200 rounded-lg font-semibold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Pricing & Accounting Stock */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              २. मूल्य तथा स्टक मौज्दात (Pricing & Stock Inventory)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Retail Selling Price (बिक्री मूल्य) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 195000"
                    value={price}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setPrice(val);
                      if (!costPrice && typeof val === 'number') {
                        setCostPrice(Math.round(val * 0.85));
                      }
                    }}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Cost / Purchase Price (खरिद लागत) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 165000"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Used for inventory balance & profit calculation</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Current Stock Qty (मौज्दात संख्या)
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[10px] text-emerald-700 font-semibold">
                  {stock > 0 ? `✓ In Stock (${stock} units on website)` : '✗ Out of Stock'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Original / MRP Price (optional, for discount badge)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 210000"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Warranty Period</label>
                <input
                  type="text"
                  placeholder="e.g. 1 Year Official Brand Warranty"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            {!isEditing && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="text-xs font-bold text-slate-800 block">
                  Handset IMEI or Serial Number (Optional / ऐच्छिक)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 359123456789012 (Leave blank if not tracking specific IMEI)"
                  value={initialImei}
                  onChange={(e) => setInitialImei(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
                <p className="text-[10px] text-slate-500">
                  IMEI प्रविष्ट गरेमा यो स्वतः IMEI Registry तथा स्टक खातामा दाखिला हुनेछ।
                </p>
              </div>
            )}
          </div>

          {/* Section 3: Photos & Website Visibility */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              ३. तस्बिर तथा वेबसाइट सेटिङ (Photo & Storefront)
            </h4>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Product Photo (उत्पादनको तस्बिर)</label>
              
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="w-24 h-24 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                  {image ? (
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Smartphone className="w-8 h-8 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center space-x-1.5 border border-slate-200">
                      <Upload className="w-3.5 h-3.5" />
                      <span>तपाईंको डिभाइसबाट फोटो छनोट गर्नुहोस् (Upload Photo)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    placeholder="वा सिधै इमेज लिङ्क (Image URL) राख्नुहोस्..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
                  />

                  {/* Sample presets */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold">Presets:</span>
                    {SAMPLE_IMAGES.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImage(s.url)}
                        className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors cursor-pointer"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Storefront visibility */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Show on Website Storefront (वेबसाइटमा प्रदर्शन गर्नुहोस्)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  यो अन गर्दा ग्राहकहरूले पसलको वेबसाइटमा यो फोन देख्न सक्नेछन्।
                </span>
              </div>
              <input
                type="checkbox"
                checked={showOnStorefront}
                onChange={(e) => setShowOnStorefront(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              रद्द गर्नुहोस् (Cancel)
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'परिवर्तन सेभ गर्नुहोस् (Save Changes)' : 'उत्पादन थप्नुहोस् (Save Product)'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
