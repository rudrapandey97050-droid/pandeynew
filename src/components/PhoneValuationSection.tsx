import React from 'react';
import {
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  DollarSign
} from 'lucide-react';

interface PhoneValuationSectionProps {
  onOpenValuationModal: (type?: 'sell' | 'exchange') => void;
}

export const PhoneValuationSection: React.FC<PhoneValuationSectionProps> = ({
  onOpenValuationModal
}) => {
  return (
    <section id="valuation-section" className="py-16 bg-slate-900 text-white relative overflow-hidden scroll-mt-16">
      <div id="valuation" className="absolute -top-20 left-0" />
      
      {/* Background accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-400/30 px-3.5 py-1.5 rounded-full text-amber-300 text-xs font-bold">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Customer Mobile Valuation & Exchange Center</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-serif tracking-tight">
            Get the Highest Value for Your Old Phone in Butwal
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Sell your used smartphone for instant payment or trade it in to upgrade to any brand-new or certified used device with transparent 14-point all-round condition evaluation.
          </p>
        </div>

        {/* 2 Big Action Paths (Sell vs Exchange) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Sell Old Phone */}
          <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xl flex flex-col justify-between space-y-6 hover:border-indigo-500/60 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif text-white">
                Option A: Sell Old Phone for Cash / Store Value
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Got a phone you no longer use? Submit your model, 14-point condition check, and photos. We will review your submission and provide a fair valuation quote.
              </p>
              
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Fair market valuation based on verified condition</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unique Valuation ID generated instantly</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Same-day payment upon 10-minute counter inspection</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onOpenValuationModal('sell')}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-lg flex items-center justify-center space-x-2"
            >
              <span>Submit Sell Valuation Request</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Exchange with New Phone */}
          <div className="bg-gradient-to-br from-slate-800/90 to-indigo-950/80 rounded-3xl p-6 sm:p-8 border-2 border-amber-500/40 shadow-xl flex flex-col justify-between space-y-6 hover:border-amber-400 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-[11px] font-bold rounded-full border border-amber-500/30">
                  Popular Upgrade
                </span>
              </div>

              <h3 className="text-xl font-bold font-serif text-white">
                Option B: Exchange Old Phone with New Smartphone
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Choose any phone from our store catalog (iPhone, Samsung Galaxy, Xiaomi) and exchange your current smartphone to pay only the difference adjustment amount.
              </p>

              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Pick desired phone from Pandey Store catalog</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Deduct old phone valuation directly from new phone price</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Hassle-free data transfer assistance at our Butwal store</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onOpenValuationModal('exchange')}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
            >
              <span>Start Exchange Upgrade Request</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
