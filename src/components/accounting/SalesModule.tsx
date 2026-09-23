import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Printer,
  FileText,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  User,
  Calendar,
  DollarSign,
  ChevronDown,
  X,
  CreditCard,
  Download,
  Edit3,
  Camera,
  Barcode
} from 'lucide-react';
import { AccountingStorageService } from '../../services/accountingStorage.ts';
import {
  SalesInvoice,
  SalesInvoiceItem,
  SalesReturn,
  SalesReturnItem,
  AccountingParty,
  AccountingSettings,
  InvoicePaymentStatus
} from '../../types/accounting.ts';
import { Product } from '../../types.ts';
import { BillPrintSetupModal } from './BillPrintSetupModal.tsx';
import { ProductSearchSelect } from './ProductSearchSelect.tsx';
import { BarcodeScannerModal } from './BarcodeScannerModal.tsx';

interface SalesModuleProps {
  onViewInvoice: (invoice: SalesInvoice) => void;
  initialCreateOpen?: boolean;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  onViewInvoice,
  initialCreateOpen = false
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'returns' | 'customerSales' | 'productSales'>('invoices');
  const [showCreateModal, setShowCreateModal] = useState(initialCreateOpen);
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedInvoiceForReturn, setSelectedInvoiceForReturn] = useState<SalesInvoice | null>(null);
  const [showPrintSetupModal, setShowPrintSetupModal] = useState(false);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | InvoicePaymentStatus>('all');
  const [dateFilter, setDateFilter] = useState('');

  // Data
  const invoices = AccountingStorageService.getSalesInvoices();
  const salesReturns = AccountingStorageService.getSalesReturns();
  const parties = AccountingStorageService.getParties('customer');
  const accounts = AccountingStorageService.getAccounts();
  const settings = AccountingStorageService.getSettings();
  const [inventoryVersion, setInventoryVersion] = useState(0);
  const storeProducts = useMemo(() => AccountingStorageService.getInventoryItems(), [inventoryVersion]);

  // --- NEW INVOICE FORM STATE ---
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPan, setCustomerPan] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState(settings.defaultPaymentMethod || 'Cash');
  const [paymentAccountId, setPaymentAccountId] = useState(accounts[0]?.id || 'acc_cash');
  const [paidAmountInput, setPaidAmountInput] = useState<number | ''>('');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Line items for invoice
  const [items, setItems] = useState<SalesInvoiceItem[]>([
    {
      id: 'item_1',
      productName: '',
      brand: 'Apple',
      model: '',
      imeiOrSerial: '',
      warrantyMonths: 12,
      qty: 1,
      purchaseCost: 0,
      rate: 0,
      discount: 0,
      taxPercent: 0,
      taxAmount: 0,
      totalAmount: 0
    }
  ]);

  // When customer is selected from dropdown
  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    if (id === 'NEW') {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerPan('');
      return;
    }
    const found = parties.find(p => p.id === id);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
      setCustomerAddress(found.address || '');
      setCustomerPan(found.panVatNumber || '');
    }
  };

  // Calculations for current invoice form
  const formSubtotal = items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const formDiscountTotal = items.reduce((acc, item) => acc + Number(item.discount || 0), 0);
  const formTaxable = Math.max(0, formSubtotal - formDiscountTotal);
  const formTaxTotal = settings.enableVat ? Math.round((formTaxable * settings.vatRate) / 100) : 0;
  const formGrandTotal = formTaxable + formTaxTotal;
  const formTotalCost = items.reduce((acc, item) => acc + (item.qty * (item.purchaseCost || 0)), 0);

  const finalPaidAmount = paidAmountInput === '' ? formGrandTotal : Number(paidAmountInput);
  const formDueAmount = Math.max(0, formGrandTotal - finalPaidAmount);

  // Update line item
  const updateItem = (index: number, field: keyof SalesInvoiceItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    // If selecting a product from store
    if (field === 'productId') {
      const prod = storeProducts.find(p => p.id === value);
      if (prod) {
        item.productName = prod.name;
        item.brand = prod.brand || 'Apple';
        item.model = prod.model || prod.name;
        item.rate = prod.discountPrice || prod.price;
        item.purchaseCost = Math.round((prod.discountPrice || prod.price) * 0.85); // Reasonable estimate if unknown
      }
    }

    const itemSub = (item.qty || 1) * (item.rate || 0);
    const itemDisc = Number(item.discount || 0);
    item.totalAmount = Math.max(0, itemSub - itemDisc);
    updated[index] = item;
    setItems(updated);
  };

  const handleSelectProduct = (index: number, prod: Product) => {
    const updated = [...items];
    const item = { ...updated[index] };
    if (prod.id) {
      item.productId = prod.id;
      item.productName = prod.name;
      item.brand = prod.brand || 'Apple';
      item.model = prod.model || prod.name;
      item.rate = prod.discountPrice || prod.price;
      item.purchaseCost = Math.round((prod.discountPrice || prod.price) * 0.85);
    } else {
      item.productId = '';
    }
    const itemSub = (item.qty || 1) * (item.rate || 0);
    const itemDisc = Number(item.discount || 0);
    item.totalAmount = Math.max(0, itemSub - itemDisc);
    updated[index] = item;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        id: 'item_' + (items.length + 1) + '_' + Date.now(),
        productName: '',
        brand: 'Apple',
        model: '',
        imeiOrSerial: '',
        warrantyMonths: 12,
        qty: 1,
        purchaseCost: 0,
        rate: 0,
        discount: 0,
        taxPercent: 0,
        taxAmount: 0,
        totalAmount: 0
      }
    ]);
  };

  // Barcode & Camera Scanner State
  const [barcodeScanTarget, setBarcodeScanTarget] = useState<{
    isOpen: boolean;
    mode: 'add-product' | 'imei-row';
    rowIndex: number;
  }>({
    isOpen: false,
    mode: 'add-product',
    rowIndex: -1
  });

  const handleBarcodeScanned = (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return;

    if (barcodeScanTarget.mode === 'imei-row' && barcodeScanTarget.rowIndex >= 0) {
      // Direct IMEI fill into the target row
      const targetIdx = barcodeScanTarget.rowIndex;
      updateItem(targetIdx, 'imeiOrSerial', cleanCode);

      // If product name is blank, check if it exists in IMEI vault
      const currentItem = items[targetIdx];
      if (!currentItem.productName) {
        const vaultItem = AccountingStorageService.getImeiVault().find(
          v => v.imei?.toLowerCase() === cleanCode.toLowerCase() || v.secondaryImei?.toLowerCase() === cleanCode.toLowerCase()
        );
        if (vaultItem) {
          updateItem(targetIdx, 'productName', vaultItem.productName);
          if (vaultItem.brand) updateItem(targetIdx, 'brand', vaultItem.brand);
          if (vaultItem.sellingPrice) {
            updateItem(targetIdx, 'rate', vaultItem.sellingPrice);
          } else if (vaultItem.purchaseCost) {
            updateItem(targetIdx, 'rate', Math.round(vaultItem.purchaseCost * 1.15));
          }
        }
      }
    } else {
      // General barcode or IMEI scan: add to line items
      const q = cleanCode.toLowerCase();
      const matchedProd = storeProducts.find(p =>
        p.id.toLowerCase() === q ||
        p.name?.toLowerCase().includes(q) ||
        (p.model && p.model.toLowerCase().includes(q))
      );

      const vaultItem = AccountingStorageService.getImeiVault().find(
        v => v.imei?.toLowerCase() === q || v.secondaryImei?.toLowerCase() === q
      );

      const firstIsBlank = items.length === 1 && !items[0].productName && !items[0].imeiOrSerial;

      if (matchedProd) {
        const newRow: SalesInvoiceItem = {
          id: `item_${Date.now()}`,
          productId: matchedProd.id,
          productName: matchedProd.name,
          brand: matchedProd.brand || 'Apple',
          model: matchedProd.model || matchedProd.name,
          imeiOrSerial: '',
          warrantyMonths: 12,
          qty: 1,
          rate: matchedProd.discountPrice || matchedProd.price,
          purchaseCost: Math.round((matchedProd.discountPrice || matchedProd.price) * 0.85),
          discount: 0,
          taxPercent: 0,
          taxAmount: 0,
          totalAmount: matchedProd.discountPrice || matchedProd.price
        };
        if (firstIsBlank) {
          setItems([newRow]);
        } else {
          setItems(prev => [...prev, newRow]);
        }
      } else if (vaultItem) {
        const rate = vaultItem.sellingPrice || (vaultItem.purchaseCost ? Math.round(vaultItem.purchaseCost * 1.15) : 0);
        const newRow: SalesInvoiceItem = {
          id: `item_${Date.now()}`,
          productId: vaultItem.productId || '',
          productName: vaultItem.productName,
          brand: vaultItem.brand || 'Apple',
          model: vaultItem.productName,
          imeiOrSerial: vaultItem.imei,
          warrantyMonths: 12,
          qty: 1,
          rate: rate,
          purchaseCost: vaultItem.purchaseCost || 0,
          discount: 0,
          taxPercent: 0,
          taxAmount: 0,
          totalAmount: rate
        };
        if (firstIsBlank) {
          setItems([newRow]);
        } else {
          setItems(prev => [...prev, newRow]);
        }
      } else {
        const newRow: SalesInvoiceItem = {
          id: `item_${Date.now()}`,
          productName: cleanCode,
          brand: 'Apple',
          model: '',
          imeiOrSerial: cleanCode,
          warrantyMonths: 12,
          qty: 1,
          rate: 0,
          purchaseCost: 0,
          discount: 0,
          taxPercent: 0,
          taxAmount: 0,
          totalAmount: 0
        };
        if (firstIsBlank) {
          setItems([newRow]);
        } else {
          setItems(prev => [...prev, newRow]);
        }
      }
    }
  };

  const removeItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  // Open modal for NEW invoice
  const handleOpenCreate = () => {
    setEditingInvoice(null);
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerPan('');
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod(settings.defaultPaymentMethod || 'Cash');
    setPaymentAccountId(accounts[0]?.id || 'acc_cash');
    setPaidAmountInput('');
    setInvoiceNotes('');
    setItems([
      {
        id: 'item_1',
        productName: '',
        brand: 'Apple',
        model: '',
        imeiOrSerial: '',
        warrantyMonths: 12,
        qty: 1,
        purchaseCost: 0,
        rate: 0,
        discount: 0,
        taxPercent: 0,
        taxAmount: 0,
        totalAmount: 0
      }
    ]);
    setShowCreateModal(true);
  };

  // Open modal for EDITING existing invoice
  const handleOpenEdit = (inv: SalesInvoice) => {
    setEditingInvoice(inv);
    const hasParty = parties.some(p => p.id === inv.customerId);
    setSelectedCustomerId(hasParty ? inv.customerId : 'NEW');
    setCustomerName(inv.customerName || '');
    setCustomerPhone(inv.customerPhone || '');
    setCustomerAddress(inv.customerAddress || '');
    setCustomerPan(inv.customerPan || '');
    setInvoiceDate(inv.invoiceDate || new Date().toISOString().slice(0, 10));
    setPaymentMethod(inv.paymentMethod || settings.defaultPaymentMethod || 'Cash');
    setPaymentAccountId(inv.paymentAccountId || accounts[0]?.id || 'acc_cash');
    setPaidAmountInput(inv.paidAmount ?? 0);
    setInvoiceNotes(inv.notes || '');

    if (inv.items && inv.items.length > 0) {
      setItems(JSON.parse(JSON.stringify(inv.items)));
    } else {
      setItems([
        {
          id: 'item_1',
          productName: '',
          brand: 'Apple',
          model: '',
          imeiOrSerial: '',
          warrantyMonths: 12,
          qty: 1,
          purchaseCost: 0,
          rate: 0,
          discount: 0,
          taxPercent: 0,
          taxAmount: 0,
          totalAmount: 0
        }
      ]);
    }
    setShowCreateModal(true);
  };

  // Submit Invoice (Create or Edit)
  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('कृपया ग्राहकको नाम प्रविष्ट गर्नुहोस् (Please enter customer name).');
      return;
    }
    if (items.length === 0 || !items[0].productName.trim()) {
      alert('कम्तिमा एउटा सामान/फोन थप्नुहोस् (Please add at least one product).');
      return;
    }

    // Determine or create party
    let custId = selectedCustomerId;
    if (!custId || custId === 'NEW') {
      // Create new customer party record
      const newParty: AccountingParty = {
        id: 'cust_' + Date.now(),
        type: 'customer',
        name: customerName.trim(),
        phone: customerPhone.trim() || 'N/A',
        address: customerAddress.trim(),
        panVatNumber: customerPan.trim(),
        openingBalance: 0,
        openingBalanceType: 'dr',
        currentBalance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      AccountingStorageService.saveParty(newParty);
      custId = newParty.id;
    }

    if (editingInvoice) {
      // Update existing invoice
      const updatedInvoice: SalesInvoice = {
        ...editingInvoice,
        invoiceDate,
        customerId: custId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        customerPan: customerPan.trim(),
        items: items.map(i => ({
          ...i,
          taxPercent: settings.enableVat ? settings.vatRate : 0,
          taxAmount: settings.enableVat ? Math.round(((i.totalAmount) * settings.vatRate) / 100) : 0
        })),
        subtotal: formSubtotal,
        discountTotal: formDiscountTotal,
        taxableAmount: formTaxable,
        taxTotal: formTaxTotal,
        grandTotal: formGrandTotal,
        paidAmount: finalPaidAmount,
        dueAmount: formDueAmount,
        paymentStatus: formDueAmount === 0 ? 'paid' : finalPaidAmount > 0 ? 'partial' : 'unpaid',
        paymentMethod,
        paymentAccountId,
        notes: invoiceNotes,
        totalCost: formTotalCost,
        grossProfit: formGrandTotal - formTotalCost,
        updatedAt: new Date().toISOString()
      };

      AccountingStorageService.saveSalesInvoice(updatedInvoice);
      setShowCreateModal(false);
      setEditingInvoice(null);
      onViewInvoice(updatedInvoice);
    } else {
      // Create fresh invoice
      const invoiceNum = `${settings.invoicePrefix || 'INV-'}${settings.nextInvoiceNumber || 1001}`;

      const newInvoice: SalesInvoice = {
        id: 'inv_' + Date.now(),
        invoiceNumber: invoiceNum,
        invoiceDate,
        customerId: custId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        customerPan: customerPan.trim(),
        items: items.map(i => ({
          ...i,
          taxPercent: settings.enableVat ? settings.vatRate : 0,
          taxAmount: settings.enableVat ? Math.round(((i.totalAmount) * settings.vatRate) / 100) : 0
        })),
        subtotal: formSubtotal,
        discountTotal: formDiscountTotal,
        taxableAmount: formTaxable,
        taxTotal: formTaxTotal,
        grandTotal: formGrandTotal,
        paidAmount: finalPaidAmount,
        dueAmount: formDueAmount,
        paymentStatus: formDueAmount === 0 ? 'paid' : finalPaidAmount > 0 ? 'partial' : 'unpaid',
        paymentMethod,
        paymentAccountId,
        notes: invoiceNotes,
        status: 'active',
        totalCost: formTotalCost,
        grossProfit: formGrandTotal - formTotalCost,
        createdBy: 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      AccountingStorageService.saveSalesInvoice(newInvoice);
      setShowCreateModal(false);
      setEditingInvoice(null);
      onViewInvoice(newInvoice);
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerPhone.includes(searchQuery) ||
        inv.items.some(i => (i.imeiOrSerial && i.imeiOrSerial.includes(searchQuery)) || i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchPayment = paymentFilter === 'all' || inv.paymentStatus === paymentFilter;
      const matchDate = !dateFilter || inv.invoiceDate === dateFilter;

      return matchSearch && matchPayment && matchDate;
    });
  }, [invoices, searchQuery, paymentFilter, dateFilter]);

  // Cancel invoice handler
  const handleCancelInvoice = (invoice: SalesInvoice) => {
    const reason = window.prompt(`बिल #${invoice.invoiceNumber} रद्द (Cancel) गर्ने कारण लेख्नुहोस्:`);
    if (reason !== null && reason.trim()) {
      AccountingStorageService.cancelSalesInvoice(invoice.id, reason);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Subtabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-serif">
            Sales & Invoicing (बिक्री तथा बिलिङ)
          </h2>
          <p className="text-xs text-slate-500">
            Create GST/VAT & Cash memo invoices, manage payments, due balances & warranty records
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub Navigation */}
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveSubTab('invoices')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'invoices' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sales Invoices ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('returns')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'returns' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sales Returns ({salesReturns.length})
            </button>
          </div>

            <button
              type="button"
              onClick={() => setShowPrintSetupModal(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border border-slate-200 cursor-pointer shadow-2xs"
              title="बिल प्रिन्ट तथा कागजको साइज सेटअप (Paper Size Setup)"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>प्रिन्ट सेटअप (Paper Size)</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Invoice (नयाँ बिल)</span>
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Invoice #, Customer, Phone, IMEI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="all">All Payment Status</option>
                <option value="paid">Paid (पूर्ण भुक्तानी)</option>
                <option value="partial">Partial (आंशिक बाँकी)</option>
                <option value="unpaid">Unpaid (पुरा बाँकी)</option>
              </select>

              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              />

              {(searchQuery || paymentFilter !== 'all' || dateFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPaymentFilter('all');
                    setDateFilter('');
                  }}
                  className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Total Invoices: <span className="font-bold text-slate-900">{filteredInvoices.length}</span>
            </div>
          </div>

          {/* Table */}
          {filteredInvoices.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">कुनै बिक्री बिल फेला परेन (No Invoices Found)</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery ? 'सर्च फिल्टर परिवर्तन गर्नुहोस्।' : 'नयाँ बिल काट्न माथिको "+ New Invoice" बटन थिच्नुहोस्।'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items / Phone Model</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Due (बाँकी)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {inv.invoiceDate}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-950">{inv.customerName}</p>
                        {inv.customerPhone && <p className="text-[11px] text-slate-500">{inv.customerPhone}</p>}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        {inv.items.map((it, idx) => (
                          <div key={idx} className="text-[11px] truncate">
                            <span className="font-semibold text-slate-800">{it.productName}</span>
                            {it.imeiOrSerial && (
                              <span className="text-indigo-600 font-mono text-[10px] ml-1 bg-indigo-50 px-1 py-0.2 rounded">
                                {it.imeiOrSerial}
                              </span>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-950">
                        Rs. {inv.grandTotal.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">
                        Rs. {inv.paidAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {inv.dueAmount > 0 ? (
                          <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            Rs. {inv.dueAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {inv.status === 'cancelled' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 uppercase">
                            Cancelled
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            inv.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {inv.paymentStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onViewInvoice(inv)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
                            title="Print / View Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {inv.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(inv)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors cursor-pointer"
                              title="Edit Sales Bill (बिक्री बिल सम्पादन)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {inv.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleCancelInvoice(inv)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Cancel Invoice"
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

      {/* Sales Returns Tab */}
      {activeSubTab === 'returns' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-900">Sales Return Records (बिक्री फिर्ता)</h3>
            <button
              type="button"
              onClick={() => {
                if (invoices.length === 0) {
                  alert('फिर्ता गर्न पहिले कुनै बिक्री बिल हुनु पर्छ।');
                  return;
                }
                setShowReturnModal(true);
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>+ Process Sales Return</span>
            </button>
          </div>

          {salesReturns.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              कुनै बिक्री फिर्ता रेकर्ड गरिएको छैन (No Sales Returns Recorded).
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Return #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Original Invoice</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items Returned</th>
                  <th className="py-2.5 px-3 text-right">Refund Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesReturns.map(ret => (
                  <tr key={ret.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{ret.returnNumber}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{ret.returnDate}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-indigo-600">{ret.originalInvoiceNumber}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{ret.customerName}</td>
                    <td className="py-2.5 px-3">{ret.items.map(i => i.productName).join(', ')}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-rose-700">
                      Rs. {ret.totalRefundAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CREATE NEW INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg text-white ${editingInvoice ? 'bg-amber-600' : 'bg-indigo-600'}`}>
                  {editingInvoice ? <Edit3 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {editingInvoice ? (
                      <>
                        <span>Edit Sales Bill (बिक्री बिल सम्पादन)</span>
                        <span className="px-2 py-0.5 bg-amber-500/30 text-amber-300 rounded text-xs font-mono font-bold">
                          #{editingInvoice.invoiceNumber}
                        </span>
                      </>
                    ) : (
                      <span>New Sales Invoice (नयाँ बिक्री बिल)</span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingInvoice
                      ? `Editing original bill date: ${editingInvoice.invoiceDate}`
                      : `Bill sequence: #${settings.invoicePrefix || 'INV-'}${settings.nextInvoiceNumber || 1001}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingInvoice(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveInvoice} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Customer & Invoice Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                
                {/* Select or Quick Add Customer */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Customer (ग्राहक) *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                  >
                    <option value="">-- ग्राहक छान्नुहोस् --</option>
                    <option value="NEW">+ नयाँ ग्राहक थप्नुहोस् (New)</option>
                    {parties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.phone}) {p.currentBalance > 0 ? `- Due Rs.${p.currentBalance}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Customer Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>

                {/* Customer Phone */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="98XXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>

                {/* Invoice Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Date (मिति) *
                  </label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>

                {/* Optional Address */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Address (ठेगाना)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Butwal, Rupandehi"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* Optional PAN */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Customer PAN / VAT
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={customerPan}
                    onChange={(e) => setCustomerPan(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Payment Method */}
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
                    <option value="Bank Transfer">Bank Transfer (बैंक ट्रान्सफर)</option>
                    <option value="eSewa">eSewa</option>
                    <option value="Khalti">Khalti</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit">Credit / Due (उधारो)</option>
                  </select>
                </div>

                {/* Deposit Account */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Deposit Into Account
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

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Invoice Items & Handset Details (सामान तथा फोनको विवरण)
                  </h4>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setBarcodeScanTarget({ isOpen: true, mode: 'add-product', rowIndex: -1 })}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                      title="Scan Barcode or IMEI with Mobile Camera (क्यामराबाट स्क्यान)"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Scan Barcode / IMEI</span>
                    </button>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      + Add More Item Row
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-visible min-h-[220px]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2 px-3 w-10 text-center">#</th>
                        <th className="py-2 px-3">Product / Phone Selection</th>
                        <th className="py-2 px-3">
                          IMEI / Serial No. <span className="text-[10px] text-slate-400 font-normal block sm:inline">(Optional / ऐच्छिक)</span>
                        </th>
                        <th className="py-2 px-3 w-20">Warranty</th>
                        <th className="py-2 px-3 w-16">Qty</th>
                        <th className="py-2 px-3 w-28">Rate (Rs.)</th>
                        <th className="py-2 px-3 w-24">Discount</th>
                        <th className="py-2 px-3 w-28 text-right">Total</th>
                        <th className="py-2 px-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="py-2 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                          
                          {/* Product Selection */}
                          <td className="py-2 px-3 min-w-[260px] align-top">
                            <ProductSearchSelect
                              selectedProductId={item.productId}
                              productName={item.productName}
                              products={storeProducts}
                              onSelectProduct={(prod) => handleSelectProduct(idx, prod)}
                              onManualNameChange={(name) => updateItem(idx, 'productName', name)}
                              onProductCreated={(newProd) => {
                                setInventoryVersion((v) => v + 1);
                                handleSelectProduct(idx, newProd);
                              }}
                            />
                          </td>

                          {/* IMEI / Serial (Optional) */}
                          <td className="py-2 px-3">
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                placeholder="Optional (IMEI / SN)"
                                value={item.imeiOrSerial || ''}
                                onChange={(e) => updateItem(idx, 'imeiOrSerial', e.target.value)}
                                className="w-full pl-2 pr-7 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => setBarcodeScanTarget({ isOpen: true, mode: 'imei-row', rowIndex: idx })}
                                className="absolute right-1 text-slate-400 hover:text-emerald-600 p-0.5 rounded hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="क्यामराबाट IMEI स्क्यान गर्नुहोस्"
                              >
                                <Camera className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Warranty Months */}
                          <td className="py-2 px-3">
                            <select
                              value={item.warrantyMonths || 12}
                              onChange={(e) => updateItem(idx, 'warrantyMonths', Number(e.target.value))}
                              className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs"
                            >
                              <option value={0}>None</option>
                              <option value={1}>1 Month</option>
                              <option value={3}>3 Months</option>
                              <option value={6}>6 Months</option>
                              <option value={12}>1 Year</option>
                              <option value={24}>2 Years</option>
                            </select>
                          </td>

                          {/* Qty */}
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-center"
                            />
                          </td>

                          {/* Rate */}
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              required
                              value={item.rate || ''}
                              onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold"
                            />
                          </td>

                          {/* Discount */}
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              placeholder="Rs. 0"
                              value={item.discount || ''}
                              onChange={(e) => updateItem(idx, 'discount', Number(e.target.value))}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-rose-600"
                            />
                          </td>

                          {/* Row Total */}
                          <td className="py-2 px-3 text-right font-mono font-black text-slate-900">
                            Rs. {item.totalAmount.toLocaleString()}
                          </td>

                          {/* Remove */}
                          <td className="py-2 px-3 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItemRow(idx)}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer"
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

              {/* Totals & Payment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Invoice Remarks / Notes (कैफियत)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter customer notes, accessories included, exchange remarks, etc..."
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900">Rs. {formSubtotal.toLocaleString()}</span>
                  </div>

                  {formDiscountTotal > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Discount:</span>
                      <span className="font-mono">- Rs. {formDiscountTotal.toLocaleString()}</span>
                    </div>
                  )}

                  {settings.enableVat && (
                    <div className="flex justify-between text-slate-600">
                      <span>VAT ({settings.vatRate}%):</span>
                      <span className="font-mono font-bold">Rs. {formTaxTotal.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-black text-slate-950 pt-1 border-t border-slate-300">
                    <span>Grand Total:</span>
                    <span className="font-mono text-indigo-700">Rs. {formGrandTotal.toLocaleString()}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-emerald-800">Amount Received (प्राप्त रकम):</span>
                    <div className="w-36">
                      <input
                        type="number"
                        placeholder={`Rs. ${formGrandTotal}`}
                        value={paidAmountInput}
                        onChange={(e) => setPaidAmountInput(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-right focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between font-bold">
                    <span className="text-slate-600">Due Balance (ग्राहक बाँकी):</span>
                    <span className={`font-mono ${formDueAmount > 0 ? 'text-rose-600 font-black' : 'text-slate-500'}`}>
                      Rs. {formDueAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingInvoice(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                    editingInvoice
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                  }`}
                >
                  {editingInvoice
                    ? 'Update & View Invoice (बिल अपडेट गर्नुहोस्)'
                    : 'Save & Print Invoice (बिल सेभ गरी प्रिन्ट गर्नुहोस्)'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* SALES RETURN MODAL */}
      {showReturnModal && (
        <SalesReturnModal
          invoices={invoices.filter(i => i.status === 'active')}
          accounts={accounts}
          onClose={() => setShowReturnModal(false)}
        />
      )}

      {/* BILL PRINT & PAPER SIZE SETUP MODAL */}
      <BillPrintSetupModal
        isOpen={showPrintSetupModal}
        onClose={() => setShowPrintSetupModal(false)}
        onTestPrint={(sample) => {
          setShowPrintSetupModal(false);
          onViewInvoice(sample);
        }}
      />

      {/* MOBILE CAMERA BARCODE & IMEI SCANNER MODAL */}
      <BarcodeScannerModal
        isOpen={barcodeScanTarget.isOpen}
        onClose={() => setBarcodeScanTarget(prev => ({ ...prev, isOpen: false }))}
        onScan={handleBarcodeScanned}
        title={barcodeScanTarget.mode === 'imei-row' ? 'IMEI Barcode Scanner' : 'Barcode & IMEI Scanner'}
        subtitle={
          barcodeScanTarget.mode === 'imei-row'
            ? 'मोबाइलको बक्स वा फोनबाट सिधै IMEI स्क्यान गर्नुहोस्'
            : 'बारकोड वा IMEI स्क्यान गरी बिलमा तुरुन्त सामान थप्नुहोस्'
        }
        placeholderText="बारकोड वा IMEI टाइप गर्नुहोस्..."
      />

    </div>
  );
};

// Sub-component for Sales Return Modal
const SalesReturnModal: React.FC<{
  invoices: SalesInvoice[];
  accounts: any[];
  onClose: () => void;
}> = ({ invoices, accounts, onClose }) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundMethod, setRefundMethod] = useState('Cash');
  const [paymentAccountId, setPaymentAccountId] = useState(accounts[0]?.id || 'acc_cash');
  const [returnRemarks, setReturnRemarks] = useState('');

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) {
      alert('कृपया बिक्री बिल छान्नुहोस्।');
      return;
    }

    const ret: SalesReturn = {
      id: 'ret_' + Date.now(),
      returnNumber: 'RET-' + (Date.now() % 10000),
      returnDate,
      originalInvoiceId: selectedInvoice.id,
      originalInvoiceNumber: selectedInvoice.invoiceNumber,
      customerId: selectedInvoice.customerId,
      customerName: selectedInvoice.customerName,
      items: selectedInvoice.items.map(i => ({
        id: 'ret_item_' + Date.now(),
        productName: i.productName,
        imeiOrSerial: i.imeiOrSerial,
        qty: i.qty,
        refundRate: i.rate,
        totalRefund: i.totalAmount,
        reason: returnRemarks
      })),
      totalRefundAmount: refundAmount > 0 ? refundAmount : selectedInvoice.grandTotal,
      refundMethod,
      paymentAccountId,
      remarks: returnRemarks,
      createdBy: 'Admin',
      createdAt: new Date().toISOString()
    };

    AccountingStorageService.saveSalesReturn(ret);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-500" />
            <span>Process Sales Return (बिक्री फिर्ता)</span>
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Select Sales Invoice *</label>
            <select
              required
              value={selectedInvoiceId}
              onChange={(e) => {
                setSelectedInvoiceId(e.target.value);
                const inv = invoices.find(i => i.id === e.target.value);
                if (inv) setRefundAmount(inv.paidAmount || inv.grandTotal);
              }}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">-- Choose Invoice --</option>
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  #{inv.invoiceNumber} - {inv.customerName} (Rs. {inv.grandTotal.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {selectedInvoice && (
            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <p><span className="font-bold">Items:</span> {selectedInvoice.items.map(i => i.productName).join(', ')}</p>
              <p><span className="font-bold">Original Paid:</span> Rs. {selectedInvoice.paidAmount.toLocaleString()}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Refund Amount (रकम) *</label>
              <input
                type="number"
                required
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                className="w-full p-2 border rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Refund Method</label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="eSewa">eSewa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Return Reason / Remarks</label>
            <input
              type="text"
              placeholder="e.g. Customer changed mind / Device replaced"
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg font-bold">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold">
              Confirm Return & Refund
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
