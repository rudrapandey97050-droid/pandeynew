import React from 'react';
import { MapPin, Phone, ShieldCheck, Clock, Search, Navigation, ExternalLink, Sparkles } from 'lucide-react';
import { StoreSettings } from '../types.ts';

interface FooterProps {
  storeSettings: StoreSettings;
  onOpenValuationModal: () => void;
  onOpenRepairModal: (serviceName?: string, initialTab?: 'book' | 'track') => void;
  onOpenRateListModal?: () => void;
  onOpenUpcoming?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  storeSettings,
  onOpenValuationModal,
  onOpenRepairModal,
  onOpenRateListModal,
  onOpenUpcoming
}) => {
  const mapDirectionsUrl = storeSettings.googleMapsUrl || "https://maps.google.com/?q=Traffic+Chowk+Butwal";

  return (
    <footer className="bg-slate-950 text-white pt-12 pb-8 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-bold">
                <img
                  src="https://1000logos.net/wp-content/uploads/2017/02/Apple-Logo.png"
                  alt="Apple Logo"
                  className="w-4 h-4 object-contain brightness-0 invert"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-base font-bold font-serif">{storeSettings.storeName}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {storeSettings.tagline}. Leading destination for new smartphones, certified used iPhones, mobile repairs, and transparent exchange in Butwal, Nepal.
            </p>
            <div className="text-xs text-slate-400 space-y-1.5 pt-1">
              <a
                href={mapDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 hover:text-white transition-colors group"
                title="View on Google Maps"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{storeSettings.address}, {storeSettings.city}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
              </a>
              <p className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a href={`tel:${storeSettings.phone1}`} className="hover:text-emerald-400 transition-colors">
                  {storeSettings.phone1}
                </a>
                <span>/</span>
                <a href={`tel:${storeSettings.phone2}`} className="hover:text-emerald-400 transition-colors">
                  {storeSettings.phone2}
                </a>
              </p>
              <p className="flex items-center space-x-2 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{storeSettings.openingHours || 'Sun – Fri: 9:30 AM – 8:00 PM'}</span>
              </p>
            </div>
          </div>

          {/* Quick Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Quick Services & Tracking</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onOpenRepairModal(undefined, 'track')}
                  className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer text-left flex items-center space-x-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Track Smartphone Repair Status</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenRepairModal(undefined, 'book')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Schedule Smartphone Repair Lab
                </button>
              </li>
              <li>
                <button onClick={onOpenValuationModal} className="hover:text-white transition-colors cursor-pointer text-left">
                  Mobile Valuation & Exchange
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenUpcoming}
                  className="text-slate-200 hover:text-white transition-colors cursor-pointer text-left flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3 text-slate-300" />
                  <span>Upcoming Models & Launch Dates</span>
                </button>
              </li>
              <li>
                <a href="#products-section" className="hover:text-white transition-colors">
                  Browse Smartphones & Accessories
                </a>
              </li>
            </ul>
          </div>

          {/* Shop Location & Google Map Link (Traffic Chowk, Butwal) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>Shop Location (पसलको ठेगाना)</span>
            </h4>

            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900 shadow-md space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Traffic Chowk, Butwal (ट्रफिक चोक, बुटवल)</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Main Road, Traffic Chowk, Butwal, Rupandehi, Nepal
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
                <a
                  href={mapDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xs group"
                  title="Open Traffic Chowk location in Google Maps"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>गुगल म्यापमा खोल्नुहोस् (Open Map)</span>
                  <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                </a>

                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Traffic+Chowk+Butwal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center space-x-1.5 border border-slate-700"
                >
                  <Navigation className="w-3 h-3 text-emerald-400" />
                  <span>बाटोको दिशा (Get Directions)</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Pandey Mobile Store. All rights reserved. Traffic Chowk, Butwal, Nepal.</p>
          
          <div className="flex items-center space-x-4">
            <a
              href={mapDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Google Maps Direction</span>
            </a>

            <p className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Trusted Mobile Services</span>
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};
