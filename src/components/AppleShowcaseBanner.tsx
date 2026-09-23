import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, StoreSettings } from '../types.ts';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, Play, Pause, ShieldCheck } from 'lucide-react';
import { formatWhatsAppUrl } from '../utils/formatters.ts';

interface AppleShowcaseBannerProps {
  products: Product[];
  onSelectProduct: (p: Product) => void;
  storeSettings?: StoreSettings;
}

export const AppleShowcaseBanner: React.FC<AppleShowcaseBannerProps> = ({
  products,
  onSelectProduct,
  storeSettings
}) => {
  const isBannerEnabled = storeSettings ? storeSettings.showLineupBanner !== false : true;

  const visibleProducts = useMemo(() => {
    return products.filter(p => !p.isHidden);
  }, [products]);

  const appleProducts = useMemo(() => {
    return visibleProducts.filter(
      p => p.brand.toLowerCase() === 'apple' || p.category.toLowerCase() === 'iphone'
    );
  }, [visibleProducts]);

  // 1. Resolve all Lineup Showcase candidates
  const lineupItems: Product[] = useMemo(() => {
    if (!isBannerEnabled || visibleProducts.length === 0) return [];

    let items: Product[] = [];
    if (storeSettings?.lineupProductIds && storeSettings.lineupProductIds.length > 0) {
      items = storeSettings.lineupProductIds
        .map(id => visibleProducts.find(p => p.id === id))
        .filter((p): p is Product => !!p);
    }

    if (items.length === 0) {
      const customLineupItems = visibleProducts
        .filter(p => p.isLineupItem)
        .sort((a, b) => (a.lineupOrder || 99) - (b.lineupOrder || 99));
      if (customLineupItems.length > 0) {
        items = customLineupItems;
      }
    }

    if (items.length === 0) {
      items = appleProducts.length > 0 ? appleProducts : visibleProducts.slice(0, 8);
    }

    // Ensure hero product is prioritized at front if designated
    const designatedHeroId = storeSettings?.lineupHeroProductId || visibleProducts.find(p => p.isLineupHero)?.id;
    if (designatedHeroId) {
      const heroIdx = items.findIndex(p => p.id === designatedHeroId);
      if (heroIdx > 0) {
        const [heroItem] = items.splice(heroIdx, 1);
        items.unshift(heroItem);
      }
    }

    return items;
  }, [isBannerEnabled, storeSettings?.lineupProductIds, storeSettings?.lineupHeroProductId, visibleProducts, appleProducts]);

  // 2. Auto-Slide & Overlap State for Hero Model Showcase
  const [heroIndex, setHeroIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [isAutoSlideEnabled, setIsAutoSlideEnabled] = useState(true);

  // Function to smoothly transition to a specific slide with overlapping animation
  const goToSlide = (newIndex: number, dir?: 'next' | 'prev') => {
    if (newIndex === heroIndex || lineupItems.length <= 1) return;
    const determinedDir = dir || (newIndex > heroIndex ? 'next' : 'prev');
    setPrevIndex(heroIndex);
    setDirection(determinedDir);
    setHeroIndex(newIndex);
  };

  // Reset prevIndex after the 700ms overlap animation completes
  useEffect(() => {
    if (prevIndex !== null) {
      const timer = setTimeout(() => {
        setPrevIndex(null);
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [prevIndex]);

  // Auto-slide effect for Hero Showcase (smooth overlapping transition every 4.5 seconds)
  useEffect(() => {
    if (!isBannerEnabled || !isAutoSlideEnabled || isHeroPaused || lineupItems.length <= 1) return;

    const interval = setInterval(() => {
      goToSlide((heroIndex + 1) % lineupItems.length, 'next');
    }, 4500);

    return () => clearInterval(interval);
  }, [isBannerEnabled, isAutoSlideEnabled, isHeroPaused, lineupItems.length, heroIndex]);

  // 3. Auto-sync cards carousel with active hero model
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isCardsPaused, setIsCardsPaused] = useState(false);

  // Smoothly scroll the comparison cards to center the active hero model
  useEffect(() => {
    const container = cardsContainerRef.current;
    const card = cardRefs.current[heroIndex];
    if (!container || !card || isCardsPaused) return;

    const containerRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const offset =
      cardRect.left - containerRect.left + container.scrollLeft - containerRect.width / 2 + cardRect.width / 2;

    container.scrollTo({
      left: Math.max(0, offset),
      behavior: 'smooth'
    });
  }, [heroIndex, isCardsPaused]);

  // Ensure heroIndex stays in bounds if lineupItems change
  useEffect(() => {
    if (heroIndex >= lineupItems.length && lineupItems.length > 0) {
      setHeroIndex(0);
    }
  }, [lineupItems.length, heroIndex]);

  // Early return safely after all hooks have been invoked
  if (!isBannerEnabled || lineupItems.length === 0) {
    return null;
  }

  const currentHero = lineupItems[heroIndex] || lineupItems[0];

  const handleNextHero = () => {
    goToSlide((heroIndex + 1) % lineupItems.length, 'next');
  };

  const handlePrevHero = () => {
    goToSlide((heroIndex - 1 + lineupItems.length) % lineupItems.length, 'prev');
  };

  const scrollCards = (direction: 'left' | 'right') => {
    const container = cardsContainerRef.current;
    if (!container) return;
    const amount = 300;
    container.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  };

  const title = storeSettings?.lineupTitle || 'Explore the iPhone Lineup';
  const subtitle =
    storeSettings?.lineupSubtitle ||
    'Brand new seal pack with 1-Year Official Apple Nepal Warranty & certified pre-owned phones with testing guarantee. Available at Pandey Mobile, Butwal.';
  const heroBadge =
    currentHero?.lineupBadge || (currentHero?.condition === 'New' ? 'Official Nepal Stock' : 'Certified Pre-Owned');

  return (
    <div className="bg-[#000000] text-white rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-5 sm:p-8 md:p-10 my-4 space-y-6 sm:space-y-8 font-sans">
      
      {/* Top Banner Header (Apple Style) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-slate-200" />
            <span className="transition-all duration-500">{heroBadge}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            {title}
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-xs sm:text-sm text-[#86868b] max-w-sm">
            {subtitle}
          </p>

          {/* Auto-Slide Play/Pause Control Button */}
          {lineupItems.length > 1 && (
            <button
              type="button"
              onClick={() => setIsAutoSlideEnabled(!isAutoSlideEnabled)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-slate-300 hover:text-white border border-white/10 transition-colors self-start cursor-pointer"
              title={isAutoSlideEnabled ? 'Pause Auto Slide' : 'Resume Auto Slide'}
            >
              {isAutoSlideEnabled ? (
                <>
                  <Pause className="w-3 h-3 text-slate-300" />
                  <span className="text-[11px] font-medium">Auto Sliding</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px] font-medium">Auto Slide Paused</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Flagship Hero Card with Smooth Overlapping Auto Slide */}
      <div
        className="relative bg-gradient-to-b from-[#161617] to-[#121212] rounded-3xl p-6 sm:p-8 md:p-10 border border-white/10 overflow-hidden"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        {/* Navigation Arrows for Hero */}
        {lineupItems.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevHero}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl transition-transform hover:scale-110 cursor-pointer"
              aria-label="Previous Lineup Model"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              type="button"
              onClick={handleNextHero}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl transition-transform hover:scale-110 cursor-pointer"
              aria-label="Next Lineup Model"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Slides Container with Smooth Overlapping Stack */}
        <div className="relative w-full min-h-[440px] sm:min-h-[380px] lg:min-h-[330px]">
          {lineupItems.map((item, idx) => {
            const isActive = idx === heroIndex;
            const isPrevious = idx === prevIndex;
            if (!isActive && !isPrevious) return null;

            const tagline = item.lineupTagline || item.specs?.processor || 'Pro Performance • Super Retina XDR';

            return (
              <div
                key={item.id}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center transition-all duration-700 ease-out ${
                  isActive
                    ? 'relative opacity-100 translate-x-0 scale-100 z-10 pointer-events-auto'
                    : `absolute inset-0 opacity-0 ${
                        direction === 'next' ? '-translate-x-10 sm:-translate-x-16' : 'translate-x-10 sm:translate-x-16'
                      } scale-[0.97] z-0 pointer-events-none`
                }`}
              >
                <div className="lg:col-span-6 space-y-4 px-2 sm:px-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                      {tagline}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-semibold">
                      Model {idx + 1} of {lineupItems.length}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                    {item.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#a1a1a6] leading-relaxed line-clamp-3">
                    {item.description ||
                      'Experience unparalleled performance with high-refresh display, flagship grade processing power, pro-grade camera sensor, and guaranteed warranty support.'}
                  </p>

                  {/* Apple Style Hardware & Warranty Highlight (No Price) */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      {item.warranty || '1-Year Official Apple Nepal Warranty + VAT Bill'}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium border border-white/10">
                      {item.storage || 'Official Stock'}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 text-slate-200 text-xs font-medium border border-white/15">
                      {item.condition === 'New' ? 'Brand New Seal Pack' : 'Certified Pre-Owned'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(item)}
                      className="px-6 py-3 rounded-full bg-white text-black hover:bg-[#e8e8ed] font-bold text-xs sm:text-sm transition-all shadow-lg flex items-center space-x-2 cursor-pointer hover:shadow-white/20 hover:scale-[1.02]"
                    >
                      <span>View Full Specs & Inquire</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <a
                      href={formatWhatsAppUrl(
                        storeSettings?.whatsapp || '9857055743',
                        `Hello Pandey Mobile Store, I am inquiring about ${item.name}. Please share details and availability.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm transition-all border border-white/20 flex items-center space-x-2 cursor-pointer"
                    >
                      <span>WhatsApp Inquire</span>
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-6 flex items-center justify-center p-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-h-64 sm:max-h-80 object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)] hover:scale-105 transition-transform duration-500 cursor-pointer"
                    onClick={() => onSelectProduct(item)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Hero Slide Dots / Navigation Indicators with Smooth Overlap Progress */}
        {lineupItems.length > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4 relative z-20">
            {lineupItems.map((item, idx) => {
              const isActive = idx === heroIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToSlide(idx, idx > heroIndex ? 'next' : 'prev')}
                  className={`relative h-2 rounded-full transition-all duration-500 cursor-pointer overflow-hidden ${
                    isActive ? 'w-10 sm:w-12 bg-white/20' : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to slide ${idx + 1}: ${item.name}`}
                  title={item.name}
                >
                  {isActive && isAutoSlideEnabled && !isHeroPaused && (
                    <span className="absolute inset-0 bg-gradient-to-r from-white to-slate-200 rounded-full animate-slide-progress" />
                  )}
                  {isActive && (!isAutoSlideEnabled || isHeroPaused) && (
                    <span className="absolute inset-0 bg-white rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mini Lineup Quick Comparison Carousel (Smoothly synchronized with Hero) */}
      {lineupItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Lineup Showcase Comparison
              </span>
              <span className="text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/10 font-medium">
                Synchronized Auto Slide
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => scrollCards('left')}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCards('right')}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={cardsContainerRef}
            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1"
            onMouseEnter={() => setIsCardsPaused(true)}
            onMouseLeave={() => setIsCardsPaused(false)}
            onTouchStart={() => setIsCardsPaused(true)}
            onTouchEnd={() => setTimeout(() => setIsCardsPaused(false), 2000)}
          >
            {lineupItems.map((item, idx) => {
              const isSelectedHero = idx === heroIndex;
              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    goToSlide(idx, idx > heroIndex ? 'next' : 'prev');
                    onSelectProduct(item);
                  }}
                  className={`min-w-[240px] sm:min-w-[270px] flex-shrink-0 bg-[#161617] hover:bg-[#1f1f22] border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-500 cursor-pointer group ${
                    isSelectedHero
                      ? 'border-white shadow-xl shadow-white/10 bg-[#1e1e23] scale-[1.02]'
                      : 'border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="h-32 sm:h-36 flex items-center justify-center overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 truncate">
                          {item.lineupBadge || (item.condition === 'New' ? 'Brand New' : 'Pre-Owned')}
                        </span>
                        {isSelectedHero && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white text-black">
                            Active Model
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-white group-hover:text-slate-200 transition-colors mt-0.5 line-clamp-1">
                        {item.name}
                      </h4>
                      <p className="text-xs text-[#86868b] mt-0.5 line-clamp-1">
                        {item.lineupTagline || item.specs?.processor || item.storage || 'Official Nepal Stock'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 truncate max-w-[140px]">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span className="truncate">{item.storage || (item.condition === 'New' ? 'Official Nepal Stock' : 'Certified Tested')}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-white flex items-center space-x-0.5 shrink-0">
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


    </div>
  );
};

