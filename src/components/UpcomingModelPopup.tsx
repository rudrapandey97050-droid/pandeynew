import React, { useState, useEffect } from 'react';
import { UpcomingModel, PopupSettings } from '../types.ts';
import { DataStorageService } from '../services/dataStorage.ts';
import {
  X,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Zap,
  Check,
  ShieldCheck,
  Tag
} from 'lucide-react';

interface UpcomingModelPopupProps {
  onPreBook?: (model: UpcomingModel) => void;
  onOpenPreBooking?: (model?: UpcomingModel) => void;
  onViewDetails?: (model: UpcomingModel) => void;
  onNavigateToUpcoming?: (slug?: string) => void;
}

export const UpcomingModelPopup: React.FC<UpcomingModelPopupProps> = ({
  onPreBook,
  onOpenPreBooking,
  onViewDetails,
  onNavigateToUpcoming
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<UpcomingModel[]>([]);
  const [popupSettings, setPopupSettings] = useState<PopupSettings>(() => DataStorageService.getPopupSettings());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isPaused, setIsPaused] = useState(false);

  const goToSlide = (newIndex: number, dir?: 'next' | 'prev') => {
    if (newIndex === currentIndex || models.length <= 1) return;
    const determinedDir = dir || (newIndex > currentIndex ? 'next' : 'prev');
    setPrevIndex(currentIndex);
    setDirection(determinedDir);
    setCurrentIndex(newIndex);
  };

  useEffect(() => {
    if (prevIndex !== null) {
      const timer = setTimeout(() => {
        setPrevIndex(null);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [prevIndex]);

  useEffect(() => {
    // Auto-slide between upcoming models every 4.5 seconds if more than 1 model exists
    if (!isOpen || models.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      goToSlide((currentIndex + 1) % models.length, 'next');
    }, 4500);

    return () => clearInterval(interval);
  }, [isOpen, models.length, isPaused, currentIndex]);

  useEffect(() => {
    // Check if popup is enabled and not already dismissed in this session/window
    const settings = DataStorageService.getPopupSettings();
    setPopupSettings(settings);

    if (!settings.isEnabled) return;

    if (DataStorageService.isPopupDismissed()) {
      return;
    }

    const allUpcoming = DataStorageService.getUpcomingModels().filter(m => m.isActive);
    if (allUpcoming.length === 0) return;

    // Filter featured models
    let featured = allUpcoming.filter(m => m.isFeaturedInPopup);
    if (featured.length === 0) {
      featured = allUpcoming;
    }

    // Sort by display order
    featured.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    // If activeModelId is set in single mode, put it first
    if (settings.mode === 'single' && settings.activeModelId) {
      const found = featured.find(m => m.id === settings.activeModelId);
      if (found) {
        featured = [found];
      }
    }

    setModels(featured);

    const delayMs = (settings.delaySeconds || 2) * 1000;
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    DataStorageService.setPopupDismissed();
  };

  const handlePreBookClick = () => {
    const currentModel = models[currentIndex] || models[0];
    if (currentModel) {
      handleClose();
      if (onOpenPreBooking) {
        onOpenPreBooking(currentModel);
      } else if (onPreBook) {
        onPreBook(currentModel);
      }
    }
  };

  const handleViewDetailsClick = () => {
    const currentModel = models[currentIndex] || models[0];
    if (currentModel) {
      handleClose();
      if (onNavigateToUpcoming) {
        onNavigateToUpcoming(currentModel.slug);
      } else if (onViewDetails) {
        onViewDetails(currentModel);
      }
    }
  };

  const handleNext = () => {
    if (models.length > 1) {
      goToSlide((currentIndex + 1) % models.length, 'next');
    }
  };

  const handlePrev = () => {
    if (models.length > 1) {
      goToSlide((currentIndex - 1 + models.length) % models.length, 'prev');
    }
  };

  if (!isOpen || models.length === 0) return null;

  const current = models[currentIndex] || models[0];

  return (
    <div 
      className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-300"
      onClick={handleClose}
    >
      <div
        className="relative bg-white w-full max-w-2xl sm:max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 animate-in zoom-in-95 duration-300 my-auto"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-300" />
              {popupSettings.heading || 'COMING SOON / UPCOMING MODEL'}
            </span>
          </div>

          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[82vh] overflow-y-auto">
          
          {/* Left / Top Image Showcase (5 columns on desktop) with Smooth Overlap */}
          <div className="md:col-span-5 bg-gradient-to-b from-slate-100 to-slate-200 p-6 sm:p-8 flex flex-col items-center justify-center relative group min-h-[240px] md:min-h-[360px] overflow-hidden">
            {/* Badge */}
            <div className="absolute top-4 left-4 z-20">
              <span className="px-2.5 py-1 bg-slate-900/90 text-white text-[10px] sm:text-[11px] font-extrabold rounded-full tracking-wider uppercase shadow-md flex items-center gap-1 transition-all duration-500">
                <Zap className="w-3 h-3 text-slate-200 fill-slate-200" />
                {current.badge || 'Upcoming Flagship'}
              </span>
            </div>

            {/* Product Image with Smooth Overlapping Transition */}
            <div className="relative w-full h-48 sm:h-64 flex items-center justify-center">
              {models.map((m, idx) => {
                const isActive = idx === currentIndex;
                const isPrevious = idx === prevIndex;
                if (!isActive && !isPrevious) return null;

                return (
                  <div
                    key={m.id}
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${
                      isActive
                        ? 'opacity-100 translate-x-0 scale-100 z-10'
                        : `opacity-0 ${
                            direction === 'next' ? '-translate-x-10' : 'translate-x-10'
                          } scale-95 z-0 pointer-events-none`
                    }`}
                  >
                    <img
                      src={m.image}
                      alt={m.name}
                      className="max-h-full max-w-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                );
              })}
            </div>

            {/* Launch Date Tag */}
            <div className="mt-3 relative z-10 inline-flex items-center space-x-1.5 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-slate-700 text-xs font-semibold shadow-sm border border-slate-200/60 transition-all duration-500">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{current.expectedLaunchDate}</span>
            </div>

            {/* Carousel Navigation Arrows if multiple models */}
            {models.length > 1 && (
              <div className="absolute inset-x-2 bottom-3 flex items-center justify-between pointer-events-none px-2 z-20">
                <button
                  onClick={handlePrev}
                  className="pointer-events-auto w-7 h-7 rounded-full bg-white/90 shadow text-slate-800 flex items-center justify-center hover:bg-white transition cursor-pointer"
                  aria-label="Previous model"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex space-x-1">
                  {models.map((m, i) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => goToSlide(i, i > currentIndex ? 'next' : 'prev')}
                      className={`h-1.5 rounded-full transition-all duration-300 pointer-events-auto cursor-pointer ${
                        i === currentIndex ? 'w-5 bg-indigo-600' : 'w-1.5 bg-slate-400'
                      }`}
                      aria-label={`Go to ${m.name}`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleNext}
                  className="pointer-events-auto w-7 h-7 rounded-full bg-white/90 shadow text-slate-800 flex items-center justify-center hover:bg-white transition cursor-pointer"
                  aria-label="Next model"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Content Details (7 columns on desktop) */}
          <div className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between space-y-4">
            <div>
              {/* Brand and Sub-heading */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600">
                  {current.brand}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Pandey Mobile Store
                </span>
              </div>

              {/* Title & Tagline */}
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {current.name}
              </h3>
              {current.tagline && (
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                  {current.tagline}
                </p>
              )}

              {/* Price Display */}
              <div className="mt-3 py-2 px-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-baseline space-x-2">
                <Tag className="w-4 h-4 text-indigo-600 shrink-0 self-center" />
                <span className="text-sm sm:text-base font-extrabold text-indigo-900">
                  {current.expectedPriceText || (current.expectedPrice ? `Expected Rs. ${current.expectedPrice.toLocaleString('en-IN')}` : 'Price Coming Soon')}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  (Estimated Nepal Launch Price)
                </span>
              </div>

              {/* Short Description */}
              <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed line-clamp-3">
                {current.description}
              </p>

              {/* Key Highlights / Specifications */}
              {current.keyFeatures && current.keyFeatures.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Key Anticipated Highlights
                  </p>
                  <ul className="grid grid-cols-1 gap-1.5 text-xs text-slate-700">
                    {current.keyFeatures.slice(0, 3).map((feat, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span className="font-medium">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Available Colors & Storage Variants Chips */}
              {(current.availableColors?.length > 0 || current.storageVariants?.length > 0) && (
                <div className="mt-3 pt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                  {current.storageVariants?.slice(0, 3).map(v => (
                    <span key={v} className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md border border-slate-200">
                      {v}
                    </span>
                  ))}
                  {current.availableColors?.slice(0, 2).map(c => (
                    <span key={c} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handlePreBookClick}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-5 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Pre-Book Now</span>
                </button>
                <button
                  onClick={handleViewDetailsClick}
                  className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Trust Footer */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1">
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Guaranteed 1st Day Allotment at Butwal</span>
                </span>
                <button
                  onClick={handleClose}
                  className="hover:text-slate-600 underline underline-offset-2 cursor-pointer"
                >
                  Don't show again today
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
