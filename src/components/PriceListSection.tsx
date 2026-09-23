import React, { useState } from 'react';
import { FileSpreadsheet, Search, CheckCircle2, ShieldCheck, RefreshCw, Smartphone, Headphones, ArrowRight, Tag } from 'lucide-react';
import { RateListItem } from '../types.ts';
import { formatNPR } from '../utils/formatters.ts';
import { DataStorageService } from '../services/dataStorage.ts';

interface PriceListSectionProps {
  rateList: RateListItem[];
  onOpenValuationModal: () => void;
}

export const PriceListSection: React.FC<PriceListSectionProps> = ({
  rateList: initialRateList,
  onOpenValuationModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Smartphone' | 'Accessories'>('All');
  const [selectedCondition, setSelectedCondition] = useState<'All' | 'New' | 'Pre-Owned'>('All');
  const [filterBrand, setFilterBrand] = useState('All');

  // Fetch unified rate list (contains both manual entries and store products: smartphones + accessories)
  const rateList = DataStorageService.getRateList() || initialRateList;

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

  const filtered = rateList.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchSearch = 
      item.model.toLowerCase().includes(q) || 
      item.brand.toLowerCase().includes(q) || 
      (item.storage || '').toLowerCase().includes(q) ||
      (item.condition || '').toLowerCase().includes(q);

    const matchBrand = filterBrand === 'All' || item.brand.toLowerCase() === filterBrand.toLowerCase();

    const itemIsAccessory = isAccessory(item);
    const matchCategory = 
      selectedCategory === 'All' ||
      (selectedCategory === 'Accessories' && itemIsAccessory) ||
      (selectedCategory === 'Smartphone' && !itemIsAccessory);

    const itemIsPreOwned = isPreOwned(item);
    const matchCondition = 
      selectedCondition === 'All' ||
      (selectedCondition === 'Pre-Owned' && itemIsPreOwned) ||
      (selectedCondition === 'New' && !itemIsPreOwned);

    return matchSearch && matchBrand && matchCategory && matchCondition;
  });

  const availableBrands = ['All', 'Apple', 'Samsung', 'Vivo', 'POCO', 'HONOR', 'Redmi'];

  return (
    <section id="rate-list-section" className="py-12 bg-white border-t border-slate-200 relative scroll-mt-16">
      <div id="rates" className="absolute -top-20 left-0" />
      <div id="price-list" className="absolute -top-20 left-0" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Smartphones & Accessories Price List • Butwal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
              Live Rate List (New & Pre-Owned)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real-time store prices for brand new sealed packs, certified pre-owned smartphones, and authentic accessories.
            </p>
          </div>

          <button
            onClick={onOpenValuationModal}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-amber-600" />
            <span>Exchange or Sell Your Model</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search rate sheet by model name, storage, accessory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Category selection */}
            <div className="flex items-center space-x-1.5 w-full md:w-auto bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  selectedCategory === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Items ({rateList.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('Smartphone')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                  selectedCategory === 'Smartphone' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Smartphones</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('Accessories')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                  selectedCategory === 'Accessories' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Accessories</span>
              </button>
            </div>
          </div>

          {/* Condition & Brand Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 text-xs">
            {/* Condition Filters */}
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Condition:</span>
              <button
                type="button"
                onClick={() => setSelectedCondition('All')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                  selectedCondition === 'All' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedCondition('New')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 ${
                  selectedCondition === 'New' 
                    ? 'bg-emerald-700 text-white' 
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Brand New</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCondition('Pre-Owned')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 ${
                  selectedCondition === 'Pre-Owned' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-amber-50 border border-amber-200 text-amber-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Pre-Owned</span>
              </button>
            </div>

            {/* Brand Filter */}
            <div className="flex items-center space-x-1 overflow-x-auto">
              {availableBrands.map(b => (
                <button
                  key={b}
                  onClick={() => setFilterBrand(b)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    filterBrand === b
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rate Sheet Table */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Model & Brand</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Storage / Spec</th>
                  <th className="py-3.5 px-4">Condition & Battery</th>
                  <th className="py-3.5 px-4">Our Store Price</th>
                  <th className="py-3.5 px-4">Market Rate</th>
                  <th className="py-3.5 px-4">Warranty</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No smartphone or accessory found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const itemPreOwned = isPreOwned(item);
                    const itemAccessory = isAccessory(item);

                    return (
                      <tr key={item.id} className="hover:bg-white transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              itemAccessory ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {itemAccessory ? <Headphones className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{item.model}</span>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">{item.brand}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            itemAccessory ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {itemAccessory ? 'Accessory' : 'Smartphone'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold px-2 py-0.5 bg-slate-200/80 text-slate-800 rounded-md text-[11px]">
                            {item.storage || '-'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              itemPreOwned 
                                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}>
                              {itemPreOwned ? 'Pre-Owned' : 'Brand New'}
                            </span>
                            {item.condition && item.condition !== 'New' && item.condition !== 'Pre-Owned' && (
                              <span className="text-[10px] text-slate-500 font-medium">{item.condition}</span>
                            )}
                            {item.batteryHealth && (
                              <span className="text-[10px] text-emerald-700 font-bold">🔋 {item.batteryHealth}</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-sm font-black text-indigo-700 block">{formatNPR(item.sellingPrice)}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-slate-400 line-through text-xs">
                            {item.marketPrice ? formatNPR(item.marketPrice) : '-'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[11px] text-slate-600 block">{item.warranty || 'Store Warranty'}</span>
                        </td>

                        <td className="py-3.5 px-4">
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

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={onOpenValuationModal}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            Trade In
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
};

