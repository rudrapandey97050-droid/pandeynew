import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Search,
  Smartphone,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  TrendingUp,
  DollarSign,
  ArrowRightLeft,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  Printer,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Mail,
  Camera,
  Barcode,
  X
} from 'lucide-react';
import { AccountingStorageService } from '../../services/accountingStorage.ts';
import { Product } from '../../types.ts';
import { AddProductModal } from './AddProductModal.tsx';
import { ProductLedgerModal } from './ProductLedgerModal.tsx';
import { ImeiVaultModule } from './ImeiVaultModule.tsx';
import { BarcodeScannerModal } from './BarcodeScannerModal.tsx';
import { ProductLedgerSummary } from '../../types/accounting.ts';

interface InventoryLedgerModuleProps {
  initialAddProductOpen?: boolean;
  onCloseAddProduct?: () => void;
  onOpenGmailReport?: () => void;
}

export const InventoryLedgerModule: React.FC<InventoryLedgerModuleProps> = ({
  initialAddProductOpen = false,
  onCloseAddProduct,
  onOpenGmailReport
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'imei' | 'valuation' | 'ledger'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBarcodeScanOpen, setIsBarcodeScanOpen] = useState(false);
  const [brandFilter, setBrandFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [productsList, setProductsList] = useState<Product[]>(() => AccountingStorageService.getInventoryItems());
  
  // Product add/edit modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialAddProductOpen);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  // Product ledger view state
  const [ledgerModalProductId, setLedgerModalProductId] = useState<string | null>(null);
  const [selectedLedgerProductId, setSelectedLedgerProductId] = useState<string>(
    productsList[0]?.id || ''
  );
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'all' | 'purchase' | 'sales' | 'returns'>('all');
  const [ledgerSearch, setLedgerSearch] = useState('');

  useEffect(() => {
    if (!selectedLedgerProductId && productsList.length > 0) {
      setSelectedLedgerProductId(productsList[0].id);
    }
  }, [productsList, selectedLedgerProductId]);

  useEffect(() => {
    if (initialAddProductOpen) {
      setIsAddModalOpen(true);
      setEditingProduct(null);
    }
  }, [initialAddProductOpen]);

  // Subscribe to live updates within accounting module
  useEffect(() => {
    const unsub = AccountingStorageService.subscribe(() => {
      setProductsList(AccountingStorageService.getInventoryItems());
    });
    return () => unsub();
  }, []);

  const products = productsList;
  const salesInvoices = AccountingStorageService.getSalesInvoices();
  const purchases = AccountingStorageService.getPurchases();

  const handleUpdateStock = (productId: string, newStock: number) => {
    AccountingStorageService.updateInventoryStock(productId, newStock);
    setProductsList(AccountingStorageService.getInventoryItems());
  };

  const handleDeleteProduct = (product: Product) => {
    const confirmMsg = `के तपाईं '${product.name}' उत्पादन खाता प्रणालीको मौज्दातबाट हटाउन निश्चित हुनुहुन्छ?\n\nयो खाताको आन्तरिक स्टक सूचीबाट हट्नेछ। (वेबसाइटमा कुनै असर पर्ने छैन)`;
    if (window.confirm(confirmMsg)) {
      AccountingStorageService.deleteInventoryItem(product.id);
      setProductsList(AccountingStorageService.getInventoryItems());
      setToastMsg(`'${product.name}' सफलतापूर्वक हटाइयो।`);
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleSetAllStock = (targetQty: number) => {
    const updated = products.map(p => ({
      ...p,
      stock: targetQty,
      availability: (targetQty > 0 ? (targetQty <= 2 ? 'Limited Stock' : 'In Stock') : 'Out of Stock') as any
    }));
    AccountingStorageService.saveInventoryItems(updated);
    setProductsList(AccountingStorageService.getInventoryItems());
  };

  // Search dedicated IMEI vault when user searches by query
  const matchedVaultImeis = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    return AccountingStorageService.searchImeiVault(q);
  }, [searchQuery]);

  // All IMEI Registry (combining purchase inwards and sales outwards)
  const imeiRegistry = useMemo(() => {
    const list: Array<{
      imei: string;
      productName: string;
      brand: string;
      status: 'In Stock' | 'Sold';
      purchaseBill?: string;
      purchaseDate?: string;
      salesInvoice?: string;
      salesDate?: string;
      customerName?: string;
    }> = [];

    // Track sold IMEIs
    const soldImeis = new Map<string, { inv: string; date: string; customer: string }>();
    salesInvoices.forEach(inv => {
      if (inv.status !== 'cancelled') {
        inv.items.forEach(it => {
          if (it.imeiOrSerial) {
            soldImeis.set(it.imeiOrSerial.trim(), {
              inv: inv.invoiceNumber,
              date: inv.invoiceDate,
              customer: inv.customerName
            });
          }
        });
      }
    });

    // Inward from Purchases
    purchases.forEach(pur => {
      pur.items.forEach(it => {
        if (it.imeiOrSerial) {
          const trimmed = it.imeiOrSerial.trim();
          const soldInfo = soldImeis.get(trimmed);
          list.push({
            imei: trimmed,
            productName: it.productName,
            brand: it.brand || 'Apple',
            status: soldInfo ? 'Sold' : 'In Stock',
            purchaseBill: pur.invoiceNumber,
            purchaseDate: pur.invoiceDate,
            salesInvoice: soldInfo?.inv,
            salesDate: soldInfo?.date,
            customerName: soldInfo?.customer
          });
        }
      });
    });

    return list;
  }, [salesInvoices, purchases]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.model && p.model.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchBrand = brandFilter === 'all' || p.brand === brandFilter;
      const stock = p.stock || 0;
      const matchStock =
        stockFilter === 'all'
          ? true
          : stockFilter === 'in_stock'
          ? stock > 0
          : stock <= 0;
      return matchSearch && matchBrand && matchStock;
    });
  }, [products, searchQuery, brandFilter, stockFilter]);

  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-serif">
            Stock Valuation & IMEI Ledger (स्टक मूल्याङ्कन तथा आइएमइआई खाता)
          </h2>
          <p className="text-xs text-slate-500">
            Real-time synchronization with website inventory, purchase valuation & handset serial tracking
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenGmailReport && (
            <button
              type="button"
              onClick={onOpenGmailReport}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5 shrink-0"
              title="Send Daily Stock & Valuation Report to Gmail"
            >
              <Mail className="w-4 h-4" />
              <span>Send Stock Report to Gmail</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ नयाँ उत्पादन थप्नुहोस् (+ Add Product)</span>
          </button>

          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'stock' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Stock Balance ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('imei')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'imei' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              IMEI भण्डारण (Vault)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('valuation')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'valuation' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Stock Valuation
            </button>
            <button
              type="button"
              onClick={() => {
                if (!selectedLedgerProductId && products.length > 0) {
                  setSelectedLedgerProductId(products[0].id);
                }
                setActiveTab('ledger');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'ledger' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Product Ledger (खाता)</span>
            </button>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TAB 1: Stock Balance Table */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* Visitor Storefront Sync Notice Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center space-x-2.5 text-slate-900">
              <Package className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="font-bold text-slate-950">
                  स्टक मौज्दात व्यवस्थापन (Stock Balance Inventory):
                </p>
                <p className="text-slate-600 text-[11px]">
                  यहाँ हाल पसलमा मौज्दात रहेका सबै सामान तथा फोनहरूको संख्या र मूल्य प्रत्यक्ष देखिन्छ। उत्पादनको मूल्य, विवरण वा स्टक संख्या परिवर्तन गर्न दायाँपट्टिको <b>"सम्पादन (Edit)"</b> वा <b>"+ नयाँ फोन/सामान थप्नुहोस्"</b> प्रयोग गर्नुहोस्।
                </p>
              </div>
            </div>
          </div>

          {/* Dedicated IMEI Search Results banner if user is searching and matching IMEIs exist */}
          {matchedVaultImeis.length > 0 && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-indigo-950 font-bold">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>🔍 IMEI भण्डारण खोजी परिणाम ({matchedVaultImeis.length} वटा IMEI फेला पर्यो):</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('imei')}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs"
                >
                  <span>IMEI भण्डारण हेर्नुहोस् (Open Vault)</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {matchedVaultImeis.slice(0, 6).map((item) => (
                  <div key={item.id} className="p-2.5 bg-white border border-indigo-100 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-indigo-700 tracking-wider">{item.imei}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'In Stock' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 truncate">
                      {item.productName} ({item.brand})
                    </div>
                    {item.salesInvoice && (
                      <div className="text-[11px] text-slate-500">
                        बिक्री बिल: <span className="font-bold text-slate-700">{item.salesInvoice}</span> • {item.customerName || 'Customer'}
                      </div>
                    )}
                    {item.purchaseBill && !item.salesInvoice && (
                      <div className="text-[11px] text-slate-500">
                        खरिद बिल: <span className="font-bold text-slate-700">{item.purchaseBill}</span> • {item.supplierName || 'Supplier'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search model, brand, phone, IMEI..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsBarcodeScanOpen(true)}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-2xs"
                  title="क्यामराबाट बारकोड वा IMEI स्क्यान गरी खोज्नुहोस्"
                >
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Scan</span>
                </button>

                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="all">All Brands</option>
                  {brands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Stock Filter Pills */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    stockFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  सबै ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('in_stock')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    stockFilter === 'in_stock' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  स्टक भएका मात्र ({products.filter(p => (p.stock || 0) > 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('out_of_stock')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    stockFilter === 'out_of_stock' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  स्टक सकिएका ({products.filter(p => (p.stock || 0) <= 0).length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsAddModalOpen(true);
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1 shrink-0 ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ नयाँ फोन/सामान थप्नुहोस्</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Brand & Model</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">In Stock (Qty)</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Est. Cost</th>
                    <th className="py-3 px-4 text-right">Stock Valuation</th>
                    <th className="py-3 px-4 text-center">Visitor Status</th>
                    <th className="py-3 px-4 text-center">Actions (कार्य)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(p => {
                    const stock = p.stock || 0;
                    const price = p.discountPrice || p.price;
                    const estCost = Math.round(price * 0.85);
                    const totalVal = stock * estCost;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => setLedgerModalProductId(p.id)}
                            className="font-bold text-slate-950 hover:text-indigo-600 block text-left cursor-pointer transition-colors"
                            title="Click to view full product ledger statement"
                          >
                            {p.name}
                          </button>
                          {p.brand && <span className="text-[11px] text-slate-500 font-medium">{p.brand} {p.model}</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{p.category}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-baseline space-x-1 font-mono">
                            <span className="font-black text-sm text-slate-900">{stock}</span>
                            <span className="text-[11px] text-slate-500 font-medium">थान</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                          Rs. {price.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          Rs. {estCost.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-950">
                          Rs. {totalVal.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {stock > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              In Stock ({stock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                              Out of Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setLedgerModalProductId(p.id)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer border border-indigo-200 hover:border-indigo-600 shadow-2xs"
                              title="View Product Movement Ledger / Bin Card (सामान खाता हेर्नुहोस्)"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>खाता (Ledger)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct(p);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 rounded-lg transition-colors cursor-pointer"
                              title="Edit product details (विवरण सम्पादन गर्नुहोस्)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Delete product (मेटाउनुहोस्)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IMEI Vault (Dedicated भण्डारण) */}
      {activeTab === 'imei' && (
        <ImeiVaultModule initialSearch={searchQuery} />
      )}

      {/* TAB 3: Stock Valuation Breakdown */}
      {activeTab === 'valuation' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Brand-Wise Inventory Valuation Breakdown (ब्रान्ड अनुसार स्टक सम्पत्ति)
          </h3>

          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b">
                  <th className="py-2.5 px-4">Brand</th>
                  <th className="py-2.5 px-4 text-center">Models Count</th>
                  <th className="py-2.5 px-4 text-center">Total Units In Stock</th>
                  <th className="py-2.5 px-4 text-right">Est. Cost Value</th>
                  <th className="py-2.5 px-4 text-right">Retail Value</th>
                  <th className="py-2.5 px-4 text-right">Potential Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {brands.map(brand => {
                  const brandProducts = products.filter(p => p.brand === brand);
                  const units = brandProducts.reduce((acc, p) => acc + (p.stock || 0), 0);
                  const retail = brandProducts.reduce((acc, p) => acc + ((p.stock || 0) * (p.discountPrice || p.price)), 0);
                  const cost = Math.round(retail * 0.85);

                  return (
                    <tr key={brand} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{brand}</td>
                      <td className="py-2.5 px-4 text-center text-slate-600">{brandProducts.length}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold">{units}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-700">Rs. {cost.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-indigo-700">Rs. {retail.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-purple-700">Rs. {(retail - cost).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Dedicated Product Movement Ledger (सामान खाता) */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Top Product Switcher & Control Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Product for Ledger Statement (सामान खाता छनौट):
                </label>
                <select
                  value={selectedLedgerProductId}
                  onChange={(e) => setSelectedLedgerProductId(e.target.value)}
                  className="mt-1 w-full max-w-md px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.brand || 'No Brand'} • Stock: {p.stock || 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedLedgerProductId && (
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setLedgerModalProductId(selectedLedgerProductId)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
                  title="Open full-screen printable ledger modal"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>प्रिन्ट / विस्तृत दृश्य (Print / Full View)</span>
                </button>
              </div>
            )}
          </div>

          {/* Render the Ledger details inline */}
          {selectedLedgerProductId ? (
            (() => {
              const currentLedger = AccountingStorageService.getProductLedger(selectedLedgerProductId);
              if (!currentLedger) {
                return (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <p className="text-slate-500 font-bold">यो सामानको लागि खाता विवरण फेला परेन।</p>
                  </div>
                );
              }

              // Filter ledger entries
              let entries = [...currentLedger.entries];
              if (ledgerTypeFilter !== 'all') {
                if (ledgerTypeFilter === 'purchase') {
                  entries = entries.filter(e => e.type === 'Purchase Inward' || e.type === 'Opening Stock');
                } else if (ledgerTypeFilter === 'sales') {
                  entries = entries.filter(e => e.type === 'Sales Outward');
                } else if (ledgerTypeFilter === 'returns') {
                  entries = entries.filter(e => e.type.includes('Return'));
                }
              }

              if (ledgerSearch.trim()) {
                const q = ledgerSearch.toLowerCase();
                entries = entries.filter(e =>
                  e.refNumber.toLowerCase().includes(q) ||
                  e.partyName.toLowerCase().includes(q) ||
                  (e.imei && e.imei.toLowerCase().includes(q)) ||
                  (e.remarks && e.remarks.toLowerCase().includes(q))
                );
              }

              return (
                <div className="space-y-4">
                  {/* Product Summary KPIs */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">कुल दाखिला (Inwards)</span>
                        <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-xl font-black font-mono text-slate-900">
                        {currentLedger.totalInwardQty} <span className="text-xs font-normal text-slate-500">Units</span>
                      </p>
                      <p className="text-xs text-emerald-700 font-mono mt-0.5 font-semibold">
                        Rs. {currentLedger.totalInwardValue.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">कुल बिक्री (Outwards)</span>
                        <ArrowUpRight className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-xl font-black font-mono text-slate-900">
                        {currentLedger.totalOutwardQty} <span className="text-xs font-normal text-slate-500">Units</span>
                      </p>
                      <p className="text-xs text-blue-700 font-mono mt-0.5 font-semibold">
                        Rs. {currentLedger.totalOutwardValue.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-purple-100 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">खुद नाफा (Gross Profit)</span>
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className={`text-xl font-black font-mono ${
                        currentLedger.totalGrossProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        Rs. {currentLedger.totalGrossProfit.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {currentLedger.totalOutwardValue > 0
                          ? `Margin: ${((currentLedger.totalGrossProfit / currentLedger.totalOutwardValue) * 100).toFixed(1)}%`
                          : 'No sales yet'}
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">हालको मौज्दात (Stock)</span>
                        <Package className="w-4 h-4 text-indigo-600" />
                      </div>
                      <p className="text-xl font-black font-mono text-slate-900">
                        {currentLedger.currentStock} <span className="text-xs font-normal text-slate-500">Units</span>
                      </p>
                      <p className="text-xs text-indigo-700 font-mono mt-0.5 font-bold">
                        Rs. {(currentLedger.currentStock * currentLedger.costPrice).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search bill no, customer/supplier, IMEI..."
                        value={ledgerSearch}
                        onChange={(e) => setLedgerSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setLedgerTypeFilter('all')}
                        className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                          ledgerTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        सबै ({currentLedger.entries.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setLedgerTypeFilter('purchase')}
                        className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                          ledgerTypeFilter === 'purchase' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
                        }`}
                      >
                        दाखिला (Inward)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLedgerTypeFilter('sales')}
                        className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                          ledgerTypeFilter === 'sales' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-700'
                        }`}
                      >
                        निकासी (Outward)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLedgerTypeFilter('returns')}
                        className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                          ledgerTypeFilter === 'returns' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-purple-700'
                        }`}
                      >
                        फिर्ता (Returns)
                      </button>
                    </div>
                  </div>

                  {/* Ledger Movement Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white font-bold">
                            <th className="py-2.5 px-3">मिति (Date)</th>
                            <th className="py-2.5 px-3">प्रकार (Type)</th>
                            <th className="py-2.5 px-3">भौचर नं. (Voucher No.)</th>
                            <th className="py-2.5 px-3">सम्बन्धित पक्ष (Party)</th>
                            <th className="py-2.5 px-3">IMEI / Serial</th>
                            <th className="py-2.5 px-3 text-right bg-emerald-950/40 text-emerald-300">दाखिला (Inward)</th>
                            <th className="py-2.5 px-3 text-right bg-blue-950/40 text-blue-300">निकासी (Outward)</th>
                            <th className="py-2.5 px-3 text-right bg-purple-950/40 text-purple-300">नाफा (Profit)</th>
                            <th className="py-2.5 px-3 text-right bg-slate-800 text-slate-200">मौज्दात (Balance)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {entries.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-10 text-center text-slate-500">
                                कुनै कारोबार भेटिएन (No transactions for this filter)
                              </td>
                            </tr>
                          ) : (
                            entries.map((entry, idx) => (
                              <tr key={entry.id || idx} className="hover:bg-slate-50/80">
                                <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">{entry.date}</td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  {entry.type === 'Opening Stock' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                      Opening
                                    </span>
                                  ) : entry.type === 'Purchase Inward' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Purchase
                                    </span>
                                  ) : entry.type === 'Sales Outward' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      Sales
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                      Return
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">{entry.refNumber}</td>
                                <td className="py-2.5 px-3 text-slate-800 font-semibold">{entry.partyName}</td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                                  {entry.imei ? (
                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold border border-slate-200">
                                      {entry.imei}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono bg-emerald-50/30">
                                  {entry.inwardQty > 0 ? (
                                    <div>
                                      <span className="font-bold text-emerald-800">+{entry.inwardQty}</span>
                                      <span className="text-[10px] text-slate-500 block">@ Rs. {entry.inwardRate.toLocaleString()}</span>
                                    </div>
                                  ) : '-'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono bg-blue-50/30">
                                  {entry.outwardQty > 0 ? (
                                    <div>
                                      <span className="font-bold text-blue-800">-{entry.outwardQty}</span>
                                      <span className="text-[10px] text-slate-500 block">@ Rs. {entry.outwardRate.toLocaleString()}</span>
                                    </div>
                                  ) : '-'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono bg-purple-50/30">
                                  {entry.profitEarned !== undefined ? (
                                    <span className={`font-bold ${
                                      entry.profitEarned >= 0 ? 'text-purple-800' : 'text-rose-600'
                                    }`}>
                                      Rs. {entry.profitEarned.toLocaleString()}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono bg-slate-50 font-bold">
                                  <span className="text-slate-900">{entry.balanceQty}</span>
                                  <span className="text-[10px] text-indigo-700 block font-normal">
                                    Rs. {entry.balanceValue.toLocaleString()}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">कुनै सामान उपलब्ध छैन (No products available)</p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
          if (onCloseAddProduct) onCloseAddProduct();
        }}
        onSuccess={(savedProduct) => {
          setProductsList(AccountingStorageService.getInventoryItems());
          setToastMsg(`'${savedProduct.name}' सफलतापुर्वक सुरक्षित गरियो!`);
          setTimeout(() => setToastMsg(''), 4000);
        }}
        editingProduct={editingProduct}
      />

      {/* Product Movement Ledger Modal (Bin Card / खाता) */}
      {ledgerModalProductId && (
        <ProductLedgerModal
          productId={ledgerModalProductId}
          allProducts={products}
          onSelectProduct={(newId) => {
            setLedgerModalProductId(newId);
            setSelectedLedgerProductId(newId);
          }}
          onClose={() => setLedgerModalProductId(null)}
        />
      )}

      {/* CAMERA BARCODE / IMEI SCANNER MODAL */}
      <BarcodeScannerModal
        isOpen={isBarcodeScanOpen}
        onClose={() => setIsBarcodeScanOpen(false)}
        onScan={(scanned) => {
          setSearchQuery(scanned.trim());
          setToastMsg(`Scanned: ${scanned.trim()}`);
          setTimeout(() => setToastMsg(''), 3000);
        }}
        title="स्टक बारकोड / IMEI स्क्यानर"
        subtitle="मोबाइल क्यामराबाट फोनको बारकोड वा बक्स स्क्यान गरी मौज्दात जाँच्नुहोस्"
        placeholderText="बारकोड वा IMEI टाइप गर्नुहोस्..."
      />

    </div>
  );
};
