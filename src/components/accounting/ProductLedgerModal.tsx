import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  Search,
  Filter,
  Calendar,
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  TrendingUp,
  DollarSign,
  Smartphone,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { Product } from '../../types.ts';
import { ProductLedgerEntry, ProductLedgerSummary } from '../../types/accounting.ts';
import { AccountingStorageService } from '../../services/accountingStorage.ts';

interface ProductLedgerModalProps {
  productId: string;
  allProducts: Product[];
  onSelectProduct?: (productId: string) => void;
  onClose: () => void;
}

export const ProductLedgerModal: React.FC<ProductLedgerModalProps> = ({
  productId,
  allProducts,
  onSelectProduct,
  onClose
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(productId);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const settings = AccountingStorageService.getSettings();

  // Load ledger summary for selected product
  const ledger: ProductLedgerSummary | null = useMemo(() => {
    return AccountingStorageService.getProductLedger(selectedProductId);
  }, [selectedProductId]);

  const currentProduct = useMemo(() => {
    return allProducts.find(p => p.id === selectedProductId);
  }, [allProducts, selectedProductId]);

  const handleProductChange = (newId: string) => {
    setSelectedProductId(newId);
    if (onSelectProduct) {
      onSelectProduct(newId);
    }
  };

  // Filter entries
  const filteredEntries = useMemo(() => {
    if (!ledger) return [];
    let list = [...ledger.entries];

    // Type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'purchase') {
        list = list.filter(e => e.type === 'Purchase Inward' || e.type === 'Opening Stock');
      } else if (typeFilter === 'sales') {
        list = list.filter(e => e.type === 'Sales Outward');
      } else if (typeFilter === 'returns') {
        list = list.filter(e => e.type.includes('Return'));
      }
    }

    // Date range filter
    const todayStr = new Date().toISOString().slice(0, 10);
    const thisMonthStr = todayStr.slice(0, 7);

    if (dateRange === 'today') {
      list = list.filter(e => e.date === todayStr);
    } else if (dateRange === 'month') {
      list = list.filter(e => e.date.startsWith(thisMonthStr));
    } else if (dateRange === 'custom') {
      if (startDate) list = list.filter(e => e.date >= startDate);
      if (endDate) list = list.filter(e => e.date <= endDate);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        e.refNumber.toLowerCase().includes(q) ||
        e.partyName.toLowerCase().includes(q) ||
        (e.imei && e.imei.toLowerCase().includes(q)) ||
        (e.remarks && e.remarks.toLowerCase().includes(q)) ||
        e.type.toLowerCase().includes(q)
      );
    }

    return list;
  }, [ledger, typeFilter, dateRange, startDate, endDate, searchQuery]);

  // Aggregates for the filtered entries
  const filteredStats = useMemo(() => {
    const totalInQty = filteredEntries.reduce((acc, e) => acc + e.inwardQty, 0);
    const totalInVal = filteredEntries.reduce((acc, e) => acc + e.inwardTotal, 0);
    const totalOutQty = filteredEntries.reduce((acc, e) => acc + e.outwardQty, 0);
    const totalOutVal = filteredEntries.reduce((acc, e) => acc + e.outwardTotal, 0);
    const totalProfit = filteredEntries.reduce((acc, e) => acc + (e.profitEarned || 0), 0);
    return { totalInQty, totalInVal, totalOutQty, totalOutVal, totalProfit };
  }, [filteredEntries]);

  // Handle Printing
  const handlePrint = () => {
    window.print();
  };

  // Handle Export to CSV
  const handleExportCSV = () => {
    if (!ledger) return;
    const headers = [
      'Date',
      'Transaction Type',
      'Voucher / Bill No',
      'Party Name',
      'IMEI / Serial',
      'Inward Qty',
      'Inward Rate (Rs.)',
      'Inward Total (Rs.)',
      'Outward Qty',
      'Outward Rate (Rs.)',
      'Outward Total (Rs.)',
      'Gross Profit (Rs.)',
      'Balance Qty',
      'Stock Value (Rs.)',
      'Remarks'
    ];

    const rows = filteredEntries.map(e => [
      `"${e.date}"`,
      `"${e.type}"`,
      `"${e.refNumber}"`,
      `"${e.partyName.replace(/"/g, '""')}"`,
      `"${e.imei || '-'}"`,
      e.inwardQty,
      e.inwardRate,
      e.inwardTotal,
      e.outwardQty,
      e.outwardRate,
      e.outwardTotal,
      e.profitEarned || 0,
      e.balanceQty,
      e.balanceValue,
      `"${(e.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Product_Ledger_${ledger.productName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!ledger) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center">
          <p className="text-slate-600 font-bold mb-4">उत्पादन फेला परेन (Product not found)</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
          >
            बन्द गर्नुहोस् (Close)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[96vh] flex flex-col border border-slate-200 overflow-hidden">
        
        {/* MODAL HEADER (Hidden during Print) */}
        <div className="px-5 py-3.5 bg-slate-950 text-white flex items-center justify-between shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                  PRODUCT STOCK LEDGER (सामान खाता / बिन कार्ड)
                </h3>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold font-mono rounded-full uppercase">
                  Item Account
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Complete inward/outward inventory movement, customer/supplier references & gross profit
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Export statement as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">CSV Export</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
              title="Print product ledger statement"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिन्ट (Print)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (Scrollable on screen, Full format in Print) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50 print:bg-white print:p-0 print:overflow-visible">
          
          {/* PRINT-ONLY OFFICIAL HEADER */}
          <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4 text-center">
            <h1 className="text-2xl font-black tracking-tight text-slate-950 font-serif">
              {settings.companyName || 'PANDEY MOBILE STORE'}
            </h1>
            <p className="text-xs text-slate-700">
              {settings.address || 'Milanchowk, Butwal, Rupandehi, Nepal'} • Phone: {settings.phone || '+977-9857012345'}
              {settings.panNumber ? ` • PAN/VAT: ${settings.panNumber}` : ''}
            </p>
            <div className="inline-block mt-2 px-3 py-0.5 bg-slate-900 text-white text-xs font-bold tracking-widest uppercase rounded-sm">
              PRODUCT STOCK LEDGER (सामान मौज्दात तथा कारोबार खाता)
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Printed on: {new Date().toLocaleString()} | Financial Year: {settings.financialYear}
            </p>
          </div>

          {/* PRODUCT SELECTOR & SUMMARY CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 print:border print:shadow-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Product Info & Switcher */}
              <div className="flex items-start sm:items-center space-x-3.5 flex-1 min-w-0">
                {currentProduct?.image ? (
                  <img
                    src={currentProduct.image}
                    alt={ledger.productName}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold shrink-0">
                    <Smartphone className="w-7 h-7" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md uppercase">
                      {ledger.brand}
                    </span>
                    {ledger.model && (
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold rounded-md">
                        {ledger.model}
                      </span>
                    )}
                    {currentProduct?.condition && (
                      <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-md">
                        {currentProduct.condition}
                      </span>
                    )}
                  </div>

                  {/* Product Title & Switcher dropdown */}
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                      {ledger.productName}
                    </h2>
                  </div>

                  {/* Switch Product Dropdown (Hidden during print) */}
                  <div className="mt-1.5 flex items-center gap-2 print:hidden">
                    <span className="text-xs text-slate-500 font-medium shrink-0">अर्को सामान छान्नुहोस्:</span>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductChange(e.target.value)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-indigo-500 max-w-xs truncate"
                    >
                      {allProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Price & Stock Overview Badges */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-4 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">बिक्री मूल्य (Selling)</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-indigo-700">
                    Rs. {ledger.sellingPrice.toLocaleString()}
                  </span>
                </div>

                <div className="h-7 w-px bg-slate-200 hidden sm:block" />

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">खरिद लागत (Cost)</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-slate-700">
                    Rs. {ledger.costPrice.toLocaleString()}
                  </span>
                </div>

                <div className="h-7 w-px bg-slate-200 hidden sm:block" />

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">हालको मौज्दात (Stock)</span>
                  <span className={`text-xs sm:text-sm font-black font-mono ${
                    ledger.currentStock > 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {ledger.currentStock} Units
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* 4 CORE KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Total Inward / Purchases */}
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-600">कुल दाखिला (Inward/Pur)</span>
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black font-mono text-slate-900">
                {ledger.totalInwardQty} <span className="text-xs font-normal text-slate-500">Units</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-mono font-medium mt-0.5">
                Rs. {ledger.totalInwardValue.toLocaleString()} लागत
              </p>
            </div>

            {/* Total Outward / Sales */}
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-blue-100 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-600">कुल निकासी (Outward/Sold)</span>
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black font-mono text-slate-900">
                {ledger.totalOutwardQty} <span className="text-xs font-normal text-slate-500">Units</span>
              </div>
              <p className="text-[11px] text-blue-700 font-mono font-medium mt-0.5">
                Rs. {ledger.totalOutwardValue.toLocaleString()} राजस्व
              </p>
            </div>

            {/* Total Gross Profit */}
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-purple-100 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-600">खुद नाफा (Gross Profit)</span>
                <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-lg sm:text-xl font-black font-mono ${
                ledger.totalGrossProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                Rs. {ledger.totalGrossProfit.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                {ledger.totalOutwardValue > 0
                  ? `Margin: ${((ledger.totalGrossProfit / ledger.totalOutwardValue) * 100).toFixed(1)}%`
                  : 'No sales yet'}
              </p>
            </div>

            {/* Current Stock Valuation */}
            <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-indigo-100 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-600">अन्तिम मौज्दात (Closing Stock)</span>
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black font-mono text-slate-900">
                {ledger.currentStock} <span className="text-xs font-normal text-slate-500">Units</span>
              </div>
              <p className="text-[11px] text-indigo-700 font-mono font-bold mt-0.5">
                Rs. {(ledger.currentStock * ledger.costPrice).toLocaleString()} मौज्दात मूल्य
              </p>
            </div>

          </div>

          {/* FILTERS & SEARCH TOOLBAR (Hidden during print) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 flex flex-wrap items-center justify-between gap-3 print:hidden">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search voucher, bill, party, IMEI, remarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Voucher Type Filter Pills */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                सबै ({ledger.entries.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('purchase')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  typeFilter === 'purchase' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                दाखिला (Inward)
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('sales')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  typeFilter === 'sales' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                निकासी (Outward)
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('returns')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  typeFilter === 'returns' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-purple-700'
                }`}
              >
                फिर्ता (Returns)
              </button>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center space-x-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>

              {dateRange === 'custom' && (
                <div className="flex items-center space-x-1.5">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              )}
            </div>

          </div>

          {/* LEDGER STATEMENT TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border print:shadow-none">
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                    <th className="py-3 px-3">मिति (Date)</th>
                    <th className="py-3 px-3">प्रकार (Type)</th>
                    <th className="py-3 px-3">भौचर / बिल नं. (Ref No.)</th>
                    <th className="py-3 px-3">सम्बन्धित पक्ष (Party / Account)</th>
                    <th className="py-3 px-3">IMEI / Serial</th>
                    <th className="py-3 px-3 text-right bg-emerald-950/40 text-emerald-300">दाखिला (Inward)</th>
                    <th className="py-3 px-3 text-right bg-blue-950/40 text-blue-300">निकासी (Outward)</th>
                    <th className="py-3 px-3 text-right bg-purple-950/40 text-purple-300">नाफा (Profit)</th>
                    <th className="py-3 px-3 text-right bg-slate-800 text-slate-200">मौज्दात (Balance)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">कुनै कारोबार रेकर्ड भेटिएन (No Transactions Found)</p>
                        <p className="text-xs text-slate-400 mt-1">
                          यो सामानको लागि छनौट गरिएको फिल्टरमा कुनै रेकर्ड छैन।
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry, idx) => {
                      const isInward = entry.inwardQty > 0;
                      const isOutward = entry.outwardQty > 0;
                      const isOpening = entry.type === 'Opening Stock';

                      return (
                        <tr
                          key={entry.id || idx}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          {/* Date */}
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-600 whitespace-nowrap">
                            {entry.date}
                          </td>

                          {/* Type Badge */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {isOpening ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                Opening Stock
                              </span>
                            ) : entry.type === 'Purchase Inward' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Purchase Inward
                              </span>
                            ) : entry.type === 'Sales Outward' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Sales Outward
                              </span>
                            ) : entry.type === 'Sales Return Inward' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Sales Return
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Purchase Return
                              </span>
                            )}
                          </td>

                          {/* Ref Number */}
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {entry.refNumber}
                          </td>

                          {/* Party Name */}
                          <td className="py-2.5 px-3 text-slate-800">
                            <span className="font-semibold block">{entry.partyName}</span>
                            {entry.remarks && (
                              <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                                {entry.remarks}
                              </span>
                            )}
                          </td>

                          {/* IMEI */}
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {entry.imei ? (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold border border-slate-200">
                                {entry.imei}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Inward (Qty & Total) */}
                          <td className="py-2.5 px-3 text-right font-mono bg-emerald-50/30">
                            {isInward ? (
                              <div>
                                <span className="font-bold text-emerald-800">+{entry.inwardQty}</span>
                                <span className="text-[10px] text-slate-500 block">
                                  @ Rs. {entry.inwardRate.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-bold block">
                                  Rs. {entry.inwardTotal.toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Outward (Qty & Total) */}
                          <td className="py-2.5 px-3 text-right font-mono bg-blue-50/30">
                            {isOutward ? (
                              <div>
                                <span className="font-bold text-blue-800">-{entry.outwardQty}</span>
                                <span className="text-[10px] text-slate-500 block">
                                  @ Rs. {entry.outwardRate.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-blue-700 font-bold block">
                                  Rs. {entry.outwardTotal.toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Gross Profit */}
                          <td className="py-2.5 px-3 text-right font-mono bg-purple-50/30">
                            {entry.profitEarned !== undefined ? (
                              <span className={`font-bold ${
                                entry.profitEarned >= 0 ? 'text-purple-800' : 'text-rose-600'
                              }`}>
                                Rs. {entry.profitEarned.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Closing Balance Qty & Valuation */}
                          <td className="py-2.5 px-3 text-right font-mono bg-slate-50 font-bold">
                            <span className="text-slate-900 text-xs">{entry.balanceQty} Units</span>
                            <span className="text-[10px] text-indigo-700 block font-normal">
                              Rs. {entry.balanceValue.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* TABLE FOOTER SUMMARY */}
                {filteredEntries.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-800">
                      <td colSpan={5} className="py-3 px-3 text-right font-bold uppercase text-[11px] text-slate-300">
                        कुल कारोबार जम्मा (Total Summary):
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-300 bg-emerald-950/60">
                        <div>+{filteredStats.totalInQty} Units</div>
                        <div className="text-[10px]">Rs. {filteredStats.totalInVal.toLocaleString()}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-blue-300 bg-blue-950/60">
                        <div>-{filteredStats.totalOutQty} Units</div>
                        <div className="text-[10px]">Rs. {filteredStats.totalOutVal.toLocaleString()}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-purple-300 bg-purple-950/60">
                        <div>Rs. {filteredStats.totalProfit.toLocaleString()}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-300 bg-slate-950">
                        <div>{ledger.currentStock} Units</div>
                        <div className="text-[10px]">Rs. {(ledger.currentStock * ledger.costPrice).toLocaleString()}</div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

          </div>

          {/* PRINT SIGNATURE BLOCK */}
          <div className="hidden print:block pt-12 mt-8 border-t border-slate-300 text-xs">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="border-t border-slate-400 pt-1 font-semibold">तयार गर्ने (Prepared By)</div>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1 font-semibold">स्टक प्रमुख (Store In-charge)</div>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1 font-semibold">प्रमाणित गर्ने (Authorized Signatory)</div>
              </div>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 print:hidden text-xs">
          <div className="text-slate-500 font-medium">
            कुल रेकर्डहरू: <b>{filteredEntries.length}</b> कारोबार • अन्तिम मौज्दात: <b>{ledger.currentStock} थान</b>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              बन्द गर्नुहोस् (Close)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
