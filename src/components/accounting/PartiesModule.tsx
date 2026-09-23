import React, { useState } from 'react';
import {
  Users,
  Building2,
  Search,
  Plus,
  Printer,
  FileText,
  Phone,
  MapPin,
  X,
  CreditCard,
  Edit2
} from 'lucide-react';
import { AccountingStorageService } from '../../services/accountingStorage.ts';
import { AccountingParty, PartyType } from '../../types/accounting.ts';

interface PartiesModuleProps {
  initialType?: PartyType;
}

export const PartiesModule: React.FC<PartiesModuleProps> = ({
  initialType = 'customer'
}) => {
  const [activeType, setActiveType] = useState<PartyType>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPartyForLedger, setSelectedPartyForLedger] = useState<AccountingParty | null>(null);

  const parties = AccountingStorageService.getParties(activeType);
  const settings = AccountingStorageService.getSettings();

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [panVat, setPanVat] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number | ''>('');
  const [openingBalanceType, setOpeningBalanceType] = useState<'dr' | 'cr'>(activeType === 'customer' ? 'dr' : 'cr');
  const [creditLimit, setCreditLimit] = useState<number | ''>('');

  const handleSaveParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('कृपया नाम प्रविष्ट गर्नुहोस्।');
      return;
    }

    const openBal = openingBalance === '' ? 0 : Number(openingBalance);
    const newParty: AccountingParty = {
      id: (activeType === 'customer' ? 'cust_' : 'sup_') + Date.now(),
      type: activeType,
      name: name.trim(),
      phone: phone.trim() || 'N/A',
      email: email.trim(),
      address: address.trim(),
      panVatNumber: panVat.trim(),
      openingBalance: openBal,
      openingBalanceType,
      currentBalance: openBal,
      creditLimit: creditLimit === '' ? undefined : Number(creditLimit),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    AccountingStorageService.saveParty(newParty);
    setShowAddModal(false);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setPanVat('');
    setOpeningBalance('');
  };

  const filteredParties = parties.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery) ||
    (p.panVatNumber && p.panVatNumber.includes(searchQuery)) ||
    (p.address && p.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalBalance = filteredParties.reduce((acc, p) => acc + p.currentBalance, 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-serif">
            {activeType === 'customer' ? 'Customer Accounts (ग्राहक खाता तथा बहीखाता)' : 'Supplier Accounts (सप्लायर खाता तथा बहीखाता)'}
          </h2>
          <p className="text-xs text-slate-500">
            {activeType === 'customer'
              ? 'Manage customer contact books, sales credit, receivables & full ledger statements'
              : 'Manage mobile suppliers, distributors, purchase payables & supplier ledger statements'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveType('customer')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeType === 'customer' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Customers (ग्राहकहरू)
            </button>
            <button
              type="button"
              onClick={() => setActiveType('supplier')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeType === 'supplier' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Suppliers (सप्लायरहरू)
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setOpeningBalanceType(activeType === 'customer' ? 'dr' : 'cr');
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add {activeType === 'customer' ? 'Customer' : 'Supplier'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Active {activeType === 'customer' ? 'Customers' : 'Suppliers'}
          </span>
          <p className="text-2xl font-black font-mono text-slate-900">
            {filteredParties.length}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total {activeType === 'customer' ? 'Receivable (उठ्न बाँकी कुल रकम)' : 'Payable (सप्लायरलाई तिर्न बाँकी कुल रकम)'}
          </span>
          <p className={`text-2xl font-black font-mono ${activeType === 'customer' ? 'text-blue-700' : 'text-amber-700'}`}>
            Rs. {totalBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Parties Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeType} name, phone, PAN...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Showing: <b>{filteredParties.length}</b> records
          </span>
        </div>

        {filteredParties.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            {activeType === 'customer' ? (
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            ) : (
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            )}
            <p className="text-sm font-bold text-slate-700">कुनै खाता भेटिएन (No Parties Found)</p>
            <p className="text-xs text-slate-400 mt-1">नयाँ खाता थप्न माथिको बटन प्रयोग गर्नुहोस्।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Phone / Mobile</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">PAN / VAT</th>
                  <th className="py-3 px-4 text-right">Current Balance</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParties.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-950 block">{p.name}</span>
                      {p.creditLimit && (
                        <span className="text-[10px] text-slate-400 font-mono">Limit: Rs.{p.creditLimit.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{p.phone}</td>
                    <td className="py-3 px-4 text-slate-500">{p.address || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.panVatNumber || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      {p.currentBalance > 0 ? (
                        <span className={`font-mono font-black ${activeType === 'customer' ? 'text-rose-600' : 'text-amber-600'}`}>
                          Rs. {p.currentBalance.toLocaleString()} {activeType === 'customer' ? '(Due Dr)' : '(Due Cr)'}
                        </span>
                      ) : (
                        <span className="font-mono text-emerald-700 font-bold">Rs. 0 (Nil)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedPartyForLedger(p)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Ledger</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ADD PARTY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Add New {activeType === 'customer' ? 'Customer' : 'Supplier'}</span>
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParty} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Name (नाम) *</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name / Store Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone / Mobile</label>
                  <input
                    type="tel"
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PAN / VAT No.</label>
                  <input
                    type="text"
                    placeholder="Optional 9-digit"
                    value={panVat}
                    onChange={(e) => setPanVat(e.target.value)}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Address (ठेगाना)</label>
                <input
                  type="text"
                  placeholder="e.g. Butwal, Traffic Chowk"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Opening Balance (सुरुको बाँकी)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Rs. 0"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Balance Type</label>
                  <select
                    value={openingBalanceType}
                    onChange={(e) => setOpeningBalanceType(e.target.value as any)}
                    className="w-full p-2 border rounded-lg font-bold"
                  >
                    <option value="dr">Debit (Dr - बाँकी लिनु पर्ने)</option>
                    <option value="cr">Credit (Cr - बाँकी दिनु पर्ने)</option>
                  </select>
                </div>
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

      {/* PARTY LEDGER STATEMENT MODAL */}
      {selectedPartyForLedger && (
        <PartyLedgerModal
          party={selectedPartyForLedger}
          settings={settings}
          onClose={() => setSelectedPartyForLedger(null)}
        />
      )}

    </div>
  );
};

// Sub-component for Party Ledger Statement
const PartyLedgerModal: React.FC<{
  party: AccountingParty;
  settings: any;
  onClose: () => void;
}> = ({ party, settings, onClose }) => {
  const ledgerEntries = AccountingStorageService.getPartyLedger(party.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Statement of Account (खाता बहीखाता)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Party: <b className="text-white">{party.name}</b> • Phone: {party.phone}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Ledger</span>
            </button>
            <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statement Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          
          {/* Company Header for Print */}
          <div className="border-b pb-4 mb-4 text-center">
            <h2 className="text-base font-black uppercase text-slate-900">{settings.companyName}</h2>
            <p className="text-slate-500 text-[11px]">{settings.address} • Ph: {settings.phone}</p>
            <div className="mt-2 inline-block bg-slate-100 px-3 py-1 rounded font-bold text-slate-800">
              PARTY LEDGER: {party.name.toUpperCase()}
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 mt-2">
              <span>Phone: <b>{party.phone}</b></span>
              <span>Current Balance: <b className="text-indigo-700 font-mono text-sm">Rs. {party.currentBalance.toLocaleString()}</b></span>
            </div>
          </div>

          {/* Ledger Table */}
          {ledgerEntries.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              यस खातामा कुनै कारोबार फेला परेन (No transactions in this ledger).
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Voucher Type</th>
                    <th className="py-2.5 px-3">Ref #</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Debit (Dr)</th>
                    <th className="py-2.5 px-3 text-right">Credit (Cr)</th>
                    <th className="py-2.5 px-3 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {ledgerEntries.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-600">{row.date}</td>
                      <td className="py-2 px-3 font-sans font-semibold text-slate-800">{row.refType || row.voucherType}</td>
                      <td className="py-2 px-3 text-indigo-700 font-bold">{row.refNumber || row.referenceNumber}</td>
                      <td className="py-2 px-3 font-sans text-slate-600 max-w-xs truncate">{row.description}</td>
                      <td className="py-2 px-3 text-right text-slate-900 font-semibold">
                        {row.debit > 0 ? `Rs.${row.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-700 font-semibold">
                        {row.credit > 0 ? `Rs.${row.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-slate-950 font-sans">
                        Rs. {row.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex justify-between text-[11px] text-slate-500 pt-4 border-t">
            <span>Statement generated on: {new Date().toLocaleString()}</span>
            <span className="font-bold">Authorized Signature</span>
          </div>

        </div>

      </div>
    </div>
  );
};
