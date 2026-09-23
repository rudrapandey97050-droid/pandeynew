import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  ShoppingCart,
  Users,
  Building2,
  Wallet,
  Landmark,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  Plus,
  Printer,
  ChevronRight,
  BookOpen,
  Mail
} from 'lucide-react';
import { AccountingStorageService } from '../../services/accountingStorage.ts';
import { SalesInvoice, PurchaseInvoice, PaymentReceipt, PaymentVoucher, ExpenseRecord } from '../../types/accounting.ts';

interface AccountingDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenNewSales: () => void;
  onOpenNewPurchase: () => void;
  onOpenNewReceipt: () => void;
  onOpenNewPayment: () => void;
  onOpenNewExpense: () => void;
  onOpenNewProduct?: () => void;
  onOpenGmailReport?: () => void;
  onViewInvoice: (invoice: SalesInvoice) => void;
}

export const AccountingDashboard: React.FC<AccountingDashboardProps> = ({
  onNavigate,
  onOpenNewSales,
  onOpenNewPurchase,
  onOpenNewReceipt,
  onOpenNewPayment,
  onOpenNewExpense,
  onOpenNewProduct,
  onOpenGmailReport,
  onViewInvoice
}) => {
  const metrics = AccountingStorageService.getFinancialMetrics();
  const salesInvoices = AccountingStorageService.getSalesInvoices();
  const purchases = AccountingStorageService.getPurchases();
  const receipts = AccountingStorageService.getReceipts();
  const payments = AccountingStorageService.getPayments();
  const expenses = AccountingStorageService.getExpenses();

  // Unified recent transactions list
  const recentTransactions: Array<{
    id: string;
    type: 'Sales' | 'Purchase' | 'Receipt' | 'Payment' | 'Expense';
    refNumber: string;
    party: string;
    date: string;
    amount: number;
    paymentMode: string;
    status?: string;
    rawItem?: any;
  }> = [];

  salesInvoices.slice(0, 5).forEach(s => {
    recentTransactions.push({
      id: s.id,
      type: 'Sales',
      refNumber: s.invoiceNumber,
      party: s.customerName,
      date: s.invoiceDate,
      amount: s.grandTotal,
      paymentMode: s.paymentMethod,
      status: s.status,
      rawItem: s
    });
  });

  purchases.slice(0, 4).forEach(p => {
    recentTransactions.push({
      id: p.id,
      type: 'Purchase',
      refNumber: p.invoiceNumber,
      party: p.supplierName,
      date: p.invoiceDate,
      amount: p.grandTotal,
      paymentMode: p.paymentMethod,
      status: p.status
    });
  });

  receipts.slice(0, 3).forEach(r => {
    recentTransactions.push({
      id: r.id,
      type: 'Receipt',
      refNumber: r.receiptNumber,
      party: r.partyName,
      date: r.date,
      amount: r.amount,
      paymentMode: r.paymentMethod
    });
  });

  payments.slice(0, 3).forEach(pay => {
    recentTransactions.push({
      id: pay.id,
      type: 'Payment',
      refNumber: pay.voucherNumber,
      party: pay.partyName,
      date: pay.date,
      amount: pay.amount,
      paymentMode: pay.paymentMethod
    });
  });

  expenses.slice(0, 3).forEach(e => {
    recentTransactions.push({
      id: e.id,
      type: 'Expense',
      refNumber: e.expenseNumber,
      party: e.category,
      date: e.date,
      amount: e.amount,
      paymentMode: e.paymentMethod
    });
  });

  // Sort by date descending
  recentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

      {/* Row 2: Balances & Today's Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Cash in Hand & Bank Balances */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Cash & Bank Balances (नगद र बैंक मौज्दात)</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('accounts')}
              className="text-[11px] text-indigo-600 hover:underline font-bold"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200/80">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Cash in Hand</span>
                  <span className="text-xs font-bold text-slate-800">काउन्टर नगद</span>
                </div>
              </div>
              <span className="text-base font-black font-mono text-slate-900">
                Rs. {metrics.cashBalance.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200/80">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Bank & Wallet</span>
                  <span className="text-xs font-bold text-slate-800">बैंक तथा इसेवा खाता</span>
                </div>
              </div>
              <span className="text-base font-black font-mono text-slate-900">
                Rs. {metrics.bankBalance.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Total Liquid Funds:</span>
            <span className="font-mono font-black text-slate-950 text-sm">
              Rs. {(metrics.cashBalance + metrics.bankBalance).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Today's Overview */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Today's Activity (आजको कारोबार)</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold">
              {new Date().toISOString().slice(0, 10)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-700 uppercase block">Today's Sales</span>
              <span className="text-sm font-black font-mono text-indigo-950">Rs. {metrics.todaySales.toLocaleString()}</span>
            </div>

            <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Today's Purchase</span>
              <span className="text-sm font-black font-mono text-emerald-950">Rs. {metrics.todayPurchase.toLocaleString()}</span>
            </div>

            <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-100">
              <span className="text-[10px] font-bold text-rose-700 uppercase block">Today's Expenses</span>
              <span className="text-sm font-black font-mono text-rose-950">Rs. {metrics.todayExpenses.toLocaleString()}</span>
            </div>

            <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100">
              <span className="text-[10px] font-bold text-amber-700 uppercase block">Est. Today Profit</span>
              <span className={`text-sm font-black font-mono ${metrics.todayProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                Rs. {metrics.todayProfit.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Gross margin today</span>
            <span className="font-bold text-slate-800">
              {metrics.todaySales > 0 ? Math.round((metrics.todayProfit / metrics.todaySales) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Monthly & Net Profit/Loss */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Monthly & Net Profit (नाफा / नोक्सान)</span>
            </h3>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              This Month
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Monthly Sales (बिक्री):</span>
              <span className="font-mono font-bold text-slate-900">Rs. {metrics.monthlySales.toLocaleString()}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Monthly Purchase (खरिद):</span>
              <span className="font-mono font-bold text-slate-900">Rs. {metrics.monthlyPurchase.toLocaleString()}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Monthly Expenses (खर्च):</span>
              <span className="font-mono font-bold text-rose-600">Rs. {metrics.monthlyExpenses.toLocaleString()}</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between mt-2 ${
              metrics.netProfitOrLoss >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            }`}>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">
                  Net Profit / Loss (खुद नाफा)
                </span>
                <span className="text-[10px] text-slate-500">Sales - Cost - Expenses</span>
              </div>
              <div className="text-right">
                <span className={`text-lg font-black font-mono ${metrics.netProfitOrLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  Rs. {metrics.netProfitOrLoss.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Recent Accounting Transactions (पछिल्ला कारोबारहरू)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Showing latest {recentTransactions.length} entries
          </span>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">कुनै लेखा कारोबार फेला परेन (No Transactions Yet)</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              माथिको बटनबाट पहिलो बिक्री बिल, खरिद बिल वा खर्च इन्ट्री गर्नुहोस्। वास्तविक हिसाब-किताब सुरु हुन्छ।
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={onOpenNewSales}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                + Create First Sales Invoice
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Voucher / Ref #</th>
                  <th className="py-2.5 px-4">Party / Details</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4 text-right">Amount (Rs.)</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => (
                  <tr key={`${tx.type}_${tx.id}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500 font-mono">{tx.date}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        tx.type === 'Sales' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        tx.type === 'Purchase' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        tx.type === 'Receipt' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        tx.type === 'Payment' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{tx.refNumber}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{tx.party}</td>
                    <td className="py-2.5 px-4 text-slate-600">{tx.paymentMode}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-950">
                      Rs. {tx.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {tx.type === 'Sales' && tx.rawItem && (
                        <button
                          type="button"
                          onClick={() => onViewInvoice(tx.rawItem)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3 text-slate-500" />
                          <span>View/Print</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
