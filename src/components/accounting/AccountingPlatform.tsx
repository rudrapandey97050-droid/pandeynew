import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Maximize2,
  Minimize2,
  PlusCircle,
  SquarePen,
  TrendingUp,
  BarChart3,
  Briefcase,
  Settings,
  Wrench,
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  Shield,
  Clock,
  Printer,
  Bell,
  CheckCircle2,
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Users,
  Building2,
  Building,
  Package,
  Landmark,
  FileSpreadsheet,
  Smartphone,
  User,
  LogOut,
  Edit2,
  Check,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Home
} from 'lucide-react';
import { AccountingDashboard } from './AccountingDashboard.tsx';
import { SalesModule } from './SalesModule.tsx';
import { PurchaseModule } from './PurchaseModule.tsx';
import { ReceiptModule } from './ReceiptModule.tsx';
import { PaymentModule } from './PaymentModule.tsx';
import { ExpensesModule } from './ExpensesModule.tsx';
import { PartiesModule } from './PartiesModule.tsx';
import { InventoryLedgerModule } from './InventoryLedgerModule.tsx';
import { ImeiVaultModule } from './ImeiVaultModule.tsx';
import { AccountsModule } from './AccountsModule.tsx';
import { ReportsModule } from './ReportsModule.tsx';
import { AccountingSettingsModule } from './AccountingSettingsModule.tsx';
import { InvoicePrintModal } from './InvoicePrintModal.tsx';
import { BillPrintSetupModal } from './BillPrintSetupModal.tsx';
import { GmailStockReportModal } from './GmailStockReportModal.tsx';
import { AccountingStorageService } from '../../services/accountingStorage.ts';
import { GmailStockReportService, AutoScheduleEvent } from '../../services/gmailStockReportService.ts';
import { UserService } from '../../services/userService.ts';
import { SalesInvoice } from '../../types/accounting.ts';

interface AccountingPlatformProps {
  onBackToWebsite: () => void;
}

export type AccountingTab =
  | 'dashboard'
  | 'sales'
  | 'purchase'
  | 'receipts'
  | 'payments'
  | 'expenses'
  | 'customers'
  | 'suppliers'
  | 'inventory'
  | 'imei_vault'
  | 'accounts'
  | 'reports'
  | 'settings';

export const AccountingPlatform: React.FC<AccountingPlatformProps> = ({
  onBackToWebsite
}) => {
  const activeUser = UserService.getActiveUser();
  const canAccessAccounting = activeUser?.isPrimaryAdmin || (!activeUser) || !!activeUser.permissions?.canAccessAccounting;

  const [activeTab, setActiveTab] = useState<AccountingTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickAddMenuOpen, setQuickAddMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Hover state for left sidebar icons (Cursor hover auto open / close)
  const [hoveredSidebarIcon, setHoveredSidebarIcon] = useState<string | null>(null);

  // Dynamic Settings & Real-time Subscription
  const [settings, setSettings] = useState(() => AccountingStorageService.getSettings());

  // Edit Business Name Modal State
  const [editNameModalOpen, setEditNameModalOpen] = useState(false);
  const [tempCompanyName, setTempCompanyName] = useState(settings.companyName || 'Pandey Mobile electic and electronic suppliers');
  const [tempPhone, setTempPhone] = useState(settings.phone || '9857055743');
  const [tempAddress, setTempAddress] = useState(settings.address || 'Traffic Chowk, Butwal');
  const [tempPan, setTempPan] = useState(settings.panNumber || '601234567');
  const [nameSaveToast, setNameSaveToast] = useState(false);

  // Quick modals triggers
  const [salesCreateOpen, setSalesCreateOpen] = useState(false);
  const [purchaseCreateOpen, setPurchaseCreateOpen] = useState(false);
  const [paymentCreateOpen, setPaymentCreateOpen] = useState(false);
  const [expenseCreateOpen, setExpenseCreateOpen] = useState(false);
  const [productCreateOpen, setProductCreateOpen] = useState(false);
  const [gmailReportModalOpen, setGmailReportModalOpen] = useState(false);
  const [billPrintSetupOpen, setBillPrintSetupOpen] = useState(false);

  // Invoice Print Modal State
  const [invoiceToPrint, setInvoiceToPrint] = useState<SalesInvoice | null>(null);

  // Auto-schedule notification state
  const [scheduleNotice, setScheduleNotice] = useState<AutoScheduleEvent | null>(null);
  const [scheduleConfig, setScheduleConfig] = useState(() => GmailStockReportService.getScheduleConfig());

  useEffect(() => {
    const unsubScheduler = GmailStockReportService.addSchedulerListener((ev) => {
      setScheduleNotice(ev);
      setScheduleConfig(GmailStockReportService.getScheduleConfig());
    });
    const unsubSettings = AccountingStorageService.subscribe(() => {
      const freshSettings = AccountingStorageService.getSettings();
      setSettings(freshSettings);
    });
    return () => {
      unsubScheduler();
      unsubSettings();
    };
  }, []);

  // Fullscreen toggle handler
  const toggleFullScreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleOpenEditName = () => {
    setTempCompanyName(settings.companyName || 'Pandey Mobile electic and electronic suppliers');
    setTempPhone(settings.phone || '');
    setTempAddress(settings.address || '');
    setTempPan(settings.panNumber || '');
    setEditNameModalOpen(true);
  };

  const handleSaveBusinessName = (e: React.FormEvent) => {
    e.preventDefault();
    const newName = tempCompanyName.trim() || 'Pandey Mobile electic and electronic suppliers';
    const updated = {
      ...settings,
      companyName: newName,
      phone: tempPhone.trim() || settings.phone,
      address: tempAddress.trim() || settings.address,
      panNumber: tempPan.trim() || settings.panNumber
    };
    AccountingStorageService.saveSettings(updated);
    setSettings(updated);
    setEditNameModalOpen(false);
    setNameSaveToast(true);
    setTimeout(() => setNameSaveToast(false), 3000);
  };

  if (!canAccessAccounting) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white font-serif">अनुमति छैन (Access Restricted)</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            तपाईंको खाता ({activeUser?.name || 'User'}) लाई लेखा तथा बिलिङ प्रणाली (Accounting Platform) चलाउने अनुमति छैन।
          </p>
          <button
            type="button"
            onClick={onBackToWebsite}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            मुख्य एडमिन प्यानलमा फर्कनुहोस्
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', sublabel: 'ड्यासबोर्ड', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales & Invoicing', sublabel: 'बिक्री तथा बिलिङ', icon: ShoppingBag },
    { id: 'purchase', label: 'Purchase & Bills', sublabel: 'खरिद तथा स्टक दाखिला', icon: ShoppingCart },
    { id: 'receipts', label: 'Payment Receipts', sublabel: 'रसिद (भुक्तानी प्राप्त)', icon: ArrowDownLeft },
    { id: 'payments', label: 'Supplier Payments', sublabel: 'भुक्तानी भौचर', icon: ArrowUpRight },
    { id: 'expenses', label: 'Expenses & Petty Cash', sublabel: 'पसल खर्च तथा तलब', icon: DollarSign },
    { id: 'customers', label: 'Customers Ledger', sublabel: 'ग्राहक खाता / उठ्न बाँकी', icon: Users },
    { id: 'suppliers', label: 'Suppliers Ledger', sublabel: 'सप्लायर खाता / तिर्न बाँकी', icon: Building2 },
    { id: 'inventory', label: 'Stock Balance', sublabel: 'स्टक मौज्दात तथा खाता', icon: Package },
    { id: 'imei_vault', label: 'IMEI Vault (भण्डारण)', sublabel: 'IMEI भण्डारण तथा खोजी', icon: Smartphone },
    { id: 'accounts', label: 'Cash & Bank Accounts', sublabel: 'नगद तथा बैंक मौज्दात', icon: Landmark },
    { id: 'reports', label: 'Financial Reports', sublabel: 'नाफा/नोक्सान तथा कर रिपोर्ट', icon: FileSpreadsheet },
    { id: 'settings', label: 'Accounting Settings', sublabel: 'लेखा प्रणाली सेटिङ', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans text-slate-800 selection:bg-sky-500 selection:text-white">
      
      {/* 1. TOP HEADER BAR */}
      <header className="flex items-center h-14 bg-[#0288d1] text-white sticky top-0 z-40 shadow-xs select-none">
        
        {/* Left Brand Badge - Account Home Button (क्लिक गर्दा अकाउन्ट गृहपृष्ठ / ड्यासबोर्डमा जान्छ) */}
        <div
          onClick={() => setActiveTab('dashboard')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('dashboard');
            }
          }}
          className={`w-14 sm:w-16 h-14 flex flex-col items-center justify-center bg-[#800000] hover:bg-[#6b0000] active:bg-[#520000] border-r border-[#6a0000] shrink-0 cursor-pointer group transition-all select-none ${
            activeTab === 'dashboard' ? 'ring-2 ring-inset ring-sky-300/40' : ''
          }`}
          title="Account Home (लेखा प्रणालीको मुख्य गृहपृष्ठ / ड्यासबोर्ड)"
        >
          <div className="w-8 h-8 rounded-full border-2 border-white/85 group-hover:border-white group-hover:bg-white/15 flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
            <Home className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-tight text-white/90 group-hover:text-white mt-0.5 font-mono">
            Home
          </span>
        </div>

        {/* Header Main Bar */}
        <div className="flex-1 flex items-center justify-between px-3 sm:px-4">
          
          {/* Left Action Controls (Menu, Fullscreen, Plus) */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Menu Hamburger - Auto Opens on Cursor Hover, Auto Closes on Cursor Leave */}
            <div
              className="relative"
              onMouseEnter={() => setMobileMenuOpen(true)}
              onMouseLeave={() => setMobileMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Accounting Modules Menu (कर्सर राख्दा आफै खुल्छ)"
              >
                <Menu className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullScreen}
              className="p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Toggle Fullscreen Mode"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Maximize2 className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>

            {/* Quick Add Plus Circle Button - Auto Opens on Cursor Hover, Auto Closes on Cursor Leave */}
            <div
              className="relative"
              onMouseEnter={() => setQuickAddMenuOpen(true)}
              onMouseLeave={() => setQuickAddMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setQuickAddMenuOpen(!quickAddMenuOpen)}
                className="p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Quick Add Menu (कर्सर राख्दा आफै खुल्छ)"
              >
                <PlusCircle className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Quick Add Dropdown */}
              {quickAddMenuOpen && (
                <div
                  onMouseEnter={() => setQuickAddMenuOpen(true)}
                  onMouseLeave={() => setQuickAddMenuOpen(false)}
                  className="absolute left-0 mt-1 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 text-slate-800 text-xs font-semibold z-50 animate-fade-in"
                >
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1">
                    <span>Quick Create (नयाँ इन्ट्री)</span>
                    <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Auto-Open</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('sales');
                      setSalesCreateOpen(true);
                      setQuickAddMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-indigo-50 flex items-center space-x-2 text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-indigo-500" />
                    <span>+ New Sales Bill (बिक्री बिल)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('purchase');
                      setPurchaseCreateOpen(true);
                      setQuickAddMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50 flex items-center space-x-2 text-slate-700 hover:text-emerald-600 transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4 text-emerald-500" />
                    <span>+ New Purchase Bill (खरिद)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('receipts');
                      setQuickAddMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center space-x-2 text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <ArrowDownLeft className="w-4 h-4 text-blue-500" />
                    <span>+ New Receipt (रसिद भौचर)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('payments');
                      setPaymentCreateOpen(true);
                      setQuickAddMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-purple-50 flex items-center space-x-2 text-slate-700 hover:text-purple-600 transition-colors cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4 text-purple-500" />
                    <span>+ New Payment (भुक्तानी)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('expenses');
                      setExpenseCreateOpen(true);
                      setQuickAddMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-rose-50 flex items-center space-x-2 text-slate-700 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4 text-rose-500" />
                    <span>+ New Expense (खर्च इन्ट्री)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Centered Business Name (EDITABLE ON CLICK) */}
          <div className="text-center px-2 flex items-center justify-center min-w-0">
            <button
              type="button"
              onClick={handleOpenEditName}
              className="group inline-flex items-center space-x-2 px-3 py-1 rounded-xl hover:bg-white/15 text-white transition-all cursor-pointer max-w-full truncate"
              title="व्यवसायको नाम परिवर्तन गर्नुहोस् (Click to edit business name)"
            >
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-wide truncate">
                {settings.companyName || 'Pandey Mobile electic and electronic suppliers'}
              </h1>
              <Edit2 className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-opacity shrink-0" />
            </button>
          </div>

          {/* Right Section: User Profile - Auto Opens on Cursor Hover, Auto Closes on Cursor Leave */}
          <div
            className="relative"
            onMouseEnter={() => setUserMenuOpen(true)}
            onMouseLeave={() => setUserMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 text-white/95 hover:text-white px-2 py-1 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">
                Hello, <strong>Rudra pandey</strong>
              </span>
              <span className="sm:hidden font-bold">Rudra</span>
              <div className="w-7 h-7 rounded-full border border-white/80 flex items-center justify-center text-white shrink-0 bg-white/10">
                <User className="w-4 h-4" />
              </div>
            </button>

            {/* User Profile Dropdown Menu */}
            {userMenuOpen && (
              <div
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
                className="absolute right-0 mt-1 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 text-slate-800 text-xs font-semibold z-50 animate-fade-in"
              >
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                  <p className="font-bold text-slate-900 text-sm">Rudra pandey</p>
                  <p className="text-[11px] text-slate-500">Store Proprietor & Master Admin</p>
                  <span className="inline-block mt-1 text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md font-mono font-bold">
                    FY {settings.financialYear}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleOpenEditName();
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center space-x-2.5 text-slate-700 hover:text-sky-600 transition-colors cursor-pointer"
                  >
                    <Building className="w-4 h-4 text-sky-500" />
                    <span>Change Business Name (नाम परिवर्तन)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onBackToWebsite();
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center space-x-2.5 text-slate-700 hover:text-sky-600 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-400" />
                    <span>Back to Website Storefront</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('settings');
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center space-x-2.5 text-slate-700 hover:text-sky-600 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Accounting System Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBillPrintSetupOpen(true);
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center space-x-2.5 text-slate-700 hover:text-sky-600 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-400" />
                    <span>Bill Print & Paper Size Setup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGmailReportModalOpen(true);
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center space-x-2.5 text-slate-700 hover:text-sky-600 transition-colors cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Daily 9:00 PM Gmail Stock Report</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={onBackToWebsite}
                    className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center space-x-2.5 font-bold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Close Accounting Console</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 2. BODY CONTAINER WITH SLIM LEFT ICON SIDEBAR + CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SLIM LEFT SIDEBAR - WITH CURSOR HOVER AUTO-OPEN POPOVERS */}
        <aside className="w-14 sm:w-16 bg-white border-r border-slate-200/90 flex flex-col justify-between items-center py-4 shrink-0 shadow-2xs select-none relative z-30">
          
          {/* Top Module Icons */}
          <div className="space-y-4 flex flex-col items-center">
            
            {/* 1. Edit / Vouchers icon (Sales) */}
            <div
              className="relative"
              onMouseEnter={() => setHoveredSidebarIcon('sales')}
              onMouseLeave={() => setHoveredSidebarIcon(null)}
            >
              <button
                type="button"
                onClick={() => setActiveTab('sales')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'sales'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Sales & Invoicing"
              >
                <SquarePen className="w-5 h-5 stroke-[2]" />
              </button>

              {/* Auto-Open Flyout on Hover */}
              {hoveredSidebarIcon === 'sales' && (
                <div className="absolute left-full ml-3 top-0 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 text-xs font-semibold animate-fade-in">
                  <div className="font-bold text-slate-900 mb-1 border-b pb-1 flex justify-between items-center">
                    <span>Sales & Invoicing</span>
                    <span className="text-[10px] text-indigo-600 font-normal">बिक्री बिल</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('sales');
                      setSalesCreateOpen(true);
                      setHoveredSidebarIcon(null);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 flex items-center space-x-1.5"
                  >
                    <span>+ New Sales Bill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('sales');
                      setHoveredSidebarIcon(null);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700"
                  >
                    View Sales Register
                  </button>
                </div>
              )}
            </div>

            {/* 2. Trending Line Graph icon (Dashboard) */}
            <div
              className="relative"
              onMouseEnter={() => setHoveredSidebarIcon('dashboard')}
              onMouseLeave={() => setHoveredSidebarIcon(null)}
            >
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Accounting Dashboard"
              >
                <TrendingUp className="w-5 h-5 stroke-[2]" />
              </button>

              {/* Auto-Open Flyout on Hover */}
              {hoveredSidebarIcon === 'dashboard' && (
                <div className="absolute left-full ml-3 top-0 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 text-xs font-semibold animate-fade-in">
                  <div className="font-bold text-slate-900 mb-1 border-b pb-1 flex justify-between items-center">
                    <span>Main Dashboard</span>
                    <span className="text-[10px] text-sky-600 font-normal">ड्यासबोर्ड</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('dashboard');
                      setHoveredSidebarIcon(null);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-sky-50 text-sky-700"
                  >
                    Open Live Overview
                  </button>
                </div>
              )}
            </div>

            {/* 3. Bar Chart icon (Reports) */}
            <div
              className="relative"
              onMouseEnter={() => setHoveredSidebarIcon('reports')}
              onMouseLeave={() => setHoveredSidebarIcon(null)}
            >
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Financial Reports & VAT"
              >
                <BarChart3 className="w-5 h-5 stroke-[2]" />
              </button>

              {/* Auto-Open Flyout on Hover */}
              {hoveredSidebarIcon === 'reports' && (
                <div className="absolute left-full ml-3 top-0 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 text-xs font-semibold animate-fade-in">
                  <div className="font-bold text-slate-900 mb-1 border-b pb-1 flex justify-between items-center">
                    <span>Financial Reports</span>
                    <span className="text-[10px] text-amber-600 font-normal">वित्तीय रिपोर्ट</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('reports');
                      setHoveredSidebarIcon(null);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700"
                  >
                    Profit & Loss Statement
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('reports');
                      setHoveredSidebarIcon(null);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700"
                  >
                    VAT Sales & Purchase Book
                  </button>
                </div>
              )}
            </div>

            {/* 4. Briefcase icon (Ledgers / Accounts) */}
            <div
              className="relative"
              onMouseEnter={() => setHoveredSidebarIcon('customers')}
              onMouseLeave={() => setHoveredSidebarIcon(null)}
            >
              <button
                type="button"
                onClick={() => setActiveTab('customers')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'customers' || activeTab === 'suppliers' || activeTab === 'accounts'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Parties & Customer Accounts"
              >
                <Briefcase className="w-5 h-5 stroke-[2]" />
              </button>

              {/* Auto-Open Flyout on Hover */}
              {hoveredSidebarIcon === 'customers' && (
                <div className="absolute left-full ml-3 top-0 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 text-xs font-semibold animate-fade-in">
                  <div className="font-bold text-slate-900 mb-1 border-b pb-1 flex justify-between items-center">
                    <span>Parties & Ledgers</span>
                    <span className="text-[10px] text-purple-600 font-normal">खाता बही</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('customers');
                      setHoveredSidebarIcon(null);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700"
                  >
                    Customers Ledger (ग्राहक खाता)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('suppliers');
                      setHoveredSidebarIcon(null);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700"
                  >
                    Suppliers Ledger (सप्लायर खाता)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('accounts');
                      setHoveredSidebarIcon(null);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700"
                  >
                    Cash & Bank Accounts
                  </button>
                </div>
              )}
            </div>

            {/* 5. Settings Gear icon */}
            <div
              className="relative"
              onMouseEnter={() => setHoveredSidebarIcon('settings')}
              onMouseLeave={() => setHoveredSidebarIcon(null)}
            >
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Accounting Settings"
              >
                <Settings className="w-5 h-5 stroke-[2]" />
              </button>

              {/* Auto-Open Flyout on Hover */}
              {hoveredSidebarIcon === 'settings' && (
                <div className="absolute left-full ml-3 top-0 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 text-xs font-semibold animate-fade-in">
                  <div className="font-bold text-slate-900 mb-1 border-b pb-1 flex justify-between items-center">
                    <span>System Settings</span>
                    <span className="text-[10px] text-slate-500 font-normal">सेटिङ</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('settings');
                      setHoveredSidebarIcon(null);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700"
                  >
                    Manage Settings & Roles
                  </button>
                </div>
              )}
            </div>

            {/* 6. Wrench / Utility icon */}
            <div
              className="relative"
              onMouseEnter={() => setHoveredSidebarIcon('print')}
              onMouseLeave={() => setHoveredSidebarIcon(null)}
            >
              <button
                type="button"
                onClick={() => setBillPrintSetupOpen(true)}
                className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
                title="Bill Print Setup & Paper Size"
              >
                <Wrench className="w-5 h-5 stroke-[2]" />
              </button>

              {/* Auto-Open Flyout on Hover */}
              {hoveredSidebarIcon === 'print' && (
                <div className="absolute left-full ml-3 top-0 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 text-xs font-semibold animate-fade-in">
                  <div className="font-bold text-slate-900 mb-1 border-b pb-1 flex justify-between items-center">
                    <span>Print Setup</span>
                    <span className="text-[10px] text-rose-600 font-normal">प्रिन्ट सेटअप</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBillPrintSetupOpen(true);
                      setHoveredSidebarIcon(null);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-rose-50 text-rose-700"
                  >
                    Configure Paper (A4 / A5 / 80mm)
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Bottom Help Circle Icon */}
          <div
            className="pt-4 flex flex-col items-center relative"
            onMouseEnter={() => setHoveredSidebarIcon('help')}
            onMouseLeave={() => setHoveredSidebarIcon(null)}
          >
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="w-9 h-9 rounded-full bg-[#0288d1] hover:bg-[#0277bd] text-white flex items-center justify-center transition-transform hover:scale-105 shadow-md cursor-pointer"
              title="Help, Keyboard Shortcuts & Store Info"
            >
              <span className="font-bold text-base leading-none">?</span>
            </button>

            {hoveredSidebarIcon === 'help' && (
              <div className="absolute left-full ml-3 bottom-0 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 text-xs font-semibold animate-fade-in">
                <div className="font-bold text-slate-900 mb-1 border-b pb-1">
                  <span>Help & Shortcuts</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-1.5">Shortcuts & instructions</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowHelpModal(true);
                    setHoveredSidebarIcon(null);
                  }}
                  className="w-full text-left px-2 py-1 bg-sky-50 text-sky-700 rounded-lg text-xs font-bold"
                >
                  Open Guide (?)
                </button>
              </div>
            )}
          </div>

        </aside>

        {/* FULL DRAWER FLYOUT (AUTO-OPENS ON HOVER OVER HAMBURGER OR INSIDE DRAWER) */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 flex"
            onMouseEnter={() => setMobileMenuOpen(true)}
            onMouseLeave={() => setMobileMenuOpen(false)}
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Panel */}
            <div
              onMouseEnter={() => setMobileMenuOpen(true)}
              onMouseLeave={() => setMobileMenuOpen(false)}
              className="relative w-72 bg-white h-full shadow-2xl z-10 flex flex-col border-r border-slate-200 animate-slide-in-left"
            >
              <div className="p-4 bg-sky-700 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Accounting Modules</h3>
                  <p className="text-[11px] text-sky-200 truncate">{settings.companyName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 hover:bg-sky-600 rounded-lg text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 overflow-y-auto flex-1 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id as AccountingTab);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                      <div className="flex-1 truncate">
                        <div className="truncate">{item.label}</div>
                        <div className={`text-[10px] font-normal truncate ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                          {item.sublabel}
                        </div>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-sky-400" />}
                    </button>
                  );
                })}
              </div>

              <div className="p-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onBackToWebsite}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Exit to Main Website</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN VIEWPORT CONTENT */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-full relative">
          
          {/* FLOATING PINK/CORAL GEAR BUTTON */}
          <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
            <button
              type="button"
              onClick={() => setBillPrintSetupOpen(true)}
              className="w-10 h-10 rounded-xl bg-[#f43f5e] hover:bg-[#e11d48] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer hover:rotate-45"
              title="Quick Print Setup & Bill Configuration"
            >
              <Settings className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Name Change Success Toast */}
          {nameSaveToast && (
            <div className="mb-4 p-3 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                <span>व्यवसायको नाम सफलतापूर्वक परिवर्तन गरियो (Business name updated successfully)!</span>
              </div>
              <button type="button" onClick={() => setNameSaveToast(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
          )}

          {/* Daily 9:00 PM Auto-Dispatch Notification Banner */}
          {scheduleNotice && (
            <div
              className={`mb-5 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs transition-all ${
                scheduleNotice.type === 'dispatched'
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : scheduleNotice.type === 'pending_auth'
                  ? 'bg-sky-50/90 border-sky-300 text-sky-950'
                  : 'bg-rose-50/90 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-start sm:items-center space-x-3">
                {scheduleNotice.type === 'dispatched' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <Bell className="w-5 h-5 text-sky-600 shrink-0 mt-0.5 sm:mt-0 animate-bounce" />
                )}
                <div>
                  {scheduleNotice.type === 'dispatched' && (
                    <p>
                      <strong>✅ Daily 9:00 PM Stock Report Dispatched:</strong> Stock summary was automatically sent to{' '}
                      <span className="font-bold underline">{scheduleNotice.recipient}</span> at {scheduleNotice.time}.
                    </p>
                  )}
                  {scheduleNotice.type === 'pending_auth' && (
                    <p>
                      <strong>⏰ 9:00 PM Scheduled Stock Report Ready:</strong> System is prepared to auto-send daily inventory to{' '}
                      <span className="font-bold underline">{scheduleNotice.recipient}</span> from{' '}
                      <span className="font-semibold">pmesbutwal@gmail.com</span>. Please click to verify Google authorization.
                    </p>
                  )}
                  {scheduleNotice.type === 'error' && (
                    <p>
                      <strong>⚠️ Auto-Dispatch Notice:</strong> {scheduleNotice.error}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setGmailReportModalOpen(true)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl font-bold transition-all shadow-2xs cursor-pointer"
                >
                  {scheduleNotice.type === 'pending_auth' ? 'Authorize & Send' : 'View Stock Report'}
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleNotice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* RETURN TO DASHBOARD HEADER (WHEN ON OTHER TABS) */}
          {activeTab !== 'dashboard' && (
            <div className="mb-4 flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Return to Accounting Dashboard</span>
                </button>
                <span className="text-slate-300">|</span>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
                  {navItems.find(n => n.id === activeTab)?.label}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setBillPrintSetupOpen(true)}
                className="text-xs text-sky-600 hover:underline font-bold"
              >
                Paper Size Setup
              </button>
            </div>
          )}

          {/* 1. DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <AccountingDashboard
              onNavigate={(tab) => setActiveTab(tab as AccountingTab)}
              onOpenNewSales={() => {
                setActiveTab('sales');
                setSalesCreateOpen(true);
              }}
              onOpenNewPurchase={() => {
                setActiveTab('purchase');
                setPurchaseCreateOpen(true);
              }}
              onOpenNewReceipt={() => {
                setActiveTab('receipts');
              }}
              onOpenNewPayment={() => {
                setActiveTab('payments');
                setPaymentCreateOpen(true);
              }}
              onOpenNewExpense={() => {
                setActiveTab('expenses');
                setExpenseCreateOpen(true);
              }}
              onOpenNewProduct={() => {
                setActiveTab('inventory');
                setProductCreateOpen(true);
              }}
              onOpenGmailReport={() => setGmailReportModalOpen(true)}
              onOpenBillPrintSetup={() => setBillPrintSetupOpen(true)}
              onViewInvoice={(invoice) => setInvoiceToPrint(invoice)}
            />
          )}

          {/* 2. SALES MODULE */}
          {activeTab === 'sales' && (
            <SalesModule
              onViewInvoice={(inv) => setInvoiceToPrint(inv)}
              initialCreateOpen={salesCreateOpen}
            />
          )}

          {/* 3. PURCHASE MODULE */}
          {activeTab === 'purchase' && (
            <PurchaseModule
              initialCreateOpen={purchaseCreateOpen}
            />
          )}

          {/* 4. RECEIPTS MODULE */}
          {activeTab === 'receipts' && (
            <ReceiptModule />
          )}

          {/* 5. PAYMENTS MODULE */}
          {activeTab === 'payments' && (
            <PaymentModule
              initialCreateOpen={paymentCreateOpen}
            />
          )}

          {/* 6. EXPENSES MODULE */}
          {activeTab === 'expenses' && (
            <ExpensesModule
              initialCreateOpen={expenseCreateOpen}
            />
          )}

          {/* 7. CUSTOMERS LEDGER */}
          {activeTab === 'customers' && (
            <PartiesModule initialType="customer" />
          )}

          {/* 8. SUPPLIERS LEDGER */}
          {activeTab === 'suppliers' && (
            <PartiesModule initialType="supplier" />
          )}

          {/* 9. INVENTORY LEDGER */}
          {activeTab === 'inventory' && (
            <InventoryLedgerModule
              initialAddProductOpen={productCreateOpen}
              onCloseAddProduct={() => setProductCreateOpen(false)}
            />
          )}

          {/* 10. IMEI VAULT */}
          {activeTab === 'imei_vault' && (
            <ImeiVaultModule />
          )}

          {/* 11. BANK & CASH ACCOUNTS */}
          {activeTab === 'accounts' && (
            <AccountsModule />
          )}

          {/* 12. FINANCIAL REPORTS */}
          {activeTab === 'reports' && (
            <ReportsModule />
          )}

          {/* 13. ACCOUNTING SETTINGS */}
          {activeTab === 'settings' && (
            <AccountingSettingsModule />
          )}

        </main>
      </div>

      {/* MODAL: EDIT BUSINESS / STORE NAME */}
      {editNameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 space-y-5 animate-scale-in">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">व्यवसायको नाम सम्पादन (Edit Business Name)</h3>
                  <p className="text-xs text-slate-500">यो नाम हेडर, बिक्री बिल तथा सम्पूर्ण रिपोर्टहरूमा देखिनेछ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditNameModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBusinessName} className="space-y-4 text-xs">
              
              {/* Business Name Field */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Business / Firm Name (पसल / फर्मको नाम) *</span>
                  <span className="text-[10px] text-sky-600 font-normal">Header & Bill Title</span>
                </label>
                <input
                  type="text"
                  required
                  value={tempCompanyName}
                  onChange={(e) => setTempCompanyName(e.target.value)}
                  placeholder="e.g. Pandey Mobile electic and electronic suppliers"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-hidden font-bold text-slate-800 text-sm transition-all"
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block">सुझावहरू (Quick Suggestions):</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTempCompanyName('Pandey Mobile electic and electronic suppliers')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded-lg text-[11px] font-medium border border-slate-200 transition cursor-pointer"
                  >
                    Pandey Mobile electic and electronic suppliers
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempCompanyName('Pandey Mobile electric and electronic suppliers')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded-lg text-[11px] font-medium border border-slate-200 transition cursor-pointer"
                  >
                    Pandey Mobile electric and electronic suppliers
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempCompanyName('पाण्डेय मोबाइल एण्ड इलेक्ट्रोनिक सप्लायर्स')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded-lg text-[11px] font-medium border border-slate-200 transition cursor-pointer"
                  >
                    पाण्डेय मोबाइल एण्ड इलेक्ट्रोनिक सप्लायर्स
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempCompanyName('Pandey Mobile Store & Care')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 rounded-lg text-[11px] font-medium border border-slate-200 transition cursor-pointer"
                  >
                    Pandey Mobile Store & Care
                  </button>
                </div>
              </div>

              {/* Additional Store Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone Number (सम्पर्क)</label>
                  <input
                    type="text"
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    placeholder="9857055743"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-sky-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PAN / VAT Number</label>
                  <input
                    type="text"
                    value={tempPan}
                    onChange={(e) => setTempPan(e.target.value)}
                    placeholder="601234567"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-sky-500 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Store Address (ठेगाना)</label>
                <input
                  type="text"
                  value={tempAddress}
                  onChange={(e) => setTempAddress(e.target.value)}
                  placeholder="Traffic Chowk, Butwal, Nepal"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-sky-500 outline-hidden"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditNameModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  रद्द गर्नुहोस् (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0288d1] hover:bg-[#0277bd] text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>नाम सुरक्षित गर्नुहोस् (Save & Apply)</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: INVOICE PRINT MODAL */}
      {invoiceToPrint && (
        <InvoicePrintModal
          invoice={invoiceToPrint}
          settings={settings}
          onClose={() => setInvoiceToPrint(null)}
        />
      )}

      {/* MODAL: BILL PRINT & PAPER SIZE SETUP */}
      <BillPrintSetupModal
        isOpen={billPrintSetupOpen}
        onClose={() => setBillPrintSetupOpen(false)}
        onSaved={() => {}}
      />

      {/* MODAL: GMAIL STOCK REPORT MODAL */}
      <GmailStockReportModal
        isOpen={gmailReportModalOpen}
        onClose={() => setGmailReportModalOpen(false)}
      />

      {/* MODAL: HELP & SYSTEM INFO MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0288d1] text-white flex items-center justify-center font-bold">
                  ?
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Accounting Help & Guide</h3>
                  <p className="text-xs text-slate-500">{settings.companyName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3 text-slate-600">
              <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl space-y-1">
                <p className="font-bold text-sky-950">नेपाली दोहोरो लेखा प्रणाली (Double Entry Accounting)</p>
                <p className="text-[11px] text-sky-800 leading-relaxed">
                  यो प्रणाली नेपालका स्मार्टफोन तथा इलेक्ट्रोनिक्स पसलहरूको वास्तविक कारोबार अनुसार डिजाइन गरिएको हो। बिक्री बिल, खरिद दाखिला, रसिद र भुक्तानी भौचरहरू वास्तविक हिसाबमा गणना हुन्छन्।
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-900">प्रमुख कार्यहरू (Key Shortcuts):</p>
                <ul className="list-disc pl-5 space-y-1 text-[11px]">
                  <li><strong>कर्सर अटो-ओपन (Cursor Auto-Open):</strong> कुनै पनि मेनु वा बटनमा कर्सर लैजानासाथ त्यसको विकल्प आफै खुल्छ र कर्सर हटाउँदा बन्द हुन्छ।</li>
                  <li><strong>Change Name:</strong> हेडरको नाममा क्लिक गरेर पसल/फर्मको नाम तत्काल परिवर्तन गर्न सकिन्छ।</li>
                  <li><strong>Account Statement:</strong> कुनै पनि ग्राहक, सप्लायर वा बैंक खाता छान्नुहोस् र <i>View Statement</i> थिच्नुहोस्।</li>
                  <li><strong>Party Information:</strong> खाता छानेर तत्काल फोन, ठेगाना, प्यान र बाँकी मौज्दात हेर्नुहोस्।</li>
                  <li><strong>Stock Statement:</strong> फोन मोडल छानेर सम्पूर्ण स्टक दाखिला र बिक्री खाता हेर्नुहोस्।</li>
                  <li><strong>Day Book:</strong> दिनभरिको कुल आम्दानी र खर्चको विवरण हेर्नुहोस् र प्रिन्ट गर्नुहोस्।</li>
                  <li><strong>Gear (⚙):</strong> बिल प्रिन्ट साइज (A4, A5, Thermal 80mm) सेटअप गर्नुहोस्।</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                बुझें (Close)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
