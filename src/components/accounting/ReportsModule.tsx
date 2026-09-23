import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Package,
  FileText,
  Mail
} from 'lucide-react';
import { AccountingStorageService } from '../../services/accountingStorage.ts';

type ReportType =
  | 'pl'
  | 'sales'
  | 'purchase'
  | 'receivables'
  | 'payables'
  | 'expenses'
  | 'receipts'
  | 'payments'
  | 'cashbook'
  | 'daily'
  | 'monthly'
  | 'product_profit';

interface ReportsModuleProps {
  onOpenGmailReport?: () => void;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ onOpenGmailReport }) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('pl');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const metrics = AccountingStorageService.getFinancialMetrics();
  const sales = AccountingStorageService.getSalesInvoices();
  const purchases = AccountingStorageService.getPurchases();
  const receipts = AccountingStorageService.getReceipts();
  const payments = AccountingStorageService.getPayments();
  const expenses = AccountingStorageService.getExpenses();
  const customers = AccountingStorageService.getParties('customer');
  const suppliers = AccountingStorageService.getParties('supplier');
  const settings = AccountingStorageService.getSettings();
  const products = AccountingStorageService.getInventoryItems();

  const handlePrint = () => {
    window.print();
  };

  const exportCSV = (filename: string, rows: string[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-base font-black text-slate-900 font-serif">
            Financial & Accounting Reports (लेखा तथा वित्तीय प्रतिवेदनहरू)
          </h2>
          <p className="text-xs text-slate-500">
            Official Profit & Loss, Tax/VAT registers, Daybook, Outstanding Dues & Profit breakdown
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenGmailReport && (
            <button
              type="button"
              onClick={onOpenGmailReport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              title="Send Daily Stock & Valuation Report to Gmail"
            >
              <Mail className="w-4 h-4" />
              <span>Send Stock Report to Gmail</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1.5 text-xs font-bold print:hidden">
        {[
          { id: 'pl', label: 'Profit & Loss Statement (नाफा / नोक्सान)' },
          { id: 'sales', label: 'Sales Register (बिक्री रिपोर्ट)' },
          { id: 'purchase', label: 'Purchase Register (खरिद रिपोर्ट)' },
          { id: 'receivables', label: 'Customer Dues (उठ्न बाँकी)' },
          { id: 'payables', label: 'Supplier Dues (तिर्न बाँकी)' },
          { id: 'expenses', label: 'Expense Analysis (खर्च रिपोर्ट)' },
          { id: 'cashbook', label: 'Cash & Bank Book' },
          { id: 'daily', label: 'Day Book (दैनिक कारोबार)' },
          { id: 'product_profit', label: 'Product Margin Analysis' }
        ].map(r => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSelectedReport(r.id as any)}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              selectedReport === r.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Report Display Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6">
        
        {/* Report Company Heading */}
        <div className="border-b-2 border-slate-900 pb-4 text-center">
          <h1 className="text-xl font-black uppercase text-slate-950 font-serif tracking-tight">
            {settings.companyName}
          </h1>
          <p className="text-xs text-slate-600">{settings.address} • Phone: {settings.phone}</p>
          {settings.panNumber && (
            <p className="text-xs font-mono font-bold text-slate-700">PAN / VAT: {settings.panNumber}</p>
          )}
          <div className="mt-2 inline-block px-4 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-md">
            {selectedReport === 'pl' && 'PROFIT AND LOSS STATEMENT (नाफा / नोक्सान हिसाब)'}
            {selectedReport === 'sales' && 'SALES INVOICE REGISTER & VAT SUMMARY'}
            {selectedReport === 'purchase' && 'PURCHASE INWARD REGISTER'}
            {selectedReport === 'receivables' && 'CUSTOMER RECEIVABLE AGING & OUTSTANDING LIST'}
            {selectedReport === 'payables' && 'SUPPLIER PAYABLE OUTSTANDING LIST'}
            {selectedReport === 'expenses' && 'OPERATING EXPENSES BREAKDOWN REPORT'}
            {selectedReport === 'cashbook' && 'CASH BOOK & BANK BALANCES'}
            {selectedReport === 'daily' && 'DAILY AUDIT DAY BOOK'}
            {selectedReport === 'product_profit' && 'PRODUCT-WISE PROFIT & MARGIN REPORT'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Generated: {new Date().toLocaleString()}</p>
        </div>

        {/* 1. PROFIT & LOSS STATEMENT */}
        {selectedReport === 'pl' && (
          <div className="space-y-6 max-w-3xl mx-auto text-xs">
            
            {/* Trading Section */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 p-3 font-bold text-slate-900 border-b flex justify-between">
                <span>A. TRADING ACCOUNT (व्यापार हिसाब)</span>
                <span>Amount (Rs.)</span>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-800">Total Revenue from Sales (कुल बिक्री आम्दानी):</span>
                  <span className="font-mono font-black text-slate-950">Rs. {metrics.totalSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700">
                  <span>Less: Cost of Goods Sold (खरिद लागत मूल्य):</span>
                  <span className="font-mono font-semibold">- Rs. {metrics.totalPurchase.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 bg-slate-50 px-2 rounded font-bold text-sm">
                  <span>GROSS TRADING PROFIT (कुल व्यापार नाफा):</span>
                  <span className={`font-mono ${metrics.totalSales - metrics.totalPurchase >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    Rs. {(metrics.totalSales - metrics.totalPurchase).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Operating Expenses Section */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 p-3 font-bold text-slate-900 border-b flex justify-between">
                <span>B. OPERATING EXPENSES (सञ्चालन खर्चहरू)</span>
                <span>Amount (Rs.)</span>
              </div>
              <div className="p-4 space-y-1.5">
                {expenses.map(e => (
                  <div key={e.id} className="flex justify-between py-1 border-b border-slate-50 text-slate-600">
                    <span>{e.category} {e.payee ? `(${e.payee})` : ''}</span>
                    <span className="font-mono font-medium">Rs. {e.amount.toLocaleString()}</span>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <p className="text-slate-400 py-2">कुनै सञ्चालन खर्च छैन (No operating expenses).</p>
                )}
                <div className="flex justify-between py-2 bg-rose-50 px-2 rounded font-bold text-rose-800">
                  <span>Total Operating Expenses (कुल सञ्चालन खर्च):</span>
                  <span className="font-mono">Rs. {metrics.totalExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Net Profit / Loss Result */}
            <div className={`p-5 rounded-2xl border-2 flex items-center justify-between ${
              metrics.netProfitOrLoss >= 0 ? 'bg-emerald-50 border-emerald-500' : 'bg-rose-50 border-rose-500'
            }`}>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  NET PROFIT / LOSS FOR PERIOD (खुद नाफा / घाटा)
                </h3>
                <p className="text-slate-600 text-xs">
                  Gross Margin - Shop Expenses = True Business Bottom Line
                </p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-black font-mono ${
                  metrics.netProfitOrLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  Rs. {metrics.netProfitOrLoss.toLocaleString()}
                </span>
              </div>
            </div>

          </div>
        )}

        {/* 2. SALES REGISTER */}
        {selectedReport === 'sales' && (
          <div className="space-y-4 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Payment Mode</th>
                    <th className="py-2.5 px-3 text-right">Taxable</th>
                    <th className="py-2.5 px-3 text-right">VAT Amount</th>
                    <th className="py-2.5 px-3 text-right">Grand Total</th>
                    <th className="py-2.5 px-3 text-right">Due (बाँकी)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono">{s.invoiceDate}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{s.invoiceNumber}</td>
                      <td className="py-2 px-3 font-semibold">{s.customerName}</td>
                      <td className="py-2 px-3">{s.paymentMethod}</td>
                      <td className="py-2 px-3 text-right font-mono">Rs. {s.taxableAmount.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono">Rs. {s.taxTotal.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono font-black text-slate-950">Rs. {s.grandTotal.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                        {s.dueAmount > 0 ? `Rs. ${s.dueAmount.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. PURCHASE REGISTER */}
        {selectedReport === 'purchase' && (
          <div className="space-y-4 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Purchase #</th>
                    <th className="py-2.5 px-3">Supplier Bill #</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Total (Rs.)</th>
                    <th className="py-2.5 px-3 text-right">Paid</th>
                    <th className="py-2.5 px-3 text-right">Due Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchases.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono">{p.invoiceDate}</td>
                      <td className="py-2 px-3 font-mono font-bold">{p.invoiceNumber}</td>
                      <td className="py-2 px-3 font-mono">{p.billNumber || '-'}</td>
                      <td className="py-2 px-3 font-semibold">{p.supplierName}</td>
                      <td className="py-2 px-3">{p.paymentMethod}</td>
                      <td className="py-2 px-3 text-right font-mono font-black">Rs. {p.grandTotal.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold">Rs. {p.paidAmount.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                        {p.dueAmount > 0 ? `Rs. ${p.dueAmount.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. RECEIVABLES OUTSTANDING */}
        {selectedReport === 'receivables' && (
          <div className="space-y-4 text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Address</th>
                  <th className="py-2.5 px-3 text-right">Outstanding Due (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.filter(c => c.currentBalance > 0).map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{c.name}</td>
                    <td className="py-2.5 px-3 font-mono">{c.phone}</td>
                    <td className="py-2.5 px-3 text-slate-500">{c.address || '-'}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-blue-700">
                      Rs. {c.currentBalance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. PAYABLES OUTSTANDING */}
        {selectedReport === 'payables' && (
          <div className="space-y-4 text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                  <th className="py-2.5 px-3">Supplier Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3 text-right">Payable Balance (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.filter(s => s.currentBalance > 0).map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{s.name}</td>
                    <td className="py-2.5 px-3 font-mono">{s.phone}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-amber-700">
                      Rs. {s.currentBalance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. EXPENSES BREAKDOWN */}
        {selectedReport === 'expenses' && (
          <div className="space-y-4 text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Payee</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  <th className="py-2.5 px-3 text-right">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono">{e.date}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{e.category}</td>
                    <td className="py-2 px-3">{e.payee || '-'}</td>
                    <td className="py-2 px-3 text-slate-500">{e.remarks || '-'}</td>
                    <td className="py-2 px-3 text-right font-mono font-black text-rose-700">
                      Rs. {e.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. CASH BOOK */}
        {selectedReport === 'cashbook' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border flex justify-between">
              <div>
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Current Cash in Counter:</span>
                <span className="text-xl font-mono font-black text-emerald-800">Rs. {metrics.cashBalance.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block uppercase text-[10px]">Bank / Wallet Balance:</span>
                <span className="text-xl font-mono font-black text-indigo-800">Rs. {metrics.bankBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* 8. DAY BOOK */}
        {selectedReport === 'daily' && (
          <div className="space-y-4 text-xs">
            <p className="font-bold text-slate-700">Today's Transactions ({new Date().toISOString().slice(0, 10)})</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-indigo-50 border rounded-xl">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Today Sales</span>
                <span className="font-mono font-black text-indigo-900 text-lg">Rs. {metrics.todaySales.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-emerald-50 border rounded-xl">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Today Purchase</span>
                <span className="font-mono font-black text-emerald-900 text-lg">Rs. {metrics.todayPurchase.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-rose-50 border rounded-xl">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Today Expense</span>
                <span className="font-mono font-black text-rose-900 text-lg">Rs. {metrics.todayExpenses.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* 9. PRODUCT MARGIN ANALYSIS */}
        {selectedReport === 'product_profit' && (
          <div className="space-y-4 text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Brand</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                  <th className="py-2.5 px-3 text-right">Est. Cost</th>
                  <th className="py-2.5 px-3 text-right">Profit per Unit</th>
                  <th className="py-2.5 px-3 text-center">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => {
                  const sell = p.discountPrice || p.price;
                  const cost = Math.round(sell * 0.85);
                  const margin = sell - cost;
                  const pct = Math.round((margin / sell) * 100);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{p.name}</td>
                      <td className="py-2 px-3 text-slate-600">{p.brand}</td>
                      <td className="py-2 px-3 text-right font-mono">Rs. {sell.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">Rs. {cost.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">Rs. {margin.toLocaleString()}</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-800">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
