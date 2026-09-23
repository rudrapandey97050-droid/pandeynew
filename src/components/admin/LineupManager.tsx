import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Smartphone,
  Check,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  Eye,
  EyeOff,
  Search,
  Save,
  RotateCcw,
  Sliders,
  ExternalLink,
  ChevronRight,
  Tag,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { Product, StoreSettings } from '../../types.ts';
import { DataStorageService } from '../../services/dataStorage.ts';
import { formatNPR } from '../../utils/formatters.ts';

interface LineupManagerProps {
  products: Product[];
  storeSettings: StoreSettings;
  onDataRefresh: () => void;
}

export const LineupManager: React.FC<LineupManagerProps> = ({
  products,
  storeSettings,
  onDataRefresh
}) => {
  // Lineup Banner Settings
  const [showBanner, setShowBanner] = useState<boolean>(storeSettings.showLineupBanner !== false);
  const [lineupTitle, setLineupTitle] = useState<string>(storeSettings.lineupTitle || 'Explore the iPhone Lineup');
  const [lineupSubtitle, setLineupSubtitle] = useState<string>(
    storeSettings.lineupSubtitle ||
      'Brand new seal pack with 1-Year Apple Nepal Warranty & certified pre-owned phones with testing guarantee. Rates controlled live by Pandey Mobile.'
  );

  // Identify Hero product
  const heroProductId = useMemo(() => {
    if (storeSettings.lineupHeroProductId) {
      const found = products.find(p => p.id === storeSettings.lineupHeroProductId);
      if (found) return found.id;
    }
    const heroProd = products.find(p => p.isLineupHero);
    if (heroProd) return heroProd.id;
    const appleHero = products.find(p => p.id === 'apple-iphone-16-pro-max' || p.name.includes('16 Pro Max'));
    return appleHero?.id || products[0]?.id || '';
  }, [storeSettings.lineupHeroProductId, products]);

  const [selectedHeroId, setSelectedHeroId] = useState<string>(heroProductId);
  const [heroTagline, setHeroTagline] = useState<string>(() => {
    const p = products.find(prod => prod.id === heroProductId);
    return p?.lineupTagline || 'Titanium • A18 Pro • Camera Control';
  });
  const [heroBadge, setHeroBadge] = useState<string>(() => {
    const p = products.find(prod => prod.id === heroProductId);
    return p?.lineupBadge || 'Built for Apple Intelligence';
  });

  // Lineup items list (sorted)
  const currentLineupItems = useMemo(() => {
    // If storeSettings.lineupProductIds has values
    if (storeSettings.lineupProductIds && storeSettings.lineupProductIds.length > 0) {
      const matched = storeSettings.lineupProductIds
        .map(id => products.find(p => p.id === id))
        .filter((p): p is Product => !!p);
      if (matched.length > 0) return matched;
    }
    // Otherwise products with isLineupItem
    const items = products.filter(p => p.isLineupItem && p.id !== selectedHeroId);
    if (items.length > 0) {
      return items.sort((a, b) => (a.lineupOrder || 99) - (b.lineupOrder || 99));
    }
    // Fallback to top Apple products
    return products.filter(p => (p.brand === 'Apple' || p.category === 'iPhone') && p.id !== selectedHeroId).slice(0, 4);
  }, [products, storeSettings.lineupProductIds, selectedHeroId]);

  const [lineupItems, setLineupItems] = useState<Product[]>(currentLineupItems);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerBrand, setPickerBrand] = useState('All');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Sync state if external products or settings change
  const currentHero = useMemo(() => {
    return products.find(p => p.id === selectedHeroId) || products[0];
  }, [products, selectedHeroId]);

  // Handle saving all lineup configurations
  const handleSaveLineup = () => {
    // 1. Update StoreSettings
    const updatedSettings: StoreSettings = {
      ...storeSettings,
      showLineupBanner: showBanner,
      lineupTitle: lineupTitle.trim() || 'Explore the iPhone Lineup',
      lineupSubtitle: lineupSubtitle.trim(),
      lineupHeroProductId: selectedHeroId,
      lineupProductIds: lineupItems.map(p => p.id)
    };
    DataStorageService.saveStoreSettings(updatedSettings);

    // 2. Update Products
    const allProducts = DataStorageService.getProducts();
    const updatedProducts = allProducts.map(p => {
      if (p.id === selectedHeroId) {
        return {
          ...p,
          isLineupHero: true,
          isLineupItem: true,
          lineupOrder: 0,
          lineupTagline: heroTagline.trim(),
          lineupBadge: heroBadge.trim()
        };
      }
      const lineupIndex = lineupItems.findIndex(item => item.id === p.id);
      if (lineupIndex !== -1) {
        const itemState = lineupItems[lineupIndex];
        return {
          ...p,
          isLineupHero: false,
          isLineupItem: true,
          lineupOrder: lineupIndex + 1,
          lineupTagline: itemState.lineupTagline || p.lineupTagline,
          lineupBadge: itemState.lineupBadge || p.lineupBadge
        };
      }
      return {
        ...p,
        isLineupHero: false,
        isLineupItem: false
      };
    });

    DataStorageService.saveProducts(updatedProducts);
    onDataRefresh();

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Quick reset to default Apple Lineup
  const handleResetDefaults = () => {
    if (window.confirm('Reset lineup showcase to official Apple default models (iPhone 16 Pro Max Hero + 16 Pro, 16, 15, 14)?')) {
      const apple16ProMax = products.find(p => p.id === 'apple-iphone-16-pro-max' || p.name.includes('16 Pro Max')) || products[0];
      const defaultLineup = products
        .filter(p => (p.brand === 'Apple' || p.category === 'iPhone') && p.id !== apple16ProMax?.id)
        .slice(0, 4);

      if (apple16ProMax) {
        setSelectedHeroId(apple16ProMax.id);
        setHeroTagline('Titanium • A18 Pro • Camera Control');
        setHeroBadge('Built for Apple Intelligence');
      }
      setShowBanner(true);
      setLineupTitle('Explore the iPhone Lineup');
      setLineupSubtitle('Brand new seal pack with 1-Year Apple Nepal Warranty & certified pre-owned phones with testing guarantee. Rates controlled live by Pandey Mobile.');
      setLineupItems(defaultLineup);

      // Save immediately
      const updatedSettings: StoreSettings = {
        ...storeSettings,
        showLineupBanner: true,
        lineupTitle: 'Explore the iPhone Lineup',
        lineupSubtitle: 'Brand new seal pack with 1-Year Apple Nepal Warranty & certified pre-owned phones with testing guarantee. Rates controlled live by Pandey Mobile.',
        lineupHeroProductId: apple16ProMax?.id,
        lineupProductIds: defaultLineup.map(p => p.id)
      };
      DataStorageService.saveStoreSettings(updatedSettings);

      const allProducts = DataStorageService.getProducts();
      const updatedProducts = allProducts.map(p => {
        if (p.id === apple16ProMax?.id) {
          return {
            ...p,
            isLineupHero: true,
            isLineupItem: true,
            lineupOrder: 0,
            lineupTagline: 'Titanium • A18 Pro • Camera Control',
            lineupBadge: 'Built for Apple Intelligence'
          };
        }
        const index = defaultLineup.findIndex(d => d.id === p.id);
        if (index !== -1) {
          return {
            ...p,
            isLineupHero: false,
            isLineupItem: true,
            lineupOrder: index + 1
          };
        }
        return {
          ...p,
          isLineupHero: false,
          isLineupItem: false
        };
      });

      DataStorageService.saveProducts(updatedProducts);
      onDataRefresh();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Reordering helpers
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...lineupItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setLineupItems(newItems);
  };

  const removeItem = (id: string) => {
    setLineupItems(prev => prev.filter(item => item.id !== id));
  };

  const addItemToLineup = (product: Product) => {
    if (lineupItems.some(item => item.id === product.id)) return;
    if (product.id === selectedHeroId) {
      alert('This device is already selected as the Main Hero. Choose another device or change the hero first.');
      return;
    }
    setLineupItems(prev => [...prev, product]);
    setIsAddModalOpen(false);
  };

  const updateItemTagline = (id: string, tagline: string) => {
    setLineupItems(prev =>
      prev.map(item => (item.id === id ? { ...item, lineupTagline: tagline } : item))
    );
  };

  const updateItemBadge = (id: string, badge: string) => {
    setLineupItems(prev =>
      prev.map(item => (item.id === id ? { ...item, lineupBadge: badge } : item))
    );
  };

  const setAsHero = (product: Product) => {
    const prevHeroId = selectedHeroId;
    setSelectedHeroId(product.id);
    setHeroTagline(product.lineupTagline || `${product.brand} Flagship`);
    setHeroBadge(product.lineupBadge || 'Featured Device');

    // Replace hero in lineup items with old hero
    const prevHero = products.find(p => p.id === prevHeroId);
    setLineupItems(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      if (prevHero && !filtered.some(p => p.id === prevHero.id)) {
        return [prevHero, ...filtered];
      }
      return filtered;
    });
  };

  // Available products for the picker modal
  const availablePickerProducts = useMemo(() => {
    return products.filter(p => {
      if (p.id === selectedHeroId) return false;
      if (lineupItems.some(item => item.id === p.id)) return false;
      if (pickerBrand !== 'All' && p.brand !== pickerBrand) return false;
      if (pickerSearch.trim()) {
        const q = pickerSearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          (p.model && p.model.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [products, selectedHeroId, lineupItems, pickerBrand, pickerSearch]);

  const allBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set);
  }, [products]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* Top Banner & Action Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-extrabold text-indigo-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Storefront Visual Curation</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif">
            Homepage Lineup Item Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Customize the prominent &ldquo;Explore the iPhone Lineup&rdquo; showcase banner on your homepage. Select the hero flagship, order mini comparison cards, and edit live taglines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Reset to official Apple Nepal lineup defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              previewMode
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{previewMode ? 'Hide Live Preview' : 'Show Live Preview'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveLineup}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Changes</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-sm animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              Lineup showcase settings saved successfully! Storefront has been updated across all open devices.
            </span>
          </div>
          <button
            onClick={() => setSavedSuccess(false)}
            className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Live Storefront Preview (Toggleable) */}
      {previewMode && (
        <div className="bg-[#000000] text-white rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
              <Eye className="w-4 h-4" />
              <span>LIVE HOMEPAGE STOREFRONT PREVIEW</span>
            </div>
            <span className="text-xs text-white/50">
              {showBanner ? 'Banner is VISIBLE to customers' : 'Banner is currently HIDDEN from customers'}
            </span>
          </div>

          {!showBanner ? (
            <div className="text-center py-10 text-slate-400">
              <EyeOff className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-medium">The Lineup Showcase Banner is turned OFF.</p>
              <p className="text-xs text-slate-500 mt-1">Enable it below to display on the storefront.</p>
            </div>
          ) : (
            <>
              {/* Preview Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span className="inline-flex items-center space-x-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{heroBadge || 'Built for Apple Intelligence'}</span>
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                    {lineupTitle || 'Explore the iPhone Lineup'}
                  </h3>
                </div>
                <p className="text-xs text-[#86868b] max-w-sm">{lineupSubtitle}</p>
              </div>

              {/* Preview Hero */}
              {currentHero && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-gradient-to-b from-[#161617] to-[#121212] rounded-2xl p-6 border border-white/10">
                  <div className="md:col-span-7 space-y-3">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                      {heroTagline || 'Titanium • A18 Pro • Camera Control'}
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-black text-white">{currentHero.name}</h4>
                    <p className="text-xs text-[#a1a1a6] line-clamp-2">
                      {currentHero.description || 'Premium flagship with high-end cameras and peak performance.'}
                    </p>
                    <div className="text-xl sm:text-2xl font-black text-white">
                      From {formatNPR(currentHero.price)}
                    </div>
                  </div>
                  <div className="md:col-span-5 flex justify-center">
                    <img
                      src={currentHero.image}
                      alt={currentHero.name}
                      className="max-h-48 object-contain drop-shadow-xl"
                    />
                  </div>
                </div>
              )}

              {/* Preview Mini Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {lineupItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-[#161617] border border-white/10 rounded-xl p-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="h-24 flex items-center justify-center">
                        <img src={item.image} alt={item.name} className="h-full object-contain" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block truncate">
                          {item.lineupBadge || (item.condition === 'New' ? 'Brand New' : 'Pre-Owned')}
                        </span>
                        <p className="font-bold text-xs text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-[#86868b] truncate">
                          {item.lineupTagline || item.specs?.processor || item.storage || 'Official Nepal Stock'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/10 font-bold text-xs text-white">
                      {formatNPR(item.price)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Grid: Lineup Banner Toggle & General Titles */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>1. Lineup Showcase Visibility & Texts</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control whether this section appears on the homepage and customize its heading.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showBanner}
              onChange={e => setShowBanner(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            <span className="ml-3 text-xs font-bold text-slate-700">
              {showBanner ? 'Show on Homepage' : 'Hidden from Homepage'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Lineup Section Title
            </label>
            <input
              type="text"
              value={lineupTitle}
              onChange={e => setLineupTitle(e.target.value)}
              placeholder="Explore the iPhone Lineup"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-xs sm:text-sm text-slate-900 bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default: &ldquo;Explore the iPhone Lineup&rdquo;</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Lineup Description / Nepal Guarantee Notice
            </label>
            <input
              type="text"
              value={lineupSubtitle}
              onChange={e => setLineupSubtitle(e.target.value)}
              placeholder="Brand new seal pack with 1-Year Apple Nepal Warranty..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-xs sm:text-sm text-slate-900 bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">Displayed in the banner header next to the title</p>
          </div>
        </div>
      </div>

      {/* 2. Main Flagship Hero Selection & Details */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>2. Main Flagship Hero Device (मुख्य फ्ल्यागशिप हिरो)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              This device receives the large spotlight card with detailed specs, price, and cover image.
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full w-fit">
            Active Hero: {currentHero?.name}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Hero Selector & Inputs */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Product as Flagship Hero
              </label>
              <select
                value={selectedHeroId}
                onChange={e => {
                  const newId = e.target.value;
                  setSelectedHeroId(newId);
                  const p = products.find(prod => prod.id === newId);
                  if (p) {
                    setHeroTagline(p.lineupTagline || `${p.brand} Flagship`);
                    setHeroBadge(p.lineupBadge || 'Built for Apple Intelligence');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-xs sm:text-sm text-slate-900 bg-white"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.brand}] {p.name} — {formatNPR(p.price)} ({p.storage || 'Standard'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hero Badge Text
                </label>
                <input
                  type="text"
                  value={heroBadge}
                  onChange={e => setHeroBadge(e.target.value)}
                  placeholder="Built for Apple Intelligence"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs sm:text-sm text-slate-900 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">e.g. Built for Apple Intelligence, Flagship 2026</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hero Tagline (Specs Summary)
                </label>
                <input
                  type="text"
                  value={heroTagline}
                  onChange={e => setHeroTagline(e.target.value)}
                  placeholder="Titanium • A18 Pro • Camera Control"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 text-xs sm:text-sm text-slate-900 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Highlighted in amber uppercase letters</p>
              </div>
            </div>
          </div>

          {/* Hero Live Preview Snippet */}
          {currentHero && (
            <div className="lg:col-span-5 bg-slate-950 text-white p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
              <img
                src={currentHero.image}
                alt={currentHero.name}
                className="w-24 h-24 object-contain shrink-0 bg-white/5 p-1 rounded-xl"
              />
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider truncate block">
                  {heroTagline || 'Titanium • A18 Pro'}
                </span>
                <h4 className="font-extrabold text-white text-base truncate">{currentHero.name}</h4>
                <p className="text-xs font-bold text-emerald-400">{formatNPR(currentHero.price)}</p>
                <span className="inline-block text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-semibold">
                  {heroBadge || 'Hero Card'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Mini Lineup Cards Management & Ordering */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>3. Lineup Comparison Cards ({lineupItems.length} Devices)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These products appear in the responsive comparison grid right beneath the Hero card.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Add Device to Lineup</span>
          </button>
        </div>

        {lineupItems.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <Smartphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No items currently in the Lineup.</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click &ldquo;Add Device to Lineup&rdquo; or &ldquo;Reset Defaults&rdquo; to populate official Apple models.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
            >
              Add First Device
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lineupItems.map((item, index) => (
              <div
                key={item.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-300 transition-colors group relative"
              >
                {/* Card Top / Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveItem(index, 'up')}
                        className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                        title="Move Left / Earlier"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === lineupItems.length - 1}
                        onClick={() => moveItem(index, 'down')}
                        className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                        title="Move Right / Later"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
                        title="Remove from Lineup"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail & Product Info */}
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 object-contain rounded-lg bg-white border border-slate-200 p-1 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={item.name}>
                        {item.name}
                      </h4>
                      <p className="text-[11px] font-extrabold text-indigo-600">
                        {formatNPR(item.price)}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {item.storage || 'Nepal Stock'}
                      </p>
                    </div>
                  </div>

                  {/* Tagline & Badge Editors */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/80">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                        Badge (माथिल्लो ब्याज)
                      </label>
                      <input
                        type="text"
                        value={item.lineupBadge || ''}
                        onChange={e => updateItemBadge(item.id, e.target.value)}
                        placeholder="e.g. Brand New / Best Value"
                        className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-white focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                        Highlights (मुख्य विशेषता)
                      </label>
                      <input
                        type="text"
                        value={item.lineupTagline || ''}
                        onChange={e => updateItemTagline(item.id, e.target.value)}
                        placeholder="e.g. A18 Pro • 48MP Fusion"
                        className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-white focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Make Hero Button */}
                <div className="mt-3 pt-2 border-t border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setAsHero(item)}
                    className="w-full py-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 text-slate-600 text-[11px] font-bold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                  >
                    <Star className="w-3 h-3 text-amber-500" />
                    <span>Promote to Hero Card</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Reminder Footer */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
            !
          </div>
          <div>
            <p className="text-xs font-bold text-white">Remember to save your lineup changes</p>
            <p className="text-[11px] text-slate-400">
              Changes will instantly synchronize with visitor storefronts once saved.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveLineup}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Lineup Now</span>
        </button>
      </div>

      {/* Modal: Add Product to Lineup Picker */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Product to Lineup</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick any phone or gadget from your inventory to showcase in the Lineup.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-white">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search model, brand or storage..."
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setPickerBrand('All')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    pickerBrand === 'All'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                {allBrands.map(b => (
                  <button
                    key={b}
                    onClick={() => setPickerBrand(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      pickerBrand === b
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Product List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {availablePickerProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Smartphone className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold">No available products match your filter.</p>
                </div>
              ) : (
                availablePickerProducts.map(prod => (
                  <div
                    key={prod.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-12 h-12 object-contain rounded-lg bg-slate-100 border border-slate-200 p-1 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {prod.brand} • {prod.condition}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{prod.name}</h4>
                        <p className="text-xs font-extrabold text-indigo-600">
                          {formatNPR(prod.price)}
                          {prod.storage && <span className="text-[11px] text-slate-400 font-normal ml-2">({prod.storage})</span>}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => addItemToLineup(prod)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shrink-0 transition-colors shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Lineup</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>{availablePickerProducts.length} devices available</span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-semibold hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
