import React from 'react';
import { ShieldCheck, Cpu, Award } from 'lucide-react';
import { StoreSettings } from '../types.ts';

interface WhyPandeySectionProps {
  storeSettings: StoreSettings;
  onOpenValuationModal: () => void;
}

export const WhyPandeySection: React.FC<WhyPandeySectionProps> = ({
  storeSettings
}) => {
  const points = [
    {
      icon: ShieldCheck,
      title: 'Store Warranty Guarantee',
      desc: 'All certified used and new smartphones come with testing warranty and verified IMEI credentials.'
    },
    {
      icon: Cpu,
      title: 'Certified Service Lab',
      desc: 'On-the-spot display replacement, OEM battery installs, and IC micro-soldering with lab testing tools.'
    },
    {
      icon: Award,
      title: '100% Genuine Devices',
      desc: 'Strict non-refurbished motherboard policy. Every used phone passes battery, Face ID, and True Tone checks.'
    }
  ];

  return (
    <section id="trust" className="py-16 bg-white border-t border-slate-200 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Why Butwal Trusts Us</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
            Setting the Standard for Smartphones in Lumbini
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Conveniently located at {storeSettings.address}, {storeSettings.city}. Over 10,000+ satisfied smartphone buyers and repair customers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {points.map((pt, idx) => {
            const Icon = pt.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">{pt.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{pt.desc}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
