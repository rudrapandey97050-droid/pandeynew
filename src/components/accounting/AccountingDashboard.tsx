import React from 'react';
import {
  ShoppingBag,
  ShoppingCart,
  Users,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  ChevronRight,
  BookOpen,
  Mail
} from 'lucide-react';
import { AccountingStorageService } from '../../services/accountingStorage.ts';
import { SalesInvoice } from '../../types/accounting.ts';

interface AccountingDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenNewSales: () => void;
  onOpenNewPurchase: () => void;
  onOpenNewReceipt: () => void;
  onOpenNewPayment: () => void;
  onOpenNewExpense: () => void;
  onOpenNewProduct?: () => void;
  onOpenGmailReport?: () => void;
  onViewInvoice?: (invoice: SalesInvoice) => void;
}

export const AccountingDashboard: React.FC<AccountingDashboardProps> = ({
  onNavigate,
  onOpenNewSales,
  onOpenNewPurchase,
  onOpenNewReceipt,
  onOpenNewPayment,
  onOpenNewExpense,
  onOpenNewProduct,
  onOpenGmailReport
}) => {
  const metrics = AccountingStorageService.getFinancialMetrics();

  return (
    <div className="space-y-6">
      {/* Top Quick Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">
            Accounting Console (लेखा नियन्त्रण कक्ष)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenNewSales}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Sales (बिक्री बिल)</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewPurchase}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Purchase (खरिद बिल)</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewReceipt}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Receipt (रसिद)</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewPayment}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" />
            <span>+ Payment (भुक्तानी)</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewExpense}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-rose-600" />
            <span>+ Expense (खर्च)</span>
          </button>

          {onOpenNewProduct && (
            <button
              type="button"
              onClick={onOpenNewProduct}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Product (नयाँ सामान)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
            title="View Product Stock Movement Ledger (सामान खाता)"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>सामान खाता (Product Ledger)</span>
          </button>

          {onOpenGmailReport && (
            <button
              type="button"
              onClick={onOpenGmailReport}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
              title="Send Daily Stock & Valuation Report to Gmail"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Stock Report to Gmail</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 1: Primary KPIs (Sales, Purchase, Receivable, Payable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div
          onClick={() => onNavigate('sales')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Sales (कुल बिक्री)</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            Rs. {metrics.totalSales.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{metrics.salesCount} active invoices</span>
            <span className="text-indigo-600 font-bold flex items-center">View List <ChevronRight className="w-3 h-3" /></span>
          </div>
        </div>

        {/* Total Purchase */}
        <div
          onClick={() => onNavigate('purchase')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Purchase (कुल खरिद)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono tracking-tight">
            Rs. {metrics.totalPurchase.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{metrics.purchaseCount} purchase bills</span>
            <span className="text-emerald-600 font-bold flex items-center">View List <ChevronRight className="w-3 h-3" /></span>
          </div>
        </div>

        {/* Total Receivable (Customer Outstanding) */}
        <div
          onClick={() => onNavigate('customers')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Receivable (उठ्न बाँकी)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700 font-mono tracking-tight">
            Rs. {metrics.totalReceivable.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>From customers</span>
            <span className="text-blue-600 font-bold flex items-center">Ledger <ChevronRight className="w-3 h-3" /></span>
          </div>
        </div>

        {/* Total Payable (Supplier Outstanding) */}
        <div
          onClick={() => onNavigate('suppliers')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Payable (तिर्न बाँकी)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 font-mono tracking-tight">
            Rs. {metrics.totalPayable.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>To suppliers</span>
            <span className="text-amber-600 font-bold flex items-center">Ledger <ChevronRight className="w-3 h-3" /></span>
          </div>
        </div>
      </div>
    </div>
  );
};
