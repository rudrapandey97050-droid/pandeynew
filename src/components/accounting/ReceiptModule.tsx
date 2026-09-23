import React, { useState } from 'react';
import { Plus, Search, ArrowDownLeft, Printer, Trash2, X, User, DollarSign, FileText } from 'lucide-react';
import { AccountingStorageService } from '../../services/accountingStorage.ts';
import { PaymentReceipt } from '../../types/accounting.ts';

interface ReceiptModuleProps {
  initialCreateOpen?: boolean;
}

export const ReceiptModule: React.FC<ReceiptModuleProps> = ({
  initialCreateOpen = false
}) => {
  const [showModal, setShowModal] = useState(initialCreateOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<PaymentReceipt | null>(null);

  const receipts = AccountingStorageService.getReceipts();
  const customers = AccountingStorageService.getParties('customer');
  const accounts = AccountingStorageService.getAccounts();
  const settings = AccountingStorageService.getSettings();

  // Form state
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentAccountId, setPaymentAccountId] = useState(accounts[0]?.id || 'acc_cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const handleCustomerChange = (id: string) => {
    setPartyId(id);
    const c = customers.find(cust => cust.id === id);
    if (c) {
      setPartyName(c.name);
      if (c.currentBalance > 0) {
        setAmount(c.currentBalance);
      }
    }
  };

  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim()) {
      alert('कृपया ग्राहकको नाम छान्नुहोस्।');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert('कृपया रकम प्रविष्ट गर्नुहोस्।');
      return;
    }

    const receiptNum = `${settings.receiptPrefix || 'REC-'}${settings.nextReceiptNumber || 3001}`;

    const newReceipt: PaymentReceipt = {
      id: 'rec_' + Date.now(),
      receiptNumber: receiptNum,
      date,
      partyId: partyId || 'guest_customer',
      partyName: partyName.trim(),
      partyType: 'customer',
      amount: Number(amount),
      paymentMethod,
      paymentAccountId,
      referenceNumber: referenceNumber.trim(),
      remarks: remarks.trim(),
      createdBy: 'Admin',
      createdAt: new Date().toISOString()
    };

    AccountingStorageService.saveReceipt(newReceipt);
    setShowModal(false);
    setSelectedReceiptForPrint(newReceipt);
  };

  const filteredReceipts = receipts.filter(r =>
    r.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.referenceNumber && r.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-serif">
            Payment Receipts (रसिद / ग्राहक भुक्तानी दाखिला)
          </h2>
          <p className="text-xs text-slate-500">
            Record customer dues settlement, cash/bank receipt vouchers & print official receipts
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Receipt (रसिद काट्नुहोस्)</span>
        </button>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search receipt #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Total Receipts: <b>{filteredReceipts.length}</b>
          </span>
        </div>

        {filteredReceipts.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <ArrowDownLeft className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">कुनै रसिद रेकर्ड फेला परेन (No Receipts Found)</p>
            <p className="text-xs text-slate-400 mt-1">ग्राहकबाट रकम प्राप्त हुँदा रसिद इन्ट्री गर्नुहोस्।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Ref / Transaction ID</th>
                  <th className="py-3 px-4 text-right">Amount (Rs.)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.receiptNumber}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{r.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.partyName}</td>
                    <td className="py-3 px-4 text-slate-600">{r.paymentMethod}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{r.referenceNumber || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                      Rs. {r.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptForPrint(r)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE RECEIPT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-blue-600" />
                <span>New Payment Receipt (रसिद इन्ट्री)</span>
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReceipt} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer (ग्राहक) *</label>
                <select
                  value={partyId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full p-2 border rounded-lg font-semibold"
                >
                  <option value="">-- Choose Existing Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) {c.currentBalance > 0 ? `- Outstanding: Rs.${c.currentBalance}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Customer Name"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full p-2 border rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Receipt Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 border rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (रकम) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Rs. 0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-mono font-bold text-emerald-700 text-sm"
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
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deposit To</label>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                    className="w-full p-2 border rounded-lg font-semibold"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ref / Cheque / Txn Number</label>
                <input
                  type="text"
                  placeholder="Optional transaction reference"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Remarks (कैफियत)</label>
                <input
                  type="text"
                  placeholder="e.g. Against Bill #INV-1002 / Advance"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
                  Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL */}
      {selectedReceiptForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4 print:hidden">
              <h3 className="text-sm font-bold text-slate-900">Payment Receipt Voucher</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptForPrint(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border border-slate-300 p-5 rounded-lg text-xs space-y-3 font-sans">
              <div className="text-center border-b pb-2">
                <h2 className="font-extrabold text-sm uppercase text-slate-950">{settings.companyName}</h2>
                <p className="text-[10px] text-slate-600">{settings.address} • Tel: {settings.phone}</p>
                {settings.panNumber && <p className="text-[10px] font-bold">PAN: {settings.panNumber}</p>}
                <div className="mt-1 inline-block bg-slate-100 text-slate-900 font-bold px-2 py-0.5 rounded text-[10px] border">
                  OFFICIAL MONEY RECEIPT (रसिद)
                </div>
              </div>

              <div className="flex justify-between text-[11px]">
                <span>Receipt #: <b>{selectedReceiptForPrint.receiptNumber}</b></span>
                <span>Date: <b>{selectedReceiptForPrint.date}</b></span>
              </div>

              <div className="p-3 bg-slate-50 rounded space-y-1">
                <p>Received with thanks from: <b className="text-slate-900 text-sm">{selectedReceiptForPrint.partyName}</b></p>
                <p>Amount: <b className="text-emerald-700 text-base font-mono">Rs. {selectedReceiptForPrint.amount.toLocaleString()}</b></p>
                <p>Payment Mode: <b>{selectedReceiptForPrint.paymentMethod}</b></p>
                {selectedReceiptForPrint.referenceNumber && <p>Txn Ref: <span className="font-mono">{selectedReceiptForPrint.referenceNumber}</span></p>}
                {selectedReceiptForPrint.remarks && <p>Remarks: <i>{selectedReceiptForPrint.remarks}</i></p>}
              </div>

              <div className="pt-6 border-t flex justify-between text-[10px] text-slate-500">
                <div>Customer Signature</div>
                <div className="text-right">Authorized Signatory</div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
