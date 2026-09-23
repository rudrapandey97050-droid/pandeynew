import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  RefreshCw,
  Smartphone,
  Headphones,
  CheckCircle2,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { RateListItem } from '../../types.ts';
import { formatNPR } from '../../utils/formatters.ts';
import { DataStorageService } from '../../services/dataStorage.ts';

interface ExcelPriceListManagerProps {
  rateList: RateListItem[];
  onRateListChange: () => void;
}

export const ExcelPriceListManager: React.FC<ExcelPriceListManagerProps> = ({
  rateList,
  onRateListChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'All' | 'Smartphone' | 'Accessories'>('All');
  const [selectedConditionFilter, setSelectedConditionFilter] = useState<'All' | 'New' | 'Pre-Owned'>('All');

  const [editingItem, setEditingItem] = useState<RateListItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [category, setCategory] = useState<'Smartphone' | 'Accessories'>('Smartphone');
  const [conditionType, setConditionType] = useState<'New' | 'Pre-Owned'>('Pre-Owned');
  const [model, setModel] = useState('');
  const [brand, setBrand] = useState('Apple');
  const [storage, setStorage] = useState('128GB');
  const [conditionDetails, setConditionDetails] = useState('Grade A (88%+ Battery)');
  const [batteryHealth, setBatteryHealth] = useState('88-95%');
  const [sellingPrice, setSellingPrice] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [warranty, setWarranty] = useState('15 Days Store Warranty');
  const [status, setStatus] = useState<RateListItem['status']>('In Stock');

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

  const startAdd = () => {
    setEditingItem(null);
    setCategory('Smartphone');
    setConditionType('Pre-Owned');
    setModel('');
    setBrand('Apple');
    setStorage('128GB');
    setConditionDetails('Grade A');
    setBatteryHealth('85-90%');
    setSellingPrice('');
    setMarketPrice('');
    setWarranty('15 Days Store Warranty');
    setStatus('In Stock');
    setIsAdding(true);
  };

  const startEdit = (item: RateListItem) => {
    const itemPreOwned = isPreOwned(item);
    const itemAccessory = isAccessory(item);

    setEditingItem(item);
    setCategory(itemAccessory ? 'Accessories' : 'Smartphone');
    setConditionType(itemPreOwned ? 'Pre-Owned' : 'New');
    setModel(item.model);
    setBrand(item.brand || 'Apple');
    setStorage(item.storage || (itemAccessory ? 'Standard' : '128GB'));
    setConditionDetails(item.condition || (itemPreOwned ? 'Pre-Owned' : 'Brand New'));
    setBatteryHealth(item.batteryHealth || '');
    setSellingPrice(item.sellingPrice.toString());
    setMarketPrice(item.marketPrice ? item.marketPrice.toString() : '');
    setWarranty(item.warranty || (itemPreOwned ? '15 Days Store Warranty' : '1 Year Official Warranty'));
    setStatus(item.status || 'In Stock');
    setIsAdding(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(sellingPrice);
    if (!model || isNaN(priceNum)) {
      alert('Please fill a valid model name and selling price');
      return;
    }

    const current = DataStorageService.getManualRateList();
    const computedCondition = conditionType === 'New' 
      ? (conditionDetails.toLowerCase().includes('new') ? conditionDetails : 'Brand New Sealed') 
      : (conditionDetails || 'Pre-Owned');

    if (editingItem) {
      // Check if it exists in manual list
      const existsInManual = current.some(i => i.id === editingItem.id);
      let updated: RateListItem[];

      if (existsInManual) {
        updated = current.map(item => {
          if (item.id === editingItem.id) {
            return {
              ...item,
              category,
              model,
              brand,
              storage: category === 'Accessories' ? (storage || 'Standard') : storage,
              condition: computedCondition,
              batteryHealth: conditionType === 'Pre-Owned' && category === 'Smartphone' ? batteryHealth : undefined,
              sellingPrice: priceNum,
              marketPrice: marketPrice ? parseFloat(marketPrice) : undefined,
              warranty,
              status,
              updatedAt: new Date().toISOString().split('T')[0]
            };
          }
          return item;
        });
      } else {
        // Was from products or generated, save as explicit manual entry override
        const updatedItem: RateListItem = {
          id: editingItem.id,
          category,
          model,
          brand,
          storage: category === 'Accessories' ? (storage || 'Standard') : storage,
          condition: computedCondition,
          batteryHealth: conditionType === 'Pre-Owned' && category === 'Smartphone' ? batteryHealth : undefined,
          sellingPrice: priceNum,
          marketPrice: marketPrice ? parseFloat(marketPrice) : undefined,
          warranty,
          status,
          updatedAt: new Date().toISOString().split('T')[0]
        };
        updated = [updatedItem, ...current];
      }
      DataStorageService.saveRateList(updated);
    } else {
      const newItem: RateListItem = {
        id: `rate-${Date.now()}`,
        category,
        model,
        brand,
        storage: category === 'Accessories' ? (storage || 'Standard') : storage,
        condition: computedCondition,
        batteryHealth: conditionType === 'Pre-Owned' && category === 'Smartphone' ? batteryHealth : undefined,
        sellingPrice: priceNum,
        marketPrice: marketPrice ? parseFloat(marketPrice) : undefined,
        warranty,
        status,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      current.unshift(newItem);
      DataStorageService.saveRateList(current);
    }

    setIsAdding(false);
    setEditingItem(null);
    onRateListChange();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this rate list entry?')) {
      const current = DataStorageService.getManualRateList().filter(i => i.id !== id);
      DataStorageService.saveRateList(current);
      onRateListChange();
    }
  };

  // Filter the full live rate list
  const filtered = rateList.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      item.model.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      (item.storage || '').toLowerCase().includes(q) ||
      (item.condition || '').toLowerCase().includes(q);

    const itemIsAccessory = isAccessory(item);
    const matchesCategory = 
      selectedCategoryFilter === 'All' ||
      (selectedCategoryFilter === 'Accessories' && itemIsAccessory) ||
      (selectedCategoryFilter === 'Smartphone' && !itemIsAccessory);

    const itemIsPreOwned = isPreOwned(item);
    const matchesCondition = 
      selectedConditionFilter === 'All' ||
      (selectedConditionFilter === 'Pre-Owned' && itemIsPreOwned) ||
      (selectedConditionFilter === 'New' && !itemIsPreOwned);

    return matchesSearch && matchesCategory && matchesCondition;
  });

  const smartphonesCount = rateList.filter(i => !isAccessory(i)).length;
  const accessoriesCount = rateList.filter(i => isAccessory(i)).length;
  const newCount = rateList.filter(i => !isPreOwned(i)).length;
  const preOwnedCount = rateList.filter(i => isPreOwned(i)).length;

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Live Rate List Manager (Smartphones & Accessories)</h3>
            <p className="text-xs text-slate-500">
              Manage live retail price sheet for both New and Pre-Owned items shown across the storefront
            </p>
          </div>
        </div>

        <button
          onClick={startAdd}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Rate Entry</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rate sheet by model, brand, storage, condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('All')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedCategoryFilter === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items ({rateList.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('Smartphone')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                selectedCategoryFilter === 'Smartphone' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Smartphones ({smartphonesCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('Accessories')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                selectedCategoryFilter === 'Accessories' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Accessories ({accessoriesCount})</span>
            </button>
          </div>
        </div>

        {/* Condition Filter */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] flex items-center space-x-1">
            <Tag className="w-3 h-3" />
            <span>Condition Filter:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedConditionFilter('All')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
              selectedConditionFilter === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setSelectedConditionFilter('New')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 ${
              selectedConditionFilter === 'New' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Brand New ({newCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedConditionFilter('Pre-Owned')}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 ${
              selectedConditionFilter === 'Pre-Owned' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-900 border border-amber-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Pre-Owned ({preOwnedCount})</span>
          </button>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Item & Brand</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Storage / Spec</th>
                <th className="py-3.5 px-4">Condition & Battery</th>
                <th className="py-3.5 px-4">Store Price</th>
                <th className="py-3.5 px-4">Market Price</th>
                <th className="py-3.5 px-4">Warranty</th>
                <th className="py-3.5 px-4">Stock Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No items in rate list match your search or filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const itemPreOwned = isPreOwned(item);
                  const itemAccessory = isAccessory(item);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            itemAccessory ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {itemAccessory ? <Headphones className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{item.model}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-medium">{item.brand}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          itemAccessory ? 'bg-purple-50 text-purple-800 border border-purple-200' : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        }`}>
                          {itemAccessory ? 'Accessory' : 'Smartphone'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                          {item.storage || '-'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            itemPreOwned ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                          }`}>
                            {itemPreOwned ? 'Pre-Owned' : 'Brand New'}
                          </span>
                          {item.condition && item.condition !== 'New' && item.condition !== 'Pre-Owned' && (
                            <span className="text-[10px] text-slate-500">{item.condition}</span>
                          )}
                          {item.batteryHealth && (
                            <span className="text-[10px] text-emerald-700 font-bold">🔋 {item.batteryHealth}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-indigo-700 block">{formatNPR(item.sellingPrice)}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-400 line-through">
                          {item.marketPrice ? formatNPR(item.marketPrice) : '-'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] text-slate-600 block">{item.warranty || (itemPreOwned ? '15 Days Store Warranty' : '1 Year Official')}</span>
                      </td>

                      <td className="py-3 px-4">
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

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => startEdit(item)}
                            title="Edit entry"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Delete entry"
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {editingItem ? 'Edit Rate Sheet Entry' : 'Add New Rate Sheet Entry'}
                </h3>
              </div>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              {/* Category & Condition Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as 'Smartphone' | 'Accessories')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="Smartphone">📱 Smartphone</option>
                    <option value="Accessories">🎧 Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Item State *</label>
                  <select
                    value={conditionType}
                    onChange={(e) => {
                      const ct = e.target.value as 'New' | 'Pre-Owned';
                      setConditionType(ct);
                      if (ct === 'New') {
                        setConditionDetails('Brand New Sealed Pack');
                        setWarranty('1 Year Official Brand Warranty');
                      } else {
                        setConditionDetails('Grade A (88%+ Battery)');
                        setWarranty('15 Days Store Warranty');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="New">✨ Brand New (Sealed Pack)</option>
                    <option value="Pre-Owned">🔄 Pre-Owned / Certified Used</option>
                  </select>
                </div>
              </div>

              {/* Model Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Model / Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder={category === 'Accessories' ? 'e.g., Apple 20W USB-C Power Adapter, AirPods Pro 2' : 'e.g., iPhone 15 Pro, Galaxy S24 Ultra'}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={brand}
                    placeholder="Apple, Samsung, etc."
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {category === 'Accessories' ? 'Spec / Variant' : 'Storage'}
                  </label>
                  <input
                    type="text"
                    value={storage}
                    placeholder={category === 'Accessories' ? 'Original / Type-C' : '128GB, 256GB'}
                    onChange={(e) => setStorage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Our Store Selling Price (NPR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 75000"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Market Price (NPR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 95000"
                    value={marketPrice}
                    onChange={(e) => setMarketPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Condition Description</label>
                  <input
                    type="text"
                    value={conditionDetails}
                    placeholder="e.g. Grade A, Like New, Sealed"
                    onChange={(e) => setConditionDetails(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Battery Health (Optional)</label>
                  <input
                    type="text"
                    value={batteryHealth}
                    placeholder="e.g. 88%, 100%, or leave blank"
                    onChange={(e) => setBatteryHealth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Warranty</label>
                  <input
                    type="text"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as RateListItem['status'])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Limited">Limited Stock</option>
                    <option value="Coming Soon">Coming Soon</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
