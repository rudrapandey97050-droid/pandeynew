import React, { useState } from 'react';
import { Plus, Search, ArrowUpRight, Printer, Trash2, X, Building2, DollarSign } from 'lucide-react';
import { AccountingStorageService } from '../../services/accountingStorage.ts';
import { PaymentVoucher } from '../../types/accounting.ts';

interface PaymentModuleProps {
  initialCreateOpen?: boolean;
}

export const PaymentModule: React.FC<PaymentModuleProps> = ({
  initialCreateOpen = false
}) => {
  const [showModal, setShowModal] = useState(initialCreateOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentForPrint, setSelectedPaymentForPrint] = useState<PaymentVoucher | null>(null);

  const payments = AccountingStorageService.getPayments();
  const suppliers = AccountingStorageService.getParties('supplier');
  const accounts = AccountingStorageService.getAccounts();
  const settings = AccountingStorageService.getSettings();

  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentAccountId, setPaymentAccountId] = useState(accounts[0]?.id || 'acc_cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const handleSupplierChange = (id: string) => {
    setPartyId(id);
    const s = suppliers.find(sup => sup.id === id);
    if (s) {
      setPartyName(s.name);
      if (s.currentBalance > 0) {
        setAmount(s.currentBalance);
      }
    }
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim()) {
      alert('कृपया सप्लायरको नाम छान्नुहोस्।');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert('कृपया रकम प्रविष्ट गर्नुहोस्।');
      return;
    }

    const voucherNum = `${settings.paymentPrefix || 'PAY-'}${settings.nextPaymentNumber || 4001}`;

    const newPayment: PaymentVoucher = {
      id: 'pay_' + Date.now(),
      voucherNumber: voucherNum,
      date,
      partyId: partyId || 'guest_supplier',
      partyName: partyName.trim(),
      partyType: 'supplier',
      amount: Number(amount),
      paymentMethod,
      paymentAccountId,
      referenceNumber: referenceNumber.trim(),
      remarks: remarks.trim(),
      createdBy: 'Admin',
      createdAt: new Date().toISOString()
    };

    AccountingStorageService.savePayment(newPayment);
    setShowModal(false);
    setSelectedPaymentForPrint(newPayment);
  };

  const filteredPayments = payments.filter(p =>
    p.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-serif">
            Supplier Payments (भुक्तानी भौचर / सप्लायर भुक्तानी)
          </h2>
          <p className="text-xs text-slate-500">
            Record payments made to mobile phone distributors, suppliers & print debit payment vouchers
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Payment (भुक्तानी गर्नुहोस्)</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search voucher #, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Total Payments: <b>{filteredPayments.length}</b>
          </span>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <ArrowUpRight className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">कुनै भुक्तानी भौचर भेटिएन (No Payments Recorded)</p>
            <p className="text-xs text-slate-400 mt-1">सप्लायरलाई पैसा तिर्दा यहाँ इन्ट्री गर्नुहोस्।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Cheque / Txn Ref</th>
                  <th className="py-3 px-4 text-right">Amount (Rs.)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.voucherNumber}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{p.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.partyName}</td>
                    <td className="py-3 px-4 text-slate-600">{p.paymentMethod}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.referenceNumber || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-purple-700">
                      Rs. {p.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentForPrint(p)}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-purple-600" />
                <span>Supplier Payment Voucher (भुक्तानी इन्ट्री)</span>
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Supplier (सप्लायर) *</label>
                <select
                  value={partyId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="w-full p-2 border rounded-lg font-semibold"
                >
                  <option value="">-- Choose Existing Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phone}) {s.currentBalance > 0 ? `- Outstanding Payable: Rs.${s.currentBalance}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Supplier / Vendor Name"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full p-2 border rounded-lg font-bold"
                />
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
                  <label className="font-bold text-slate-700 block mb-1">Amount Paid (रकम) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Rs. 0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-mono font-bold text-purple-700 text-sm"
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
                    <option value="Bank Transfer">Bank Transfer (बैंक मार्फत)</option>
                    <option value="Cheque">Cheque</option>
                    <option value="eSewa">eSewa</option>
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
                <label className="font-bold text-slate-700 block mb-1">Cheque / Txn Number</label>
                <input
                  type="text"
                  placeholder="Optional reference"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Remarks (कैफियत)</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared bill for 5x iPhone 15"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold">
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPaymentForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4 print:hidden">
              <h3 className="text-sm font-bold text-slate-900">Payment Voucher</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentForPrint(null)}
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
                <div className="mt-1 inline-block bg-slate-100 text-slate-900 font-bold px-2 py-0.5 rounded text-[10px] border">
                  SUPPLIER PAYMENT VOUCHER (भुक्तानी भौचर)
                </div>
              </div>

              <div className="flex justify-between text-[11px]">
                <span>Voucher #: <b>{selectedPaymentForPrint.voucherNumber}</b></span>
                <span>Date: <b>{selectedPaymentForPrint.date}</b></span>
              </div>

              <div className="p-3 bg-slate-50 rounded space-y-1">
                <p>Paid To: <b className="text-slate-900 text-sm">{selectedPaymentForPrint.partyName}</b></p>
                <p>Amount: <b className="text-purple-700 text-base font-mono">Rs. {selectedPaymentForPrint.amount.toLocaleString()}</b></p>
                <p>Payment Mode: <b>{selectedPaymentForPrint.paymentMethod}</b></p>
                {selectedPaymentForPrint.referenceNumber && <p>Txn Ref: <span className="font-mono">{selectedPaymentForPrint.referenceNumber}</span></p>}
                {selectedPaymentForPrint.remarks && <p>Remarks: <i>{selectedPaymentForPrint.remarks}</i></p>}
              </div>

              <div className="pt-6 border-t flex justify-between text-[10px] text-slate-500">
                <div>Receiver Signature</div>
                <div className="text-right">Prepared / Approved By</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
