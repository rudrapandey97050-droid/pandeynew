import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Wrench,
  RefreshCw,
  Search,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Flame,
  CheckCircle2,
  SlidersHorizontal,
  X,
  ExternalLink,
  Tag,
  Star,
  Monitor,
  Check,
  ChevronDown,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Product, RateListItem, StoreSettings, UpcomingModel } from '../types.ts';
import { formatNPR, formatWhatsAppUrl } from '../utils/formatters.ts';
import { STORE_LOCATION } from './GoogleMapsStoreLocator.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';

interface MobileStoreViewProps {
  products: Product[];
  rateList: RateListItem[];
  storeSettings: StoreSettings;
  onOpenValuationModal: (mode?: 'sell' | 'exchange', targetProduct?: Product) => void;
  onOpenRepairModal: (serviceName?: string, tab?: 'book' | 'track', code?: string) => void;
  onOpenPriceListModal: () => void;
  onOpenPreBooking: (model?: UpcomingModel) => void;
  onOpenProductDetail: (product: Product) => void;
  onOrderProduct: (product: Product) => void;
  onNavigateToUpcoming: (slug?: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onForceRefresh: () => void;
  onSwitchToDesktopView: () => void;
}

type MobileTab = 'phones' | 'exchange' | 'repair' | 'rates' | 'store';

export const MobileStoreView: React.FC<MobileStoreViewProps> = ({
  products,
  rateList,
  storeSettings,
  onOpenValuationModal,
  onOpenRepairModal,
  onOpenPriceListModal,
  onOpenPreBooking,
  onOpenProductDetail,
  onOrderProduct,
  onNavigateToUpcoming,
  searchQuery,
  onSearchChange,
  onForceRefresh,
  onSwitchToDesktopView,
}) => {
  // Mobile active main tab
  const [activeTab, setActiveTab] = useState<MobileTab>('phones');

  // Brand / category filter inside phones tab
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<'all' | 'new' | 'used'>('all');
  const [priceSort, setPriceSort] = useState<'default' | 'low-to-high' | 'high-to-low'>('default');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  // Active promo banner carousel slide
  const [activeSlide, setActiveSlide] = useState(0);

  // Exchange quick estimator state inside mobile view
  const [calcBrand, setCalcBrand] = useState('Apple');
  const [calcModel, setCalcModel] = useState('');
  const [calcCondition, setCalcCondition] = useState<'like-new' | 'good' | 'fair'>('good');
  const [calcTargetProductId, setCalcTargetProductId] = useState<string>('');

  // Quick repair tracking inside mobile view
  const [trackingCodeInput, setTrackingCodeInput] = useState('');

  // Nepali time widget state
  const [nepaliTime, setNepaliTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const nptTime = new Date(utcTime + 3600000 * 5.75);
      setNepaliTime(
        nptTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Promo banners
  const promoBanners = [
    {
      title: 'पुराना मोबाइल ल्याउनुहोस्, नयाँ साट्नुहोस्!',
      subtitle: 'बुटवल ट्राफिक चोकमा तुरुन्त ३२-प्वाइन्ट चेक र Spot Cash भ्यालुएसन',
      tag: '🔥 Best Exchange in Butwal',
      bg: 'from-blue-700 via-indigo-800 to-slate-900',
      actionText: 'एक्सचेन्ज सुरु गर्नुहोस्',
      action: () => onOpenValuationModal('exchange'),
    },
    {
      title: '३० मिनेट एक्सप्रेस रिपेयर सेवा',
      subtitle: 'ओरिजिनल डिस्प्ले र ब्याट्री चेन्ज • ९० दिनसम्मको ल्याब ग्यारेन्टी',
      tag: '🛠️ Fast Lab Service',
      bg: 'from-emerald-700 via-teal-800 to-slate-900',
      actionText: 'मर्मत बुकिङ / ट्र्याक',
      action: () => onOpenRepairModal(undefined, 'book'),
    },
    {
      title: 'आधिकारिक स्मार्टफोन र पक्का भ्याट बिल',
      subtitle: 'Apple, Samsung, Xiaomi, Vivo • ग्यारेन्टी र नि:शुल्क स्क्रिन प्रोटेक्टर',
      tag: '✨ १००% Genuine Store',
      bg: 'from-amber-600 via-orange-700 to-slate-900',
      actionText: 'फोनहरू हेर्नुहोस्',
      action: () => {
        setActiveTab('phones');
      },
    },
  ];

  // Auto-rotate promo banners
  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % promoBanners.length);
    }, 4500);
    return () => clearInterval(bannerTimer);
  }, [promoBanners.length]);

  // Quick brand options
  const brandChips = [
    { id: 'all', label: 'सबै फोन (All)' },
    { id: 'Apple', label: '🍎 iPhone' },
    { id: 'Samsung', label: '📱 Samsung' },
    { id: 'Xiaomi', label: '⚡ Xiaomi / Redmi' },
    { id: 'Vivo', label: '✨ Vivo' },
    { id: 'POCO', label: '🚀 POCO' },
    { id: 'used', label: '♻️ सेकेन्ड ह्यान्ड' },
  ];

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.isHidden) return false;

      // In stock filter
      if (onlyInStock) {
        if (p.availability === 'Out of Stock' || p.availability === 'Sold Out' || p.stock === 0) {
          return false;
        }
      }

      // Condition filter
      if (conditionFilter === 'new' && p.condition !== 'New') return false;
      if (conditionFilter === 'used' && p.condition === 'New') return false;

      // Brand filter
      if (selectedBrand === 'used') {
        if (p.condition === 'New') return false;
      } else if (selectedBrand !== 'all') {
        const brandMatch =
          p.brand.toLowerCase() === selectedBrand.toLowerCase() ||
          p.category.toLowerCase() === selectedBrand.toLowerCase() ||
          (selectedBrand === 'Xiaomi' && (p.brand.toLowerCase() === 'redmi' || p.category.toLowerCase() === 'redmi'));
        if (!brandMatch) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          (p.model && p.model.toLowerCase().includes(q)) ||
          (p.storage && p.storage.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    }).sort((a, b) => {
      if (priceSort === 'low-to-high') return a.price - b.price;
      if (priceSort === 'high-to-low') return b.price - a.price;
      return 0;
    });
  }, [products, onlyInStock, conditionFilter, selectedBrand, searchQuery, priceSort]);

  // Quick search keywords
  const quickSearchTags = ['iPhone 15', 'Samsung S24', 'Used iPhone', 'Redmi Note', 'Pre-Owned', 'Budget Phone'];

  // Handle Quick Track submit
  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCodeInput.trim()) {
      onOpenRepairModal(undefined, 'track', trackingCodeInput.trim());
    } else {
      onOpenRepairModal(undefined, 'track');
    }
  };

  // Estimate valuation calculation
  const calculatedEstimate = useMemo(() => {
    let base = 25000;
    if (calcBrand === 'Apple') base = 48000;
    if (calcBrand === 'Samsung') base = 32000;
    if (calcBrand === 'Xiaomi') base = 18000;
    if (calcBrand === 'OnePlus') base = 26000;

    let multiplier = 0.85;
    if (calcCondition === 'like-new') multiplier = 1.0;
    if (calcCondition === 'fair') multiplier = 0.65;

    return Math.round(base * multiplier);
  }, [calcBrand, calcCondition]);

  const targetExchangeProduct = useMemo(() => {
    return products.find((p) => p.id === calcTargetProductId) || products[0];
  }, [products, calcTargetProductId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 selection:bg-indigo-600 selection:text-white font-sans transition-colors duration-200">
      {/* 1. TOP MOBILE APP HEADER */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md">
        {/* Top Mini Status Bar */}
        <div className="bg-slate-950 px-3.5 py-1.5 text-[11px] flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="inline-flex items-center text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              पसल खुला छ (१०:०० - ८:००)
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center text-slate-400">
              <Clock className="w-3 h-3 mr-1 text-indigo-400" />
              {nepaliTime || '१०:३० AM'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Global Theme Toggle */}
            <ThemeToggle variant="compact" />

            {/* Toggle between Mobile & Desktop View */}
            <button
              onClick={onSwitchToDesktopView}
              className="flex items-center space-x-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2 py-0.5 rounded-full border border-slate-700 transition-colors"
              title="Switch to full desktop view"
            >
              <Monitor className="w-3 h-3 text-indigo-400" />
              <span>डेस्कटप भ्यु</span>
            </button>
          </div>
        </div>

        {/* Brand Bar with Direct Action Dialers */}
        <div className="px-3.5 py-2.5 flex items-center justify-between">
          <div
            onClick={() => {
              setActiveTab('phones');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center space-x-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-md shadow-indigo-900/40 border border-indigo-400/30">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-sm tracking-tight text-white">PANDEY MOBILE</span>
                <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                  STORE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center">
                <MapPin className="w-2.5 h-2.5 mr-0.5 text-rose-400" />
                ट्राफिक चोक, बुटवल
              </p>
            </div>
          </div>

          {/* Quick Direct Actions */}
          <div className="flex items-center space-x-2">
            <a
              href={`tel:${storeSettings.phone1 || '9847460603'}`}
              className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-sm transition-transform active:scale-95"
              title="सिधै कल गर्नुहोस्"
            >
              <Phone className="w-4 h-4 fill-white" />
            </a>
            <a
              href={formatWhatsAppUrl(storeSettings.whatsapp, 'नमस्ते Pandey Mobile Store, मलाई जानकारी चाहिएको थियो।')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-sm transition-transform active:scale-95"
              title="WhatsApp मा कुरा गर्नुहोस्"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
            </a>
          </div>
        </div>

        {/* Sticky Mobile Search Bar */}
        <div className="px-3.5 pb-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="फोनको नाम, ब्राण्ड वा मोडेल खोज्नुहोस्..."
              className="w-full bg-slate-800/95 text-white placeholder-slate-400 text-xs rounded-xl pl-9 pr-8 py-2 border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick search chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-2 text-[10px]">
            <span className="text-slate-400 shrink-0 flex items-center font-medium">
              <Sparkles className="w-2.5 h-2.5 mr-0.5 text-amber-400" />
              पपुलर:
            </span>
            {quickSearchTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  onSearchChange(tag);
                  setActiveTab('phones');
                }}
                className={`shrink-0 px-2 py-0.5 rounded-full border transition-all ${
                  searchQuery.toLowerCase() === tag.toLowerCase()
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 2. APP STORIES / CIRCULAR SERVICE SHORTCUTS (Instagram style) */}
      <section className="bg-white py-3 px-3 border-b border-slate-200/80 shadow-xs overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-3.5 min-w-max">
          {/* Story 1: Exchange */}
          <button
            onClick={() => {
              setActiveTab('exchange');
            }}
            className="flex flex-col items-center space-y-1 text-center group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 shadow-sm transition-transform active:scale-95 group-hover:scale-105">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center p-2">
                <RefreshCw className="w-6 h-6 text-indigo-600 group-hover:rotate-45 transition-transform" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">साट्नुहोस्</span>
            <span className="text-[9px] text-indigo-600 font-semibold bg-indigo-50 px-1 rounded">Exchange</span>
          </button>

          {/* Story 2: Express Repair */}
          <button
            onClick={() => {
              setActiveTab('repair');
            }}
            className="flex flex-col items-center space-y-1 text-center group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-600 shadow-sm transition-transform active:scale-95 group-hover:scale-105">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center p-2">
                <Wrench className="w-6 h-6 text-emerald-600 group-hover:-rotate-12 transition-transform" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">मर्मत सेवा</span>
            <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1 rounded">३० मिनेट</span>
          </button>

          {/* Story 3: Rate List */}
          <button
            onClick={() => {
              setActiveTab('rates');
            }}
            className="flex flex-col items-center space-y-1 text-center group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 shadow-sm transition-transform active:scale-95 group-hover:scale-105">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center p-2">
                <Tag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">रेट लिस्ट</span>
            <span className="text-[9px] text-blue-600 font-semibold bg-blue-50 px-1 rounded">आजको दर</span>
          </button>

          {/* Story 4: Upcoming Flagships */}
          <button
            onClick={() => onNavigateToUpcoming()}
            className="flex flex-col items-center space-y-1 text-center group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-rose-500 via-red-500 to-amber-500 shadow-sm transition-transform active:scale-95 group-hover:scale-105">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center p-2">
                <Flame className="w-6 h-6 text-rose-600" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">नयाँ मोडेल</span>
            <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-1 rounded">iPhone 17</span>
          </button>

          {/* Story 5: Pre-Owned Deals */}
          <button
            onClick={() => {
              setActiveTab('phones');
              setSelectedBrand('used');
            }}
            className="flex flex-col items-center space-y-1 text-center group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-slate-600 via-slate-700 to-slate-900 shadow-sm transition-transform active:scale-95 group-hover:scale-105">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center p-2">
                <ShieldCheck className="w-6 h-6 text-slate-700" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">सेकेन्ड ह्यान्ड</span>
            <span className="text-[9px] text-slate-600 font-semibold bg-slate-100 px-1 rounded">Certified</span>
          </button>

          {/* Story 6: Butwal Store Location */}
          <button
            onClick={() => {
              setActiveTab('store');
            }}
            className="flex flex-col items-center space-y-1 text-center group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-red-500 via-rose-600 to-orange-500 shadow-sm transition-transform active:scale-95 group-hover:scale-105">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center p-2">
                <MapPin className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">हाम्रो पसल</span>
            <span className="text-[9px] text-red-600 font-semibold bg-red-50 px-1 rounded">बुटवल चोक</span>
          </button>
        </div>
      </section>

      {/* 3. PROMO BANNER CAROUSEL */}
      <section className="px-3 pt-3">
        <div className="relative rounded-2xl overflow-hidden shadow-sm">
          {promoBanners.map((banner, idx) => (
            <div
              key={idx}
              className={`transition-all duration-500 p-4 text-white bg-gradient-to-br ${banner.bg} ${
                idx === activeSlide ? 'block' : 'hidden'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/25">
                  {banner.tag}
                </span>
                <span className="text-[10px] text-white/70">
                  {idx + 1}/{promoBanners.length}
                </span>
              </div>
              <h3 className="font-extrabold text-base leading-snug tracking-tight mb-1">{banner.title}</h3>
              <p className="text-[11px] text-white/90 leading-relaxed mb-3">{banner.subtitle}</p>
              <div className="flex items-center justify-between">
                <button
                  onClick={banner.action}
                  className="bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow flex items-center space-x-1 active:scale-95 transition-transform"
                >
                  <span>{banner.actionText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex space-x-1">
                  {promoBanners.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setActiveSlide(dotIdx)}
                      className={`h-1.5 rounded-full transition-all ${
                        dotIdx === activeSlide ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. MOBILE SEGMENTED APP TABS (Sticky Switcher) */}
      <div className="sticky top-[108px] z-20 bg-slate-50/95 backdrop-blur-md px-3 py-2 border-b border-slate-200/80 shadow-xs">
        <div className="bg-slate-200/80 p-1 rounded-xl flex items-center justify-between text-xs font-bold">
          <button
            onClick={() => setActiveTab('phones')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 transition-all ${
              activeTab === 'phones'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>फोनहरू</span>
          </button>

          <button
            onClick={() => setActiveTab('exchange')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 transition-all ${
              activeTab === 'exchange'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>साट्नुहोस्</span>
          </button>

          <button
            onClick={() => setActiveTab('repair')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 transition-all ${
              activeTab === 'repair'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>मर्मत</span>
          </button>

          <button
            onClick={() => setActiveTab('rates')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 transition-all ${
              activeTab === 'rates'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>रेट लिस्ट</span>
          </button>

          <button
            onClick={() => setActiveTab('store')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 transition-all ${
              activeTab === 'store'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>पसल</span>
          </button>
        </div>
      </div>

      {/* 5. TAB CONTENT: PHONES (SMARTPHONES CATALOG) */}
      {activeTab === 'phones' && (
        <main className="px-3 pt-3 space-y-3">
          {/* Brand Filter Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 text-xs font-semibold">
            {brandChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setSelectedBrand(chip.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full border transition-all ${
                  selectedBrand === chip.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Sub Filters & Sort Bar */}
          <div className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setConditionFilter((prev) => (prev === 'all' ? 'new' : prev === 'new' ? 'used' : 'all'))}
                className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                  conditionFilter !== 'all'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {conditionFilter === 'all' ? 'सबै अवस्था' : conditionFilter === 'new' ? 'नयाँ मात्र' : 'सेकेन्ड ह्यान्ड'}
              </button>

              <label className="flex items-center space-x-1 text-[11px] text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span>स्टक मात्र</span>
              </label>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-[11px] text-slate-400 font-medium">
                {filteredProducts.length} फोन
              </span>
              <select
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value as any)}
                className="text-[11px] bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="default">क्रम: पूर्वनिर्धारित</option>
                <option value="low-to-high">मूल्य: कम बाट बढी</option>
                <option value="high-to-low">मूल्य: बढी बाट कम</option>
              </select>
            </div>
          </div>

          {/* 2-Column Mobile Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 my-4">
              <Smartphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-800">कुनै फोन फेला परेन</h4>
              <p className="text-xs text-slate-500 mt-1">
                तपाईंको खोजी वा फिल्टर अनुसार कुनै फोन भेटिएन। कृपया अर्को ब्राण्ड वा नाम खोज्नुहोस्।
              </p>
              <button
                onClick={() => {
                  setSelectedBrand('all');
                  setConditionFilter('all');
                  setOnlyInStock(false);
                  onSearchChange('');
                }}
                className="mt-3 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                सबै फोन हेर्नुहोस्
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {filteredProducts.map((product) => {
                const isOutOfStock =
                  product.availability === 'Out of Stock' ||
                  product.availability === 'Sold Out' ||
                  product.stock === 0;

                const isPreOwned =
                  product.condition === 'Used' ||
                  product.condition === 'Pre-Owned' ||
                  product.condition === 'Refurbished';

                const discountAmount =
                  product.originalPrice && product.originalPrice > product.price
                    ? product.originalPrice - product.price
                    : 0;

                const primaryImage =
                  product.image ||
                  (product.images && product.images[0]) ||
                  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80';

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-indigo-300 transition-all active:scale-[0.99]"
                  >
                    {/* Product Image & Badges */}
                    <div
                      onClick={() => onOpenProductDetail(product)}
                      className="relative h-40 bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer p-2"
                    >
                      <img
                        src={primaryImage}
                        alt={product.name}
                        className="w-full h-full object-contain mix-blend-multiply"
                        loading="lazy"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide ${
                            isPreOwned
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isPreOwned ? 'Pre-Owned' : 'Brand New'}
                        </span>

                        {isPreOwned && product.batteryHealth && (
                          <span className="text-[9px] font-bold bg-slate-900/80 text-white px-1.5 py-0.5 rounded">
                            🔋 {product.batteryHealth}
                          </span>
                        )}
                      </div>

                      {/* Stock / Discount Tag */}
                      <div className="absolute top-2 right-2">
                        {isOutOfStock ? (
                          <span className="text-[9px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded">
                            Out of Stock
                          </span>
                        ) : discountAmount > 0 ? (
                          <span className="text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded">
                            - रु {discountAmount.toLocaleString('en-IN')}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Product Details & Actions */}
                    <div className="p-2.5 flex flex-col flex-1 justify-between">
                      <div>
                        {/* Brand / Category pill */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                          <span className="font-semibold uppercase tracking-wider text-indigo-700">
                            {product.brand}
                          </span>
                          {product.storage && (
                            <span className="bg-slate-100 px-1.5 py-0.2 rounded font-medium text-slate-600">
                              {product.storage}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4
                          onClick={() => onOpenProductDetail(product)}
                          className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight cursor-pointer hover:text-indigo-600"
                        >
                          {product.name}
                        </h4>

                        {/* Pricing */}
                        <div className="mt-1.5">
                          <div className="font-extrabold text-sm text-indigo-900">
                            {formatNPR(product.price)}
                          </div>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <div className="text-[10px] text-slate-400 line-through">
                              {formatNPR(product.originalPrice)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2 Quick Mobile Action Buttons */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                        <button
                          onClick={() => onOpenValuationModal('exchange', product)}
                          className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold py-1.5 px-2 rounded-xl flex items-center justify-center space-x-1 active:scale-95 transition-all"
                        >
                          <RefreshCw className="w-3 h-3 text-amber-700" />
                          <span>साट्नुहोस् (Exchange)</span>
                        </button>

                        <button
                          onClick={() => onOrderProduct(product)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold py-1.5 px-2 rounded-xl flex items-center justify-center space-x-1 active:scale-95 transition-all shadow-2xs"
                        >
                          <span>अर्डर / होल्ड</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* 6. TAB CONTENT: EXCHANGE & VALUATION (साट्नुहोस् हब) */}
      {activeTab === 'exchange' && (
        <main className="px-3 pt-3 space-y-3">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-sm border border-indigo-800">
            <div className="flex items-center space-x-2 text-xs text-amber-300 font-bold uppercase tracking-wider mb-1">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Instant Exchange Hub</span>
            </div>
            <h3 className="font-extrabold text-base leading-snug">
              पुरानो मोबाइल साट्नुहोस्, नयाँ फोन घर लैजानुहोस्!
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              बुटवल ट्राफिक चोकमा तुरुन्त ३२-प्वाइन्ट डिजिटल चेकअप र सबैभन्दा उच्च मूल्याङ्कन (Highest Spot Value)।
            </p>
          </div>

          {/* Quick Valuation Calculator Widget */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center">
              <Sparkles className="w-4 h-4 text-amber-500 mr-1.5" />
              कुक एक्सचेन्ज क्याल्कुलेटर (Quick Estimator)
            </h4>

            {/* Step 1: Your Brand */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                १. तपाईंको पुरानो फोनको ब्राण्ड:
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {['Apple', 'Samsung', 'Xiaomi', 'OnePlus', 'Vivo', 'Other'].map((b) => (
                  <button
                    key={b}
                    onClick={() => setCalcBrand(b)}
                    className={`py-1.5 px-2 rounded-xl border font-semibold text-center transition-all ${
                      calcBrand === b
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Condition */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                २. फोनको अवस्था (Condition):
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                {[
                  { id: 'like-new', label: 'उत्कृष्ट (Like New)' },
                  { id: 'good', label: 'राम्रो (Normal Used)' },
                  { id: 'fair', label: 'स्क्र्याच / समस्या' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCalcCondition(c.id as any)}
                    className={`py-1.5 px-1 rounded-xl border font-semibold text-center transition-all ${
                      calcCondition === c.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Estimated Price Box */}
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                अनुमानित साट्ने मूल्य (Estimated Trade-in Value):
              </span>
              <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                {formatNPR(calculatedEstimate)} - {formatNPR(calculatedEstimate + 8000)}
              </div>
              <p className="text-[10px] text-emerald-600 mt-1">
                * वास्तविक मूल्य स्टोरमा ३२-प्वाइन्ट चेक गरेपछि तुरुन्त फाइनल हुन्छ।
              </p>
            </div>

            {/* Big Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => onOpenValuationModal('exchange')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm active:scale-98 transition-transform"
              >
                <RefreshCw className="w-4 h-4" />
                <span>विस्तृत एक्सचेन्ज फारम भर्नुहोस्</span>
              </button>

              <a
                href={formatWhatsAppUrl(
                  storeSettings.whatsapp,
                  `नमस्ते Pandey Mobile Store! म मेरो ${calcBrand} फोन साट्न चाहन्छु। अवस्था: ${calcCondition}। मलाई एक्सचेन्ज अफर दिनुहोला।`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm active:scale-98 transition-transform"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>ह्वाट्सएपमा फोटो पठाई मूल्य सोध्नुहोस्</span>
              </a>
            </div>
          </div>

          {/* Why Exchange with Us */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">किन पाण्डे मोबाइल स्टोरमा एक्सचेन्ज गर्ने?</h4>
            <div className="space-y-2 text-slate-600 text-xs">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Instant Cash / Spot Swap:</strong> कुर्नु पर्दैन, १० मिनेटमै नयाँ फोन हातमा।</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Data Migration Free:</strong> पुरानो फोनको सम्पूर्ण फोटो, कन्ट्याक्ट नयाँमा सारिदिन्छौं।</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Fair Market Value:</strong> बुटवलकै सबैभन्दा प्रतिस्पर्धी उच्चतम मूल्याङ्कन।</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* 7. TAB CONTENT: REPAIR & STATUS TRACKING (मर्मत सेवा) */}
      {activeTab === 'repair' && (
        <main className="px-3 pt-3 space-y-3">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 border border-slate-700 shadow-sm">
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">
              <Wrench className="w-3.5 h-3.5" />
              <span>Express Repair Lab • Traffic Chowk</span>
            </div>
            <h3 className="font-extrabold text-base leading-snug">
              ३० मिनेट एक्सप्रेस स्मार्टफोन मर्मत सेवा
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              १००% ओरिजिनल डिस्प्ले, ब्याट्री र मदरबोर्ड मर्मत। ९० दिनसम्मको ल्याब वारेन्टीका साथ।
            </p>
          </div>

          {/* Quick Repair Status Tracker Box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
            <h4 className="font-bold text-xs text-slate-900 flex items-center">
              <Clock className="w-4 h-4 text-indigo-600 mr-1.5" />
              मर्मत स्थिति ट्र्याक गर्नुहोस् (Track Repair)
            </h4>
            <form onSubmit={handleQuickTrackSubmit} className="flex gap-2">
              <input
                type="text"
                value={trackingCodeInput}
                onChange={(e) => setTrackingCodeInput(e.target.value)}
                placeholder="बुकिङ कोड हाल्नुहोस् (उदा: PMS-REP-102)"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shrink-0"
              >
                हेर्नुहोस्
              </button>
            </form>
          </div>

          {/* Fast Repair Problem Cards */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              सामान्य मर्मत सेवाहरू (Popular Services):
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { title: 'डिस्प्ले फेर्ने', time: '३०-४५ मिनेट', icon: '📱', desc: 'ओरिजिनल OLED/LCD' },
                { title: 'ब्याट्री फेर्ने', time: '२० मिनेट', icon: '🔋', desc: '१००% हेल्थ र ब्याकअप' },
                { title: 'चार्ज नहुने', time: '२५ मिनेट', icon: '🔌', desc: 'पोर्ट / IC क्लिनिङ' },
                { title: 'क्यामेरा समस्या', time: '३० मिनेट', icon: '📷', desc: 'ग्लास र लेन्स चेन्ज' },
                { title: 'पानी पसेको', time: '६० मिनेट', icon: '💧', desc: 'अल्ट्रासोनिक क्लिनिङ' },
                { title: 'मदरबोर्ड रिपेयर', time: 'सेम डे', icon: '⚡', desc: 'माइक्रो-सोल्डरिङ' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenRepairModal(item.title, 'book')}
                  className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs cursor-pointer hover:border-indigo-400 active:scale-98 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xl mb-1">{item.icon}</div>
                    <div className="font-bold text-slate-900 leading-tight">{item.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      {item.time}
                    </span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Book Repair CTA */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => onOpenRepairModal(undefined, 'book')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm active:scale-98 transition-transform"
            >
              <Wrench className="w-4 h-4" />
              <span>मर्मत फारम भर्नुहोस् (Book Repair)</span>
            </button>

            <a
              href={formatWhatsAppUrl(
                storeSettings.whatsapp,
                'नमस्ते Pandey Mobile Store, मेरो मोबाइल बिग्रिएको छ। मर्मत खर्च र समय बुझ्न चाहन्छु।'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm active:scale-98 transition-transform"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>ह्वाट्सएपमा समस्या सोध्नुहोस्</span>
            </a>
          </div>
        </main>
      )}

      {/* 8. TAB CONTENT: RATE LIST (आजको रेट लिस्ट) */}
      {activeTab === 'rates' && (
        <main className="px-3 pt-3 space-y-3">
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-4 border border-blue-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-200 font-bold uppercase tracking-wider flex items-center">
                <Tag className="w-3.5 h-3.5 mr-1" />
                Official Price Sheet
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                आजको अपडेट
              </span>
            </div>
            <h3 className="font-extrabold text-base leading-snug mt-1">
              स्मार्टफोन दैनिक आधिकारिक रेट लिस्ट
            </h3>
            <p className="text-xs text-blue-100 mt-1 leading-relaxed">
              बुटवल बजारको आधिकारिक र पारदर्शी मूल्य सूची। पक्का बिल र वारेन्टी सहित।
            </p>
          </div>

          {/* Rate list cards */}
          <div className="space-y-2">
            {rateList.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl text-center text-xs text-slate-500 border border-slate-200">
                रेट लिस्ट लोड हुँदैछ वा खाली छ।
              </div>
            ) : (
              rateList.slice(0, 15).map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-slate-900">{item.model}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                        {item.storage || '128GB'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-2">
                      <span className="text-indigo-600 font-semibold">{item.brand}</span>
                      <span>•</span>
                      <span>{item.condition || 'New'}</span>
                      {item.batteryHealth && (
                        <>
                          <span>•</span>
                          <span>🔋 {item.batteryHealth}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-xs text-indigo-900">
                      {formatNPR(item.sellingPrice)}
                    </div>
                    <button
                      onClick={() => onOpenValuationModal('exchange')}
                      className="mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200"
                    >
                      साट्नुहोस्
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={onOpenPriceListModal}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-sm active:scale-98 transition-transform"
          >
            <span>पूर्ण रेट लिस्ट तालिका हेर्नुहोस् (Full Table)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </main>
      )}

      {/* 9. TAB CONTENT: STORE LOCATION & ABOUT (पसल र म्याप) */}
      {activeTab === 'store' && (
        <main className="px-3 pt-3 space-y-3">
          {/* Store Address & Contact Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                PMS
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">पाण्डेय मोबाइल स्टोर (बुटवल)</h3>
                <p className="text-xs text-slate-500">Pandey Mobile Store & Express Care</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-700 pt-1 border-t border-slate-100">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span><strong>ठेगाना:</strong> ट्राफिक चोक, मेन रोड, बुटवल, रुपन्देही, नेपाल</span>
              </div>
              <div className="flex items-start space-x-2">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span><strong>समय:</strong> आइतबार – शुक्रबार: बिहान १०:०० – बेलुका ८:०० सम्म</span>
              </div>
              <div className="flex items-start space-x-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>फोन:</strong> {storeSettings.phone1 || '9847460603'} / {storeSettings.phone2 || '9804477123'}</span>
              </div>
            </div>

            {/* Direct Map Links */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href={STORE_LOCATION.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1 text-center shadow-xs"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Google Map मा हेर्नुहोस्</span>
              </a>

              <a
                href={STORE_LOCATION.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1 text-center shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Directions (बाटो)</span>
              </a>
            </div>
          </div>

          {/* Interactive Map Embed */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-900 text-white text-xs font-bold flex items-center justify-between">
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-rose-400" />
                गुगल म्याप लोकेसन (Traffic Chowk Butwal)
              </span>
              <span className="text-[10px] text-emerald-400">लाइभ पिन</span>
            </div>
            <div className="relative w-full h-56 bg-slate-100">
              <iframe
                title="Google Maps Location Pandey Mobile Store"
                src={`https://maps.google.com/maps?q=Traffic+Chowk+Butwal&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </div>

          {/* Theme & Display Preferences Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">डिस्प्ले थिम (Display Theme)</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">आँखालाई सहज हुने लाइट वा डार्क मोड स्विच गर्नुहोस्</p>
              </div>
              <ThemeToggle variant="pill" />
            </div>
          </div>

          {/* Store Guarantee Badges */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white">हाम्रो विशेषता (Why Choose Us)</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="font-bold text-indigo-700 dark:text-indigo-400">✓ १००% ओरिजिनल सामान</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">पक्का भ्याट बिल र वारेन्टी</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="font-bold text-indigo-700 dark:text-indigo-400">✓ ३० मिनेट मर्मत</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">९० दिन ल्याब वारेन्टी</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="font-bold text-indigo-700 dark:text-indigo-400">✓ तुरुन्त एक्सचेन्ज</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">उच्चतम मूल्य ग्यारेन्टी</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="font-bold text-indigo-700 dark:text-indigo-400">✓ डेटा माइग्रेसन फ्री</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">सुरक्षित डाटा ट्रान्सफर</div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* 10. FIXED NATIVE MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-2xl px-2 py-1.5 safe-bottom">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center text-center">
          {/* Nav Item: Home / Phones */}
          <button
            onClick={() => {
              setActiveTab('phones');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center py-1 transition-colors ${
              activeTab === 'phones' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Smartphone className="w-5 h-5" />
              <span className="absolute -top-1 -right-2 bg-indigo-600 text-white text-[8px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">
                {products.filter((p) => !p.isHidden).length}
              </span>
            </div>
            <span className="text-[10px] mt-0.5">फोनहरू</span>
          </button>

          {/* Nav Item: Exchange */}
          <button
            onClick={() => {
              setActiveTab('exchange');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center py-1 transition-colors ${
              activeTab === 'exchange' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <RefreshCw className="w-5 h-5" />
              <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[8px] font-black rounded-full px-1">
                Hot
              </span>
            </div>
            <span className="text-[10px] mt-0.5">साट्नुहोस्</span>
          </button>

          {/* Nav Item: Repair */}
          <button
            onClick={() => {
              setActiveTab('repair');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center py-1 transition-colors ${
              activeTab === 'repair' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Wrench className="w-5 h-5" />
              <span className="absolute -top-1 -right-2 bg-emerald-500 text-white text-[8px] font-black rounded-full px-1">
                30m
              </span>
            </div>
            <span className="text-[10px] mt-0.5">मर्मत</span>
          </button>

          {/* Nav Item: Rate List */}
          <button
            onClick={() => {
              setActiveTab('rates');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center py-1 transition-colors ${
              activeTab === 'rates' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Tag className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">रेट लिस्ट</span>
          </button>

          {/* Nav Item: WhatsApp Chat */}
          <a
            href={formatWhatsAppUrl(storeSettings.whatsapp, 'नमस्ते Pandey Mobile Store, मलाई जानकारी चाहिएको थियो।')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center py-1 text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <MessageCircle className="w-5 h-5 fill-emerald-600 text-white" />
            <span className="text-[10px] mt-0.5 font-bold">ह्वाट्सएप</span>
          </a>
        </div>
      </nav>
    </div>
  );
};
