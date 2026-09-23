import React, { useState, useEffect, useCallback } from 'react';
import {
  Product,
  RateListItem,
  RepairBooking,
  PhoneValuationRequest,
  StoreSettings,
  UpcomingModel
} from './types.ts';
import { DataStorageService } from './services/dataStorage.ts';
import { AuthService } from './services/authService.ts';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { ProductSection } from './components/ProductSection.tsx';
import { RepairSection } from './components/RepairSection.tsx';
import { WhyPandeySection } from './components/WhyPandeySection.tsx';
import { CustomerReviews } from './components/CustomerReviews.tsx';
import { GoogleMapsStoreLocator } from './components/GoogleMapsStoreLocator.tsx';
import { Footer } from './components/Footer.tsx';
import { FloatingWhatsApp } from './components/FloatingWhatsApp.tsx';
import { PhoneValuationModal } from './components/PhoneValuationModal.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { PriceListModal } from './components/PriceListModal.tsx';
import { RepairBookingModal } from './components/RepairBookingModal.tsx';
import { PreOrderBookingModal } from './components/PreOrderBookingModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { AdminLoginPage } from './components/AdminLoginPage.tsx';
import { AccountingPlatform } from './components/accounting/AccountingPlatform.tsx';
import { UpcomingModelPopup } from './components/UpcomingModelPopup.tsx';
import { PreBookingModal } from './components/PreBookingModal.tsx';
import { UpcomingModelsPage } from './components/UpcomingModelsPage.tsx';
import { VersionService } from './services/versionService.ts';
import { FirestoreService } from './services/firestoreService.ts';
import { AppUpdateNotification } from './components/AppUpdateNotification.tsx';
import { GmailStockReportService } from './services/gmailStockReportService.ts';

type ViewMode = 'store' | 'admin-login' | 'admin' | 'upcoming' | 'accounting' | 'accounting-login';

export const App: React.FC = () => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [rateList, setRateList] = useState<RateListItem[]>([]);
  const [bookings, setBookings] = useState<RepairBooking[]>([]);
  const [valuations, setValuations] = useState<PhoneValuationRequest[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => DataStorageService.getStoreSettings());
  const [upcomingSlug, setUpcomingSlug] = useState<string | undefined>(undefined);

  // Determine initial view from URL
  const determineViewFromUrl = useCallback((): { mode: ViewMode; slug?: string; productId?: string } => {
    if (typeof window === 'undefined') return { mode: 'store' };
    const hostname = window.location.hostname.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();

    // 1. Subdomain matching: account.pandeymobile.com.np, accounting.pandeymobile.com.np, acc.pandeymobile.com.np
    const isAccountSubdomain =
      hostname.startsWith('account.') ||
      hostname.startsWith('accounting.') ||
      hostname.startsWith('acc.') ||
      hostname.includes('.account.') ||
      hostname === 'account.pandeymobile.com.np';

    // 2. Direct route & hash matching: /account, /accounting, #account, ?portal=account
    const isAccountRoute =
      path === '/account' || path.startsWith('/account/') ||
      path === '/accounting' || path.startsWith('/accounting/') ||
      hash === '#account' || hash === '#/account' || hash === '#accounting' ||
      search.includes('view=account') || search.includes('portal=account') ||
      search.includes('mode=account') || search.includes('app=account') ||
      search.includes('view=accounting') || search.includes('portal=accounting');

    if (isAccountSubdomain || isAccountRoute) {
      return { mode: AuthService.isAuthenticated() ? 'accounting' : 'accounting-login' };
    }

    const isAdminUrl = path === '/admin' || path.startsWith('/admin/') || hash === '#admin' || search.includes('view=admin') || search.includes('admin=true');
    const isLoginUrl = path === '/login' || path === '/admin/login' || hash === '#login';
    const isUpcomingUrl = path === '/upcoming-models' || path.startsWith('/upcoming-models/') || hash === '#upcoming' || search.includes('view=upcoming');

    if (isAdminUrl) {
      return { mode: AuthService.isAuthenticated() ? 'admin' : 'admin-login' };
    }
    if (isLoginUrl) {
      return { mode: AuthService.isAuthenticated() ? 'admin' : 'admin-login' };
    }
    if (isUpcomingUrl) {
      const match = path.match(/\/upcoming-models\/([a-z0-9-]+)/i);
      return { mode: 'upcoming', slug: match ? match[1] : undefined };
    }

    // Direct product URL: /product/iphone-16-pro-max or ?product=iphone-16-pro-max
    const isProductUrl = path.startsWith('/product/') || search.includes('product=');
    if (isProductUrl) {
      let prodId = '';
      if (path.startsWith('/product/')) {
        prodId = path.replace(/^\/product\//, '').split('/')[0];
      } else {
        const params = new URLSearchParams(window.location.search);
        prodId = params.get('product') || '';
      }
      return { mode: 'store', productId: prodId };
    }

    return { mode: 'store' };
  }, []);

  // Navigation / View state
  const initialView = determineViewFromUrl();
  const [viewMode, setViewMode] = useState<ViewMode>(initialView.mode);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isValuationModalOpen, setIsValuationModalOpen] = useState(false);
  const [valuationInitialMode, setValuationInitialMode] = useState<'sell' | 'exchange'>('sell');
  const [valuationTargetProduct, setValuationTargetProduct] = useState<Product | undefined>(undefined);

  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [isPriceListModalOpen, setIsPriceListModalOpen] = useState(false);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [repairInitialService, setRepairInitialService] = useState<string | undefined>(undefined);
  const [repairInitialTab, setRepairInitialTab] = useState<'book' | 'track'>('book');
  const [repairInitialTrackingCode, setRepairInitialTrackingCode] = useState<string | undefined>(undefined);
  const [selectedOrderProduct, setSelectedOrderProduct] = useState<Product | null>(null);

  // Pre-Booking Modal State for Upcoming Models
  const [preBookingModel, setPreBookingModel] = useState<UpcomingModel | null>(null);
  const [isPreBookingModalOpen, setIsPreBookingModalOpen] = useState(false);

  // Load data on mount
  const refreshData = () => {
    setProducts(DataStorageService.getProducts());
    setRateList(DataStorageService.getRateList());
    setBookings(DataStorageService.getRepairBookings());
    setValuations(DataStorageService.getValuationRequests());
    setStoreSettings(DataStorageService.getStoreSettings());
  };

  useEffect(() => {
    refreshData();

    // 1. Initialize version auto-detection & background update polling
    const cleanupVersionService = VersionService.init();

    // 2. Real-time multi-tab state synchronization
    const unsubscribeDataSync = DataStorageService.subscribeToUpdates(() => {
      refreshData();
    });

    // 3. Real-time Firebase Cloud Database synchronization
    FirestoreService.initConnection().catch(() => {});

    const unsubVal = FirestoreService.subscribeValuations((cloudValuations) => {
      if (cloudValuations && cloudValuations.length > 0) {
        DataStorageService.saveValuations(cloudValuations);
        setValuations(cloudValuations);
      }
    });

    const unsubRep = FirestoreService.subscribeRepairs((cloudRepairs) => {
      if (cloudRepairs && cloudRepairs.length > 0) {
        DataStorageService.saveRepairBookings(cloudRepairs);
        setBookings(cloudRepairs);
      }
    });

    const unsubPb = FirestoreService.subscribePreBookings((cloudPreBookings) => {
      if (cloudPreBookings && cloudPreBookings.length > 0) {
        DataStorageService.savePreBookings(cloudPreBookings);
      }
    });

    // 4. Initialize 9:00 PM Daily Stock Report auto-scheduler (pmesbutwal@gmail.com -> rudra.pandey97050@gmail.com)
    const cleanupGmailScheduler = GmailStockReportService.initAutoScheduler();

    // Verify session in background if admin session is saved
    if (AuthService.isAuthenticated()) {
      AuthService.verifySession().then((isValid) => {
        if (!isValid) {
          if (viewMode === 'admin') {
            setViewMode('admin-login');
          } else if (viewMode === 'accounting') {
            setViewMode('accounting-login');
          }
        }
      });
    }

    // Listen for browser navigation (back/forward, URL changes)
    const handleLocationChange = () => {
      const { mode, slug, productId } = determineViewFromUrl();
      setViewMode(mode);
      setUpcomingSlug(slug);
      if (productId) {
        const found = DataStorageService.getProducts().find(p => p.id === productId);
        setSelectedDetailProduct(found || null);
      } else if (window.location.pathname === '/' || window.location.pathname === '') {
        setSelectedDetailProduct(null);
      }
    };

    // Check if initial URL was a product direct link
    if (initialView.productId) {
      const allProds = DataStorageService.getProducts();
      const found = allProds.find(p => p.id === initialView.productId);
      if (found) {
        setSelectedDetailProduct(found);
      }
    }

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      cleanupVersionService();
      cleanupGmailScheduler();
      unsubscribeDataSync();
      if (unsubVal) unsubVal();
      if (unsubRep) unsubRep();
      if (unsubPb) unsubPb();
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [determineViewFromUrl, viewMode]);

  // Sync browser URL when viewMode changes
  const navigateTo = (mode: ViewMode, slug?: string) => {
    setViewMode(mode);
    setUpcomingSlug(slug);
    const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    const isAccountSubdomain =
      hostname.startsWith('account.') ||
      hostname.startsWith('accounting.') ||
      hostname.startsWith('acc.');

    if (mode === 'admin') {
      window.history.pushState(null, '', '/admin');
    } else if (mode === 'admin-login') {
      window.history.pushState(null, '', '/admin/login');
    } else if (mode === 'accounting') {
      if (!isAccountSubdomain) {
        window.history.pushState(null, '', '/account');
      }
    } else if (mode === 'accounting-login') {
      if (!isAccountSubdomain) {
        window.history.pushState(null, '', '/account/login');
      }
    } else if (mode === 'upcoming') {
      window.history.pushState(null, '', slug ? `/upcoming-models/${slug}` : '/upcoming-models');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (isAccountSubdomain) {
        // Redirect to main store website from the account subdomain
        const mainDomain = hostname.replace(/^(account|accounting|acc)\./, '');
        window.location.href = `${window.location.protocol}//${mainDomain}`;
        return;
      }
      window.history.pushState(null, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handlers
  const handleOpenPreBooking = (model?: UpcomingModel) => {
    if (model) {
      setPreBookingModel(model);
    } else {
      const activeModels = DataStorageService.getUpcomingModels().filter(m => m.isActive);
      setPreBookingModel(activeModels[0] || null);
    }
    setIsPreBookingModalOpen(true);
  };

  const handleOpenValuation = (mode: 'sell' | 'exchange' = 'sell', target?: Product) => {
    setValuationInitialMode(mode);
    setValuationTargetProduct(target);
    setIsValuationModalOpen(true);
  };

  const handleExchangeWithProduct = (prod: Product) => {
    handleOpenValuation('exchange', prod);
  };

  const handleOpenRepair = (serviceName?: string, initialTab: 'book' | 'track' = 'book', initialCode?: string) => {
    setRepairInitialService(serviceName);
    setRepairInitialTab(initialTab);
    setRepairInitialTrackingCode(initialCode);
    setIsRepairModalOpen(true);
  };

  const handleOpenProductDetail = (prod: Product) => {
    setSelectedDetailProduct(prod);
    try {
      window.history.pushState(null, '', `/product/${prod.id}`);
    } catch (e) {}
  };

  const handleCloseProductDetail = () => {
    setSelectedDetailProduct(null);
    try {
      if (window.location.pathname.startsWith('/product/')) {
        window.history.pushState(null, '', '/');
      }
    } catch (e) {}
  };

  const scrollToProducts = () => {
    if (viewMode !== 'store') {
      navigateTo('store');
      setTimeout(() => {
        const el = document.getElementById('products-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    const el = document.getElementById('products-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Dedicated Accounting Login View (Subdomain or /account/login)
  if (viewMode === 'accounting-login') {
    return (
      <AdminLoginPage
        portalTitle="Pandey Accounting Gateway"
        portalSubtitle="Sign in to access Pandey Mobile Store Accounting & ERP Platform (खाता तथा बिलिङ प्रणाली)"
        onLoginSuccess={() => {
          navigateTo('accounting');
        }}
        onBackToStore={() => {
          navigateTo('store');
        }}
      />
    );
  }

  // 2. Dedicated Accounting Platform View (Directly via account.pandeymobile.com.np or /account)
  if (viewMode === 'accounting') {
    if (!AuthService.isAuthenticated()) {
      return (
        <AdminLoginPage
          portalTitle="Pandey Accounting Gateway"
          portalSubtitle="Sign in to access Pandey Mobile Store Accounting & ERP Platform (खाता तथा बिलिङ प्रणाली)"
          onLoginSuccess={() => {
            navigateTo('accounting');
          }}
          onBackToStore={() => {
            navigateTo('store');
          }}
        />
      );
    }

    return (
      <>
        <AppUpdateNotification onManualRefresh={refreshData} />
        <AccountingPlatform
          onBackToWebsite={() => {
            const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
            const isAccountSubdomain =
              hostname.startsWith('account.') ||
              hostname.startsWith('accounting.') ||
              hostname.startsWith('acc.');

            if (isAccountSubdomain) {
              const mainDomain = hostname.replace(/^(account|accounting|acc)\./, '');
              window.location.href = `${window.location.protocol}//${mainDomain}`;
            } else {
              navigateTo('admin');
            }
          }}
        />
      </>
    );
  }

  // 3. Admin Login View
  if (viewMode === 'admin-login') {
    return (
      <AdminLoginPage
        onLoginSuccess={() => {
          navigateTo('admin');
        }}
        onBackToStore={() => {
          navigateTo('store');
        }}
      />
    );
  }

  // 4. Admin Panel View (Protected)
  if (viewMode === 'admin') {
    if (!AuthService.isAuthenticated()) {
      return (
        <AdminLoginPage
          onLoginSuccess={() => {
            navigateTo('admin');
          }}
          onBackToStore={() => {
            navigateTo('store');
          }}
        />
      );
    }

    return (
      <>
        <AppUpdateNotification onManualRefresh={refreshData} />
        <AdminPanel
          onBackToStore={() => navigateTo('store')}
          onLogout={() => {
            navigateTo('store');
          }}
          onNavigateToAccounting={() => navigateTo('accounting')}
          products={products}
          rateList={rateList}
          bookings={bookings}
          valuations={valuations}
          storeSettings={storeSettings}
          onDataRefresh={refreshData}
        />
      </>
    );
  }

  // 3. Dedicated Upcoming Models Page View
  if (viewMode === 'upcoming') {
    return (
      <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
        <AppUpdateNotification onManualRefresh={refreshData} />
        <Navbar
          storeSettings={storeSettings}
          onOpenValuationModal={() => handleOpenValuation('sell')}
          onOpenRepairModal={handleOpenRepair}
          onOpenRateListModal={() => setIsPriceListModalOpen(true)}
          onNavigateToUpcoming={() => navigateTo('upcoming')}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            navigateTo('store');
          }}
          onScrollToProducts={scrollToProducts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onForceRefresh={refreshData}
        />

        <UpcomingModelsPage
          initialSlug={upcomingSlug}
          onOpenPreBooking={handleOpenPreBooking}
          onBackToStore={() => navigateTo('store')}
        />

        <Footer
          storeSettings={storeSettings}
          onOpenValuationModal={() => handleOpenValuation('sell')}
          onOpenRepairModal={handleOpenRepair}
          onOpenRateListModal={() => setIsPriceListModalOpen(true)}
        />

        <FloatingWhatsApp whatsappNumber={storeSettings.whatsapp} />

        {/* Pre-Booking Modal */}
        <PreBookingModal
          isOpen={isPreBookingModalOpen}
          onClose={() => setIsPreBookingModalOpen(false)}
          model={preBookingModel}
          onSuccess={refreshData}
        />
      </div>
    );
  }

  // 4. Visitor Storefront View
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      <AppUpdateNotification onManualRefresh={refreshData} />
      
      {/* Automatic Upcoming Model Popup (Triggers after 2-3s on visitor first arrival) */}
      <UpcomingModelPopup
        onOpenPreBooking={handleOpenPreBooking}
        onNavigateToUpcoming={(slug?: string) => navigateTo('upcoming', slug)}
      />

      {/* Navbar (Visitor mode - no admin controls visible) */}
      <Navbar
        storeSettings={storeSettings}
        onOpenValuationModal={() => handleOpenValuation('sell')}
        onOpenRepairModal={handleOpenRepair}
        onOpenRateListModal={() => setIsPriceListModalOpen(true)}
        onNavigateToUpcoming={() => navigateTo('upcoming')}
        onSelectCategory={setSelectedCategory}
        onScrollToProducts={scrollToProducts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onForceRefresh={refreshData}
      />

      {/* Hero Section */}
      <Hero
        storeSettings={storeSettings}
        onOpenValuationModal={() => handleOpenValuation('sell')}
        onOpenRepairModal={handleOpenRepair}
        onOpenUpcoming={() => navigateTo('upcoming')}
        onScrollToProducts={scrollToProducts}
      />

      {/* Products Catalog Section */}
      <ProductSection
        products={products}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onSelectProduct={handleOpenProductDetail}
        onExchangeWithThis={handleExchangeWithProduct}
        onOrderProduct={(p) => setSelectedOrderProduct(p)}
        searchQuery={searchQuery}
        storeSettings={storeSettings}
      />

      {/* Express Repair Section */}
      <RepairSection
        onOpenRepairModal={handleOpenRepair}
      />

      {/* Why Pandey Mobile Store Section */}
      <WhyPandeySection
        storeSettings={storeSettings}
        onOpenValuationModal={() => handleOpenValuation('sell')}
      />

      {/* Customer Reviews & Testimonials (Social Proof from Firestore) */}
      <CustomerReviews
        onOpenValuationModal={() => handleOpenValuation('sell')}
        onOpenRepairModal={handleOpenRepair}
      />

      {/* Google Maps Store Location Section */}
      <section id="store-location" className="py-12 bg-slate-50 border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 inline-block">
              Store Location & Google Map Link
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Visit Our Store at Traffic Chowk, Butwal
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pandey Mobile Store is situated at Traffic Chowk, Main Road, Butwal. Visit us for instant 32-point spot valuations, device exchange, certified smartphones, and express certified repairs.
            </p>
          </div>
          <GoogleMapsStoreLocator height="auto" showCard={true} />
        </div>
      </section>

      {/* Footer (Visitor mode - no admin controls visible) */}
      <Footer
        storeSettings={storeSettings}
        onOpenValuationModal={() => handleOpenValuation('sell')}
        onOpenRepairModal={handleOpenRepair}
        onOpenUpcoming={() => navigateTo('upcoming')}
      />

      {/* WhatsApp Quick Chat */}
      <FloatingWhatsApp whatsappNumber={storeSettings.whatsapp} />

      {/* MODALS */}

      {/* 1. Pre-Booking Modal for Upcoming Models */}
      <PreBookingModal
        isOpen={isPreBookingModalOpen}
        onClose={() => setIsPreBookingModalOpen(false)}
        model={preBookingModel}
        onSuccess={refreshData}
      />

      {/* 2. Mobile Valuation & Exchange Modal */}
      <PhoneValuationModal
        isOpen={isValuationModalOpen}
        onClose={() => setIsValuationModalOpen(false)}
        products={products}
        initialType={valuationInitialMode}
        selectedTargetProduct={valuationTargetProduct}
        onSuccess={refreshData}
      />

      {/* 3. Product Detail Modal */}
      <ProductDetailModal
        product={selectedDetailProduct}
        onClose={handleCloseProductDetail}
        onExchangeWithThis={handleExchangeWithProduct}
        onOrderProduct={(p) => {
          handleCloseProductDetail();
          setSelectedOrderProduct(p);
        }}
      />

      {/* 4. Rate Sheet Modal */}
      {isPriceListModalOpen && (
        <PriceListModal
          rateList={rateList}
          onClose={() => setIsPriceListModalOpen(false)}
          onOpenValuationModal={() => {
            setIsPriceListModalOpen(false);
            handleOpenValuation('sell');
          }}
        />
      )}

      {/* 5. Repair Booking Modal */}
      {isRepairModalOpen && (
        <RepairBookingModal
          initialService={repairInitialService}
          initialTab={repairInitialTab}
          initialTrackingCode={repairInitialTrackingCode}
          storeSettings={storeSettings}
          onClose={() => setIsRepairModalOpen(false)}
          onSuccess={refreshData}
        />
      )}

      {/* 6. Pre-Order / Hold Modal */}
      <PreOrderBookingModal
        product={selectedOrderProduct}
        onClose={() => setSelectedOrderProduct(null)}
        onSuccess={refreshData}
      />

    </div>
  );
};
