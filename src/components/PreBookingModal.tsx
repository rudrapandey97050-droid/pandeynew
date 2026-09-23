import React, { useState, useEffect } from 'react';
import { UpcomingModel, PreBookingRequest } from '../types.ts';
import { DataStorageService } from '../services/dataStorage.ts';
import { X, CheckCircle, Smartphone, Calendar, ShieldCheck, Send, Phone, MessageSquare, Loader2, Sparkles } from 'lucide-react';

interface PreBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  model?: UpcomingModel | null;
  selectedModel?: UpcomingModel | null;
  allModels?: UpcomingModel[];
  onSuccess?: () => void;
  onBookingSuccess?: (booking: PreBookingRequest) => void;
}

export const PreBookingModal: React.FC<PreBookingModalProps> = ({
  isOpen,
  onClose,
  model,
  selectedModel,
  allModels,
  onSuccess,
  onBookingSuccess
}) => {
  const activeModels = allModels && allModels.length > 0
    ? allModels.filter(m => m.isActive)
    : DataStorageService.getUpcomingModels().filter(m => m.isActive);

  const initialTarget = model || selectedModel;
  
  const [modelId, setModelId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [email, setEmail] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState<PreBookingRequest | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const storeSettings = DataStorageService.getStoreSettings();
  const rawWa = storeSettings.whatsapp || storeSettings.phone1 || '9847460603';
  const cleanWa = rawWa.replace(/[^0-9]/g, '');
  const finalWa = cleanWa.startsWith('977') ? cleanWa : `977${cleanWa}`;

  // Synchronize selected model when modal opens
  useEffect(() => {
    if (isOpen) {
      setSubmittedBooking(null);
      setErrorMsg('');
      const target = selectedModel || activeModels[0];
      if (target) {
        setModelId(target.id);
        setSelectedVariant(target.storageVariants?.[0] || '');
        setSelectedColor(target.availableColors?.[0] || '');
      }
    }
  }, [isOpen, selectedModel, activeModels]);

  const currentModel = activeModels.find(m => m.id === modelId) || selectedModel || activeModels[0];

  // Update variant & color options when model changes
  const handleModelChange = (newModelId: string) => {
    setModelId(newModelId);
    const m = activeModels.find(item => item.id === newModelId);
    if (m) {
      setSelectedVariant(m.storageVariants?.[0] || '');
      setSelectedColor(m.availableColors?.[0] || '');
    }
  };

  const handleMobileChange = (val: string) => {
    setMobileNumber(val);
    if (sameAsMobile) {
      setWhatsappNumber(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }

    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    const targetWa = sameAsMobile ? mobileNumber : whatsappNumber;
    if (!targetWa.trim() || targetWa.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid WhatsApp number');
      return;
    }

    if (!currentModel) {
      setErrorMsg('Please select a model');
      return;
    }

    setIsSubmitting(true);

    try {
      const newBooking = DataStorageService.addPreBooking({
        upcomingModelId: currentModel.id,
        modelName: currentModel.name,
        brand: currentModel.brand,
        variant: selectedVariant || undefined,
        color: selectedColor || undefined,
        quantity: quantity || 1,
        customerName: customerName.trim(),
        mobileNumber: mobileNumber.trim(),
        whatsappNumber: targetWa.trim(),
        email: email.trim() || undefined,
        message: message.trim() || undefined
      });

      setTimeout(() => {
        setIsSubmitting(false);
        setSubmittedBooking(newBooking);
        if (onBookingSuccess) {
          onBookingSuccess(newBooking);
        }
        if (onSuccess) {
          onSuccess();
        }
      }, 400);
    } catch {
      setIsSubmitting(false);
      setErrorMsg('Could not submit pre-booking. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                {submittedBooking ? 'Pre-Booking Confirmed' : 'Pre-Book Upcoming Smartphone'}
              </h2>
              <p className="text-xs text-slate-400">
                Pandey Mobile Store • Official Priority Reservation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
          {submittedBooking ? (
            /* SUCCESS STATE */
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
                  Reference ID: {submittedBooking.bookingCode}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Thank you, {submittedBooking.customerName}!
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your pre-booking request for <strong>{submittedBooking.modelName}</strong> ({submittedBooking.variant || 'Standard'} • {submittedBooking.color || 'Default'}) has been received. Pandey Mobile Store will contact you soon on <strong>{submittedBooking.mobileNumber}</strong> when official launch stocks arrive at our Butwal store.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Reserved Model</span>
                  <span className="font-bold text-slate-900">{submittedBooking.modelName}</span>
                </div>
                {submittedBooking.variant && (
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Storage / Variant</span>
                    <span className="font-bold text-slate-900">{submittedBooking.variant}</span>
                  </div>
                )}
                {submittedBooking.color && (
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Color Variant</span>
                    <span className="font-bold text-slate-900">{submittedBooking.color}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Quantity</span>
                  <span className="font-bold text-slate-900">{submittedBooking.quantity} unit(s)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Booking Date</span>
                  <span className="font-bold text-slate-900">{new Date(submittedBooking.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={`https://wa.me/${finalWa}?text=${encodeURIComponent(`Namaste ${storeSettings.storeName}, I have submitted a pre-booking (Code: ${submittedBooking.bookingCode}) for ${submittedBooking.modelName}. Please confirm my reservation status.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Inquire on WhatsApp</span>
                </a>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Done & Return to Store
                </button>
              </div>
            </div>
          ) : (
            /* PRE-BOOKING FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selected Model Preview Card */}
              {currentModel && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 flex items-center space-x-3 sm:space-x-4">
                  <img
                    src={currentModel.image}
                    alt={currentModel.name}
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200 bg-white shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {currentModel.badge || 'Upcoming'}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{currentModel.expectedLaunchDate}</span>
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate mt-0.5">
                      {currentModel.name}
                    </h4>
                    <p className="text-xs font-semibold text-indigo-600">
                      {currentModel.expectedPriceText || (currentModel.expectedPrice ? `Expected Rs. ${currentModel.expectedPrice.toLocaleString('en-IN')}` : 'Price Coming Soon')}
                    </p>
                  </div>
                </div>
              )}

              {/* Model Selector if multiple models are available */}
              {activeModels.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Choose Upcoming Model *
                  </label>
                  <select
                    value={modelId}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {activeModels.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.brand} - {m.name} ({m.expectedLaunchDate})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Variants & Colors Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Storage Variant */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Storage / Variant
                  </label>
                  {currentModel && currentModel.storageVariants && currentModel.storageVariants.length > 0 ? (
                    <select
                      value={selectedVariant}
                      onChange={(e) => setSelectedVariant(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {currentModel.storageVariants.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Preferred storage"
                      value={selectedVariant}
                      onChange={(e) => setSelectedVariant(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  )}
                </div>

                {/* Color Variant */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preferred Color
                  </label>
                  {currentModel && currentModel.availableColors && currentModel.availableColors.length > 0 ? (
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {currentModel.availableColors.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Preferred color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantity
                  </label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4, 5].map(q => (
                      <option key={q} value={q}>{q} unit{q > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer Contact Details */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Customer Contact Information
                </h5>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number (For Call & SMS) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        +977
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="98XXXXXXXX"
                        value={mobileNumber}
                        onChange={(e) => handleMobileChange(e.target.value)}
                        className="w-full pl-14 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        WhatsApp Number *
                      </label>
                      <label className="flex items-center space-x-1 text-[11px] text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sameAsMobile}
                          onChange={(e) => {
                            setSameAsMobile(e.target.checked);
                            if (e.target.checked) setWhatsappNumber(mobileNumber);
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 text-xs"
                        />
                        <span>Same as Mobile</span>
                      </label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        +977
                      </span>
                      <input
                        type="tel"
                        required
                        disabled={sameAsMobile}
                        maxLength={10}
                        placeholder="98XXXXXXXX"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="w-full pl-14 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-bold disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Special Notes / Message <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Any specific accessories or exchange inquiries"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Trust Badge */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 flex items-start space-x-2 text-indigo-900 text-[11px] leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Priority Stock Allocation:</strong> Pre-booking reserves your first-day allotment when official stocks reach Pandey Mobile Store, Traffic Chowk, Butwal. No advance payment required for initial reservation.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Pre-Booking</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
