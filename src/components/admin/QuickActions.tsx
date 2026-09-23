import React, { useState, useMemo } from 'react';
import {
  PackagePlus,
  FileBarChart,
  RefreshCw,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Wrench,
  Search,
  UploadCloud,
  TrendingUp,
  Clock,
  Printer,
  Calculator
} from 'lucide-react';
import { Product, PhoneValuationRequest, RepairBooking, ProductCondition } from '../../types.ts';
import { AuthService } from '../../services/authService.ts';
import { UserService } from '../../services/userService.ts';
import { DataStorageService } from '../../services/dataStorage.ts';
import { FirestoreService } from '../../services/firestoreService.ts';
import { AccountingStorageService } from '../../services/accountingStorage.ts';

export type AdminTab =
  | 'valuations'
  | 'upcoming'
  | 'products'
  | 'lineup'
  | 'rateList'
  | 'repairs'
  | 'sheets'
  | 'cloudsql'
  | 'settings'
  | 'security'
  | 'users';

interface QuickActionsProps {
  products: Product[];
  valuations: PhoneValuationRequest[];
  bookings: RepairBooking[];
  onDataRefresh: () => void;
  onNavigateTab: (tab: AdminTab) => void;
  onOpenAccounting?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  products,
  valuations,
  bookings,
  onDataRefresh,
  onNavigateTab,
  onOpenAccounting
}) => {
  // 1. Authenticated Admin Authorization Check
  const session = AuthService.getLocalSession();
  const activeUser = UserService.getActiveUser();

  const isAuthenticated = Boolean(
    session &&
    session.token &&
    (!session.expiresAt || Date.now() < session.expiresAt)
  );

  const isAuthenticatedAdmin = Boolean(
    isAuthenticated && (
      activeUser?.isPrimaryAdmin ||
      session?.isPrimaryAdmin ||
      activeUser?.role === 'admin' ||
      activeUser?.role === 'secondary_admin' ||
      session?.role?.toLowerCase().includes('admin') ||
      session?.role?.toLowerCase().includes('owner') ||
      (activeUser?.permissions?.canManageProducts && activeUser?.permissions?.canManageSettings)
    )
  );

  // STRICT GUARD: If not an authenticated admin, do not render at all
  if (!isAuthenticatedAdmin) {
    return null;
  }

  // --- State for Modals & Database Sync ---
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showTodayReportModal, setShowTodayReportModal] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string; count?: number } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('pms_last_db_sync_time');
      return stored ? new Date(parseInt(stored, 10)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
    } catch {
      return null;
    }
  });

  // --- Add Stock Modal State ---
  const [addStockMode, setAddStockMode] = useState<'restock_existing' | 'create_new'>('restock_existing');
  
  // Existing product restock state
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [restockQty, setRestockQty] = useState<number>(1);
  const [restockNote, setRestockNote] = useState('');
  const [restockSuccessMsg, setRestockSuccessMsg] = useState<string | null>(null);

  // Brand new product state
  const [newBrand, setNewBrand] = useState('Apple');
  const [newModel, setNewModel] = useState('');
  const [newStorage, setNewStorage] = useState('128GB');
  const [newRam, setNewRam] = useState('6GB');
  const [newColor, setNewColor] = useState('Black');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newOriginalPrice, setNewOriginalPrice] = useState<number | ''>('');
  const [newCondition, setNewCondition] = useState<ProductCondition>('New');
  const [newInitialStock, setNewInitialStock] = useState<number>(1);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [createProductSuccessMsg, setCreateProductSuccessMsg] = useState<string | null>(null);

  // Filtered products for quick restock
  const filteredProducts = useMemo(() => {
    if (!searchProductQuery.trim()) return products.slice(0, 15);
    const q = searchProductQuery.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.color && p.color.toLowerCase().includes(q)) ||
      (p.storage && p.storage.toLowerCase().includes(q))
    );
  }, [products, searchProductQuery]);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  // --- Sync Database Handler ---
  const handleSyncDatabase = async () => {
    if (isSyncingDb) return;
    setIsSyncingDb(true);
    setSyncFeedback(null);

    try {
      // Step 1: Push all local datasets to cloud firestore
      const pushRes = await FirestoreService.pushAllToCloud();
      
      // Step 2: Pull any remote updates
      await FirestoreService.pullAllFromCloud();

      const now = Date.now();
      localStorage.setItem('pms_last_db_sync_time', now.toString());
      setLastSyncTime(new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      onDataRefresh();

      setSyncFeedback({
        type: 'success',
        message: `Database synchronization completed successfully. ${pushRes.count} items synchronized with cloud storage.`,
        count: pushRes.count
      });

      setTimeout(() => {
        setSyncFeedback(null);
      }, 5000);
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: `Database synchronization encountered an error: ${err?.message || String(err)}`
      });
    } finally {
      setIsSyncingDb(false);
    }
  };

  // --- Restock Existing Product Handler ---
  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || restockQty <= 0) return;

    const currentStock = typeof selectedProduct.stock === 'number' ? selectedProduct.stock : 0;
    const newStockCount = currentStock + restockQty;

    DataStorageService.updateProductStock(selectedProduct.id, newStockCount);
    onDataRefresh();

    setRestockSuccessMsg(`स्टक अपडेट भयो! ${selectedProduct.name} मा +${restockQty} थपियो (कुल: ${newStockCount} pcs)`);
    setTimeout(() => {
      setRestockSuccessMsg(null);
      setSelectedProductId('');
      setRestockQty(1);
      setRestockNote('');
      setShowAddStockModal(false);
    }, 2000);
  };

  // --- Create Brand New Stock Product Handler ---
  const handleCreateNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.trim()) return;

    const priceNum = typeof newPrice === 'number' ? newPrice : 0;
    const originalPriceNum = typeof newOriginalPrice === 'number' ? newOriginalPrice : (priceNum > 0 ? priceNum + 5000 : undefined);
    const stockNum = Math.max(1, newInitialStock);

    const defaultImage = newImageUrl.trim() || (
      newBrand === 'Apple'
        ? 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80'
        : newBrand === 'Samsung'
        ? 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80'
    );

    const fullName = `${newBrand} ${newModel.trim()}`.replace(new RegExp(`^${newBrand}\\s+${newBrand}`, 'i'), newBrand);

    DataStorageService.addProduct({
      name: fullName,
      brand: newBrand,
      model: newModel.trim(),
      category: newBrand === 'Accessories' ? 'Accessories' : 'Smartphone',
      price: priceNum,
      originalPrice: originalPriceNum,
      condition: newCondition,
      availability: stockNum > 0 ? (stockNum <= 2 ? 'Limited Stock' : 'In Stock') : 'Out of Stock',
      stock: stockNum,
      storage: newStorage,
      ram: newRam,
      color: newColor,
      image: defaultImage,
      description: `${fullName} (${newStorage}, ${newColor}) in ${newCondition} condition available at Pandey Mobile Store, Butwal.`
    });

    onDataRefresh();

    setCreateProductSuccessMsg(`नयाँ उत्पादन '${fullName}' सफलतापूर्वक स्टकमा थपियो!`);
    setTimeout(() => {
      setCreateProductSuccessMsg(null);
      setNewModel('');
      setNewPrice('');
      setNewOriginalPrice('');
      setNewInitialStock(1);
      setShowAddStockModal(false);
    }, 2000);
  };

  // --- Today's Report Calculation ---
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todayReport = useMemo(() => {
    // 1. Stock Metrics
    const totalInventoryCount = products.reduce((acc, p) => acc + (typeof p.stock === 'number' ? p.stock : 0), 0);
    const lowStockItems = products.filter(p => typeof p.stock === 'number' && p.stock > 0 && p.stock <= 2);
    const outOfStockItems = products.filter(p => !p.stock || p.stock === 0);

    // 2. Today's Valuations
    const todayValuations = valuations.filter(v => {
      const vDate = v.createdAt ? v.createdAt.slice(0, 10) : '';
      return vDate === todayStr;
    });

    // 3. Today's Repairs
    const todayRepairs = bookings.filter(b => {
      const bDate = b.preferredDate ? b.preferredDate.slice(0, 10) : (b.createdAt ? b.createdAt.slice(0, 10) : '');
      return bDate === todayStr;
    });

    // 4. Today's Invoices & Sales from Accounting System
    let todaySalesTotal = 0;
    let todaySalesCount = 0;
    try {
      const sales = AccountingStorageService.getSalesInvoices();
      const todaySales = sales.filter(s => s.invoiceDate === todayStr);
      todaySalesCount = todaySales.length;
      todaySalesTotal = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);
    } catch {
      // fallback
    }

    return {
      todayStr,
      totalInventoryCount,
      lowStockItems,
      outOfStockItems,
      todayValuations,
      todayRepairs,
      todaySalesCount,
      todaySalesTotal
    };
  }, [products, valuations, bookings, todayStr]);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg relative overflow-hidden select-none">
      
      {/* Decorative ambient gradient overlay */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      
      {/* Top Banner Row: Title + Admin Badge + Last Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Admin Quick Actions
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Authorized Admin</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              द्रुत कार्य सर्टकटहरू • Logged in as: <strong className="text-slate-200">{activeUser?.name || session?.name || 'Administrator'}</strong>
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          {lastSyncTime && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Last Sync: <strong className="text-slate-300 font-mono">{lastSyncTime}</strong></span>
            </div>
          )}
          <div className="hidden md:flex items-center space-x-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Total Stock: <strong className="text-white font-mono">{todayReport.totalInventoryCount} pcs</strong></span>
          </div>
        </div>
      </div>

      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <div
          className={`mt-3 p-3 rounded-xl border text-xs flex items-center justify-between animate-fade-in relative z-10 ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Shortcut Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 relative z-10">
        
        {/* 1. Add New Stock Shortcut */}
        <button
          id="btn-quick-action-add-stock"
          type="button"
          onClick={() => {
            setRestockSuccessMsg(null);
            setCreateProductSuccessMsg(null);
            setShowAddStockModal(true);
          }}
          className="group flex items-center justify-between p-3.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/60 rounded-xl transition-all shadow-sm hover:shadow-indigo-500/10 cursor-pointer text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block group-hover:text-indigo-300 transition-colors">
                Add New Stock
              </span>
              <span className="text-[11px] text-slate-400 block">
                नयाँ स्टक थप्नुहोस्
              </span>
            </div>
          </div>
          <Plus className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* 2. View Today's Report Shortcut */}
        <button
          id="btn-quick-action-today-report"
          type="button"
          onClick={() => setShowTodayReportModal(true)}
          className="group flex items-center justify-between p-3.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/60 rounded-xl transition-all shadow-sm hover:shadow-emerald-500/10 cursor-pointer text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <FileBarChart className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block group-hover:text-emerald-300 transition-colors">
                View Today&apos;s Report
              </span>
              <span className="text-[11px] text-slate-400 block">
                आजको दैनिक प्रतिवेदन
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* 3. Sync Database Shortcut */}
        <button
          id="btn-quick-action-sync-db"
          type="button"
          onClick={handleSyncDatabase}
          disabled={isSyncingDb}
          className="group flex items-center justify-between p-3.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/60 rounded-xl transition-all shadow-sm hover:shadow-sky-500/10 cursor-pointer text-left disabled:opacity-60 disabled:cursor-not-allowed"
          title="Synchronize database with Firestore Cloud"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center group-hover:scale-105 group-hover:bg-sky-500 group-hover:text-white transition-all">
              <RefreshCw className={`w-5 h-5 ${isSyncingDb ? 'animate-spin text-sky-300' : ''}`} />
            </div>
            <div>
              <span className="text-xs font-bold text-white block group-hover:text-sky-300 transition-colors">
                {isSyncingDb ? 'Syncing Database...' : 'Sync Database'}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {isSyncingDb ? 'क्लाउडमा सिङ्क हुँदैछ...' : 'क्लाउड डाटाबेस सिङ्क'}
              </span>
            </div>
          </div>
          <UploadCloud className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
        </button>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW STOCK MODAL                                              */}
      {/* ========================================================================= */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-3xl sticky top-0 z-20 backdrop-blur-xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Add New Stock (स्टक व्यवस्थापन)
                  </h3>
                  <p className="text-xs text-slate-500">
                    विद्यमान मोडलमा परिमाण थप्नुहोस् वा नयाँ स्मार्टफोन दर्ता गर्नुहोस्
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStockModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="px-5 pt-4">
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAddStockMode('restock_existing')}
                  className={`py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                    addStockMode === 'restock_existing'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>विद्यमान मोडलमा थप्नुहोस् (Add Qty)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddStockMode('create_new')}
                  className={`py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                    addStockMode === 'create_new'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>नयाँ सामान दर्ता (Register New)</span>
                </button>
              </div>
            </div>

            <div className="p-5">
              
              {/* Restock Success Feedback */}
              {restockSuccessMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{restockSuccessMsg}</span>
                </div>
              )}

              {/* Create Product Success Feedback */}
              {createProductSuccessMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{createProductSuccessMsg}</span>
                </div>
              )}

              {/* MODE 1: RESTOCK EXISTING PRODUCT */}
              {addStockMode === 'restock_existing' && (
                <form onSubmit={handleConfirmRestock} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      स्टक थप्ने स्मार्टफोन वा सामान खोज्नुहोस् (Search Product)
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="उदा: iPhone 15, Samsung S24, Vivo V30..."
                        value={searchProductQuery}
                        onChange={(e) => setSearchProductQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      मोडल छान्नुहोस् (Select Model) *
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      required
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
                    >
                      <option value="">-- उत्पादन छान्नुहोस् ({filteredProducts.length} उपलब्ध) --</option>
                      {filteredProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.storage || 'Standard'}, {p.color || 'Default'}) — हालको स्टक: {p.stock ?? 0} pcs — Rs. {p.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedProduct && (
                    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <img
                          src={selectedProduct.image}
                          alt={selectedProduct.name}
                          className="w-12 h-12 rounded-xl object-contain bg-white border border-indigo-100 p-1 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-indigo-950 text-sm">{selectedProduct.name}</p>
                          <p className="text-slate-600 text-[11px]">
                            {selectedProduct.brand} • {selectedProduct.storage || 'Standard'} • {selectedProduct.color || 'Default'}
                          </p>
                          <p className="text-indigo-700 font-bold font-mono">Rs. {selectedProduct.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">हालको मौज्दात:</span>
                        <span className="text-base font-black font-mono text-slate-900">
                          {selectedProduct.stock ?? 0} pcs
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        थपिने परिमाण (Quantity to Add) *
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max="999"
                          required
                          value={restockQty}
                          onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-28 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-center focus:outline-hidden focus:border-indigo-500"
                        />
                        <div className="flex items-center space-x-1">
                          {[1, 5, 10].map(qty => (
                            <button
                              key={qty}
                              type="button"
                              onClick={() => setRestockQty(qty)}
                              className="px-2 py-1.5 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              +{qty}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        कैफियत / नोट (Remarks / Invoice Note)
                      </label>
                      <input
                        type="text"
                        placeholder="उदा: New lot received / Supplier bill"
                        value={restockNote}
                        onChange={(e) => setRestockNote(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddStockModal(false);
                        onNavigateTab('products');
                      }}
                      className="text-xs text-indigo-600 hover:underline font-bold"
                    >
                      पूर्ण इन्भेन्टरी म्यानेजर खोल्नुहोस् →
                    </button>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowAddStockModal(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        रद्द गर्नुहोस्
                      </button>
                      <button
                        type="submit"
                        disabled={!selectedProductId}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                      >
                        स्टक थप्नुहोस् (Confirm Restock)
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* MODE 2: REGISTER BRAND NEW PRODUCT */}
              {addStockMode === 'create_new' && (
                <form onSubmit={handleCreateNewProduct} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ब्रान्ड (Brand) *
                      </label>
                      <select
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                      >
                        <option value="Apple">Apple / iPhone</option>
                        <option value="Samsung">Samsung</option>
                        <option value="Vivo">Vivo</option>
                        <option value="POCO">POCO</option>
                        <option value="HONOR">HONOR</option>
                        <option value="Redmi">Redmi</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        मोडलको नाम (Model Name) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="उदा: 16 Pro Max, S24 Ultra, V30 5G"
                        value={newModel}
                        onChange={(e) => setNewModel(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Storage
                      </label>
                      <select
                        value={newStorage}
                        onChange={(e) => setNewStorage(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                      >
                        <option value="64GB">64GB</option>
                        <option value="128GB">128GB</option>
                        <option value="256GB">256GB</option>
                        <option value="512GB">512GB</option>
                        <option value="1TB">1TB</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        RAM
                      </label>
                      <select
                        value={newRam}
                        onChange={(e) => setNewRam(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                      >
                        <option value="4GB">4GB</option>
                        <option value="6GB">6GB</option>
                        <option value="8GB">8GB</option>
                        <option value="12GB">12GB</option>
                        <option value="16GB">16GB</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Color
                      </label>
                      <input
                        type="text"
                        placeholder="उदा: Natural Titanium, Black"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        बिक्री मूल्य (Selling Price NPR) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="उदा: 145000"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        कन्डिसन (Condition)
                      </label>
                      <select
                        value={newCondition}
                        onChange={(e) => setNewCondition(e.target.value as ProductCondition)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                      >
                        <option value="New">New (सीलप्याक नयाँ)</option>
                        <option value="Pre-Owned">Pre-Owned (सेकेन्ड ह्याण्ड)</option>
                        <option value="Used">Used (प्रयोग गरिएको)</option>
                        <option value="Refurbished">Refurbished</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        सुरुवाती परिमाण (Initial Stock) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        required
                        value={newInitialStock}
                        onChange={(e) => setNewInitialStock(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      तस्बिर लिङ्क (Image URL - वैकल्पिक)
                    </label>
                    <input
                      type="url"
                      placeholder="https://... (खाली राखेमा पूर्वनिर्धारित तस्बिर स्वतः प्रयोग हुन्छ)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAddStockModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      रद्द गर्नुहोस्
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      दर्ता गरी स्टकमा थप्नुहोस् (Save Stock)
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TODAY'S REPORT MODAL                                             */}
      {/* ========================================================================= */}
      {showTodayReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 rounded-t-3xl sticky top-0 z-20 backdrop-blur-xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <FileBarChart className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-900 text-base">
                      Today&apos;s Store Executive Report
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                      {todayReport.todayStr}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    पाण्डेय मोबाइल स्टोर • Traffic Chowk, Butwal • आजको समग्र व्यवसायिक अवस्था
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  title="Print Report"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowTodayReportModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-6">
              
              {/* Row 1: KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* 1. Today Sales */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="flex items-center justify-between text-emerald-800 text-xs font-bold mb-1">
                    <span>Today&apos;s Sales</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-lg font-black font-mono text-emerald-950">
                    Rs. {todayReport.todaySalesTotal.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-emerald-700">{todayReport.todaySalesCount} बिल जारी गरिएको</span>
                </div>

                {/* 2. Today Valuations */}
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl">
                  <div className="flex items-center justify-between text-indigo-800 text-xs font-bold mb-1">
                    <span>Valuations</span>
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-lg font-black font-mono text-indigo-950">
                    {todayReport.todayValuations.length}
                  </p>
                  <span className="text-[10px] text-indigo-700">आज आएका एक्सचेन्ज सोधपुछ</span>
                </div>

                {/* 3. Today Repairs */}
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                  <div className="flex items-center justify-between text-amber-800 text-xs font-bold mb-1">
                    <span>Repairs</span>
                    <Wrench className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-lg font-black font-mono text-amber-950">
                    {todayReport.todayRepairs.length}
                  </p>
                  <span className="text-[10px] text-amber-700">मर्मत अपोइन्टमेन्टहरू</span>
                </div>

                {/* 4. Total Stock Balance */}
                <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-800 text-xs font-bold mb-1">
                    <span>Stock Balance</span>
                    <Boxes className="w-4 h-4 text-slate-600" />
                  </div>
                  <p className="text-lg font-black font-mono text-slate-950">
                    {todayReport.totalInventoryCount} pcs
                  </p>
                  <span className="text-[10px] text-slate-500">कुल सक्रिय मौज्दात</span>
                </div>

              </div>

              {/* Row 2: Low Stock Warning (If any) */}
              {todayReport.lowStockItems.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Low Stock Alert (स्टक सकिन लागेका सामानहरू - २ वा कम)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-rose-200 text-rose-900 rounded-full font-bold">
                      {todayReport.lowStockItems.length} Items
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {todayReport.lowStockItems.slice(0, 6).map(item => (
                      <div key={item.id} className="p-2 bg-white rounded-xl border border-rose-200 flex items-center justify-between text-xs">
                        <div className="truncate pr-2">
                          <span className="font-bold text-slate-900 block truncate">{item.name}</span>
                          <span className="text-[10px] text-slate-500">{item.storage || 'Standard'} • {item.color || 'Default'}</span>
                        </div>
                        <span className="px-2 py-1 bg-rose-100 text-rose-800 font-mono font-bold rounded-lg shrink-0">
                          {item.stock} pcs left
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 3: Today's Valuation & Exchange Inquiries */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                    <span>आज आएका मोबाइल एक्सचेन्ज / मूल्याङ्कन (Today&apos;s Valuations)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTodayReportModal(false);
                      onNavigateTab('valuations');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    सबै हेर्नुहोस् →
                  </button>
                </div>

                {todayReport.todayValuations.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center text-xs text-slate-500">
                    आज कुनै नयाँ एक्सचेन्ज मूल्याङ्कन दर्ता भएको छैन।
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {todayReport.todayValuations.map(val => (
                      <div key={val.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">
                            {val.phoneBrand} {val.phoneModel} ({val.storage || 'Standard'})
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Customer: {val.customerName || 'Visitor'} • Phone: <strong>{val.mobileNumber}</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-indigo-700 block">
                            Rs. {(val.finalValuationPrice || val.estimatedValuationPrice || val.expectedPrice || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md font-bold">
                            {val.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 4: Today's Repair Bookings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    <span>आजका मर्मत अपोइन्टमेन्टहरू (Today&apos;s Repairs)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTodayReportModal(false);
                      onNavigateTab('repairs');
                    }}
                    className="text-xs font-bold text-amber-600 hover:underline"
                  >
                    मर्मत तालिका हेर्नुहोस् →
                  </button>
                </div>

                {todayReport.todayRepairs.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center text-xs text-slate-500">
                    आजको लागि कुनै मर्मत अपोइन्टमेन्ट छैन।
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {todayReport.todayRepairs.map(rep => (
                      <div key={rep.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">
                            {rep.mobileBrand} {rep.mobileModel} — {rep.problemDescription}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Customer: {rep.customerName} • Phone: <strong>{rep.phoneNumber}</strong>
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold">
                          {rep.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                {onOpenAccounting && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowTodayReportModal(false);
                      onOpenAccounting();
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>लेखा प्रणालीको दैनिक बहीखाता (Accounting Day Book) खोल्नुहोस् →</span>
                  </button>
                )}
                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowTodayReportModal(false)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    बन्द गर्नुहोस् (Close)
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
