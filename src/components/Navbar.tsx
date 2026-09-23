import React, { useState, useRef, useMemo } from 'react';
import {
  Apple,
  Search,
  ShoppingBag,
  Menu,
  X,
  RefreshCw,
  History,
  Clock
} from 'lucide-react';
import { StoreSettings } from '../types.ts';
import { DataStorageService } from '../services/dataStorage.ts';
import { formatWhatsAppUrl } from '../utils/formatters.ts';

interface NavbarProps {
  storeSettings: StoreSettings;
  onOpenValuationModal: () => void;
  onOpenRepairModal: (serviceName?: string, initialTab?: 'book' | 'track') => void;
  onOpenRateListModal: () => void;
  onNavigateToUpcoming?: (slug?: string) => void;
  onSelectCategory?: (id: string) => void;
  onScrollToProducts?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onForceRefresh?: () => void;
}

type TabKey = 'store' | 'iphone' | 'samsung' | 'android' | 'preowned' | 'upcoming' | 'tradein' | 'repair';

export const Navbar: React.FC<NavbarProps> = ({
  storeSettings,
  onOpenValuationModal,
  onOpenRepairModal,
  onOpenRateListModal,
  onNavigateToUpcoming,
  onSelectCategory,
  onScrollToProducts,
  searchQuery,
  onSearchChange,
  onForceRefresh
}) => {
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Recent searches state (tracks user's last 5 searched keywords)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('pms_recent_searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .slice(0, 5);
        }
      }
    } catch (e) {
      console.warn('Error reading recent searches:', e);
    }
    return [];
  });

  const [isDesktopSearchFocused, setIsDesktopSearchFocused] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);

  // Save / track a searched keyword into history (max 5, most recent first)
  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('pms_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving recent search:', e);
      }
      return updated;
    });
  };

  // Remove a single searched keyword from history
  const removeRecentSearch = (keyword: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.toLowerCase() !== keyword.toLowerCase());
      try {
        localStorage.setItem('pms_recent_searches', JSON.stringify(updated));
      } catch (e) {
        console.warn('Error removing recent search:', e);
      }
      return updated;
    });
  };

  // Clear all recent searches
  const clearRecentSearches = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setRecentSearches([]);
    try {
      localStorage.removeItem('pms_recent_searches');
    } catch (e) {
      console.warn('Error clearing recent searches:', e);
    }
  };

  // Select a recent search item
  const handleSelectRecentSearch = (term: string) => {
    saveRecentSearch(term);
    onSearchChange(term);
    setIsDesktopSearchFocused(false);
    setIsMobileSearchFocused(false);
    setSearchOpen(false);
    setMobileMenuOpen(false);
    if (onScrollToProducts) {
      onScrollToProducts();
    }
  };

  // Dynamic live in-stock products and upcoming models
  const products = useMemo(() => DataStorageService.getProducts(), [activeTab, isRefreshing]);
  const upcomingModels = useMemo(() => DataStorageService.getUpcomingModels(), [activeTab, isRefreshing]);

  // Filtered in-stock products by category
  const inStockApple = useMemo(() => {
    return products.filter(p => p.brand === 'Apple' && p.condition !== 'Pre-Owned' && p.availability !== 'Out of Stock');
  }, [products]);

  const inStockSamsung = useMemo(() => {
    return products.filter(p => p.brand === 'Samsung' && p.availability !== 'Out of Stock');
  }, [products]);

  const inStockAndroid = useMemo(() => {
    return products.filter(p => p.brand !== 'Apple' && p.availability !== 'Out of Stock');
  }, [products]);

  const inStockPreOwned = useMemo(() => {
    return products.filter(p => p.condition === 'Pre-Owned' && p.availability !== 'Out of Stock');
  }, [products]);

  // Filtered upcoming models
  const upcomingApple = useMemo(() => {
    return upcomingModels.filter(m => m.brand.toLowerCase().includes('apple') || m.name.toLowerCase().includes('iphone'));
  }, [upcomingModels]);

  const upcomingSamsung = useMemo(() => {
    return upcomingModels.filter(m => m.brand.toLowerCase().includes('samsung') || m.name.toLowerCase().includes('galaxy'));
  }, [upcomingModels]);

  const upcomingAndroid = useMemo(() => {
    return upcomingModels.filter(m => !m.brand.toLowerCase().includes('apple') && !m.name.toLowerCase().includes('iphone'));
  }, [upcomingModels]);

  const handleMouseEnter = (tab: TabKey) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveTab(tab);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveTab(null);
    }, 150);
  };

  const handleAction = (options: {
    category?: string;
    search?: string;
    modal?: 'valuation' | 'repair' | 'ratelist' | 'upcoming';
    repairTab?: 'book' | 'track';
    upcomingSlug?: string;
  }) => {
    setActiveTab(null);
    setMobileMenuOpen(false);
    setSearchOpen(false);

    if (options.modal === 'upcoming') {
      if (onNavigateToUpcoming) {
        onNavigateToUpcoming(options.upcomingSlug);
      }
      return;
    }
    if (options.category && onSelectCategory) {
      onSelectCategory(options.category);
    }
    if (options.search !== undefined) {
      if (options.search.trim()) {
        saveRecentSearch(options.search);
      }
      onSearchChange(options.search);
    }
    if (options.modal === 'valuation') {
      onOpenValuationModal();
      return;
    }
    if (options.modal === 'repair') {
      onOpenRepairModal(undefined, options.repairTab || 'book');
      return;
    }
    if (options.modal === 'ratelist') {
      onOpenRateListModal();
      return;
    }
    if (onScrollToProducts) {
      onScrollToProducts();
    }
  };

  return (
    <>
      {/* Apple-style Top Strip / Announcement */}
      {storeSettings.showBannerNotice && storeSettings.bannerNotice && (
        <div className="bg-[#f5f5f7] text-[#515154] text-[12px] font-normal py-2 px-4 border-b border-[#d2d2d7]">
          <div className="max-w-[1024px] mx-auto flex items-center justify-between">
            <span className="truncate flex-1 text-center text-[#1d1d1f] font-medium">
              {storeSettings.bannerNotice}
            </span>
            <div className="hidden md:flex items-center space-x-3 text-[11px] text-[#86868b]">
              <span>Traffic Chowk, Butwal</span>
              <span>•</span>
              <a href={`tel:${storeSettings.phone1}`} className="text-[#1d1d1f] hover:underline font-medium">
                {storeSettings.phone1}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Apple Global Nav Bar (Exact Apple Light Style, 44px, translucent blur, SF typography) */}
      <header
        className="sticky top-0 z-50 bg-[rgba(255,255,255,0.92)] text-[#1d1d1f] backdrop-blur-xl border-b border-black/[0.08] transition-colors"
        onMouseLeave={handleMouseLeave}
      >
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-11 text-[12px] tracking-[-0.01em]">
            
            {/* Apple Logo / Store Brand */}
            <button
              onClick={() => {
                setActiveTab(null);
                if (onSelectCategory) onSelectCategory('All');
                onSearchChange('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-[#1d1d1f] hover:text-black transition-opacity shrink-0 flex items-center space-x-2 cursor-pointer group"
              title="Pandey Mobile Store"
            >
              <Apple className="w-4 h-4 text-[#1d1d1f] fill-current" />
              <span className="font-semibold tracking-tight text-[13px] text-[#1d1d1f] hidden sm:inline">
                Pandey Mobile
              </span>
            </button>

            {/* Desktop Navigation Items (Exact Apple Layout matching uploaded screenshot) */}
            <nav className="hidden md:flex items-center justify-between flex-1 max-w-[760px] mx-6">
              
              {/* Store */}
              <button
                onMouseEnter={() => handleMouseEnter('store')}
                onClick={() => handleAction({ category: 'All', search: '' })}
                className={`py-2 px-2 transition-colors cursor-pointer ${
                  activeTab === 'store' ? 'text-black font-semibold' : 'text-[#1d1d1f]/80 hover:text-black'
                }`}
              >
                Store
              </button>

              {/* iPhone */}
              <button
                onMouseEnter={() => handleMouseEnter('iphone')}
                onClick={() => handleAction({ category: 'Apple', search: '' })}
                className={`py-2 px-2 transition-colors cursor-pointer ${
                  activeTab === 'iphone' ? 'text-black font-semibold' : 'text-[#1d1d1f]/80 hover:text-black'
                }`}
              >
                iPhone
              </button>

              {/* Samsung */}
              <button
                onMouseEnter={() => handleMouseEnter('samsung')}
                onClick={() => handleAction({ category: 'Samsung', search: '' })}
                className={`py-2 px-2 transition-colors cursor-pointer ${
                  activeTab === 'samsung' ? 'text-black font-semibold' : 'text-[#1d1d1f]/80 hover:text-black'
                }`}
              >
                Samsung
              </button>

              {/* Android */}
              <button
                onMouseEnter={() => handleMouseEnter('android')}
                onClick={() => handleAction({ category: 'Xiaomi', search: '' })}
                className={`py-2 px-2 transition-colors cursor-pointer ${
                  activeTab === 'android' ? 'text-black font-semibold' : 'text-[#1d1d1f]/80 hover:text-black'
                }`}
              >
                Android
              </button>

              {/* Pre-Owned */}
              <button
                onMouseEnter={() => handleMouseEnter('preowned')}
                onClick={() => handleAction({ category: 'Pre-Owned', search: '' })}
                className={`py-2 px-2 transition-colors cursor-pointer ${
                  activeTab === 'preowned' ? 'text-black font-semibold' : 'text-[#1d1d1f]/80 hover:text-black'
                }`}
              >
                Pre-Owned
              </button>

              {/* Upcoming Models (Only Upcoming in this spot, Apple style) */}
              <button
                onMouseEnter={() => handleMouseEnter('upcoming')}
                onClick={() => handleAction({ modal: 'upcoming' })}
                className={`py-2 px-2 transition-colors cursor-pointer ${
                  activeTab === 'upcoming' ? 'text-black font-semibold' : 'text-[#1d1d1f]/80 hover:text-black'
                }`}
                title="Upcoming Models & Launch Radar"
              >
                Upcoming
              </button>

              {/* Trade In */}
              <button
                onMouseEnter={() => handleMouseEnter('tradein')}
                onClick={() => handleAction({ modal: 'valuation' })}
                className={`py-2 px-2 transition-colors cursor-pointer ${
                  activeTab === 'tradein' ? 'text-black font-semibold' : 'text-[#1d1d1f]/80 hover:text-black'
                }`}
              >
                Trade In
              </button>

              {/* Repair */}
              <button
                onMouseEnter={() => handleMouseEnter('repair')}
                onClick={() => handleAction({ modal: 'repair' })}
                className={`py-2 px-2 transition-colors cursor-pointer ${
                  activeTab === 'repair' ? 'text-black font-semibold' : 'text-[#1d1d1f]/80 hover:text-black'
                }`}
              >
                Repair
              </button>

            </nav>

            {/* Right Action Icons: Refresh, Search & WhatsApp */}
            <div className="flex items-center space-x-3.5 shrink-0 text-[#1d1d1f]/80">
              
              {/* Fresh Reload Button */}
              <button
                type="button"
                onClick={() => {
                  setIsRefreshing(true);
                  if (onForceRefresh) onForceRefresh();
                  setTimeout(async () => {
                    if (typeof window !== 'undefined') {
                      if ('caches' in window) {
                        try {
                          const keys = await window.caches.keys();
                          await Promise.all(keys.map(k => window.caches.delete(k)));
                        } catch (e) {}
                      }
                      sessionStorage.setItem('pms_fresh_update_time', Date.now().toString());
                      const u = new URL(window.location.href);
                      u.searchParams.set('_t', Date.now().toString());
                      window.location.replace(u.toString());
                    }
                  }, 300);
                }}
                disabled={isRefreshing}
                className="hover:text-black transition-colors cursor-pointer flex items-center space-x-1 py-1 px-1.5 rounded-lg hover:bg-black/5 text-[#1d1d1f]/80"
                title="Refresh latest stock and updates"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-black' : ''}`} />
                <span className="text-[11px] font-medium hidden sm:inline text-[#1d1d1f]">Refresh</span>
              </button>

              <button
                onClick={() => {
                  const nextState = !searchOpen;
                  setSearchOpen(nextState);
                  if (nextState) {
                    setIsDesktopSearchFocused(true);
                  } else {
                    setIsDesktopSearchFocused(false);
                  }
                }}
                className="hover:text-black transition-colors cursor-pointer"
                title="Search phones"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              <a
                href={formatWhatsAppUrl(storeSettings.whatsapp, 'Hello Pandey Mobile Store, I have an inquiry.')}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-black transition-colors cursor-pointer flex items-center space-x-1"
                title="WhatsApp Inquiry"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
              </a>

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden hover:text-black cursor-pointer ml-1"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* APPLE MEGA-MENUS (EXACT 3-COLUMN STRUCTURE MATCHING APPLE.COM SCREENSHOT) */}
        {/* Pure Apple typography, light background, no rates, no golden letters     */}
        {/* ========================================================================= */}

        {/* 1. STORE TAB MEGA-MENU */}
        {activeTab === 'store' && (
          <div
            className="bg-white border-b border-[#d2d2d7] text-[#1d1d1f] shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 z-50 overflow-hidden"
            onMouseEnter={() => handleMouseEnter('store')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-[1024px] mx-auto pt-8 pb-12 px-6 sm:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                
                {/* Column 1: Explore Store */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Explore Store</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleAction({ category: 'All', search: '' })}
                      className="block text-[22px] sm:text-[24px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Shop the Latest
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Apple', search: '' })}
                      className="block text-[22px] sm:text-[24px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      iPhone Collection
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Samsung', search: '' })}
                      className="block text-[22px] sm:text-[24px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Samsung Galaxy
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Pre-Owned', search: '' })}
                      className="block text-[22px] sm:text-[24px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Certified Pre-Owned
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Accessories', search: '' })}
                      className="block text-[22px] sm:text-[24px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Mobile Accessories
                    </button>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#f0f0f2] space-y-1.5">
                    <button
                      onClick={() => handleAction({ category: 'All', search: '' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      Compare All Devices
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'upcoming' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      Upcoming Lineup & Radar
                    </button>
                  </div>
                </div>

                {/* Column 2: Shop Store */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Shop Store</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <button
                      onClick={() => handleAction({ category: 'All', search: '' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      All In-Stock Smartphones
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Pre-Owned', search: '' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Certified Tested Pre-Owned
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Apple & Android Trade In
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'repair' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Express Phone Repair & Lab
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Accessories', search: '' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Official Fast Chargers & Cases
                    </button>
                  </div>
                </div>

                {/* Column 3: More from Store */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">More from Pandey Mobile</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <button
                      onClick={() => handleAction({ modal: 'repair', repairTab: 'track' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Live Repair Status Tracker
                    </button>
                    <p className="text-[#86868b] py-0.5">
                      100% Genuine Nepal VAT Bill & Warranty
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      Store: Traffic Chowk, Butwal
                    </p>
                    <div className="pt-3 border-t border-[#f0f0f2]">
                      <a
                        href={formatWhatsAppUrl(storeSettings.whatsapp, 'Hello Pandey Mobile Store, I want to inquire about smartphones and availability.')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0071e3] hover:underline block text-[13px] font-medium"
                      >
                        Chat with Store Specialist on WhatsApp →
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 2. iPHONE TAB MEGA-MENU (MATCHING USER SCREENSHOT EXACTLY) */}
        {activeTab === 'iphone' && (
          <div
            className="bg-white border-b border-[#d2d2d7] text-[#1d1d1f] shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 z-50 overflow-hidden"
            onMouseEnter={() => handleMouseEnter('iphone')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-[1024px] mx-auto pt-8 pb-12 px-6 sm:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                
                {/* Column 1: Explore iPhone (Exact Apple Structure) */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Explore iPhone</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleAction({ modal: 'upcoming', upcomingSlug: 'iphone-18-pro-max' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      iPhone 18 Series
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'upcoming', upcomingSlug: 'iphone-17-series' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      iPhone 17 Series
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Apple', search: '16' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      iPhone 16 Series
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Apple', search: '15' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      iPhone 15 Series
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Apple', search: '' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors pt-2"
                    >
                      Explore All Models
                    </button>
                  </div>

                  {/* Secondary Explore Links (from screenshot) */}
                  <div className="mt-6 pt-4 border-t border-[#f0f0f2] space-y-1.5">
                    <button
                      onClick={() => handleAction({ category: 'Apple', search: '' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      Compare iPhone
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      Switch from Android
                    </button>
                  </div>
                </div>

                {/* Column 2: Shop iPhone (from screenshot) */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Shop iPhone</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <button
                      onClick={() => handleAction({ category: 'Apple', search: '' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Shop iPhone
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Accessories', search: 'Apple' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      iPhone Accessories
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Apple Trade In
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Apple', search: '' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Official Nepal 1-Year Warranty
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Pre-Owned', search: 'iPhone' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Certified Pre-Owned iPhone
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'upcoming' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Upcoming iPhone Models
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Personal Setup & Transfer
                    </button>
                  </div>
                </div>

                {/* Column 3: More from iPhone (from screenshot) */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">More from iPhone</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <button
                      onClick={() => handleAction({ modal: 'repair', repairTab: 'book' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      iPhone Support & Diagnostics
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'repair', repairTab: 'book' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Display & Battery Replacement
                    </button>
                    <p className="text-[#86868b] py-0.5">
                      Certified Master Technicians
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      100% Genuine IMEI & VAT Bill
                    </p>
                    <div className="pt-3 border-t border-[#f0f0f2]">
                      <a
                        href={formatWhatsAppUrl(storeSettings.whatsapp, 'Hello Pandey Mobile Store, I have an inquiry regarding iPhone models and availability.')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0071e3] hover:underline block text-[13px] font-medium"
                      >
                        WhatsApp Direct Specialist →
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 3. SAMSUNG TAB MEGA-MENU */}
        {activeTab === 'samsung' && (
          <div
            className="bg-white border-b border-[#d2d2d7] text-[#1d1d1f] shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 z-50 overflow-hidden"
            onMouseEnter={() => handleMouseEnter('samsung')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-[1024px] mx-auto pt-8 pb-12 px-6 sm:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                
                {/* Column 1: Explore Samsung */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Explore Samsung</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleAction({ category: 'Samsung', search: '' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Explore All Samsung
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Samsung', search: 'Ultra' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Galaxy S25 Ultra
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Samsung', search: 'Galaxy S' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Galaxy S-Series
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Samsung', search: 'Fold' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Galaxy Z Fold & Flip
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Samsung', search: 'Galaxy A' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Galaxy A-Series
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Samsung', search: 'Galaxy M' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Galaxy M-Series
                    </button>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#f0f0f2] space-y-1.5">
                    <button
                      onClick={() => handleAction({ category: 'Samsung', search: '' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      Compare Galaxy Models
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      Switch to Galaxy
                    </button>
                  </div>
                </div>

                {/* Column 2: Shop Samsung */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Shop Samsung</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <button
                      onClick={() => handleAction({ category: 'Samsung', search: '' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Shop Galaxy Smartphones
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Accessories', search: 'Samsung' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Galaxy 25W & 45W Chargers
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Samsung Trade In (Exchange)
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Samsung', search: '' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Official Samsung Nepal Warranty
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Pre-Owned', search: 'Samsung' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Certified Pre-Owned Galaxy
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'upcoming' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Upcoming Galaxy Models
                    </button>
                  </div>
                </div>

                {/* Column 3: More from Samsung */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">More from Samsung</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <button
                      onClick={() => handleAction({ modal: 'repair', repairTab: 'book' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Samsung Screen & AMOLED Lab
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'repair', repairTab: 'book' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Battery & Charging Diagnostics
                    </button>
                    <p className="text-[#86868b] py-0.5">
                      Smart Switch Setup Assistance
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      Authorized Brand Stock & Bill
                    </p>
                    <div className="pt-3 border-t border-[#f0f0f2]">
                      <a
                        href={formatWhatsAppUrl(storeSettings.whatsapp, 'Hello Pandey Mobile Store, I want to inquire about Samsung Galaxy models and availability.')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0071e3] hover:underline block text-[13px] font-medium"
                      >
                        WhatsApp Direct Specialist →
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 4. ANDROID TAB MEGA-MENU */}
        {activeTab === 'android' && (
          <div
            className="bg-white border-b border-[#d2d2d7] text-[#1d1d1f] shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 z-50 overflow-hidden"
            onMouseEnter={() => handleMouseEnter('android')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-[1024px] mx-auto pt-8 pb-12 px-6 sm:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                
                {/* Column 1: Explore Android */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Explore Android</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleAction({ category: 'Android', search: '' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Explore All Android
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Redmi', search: '' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Xiaomi & Redmi Note
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'POCO', search: '' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      POCO Gaming Flagships
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Vivo', search: '' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Vivo V-Series & Y-Series
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'HONOR', search: '' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      HONOR Magic & X-Series
                    </button>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#f0f0f2] space-y-1.5">
                    <button
                      onClick={() => handleAction({ category: 'Android', search: '' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      Compare Android Phones
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      Trade In Your Android Phone
                    </button>
                  </div>
                </div>

                {/* Column 2: Shop Android */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Shop Android</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <button
                      onClick={() => handleAction({ category: 'Android', search: '' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      In-Stock Android Smartphones
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Accessories', search: 'Fast Charger' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Fast Chargers (33W - 120W)
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Old Device Exchange (Trade In)
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Pre-Owned', search: '' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Certified Pre-Owned Android
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'upcoming' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Upcoming Android Flagships
                    </button>
                  </div>
                </div>

                {/* Column 3: More from Android */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">More from Android</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <button
                      onClick={() => handleAction({ modal: 'repair', repairTab: 'book' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Android Software & Screen Lab
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'repair', repairTab: 'track' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Live Repair Status Tracker
                    </button>
                    <p className="text-[#86868b] py-0.5">
                      Genuine Brand Stock & Nepal Bill
                    </p>
                    <div className="pt-3 border-t border-[#f0f0f2]">
                      <a
                        href={formatWhatsAppUrl(storeSettings.whatsapp, 'Hello Pandey Mobile Store, I want to inquire about Android phone models.')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0071e3] hover:underline block text-[13px] font-medium"
                      >
                        WhatsApp Direct Specialist →
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 5. PRE-OWNED TAB MEGA-MENU */}
        {activeTab === 'preowned' && (
          <div
            className="bg-white border-b border-[#d2d2d7] text-[#1d1d1f] shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 z-50 overflow-hidden"
            onMouseEnter={() => handleMouseEnter('preowned')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-[1024px] mx-auto pt-8 pb-12 px-6 sm:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                
                {/* Column 1: Explore Pre-Owned */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Explore Pre-Owned</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleAction({ category: 'Pre-Owned', search: '' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Explore All Pre-Owned
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Pre-Owned', search: 'iPhone' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Pre-Owned iPhone
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Pre-Owned', search: 'Samsung' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Pre-Owned Samsung
                    </button>
                    <button
                      onClick={() => handleAction({ category: 'Pre-Owned', search: '' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Certified Flagships
                    </button>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#f0f0f2] space-y-1.5">
                    <button
                      onClick={() => handleAction({ category: 'Pre-Owned', search: '' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      Why Choose Certified Pre-Owned
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      Sell Your Used Phone for Cash
                    </button>
                  </div>
                </div>

                {/* Column 2: Shop Pre-Owned */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Shop Pre-Owned</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <button
                      onClick={() => handleAction({ category: 'Pre-Owned', search: '' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      In-Stock Certified Phones
                    </button>
                    <p className="text-[#86868b] py-0.5">
                      15-Day Replacement Guarantee
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      100% Legal Bill & IMEI Verification
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      Battery Health 85%+ Guaranteed
                    </p>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Exchange Old Phone for Pre-Owned
                    </button>
                  </div>
                </div>

                {/* Column 3: Pre-Owned Guarantee */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Quality Guarantee</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <p className="text-[#86868b] py-0.5">
                      32-Point Hardware Inspection
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      Original Screen & Cameras Verified
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      Testing Counter: Traffic Chowk, Butwal
                    </p>
                    <div className="pt-3 border-t border-[#f0f0f2]">
                      <a
                        href={formatWhatsAppUrl(storeSettings.whatsapp, 'Hello Pandey Mobile Store, I want to inquire about Certified Pre-Owned models and condition.')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0071e3] hover:underline block text-[13px] font-medium"
                      >
                        Ask Details on WhatsApp →
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 6. UPCOMING TAB MEGA-MENU (ONLY UPCOMING IN THIS SPOT) */}
        {activeTab === 'upcoming' && (
          <div
            className="bg-white border-b border-[#d2d2d7] text-[#1d1d1f] shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 z-50 overflow-hidden"
            onMouseEnter={() => handleMouseEnter('upcoming')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-[1024px] mx-auto pt-8 pb-12 px-6 sm:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                
                {/* Column 1: Explore Upcoming */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Explore Upcoming</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleAction({ modal: 'upcoming' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Explore All Upcoming
                    </button>
                    {upcomingModels.slice(0, 5).map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleAction({ modal: 'upcoming', upcomingSlug: model.slug })}
                        className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors truncate max-w-full"
                      >
                        {model.name}
                      </button>
                    ))}
                    {upcomingModels.length === 0 && (
                      <p className="text-[14px] text-[#86868b]">New models arriving soon.</p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#f0f0f2] space-y-1.5">
                    <button
                      onClick={() => handleAction({ modal: 'upcoming' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      Pre-Booking Terms & Perks
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'upcoming' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      First-Day Priority Delivery in Nepal
                    </button>
                  </div>
                </div>

                {/* Column 2: Pre-Booking & Radar */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Pre-Booking & Inquiries</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <button
                      onClick={() => handleAction({ modal: 'upcoming' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Reserve Your Model Online
                    </button>
                    <p className="text-[#86868b] py-0.5">
                      Zero-Risk Booking Inquiry
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      VIP Delivery at Pandey Mobile
                    </p>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Trade In Your Old Phone for Upcoming Model
                    </button>
                  </div>
                </div>

                {/* Column 3: Launch Radar */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Launch Radar</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <p className="text-[#86868b] py-0.5">
                      Live Spec Leaks & Expected Launch Dates
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      Official Nepal Availability Alerts
                    </p>
                    <div className="pt-3 border-t border-[#f0f0f2]">
                      <a
                        href={formatWhatsAppUrl(storeSettings.whatsapp, 'Hello Pandey Mobile Store, I want to pre-book an upcoming smartphone.')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0071e3] hover:underline block text-[13px] font-medium"
                      >
                        Pre-Book on WhatsApp →
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 7. TRADE IN TAB MEGA-MENU */}
        {activeTab === 'tradein' && (
          <div
            className="bg-white border-b border-[#d2d2d7] text-[#1d1d1f] shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 z-50 overflow-hidden"
            onMouseEnter={() => handleMouseEnter('tradein')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-[1024px] mx-auto pt-8 pb-12 px-6 sm:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                
                {/* Column 1: Explore Trade In */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Explore Trade In</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Instant Device Valuation
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Exchange & Upgrade
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Sell for Instant Cash
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Trade In Old iPhone
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Trade In Old Android
                    </button>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#f0f0f2] space-y-1.5">
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      How Trade In Works
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      Physical Inspection Checklist
                    </button>
                  </div>
                </div>

                {/* Column 2: Trade In Services */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Valuation Tools</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <button
                      onClick={() => handleAction({ modal: 'valuation' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Launch Valuation Calculator
                    </button>
                    <p className="text-[#86868b] py-0.5">
                      Complimentary Data Transfer
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      Instant Bank Transfer or Cash
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      Highest Trade-In Value in Butwal
                    </p>
                  </div>
                </div>

                {/* Column 3: Store Counter */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Store Counter</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <p className="text-[#86868b] py-0.5">
                      Traffic Chowk, Butwal Counter
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      Open 9:00 AM - 8:30 PM Daily
                    </p>
                    <div className="pt-3 border-t border-[#f0f0f2]">
                      <a
                        href={formatWhatsAppUrl(storeSettings.whatsapp, 'Hello Pandey Mobile Store, I want to trade in my old phone. How much will I get?')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0071e3] hover:underline block text-[13px] font-medium"
                      >
                        Get Valuation on WhatsApp →
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 8. REPAIR TAB MEGA-MENU */}
        {activeTab === 'repair' && (
          <div
            className="bg-white border-b border-[#d2d2d7] text-[#1d1d1f] shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 z-50 overflow-hidden"
            onMouseEnter={() => handleMouseEnter('repair')}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-[1024px] mx-auto pt-8 pb-12 px-6 sm:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                
                {/* Column 1: Explore Repair */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Explore Repair</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleAction({ modal: 'repair', repairTab: 'track' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Track Repair Status
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'repair', repairTab: 'book' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Book Phone Repair
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'repair', repairTab: 'book' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      OLED Display Replacement
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'repair', repairTab: 'book' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      Original Battery Replacement
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'repair', repairTab: 'book' })}
                      className="block text-[24px] sm:text-[26px] font-semibold text-[#1d1d1f] hover:text-[#0071e3] leading-[1.25] tracking-tight text-left cursor-pointer transition-colors"
                    >
                      IC & Motherboard Specialist
                    </button>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#f0f0f2] space-y-1.5">
                    <button
                      onClick={() => handleAction({ modal: 'repair', repairTab: 'book' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      Diagnostic Process
                    </button>
                    <button
                      onClick={() => handleAction({ modal: 'repair', repairTab: 'book' })}
                      className="block text-[13px] font-normal text-[#1d1d1f] hover:text-[#0071e3] transition-colors text-left cursor-pointer"
                    >
                      No Fix No Fee Policy
                    </button>
                  </div>
                </div>

                {/* Column 2: Lab Services */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Lab Services</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <p className="text-[#86868b] py-0.5">
                      Water Damage Ultrasonic Cleaning
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      Camera Lens & Sensor Replacement
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      Charging Port & Mic Low Volume Fix
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      Back Glass Laser Separation
                    </p>
                    <button
                      onClick={() => handleAction({ modal: 'repair', repairTab: 'track' })}
                      className="block hover:text-[#0071e3] transition-colors text-left cursor-pointer py-0.5"
                    >
                      Check Live Repair Status
                    </button>
                  </div>
                </div>

                {/* Column 3: Lab Guarantee */}
                <div>
                  <p className="text-[12px] text-[#86868b] font-normal mb-3">Lab Guarantee</p>
                  <div className="space-y-2 text-[13px] font-medium text-[#1d1d1f]">
                    <p className="text-[#86868b] py-0.5">
                      Up to 90 Days Service Warranty
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      Certified Master Technicians
                    </p>
                    <p className="text-[#86868b] py-0.5">
                      Express 30-Minute Turnaround
                    </p>
                    <div className="pt-3 border-t border-[#f0f0f2]">
                      <a
                        href={`tel:${storeSettings.technicianPhone || storeSettings.phone1}`}
                        className="text-[#0071e3] hover:underline block text-[13px] font-medium"
                      >
                        Lab Hotline: {storeSettings.technicianPhone || storeSettings.phone1}
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Search Bar Overlay */}
        {searchOpen && (
          <div className="bg-white border-b border-[#d2d2d7] px-4 py-4 animate-in fade-in duration-150">
            <div className="max-w-[700px] mx-auto relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-[#86868b] absolute left-3" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search for iPhone, Samsung, chargers, or repairs..."
                  value={searchQuery}
                  onFocus={() => setIsDesktopSearchFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsDesktopSearchFocused(false), 250);
                  }}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (searchQuery.trim()) {
                        saveRecentSearch(searchQuery);
                      }
                      setSearchOpen(false);
                      setIsDesktopSearchFocused(false);
                      if (onScrollToProducts) onScrollToProducts();
                    } else if (e.key === 'Escape') {
                      setIsDesktopSearchFocused(false);
                      setSearchOpen(false);
                    }
                  }}
                  className="w-full bg-[#f5f5f7] text-[#1d1d1f] text-sm pl-10 pr-10 py-2.5 rounded-xl border border-[#d2d2d7] focus:outline-hidden focus:border-[#0071e3] placeholder-[#86868b]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 text-[#86868b] hover:text-[#1d1d1f] text-xs font-medium cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Recent Searches Dropdown List */}
              {isDesktopSearchFocused && recentSearches.length > 0 && (
                <div
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[#d2d2d7] overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#fbfbfd] border-b border-[#f0f0f2]">
                    <div className="flex items-center space-x-1.5 text-[#86868b] text-[11px] font-semibold uppercase tracking-wider">
                      <History className="w-3.5 h-3.5 text-[#86868b]" />
                      <span>Recent Searches</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-[11px] text-[#86868b] hover:text-[#e03131] transition-colors cursor-pointer font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="py-1">
                    {recentSearches.map((term, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectRecentSearch(term)}
                        className="flex items-center justify-between px-4 py-2.5 text-xs text-[#1d1d1f] hover:bg-[#f5f5f7] cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <Clock className="w-3.5 h-3.5 text-[#86868b] shrink-0 group-hover:text-[#0071e3] transition-colors" />
                          <span className="font-medium truncate">{term}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(term, e)}
                          className="text-[#86868b] hover:text-[#1d1d1f] p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
                          title="Remove from history"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Drawer Menu (Clean Apple Light Theme, No golden letters, No rates) */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-[#d2d2d7] px-6 py-6 space-y-5 text-[#1d1d1f] min-h-[calc(100vh-44px)] animate-in slide-in-from-top-2 duration-200">
            
            {/* Search Input */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search store..."
                  value={searchQuery}
                  onFocus={() => setIsMobileSearchFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsMobileSearchFocused(false), 250);
                  }}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (searchQuery.trim()) {
                        saveRecentSearch(searchQuery);
                      }
                      setMobileMenuOpen(false);
                      setIsMobileSearchFocused(false);
                      if (onScrollToProducts) onScrollToProducts();
                    } else if (e.key === 'Escape') {
                      setIsMobileSearchFocused(false);
                    }
                  }}
                  className="w-full bg-[#f5f5f7] text-[#1d1d1f] text-xs pl-9 pr-8 py-2.5 rounded-xl border border-[#d2d2d7]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-2.5 text-[#86868b] hover:text-[#1d1d1f] text-xs font-medium cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Mobile Recent Searches Dropdown */}
              {isMobileSearchFocused && recentSearches.length > 0 && (
                <div
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-[#d2d2d7] overflow-hidden z-50 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between px-3.5 py-2 bg-[#fbfbfd] border-b border-[#f0f0f2]">
                    <div className="flex items-center space-x-1.5 text-[#86868b] text-[11px] font-semibold uppercase tracking-wider">
                      <History className="w-3 h-3 text-[#86868b]" />
                      <span>Recent Searches</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-[11px] text-[#86868b] hover:text-[#e03131] font-medium cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="py-1">
                    {recentSearches.map((term, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectRecentSearch(term)}
                        className="flex items-center justify-between px-3.5 py-2.5 text-xs text-[#1d1d1f] hover:bg-[#f5f5f7] cursor-pointer group"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <Clock className="w-3.5 h-3.5 text-[#86868b] shrink-0 group-hover:text-[#0071e3]" />
                          <span className="font-medium truncate">{term}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(term, e)}
                          className="text-[#86868b] hover:text-[#1d1d1f] p-1 cursor-pointer"
                          title="Remove from history"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Nav Links */}
            <div className="space-y-4 text-[17px] font-semibold tracking-tight border-b border-[#d2d2d7] pb-6">
              <button
                onClick={() => handleAction({ category: 'All', search: '' })}
                className="block w-full text-left py-1 hover:text-[#0071e3]"
              >
                Store
              </button>
              <div className="space-y-1">
                <button
                  onClick={() => handleAction({ category: 'Apple', search: '' })}
                  className="block w-full text-left py-1 hover:text-[#0071e3]"
                >
                  iPhone
                </button>
                <div className="pl-3 space-y-1 text-sm font-normal text-[#86868b]">
                  <button
                    onClick={() => handleAction({ modal: 'upcoming', upcomingSlug: 'iphone-18-pro-max' })}
                    className="block w-full text-left py-0.5 hover:text-[#0071e3]"
                  >
                    iPhone 18 Series
                  </button>
                  <button
                    onClick={() => handleAction({ modal: 'upcoming', upcomingSlug: 'iphone-17-series' })}
                    className="block w-full text-left py-0.5 hover:text-[#0071e3]"
                  >
                    iPhone 17 Series
                  </button>
                  <button
                    onClick={() => handleAction({ category: 'Apple', search: '16' })}
                    className="block w-full text-left py-0.5 hover:text-[#0071e3]"
                  >
                    iPhone 16 Series
                  </button>
                  <button
                    onClick={() => handleAction({ category: 'Apple', search: '15' })}
                    className="block w-full text-left py-0.5 hover:text-[#0071e3]"
                  >
                    iPhone 15 Series
                  </button>
                  <button
                    onClick={() => handleAction({ category: 'Apple', search: '' })}
                    className="block w-full text-left py-0.5 text-[#0071e3] font-medium"
                  >
                    Explore All Models →
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleAction({ category: 'Samsung', search: '' })}
                className="block w-full text-left py-1 hover:text-[#0071e3]"
              >
                Samsung
              </button>
              
              {/* Android */}
              <button
                onClick={() => handleAction({ category: 'Android', search: '' })}
                className="block w-full text-left py-1 hover:text-[#0071e3]"
              >
                Android
              </button>

              <button
                onClick={() => handleAction({ category: 'Pre-Owned', search: '' })}
                className="block w-full text-left py-1 hover:text-[#0071e3]"
              >
                Pre-Owned
              </button>

              <button
                onClick={() => handleAction({ modal: 'upcoming' })}
                className="block w-full text-left py-1 hover:text-[#0071e3]"
              >
                Upcoming Models
              </button>

              <button
                onClick={() => handleAction({ modal: 'valuation' })}
                className="block w-full text-left py-1 hover:text-[#0071e3]"
              >
                Trade In (Exchange)
              </button>

              <button
                onClick={() => handleAction({ modal: 'repair', repairTab: 'book' })}
                className="block w-full text-left py-1 hover:text-[#0071e3]"
              >
                Phone Repair & Lab
              </button>

              <button
                onClick={() => handleAction({ modal: 'repair', repairTab: 'track' })}
                className="block w-full text-left text-[#0071e3] font-semibold text-[15px]"
              >
                Track Repair Status
              </button>
            </div>

            {/* Quick Mobile Refresh */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsRefreshing(true);
                if (onForceRefresh) onForceRefresh();
                setTimeout(async () => {
                  if (typeof window !== 'undefined') {
                    if ('caches' in window) {
                      try {
                        const keys = await window.caches.keys();
                        await Promise.all(keys.map(k => window.caches.delete(k)));
                      } catch (e) {}
                    }
                    sessionStorage.setItem('pms_fresh_update_time', Date.now().toString());
                    const u = new URL(window.location.href);
                    u.searchParams.set('_t', Date.now().toString());
                    window.location.replace(u.toString());
                  }
                }, 300);
              }}
              className="w-full text-left py-2.5 px-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] font-medium flex items-center justify-between hover:bg-[#e8e8ed] transition-colors"
            >
              <div className="flex items-center space-x-2">
                <RefreshCw className={`w-4 h-4 text-[#1d1d1f] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-xs font-semibold">Refresh Store Stock & Data</span>
              </div>
              <span className="text-[10px] bg-black/5 text-[#1d1d1f] px-2 py-0.5 rounded-full font-mono">
                Fresh
              </span>
            </button>

            {/* Store Information */}
            <div className="pt-2 text-xs text-[#86868b] space-y-1.5">
              <p className="text-[#1d1d1f] font-semibold">{storeSettings.storeName}</p>
              <p>{storeSettings.address}, {storeSettings.city}</p>
              <p>Hotline: {storeSettings.phone1}</p>
              <a
                href={formatWhatsAppUrl(storeSettings.whatsapp || storeSettings.phone1)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block pt-1 text-[#0071e3] font-semibold"
              >
                WhatsApp Direct Chat →
              </a>
            </div>

          </div>
        )}

      </header>

      {/* Backdrop overlay for desktop when mega menu is open */}
      {activeTab && (
        <div
          className="fixed inset-0 top-11 bg-black/20 backdrop-blur-xs z-30 pointer-events-none transition-opacity duration-300"
          aria-hidden="true"
        />
      )}
    </>
  );
};
