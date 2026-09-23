import React, { useState } from 'react';
import { X, FileSpreadsheet, Search, RefreshCw, Smartphone, Headphones, Tag, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { RateListItem } from '../types.ts';
import { formatNPR } from '../utils/formatters.ts';
import { DataStorageService } from '../services/dataStorage.ts';

interface PriceListModalProps {
  rateList: RateListItem[];
  onClose: () => void;
  onOpenValuationModal: () => void;
}

export const PriceListModal: React.FC<PriceListModalProps> = ({
  rateList: initialRateList,
  onClose,
  onOpenValuationModal
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Smartphone' | 'Accessories'>('All');
  const [selectedCondition, setSelectedCondition] = useState<'All' | 'New' | 'Pre-Owned'>('All');

  // Always use the latest unified rate list from DataStorageService to ensure newly added smartphones & accessories appear instantly
  const activeRateList = DataStorageService.getRateList() || initialRateList;

  const isPreOwned = (item: RateListItem) => {
    const c = (item.condition || '').toLowerCase();
    return c.includes('pre-owned') || c.includes('used') || c.includes('grade') || c.includes('refurbished') || Boolean(item.batteryHealth);
  };

  const isAccessory = (item: RateListItem) => {
    const cat = (item.category || '').toLowerCase();
    const brand = (item.brand || '').toLowerCase();
    const model = (item.model || '').toLowerCase();
    return cat.includes('accessori') || brand.includes('accessori') || 
      model.includes('case') || model.includes('charger') || model.includes('cable') || 
      model.includes('airpod') || model.includes('buds') || model.includes('adapter') || 
      model.includes('guard') || model.includes('cover') || model.includes('power bank') ||
      model.includes('watch');
  };

  const filtered = activeRateList.filter(item => {
    const q = search.toLowerCase();
    const matchesSearch = 
      item.model.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      (item.storage || '').toLowerCase().includes(q) ||
      (item.condition || '').toLowerCase().includes(q);

    const itemIsAccessory = isAccessory(item);
    const matchesCategory = 
      selectedCategory === 'All' ||
      (selectedCategory === 'Accessories' && itemIsAccessory) ||
      (selectedCategory === 'Smartphone' && !itemIsAccessory);

    const itemIsPreOwned = isPreOwned(item);
    const matchesCondition = 
      selectedCondition === 'All' ||
      (selectedCondition === 'Pre-Owned' && itemIsPreOwned) ||
      (selectedCondition === 'New' && !itemIsPreOwned);

    return matchesSearch && matchesCategory && matchesCondition;
  });

  const smartphonesCount = activeRateList.filter(i => !isAccessory(i)).length;
  const accessoriesCount = activeRateList.filter(i => isAccessory(i)).length;
  const newCount = activeRateList.filter(i => !isPreOwned(i)).length;
  const preOwnedCount = activeRateList.filter(i => isPreOwned(i)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base font-serif">Smartphones & Accessories Rate List</h3>
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  LIVE RATES
                </span>
              </div>
              <p className="text-xs text-slate-400">Traffic Chowk, Butwal • Verified Store Prices for New & Pre-Owned Items</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          {/* Top row: Search & Category Tabs */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search smartphone or accessory model, brand, storage..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex items-center bg-slate-200/80 p-1 rounded-xl w-full md:w-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  selectedCategory === 'All'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>All Items</span>
                <span className="text-[10px] opacity-75 font-mono">({activeRateList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('Smartphone')}
                className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  selectedCategory === 'Smartphone'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Smartphones</span>
                <span className="text-[10px] opacity-75 font-mono">({smartphonesCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('Accessories')}
                className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  selectedCategory === 'Accessories'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Accessories</span>
                <span className="text-[10px] opacity-75 font-mono">({accessoriesCount})</span>
              </button>
            </div>
          </div>

          {/* Bottom row: Condition filter pills (New vs Pre-Owned) */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider flex items-center space-x-1 mr-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>Condition:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedCondition('All')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                selectedCondition === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              All ({activeRateList.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedCondition('New')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center space-x-1.5 ${
                selectedCondition === 'New'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Brand New ({newCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCondition('Pre-Owned')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center space-x-1.5 ${
                selectedCondition === 'Pre-Owned'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Pre-Owned / Used ({preOwnedCount})</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="p-4 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-sm font-bold text-slate-700">No items match your selected filters or search.</p>
              <button
                type="button"
                onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedCondition('All'); }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider sticky top-0">
                  <th className="py-2.5 px-3">Item / Model</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Storage / Spec</th>
                  <th className="py-2.5 px-3">Condition & Battery</th>
                  <th className="py-2.5 px-3">Store Price</th>
                  <th className="py-2.5 px-3">Warranty</th>
                  <th className="py-2.5 px-3">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map(item => {
                  const itemPreOwned = isPreOwned(item);
                  const itemAccessory = isAccessory(item);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            itemAccessory ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {itemAccessory ? <Headphones className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{item.model}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{item.brand}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          itemAccessory 
                            ? 'bg-purple-50 text-purple-800 border border-purple-200' 
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        }`}>
                          {itemAccessory ? 'Accessory' : 'Smartphone'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                          {item.storage || '-'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            itemPreOwned
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {itemPreOwned ? 'Pre-Owned' : 'Brand New'}
                          </span>
                          {item.condition && item.condition !== 'New' && item.condition !== 'Pre-Owned' && (
                            <span className="text-[10px] text-slate-500">{item.condition}</span>
                          )}
                          {item.batteryHealth && (
                            <span className="text-[10px] font-bold text-emerald-700">🔋 {item.batteryHealth}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div>
                          <span className="font-black text-indigo-700 text-sm block">{formatNPR(item.sellingPrice)}</span>
                          {item.marketPrice && item.marketPrice > item.sellingPrice && (
                            <span className="text-[10px] text-slate-400 line-through block">
                              {formatNPR(item.marketPrice)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-1 text-slate-600 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[130px]">{item.warranty || (itemPreOwned ? '15 Days Warranty' : '1 Year Official')}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'In Stock' || item.status === 'Available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'Limited' || item.status === 'Limited Stock'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {item.status || 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500">
            Want to sell, exchange, or trade-in your current smartphone or accessory?
          </p>
          <button
            onClick={() => {
              onClose();
              onOpenValuationModal();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Valuation & Exchange Desk</span>
          </button>
        </div>

      </div>
    </div>
  );
};

