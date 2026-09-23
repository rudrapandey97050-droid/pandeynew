import React, { useState, useMemo } from 'react';
import { Plus, Search, DollarSign, Calendar, Trash2, X, Tag, PieChart } from 'lucide-react';
import { AccountingStorageService } from '../../services/accountingStorage.ts';
import { ExpenseRecord, ExpenseCategory } from '../../types/accounting.ts';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Shop Rent',
  'Staff Salary',
  'Electricity & Water',
  'Internet & Telecom',
  'Shop Maintenance',
  'Tea & Refreshments',
  'Advertising & Marketing',
  'Packaging & Bags',
  'Transportation & Courier',
  'Repair Tools & Equipment',
  'Legal & Accounting Fees',
  'Other Expenses'
];

interface ExpensesModuleProps {
  initialCreateOpen?: boolean;
}

export const ExpensesModule: React.FC<ExpensesModuleProps> = ({
  initialCreateOpen = false
}) => {
  const [showModal, setShowModal] = useState(initialCreateOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const expenses = AccountingStorageService.getExpenses();
  const accounts = AccountingStorageService.getAccounts();
  const settings = AccountingStorageService.getSettings();

  // Form state
  const [category, setCategory] = useState<ExpenseCategory>('Tea & Refreshments');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentAccountId, setPaymentAccountId] = useState(accounts[0]?.id || 'acc_cash');
  const [payee, setPayee] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('कृपया खर्च रकम प्रविष्ट गर्नुहोस्।');
      return;
    }

    const expNum = `${settings.expensePrefix || 'EXP-'}${settings.nextExpenseNumber || 5001}`;

    const newExp: ExpenseRecord = {
      id: 'exp_' + Date.now(),
      expenseNumber: expNum,
      category,
      amount: Number(amount),
      date,
      paymentMethod,
      paymentAccountId,
      payee: payee.trim(),
      referenceNumber: referenceNumber.trim(),
      remarks: remarks.trim(),
      createdBy: 'Admin',
      createdAt: new Date().toISOString()
    };

    AccountingStorageService.saveExpense(newExp);
    setShowModal(false);
    setAmount('');
    setPayee('');
    setRemarks('');
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchSearch =
        e.expenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.payee && e.payee.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.remarks && e.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
      const matchDate = !dateFilter || e.date === dateFilter;

      return matchSearch && matchCat && matchDate;
    });
  }, [expenses, searchQuery, categoryFilter, dateFilter]);

  // Total expenses
  const totalExpenseAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Category breakdown
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-serif">
            Expenses & Petty Cash (दैनिक पसल खर्च तथा तलब)
          </h2>
          <p className="text-xs text-slate-500">
            Track shop rent, staff wages, electricity, courier, tea & snacks, and operating expenses
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-rose-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Expense (खर्च इन्ट्री)</span>
        </button>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Filtered Expenses (कुल खर्च)
          </span>
          <p className="text-2xl font-black font-mono text-rose-700">
            Rs. {totalExpenseAmount.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {filteredExpenses.length} expense entries recorded
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Top Expense Categories (मुख्य खर्चहरू)
          </span>
          <div className="flex flex-wrap gap-2">
            {categoryTotals.slice(0, 4).map(([cat, amt]) => (
              <div key={cat} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2">
                <span className="font-semibold text-slate-800">{cat}:</span>
                <span className="font-mono font-bold text-rose-700">Rs. {amt.toLocaleString()}</span>
              </div>
            ))}
            {categoryTotals.length === 0 && (
              <span className="text-xs text-slate-400">No expenses categorized yet.</span>
            )}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search expense #, category, payee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Showing: <b>{filteredExpenses.length}</b> entries
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">कुनै खर्च भेटिएन (No Expenses Found)</p>
            <p className="text-xs text-slate-400 mt-1">पसलको दैनिक खर्च रेकर्ड गर्न "+ Add New Expense" थिच्नुहोस्।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Expense #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payee (कसलाई दियो)</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{e.expenseNumber}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{e.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{e.payee || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{e.paymentMethod}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{e.remarks || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-700">
                      Rs. {e.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* CREATE EXPENSE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-rose-600" />
                <span>Record New Expense (खर्च इन्ट्री)</span>
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Expense Category (खर्चको प्रकार) *</label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2 border rounded-lg font-bold"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 border rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (खर्च रकम) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Rs. 0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-mono font-bold text-rose-700 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 border rounded-lg font-semibold"
                  >
                    <option value="Cash">Cash (नगद)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="eSewa">eSewa</option>
                    <option value="Khalti">Khalti</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Paid From Account</label>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                    className="w-full p-2 border rounded-lg font-semibold"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} (Bal: Rs.{acc.currentBalance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payee (कसलाई भुक्तानी गरियो)</label>
                <input
                  type="text"
                  placeholder="e.g. Landlord / Staff Name / NEA / Shop"
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Remarks / Note (विवरण)</label>
                <input
                  type="text"
                  placeholder="e.g. Shop monthly rent for Bhadra"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
