import React, { useState } from 'react';
import {
  Wrench,
  Calendar,
  Phone,
  ShieldCheck,
  ArrowRight,
  Search,
  CheckCircle2,
  Cpu,
  Sparkles
} from 'lucide-react';

interface RepairSectionProps {
  onOpenRepairModal: (serviceName?: string, initialTab?: 'book' | 'track', initialCode?: string) => void;
}

export const RepairSection: React.FC<RepairSectionProps> = ({
  onOpenRepairModal
}) => {
  const [quickCode, setQuickCode] = useState('');

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickCode.trim()) {
      onOpenRepairModal(undefined, 'track', quickCode.trim());
    } else {
      onOpenRepairModal(undefined, 'track');
    }
  };

  return (
    <section id="repair-section" className="py-12 bg-slate-900 text-white relative overflow-hidden scroll-mt-16">
      <div id="repair" className="absolute -top-20 left-0" />
      <div id="track-repair" className="absolute -top-20 left-0" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Banner CTA */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-700 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-200 uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full border border-white/20">
              <Wrench className="w-3.5 h-3.5 text-slate-300" />
              <span>Express Service Lab • Traffic Chowk, Butwal</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-serif text-white tracking-tight">
              Professional Smartphone Repair & Live Status Tracking
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Display replacement, battery change, and motherboard micro-soldering with 100% genuine parts and store warranty. Track your device repair progress live online anytime.
            </p>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs text-slate-400">
              <span className="flex items-center space-x-1.5 text-slate-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Original Parts</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Up to 90 Days Lab Warranty</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-300 font-medium">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Live Status Updates</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
            {/* Quick Track Input Bar */}
            <form
              onSubmit={handleQuickTrack}
              className="flex items-center w-full sm:w-auto bg-slate-950/80 p-1.5 rounded-2xl border border-slate-700 shadow-inner"
            >
              <input
                type="text"
                placeholder="Enter Booking ID / Phone"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value)}
                className="px-3 py-2 bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-hidden w-full sm:w-44 font-mono font-semibold"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1 shrink-0 cursor-pointer"
                title="Track Repair"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Track</span>
              </button>
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onOpenRepairModal(undefined, 'track')}
                className="flex-1 sm:flex-none px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl border border-slate-600 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Track Status</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenRepairModal(undefined, 'book')}
                className="flex-1 sm:flex-none px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Repair</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
