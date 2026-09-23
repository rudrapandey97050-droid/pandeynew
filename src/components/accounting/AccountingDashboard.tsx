import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBasket,
  BookOpen,
  RotateCcw,
  RotateCw,
  LayoutGrid,
  CalendarDays,
  FileText,
  Info,
  Calculator,
  Banknote,
  Landmark,
  ArrowDownCircle,
  CreditCard,
  QrCode,
  ArrowLeftRight,
  BarChart3,
  Plus,
  XCircle,
  Printer,
  X,
  Calendar,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { AccountingStorageService } from '../../services/accountingStorage.ts';
import { DataStorageService } from '../../services/dataStorage.ts';
import { ProductLedgerModal } from './ProductLedgerModal.tsx';
import { AccountingParty, SalesInvoice, BankAccount } from '../../types/accounting.ts';
import { Product } from '../../types.ts';

interface AccountingDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenNewSales: () => void;
  onOpenNewPurchase: () => void;
  onOpenNewReceipt: () => void;
  onOpenNewPayment: () => void;
  onOpenNewExpense: () => void;
  onOpenNewProduct?: () => void;
  onOpenGmailReport?: () => void;
  onOpenBillPrintSetup?: () => void;
  onViewInvoice?: (invoice: SalesInvoice) => void;
}

export const AccountingDashboard: React.FC<AccountingDashboardProps> = ({
  onNavigate,
  onOpenNewSales,
  onOpenNewPurchase,
  onOpenNewReceipt,
  onOpenNewPayment,
  onOpenNewExpense,
  onOpenBillPrintSetup
}) => {
  const metrics = AccountingStorageService.getFinancialMetrics();
  const [settings, setSettings] = useState(() => AccountingStorageService.getSettings());
  
  useEffect(() => {
    const unsub = AccountingStorageService.subscribe(() => {
      setSettings(AccountingStorageService.getSettings());
    });
    return () => unsub();
  }, []);

  const allProducts: Product[] = useMemo(() => DataStorageService.getProducts(), []);
  
  // All parties (customers & suppliers) and accounts
  const customers = useMemo(() => AccountingStorageService.getParties('customer'), []);
  const suppliers = useMemo(() => AccountingStorageService.getParties('supplier'), []);
  const bankAccounts: BankAccount[] = useMemo(() => AccountingStorageService.getAccounts(), []);

  // Cursor hover state for horizontal shelf buttons (auto opens/closes on cursor move)
  const [hoveredShelfItem, setHoveredShelfItem] = useState<string | null>(null);

  // Cursor hover state for summary cards
  const [hoveredSummaryCard, setHoveredSummaryCard] = useState<string | null>(null);

  // Combined ledger list for dropdowns
  const ledgerOptions = useMemo(() => {
    const list: Array<{ id: string; name: string; type: 'customer' | 'supplier' | 'cash' | 'bank'; balance: number; raw?: any }> = [];
    
    customers.forEach(c => list.push({ id: c.id, name: `${c.name} (Customer)`, type: 'customer', balance: c.currentBalance, raw: c }));
    suppliers.forEach(s => list.push({ id: s.id, name: `${s.name} (Supplier)`, type: 'supplier', balance: s.currentBalance, raw: s }));
    bankAccounts.forEach(b => list.push({ id: b.id, name: `${b.accountName} (${b.accountType === 'cash' ? 'Cash' : 'Bank'})`, type: b.accountType === 'cash' ? 'cash' : 'bank', balance: b.currentBalance, raw: b }));
    
    return list;
  }, [customers, suppliers, bankAccounts]);

  // Card 1: Account Statement state
  const [selectedStatementLedgerId, setSelectedStatementLedgerId] = useState<string>('');
  const [showStatementModal, setShowStatementModal] = useState<boolean>(false);

  // Card 2: Party Information state
  const [selectedPartyInfoId, setSelectedPartyInfoId] = useState<string>('');
  const selectedPartyInfo = useMemo(() => {
    return ledgerOptions.find(l => l.id === selectedPartyInfoId);
  }, [ledgerOptions, selectedPartyInfoId]);

  // Card 3: Stock Statement state
  const [selectedStockItemId, setSelectedStockItemId] = useState<string>('');
  const [showStockModal, setShowStockModal] = useState<boolean>(false);

  // Day Book Modal State
  const [showDayBookModal, setShowDayBookModal] = useState<boolean>(false);
  const [dayBookDate, setDayBookDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Journal Modal State
  const [showJournalModal, setShowJournalModal] = useState<boolean>(false);
  const [journalNarration, setJournalNarration] = useState('');
  const [journalAmount, setJournalAmount] = useState<number | ''>('');
  const [journalDrAccount, setJournalDrAccount] = useState('');
  const [journalCrAccount, setJournalCrAccount] = useState('');
  const [journalSuccess, setJournalSuccess] = useState(false);

  // S. Return & P. Return Modals
  const [showReturnModal, setShowReturnModal] = useState<'sales' | 'purchase' | null>(null);

  // Quick Account Add Trigger
  const [quickAddNotice, setQuickAddNotice] = useState<string | null>(null);

  // Compute Day Book Entries for selected date
  const dayBookEntries = useMemo(() => {
    const list: Array<{ id: string; type: string; ref: string; party: string; amount: number; isDebit: boolean }> = [];
    
    // Sales on date
    const sales = AccountingStorageService.getSalesInvoices().filter(s => s.invoiceDate === dayBookDate);
    sales.forEach(s => {
      list.push({ id: s.id, type: 'Sales Invoice', ref: s.invoiceNumber, party: s.customerName, amount: s.grandTotal, isDebit: true });
    });

    // Purchases on date
    const purchases = AccountingStorageService.getPurchases().filter(p => p.invoiceDate === dayBookDate);
    purchases.forEach(p => {
      list.push({ id: p.id, type: 'Purchase Bill', ref: p.invoiceNumber, party: p.supplierName, amount: p.grandTotal, isDebit: false });
    });

    // Receipts on date
    const receipts = AccountingStorageService.getReceipts().filter(r => r.date === dayBookDate);
    receipts.forEach(r => {
      list.push({ id: r.id, type: 'Payment Receipt', ref: r.receiptNumber, party: r.partyName, amount: r.amount, isDebit: true });
    });

    // Payments on date
    const payments = AccountingStorageService.getPayments().filter(pay => pay.date === dayBookDate);
    payments.forEach(pay => {
      list.push({ id: pay.id, type: 'Payment Voucher', ref: pay.voucherNumber, party: pay.partyName, amount: pay.amount, isDebit: false });
    });

    // Expenses on date
    const expenses = AccountingStorageService.getExpenses().filter(e => e.date === dayBookDate);
    expenses.forEach(e => {
      list.push({ id: e.id, type: 'Expense Voucher', ref: e.expenseNumber, party: e.category, amount: e.amount, isDebit: false });
    });

    return list;
  }, [dayBookDate]);

  const dayTotalInflow = dayBookEntries.filter(e => e.isDebit).reduce((acc, e) => acc + e.amount, 0);
  const dayTotalOutflow = dayBookEntries.filter(e => !e.isDebit).reduce((acc, e) => acc + e.amount, 0);

  // Statement entries for Statement Modal
  const statementEntries = useMemo(() => {
    if (!selectedStatementLedgerId) return [];
    return AccountingStorageService.getPartyLedger(selectedStatementLedgerId);
  }, [selectedStatementLedgerId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* 1. HORIZONTAL ACTION SHORTCUT BUTTONS SHELF (CURSOR HOVER AUTO-OPEN & CLOSE) */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2.5 relative">
        
        {/* 1. Sales */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredShelfItem('sales')}
          onMouseLeave={() => setHoveredShelfItem(null)}
        >
          <button
            type="button"
            onClick={onOpenNewSales}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-3 flex flex-col items-center justify-center space-y-1.5 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            title="Create New Sales Invoice (बिक्री बिल)"
          >
            <div className="p-2 rounded-xl text-indigo-700 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">Sales</span>
          </button>

          {/* Auto-Open Dropdown on Cursor Hover */}
          {hoveredShelfItem === 'sales' && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 text-xs font-semibold animate-fade-in">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-indigo-700 border-b border-slate-100 flex justify-between items-center">
                <span>Sales (बिक्री)</span>
                <span className="text-[9px] text-slate-400 font-mono">Auto</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onOpenNewSales();
                  setHoveredShelfItem(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-indigo-50 text-indigo-700 font-bold flex items-center justify-between"
              >
                <span>+ New Sales Bill</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('sales');
                  setHoveredShelfItem(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700"
              >
                View Sales Register
              </button>
            </div>
          )}
        </div>

        {/* 2. Purchase */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredShelfItem('purchase')}
          onMouseLeave={() => setHoveredShelfItem(null)}
        >
          <button
            type="button"
            onClick={onOpenNewPurchase}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-3 flex flex-col items-center justify-center space-y-1.5 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            title="Record New Purchase Bill (खरिद बिल)"
          >
            <div className="p-2 rounded-xl text-emerald-700 group-hover:scale-110 transition-transform">
              <ShoppingBasket className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-600">Purchase</span>
          </button>

          {/* Auto-Open Dropdown on Cursor Hover */}
          {hoveredShelfItem === 'purchase' && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 text-xs font-semibold animate-fade-in">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-emerald-700 border-b border-slate-100 flex justify-between items-center">
                <span>Purchase (खरिद)</span>
                <span className="text-[9px] text-slate-400 font-mono">Auto</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onOpenNewPurchase();
                  setHoveredShelfItem(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 font-bold flex items-center justify-between"
              >
                <span>+ New Purchase Bill</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('purchase');
                  setHoveredShelfItem(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700"
              >
                View Purchase Register
              </button>
            </div>
          )}
        </div>

        {/* 3. Receipt */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredShelfItem('receipt')}
          onMouseLeave={() => setHoveredShelfItem(null)}
        >
          <button
            type="button"
            onClick={onOpenNewReceipt}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-blue-300 rounded-2xl p-3 flex flex-col items-center justify-center space-y-1.5 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            title="Record Customer Payment Receipt (रसिद)"
          >
            <div className="p-2 rounded-xl text-blue-700 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Receipt</span>
          </button>

          {/* Auto-Open Dropdown on Cursor Hover */}
          {hoveredShelfItem === 'receipt' && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 text-xs font-semibold animate-fade-in">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-blue-700 border-b border-slate-100">
                <span>Payment Receipt (रसिद)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onOpenNewReceipt();
                  setHoveredShelfItem(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-blue-50 text-blue-700 font-bold"
              >
                + Issue Receipt
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('customers');
                  setHoveredShelfItem(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700"
              >
                Customer Receivables
              </button>
            </div>
          )}
        </div>

        {/* 4. Payment */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredShelfItem('payment')}
          onMouseLeave={() => setHoveredShelfItem(null)}
        >
          <button
            type="button"
            onClick={onOpenNewPayment}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-purple-300 rounded-2xl p-3 flex flex-col items-center justify-center space-y-1.5 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            title="Make Supplier Payment (भुक्तानी भौचर)"
          >
            <div className="p-2 rounded-xl text-purple-700 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-purple-600">Payment</span>
          </button>

          {/* Auto-Open Dropdown on Cursor Hover */}
          {hoveredShelfItem === 'payment' && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 text-xs font-semibold animate-fade-in">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-purple-700 border-b border-slate-100">
                <span>Supplier Payment (भुक्तानी)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onOpenNewPayment();
                  setHoveredShelfItem(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-purple-50 text-purple-700 font-bold"
              >
                + Supplier Payment
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('suppliers');
                  setHoveredShelfItem(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700"
              >
                Supplier Payables
              </button>
            </div>
          )}
        </div>

        {/* 5. Journal */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredShelfItem('journal')}
          onMouseLeave={() => setHoveredShelfItem(null)}
        >
          <button
            type="button"
            onClick={() => setShowJournalModal(true)}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-amber-300 rounded-2xl p-3 flex flex-col items-center justify-center space-y-1.5 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            title="Enter Journal Voucher (जर्नल भौचर)"
          >
            <div className="p-2 rounded-xl text-amber-700 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-amber-600">Journal</span>
          </button>

          {/* Auto-Open Dropdown on Cursor Hover */}
          {hoveredShelfItem === 'journal' && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 text-xs font-semibold animate-fade-in">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-amber-700 border-b border-slate-100">
                <span>Journal Entry (जर्नल)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowJournalModal(true);
                  setHoveredShelfItem(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-amber-50 text-amber-700 font-bold"
              >
                + Post Journal Voucher
              </button>
            </div>
          )}
        </div>

        {/* 6. S. Return */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredShelfItem('s_return')}
          onMouseLeave={() => setHoveredShelfItem(null)}
        >
          <button
            type="button"
            onClick={() => setShowReturnModal('sales')}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-rose-300 rounded-2xl p-3 flex flex-col items-center justify-center space-y-1.5 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            title="Sales Return (बिक्री फिर्ता)"
          >
            <div className="p-2 rounded-xl text-rose-700 group-hover:scale-110 transition-transform">
              <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-rose-600">S. Return</span>
          </button>

          {/* Auto-Open Dropdown on Cursor Hover */}
          {hoveredShelfItem === 's_return' && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 text-xs font-semibold animate-fade-in">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-rose-700 border-b border-slate-100">
                <span>Sales Return (बिक्री फिर्ता)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReturnModal('sales');
                  setHoveredShelfItem(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-rose-50 text-rose-700 font-bold"
              >
                + Issue Credit Note
              </button>
            </div>
          )}
        </div>

        {/* 7. P. Return */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredShelfItem('p_return')}
          onMouseLeave={() => setHoveredShelfItem(null)}
        >
          <button
            type="button"
            onClick={() => setShowReturnModal('purchase')}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-orange-300 rounded-2xl p-3 flex flex-col items-center justify-center space-y-1.5 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            title="Purchase Return (खरिद फिर्ता)"
          >
            <div className="p-2 rounded-xl text-orange-700 group-hover:scale-110 transition-transform">
              <RotateCw className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-orange-600">P. Return</span>
          </button>

          {/* Auto-Open Dropdown on Cursor Hover */}
          {hoveredShelfItem === 'p_return' && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 text-xs font-semibold animate-fade-in">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-orange-700 border-b border-slate-100">
                <span>Purchase Return (खरिद फिर्ता)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReturnModal('purchase');
                  setHoveredShelfItem(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-orange-50 text-orange-700 font-bold"
              >
                + Issue Debit Note
              </button>
            </div>
          )}
        </div>

        {/* 8. Stock */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredShelfItem('stock')}
          onMouseLeave={() => setHoveredShelfItem(null)}
        >
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-teal-300 rounded-2xl p-3 flex flex-col items-center justify-center space-y-1.5 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            title="Stock Balance & Inventory Ledger (स्टक मौज्दात)"
          >
            <div className="p-2 rounded-xl text-teal-700 group-hover:scale-110 transition-transform">
              <LayoutGrid className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-teal-600">Stock</span>
          </button>

          {/* Auto-Open Dropdown on Cursor Hover */}
          {hoveredShelfItem === 'stock' && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 text-xs font-semibold animate-fade-in">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-teal-700 border-b border-slate-100">
                <span>Inventory & Stock (स्टक)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onNavigate('inventory');
                  setHoveredShelfItem(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-teal-50 text-teal-700 font-bold"
              >
                Stock Balance List
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('imei_vault');
                  setHoveredShelfItem(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700"
              >
                IMEI Vault Tracker
              </button>
            </div>
          )}
        </div>

        {/* 9. Day Book */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredShelfItem('daybook')}
          onMouseLeave={() => setHoveredShelfItem(null)}
        >
          <button
            type="button"
            onClick={() => setShowDayBookModal(true)}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-cyan-300 rounded-2xl p-3 flex flex-col items-center justify-center space-y-1.5 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            title="View Day Book / Daily Transactions (दैनिक बहीखाता)"
          >
            <div className="p-2 rounded-xl text-cyan-700 group-hover:scale-110 transition-transform">
              <CalendarDays className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-cyan-600">Day Book</span>
          </button>

          {/* Auto-Open Dropdown on Cursor Hover */}
          {hoveredShelfItem === 'daybook' && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 text-xs font-semibold animate-fade-in">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-cyan-700 border-b border-slate-100">
                <span>Day Book (दैनिक बही)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDayBookModal(true);
                  setHoveredShelfItem(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-cyan-50 text-cyan-700 font-bold"
              >
                Open Daily Register
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 2. ROW 1: THREE INTERACTIVE STATEMENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Account Statement */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-sky-300 hover:shadow-md transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-sky-500 flex items-center gap-2">
                <span>Account Statement</span>
              </h3>
              <FileText className="w-5 h-5 text-sky-500" />
            </div>

            <div>
              <select
                value={selectedStatementLedgerId}
                onChange={(e) => setSelectedStatementLedgerId(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-sky-400 font-medium cursor-pointer"
              >
                <option value="">Choose Ledger</option>
                {ledgerOptions.map((opt) => (
                  <option key={`stmt_${opt.id}`} value={opt.id}>
                    {opt.name} — Rs. {opt.balance.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={!selectedStatementLedgerId}
              onClick={() => setShowStatementModal(true)}
              className="px-4 py-1.5 rounded-full border border-sky-200 bg-white hover:bg-sky-50 text-sky-600 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            >
              View Statement
            </button>
          </div>
        </div>

        {/* Card 2: Party Information */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-orange-300 hover:shadow-md transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-orange-400 flex items-center gap-2">
                <span>Party Information</span>
              </h3>
              <Info className="w-5 h-5 text-orange-400" />
            </div>

            <div>
              <select
                value={selectedPartyInfoId}
                onChange={(e) => setSelectedPartyInfoId(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-orange-400 font-medium cursor-pointer"
              >
                <option value="">Choose Ledger</option>
                {ledgerOptions.map((opt) => (
                  <option key={`party_${opt.id}`} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-xl bg-[#f4f2fd] border border-indigo-100 p-3 text-xs text-indigo-950 min-h-[72px] flex items-center">
            {selectedPartyInfo ? (
              <div className="space-y-1 w-full text-[11px]">
                <div className="flex justify-between font-bold">
                  <span className="text-indigo-900">{selectedPartyInfo.name}</span>
                  <span className="font-mono text-indigo-700 font-extrabold">
                    Rs. {selectedPartyInfo.balance.toLocaleString()}
                  </span>
                </div>
                {selectedPartyInfo.raw?.phone && (
                  <p className="text-slate-600">Phone: <b>{selectedPartyInfo.raw.phone}</b></p>
                )}
                {selectedPartyInfo.raw?.address && (
                  <p className="text-slate-600 truncate">Address: <b>{selectedPartyInfo.raw.address}</b></p>
                )}
                {selectedPartyInfo.raw?.panVatNumber && (
                  <p className="text-slate-600">PAN: <b>{selectedPartyInfo.raw.panVatNumber}</b></p>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-indigo-600 font-medium text-[11px]">
                <Info className="w-4 h-4 shrink-0 text-indigo-500" />
                <span>Select Ledger to view balance and details.</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Stock Statement */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-orange-300 hover:shadow-md transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-orange-400 flex items-center gap-2">
                <span>Stock Statement</span>
              </h3>
              <Calculator className="w-5 h-5 text-teal-500" />
            </div>

            <div>
              <select
                value={selectedStockItemId}
                onChange={(e) => setSelectedStockItemId(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-orange-400 font-medium cursor-pointer"
              >
                <option value="">Choose an Item</option>
                {allProducts.map((prod) => (
                  <option key={`stock_${prod.id}`} value={prod.id}>
                    {prod.name} (Stock: {prod.stock ?? 0} pcs)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={!selectedStockItemId}
              onClick={() => setShowStockModal(true)}
              className="px-4 py-1.5 rounded-full border border-sky-200 bg-white hover:bg-sky-50 text-sky-600 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            >
              View Stock Statement
            </button>
          </div>
        </div>

      </div>

      {/* 3. ROW 2: SIX ACCOUNT SUMMARY CARDS (WITH CURSOR HOVER AUTO-DETAILS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* 1. Cash Accounts */}
        <div
          onMouseEnter={() => setHoveredSummaryCard('cash')}
          onMouseLeave={() => setHoveredSummaryCard(null)}
          className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all ${
            hoveredSummaryCard === 'cash' ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-indigo-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Banknote className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-indigo-600">Cash Accounts</h4>
                <p className="text-[11px] text-slate-500">काउन्टर नगद मौज्दात</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-slate-400">
              <button
                type="button"
                onClick={() => {
                  onOpenNewReceipt();
                  setQuickAddNotice('Cash Receipt Form opened');
                }}
                className="p-1 hover:text-indigo-600 text-slate-500 transition-colors cursor-pointer text-sm font-bold"
                title="Add Cash Receipt"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('accounts')}
                className="p-1 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                title="Manage Cash Accounts"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-xs text-slate-500">Balance in Hand:</span>
            <span className="text-xl font-black font-mono text-slate-900">
              Rs. {metrics.cashBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 2. Bank Accounts */}
        <div
          onMouseEnter={() => setHoveredSummaryCard('bank')}
          onMouseLeave={() => setHoveredSummaryCard(null)}
          className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all ${
            hoveredSummaryCard === 'bank' ? 'border-purple-400 ring-2 ring-purple-50' : 'border-purple-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <Landmark className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-purple-600">Bank Accounts</h4>
                <p className="text-[11px] text-slate-500">बैंक तथा इसेवा खाता</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-slate-400">
              <button
                type="button"
                onClick={() => onNavigate('accounts')}
                className="p-1 hover:text-purple-600 text-slate-500 transition-colors cursor-pointer text-sm font-bold"
                title="Add Bank Transaction"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('accounts')}
                className="p-1 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                title="Manage Bank Accounts"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-xs text-slate-500">Bank & Wallets:</span>
            <span className="text-xl font-black font-mono text-purple-900">
              Rs. {metrics.bankBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 3. Receivables */}
        <div
          onMouseEnter={() => setHoveredSummaryCard('receivables')}
          onMouseLeave={() => setHoveredSummaryCard(null)}
          className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all ${
            hoveredSummaryCard === 'receivables' ? 'border-sky-400 ring-2 ring-sky-50' : 'border-sky-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
                <ArrowDownCircle className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-sky-600">Receivables</h4>
                <p className="text-[11px] text-slate-500">ग्राहकबाट उठ्न बाँकी</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-slate-400">
              <button
                type="button"
                onClick={() => onNavigate('customers')}
                className="p-1 hover:text-sky-600 text-slate-500 transition-colors cursor-pointer text-sm font-bold"
                title="View Customer Ledgers"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('customers')}
                className="p-1 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                title="Customer Balances"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-xs text-slate-500">Total Outstanding:</span>
            <span className="text-xl font-black font-mono text-sky-800">
              Rs. {metrics.totalReceivable.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 4. Sales */}
        <div
          onMouseEnter={() => setHoveredSummaryCard('sales_card')}
          onMouseLeave={() => setHoveredSummaryCard(null)}
          className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all ${
            hoveredSummaryCard === 'sales_card' ? 'border-emerald-400 ring-2 ring-emerald-50' : 'border-emerald-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <ShoppingBasket className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-600">Sales</h4>
                <p className="text-[11px] text-slate-500">{metrics.salesCount} बिक्री बिलहरू</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-slate-400">
              <button
                type="button"
                onClick={onOpenNewSales}
                className="p-1 hover:text-emerald-600 text-slate-500 transition-colors cursor-pointer text-sm font-bold"
                title="Create New Sales Bill"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('sales')}
                className="p-1 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                title="View Sales Register"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-xs text-slate-500">Gross Sales:</span>
            <span className="text-xl font-black font-mono text-emerald-800">
              Rs. {metrics.totalSales.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 5. Purchase */}
        <div
          onMouseEnter={() => setHoveredSummaryCard('purchase_card')}
          onMouseLeave={() => setHoveredSummaryCard(null)}
          className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all ${
            hoveredSummaryCard === 'purchase_card' ? 'border-slate-400 ring-2 ring-slate-100' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                <CreditCard className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-700">Purchase</h4>
                <p className="text-[11px] text-slate-500">{metrics.purchaseCount} खरिद बिलहरू</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-slate-400">
              <button
                type="button"
                onClick={onOpenNewPurchase}
                className="p-1 hover:text-slate-900 text-slate-500 transition-colors cursor-pointer text-sm font-bold"
                title="Create Purchase Bill"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('purchase')}
                className="p-1 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                title="View Purchase Register"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-xs text-slate-500">Total Purchases:</span>
            <span className="text-xl font-black font-mono text-slate-900">
              Rs. {metrics.totalPurchase.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 6. Payables */}
        <div
          onMouseEnter={() => setHoveredSummaryCard('payables')}
          onMouseLeave={() => setHoveredSummaryCard(null)}
          className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all ${
            hoveredSummaryCard === 'payables' ? 'border-rose-400 ring-2 ring-rose-50' : 'border-rose-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                <QrCode className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-rose-600">Payables</h4>
                <p className="text-[11px] text-slate-500">सप्लायरलाई तिर्न बाँकी</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-slate-400">
              <button
                type="button"
                onClick={() => onNavigate('suppliers')}
                className="p-1 hover:text-rose-600 text-slate-500 transition-colors cursor-pointer text-sm font-bold"
                title="Supplier Accounts"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('suppliers')}
                className="p-1 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                title="Supplier Balances"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-xs text-slate-500">Payable to Suppliers:</span>
            <span className="text-xl font-black font-mono text-rose-800">
              Rs. {metrics.totalPayable.toLocaleString()}
            </span>
          </div>
        </div>

      </div>

      {/* 4. ROW 3: CASHFLOW & SALES/PURCHASE TREND CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Cashflow Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-orange-300 transition-colors space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-orange-400 flex items-center gap-2">
              <span>Cashflow</span>
            </h3>
            <ArrowLeftRight className="w-5 h-5 text-orange-400" />
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="font-bold text-slate-800 block">Total Liquid Cash (काउन्टर नगद)</span>
                <span className="text-[11px] text-slate-500">Instant available cash in store drawer</span>
              </div>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                Rs. {metrics.cashBalance.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="font-bold text-slate-800 block">Bank Accounts & eSewa (बैंक मौज्दात)</span>
                <span className="text-[11px] text-slate-500">Nabil Bank, NIC Asia, Digital Wallets</span>
              </div>
              <span className="font-mono font-bold text-indigo-700 text-sm">
                Rs. {metrics.bankBalance.toLocaleString()}
              </span>
            </div>

            <div className="pt-2 flex justify-between items-center font-bold text-slate-700 text-xs">
              <span>Total Available Liquid Funds:</span>
              <span className="text-sm font-black font-mono text-slate-900">
                Rs. {(metrics.cashBalance + metrics.bankBalance).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Sales / Purchase Comparative Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-orange-300 transition-colors space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-orange-400 flex items-center gap-2">
              <span>Sales / Purchase</span>
            </h3>
            <BarChart3 className="w-5 h-5 text-orange-400" />
          </div>

          <div className="space-y-3">
            {/* Sales Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-700">Total Sales (बिक्री)</span>
                <span className="font-mono font-black text-slate-900">Rs. {metrics.totalSales.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, metrics.totalSales > 0 ? (metrics.totalSales / (metrics.totalSales + metrics.totalPurchase || 1)) * 100 : 0)}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Purchase Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Total Purchase (खरिद)</span>
                <span className="font-mono font-black text-slate-900">Rs. {metrics.totalPurchase.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-slate-700 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, metrics.totalPurchase > 0 ? (metrics.totalPurchase / (metrics.totalSales + metrics.totalPurchase || 1)) * 100 : 0)}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Profit summary */}
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Net Estimated Profit:</span>
              <span className={`font-mono font-bold text-sm ${metrics.netProfitOrLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                Rs. {metrics.netProfitOrLoss.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* QUICK NOTICE TOAST */}
      {quickAddNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{quickAddNotice}</span>
          <button type="button" onClick={() => setQuickAddNotice(null)} className="ml-2 text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* MODAL 1: ACCOUNT STATEMENT VIEWER */}
      {showStatementModal && selectedStatementLedgerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-sky-600 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <span>Statement of Account (खाता बहीखाता)</span>
                </h3>
                <p className="text-xs text-sky-100">
                  {ledgerOptions.find(l => l.id === selectedStatementLedgerId)?.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white text-sky-700 hover:bg-sky-50 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatementModal(false)}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs">
              <div className="border-b pb-4 mb-4 text-center">
                <h2 className="text-base font-black uppercase text-slate-900">{settings.companyName}</h2>
                <p className="text-slate-500 text-[11px]">{settings.address} • Phone: {settings.phone}</p>
                <div className="mt-2 inline-block bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1 rounded-full font-bold text-xs">
                  ACCOUNT LEDGER: {ledgerOptions.find(l => l.id === selectedStatementLedgerId)?.name}
                </div>
              </div>

              {statementEntries.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  यस खातामा कुनै कारोबार फेला परेन (No transactions recorded in this ledger).
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Voucher Type</th>
                        <th className="py-2.5 px-3">Ref #</th>
                        <th className="py-2.5 px-3 text-right">Debit (Dr)</th>
                        <th className="py-2.5 px-3 text-right">Credit (Cr)</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {statementEntries.map((entry, idx) => (
                        <tr key={`stmt_row_${idx}`} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono">{entry.date}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{entry.refType}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{entry.refNumber}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            {entry.debit > 0 ? `Rs. ${entry.debit.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                            {entry.credit > 0 ? `Rs. ${entry.credit.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                            Rs. {entry.balance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: STOCK STATEMENT (PRODUCT LEDGER MODAL) */}
      {showStockModal && selectedStockItemId && (
        <ProductLedgerModal
          productId={selectedStockItemId}
          allProducts={allProducts}
          onSelectProduct={(id) => setSelectedStockItemId(id)}
          onClose={() => setShowStockModal(false)}
        />
      )}

      {/* MODAL 3: DAY BOOK (दैनिक बहीखाता) */}
      {showDayBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <CalendarDays className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-base font-bold">Day Book (दैनिक कारोबार बहीखाता)</h3>
                  <p className="text-xs text-slate-400">All financial transactions on {dayBookDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={dayBookDate}
                  onChange={(e) => setDayBookDate(e.target.value)}
                  className="bg-slate-800 text-white border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-mono font-bold cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDayBookModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
              {/* Day Totals Summary Banner */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Inflow (आम्दानी / रसिद)</span>
                  <span className="text-base font-black font-mono text-emerald-950">Rs. {dayTotalInflow.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-[10px] font-bold text-rose-800 uppercase block">Total Outflow (खरिद / खर्च)</span>
                  <span className="text-base font-black font-mono text-rose-950">Rs. {dayTotalOutflow.toLocaleString()}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-700 uppercase block">Net Day Balance (खुद मौज्दात)</span>
                  <span className="text-base font-black font-mono text-slate-900">Rs. {(dayTotalInflow - dayTotalOutflow).toLocaleString()}</span>
                </div>
              </div>

              {dayBookEntries.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  {dayBookDate} मा कुनै पनि कारोबार फेला परेन (No vouchers recorded on this date).
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Voucher Ref #</th>
                        <th className="py-2.5 px-3">Party / Account</th>
                        <th className="py-2.5 px-3 text-right">Inflow (Dr)</th>
                        <th className="py-2.5 px-3 text-right">Outflow (Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dayBookEntries.map((e, idx) => (
                        <tr key={`day_${idx}`} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{e.type}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{e.ref}</td>
                          <td className="py-2.5 px-3 text-slate-700">{e.party}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            {e.isDebit ? `Rs. ${e.amount.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                            {!e.isDebit ? `Rs. ${e.amount.toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: JOURNAL VOUCHER (जर्नल भौचर) */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <span>Journal Voucher Entry (जर्नल भौचर)</span>
              </h3>
              <button type="button" onClick={() => setShowJournalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {journalSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-emerald-950 text-xs">जर्नल भौचर सफलतापूर्वक सुरक्षित भयो!</p>
                <button
                  type="button"
                  onClick={() => {
                    setJournalSuccess(false);
                    setShowJournalModal(false);
                  }}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!journalAmount || Number(journalAmount) <= 0) {
                    alert('कृपया रकम प्रविष्ट गर्नुहोस्।');
                    return;
                  }
                  setJournalSuccess(true);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Debit Account (Dr - खाता)</label>
                  <select
                    value={journalDrAccount}
                    onChange={(e) => setJournalDrAccount(e.target.value)}
                    required
                    className="w-full p-2 border rounded-xl"
                  >
                    <option value="">Choose Debit Ledger</option>
                    {ledgerOptions.map(l => (
                      <option key={`jdr_${l.id}`} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Account (Cr - खाता)</label>
                  <select
                    value={journalCrAccount}
                    onChange={(e) => setJournalCrAccount(e.target.value)}
                    required
                    className="w-full p-2 border rounded-xl"
                  >
                    <option value="">Choose Credit Ledger</option>
                    {ledgerOptions.map(l => (
                      <option key={`jcr_${l.id}`} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (रकम Rs.)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Rs. 0"
                    value={journalAmount}
                    onChange={(e) => setJournalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full p-2 border rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Narration (कैफियत)</label>
                  <input
                    type="text"
                    placeholder="Journal adjustment details..."
                    value={journalNarration}
                    onChange={(e) => setJournalNarration(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button type="button" onClick={() => setShowJournalModal(false)} className="px-4 py-2 border rounded-xl font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold">
                    Save Journal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 5: RETURN MODALS (S. RETURN / P. RETURN) */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              {showReturnModal === 'sales' ? <RotateCcw className="w-6 h-6" /> : <RotateCw className="w-6 h-6" />}
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {showReturnModal === 'sales' ? 'Sales Return (बिक्री फिर्ता)' : 'Purchase Return (खरिद फिर्ता)'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {showReturnModal === 'sales'
                ? 'Select original Sales Invoice or enter returned mobile handset to issue Credit Note.'
                : 'Select Purchase Bill or enter defective item to issue Debit Note to supplier.'}
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowReturnModal(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReturnModal(null);
                  if (showReturnModal === 'sales') {
                    onNavigate('sales');
                  } else {
                    onNavigate('purchase');
                  }
                }}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Open {showReturnModal === 'sales' ? 'Sales' : 'Purchase'} Register
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
