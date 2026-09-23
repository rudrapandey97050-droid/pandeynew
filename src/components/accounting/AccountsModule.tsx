import React, { useState } from 'react';
import {
  Wallet,
  Landmark,
  Plus,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  X,
  CreditCard
} from 'lucide-react';
import { AccountingStorageService } from '../../services/accountingStorage.ts';
import { BankAccount } from '../../types/accounting.ts';

export const AccountsModule: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const accounts = AccountingStorageService.getAccounts();

  // New Account state
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'cash' | 'bank' | 'wallet'>('bank');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number | ''>('');

  // Transfer state
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number | ''>('');
  const [transferRemarks, setTransferRemarks] = useState('');

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      alert('कृपया खाताको नाम लेख्नुहोस्।');
      return;
    }

    const initial = openingBalance === '' ? 0 : Number(openingBalance);
    const newAcc: BankAccount = {
      id: 'acc_' + Date.now(),
      accountName: accountName.trim(),
      accountType,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      openingBalance: initial,
      currentBalance: initial,
      isDefault: false
    };

    AccountingStorageService.saveAccount(newAcc);
    setShowAddModal(false);
    setAccountName('');
    setBankName('');
    setAccountNumber('');
    setOpeningBalance('');
  };

  const handleTransferFunds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId) {
      alert('कृपया पठाउने र पाउने खाता छान्नुहोस्।');
      return;
    }
    if (fromAccountId === toAccountId) {
      alert('एउटै खातामा रकम सार्न मिल्दैन।');
      return;
    }
    if (!transferAmount || Number(transferAmount) <= 0) {
      alert('कृपया रकम प्रविष्ट गर्नुहोस्।');
      return;
    }

    const amt = Number(transferAmount);
    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);

    if (fromAcc && toAcc) {
      fromAcc.currentBalance -= amt;
      toAcc.currentBalance += amt;
      AccountingStorageService.saveAccount(fromAcc);
      AccountingStorageService.saveAccount(toAcc);
      alert(`Rs. ${amt.toLocaleString()} सफलतापूर्वक ${fromAcc.accountName} बाट ${toAcc.accountName} मा स्थानान्तरण भयो।`);
    }

    setShowTransferModal(false);
    setTransferAmount('');
    setTransferRemarks('');
  };

  const totalLiquidCash = accounts.reduce((acc, a) => acc + a.currentBalance, 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-serif">
            Cash, Bank & Digital Wallets (नगद, बैंक तथा इसेवा खाताहरू)
          </h2>
          <p className="text-xs text-slate-500">
            Monitor real-time cash drawer balance, bank accounts, QR payment deposits & inter-account transfers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTransferModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 text-slate-600" />
            <span>Fund Transfer (रकम स्थानान्तरण)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Bank / Wallet (नयाँ खाता)</span>
          </button>
        </div>
      </div>

      {/* Total Liquid Summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Combined Funds (कुल तरल मौज्दात)
          </span>
          <p className="text-3xl font-black font-mono text-slate-950 mt-1">
            Rs. {totalLiquidCash.toLocaleString()}
          </p>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
          <Wallet className="w-6 h-6" />
        </div>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <div
            key={acc.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl ${
                  acc.accountType === 'cash' ? 'bg-emerald-50 text-emerald-700' :
                  acc.accountType === 'wallet' ? 'bg-purple-50 text-purple-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {acc.accountType === 'cash' ? <Wallet className="w-5 h-5" /> :
                   acc.accountType === 'wallet' ? <CreditCard className="w-5 h-5" /> :
                   <Landmark className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{acc.accountName}</h3>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    {acc.accountType} {acc.isDefault ? '• Default' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              {acc.bankName && <p className="text-xs text-slate-600">Bank: <span className="font-semibold">{acc.bankName}</span></p>}
              {acc.accountNumber && (
                <p className="text-xs text-slate-600 font-mono">A/C: <span className="font-semibold">{acc.accountNumber}</span></p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Current Balance:</span>
              <span className="text-lg font-black font-mono text-slate-950">
                Rs. {acc.currentBalance.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ADD ACCOUNT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-indigo-600" />
                <span>Add Bank / Cash / Wallet Account</span>
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Type *</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full p-2 border rounded-lg font-bold"
                >
                  <option value="bank">Bank Account</option>
                  <option value="wallet">Digital Wallet (eSewa / Khalti / Fonepay)</option>
                  <option value="cash">Cash in Hand</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Display Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nabil Bank Current A/C"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full p-2 border rounded-lg font-bold"
                />
              </div>

              {accountType === 'bank' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Nabil Bank Ltd., Traffic Chowk Branch"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Account / Mobile Number</label>
                <input
                  type="text"
                  placeholder="A/C number or wallet ID"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Opening Balance (सुरुको मौज्दात)</label>
                <input
                  type="number"
                  placeholder="Rs. 0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 border rounded-lg font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-slate-800" />
                <span>Inter-Account Fund Transfer (खाता स्थानान्तरण)</span>
              </h3>
              <button type="button" onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferFunds} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">From Account (पठाउने खाता) *</label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full p-2 border rounded-lg font-bold"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} (Bal: Rs.{a.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">To Account (पाउने खाता) *</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full p-2 border rounded-lg font-bold"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} (Bal: Rs.{a.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transfer Amount (रकम) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Rs. 0"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 border rounded-lg font-mono font-black text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Remarks (कैफियत)</label>
                <input
                  type="text"
                  placeholder="e.g. Cash deposited into bank / eSewa settlement"
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 border rounded-lg font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold">
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
