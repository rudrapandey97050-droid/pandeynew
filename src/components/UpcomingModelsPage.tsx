import React, { useState, useEffect } from 'react';
import { UpcomingModel, StoreSettings } from '../types.ts';
import { DataStorageService } from '../services/dataStorage.ts';
import {
  Sparkles,
  Calendar,
  ArrowLeft,
  Share2,
  Check,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Tag,
  Layers,
  Cpu,
  Camera,
  Battery,
  Zap,
  Info
} from 'lucide-react';

interface UpcomingModelsPageProps {
  initialSlug?: string;
  onBackToStore: () => void;
  onPreBook?: (model: UpcomingModel) => void;
  onOpenPreBooking?: (model?: UpcomingModel) => void;
  storeSettings?: StoreSettings;
}

export const UpcomingModelsPage: React.FC<UpcomingModelsPageProps> = ({
  initialSlug,
  onBackToStore,
  onPreBook,
  onOpenPreBooking,
  storeSettings
}) => {
  const triggerPreBook = (model: UpcomingModel) => {
    if (onOpenPreBooking) {
      onOpenPreBooking(model);
    } else if (onPreBook) {
      onPreBook(model);
    }
  };
  const [models, setModels] = useState<UpcomingModel[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | undefined>(initialSlug);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentSettings = storeSettings || DataStorageService.getStoreSettings();
  const phone = currentSettings.phone1 || '9847460603';
  const rawWa = currentSettings.whatsapp || currentSettings.phone1 || '9847460603';
  const cleanWa = rawWa.replace(/[^0-9]/g, '');
  const finalWa = cleanWa.startsWith('977') ? cleanWa : `977${cleanWa}`;

  useEffect(() => {
    const refreshData = () => {
      const all = DataStorageService.getUpcomingModels().filter(m => m.isActive);
      all.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setModels(all);
    };

    refreshData();

    if (initialSlug) {
      setSelectedSlug(initialSlug);
    }

    const handleSync = (e: any) => {
      if (!e.detail || e.detail.key === 'upcoming' || e.detail.key === 'all') {
        refreshData();
      }
    };

    window.addEventListener('pms_data_sync', handleSync);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('pms_data_sync', handleSync);
      window.removeEventListener('storage', refreshData);
    };
  }, [initialSlug]);

  const selectedModel = selectedSlug
    ? models.find(m => m.slug.toLowerCase() === selectedSlug.toLowerCase() || m.id === selectedSlug)
    : null;

  const handleSelectModel = (slug: string) => {
    setSelectedSlug(slug);
    setActiveImageIndex(0);
    window.history.pushState({}, '', `/upcoming-models/${slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedSlug(undefined);
    window.history.pushState({}, '', '/upcoming-models');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = (model: UpcomingModel) => {
    const url = window.location.origin + `/upcoming-models/${model.slug}`;
    if (navigator.share) {
      navigator.share({
        title: `${model.name} - Pre-Booking at Pandey Mobile Store`,
        text: `Check out the upcoming ${model.name} and pre-book at Pandey Mobile Store, Butwal!`,
        url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {/* Top Header / Breadcrumb Bar */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs sm:text-sm">
            <button
              onClick={onBackToStore}
              className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Store</span>
            </button>
            <span className="text-slate-600">/</span>
            <button
              onClick={handleBackToList}
              className={`hover:text-white transition-colors cursor-pointer ${
                !selectedModel ? 'text-indigo-400 font-bold' : 'text-slate-400'
              }`}
            >
              Upcoming Models
            </button>
            {selectedModel && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-indigo-400 font-bold truncate max-w-[160px] sm:max-w-xs">
                  {selectedModel.name}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-slate-300" />
              <span>Official Pre-Booking Portal</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {selectedModel ? (
          /* ================= SINGLE MODEL DETAIL VIEW ================= */
          <div className="space-y-12 animate-in fade-in duration-300">
            {/* Top Showcase Hero */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Image Gallery */}
              <div className="lg:col-span-6 bg-gradient-to-b from-slate-800/60 to-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center relative shadow-2xl">
                <div className="absolute top-6 left-6 z-10">
                  <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-extrabold rounded-full tracking-wider uppercase shadow-lg flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-slate-200" />
                    {selectedModel.badge || 'COMING SOON'}
                  </span>
                </div>

                <div className="absolute top-6 right-6 z-10">
                  <button
                    onClick={() => handleShare(selectedModel)}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-medium"
                    title="Share model link"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{copiedLink ? 'Copied Link!' : 'Share'}</span>
                  </button>
                </div>

                {/* Primary Image View */}
                <div className="w-full h-72 sm:h-96 flex items-center justify-center my-4">
                  <img
                    src={selectedModel.additionalImages?.[activeImageIndex] || selectedModel.image}
                    alt={selectedModel.name}
                    className="max-h-full max-w-full object-contain drop-shadow-2xl transition-all duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Thumbnail Previews */}
                {selectedModel.additionalImages && selectedModel.additionalImages.length > 1 && (
                  <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-800">
                    {selectedModel.additionalImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition cursor-pointer p-1 bg-slate-950/60 ${
                          activeImageIndex === idx ? 'border-indigo-500 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Model Overview & Booking CTA */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-widest text-indigo-400 mb-2">
                    <span>{selectedModel.brand}</span>
                    <span>•</span>
                    <span>Pandey Mobile Store Traffic Chowk</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">
                    {selectedModel.name}
                  </h1>

                  {selectedModel.tagline && (
                    <p className="text-base sm:text-lg font-medium text-slate-400 mt-2">
                      {selectedModel.tagline}
                    </p>
                  )}
                </div>

                {/* Pricing & Launch Timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-800/70 border border-slate-700/80 rounded-2xl">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Expected Nepal Price
                    </span>
                    <span className="text-lg sm:text-xl font-extrabold text-white block mt-0.5">
                      {selectedModel.expectedPriceText || (selectedModel.expectedPrice ? `Rs. ${selectedModel.expectedPrice.toLocaleString('en-IN')}` : 'Price Coming Soon')}
                    </span>
                  </div>

                  <div className="sm:border-l sm:border-slate-700 sm:pl-4">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Expected Launch
                    </span>
                    <span className="text-lg sm:text-xl font-extrabold text-white block mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-300" />
                      {selectedModel.expectedLaunchDate}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {selectedModel.description}
                </p>

                {/* Available Colors */}
                {selectedModel.availableColors && selectedModel.availableColors.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Expected Color Variants
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedModel.availableColors.map(c => (
                        <span
                          key={c}
                          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Storage Variants */}
                {selectedModel.storageVariants && selectedModel.storageVariants.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Storage Capacities
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedModel.storageVariants.map(v => (
                        <span
                          key={v}
                          className="px-3 py-1.5 bg-indigo-950/60 border border-indigo-500/30 rounded-xl text-xs font-bold text-indigo-300"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => triggerPreBook(selectedModel)}
                    className="flex-1 inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold rounded-2xl shadow-xl shadow-indigo-600/30 transition-all cursor-pointer transform active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-slate-200" />
                    <span>Pre-Book {selectedModel.name}</span>
                  </button>

                  <a
                    href={`https://wa.me/${finalWa}?text=${encodeURIComponent(`Namaste ${currentSettings.storeName}, I am interested in pre-booking the upcoming ${selectedModel.name}. Please notify me when stocks arrive.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition-colors"
                  >
                    <span>WhatsApp Inquiry</span>
                  </a>
                </div>

                {/* Trust Guarantee Card */}
                <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 flex items-start space-x-3 text-xs text-slate-400">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Pandey Mobile Store 100% Genuine Guarantee:</strong> All pre-booked flagships are official Nepal authorized stock, backed by 1-Year National Warranty and priority same-day pickup at Traffic Chowk, Butwal.
                  </span>
                </div>

              </div>
            </div>

            {/* Detailed Specifications Section */}
            <div className="pt-8 border-t border-slate-800 space-y-6">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Technical Specifications & Anticipated Features
                </h3>
              </div>

              {/* Specs Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedModel.specs?.map((spec, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-1 hover:border-slate-700 transition"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {spec.label}
                    </span>
                    <span className="text-sm font-semibold text-slate-200">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Upcoming Models Carousel/Grid */}
            {models.filter(m => m.id !== selectedModel.id).length > 0 && (
              <div className="pt-12 border-t border-slate-800 space-y-6">
                <h3 className="text-xl font-bold text-white">
                  Other Upcoming Flagships at Pandey Mobile Store
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {models.filter(m => m.id !== selectedModel.id).map(m => (
                    <div
                      key={m.id}
                      onClick={() => handleSelectModel(m.slug)}
                      className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="h-40 flex items-center justify-center p-2 mb-3 bg-slate-900/60 rounded-xl">
                          <img
                            src={m.image}
                            alt={m.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                          {m.brand}
                        </span>
                        <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {m.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{m.expectedLaunchDate}</span>
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-200">
                          {m.expectedPriceText || (m.expectedPrice ? `Rs. ${m.expectedPrice.toLocaleString('en-IN')}` : 'Coming Soon')}
                        </span>
                        <span className="text-indigo-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                          View <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= ALL UPCOMING MODELS GRID VIEW ================= */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Hero Header */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="px-3.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-extrabold rounded-full uppercase tracking-wider">
                Pandey Mobile Store Upcoming Lineup
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Upcoming Flagship Smartphones
              </h1>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Be the first in Butwal to experience the latest flagships from Apple, Samsung, and top innovators. Reserve your official unit with zero advance hassle.
              </p>
            </div>

            {/* Grid of Models */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-4">
              {models.map(model => (
                <div
                  key={model.id}
                  className="bg-slate-800/70 border border-slate-700/80 rounded-3xl overflow-hidden shadow-xl hover:border-indigo-500/60 hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="p-6">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2.5 py-0.5 bg-indigo-600/90 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                        {model.badge || 'COMING SOON'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        <span>{model.expectedLaunchDate}</span>
                      </span>
                    </div>

                    {/* Image */}
                    <div 
                      onClick={() => handleSelectModel(model.slug)}
                      className="h-52 w-full flex items-center justify-center bg-slate-900/80 rounded-2xl p-4 cursor-pointer mb-5 overflow-hidden"
                    >
                      <img
                        src={model.image}
                        alt={model.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Details */}
                    <div>
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                        {model.brand}
                      </span>
                      <h3
                        onClick={() => handleSelectModel(model.slug)}
                        className="text-xl font-bold text-white hover:text-indigo-300 transition-colors cursor-pointer mt-0.5"
                      >
                        {model.name}
                      </h3>
                      {model.tagline && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {model.tagline}
                        </p>
                      )}

                      <div className="mt-3 p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Expected Launch & Status
                        </span>
                        <span className="text-sm font-extrabold text-slate-200">
                          {model.expectedPriceText || (model.expectedPrice ? `Rs. ${model.expectedPrice.toLocaleString('en-IN')}` : 'Launch Radar • Official')}
                        </span>
                      </div>

                      {/* Key highlights */}
                      {model.keyFeatures && model.keyFeatures.length > 0 && (
                        <ul className="mt-3 space-y-1 text-xs text-slate-300">
                          {model.keyFeatures.slice(0, 2).map((kf, i) => (
                            <li key={i} className="flex items-start space-x-1.5">
                              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-[9px] font-bold">
                                ✓
                              </span>
                              <span className="line-clamp-1">{kf}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="p-6 pt-0 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => triggerPreBook(model)}
                        className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                      >
                        Pre-Book Now
                      </button>
                      <button
                        onClick={() => handleSelectModel(model.slug)}
                        className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center"
                      >
                        Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Store Info Banner */}
            <div className="mt-12 bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="text-lg font-bold text-white">
                  Looking for a model not listed here?
                </h4>
                <p className="text-xs sm:text-sm text-slate-400">
                  Contact Pandey Mobile Store at Traffic Chowk, Butwal for custom import & pre-booking queries.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <a
                  href={`tel:${phone}`}
                  className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition"
                >
                  Call {phone}
                </a>
                <a
                  href={`https://wa.me/${finalWa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md"
                >
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
