import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Wrench,
  Calendar,
  Clock,
  CheckCircle2,
  Phone,
  User,
  Upload,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  Search,
  Copy,
  Check,
  ArrowRight,
  MapPin,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { DataStorageService } from '../services/dataStorage.ts';
import { RepairBooking, RepairStatus, StoreSettings } from '../types.ts';
import { formatNPR } from '../utils/formatters.ts';

interface RepairBookingModalProps {
  initialService?: string;
  initialTab?: 'book' | 'track';
  initialTrackingCode?: string;
  onClose: () => void;
  onSuccess: () => void;
  storeSettings?: StoreSettings;
}

const COMMON_BRANDS = [
  'Apple',
  'Samsung',
  'Vivo',
  'POCO',
  'HONOR',
  'Redmi',
  'Xiaomi',
  'OnePlus',
  'Realme',
  'Other'
];

const PROBLEM_TYPES = [
  'Broken Display / Touch Screen',
  'Battery Replacement / Fast Drain',
  'Not Charging / Charging Port Damage',
  'Back Glass / Housing Damage',
  'Camera Blur / Broken Camera Lens',
  'Water Damage / Liquid Ingress',
  'Motherboard / Dead Phone / IC Issue',
  'Speaker / Mic / Earpiece Problem',
  'Face ID / Fingerprint Sensor',
  'Software / Bootloop / Unlock',
  'Other Hardware Problem'
];

const TIME_SLOTS = [
  '10:00 AM - 01:00 PM (Morning Slot)',
  '01:00 PM - 04:00 PM (Afternoon Slot)',
  '04:00 PM - 07:30 PM (Evening Slot)'
];

const STATUS_ORDER: RepairStatus[] = [
  'New',
  'Diagnosing',
  'Price Estimated',
  'Repairing',
  'Ready',
  'Completed'
];

const STATUS_INFO: Record<RepairStatus, {
  label: string;
  step: number;
  badgeBg: string;
  badgeText: string;
  description: string;
  actionHint: string;
}> = {
  New: {
    label: 'Booking Received',
    step: 1,
    badgeBg: 'bg-blue-100 border-blue-300',
    badgeText: 'text-blue-900',
    description: 'Your repair booking has been registered. Please drop off your device at Traffic Chowk lab.',
    actionHint: 'Bring device to Pandey Mobile Store, Traffic Chowk, Butwal.'
  },
  Contacted: {
    label: 'Contacted by Lab',
    step: 1,
    badgeBg: 'bg-indigo-100 border-indigo-300',
    badgeText: 'text-indigo-900',
    description: 'Technician reached out to confirm appointment and intake details.',
    actionHint: 'Awaiting drop-off or initial diagnostic check.'
  },
  Diagnosing: {
    label: 'Under Lab Diagnosis',
    step: 2,
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-900',
    description: 'Senior technician is inspecting motherboard, display circuits, and components.',
    actionHint: 'Diagnostic testing in progress in our cleanroom lab.'
  },
  'Price Estimated': {
    label: 'Estimate Ready / Approval Required',
    step: 3,
    badgeBg: 'bg-purple-100 border-purple-300',
    badgeText: 'text-purple-900',
    description: 'Diagnostic complete. Cost & parts quotation is prepared for your review.',
    actionHint: 'Please confirm price with technician via WhatsApp or phone.'
  },
  'Repair Approved': {
    label: 'Repair Approved',
    step: 3,
    badgeBg: 'bg-sky-100 border-sky-300',
    badgeText: 'text-sky-900',
    description: 'Customer approved the quotation. Genuine parts allocated.',
    actionHint: 'Parts assigned from warehouse inventory.'
  },
  Repairing: {
    label: 'Micro-Soldering / Repair in Progress',
    step: 4,
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-900',
    description: 'Component installation, laser housing alignment, or circuit micro-soldering actively underway.',
    actionHint: 'Post-repair 15-point QC tests will begin shortly.'
  },
  Ready: {
    label: '🎉 Ready for Pickup!',
    step: 5,
    badgeBg: 'bg-emerald-100 border-emerald-300 animate-pulse',
    badgeText: 'text-emerald-950 font-black',
    description: 'Repair completed & passed all quality checks! Your device is waiting for pickup.',
    actionHint: 'Visit Pandey Mobile Store, Traffic Chowk with your booking code to collect your phone.'
  },
  Completed: {
    label: '✅ Completed & Delivered',
    step: 6,
    badgeBg: 'bg-slate-100 border-slate-300',
    badgeText: 'text-slate-800 font-bold',
    description: 'Device picked up by customer with warranty slip & invoice.',
    actionHint: 'Warranty is active. Thank you for choosing Pandey Mobile!'
  },
  Cancelled: {
    label: 'Cancelled',
    step: 0,
    badgeBg: 'bg-rose-100 border-rose-300',
    badgeText: 'text-rose-900',
    description: 'This repair request was cancelled or closed upon customer request.',
    actionHint: 'Contact our service lab if you need any assistance.'
  }
};

export const RepairBookingModal: React.FC<RepairBookingModalProps> = ({
  initialService,
  initialTab = 'book',
  initialTrackingCode = '',
  onClose,
  onSuccess,
  storeSettings
}) => {
  const currentSettings = storeSettings || DataStorageService.getStoreSettings();
  const labHotline = currentSettings.technicianPhone || currentSettings.phone1 || '9847460603';
  const rawWa = currentSettings.whatsapp || currentSettings.phone1 || '9847460603';
  const cleanWa = rawWa.replace(/[^0-9]/g, '');
  const finalWa = cleanWa.startsWith('977') ? cleanWa : `977${cleanWa}`;

  const [activeTab, setActiveTab] = useState<'book' | 'track'>(initialTab);

  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [mobileBrand, setMobileBrand] = useState('Apple');
  const [customBrand, setCustomBrand] = useState('');
  const [mobileModel, setMobileModel] = useState('');
  
  // Map initialService if provided
  const mapInitialProblem = (init?: string) => {
    if (!init) return 'Broken Display / Touch Screen';
    if (init.toLowerCase().includes('display') || init.toLowerCase().includes('screen')) {
      return 'Broken Display / Touch Screen';
    }
    if (init.toLowerCase().includes('battery')) {
      return 'Battery Replacement / Fast Drain';
    }
    if (init.toLowerCase().includes('motherboard') || init.toLowerCase().includes('ic')) {
      return 'Motherboard / Dead Phone / IC Issue';
    }
    if (init.toLowerCase().includes('back glass') || init.toLowerCase().includes('housing')) {
      return 'Back Glass / Housing Damage';
    }
    return init;
  };

  const [problemType, setProblemType] = useState(mapInitialProblem(initialService));
  const [problemDescription, setProblemDescription] = useState('');
  
  // Date and Time
  const todayStr = new Date().toISOString().split('T')[0];
  const [preferredDate, setPreferredDate] = useState(todayStr);
  const [preferredTime, setPreferredTime] = useState(TIME_SLOTS[0]);
  
  // Optional Photo
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [submitted, setSubmitted] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<RepairBooking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ----------------------------------------------------
  // TRACKING STATE
  // ----------------------------------------------------
  const [searchQuery, setSearchQuery] = useState(initialTrackingCode);
  const [hasSearched, setHasSearched] = useState(false);
  const [foundBookings, setFoundBookings] = useState<RepairBooking[]>([]);
  const [selectedTrackBooking, setSelectedTrackBooking] = useState<RepairBooking | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Auto-search if initialTrackingCode is provided, or sync tab
  useEffect(() => {
    if (initialTrackingCode) {
      setActiveTab('track');
      setSearchQuery(initialTrackingCode);
      handleSearchTracking(initialTrackingCode);
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTrackingCode, initialTab]);

  // Handle Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size should be under 5MB.');
      return;
    }

    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPhoto(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhotoError(null);

    const trimmedName = customerName.trim();
    const trimmedPhone = phoneNumber.trim();
    const finalBrand = mobileBrand === 'Other' ? (customBrand.trim() || 'Other') : mobileBrand;
    const trimmedModel = mobileModel.trim();
    const trimmedDesc = problemDescription.trim();

    if (!trimmedName) {
      alert('Please enter your full name.');
      return;
    }

    if (!trimmedPhone || trimmedPhone.length < 7) {
      alert('Please enter a valid mobile phone number for appointment confirmation.');
      return;
    }

    if (!trimmedModel) {
      alert('Please enter your phone model (e.g. iPhone 15 Pro, Galaxy S23 Ultra, Vivo V30).');
      return;
    }

    setIsSubmitting(true);

    try {
      const newBooking = DataStorageService.addRepairBooking({
        customerName: trimmedName,
        phoneNumber: trimmedPhone,
        customerAddress: customerAddress.trim() || undefined,
        mobileBrand: finalBrand,
        mobileModel: trimmedModel,
        problemType,
        problemDescription: trimmedDesc || 'Customer booked appointment via website for technical inspection.',
        preferredDate,
        preferredTime,
        photo: photo || undefined,
        status: 'New'
      });

      setCreatedBooking(newBooking);
      setSubmitted(true);
      onSuccess();
    } catch (err) {
      console.error('Failed to submit repair booking', err);
      alert(`There was an issue saving your booking. Please try again or call our lab at ${labHotline}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tracking Search
  const handleSearchTracking = (queryStr: string = searchQuery) => {
    const q = queryStr.trim();
    if (!q) return;

    setHasSearched(true);
    const results = DataStorageService.findRepairBookingsByQuery(q);
    setFoundBookings(results);
    if (results.length > 0) {
      setSelectedTrackBooking(results[0]);
    } else {
      setSelectedTrackBooking(null);
    }
  };

  // Copy booking code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Switch to tracker tab with created booking
  const handleTrackNewBooking = () => {
    if (!createdBooking) return;
    setSearchQuery(createdBooking.bookingCode);
    setSelectedTrackBooking(createdBooking);
    setFoundBookings([createdBooking]);
    setHasSearched(true);
    setActiveTab('track');
  };

  // Recent bookings for quick chips
  const allBookings = DataStorageService.getRepairBookings();
  const recentBookings = allBookings.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Header with Segmented Tab Switcher */}
        <div className="bg-slate-900 text-white shrink-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Wrench className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-base font-serif">Smartphone Express Repair Lab</h3>
                <p className="text-xs text-slate-400">Traffic Chowk, Butwal • Pandey Mobile Store</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Segmented Top Tabs */}
          <div className="px-6 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('book')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'book'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Repair Appointment</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('track');
                  if (!hasSearched && allBookings.length > 0 && !searchQuery) {
                    // prefill latest
                    setSearchQuery(allBookings[0].bookingCode);
                    handleSearchTracking(allBookings[0].bookingCode);
                  }
                }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'track'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-emerald-300" />
                <span>Track Repair Status</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 ml-1">
                  Live
                </span>
              </button>
            </div>

            <div className="flex items-center space-x-1 text-[11px] text-slate-400">
              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
              <a href={`tel:${labHotline}`} className="hover:text-emerald-400 transition-colors font-medium">
                <span>Lab Hotline: {labHotline}</span>
              </a>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: TRACK REPAIR STATUS VIEW */}
        {/* ========================================================================= */}
        {activeTab === 'track' ? (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* Search Bar */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Search className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Enter Booking Reference ID or Phone Number</span>
                </label>
                <span className="text-[11px] text-slate-500">e.g. PMS-REP-2026-XXXX or {labHotline}</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchTracking();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    placeholder="Enter Booking Code (PMS-REP-...) or 10-digit Phone"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setFoundBookings([]);
                        setSelectedTrackBooking(null);
                        setHasSearched(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Check Status</span>
                </button>
              </form>

              {/* Quick Suggestion Chips */}
              {recentBookings.length > 0 && !selectedTrackBooking && (
                <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-500">Recent Lab Tickets:</span>
                  {recentBookings.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(b.bookingCode);
                        handleSearchTracking(b.bookingCode);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-700 rounded-lg font-mono font-bold transition cursor-pointer flex items-center space-x-1"
                    >
                      <span>{b.bookingCode}</span>
                      <span className="text-[9px] text-slate-500">({b.mobileModel})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* If Multiple Found */}
            {foundBookings.length > 1 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Found {foundBookings.length} repair tickets matching your search:
                </span>
                <div className="flex flex-wrap gap-2">
                  {foundBookings.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedTrackBooking(b)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center space-x-2 ${
                        selectedTrackBooking?.id === b.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-mono font-bold">{b.bookingCode}</span>
                      <span>•</span>
                      <span>{b.mobileBrand} {b.mobileModel}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/20">
                        {b.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Selected Booking Tracking Card */}
            {selectedTrackBooking ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                
                {/* Status Hero Card */}
                {(() => {
                  const statusDetails = STATUS_INFO[selectedTrackBooking.status] || STATUS_INFO.New;
                  const isCancelled = selectedTrackBooking.status === 'Cancelled';
                  const isReady = selectedTrackBooking.status === 'Ready';
                  const isCompleted = selectedTrackBooking.status === 'Completed';

                  return (
                    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-black text-amber-400 text-sm tracking-wide">
                              {selectedTrackBooking.bookingCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(selectedTrackBooking.bookingCode)}
                              className="p-1 text-slate-400 hover:text-white bg-slate-800/80 rounded-md transition"
                              title="Copy Code"
                            >
                              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <h4 className="text-lg font-black text-white font-serif mt-0.5">
                            {selectedTrackBooking.mobileBrand} {selectedTrackBooking.mobileModel}
                          </h4>
                        </div>

                        {/* Status Badge */}
                        <div className={`px-3.5 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider self-start sm:self-auto ${
                          isReady ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse shadow-md shadow-emerald-500/30' :
                          isCancelled ? 'bg-rose-950 text-rose-300 border-rose-800' :
                          isCompleted ? 'bg-slate-800 text-emerald-400 border-emerald-500/30' :
                          'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                        }`}>
                          {statusDetails.label}
                        </div>
                      </div>

                      {/* Description / Action Hint */}
                      <div className="py-4 space-y-2">
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {statusDetails.description}
                        </p>
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-amber-300 flex items-start space-x-2">
                          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>{statusDetails.actionHint}</span>
                        </div>
                      </div>

                      {/* Visual Stepper Bar */}
                      {!isCancelled && (
                        <div className="pt-2">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                            Repair Workflow Progress:
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 text-center text-[10px]">
                            {/* Step 1 */}
                            <div className={`p-2 rounded-lg border font-bold ${
                              statusDetails.step >= 1
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                                : 'bg-slate-800/60 text-slate-500 border-slate-700'
                            }`}>
                              <span className="block text-[11px]">1. Intake</span>
                              <span className="text-[9px] opacity-80">Received</span>
                            </div>

                            {/* Step 2 */}
                            <div className={`p-2 rounded-lg border font-bold ${
                              statusDetails.step >= 2
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                                : 'bg-slate-800/60 text-slate-500 border-slate-700'
                            }`}>
                              <span className="block text-[11px]">2. Diagnosis</span>
                              <span className="text-[9px] opacity-80">Testing</span>
                            </div>

                            {/* Step 3 */}
                            <div className={`p-2 rounded-lg border font-bold ${
                              statusDetails.step >= 3
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                                : 'bg-slate-800/60 text-slate-500 border-slate-700'
                            }`}>
                              <span className="block text-[11px]">3. Estimate</span>
                              <span className="text-[9px] opacity-80">Approved</span>
                            </div>

                            {/* Step 4 */}
                            <div className={`p-2 rounded-lg border font-bold ${
                              statusDetails.step >= 4
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                                : 'bg-slate-800/60 text-slate-500 border-slate-700'
                            }`}>
                              <span className="block text-[11px]">4. Repair</span>
                              <span className="text-[9px] opacity-80">Micro-Lab</span>
                            </div>

                            {/* Step 5 */}
                            <div className={`p-2 rounded-lg border font-bold ${
                              statusDetails.step >= 5
                                ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-md animate-pulse'
                                : 'bg-slate-800/60 text-slate-500 border-slate-700'
                            }`}>
                              <span className="block text-[11px]">5. Ready</span>
                              <span className="text-[9px] opacity-80">Pickup</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Repair Ticket Specs Breakdown */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3 text-xs">
                  <h5 className="font-bold text-slate-900 flex items-center space-x-1.5 uppercase tracking-wider text-[11px]">
                    <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Technical Job Ticket Details</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Customer Name</span>
                      <span className="font-bold text-slate-900 text-xs">{selectedTrackBooking.customerName}</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Reported Issue</span>
                      <span className="font-bold text-indigo-700 text-xs">{selectedTrackBooking.problemType}</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Scheduled Appointment</span>
                      <span className="font-bold text-slate-900 text-xs">
                        {selectedTrackBooking.preferredDate} • {selectedTrackBooking.preferredTime}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Estimated / Final Cost</span>
                      <span className="font-black text-emerald-700 text-xs">
                        {selectedTrackBooking.finalPrice ? (
                          <span>Final: {formatNPR(selectedTrackBooking.finalPrice)}</span>
                        ) : selectedTrackBooking.tentativePrice ? (
                          <span>Estimated: {formatNPR(selectedTrackBooking.tentativePrice)}</span>
                        ) : (
                          <span className="text-slate-500 font-medium">Under Diagnostic Inspection</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Customer Description */}
                  {selectedTrackBooking.problemDescription && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Customer Symptoms Note:</span>
                      <p className="text-slate-700 text-xs leading-relaxed italic">
                        "{selectedTrackBooking.problemDescription}"
                      </p>
                    </div>
                  )}

                  {/* Technician Notes (if available) */}
                  {selectedTrackBooking.notes && (
                    <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 space-y-1">
                      <span className="text-indigo-900 block text-[10px] font-bold uppercase flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>Senior Technician Lab Update:</span>
                      </span>
                      <p className="text-indigo-950 font-semibold text-xs leading-relaxed">
                        {selectedTrackBooking.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Assigned Lab Technician & Direct Contact */}
                {(() => {
                  const techName = selectedTrackBooking.technicianName || currentSettings.technicianName || 'Er. Ramesh Pandey (Chief Lab Specialist)';
                  const techPhone = selectedTrackBooking.technicianPhone || currentSettings.technicianPhone || currentSettings.phone1 || labHotline;
                  const cleanPhone = techPhone.replace(/\D/g, '');

                  return (
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50/70 rounded-2xl border border-amber-200/90 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold shrink-0">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded">
                                Assigned Technician
                              </span>
                            </div>
                            <h6 className="text-xs font-bold text-slate-900 mt-0.5">{techName}</h6>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <a
                            href={`tel:${cleanPhone}`}
                            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call: {techPhone}</span>
                          </a>

                          <a
                            href={`https://wa.me/977${cleanPhone}?text=Namaste%20${encodeURIComponent(techName)}%2C%20I%20am%20inquiring%20about%20my%20device%20repair%20for%20Booking%20Code%3A%20${selectedTrackBooking.bookingCode}.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Direct Help & Contact Actions */}
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-emerald-950 block">Need an immediate status update?</span>
                    <span className="text-emerald-800 text-[11px]">Chat directly with {currentSettings.storeName} Lab on WhatsApp or call our hotline.</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                      href={`https://wa.me/${finalWa}?text=Namaste%20${encodeURIComponent(currentSettings.storeName)}%2C%20I%20am%20inquiring%20about%20my%20repair%20status%20for%20Booking%20ID%3A%20${selectedTrackBooking.bookingCode}%20(${encodeURIComponent(selectedTrackBooking.mobileBrand + ' ' + selectedTrackBooking.mobileModel)}).`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 transition shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp Lab</span>
                    </a>

                    <a
                      href={`tel:${labHotline}`}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 transition"
                    >
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>{labHotline}</span>
                    </a>
                  </div>
                </div>

              </div>
            ) : hasSearched ? (
              /* Not Found State */
              <div className="text-center py-8 space-y-4 bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-base">No Repair Ticket Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    We couldn't find a record for <strong className="text-slate-800 font-mono">"{searchQuery}"</strong>. Please verify the code or search using your registered mobile phone number.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('book')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    Schedule New Repair
                  </button>
                  <a
                    href={`tel:${labHotline}`}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition flex items-center space-x-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call Lab: {labHotline}</span>
                  </a>
                </div>
              </div>
            ) : (
              /* Empty Initial State */
              <div className="text-center py-10 space-y-3 text-slate-500">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Wrench className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Track Your Smartphone Repair Live</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Enter your Booking Reference ID (e.g. <span className="font-mono text-indigo-600">PMS-REP-2026-XXXX</span>) or your 10-digit mobile number above to see live diagnostic updates and pickup readiness.
                </p>
              </div>
            )}

          </div>
        ) : (
          /* ========================================================================= */
          /* TAB 2: BOOK NEW REPAIR FORM VIEW */
          /* ========================================================================= */
          submitted && createdBooking ? (
            /* Confirmation View */
            <div className="p-6 sm:p-8 text-center space-y-6 overflow-y-auto flex-1 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider">
                  Booking Registered Successfully
                </span>
                <h3 className="text-2xl font-black text-slate-900 font-serif mt-2">
                  Repair Appointment Confirmed!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Thank you <strong className="text-slate-900">{createdBooking.customerName}</strong>. Our technicians at Traffic Chowk have received your repair request.
                </p>
              </div>

              {/* Booking Details Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs space-y-2.5 text-left max-w-md mx-auto shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Booking Reference ID:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {createdBooking.bookingCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(createdBooking.bookingCode)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200"
                      title="Copy"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Device:</span>
                  <span className="font-bold text-slate-900">
                    {createdBooking.mobileBrand} {createdBooking.mobileModel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Problem Type:</span>
                  <span className="font-semibold text-indigo-900">{createdBooking.problemType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Preferred Slot:</span>
                  <span className="font-semibold text-slate-800">
                    {createdBooking.preferredDate} ({createdBooking.preferredTime})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Initial Status:</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                    {createdBooking.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={handleTrackNewBooking}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl text-center shadow-md flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Track Live Status Now</span>
                </button>
                <a
                  href={`https://wa.me/${finalWa}?text=Namaste%20${encodeURIComponent(currentSettings.storeName)}%2C%20I%20have%20booked%20a%20repair%20for%20my%20${encodeURIComponent(createdBooking.mobileBrand + ' ' + createdBooking.mobileModel)}%20(Booking%20ID%3A%20${createdBooking.bookingCode}).%20Issue%3A%20${encodeURIComponent(createdBooking.problemType)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl text-center shadow-md flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Message WhatsApp</span>
                </a>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
              >
                Close & Return to Store
              </button>

              <p className="text-[11px] text-slate-400">
                📍 Location: {currentSettings.storeName} & Lab, {currentSettings.address}, {currentSettings.city} • Phone: {labHotline}{currentSettings.phone2 ? ` / ${currentSettings.phone2}` : ''}
              </p>
            </div>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Customer Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-slate-700">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1. Customer Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Thapa"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 98XXXXXXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Location / Address (ठेगाना, ऐच्छिक)</label>
                  <input
                    type="text"
                    placeholder="e.g. Traffic Chowk / Golpark / Tilottama / Drivertole, Butwal"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Smartphone Details */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-slate-700">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>2. Device & Brand</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Select Brand *</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_BRANDS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setMobileBrand(b)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          mobileBrand === b
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {mobileBrand === 'Other' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Specify Other Brand *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Motorola, Infinix, Tecno, Google Pixel"
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exact Phone Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iPhone 14 Pro Max / Galaxy S24 Ultra / Redmi Note 13 Pro"
                    value={mobileModel}
                    onChange={(e) => setMobileModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Issue Description */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-slate-700">
                  <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                  <span>3. Problem / Fault Type</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Issue Category *</label>
                  <select
                    value={problemType}
                    onChange={(e) => setProblemType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                  >
                    {PROBLEM_TYPES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Problem Description (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Describe symptoms: (e.g. Screen flickering, touch not responding on top, battery dying in 2 hours...)"
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Preferred Appointment Date & Time */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>4. Preferred Date & Time Slot</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Date *</label>
                    <input
                      type="date"
                      min={todayStr}
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot *</label>
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Photo Upload (Optional) */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700">
                  Upload Photo of Damage / Screen (Optional)
                </label>

                {!photo ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-4 text-center cursor-pointer bg-slate-50 hover:bg-indigo-50/40 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs font-bold text-slate-700 block">Click to upload photo</span>
                    <span className="text-[10px] text-slate-400">JPG, PNG up to 5MB</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative inline-block rounded-xl overflow-hidden border border-slate-300">
                    <img src={photo} alt="Device damage" className="w-24 h-24 object-cover" />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {photoError && (
                  <p className="text-xs font-semibold text-rose-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{photoError}</span>
                  </p>
                )}
              </div>

              {/* Guarantees Note */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 flex items-start space-x-2 text-[11px] text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>100% Genuine Parts & Lab Warranty:</strong> All repairs are tested by senior technicians in Traffic Chowk with service warranty and no data loss protection.
                </span>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('track')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Track Existing Booking Instead</span>
                </button>

                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Saving Booking...' : 'Confirm Repair Booking'}</span>
                  </button>
                </div>
              </div>

            </form>
          )
        )}

      </div>
    </div>
  );
};
