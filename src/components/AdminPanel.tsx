import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  RefreshCw,
  Layers,
  FileSpreadsheet,
  Wrench,
  Settings,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowLeft,
  Store,
  ChevronRight,
  UserCheck,
  Sparkles,
  Key,
  Trash2,
  Calculator,
  Cloud,
  UploadCloud,
  CheckCircle2,
  Database,
  Users
} from 'lucide-react';
import { Product, RateListItem, RepairBooking, PhoneValuationRequest, StoreSettings, StoreUserPermissions } from '../types.ts';
import { AuthService } from '../services/authService.ts';
import { UserService, DEFAULT_ADMIN_PERMISSIONS } from '../services/userService.ts';
import { DataStorageService } from '../services/dataStorage.ts';
import { VersionService } from '../services/versionService.ts';
import { FirestoreService } from '../services/firestoreService.ts';
import { ValuationsManager } from './admin/ValuationsManager.tsx';
import { QuickProductManager } from './QuickProductManager.tsx';
import { ExcelPriceListManager } from './admin/ExcelPriceListManager.tsx';
import { RepairBookingsManager } from './admin/RepairBookingsManager.tsx';
import { StoreSettingsManager } from './admin/StoreSettingsManager.tsx';
import { UpcomingModelsManager } from './admin/UpcomingModelsManager.tsx';
import { SecurityPinManager } from './admin/SecurityPinManager.tsx';
import { UserManager } from './admin/UserManager.tsx';
import { LineupManager } from './admin/LineupManager.tsx';
import { GoogleSheetsManager } from './admin/GoogleSheetsManager.tsx';
import { QuickActions } from './admin/QuickActions.tsx';
import { AccountingPlatform } from './accounting/AccountingPlatform.tsx';

interface AdminPanelProps {
  onBackToStore: () => void;
  onLogout: () => void;
  products: Product[];
  rateList: RateListItem[];
  bookings: RepairBooking[];
  valuations: PhoneValuationRequest[];
  storeSettings: StoreSettings;
  onDataRefresh: () => void;
  onNavigateToAccounting?: () => void;
}

type AdminTab = 'valuations' | 'upcoming' | 'products' | 'lineup' | 'rateList' | 'repairs' | 'sheets' | 'cloudsql' | 'settings' | 'security' | 'users';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onBackToStore,
  onLogout,
  products,
  rateList,
  bookings,
  valuations,
  storeSettings,
  onDataRefresh,
  onNavigateToAccounting
}) => {
  const [platformMode, setPlatformMode] = useState<'website' | 'accounting'>('website');
  const [activeTab, setActiveTab] = useState<AdminTab>('valuations');
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string | null>(null);
  const session = AuthService.getLocalSession();

  // Active User & Permissions for Role-Based Access Control (RBAC)
  const activeUser = UserService.getActiveUser();
  const permissions: StoreUserPermissions =
    activeUser?.permissions ||
    session?.permissions ||
    DEFAULT_ADMIN_PERMISSIONS;

  const isPrimaryAdmin = activeUser?.isPrimaryAdmin || (!activeUser && session?.email?.toLowerCase().includes('pmesbutwal'));

  // Determine if a specific module/tab is allowed for current user
  const isTabAllowed = (tab: AdminTab): boolean => {
    if (isPrimaryAdmin) return true;
    switch (tab) {
      case 'valuations':
        return !!permissions.canManageValuations;
      case 'upcoming':
        return !!permissions.canManageUpcoming;
      case 'products':
      case 'lineup':
        return !!permissions.canManageProducts;
      case 'rateList':
        return !!permissions.canManageRateList;
      case 'repairs':
        return !!permissions.canManageRepairs;
      case 'sheets':
      case 'cloudsql':
      case 'settings':
        return !!permissions.canManageSettings;
      case 'security':
      case 'users':
        return !!permissions.canManageUsers;
      default:
        return false;
    }
  };

  const tabPriorityOrder: AdminTab[] = [
    'valuations',
    'repairs',
    'rateList',
    'products',
    'upcoming',
    'lineup',
    'sheets',
    'cloudsql',
    'settings',
    'users',
    'security'
  ];

  // Auto-switch to the first permitted tab if activeTab is not allowed
  useEffect(() => {
    if (!isTabAllowed(activeTab)) {
      const nextAllowed = tabPriorityOrder.find(t => isTabAllowed(t));
      if (nextAllowed) {
        setActiveTab(nextAllowed);
      }
    }
  }, [activeUser?.id, activeUser?.role]);

  const canAccessAccounting = isPrimaryAdmin || !!permissions.canAccessAccounting;
  const canManageSettings = isPrimaryAdmin || !!permissions.canManageSettings;

  const handleSyncToFirebase = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await FirestoreService.pushAllToCloud();
      setCloudSyncMsg(res.message);
      setTimeout(() => setCloudSyncMsg(null), 5000);
    } catch (err: any) {
      setCloudSyncMsg(`Sync error: ${err.message || String(err)}`);
      setTimeout(() => setCloudSyncMsg(null), 5000);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleOpenAccounting = () => {
    if (onNavigateToAccounting) {
      onNavigateToAccounting();
    } else {
      setPlatformMode('accounting');
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    onLogout();
  };

  if (platformMode === 'accounting') {
    return (
      <AccountingPlatform
        onBackToWebsite={() => {
          setPlatformMode('website');
          onDataRefresh();
        }}
      />
    );
  }

  const newValuationsCount = valuations.filter(v => v.status === 'New').length;
  const pendingRepairsCount = bookings.filter(b => b.status === 'New' || b.status === ('Pending' as any)).length;
  const preBookings = DataStorageService.getPreBookings();
  const newPreBookingsCount = preBookings.filter(b => b.status === 'New').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 text-white flex flex-col shrink-0 border-r border-slate-800">
        
        {/* Brand & Admin Badge */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 text-white flex items-center justify-center font-bold shadow-md">
              <img
                src="https://1000logos.net/wp-content/uploads/2017/02/Apple-Logo.png"
                alt="Apple Logo"
                className="w-4 h-4 object-contain brightness-0 invert"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-sm font-bold font-serif leading-tight text-white">Pandey Store</h2>
              <span className="text-[10px] text-emerald-400 font-bold tracking-wide flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>AUTHORIZED ADMIN</span>
              </span>
            </div>
          </div>
        </div>

        {/* Logged-in admin pill */}
        {session && (
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
            <div className="flex items-center space-x-2 truncate">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                  {UserService.getActiveUser()?.isPrimaryAdmin ? 'Primary Store Admin' : 'Secondary User'}
                </span>
                <span className="font-semibold text-white truncate block">
                  {UserService.getActiveUser()?.name || session.name || session.email}
                </span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[9px] font-bold uppercase shrink-0">
              {UserService.getActiveUser()?.role || 'Admin'}
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 flex-1">
          
          {/* Mobile Valuation Tab (PRIMARY) */}
          {isTabAllowed('valuations') && (
            <button
              onClick={() => setActiveTab('valuations')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'valuations'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Smartphone className="w-4 h-4" />
                <span>Mobile Valuation</span>
              </div>
              {newValuationsCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full shadow-xs">
                  {newValuationsCount} New
                </span>
              )}
            </button>
          )}

          {/* Upcoming Models / Pre-Booking */}
          {isTabAllowed('upcoming') && (
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Upcoming Models / Pre-Book</span>
              </div>
              {newPreBookingsCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full shadow-xs">
                  {newPreBookingsCount} New
                </span>
              )}
            </button>
          )}

          {/* Products Catalog */}
          {isTabAllowed('products') && (
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'products'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Layers className="w-4 h-4" />
                <span>Products Catalog</span>
              </div>
              <span className="text-[10px] text-slate-400">{products.length}</span>
            </button>
          )}

          {/* Lineup Showcase Control */}
          {isTabAllowed('lineup') && (
            <button
              onClick={() => setActiveTab('lineup')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'lineup'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Lineup Showcase</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                Lineup
              </span>
            </button>
          )}

          {/* Rate Sheet / Nepal Price List */}
          {isTabAllowed('rateList') && (
            <button
              onClick={() => setActiveTab('rateList')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'rateList'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Rate Sheet / Pricing</span>
              </div>
              <span className="text-[10px] text-slate-400">{rateList.length}</span>
            </button>
          )}

          {/* Repair Bookings */}
          {isTabAllowed('repairs') && (
            <button
              onClick={() => setActiveTab('repairs')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'repairs'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Wrench className="w-4 h-4" />
                <span>Repair Bookings</span>
              </div>
              {pendingRepairsCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-500 text-white font-black text-[10px] rounded-full shadow-xs">
                  {pendingRepairsCount}
                </span>
              )}
            </button>
          )}

          {/* Google Sheets Integration */}
          {isTabAllowed('sheets') && (
            <button
              onClick={() => setActiveTab('sheets')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'sheets'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Google Sheets Sync</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                Live API
              </span>
            </button>
          )}



          {/* Settings & Backup */}
          {isTabAllowed('settings') && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Settings className="w-4 h-4" />
                <span>Web Settings & Backup</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700">1-Click</span>
            </button>
          )}

          {/* Admin Security & PIN Reset */}
          {isTabAllowed('security') && (
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Admin PIN & Security</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono font-bold">
                PIN
              </span>
            </button>
          )}

          {/* User & Staff Management (Admin + Secondary Users) */}
          {isTabAllowed('users') && (
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>User & Staff Admin</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                Admin + Sec
              </span>
            </button>
          )}

          {/* SEPARATE ACCOUNTING PLATFORM - LOGICALLY DISTINCT ERP MODULE */}
          {canAccessAccounting && (
            <div className="pt-3 mt-3 border-t border-slate-800">
              <div className="px-3 pb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-mono">
                  Separate Platform
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold rounded border border-emerald-500/30">
                  ERP / POS
                </span>
              </div>

              <button
                id="admin-open-accounting-platform-btn"
                type="button"
                onClick={handleOpenAccounting}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 hover:from-emerald-900 hover:to-indigo-900 text-white border border-emerald-500/40 hover:border-emerald-400 shadow-md group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg border border-emerald-500/40 text-emerald-400 group-hover:scale-110 transition-transform">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block font-black text-white text-xs tracking-tight">ACCOUNTING</span>
                    <span className="block text-[10px] text-emerald-400 font-medium">लेखा तथा बिलिङ प्रणाली</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            type="button"
            onClick={onBackToStore}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 flex items-center space-x-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Visitor Website</span>
          </button>

          <button
            id="admin-logout-btn"
            type="button"
            onClick={handleLogout}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-600/20 border border-rose-950 hover:border-rose-800 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out (End Session)</span>
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-xs">
          <div>
            <h1 className="text-lg font-black text-slate-900 font-serif">
              {activeTab === 'valuations' && 'Mobile Valuation & Exchange Manager'}
              {activeTab === 'upcoming' && 'Upcoming Models & Pre-Booking Management'}
              {activeTab === 'products' && 'Smartphone Inventory & Catalog'}
              {activeTab === 'lineup' && 'Lineup Showcase Manager'}
              {activeTab === 'rateList' && 'Used iPhone & Market Rate Sheet'}
              {activeTab === 'repairs' && 'Repair Service Appointments'}
              {activeTab === 'sheets' && 'Google Sheets Live Sync'}
              {activeTab === 'cloudsql' && 'Cloud SQL Database Management'}
              {activeTab === 'settings' && 'Web Settings, Full Backup & Data Restore'}
              {activeTab === 'security' && 'Admin Security & 4-Digit PIN Reset'}
              {activeTab === 'users' && 'User & Staff Management (Role Permissions)'}
            </h1>
            <p className="text-xs text-slate-500">
              Traffic Chowk, Butwal, Nepal • Store Administration Console
            </p>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            {/* Firebase Cloud Connection & 1-Click Sync (Only for authorized managers) */}
            {canManageSettings && (
              <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-emerald-800 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="hidden xl:inline text-slate-700">Firebase:</span>
                <span className="text-emerald-700 font-bold">Connected</span>
                <button
                  type="button"
                  onClick={handleSyncToFirebase}
                  disabled={isSyncingCloud}
                  className="ml-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1 shadow-xs disabled:opacity-50"
                  title="Synchronize all products, valuations, repairs, rate-list & settings to Firebase Cloud"
                >
                  {isSyncingCloud ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3 h-3" />
                  )}
                  <span>{isSyncingCloud ? 'Syncing...' : 'Sync Cloud'}</span>
                </button>
              </div>
            )}

            {/* Accounting Button (Only if user has accounting permission) */}
            {canAccessAccounting && (
              <button
                id="admin-accounting-top-bar-btn"
                type="button"
                onClick={handleOpenAccounting}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 border border-emerald-500 cursor-pointer"
                title="Open the separate Accounting Platform"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Accounting Platform (लेखा)</span>
              </button>
            )}

            {/* Settings Clean Button (Only for admins/settings managers) */}
            {canManageSettings && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('के तपाई सबै डेमो / Pre-Owned फोनहरू हटाई नयाँ अपडेट लोड (Hard Refresh) गर्न चाहनुहुन्छ?')) {
                    DataStorageService.removePreOwnedProducts();
                    onDataRefresh();
                    VersionService.forceHardRefresh(true);
                  }
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 border border-rose-300 shadow-xs cursor-pointer"
                title="डेमो फोनहरू हटाउनुहोस् र क्यास हटाई रिफ्रेस गर्नुहोस्"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>डेमो हटाई रिफ्रेस (Clean & Refresh)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onDataRefresh();
                VersionService.forceHardRefresh(true);
              }}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 border border-amber-300 shadow-xs cursor-pointer"
              title="ब्राउजर क्यास हटाई नयाँ फाइलहरू र अपडेट लोड गर्नुहोस्"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              <span>क्यास हटाई रिफ्रेस (Hard Reload)</span>
            </button>
            <button
              type="button"
              onClick={onBackToStore}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <span>View Storefront</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1 border border-rose-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {cloudSyncMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{cloudSyncMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setCloudSyncMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Content with RBAC Protection */}
        <div className="p-6 flex-1 space-y-6">
          {/* QuickActions Component - Shortcut buttons for common tasks (Only visible to authenticated admins) */}
          <QuickActions
            products={products}
            valuations={valuations}
            bookings={bookings}
            onDataRefresh={onDataRefresh}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAccounting={canAccessAccounting ? handleOpenAccounting : undefined}
          />

          {!isTabAllowed(activeTab) ? (
            <div className="p-8 max-w-lg mx-auto text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-sm mt-12">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-slate-900 font-serif">
                अनुमति छैन (Access Restricted)
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                तपाईंको प्रयोगकर्ता खाता ({activeUser?.name || 'User'}) लाई यो मोड्युल हेर्ने वा सम्पादन गर्ने अनुमति छैन। अनुमति थप गर्न मुख्य स्टोर एडमिनलाई सम्पर्क गर्नुहोस्।
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = tabPriorityOrder.find(t => isTabAllowed(t));
                    if (next) setActiveTab(next);
                  }}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  अनुमति भएका मोड्युलमा फर्कनुहोस्
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'valuations' && (
                <ValuationsManager
                  valuations={valuations}
                  onValuationsChange={onDataRefresh}
                />
              )}

              {activeTab === 'upcoming' && (
                <UpcomingModelsManager
                  onRefresh={onDataRefresh}
                />
              )}

              {activeTab === 'products' && (
                <QuickProductManager
                  products={products}
                  onProductsChange={onDataRefresh}
                />
              )}

              {activeTab === 'lineup' && (
                <LineupManager
                  products={products}
                  storeSettings={storeSettings}
                  onDataRefresh={onDataRefresh}
                />
              )}

              {activeTab === 'rateList' && (
                <ExcelPriceListManager
                  rateList={rateList}
                  onRateListChange={onDataRefresh}
                />
              )}

              {activeTab === 'repairs' && (
                <RepairBookingsManager
                  bookings={bookings}
                  onBookingsChange={onDataRefresh}
                />
              )}

              {activeTab === 'sheets' && (
                <GoogleSheetsManager
                  rateList={rateList}
                  valuations={valuations}
                  bookings={bookings}
                  onDataRefresh={onDataRefresh}
                />
              )}



              {activeTab === 'settings' && (
                <StoreSettingsManager
                  settings={storeSettings}
                  onSettingsChange={onDataRefresh}
                />
              )}

              {activeTab === 'security' && (
                <SecurityPinManager
                  onPinChanged={onDataRefresh}
                />
              )}

              {activeTab === 'users' && (
                <UserManager
                  onUserSwitched={onDataRefresh}
                />
              )}
            </>
          )}
        </div>

      </main>

    </div>
  );
};

