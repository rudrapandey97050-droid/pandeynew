import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Users,
  Building2,
  Package,
  Landmark,
  FileSpreadsheet,
  Settings,
  Plus,
  ArrowLeft,
  Shield,
  Search,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  Mail,
  Clock,
  CheckCircle2,
  Bell,
  Printer,
  Smartphone
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

  // Quick modals triggers
  const [salesCreateOpen, setSalesCreateOpen] = useState(false);
  const [purchaseCreateOpen, setPurchaseCreateOpen] = useState(false);
  const [receiptCreateOpen, setReceiptCreateOpen] = useState(false);
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
    const unsub = GmailStockReportService.addSchedulerListener((ev) => {
      setScheduleNotice(ev);
      setScheduleConfig(GmailStockReportService.getScheduleConfig());
    });
    return () => unsub();
  }, []);

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
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            मुख्य एडमिन प्यानलमा फर्कनुहोस्
          </button>
        </div>
      </div>
    );
  }

  const settings = AccountingStorageService.getSettings();

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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      
      {/* Top Accounting Platform Header */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          
          {/* Brand & Mode Switcher */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={onBackToWebsite}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
              title="Exit Accounting and return to Website Admin"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Website Management</span>
              <span className="sm:hidden">Website</span>
            </button>

            <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white font-serif">
                  PANDEY ACCOUNTING PLATFORM
                </h1>
                <span className="hidden md:inline-block text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold font-mono rounded-full uppercase">
                  FY {settings.financialYear}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="hidden lg:inline-flex items-center space-x-1 text-[10px] px-2.5 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold font-mono rounded-full transition-colors cursor-pointer"
                  title="Click to view Subdomain & Dedicated Links settings"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>account.pandeymobile.com.np</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Logical ERP separation: Sales, Purchases, Ledgers, Tax & Financial Reports
              </p>
            </div>
          </div>

          {/* User Role Badge & Direct Action Shortcuts */}
          <div className="flex items-center space-x-2">
            <div className="hidden xl:flex items-center space-x-1.5 mr-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('sales');
                  setSalesCreateOpen(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Sales</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('purchase');
                  setPurchaseCreateOpen(true);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Purchase</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('receipts');
                  setReceiptCreateOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>+ Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('expenses');
                  setExpenseCreateOpen(true);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Expense</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('inventory');
                  setProductCreateOpen(true);
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Product</span>
              </button>

              <button
                type="button"
                onClick={() => setGmailReportModalOpen(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer border border-indigo-400/30"
                title={`Daily 9:00 PM Auto-Stock: ${scheduleConfig.autoSendEnabled ? 'Active' : 'Off'} (${scheduleConfig.senderEmail || 'pmesbutwal@gmail.com'} → ${scheduleConfig.recipientEmail || 'rudra.pandey97050@gmail.com'})`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>Daily 9 PM Stock</span>
                {scheduleConfig.autoSendEnabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="9:00 PM Auto-Scheduler Active"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setBillPrintSetupOpen(true)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                title="कागज साइज तथा बिल प्रिन्ट सेटअप (Bill Paper Size Setup)"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                <span>प्रिन्ट सेटअप (Paper Size)</span>
              </button>
            </div>

            <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl flex items-center space-x-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-medium block leading-none">Access Level</span>
                <span className="text-xs font-bold text-emerald-400 leading-tight">Administrator</span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Left Accounting Navigation Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 pt-16 lg:pt-0 ${
            mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div className="p-4 space-y-1">
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
              Accounting Modules (लेखा मोड्युल)
            </div>

            <nav className="space-y-1">
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
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <div className="flex-1 truncate">
                      <div className="truncate">{item.label}</div>
                      <div className={`text-[10px] font-normal truncate ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                        {item.sublabel}
                      </div>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                );
              })}
            </nav>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">Security Isolation</p>
                <p className="text-[10px] text-slate-500">
                  Accounting records are segregated from regular website shop data. All calculations reflect actual vouchers.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          
          {/* Daily 9:00 PM Auto-Dispatch Notification Banner */}
          {scheduleNotice && (
            <div
              className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs transition-all ${
                scheduleNotice.type === 'dispatched'
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : scheduleNotice.type === 'pending_auth'
                  ? 'bg-indigo-50/90 border-indigo-300 text-indigo-950'
                  : 'bg-rose-50/90 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-start sm:items-center space-x-3">
                {scheduleNotice.type === 'dispatched' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <Bell className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 sm:mt-0 animate-bounce" />
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
                setReceiptCreateOpen(true);
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
              onViewInvoice={(invoice) => setInvoiceToPrint(invoice)}
            />
          )}

          {activeTab === 'sales' && (
            <SalesModule
              onViewInvoice={(inv) => setInvoiceToPrint(inv)}
              initialCreateOpen={salesCreateOpen}
            />
          )}

          {activeTab === 'purchase' && (
            <PurchaseModule
              initialCreateOpen={purchaseCreateOpen}
            />
          )}

          {activeTab === 'receipts' && (
            <ReceiptModule
              initialCreateOpen={receiptCreateOpen}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentModule
              initialCreateOpen={paymentCreateOpen}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesModule
              initialCreateOpen={expenseCreateOpen}
            />
          )}

          {activeTab === 'customers' && (
            <PartiesModule initialType="customer" />
          )}

          {activeTab === 'suppliers' && (
            <PartiesModule initialType="supplier" />
          )}

          {activeTab === 'inventory' && (
            <InventoryLedgerModule
              initialAddProductOpen={productCreateOpen}
              onCloseAddProduct={() => setProductCreateOpen(false)}
              onOpenGmailReport={() => setGmailReportModalOpen(true)}
            />
          )}

          {activeTab === 'imei_vault' && (
            <ImeiVaultModule />
          )}

          {activeTab === 'accounts' && (
            <AccountsModule />
          )}

          {activeTab === 'reports' && (
            <ReportsModule onOpenGmailReport={() => setGmailReportModalOpen(true)} />
          )}

          {activeTab === 'settings' && (
            <AccountingSettingsModule />
          )}

        </main>

      </div>

      {/* INVOICE PRINT MODAL */}
      {invoiceToPrint && (
        <InvoicePrintModal
          invoice={invoiceToPrint}
          settings={settings}
          onClose={() => setInvoiceToPrint(null)}
        />
      )}

      {/* GMAIL DAILY STOCK REPORT MODAL */}
      <GmailStockReportModal
        isOpen={gmailReportModalOpen}
        onClose={() => setGmailReportModalOpen(false)}
      />

      {/* BILL PRINT & PAPER SIZE SETUP MODAL */}
      <BillPrintSetupModal
        isOpen={billPrintSetupOpen}
        onClose={() => setBillPrintSetupOpen(false)}
        onTestPrint={(sampleInvoice) => {
          setBillPrintSetupOpen(false);
          setInvoiceToPrint(sampleInvoice);
        }}
      />

    </div>
  );
};
