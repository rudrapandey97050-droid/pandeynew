import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ShoppingCart,
  Printer,
  Trash2,
  RotateCcw,
  X,
  FileSpreadsheet,
  Building2,
  Calendar,
  AlertCircle,
  Edit3
} from 'lucide-react';
import { AccountingStorageService } from '../../services/accountingStorage.ts';
import { DataStorageService } from '../../services/dataStorage.ts';
import {
  PurchaseInvoice,
  PurchaseInvoiceItem,
  PurchaseReturn,
  AccountingParty,
  AccountingSettings
} from '../../types/accounting.ts';

interface PurchaseModuleProps {
  initialCreateOpen?: boolean;
}

export const PurchaseModule: React.FC<PurchaseModuleProps> = ({
  initialCreateOpen = false
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'purchases' | 'returns'>('purchases');
  const [showCreateModal, setShowCreateModal] = useState(initialCreateOpen);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseInvoice | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const purchases = AccountingStorageService.getPurchases();
  const purchaseReturns = AccountingStorageService.getPurchaseReturns();
  const suppliers = AccountingStorageService.getParties('supplier');
  const accounts = AccountingStorageService.getAccounts();
  const settings = AccountingStorageService.getSettings();
  const storeProducts = DataStorageService.getProducts();

  // New Purchase Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierBillNo, setSupplierBillNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentAccountId, setPaymentAccountId] = useState(accounts[0]?.id || 'acc_cash');
  const [paidAmountInput, setPaidAmountInput] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<PurchaseInvoiceItem[]>([
    {
      id: 'pur_item_1',
      productName: '',
      brand: 'Apple',
      model: '',
      imeiOrSerial: '',
      warrantyMonths: 12,
      qty: 1,
      purchaseCost: 0,
      expectedSellingPrice: 0,
      totalAmount: 0
    }
  ]);

  const handleSupplierSelect = (id: string) => {
    setSelectedSupplierId(id);
    if (id === 'NEW') {
      setSupplierName('');
      setSupplierPhone('');
      return;
    }
    const sup = suppliers.find(s => s.id === id);
    if (sup) {
      setSupplierName(sup.name);
      setSupplierPhone(sup.phone);
    }
  };

  const updateItem = (index: number, field: keyof PurchaseInvoiceItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'productId') {
      const p = storeProducts.find(prod => prod.id === value);
      if (p) {
        item.productName = p.name;
        item.brand = p.brand || 'Apple';
        item.model = p.model || p.name;
        item.expectedSellingPrice = p.price;
        item.purchaseCost = Math.round(p.price * 0.85);
      }
    }

    item.totalAmount = (item.qty || 1) * (item.purchaseCost || 0);
    updated[index] = item;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        id: 'pur_item_' + (items.length + 1) + '_' + Date.now(),
        productName: '',
        brand: 'Apple',
        model: '',
        imeiOrSerial: '',
        warrantyMonths: 12,
        qty: 1,
        purchaseCost: 0,
        expectedSellingPrice: 0,
        totalAmount: 0
      }
    ]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleOpenCreate = () => {
    setEditingPurchase(null);
    setSelectedSupplierId('');
    setSupplierName('');
    setSupplierPhone('');
    setSupplierBillNo('');
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod('Cash');
    setPaymentAccountId(accounts[0]?.id || 'acc_cash');
    setPaidAmountInput('');
    setNotes('');
    setItems([
      {
        id: 'pur_item_1',
        productName: '',
        brand: 'Apple',
        model: '',
        imeiOrSerial: '',
        warrantyMonths: 12,
        qty: 1,
        purchaseCost: 0,
        expectedSellingPrice: 0,
        totalAmount: 0
      }
    ]);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (p: PurchaseInvoice) => {
    setEditingPurchase(p);
    const hasSup = suppliers.some(s => s.id === p.supplierId);
    setSelectedSupplierId(hasSup ? p.supplierId : 'NEW');
    setSupplierName(p.supplierName || '');
    setSupplierPhone(p.supplierPhone || '');
    setSupplierBillNo(p.billNumber || '');
    setInvoiceDate(p.invoiceDate || new Date().toISOString().slice(0, 10));
    setPaymentMethod(p.paymentMethod || 'Cash');
    setPaymentAccountId(p.paymentAccountId || accounts[0]?.id || 'acc_cash');
    setPaidAmountInput(p.paidAmount ?? 0);
    setNotes(p.notes || '');

    if (p.items && p.items.length > 0) {
      setItems(JSON.parse(JSON.stringify(p.items)));
    } else {
      setItems([
        {
          id: 'pur_item_1',
          productName: '',
          brand: 'Apple',
          model: '',
          imeiOrSerial: '',
          warrantyMonths: 12,
          qty: 1,
          purchaseCost: 0,
          expectedSellingPrice: 0,
          totalAmount: 0
        }
      ]);
    }
    setShowCreateModal(true);
  };

  const formSubtotal = items.reduce((acc, item) => acc + (item.qty * item.purchaseCost), 0);
  const formGrandTotal = formSubtotal;
  const finalPaidAmount = paidAmountInput === '' ? formGrandTotal : Number(paidAmountInput);
  const formDueAmount = Math.max(0, formGrandTotal - finalPaidAmount);

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('कृपया सप्लायरको नाम प्रविष्ट गर्नुहोस्।');
      return;
    }
    if (items.length === 0 || !items[0].productName.trim()) {
      alert('कम्तिमा एउटा सामान/फोनको विवरण थप्नुहोस्।');
      return;
    }

    let supId = selectedSupplierId;
    if (!supId || supId === 'NEW') {
      const newSup: AccountingParty = {
        id: 'sup_' + Date.now(),
        type: 'supplier',
        name: supplierName.trim(),
        phone: supplierPhone.trim() || 'N/A',
        openingBalance: 0,
        openingBalanceType: 'cr',
        currentBalance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      AccountingStorageService.saveParty(newSup);
      supId = newSup.id;
    }

    if (editingPurchase) {
      const updatedPurchase: PurchaseInvoice = {
        ...editingPurchase,
        billNumber: supplierBillNo.trim(),
        invoiceDate,
        supplierId: supId,
        supplierName: supplierName.trim(),
        supplierPhone: supplierPhone.trim(),
        items,
        subtotal: formSubtotal,
        discountTotal: 0,
        taxTotal: 0,
        grandTotal: formGrandTotal,
        paidAmount: finalPaidAmount,
        dueAmount: formDueAmount,
        paymentStatus: formDueAmount === 0 ? 'paid' : finalPaidAmount > 0 ? 'partial' : 'unpaid',
        paymentMethod,
        paymentAccountId,
        notes,
        updatedAt: new Date().toISOString()
      };

      AccountingStorageService.savePurchase(updatedPurchase);
      setShowCreateModal(false);
      setEditingPurchase(null);
    } else {
      const purNum = `${settings.purchasePrefix || 'PUR-'}${settings.nextPurchaseNumber || 2001}`;

      const newPurchase: PurchaseInvoice = {
        id: 'pur_' + Date.now(),
        invoiceNumber: purNum,
        billNumber: supplierBillNo.trim(),
        invoiceDate,
        supplierId: supId,
        supplierName: supplierName.trim(),
        supplierPhone: supplierPhone.trim(),
        items,
        subtotal: formSubtotal,
        discountTotal: 0,
        taxTotal: 0,
        grandTotal: formGrandTotal,
        paidAmount: finalPaidAmount,
        dueAmount: formDueAmount,
        paymentStatus: formDueAmount === 0 ? 'paid' : finalPaidAmount > 0 ? 'partial' : 'unpaid',
        paymentMethod,
        paymentAccountId,
        notes,
        status: 'active',
        createdBy: 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      AccountingStorageService.savePurchase(newPurchase);
      setShowCreateModal(false);
      setEditingPurchase(null);
    }
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const matchSearch =
        p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.billNumber && p.billNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.items.some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()) || (i.imeiOrSerial && i.imeiOrSerial.includes(searchQuery)));
      const matchDate = !dateFilter || p.invoiceDate === dateFilter;
      return matchSearch && matchDate;
    });
  }, [purchases, searchQuery, dateFilter]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-serif">
            Purchase & Inward Bills (खरिद तथा स्टक दाखिला)
          </h2>
          <p className="text-xs text-slate-500">
            Record supplier phone purchases, IMEI/Serial registry, supplier dues & payments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveSubTab('purchases')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'purchases' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Purchase Bills ({purchases.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('returns')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'returns' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Purchase Returns ({purchaseReturns.length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Purchase (नयाँ खरिद बिल)</span>
          </button>
        </div>
      </div>

      {/* Main Table Area */}
      {activeSubTab === 'purchases' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Purchase #, Bill #, Supplier, IMEI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Total Bills: <span className="font-bold text-slate-900">{filteredPurchases.length}</span>
            </div>
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">कुनै खरिद बिल रेकर्ड छैन (No Purchase Bills)</p>
              <p className="text-xs text-slate-400 mt-1">
                नयाँ खरिद इन्ट्री गर्न माथिको "+ New Purchase" बटन थिच्नुहोस्।
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Purchase #</th>
                    <th className="py-3 px-4">Supplier Bill #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Items / Phones</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Due (तिर्न बाँकी)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.invoiceNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{p.billNumber || '-'}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono">{p.invoiceDate}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{p.supplierName}</td>
                      <td className="py-3 px-4 max-w-xs">
                        {p.items.map((it, idx) => (
                          <div key={idx} className="truncate text-[11px]">
                            <span>{it.productName} (x{it.qty})</span>
                            {it.imeiOrSerial && <span className="text-slate-400 font-mono ml-1">[{it.imeiOrSerial}]</span>}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-950">
                        Rs. {p.grandTotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                        Rs. {p.paidAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {p.dueAmount > 0 ? (
                          <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            Rs. {p.dueAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                          p.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {p.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors cursor-pointer"
                              title="Edit Purchase Bill (खरिद बिल सम्पादन)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {p.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to cancel Purchase Bill #${p.invoiceNumber}? Stock and supplier dues will be adjusted.`)) {
                                  AccountingStorageService.cancelPurchase(p.id, 'User cancelled');
                                }
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Cancel Purchase Bill"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* CREATE / EDIT PURCHASE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col border border-slate-200 overflow-hidden">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg text-white ${editingPurchase ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                  {editingPurchase ? <Edit3 className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {editingPurchase ? (
                      <>
                        <span>Edit Purchase Bill (खरिद बिल सम्पादन)</span>
                        <span className="px-2 py-0.5 bg-amber-500/30 text-amber-300 rounded text-xs font-mono font-bold">
                          #{editingPurchase.invoiceNumber}
                        </span>
                      </>
                    ) : (
                      <span>New Purchase Bill (नयाँ खरिद तथा स्टक इन्ट्री)</span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingPurchase
                      ? `Editing original bill date: ${editingPurchase.invoiceDate}`
                      : `Bill sequence: #${settings.purchasePrefix || 'PUR-'}${settings.nextPurchaseNumber || 2001}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingPurchase(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Supplier (सप्लायर / भेन्डर) *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => handleSupplierSelect(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="">-- सप्लायर छान्नुहोस् --</option>
                    <option value="NEW">+ नयाँ सप्लायर (New Supplier)</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.phone}) {s.currentBalance > 0 ? `- Due Rs.${s.currentBalance}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Vendor / Distributor Name"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Supplier Bill / Invoice #
                  </label>
                  <input
                    type="text"
                    placeholder="Vendor's physical bill no."
                    value={supplierBillNo}
                    onChange={(e) => setSupplierBillNo(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="Cash">Cash (नगद)</option>
                    <option value="Bank Transfer">Bank Transfer (बैंक मार्फत)</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit">Credit / Due (उधारो)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Paid From Account
                  </label>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName} (Bal: Rs.{acc.currentBalance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Purchased Phone / Stock Details (खरिद गरिएका सामानको विवरण)
                  </h4>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    + Add Item Row
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2 px-3 w-10 text-center">#</th>
                        <th className="py-2 px-3">Product Name / Model</th>
                        <th className="py-2 px-3">
                          IMEI / Serial No. <span className="text-[10px] text-slate-400 font-normal block sm:inline">(Optional / ऐच्छिक)</span>
                        </th>
                        <th className="py-2 px-3 w-20">Warranty</th>
                        <th className="py-2 px-3 w-16">Qty</th>
                        <th className="py-2 px-3 w-28">Cost Price (Rs.)</th>
                        <th className="py-2 px-3 w-28 text-right">Total</th>
                        <th className="py-2 px-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="py-2 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2 px-3 space-y-1">
                            <select
                              value={item.productId || ''}
                              onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[11px]"
                            >
                              <option value="">-- Match Store Product or Type New --</option>
                              {storeProducts.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              required
                              placeholder="Product description..."
                              value={item.productName}
                              onChange={(e) => updateItem(idx, 'productName', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="Optional (IMEI / SN)"
                              value={item.imeiOrSerial || ''}
                              onChange={(e) => updateItem(idx, 'imeiOrSerial', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.warrantyMonths || 12}
                              onChange={(e) => updateItem(idx, 'warrantyMonths', Number(e.target.value))}
                              className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs"
                            >
                              <option value={0}>None</option>
                              <option value={3}>3M</option>
                              <option value={6}>6M</option>
                              <option value={12}>1 Year</option>
                              <option value={24}>2 Years</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-center font-bold"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              required
                              value={item.purchaseCost || ''}
                              onChange={(e) => updateItem(idx, 'purchaseCost', Number(e.target.value))}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                            Rs. {item.totalAmount.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItemRow(idx)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Remarks / Terms
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Supplier terms, shipment tracking, etc..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-base font-black text-slate-950 border-b pb-2">
                    <span>Grand Total:</span>
                    <span className="font-mono text-emerald-700">Rs. {formGrandTotal.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-slate-800">Amount Paid (भुक्तानी गरेको रकम):</span>
                    <div className="w-36">
                      <input
                        type="number"
                        placeholder={`Rs. ${formGrandTotal}`}
                        value={paidAmountInput}
                        onChange={(e) => setPaidAmountInput(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-right"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between font-bold">
                    <span className="text-slate-600">Due Balance (सप्लायरलाई तिर्न बाँकी):</span>
                    <span className={`font-mono ${formDueAmount > 0 ? 'text-rose-600 font-black' : 'text-slate-500'}`}>
                      Rs. {formDueAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPurchase(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                    editingPurchase
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  }`}
                >
                  {editingPurchase
                    ? 'Update Purchase Bill (खरिद बिल अपडेट गर्नुहोस्)'
                    : 'Save Purchase Bill (खरिद सेभ गर्नुहोस्)'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
