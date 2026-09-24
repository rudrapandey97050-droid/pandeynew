import React, { useState } from 'react';
import { MapPin, Navigation, Phone, Clock, ExternalLink, ShieldCheck, Sparkles, CheckCircle2, QrCode } from 'lucide-react';
import { StoreSettings, StorePaymentQR } from '../types.ts';
import { DataStorageService } from '../services/dataStorage.ts';
import { initialPaymentQRs } from '../data/initialPaymentQRs.ts';
import { PaymentQRModal } from './PaymentQRModal.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';

interface GoogleMapsStoreLocatorProps {
  className?: string;
  height?: string;
  showCard?: boolean;
  storeSettings?: StoreSettings;
}

export const STORE_LOCATION = {
  lat: 27.7006,
  lng: 83.4560,
  name: 'Pandey Mobile Store',
  address: 'Traffic Chowk, Main Road, Butwal, Rupandehi, Nepal',
  landmark: 'Traffic Chowk, Main Road, Butwal',
  phone: '9847460603',
  phone2: '9804477123',
  hours: 'Sunday – Friday: 10:00 AM – 8:00 PM',
  googleMapsUrl: 'https://maps.google.com/?q=Traffic+Chowk+Butwal',
  directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=Traffic+Chowk+Butwal',
};

export const GoogleMapsStoreLocator: React.FC<GoogleMapsStoreLocatorProps> = ({
  className = '',
  showCard = true,
  storeSettings
}) => {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const paymentQRs: StorePaymentQR[] =
    storeSettings?.paymentQRs && storeSettings.paymentQRs.length > 0
      ? storeSettings.paymentQRs
      : DataStorageService.getPaymentQRs();

  const showContactQRs =
    (storeSettings?.showPaymentQRsInContact !== false) &&
    paymentQRs.some(q => q.isActive && q.showInContact !== false);

  const handleOpenMap = () => {
    window.open(storeSettings?.googleMapsUrl || STORE_LOCATION.googleMapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleGetDirections = () => {
    window.open(STORE_LOCATION.directionsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`w-full bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden ${className}`}>
      {/* Main Location Card */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>प्रमाणित लोकेसन • Certified Store Location</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-white">
              {STORE_LOCATION.name}
            </h3>

            <div className="space-y-1.5 text-sm text-slate-300">
              <p className="flex items-center gap-2 font-medium text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{STORE_LOCATION.address}</span>
              </p>
              <p className="text-xs text-slate-400">
                प्रमुख ल्याण्डमार्क: बुटवलको मुख्य ट्रफिक चोक, मेन रोड (ट्राफिक बिट नजिकै)
              </p>
            </div>
          </div>

          {/* Map Link Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenMap}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              <span>गुगल म्यापमा हेर्नुहोस् (Open Map)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            <button
              type="button"
              onClick={handleGetDirections}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-bold rounded-2xl border border-white/15 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>बाटो पत्ता लगाउनुहोस् (Get Directions)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Store Information Cards */}
      {showCard && (
        <div className="p-6 sm:p-8 bg-slate-50/70 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs space-y-2">
            <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-slate-900 text-sm">Traffic Chowk Landmark</h5>
            <p className="text-slate-500 text-xs leading-relaxed">
              मेन रोड, ट्रफिक चोक, बुटवल। सजिलै पुग्न सकिने सुविधाजनक लोकेसन।
            </p>
            <a
              href={STORE_LOCATION.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold text-xs pt-1"
            >
              <span>गुगल म्याप लिङ्क</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs space-y-2">
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-slate-900 text-sm">पसल खुल्ने समय</h5>
            <p className="text-slate-500 text-xs leading-relaxed">
              बिहान १०:०० बजे देखि बेलुका ८:०० बजे सम्म (आइतबार – शुक्रबार)
            </p>
            <div className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-[11px] pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>आज खुला छ (Open Today)</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs space-y-2">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-slate-900 text-sm">सम्पर्क / फोन नम्बर</h5>
            <p className="text-slate-500 text-xs leading-relaxed">
              लोकेसन बुझ्न वा मोबाइल स्टक बुझ्न सिधै कल गर्नुहोस्:
            </p>
            <div className="font-bold text-slate-900 text-xs pt-1 space-y-0.5">
              <p>📞 {STORE_LOCATION.phone}</p>
              <p>📱 {STORE_LOCATION.phone2}</p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs space-y-2">
            <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-slate-900 text-sm">स्पट एक्सचेन्ज र मर्मत</h5>
            <p className="text-slate-500 text-xs leading-relaxed">
              ३२-पोइन्ट तत्काल भ्यालुएसन, वारेन्टी सहितका फोनहरू र ल्याब मर्मत सेवा उपलब्ध।
            </p>
            <div className="inline-flex items-center gap-1 text-slate-700 font-semibold text-[11px] pt-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>अन-द-स्पट सेवा</span>
            </div>
          </div>

          {/* Optional 5th / Dedicated QR Payment card if enabled */}
          {showContactQRs && (
            <div className="p-4 bg-gradient-to-br from-indigo-50/70 to-emerald-50/70 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-2 col-span-1 sm:col-span-2 lg:col-span-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-slate-900 text-sm">
                      {storeSettings?.qrPaymentHeading || 'डिजिटल भुक्तानी (Scan & Pay)'}
                    </h5>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      FonePay • eSewa • Khalti • Bank
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                    {storeSettings?.qrPaymentSubheading ||
                      'दुकानमा वा अनलाइनबाट सामान खरिद तथा मर्मत बिल सिधै QR स्क्यान गरी तत्काल भुक्तानी गर्नुहोस्।'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsQRModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>QR कोड स्क्यान गर्नुहोस् (Open QR)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Payment QR Modal */}
      <ErrorBoundary name="PaymentQRModalLocator">
        <PaymentQRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          paymentQRs={paymentQRs}
          storeName={storeSettings?.storeName || STORE_LOCATION.name}
        />
      </ErrorBoundary>
    </div>
  );
};
