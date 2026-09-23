import React, { useState, useMemo, useEffect } from 'react';
import {
  Smartphone,
  Search,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  Copy,
  ExternalLink,
  Download,
  Printer,
  ShieldCheck,
  AlertCircle,
  X,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
  Barcode
} from 'lucide-react';
import { AccountingStorageService } from '../../services/accountingStorage.ts';
import { ImeiVaultItem } from '../../types/accounting.ts';
import { Product } from '../../types.ts';
import { BarcodeScannerModal } from './BarcodeScannerModal.tsx';

interface ImeiVaultModuleProps {
  initialSearch?: string;
}

export const ImeiVaultModule: React.FC<ImeiVaultModuleProps> = ({
  initialSearch = ''
}) => {
  const [imeiList, setImeiList] = useState<ImeiVaultItem[]>(() => AccountingStorageService.getImeiVault());
  const [products, setProducts] = useState<Product[]>(() => AccountingStorageService.getInventoryItems());
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<'all' | 'In Stock' | 'Sold' | 'Under Repair'>('all');
  const [brandFilter, setBrandFilter] = useState('all');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ImeiVaultItem | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [copiedImei, setCopiedImei] = useState<string | null>(null);

  // Form Fields
  const [formImei, setFormImei] = useState('');
  const [formSecondaryImei, setFormSecondaryImei] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formProductName, setFormProductName] = useState('');
  const [formBrand, setFormBrand] = useState('Apple');
  const [formStatus, setFormStatus] = useState<'In Stock' | 'Sold' | 'Under Repair' | 'Reserved'>('In Stock');
  const [formPurchaseCost, setFormPurchaseCost] = useState<number | ''>('');
  const [formPurchaseBill, setFormPurchaseBill] = useState('');
  const [formSupplierName, setFormSupplierName] = useState('');
  const [formSalesInvoice, setFormSalesInvoice] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formWarrantyExpiry, setFormWarrantyExpiry] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Camera Barcode Scanner State
  const [scannerTarget, setScannerTarget] = useState<null | 'search' | 'formPrimary' | 'formSecondary'>(null);

  const handleBarcodeScanned = (scannedCode: string) => {
    const clean = scannedCode.trim();
    if (!clean) return;

    if (scannerTarget === 'search') {
      setSearchQuery(clean);
      showToast(`Scanned IMEI: ${clean}`);
    } else if (scannerTarget === 'formPrimary') {
      setFormImei(clean);
      setFormError('');
      showToast(`Scanned IMEI: ${clean}`);
    } else if (scannerTarget === 'formSecondary') {
      setFormSecondaryImei(clean);
      showToast(`Scanned Secondary IMEI: ${clean}`);
    }
    setScannerTarget(null);
  };

  // Reload on storage changes
  useEffect(() => {
    const unsubAcc = AccountingStorageService.subscribe(() => {
      setImeiList(AccountingStorageService.getImeiVault());
      setProducts(AccountingStorageService.getInventoryItems());
    });
    return () => {
      unsubAcc();
    };
  }, []);

  // Update when initialSearch prop changes
  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  const brands = useMemo(() => {
    const bSet = new Set<string>();
    imeiList.forEach(i => {
      if (i.brand) bSet.add(i.brand);
    });
    return Array.from(bSet).sort();
  }, [imeiList]);

  // Statistics
  const totalImeis = imeiList.length;
  const inStockImeis = imeiList.filter(i => i.status === 'In Stock');
  const soldImeis = imeiList.filter(i => i.status === 'Sold');
  const repairImeis = imeiList.filter(i => i.status === 'Under Repair' || i.status === 'Reserved');
  const inStockCostTotal = inStockImeis.reduce((sum, i) => sum + (i.purchaseCost || 0), 0);

  // Filtered list
  const filteredList = useMemo(() => {
    let result = imeiList;

    if (statusFilter !== 'all') {
      result = result.filter(i => i.status === statusFilter);
    }

    if (brandFilter !== 'all') {
      result = result.filter(i => i.brand === brandFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery
        .replace(/[\u0966-\u096F]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x0966 + 48))
        .replace(/[\uFF10-\uFF19]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 48))
        .trim()
        .toLowerCase();

      result = result.filter(i => {
        const imei = i.imei.toLowerCase();
        const sec = i.secondaryImei?.toLowerCase() || '';
        const prod = i.productName.toLowerCase();
        const br = i.brand.toLowerCase();
        const cust = i.customerName?.toLowerCase() || '';
        const sup = i.supplierName?.toLowerCase() || '';
        const bill = i.purchaseBill?.toLowerCase() || '';
        const inv = i.salesInvoice?.toLowerCase() || '';

        return (
          imei.includes(q) ||
          sec.includes(q) ||
          prod.includes(q) ||
          br.includes(q) ||
          cust.includes(q) ||
          sup.includes(q) ||
          bill.includes(q) ||
          inv.includes(q)
        );
      });
    }

    return result;
  }, [imeiList, statusFilter, brandFilter, searchQuery]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleCopyImei = (imei: string) => {
    navigator.clipboard.writeText(imei);
    setCopiedImei(imei);
    setTimeout(() => setCopiedImei(null), 2000);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormImei('');
    setFormSecondaryImei('');
    setFormProductId('');
    setFormProductName('');
    setFormBrand('Apple');
    setFormStatus('In Stock');
    setFormPurchaseCost('');
    setFormPurchaseBill('');
    setFormSupplierName('');
    setFormSalesInvoice('');
    setFormCustomerName('');
    setFormCustomerPhone('');
    setFormWarrantyExpiry('');
    setFormNotes('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: ImeiVaultItem) => {
    setEditingItem(item);
    setFormImei(item.imei);
    setFormSecondaryImei(item.secondaryImei || '');
    setFormProductId(item.productId || '');
    setFormProductName(item.productName);
    setFormBrand(item.brand);
    setFormStatus(item.status);
    setFormPurchaseCost(typeof item.purchaseCost === 'number' ? item.purchaseCost : '');
    setFormPurchaseBill(item.purchaseBill || '');
    setFormSupplierName(item.supplierName || '');
    setFormSalesInvoice(item.salesInvoice || '');
    setFormCustomerName(item.customerName || '');
    setFormCustomerPhone(item.customerPhone || '');
    setFormWarrantyExpiry(item.warrantyExpiry || '');
    setFormNotes(item.notes || '');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSelectExistingProduct = (pId: string) => {
    setFormProductId(pId);
    const found = products.find(p => p.id === pId);
    if (found) {
      setFormProductName(found.name);
      setFormBrand(found.brand || 'Apple');
      if (typeof found.costPrice === 'number' && found.costPrice > 0) {
        setFormPurchaseCost(found.costPrice);
      } else if (found.price) {
        setFormPurchaseCost(Math.round(found.price * 0.85));
      }
    }
  };

  const handleSaveImei = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanImei = formImei.trim();
    if (!cleanImei) {
      setFormError('कृपया वैध IMEI नम्बर हाल्नुहोस् (IMEI number is required)');
      return;
    }
    if (!formProductName.trim()) {
      setFormError('कृपया फोन वा मोडलको नाम हाल्नुहोस् (Handset model name is required)');
      return;
    }

    // Check duplicate if new
    if (!editingItem) {
      const exists = imeiList.some(i => i.imei.toLowerCase() === cleanImei.toLowerCase());
      if (exists) {
        setFormError(`यो IMEI '${cleanImei}' पहिले नै भण्डारणमा सुरक्षित छ (Duplicate IMEI)`);
        return;
      }
    }

    const itemToSave: ImeiVaultItem = {
      id: editingItem?.id || `imei_vault_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      imei: cleanImei,
      secondaryImei: formSecondaryImei.trim() || undefined,
      productId: formProductId || undefined,
      productName: formProductName.trim(),
      brand: formBrand.trim() || 'Handset',
      status: formStatus,
      purchaseCost: typeof formPurchaseCost === 'number' ? formPurchaseCost : undefined,
      purchaseBill: formPurchaseBill.trim() || undefined,
      purchaseDate: editingItem?.purchaseDate || (formPurchaseBill.trim() ? new Date().toISOString().slice(0, 10) : undefined),
      supplierName: formSupplierName.trim() || undefined,
      salesInvoice: formSalesInvoice.trim() || undefined,
      salesDate: editingItem?.salesDate || (formSalesInvoice.trim() ? new Date().toISOString().slice(0, 10) : undefined),
      customerName: formCustomerName.trim() || undefined,
      customerPhone: formCustomerPhone.trim() || undefined,
      warrantyExpiry: formWarrantyExpiry.trim() || undefined,
      notes: formNotes.trim() || undefined,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    AccountingStorageService.saveImeiVaultItem(itemToSave);
    setIsAddModalOpen(false);
    showToast(`IMEI '${cleanImei}' सफलतापूर्वक भण्डारणमा सुरक्षित भयो।`);
  };

  const handleDeleteImei = (item: ImeiVaultItem) => {
    if (window.confirm(`के तपाईं IMEI '${item.imei}' (${item.productName}) लाई भण्डारणबाट हटाउन निश्चित हुनुहुन्छ?`)) {
      AccountingStorageService.deleteImeiVaultItem(item.id);
      showToast(`IMEI '${item.imei}' भण्डारणबाट हटाइयो।`);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'IMEI',
      'Secondary IMEI',
      'Product Name',
      'Brand',
      'Status',
      'Purchase Cost',
      'Purchase Bill',
      'Supplier',
      'Sales Invoice',
      'Customer',
      'Customer Phone',
      'Warranty Expiry',
      'Notes'
    ];

    const rows = filteredList.map(item => [
      `"${item.imei}"`,
      `"${item.secondaryImei || ''}"`,
      `"${item.productName}"`,
      `"${item.brand}"`,
      `"${item.status}"`,
      item.purchaseCost || 0,
      `"${item.purchaseBill || ''}"`,
      `"${item.supplierName || ''}"`,
      `"${item.salesInvoice || ''}"`,
      `"${item.customerName || ''}"`,
      `"${item.customerPhone || ''}"`,
      `"${item.warrantyExpiry || ''}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pandey_mobile_imei_vault_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 font-serif">
                IMEI भण्डारण तथा व्यवस्थापन (IMEI Vault)
              </h2>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black rounded-full uppercase">
                Secure Repository
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              प्रत्येक स्मार्टफोनको IMEI, खरिद बिल, बिक्री विवरण तथा मौज्दात स्थिति छुट्टै सुरक्षित भण्डारण। स्टक तालिकामा सीधा नदेखाई खोजी गर्दा मात्र देखिने व्यवस्था।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Export</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ नयाँ IMEI दर्ता गर्नुहोस् (+ Add IMEI)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            कुल दर्ता भएका IMEI (Total Vault)
          </span>
          <p className="text-2xl font-black font-mono text-slate-900">
            {totalImeis} <span className="text-xs font-normal text-slate-500">handsets</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>मौज्दात उपलब्ध IMEI (In Stock)</span>
          </span>
          <p className="text-2xl font-black font-mono text-emerald-700">
            {inStockImeis.length} <span className="text-xs font-normal text-slate-500">available</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
            बिक्री भइसकेका IMEI (Sold Out)
          </span>
          <p className="text-2xl font-black font-mono text-indigo-700">
            {soldImeis.length} <span className="text-xs font-normal text-slate-500">invoiced</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            मौज्दात खरिद लागत (Stock Value)
          </span>
          <p className="text-2xl font-black font-mono text-purple-700">
            Rs. {inStockCostTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Main Search Input with Barcode Camera Scan */}
          <div className="relative flex-1 w-full flex items-center space-x-1.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="IMEI नम्बर, सेकेन्डरी IMEI, मोडल, ब्रान्ड वा ग्राहकको नाम खोज्नुहोस्..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono transition-colors focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setScannerTarget('search')}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-2xs"
              title="क्यामराबाट IMEI बारकोड स्क्यान गर्नुहोस्"
            >
              <Camera className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Scan IMEI</span>
            </button>
          </div>

          {/* Status Pills */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              सबै ({totalImeis})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('In Stock')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'In Stock' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              मौज्दात ({inStockImeis.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Sold')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'Sold' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-700'
              }`}
            >
              बिक्री भएको ({soldImeis.length})
            </button>
          </div>

          {/* Brand Filter */}
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">All Brands ({brands.length})</option>
            {brands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {searchQuery && (
          <div className="text-[11px] text-indigo-700 bg-indigo-50/70 p-2 rounded-lg flex items-center justify-between">
            <span>
              🔍 <b>'{searchQuery}'</b> को खोजी परिणाम: <b>{filteredList.length}</b> वटा IMEI फेला पर्यो।
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-indigo-600 hover:underline font-bold cursor-pointer"
            >
              खोजी हटाउनुहोस् (Clear)
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <Smartphone className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">कुनै IMEI फेला परेन (No IMEI Found)</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `तपाईंको खोजी '${searchQuery}' सँग मिल्ने कुनै पनि IMEI भेटिएन।`
                : 'भण्डारणमा नयाँ IMEI प्रविष्ट गर्न माथिको "+ नयाँ IMEI दर्ता गर्नुहोस्" बटन थिच्नुहोस्।'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                फिल्टर रिसेट गर्नुहोस्
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">IMEI / Serial Number</th>
                  <th className="py-3 px-4">Handset Model & Brand</th>
                  <th className="py-3 px-4 text-center">स्थिति (Status)</th>
                  <th className="py-3 px-4">खरिद दाखिला (Inward)</th>
                  <th className="py-3 px-4">बिक्री निकासी (Outward)</th>
                  <th className="py-3 px-4 text-right">खरिद लागत (Cost)</th>
                  <th className="py-3 px-4 text-center">कार्य (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => {
                  const isInStock = item.status === 'In Stock';
                  const isSold = item.status === 'Sold';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* IMEI & Copy */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-black text-indigo-700 text-xs tracking-wider">
                            {item.imei}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyImei(item.imei)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Copy IMEI"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedImei === item.imei && (
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                              Copied!
                            </span>
                          )}
                        </div>
                        {item.secondaryImei && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            SIM 2: {item.secondaryImei}
                          </div>
                        )}
                      </td>

                      {/* Model & Brand */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{item.productName}</span>
                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-semibold text-slate-700">{item.brand}</span>
                          {item.notes && <span className="text-slate-400">• {item.notes}</span>}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isInStock
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isSold
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isInStock && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />}
                          {item.status}
                        </span>
                      </td>

                      {/* Purchase Info */}
                      <td className="py-3 px-4">
                        {item.purchaseBill ? (
                          <div>
                            <span className="font-mono font-bold text-slate-800 block">{item.purchaseBill}</span>
                            <span className="text-[11px] text-slate-500 block">
                              {item.supplierName || 'Supplier'} {item.purchaseDate ? `• ${item.purchaseDate}` : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">भण्डारण ओपनिङ</span>
                        )}
                      </td>

                      {/* Sales Info */}
                      <td className="py-3 px-4">
                        {item.salesInvoice ? (
                          <div>
                            <span className="font-mono font-bold text-indigo-600 block">{item.salesInvoice}</span>
                            <span className="text-[11px] text-slate-800 font-medium block">
                              {item.customerName || 'Customer'}
                            </span>
                            {item.customerPhone && (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {item.customerPhone}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {typeof item.purchaseCost === 'number' && item.purchaseCost > 0 ? (
                          `Rs. ${item.purchaseCost.toLocaleString()}`
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit IMEI record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteImei(item)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete IMEI from vault"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT IMEI MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingItem ? 'IMEI विवरण सम्पादन (Edit IMEI)' : 'नयाँ IMEI भण्डारण दाखिला (Add IMEI to Vault)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Handset IMEI number registration & ledger tracking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveImei} className="space-y-4 text-xs">
              
              {/* Quick Select from existing products */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  स्टक सूचीबाट फोन छान्नुहोस् (Select from Product Catalog - Optional):
                </label>
                <select
                  value={formProductId}
                  onChange={(e) => handleSelectExistingProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  <option value="">-- नयाँ वा अन्य मोडल (Manual Entry) --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.brand || 'No Brand'} • Stock: {p.stock || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* IMEI Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      IMEI नम्बर <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setScannerTarget('formPrimary')}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Scan Barcode</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 359123456789012"
                      value={formImei}
                      onChange={(e) => setFormImei(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setScannerTarget('formPrimary')}
                      className="absolute right-2 text-slate-400 hover:text-emerald-600 p-0.5 rounded cursor-pointer"
                      title="Scan IMEI with camera"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      Secondary IMEI / SIM 2 (ऐच्छिक)
                    </label>
                    <button
                      type="button"
                      onClick={() => setScannerTarget('formSecondary')}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Scan</span>
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="e.g. 359123456789013"
                      value={formSecondaryImei}
                      onChange={(e) => setFormSecondaryImei(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setScannerTarget('formSecondary')}
                      className="absolute right-2 text-slate-400 hover:text-emerald-600 p-0.5 rounded cursor-pointer"
                      title="Scan Secondary IMEI with camera"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Handset Name & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    फोन / मोडल नाम <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iPhone 15 Pro Max 256GB"
                    value={formProductName}
                    onChange={(e) => setFormProductName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ब्रान्ड (Brand)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apple / Samsung / Vivo"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Status & Purchase Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    मौज्दात स्थिति (Status)
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    <option value="In Stock">In Stock (मौज्दात उपलब्ध)</option>
                    <option value="Sold">Sold (बिक्री भएको)</option>
                    <option value="Under Repair">Under Repair (मर्मतमा रहेको)</option>
                    <option value="Reserved">Reserved (बुक गरिएको)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    खरिद लागत (Cost Price - Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 135000"
                    value={formPurchaseCost}
                    onChange={(e) => setFormPurchaseCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Purchase Bill & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    खरिद बिल नं (Purchase Bill No)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PUR-2024-089"
                    value={formPurchaseBill}
                    onChange={(e) => setFormPurchaseBill(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    सप्लायर / स्रोत (Supplier)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Generation Next / Distributor"
                    value={formSupplierName}
                    onChange={(e) => setFormSupplierName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              {/* Sales Invoice & Customer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    बिक्री इनभ्वाइस नं (Sales Invoice)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-1045"
                    value={formSalesInvoice}
                    onChange={(e) => setFormSalesInvoice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ग्राहकको नाम (Customer Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Thapa"
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  कैफियत / टिप्पणी (Notes)
                </label>
                <input
                  type="text"
                  placeholder="e.g. With 1 year official brand warranty, sealed pack"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  रद्द गर्नुहोस् (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {editingItem ? 'विवरण अद्यावधिक गर्नुहोस् (Save Changes)' : 'भण्डारणमा सुरक्षित गर्नुहोस् (Save to Vault)'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CAMERA BARCODE / IMEI SCANNER MODAL */}
      <BarcodeScannerModal
        isOpen={scannerTarget !== null}
        onClose={() => setScannerTarget(null)}
        onScan={handleBarcodeScanned}
        title={
          scannerTarget === 'search'
            ? 'IMEI बारकोड स्क्यानर (Search Handset)'
            : scannerTarget === 'formSecondary'
            ? 'Secondary IMEI स्क्यानर'
            : 'IMEI बारकोड स्क्यानर'
        }
        subtitle="मोबाइल क्यामरालाई फोनको बक्स वा बारकोडमा देखाउनुहोस्"
        placeholderText="IMEI वा बारकोड नम्बर प्रविष्ट गर्नुहोस्..."
      />

    </div>
  );
};
