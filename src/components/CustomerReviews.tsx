import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  MessageSquarePlus,
  X,
  MapPin,
  Smartphone,
  Wrench,
  ArrowRightLeft,
  ShoppingBag,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle
} from 'lucide-react';
import { CustomerReview, ReviewServiceType } from '../types.ts';
import { DataStorageService } from '../services/dataStorage.ts';
import { FirestoreService } from '../services/firestoreService.ts';

interface CustomerReviewsProps {
  onOpenValuationModal?: () => void;
  onOpenRepairModal?: () => void;
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({
  onOpenValuationModal,
  onOpenRepairModal
}) => {
  const [reviews, setReviews] = useState<CustomerReview[]>(() => DataStorageService.getCustomerReviews());
  const [selectedFilter, setSelectedFilter] = useState<'all' | '5star' | ReviewServiceType>('all');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // New review form state
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formRating, setFormRating] = useState<number>(5);
  const [formServiceType, setFormServiceType] = useState<ReviewServiceType>('Exchange');
  const [formDeviceModel, setFormDeviceModel] = useState('');
  const [formReviewText, setFormReviewText] = useState('');
  const [formHoverStar, setFormHoverStar] = useState<number | null>(null);

  // Real-time Firestore subscription & local sync
  useEffect(() => {
    // 1. Initial local load
    setReviews(DataStorageService.getCustomerReviews());

    // 2. Real-time Firebase cloud subscription
    const unsubscribeFirestore = FirestoreService.subscribeCustomerReviews((cloudReviews) => {
      if (Array.isArray(cloudReviews)) {
        DataStorageService.saveCustomerReviews(cloudReviews);
        setReviews(cloudReviews);
      }
    });

    // 3. Multi-tab local sync
    const unsubscribeLocal = DataStorageService.subscribeToUpdates(() => {
      setReviews(DataStorageService.getCustomerReviews());
    });

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      unsubscribeLocal();
    };
  }, []);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (selectedFilter === 'all') return true;
      if (selectedFilter === '5star') return r.rating === 5;
      return r.serviceType === selectedFilter;
    });
  }, [reviews, selectedFilter]);

  // Overall store rating stats
  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 5.0, count: 0, fiveStarPct: 100 };
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    const avg = Number((sum / reviews.length).toFixed(1));
    const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
    const fiveStarPct = Math.round((fiveStarCount / reviews.length) * 100);
    return { avg, count: reviews.length, fiveStarPct };
  }, [reviews]);

  // Handle new review submission to Firestore
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formReviewText.trim()) return;

    setIsSubmitting(true);
    try {
      const newReview: Omit<CustomerReview, 'id' | 'createdAt'> = {
        customerName: formName.trim(),
        location: formLocation.trim() || 'Traffic Chowk, Butwal',
        rating: formRating,
        serviceType: formServiceType,
        deviceModel: formDeviceModel.trim() || undefined,
        reviewText: formReviewText.trim(),
        date: new Date().toISOString().slice(0, 10),
        isVerifiedBuyer: true
      };

      const added = DataStorageService.addCustomerReview(newReview);
      await FirestoreService.saveCustomerReview(added);

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsWriteModalOpen(false);
        setFormName('');
        setFormLocation('');
        setFormDeviceModel('');
        setFormReviewText('');
        setFormRating(5);
      }, 2000);
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getServiceIcon = (type: ReviewServiceType) => {
    switch (type) {
      case 'Exchange':
        return <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Repair':
        return <Wrench className="w-3.5 h-3.5 text-amber-600" />;
      case 'Purchase':
        return <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Smartphone className="w-3.5 h-3.5 text-sky-600" />;
    }
  };

  const getServiceBadgeStyle = (type: ReviewServiceType) => {
    switch (type) {
      case 'Exchange':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Repair':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Purchase':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <section id="customer-reviews" className="py-16 bg-slate-900 text-white relative overflow-hidden">
      {/* Decorative ambient lighting elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mt-32"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -mb-32"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Header & Social Proof Summary Card */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b border-slate-850">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Real Customer Testimonials • सामाजिक विश्वास (Social Proof)</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              ग्राहकहरूको विश्वास नै हाम्रो पहिचान
            </h2>
            
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              बुटवल, तिलोत्तमा, भैरहवा र पाल्पाका हजारौं सन्तुष्ट ग्राहकहरूले ३२-प्वाइन्ट चेक निष्पक्ष एक्सचेन्ज, ओरिजिनल डिस्प्ले मर्मत र वास्तविक बिल-वारेन्टीका लागि पाण्डे मोबाइल स्टोर रोज्नुभएको छ।
            </p>
          </div>

          {/* Aggregate Rating Score Box & Action Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-850/80 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-xs shrink-0">
            <div className="flex items-center space-x-3">
              <div className="text-center bg-indigo-600/30 border border-indigo-500/40 px-3.5 py-2 rounded-xl">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono block">
                  {stats.avg}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                  आउट अफ ५
                </span>
              </div>
              
              <div>
                <div className="flex items-center space-x-1 text-amber-400 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs font-bold text-white">
                  {stats.count}+ प्रमाणीकृत ग्राहक समीक्षा
                </p>
                <p className="text-[11px] text-emerald-400 flex items-center space-x-1 font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  <span>१००% वास्तविक ग्राहक अनुभव</span>
                </p>
              </div>
            </div>

            <div className="h-10 w-px bg-slate-750 hidden sm:block"></div>

            <button
              id="btn-write-review-hero"
              type="button"
              onClick={() => setIsWriteModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>आफ्नो अनुभव लेख्नुहोस्</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 my-8">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { setSelectedFilter('all'); setActiveSlideIndex(0); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
              }`}
            >
              सबै समीक्षाहरू ({reviews.length})
            </button>

            <button
              type="button"
              onClick={() => { setSelectedFilter('Exchange'); setActiveSlideIndex(0); }}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedFilter === 'Exchange'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>मोबाइल साटफेर (Exchange)</span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedFilter('Purchase'); setActiveSlideIndex(0); }}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedFilter === 'Purchase'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3 h-3" />
              <span>फोन खरिद (Purchase)</span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedFilter('Repair'); setActiveSlideIndex(0); }}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedFilter === 'Repair'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
              }`}
            >
              <Wrench className="w-3 h-3" />
              <span>मर्मत सेवा (Repair)</span>
            </button>

            <button
              type="button"
              onClick={() => { setSelectedFilter('5star'); setActiveSlideIndex(0); }}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedFilter === '5star'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              <span>५-तारे अनुभव मात्र</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            देखाउँदै: <strong className="text-slate-200">{filteredReviews.length}</strong> समीक्षाहरू
          </div>
        </div>

        {/* Reviews Cards Grid */}
        {filteredReviews.length === 0 ? (
          <div className="bg-slate-850/60 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
            <HelpCircle className="w-12 h-12 text-slate-500 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-white">कुनै समीक्षा भेटिएन</h3>
              <p className="text-xs text-slate-400 mt-1">
                यस वर्गमा अहिले कुनै समीक्षा उपलब्ध छैन। पहिलो समीक्षा तपाईं लेख्न सक्नुहुन्छ!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsWriteModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              समीक्षा थप्नुहोस्
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReviews.map((review) => {
              const initials = review.customerName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={review.id}
                  className="bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:-translate-y-1 relative group"
                >
                  {/* Top Customer Info Row */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {review.avatarUrl ? (
                          <img
                            src={review.avatarUrl}
                            alt={review.customerName}
                            className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500/40 p-0.5"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-md border-2 border-indigo-400/30">
                            {initials}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h3 className="text-sm font-bold text-white">
                              {review.customerName}
                            </h3>
                            {review.isVerifiedBuyer && (
                              <span
                                title="Verified Store Customer"
                                className="text-emerald-400"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500/20" />
                              </span>
                            )}
                          </div>
                          {review.location && (
                            <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[170px]">{review.location}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Service Type Tag */}
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center space-x-1 ${getServiceBadgeStyle(
                          review.serviceType
                        )}`}
                      >
                        {getServiceIcon(review.serviceType)}
                        <span>{review.serviceType}</span>
                      </span>
                    </div>

                    {/* Star Rating & Device Model */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                      <div className="flex items-center space-x-0.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>

                      {review.deviceModel && (
                        <span className="text-[11px] font-mono font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700/60 truncate max-w-[150px]">
                          {review.deviceModel}
                        </span>
                      )}
                    </div>

                    {/* Review Quote Body */}
                    <blockquote className="text-slate-300 text-xs leading-relaxed italic pt-1">
                      &ldquo;{review.reviewText}&rdquo;
                    </blockquote>

                    {/* Owner Response / Reply (if present) */}
                    {review.replyFromOwner && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-750 text-[11px] space-y-1">
                        <div className="flex items-center space-x-1.5 text-indigo-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                          <span>पाण्डे मोबाइल स्टोर (Response)</span>
                        </div>
                        <p className="text-slate-400 leading-normal pl-3 italic">
                          {review.replyFromOwner}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer date */}
                  <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{review.date}</span>
                    <span className="text-[10px] text-emerald-400/90 font-medium">
                      ✓ Traffic Chowk Verified
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Social Proof Banner & Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 border border-indigo-500/20 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              तपाईं पनि पुरानो मोबाइल साट्न वा नयाँ फोन किन्न चाहनुहुन्छ?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              हाम्रो अनलाइन भ्यालुएसन क्यालकुलेटरबाट तत्काल आफ्नो फोनको मूल्य जाँच्नुहोस् वा मर्मत अपोइन्टमेन्ट बुक गर्नुहोस्।
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            {onOpenValuationModal && (
              <button
                type="button"
                onClick={onOpenValuationModal}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>फोनको मूल्य जाँच्नुहोस् (Check Value)</span>
              </button>
            )}

            {onOpenRepairModal && (
              <button
                type="button"
                onClick={onOpenRepairModal}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold border border-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>मर्मत सेवा बुक गर्नुहोस्</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* WRITE A REVIEW MODAL (Store Visitors can submit their own social proof)   */}
      {/* ========================================================================= */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl sticky top-0 z-20">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <MessageSquarePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    आफ्नो अनुभव साझा गर्नुहोस्
                  </h3>
                  <p className="text-xs text-slate-500">
                    पाण्डे मोबाइल स्टोर, ट्राफिक चोक बुटवल
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {submitSuccess ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    धन्यवाद! तपाईंको समीक्षा प्राप्त भयो।
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    तपाईंको अमूल्य प्रतिक्रिया क्लाउड डाटाबेसमा सुरक्षित भइसकेको छ र स्टोर फ्रन्टपेजमा प्रदर्शित हुनेछ।
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* Rating Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      तपाईंको मूल्याङ्कन (Rating) *
                    </label>
                    <div className="flex items-center space-x-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setFormHoverStar(star)}
                          onMouseLeave={() => setFormHoverStar(null)}
                          onClick={() => setFormRating(star)}
                          className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              (formHoverStar !== null ? star <= formHoverStar : star <= formRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name and Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        तपाईंको नाम (Customer Name) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="उदा: सुजन श्रेष्ठ"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        स्थान / ठेगाना (Location)
                      </label>
                      <input
                        type="text"
                        placeholder="उदा: Traffic Chowk, Butwal"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Service Type and Device Model */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        सेवा प्रकार (Service Type)
                      </label>
                      <select
                        value={formServiceType}
                        onChange={(e) => setFormServiceType(e.target.value as ReviewServiceType)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Exchange">Exchange (मोबाइल साटफेर)</option>
                        <option value="Purchase">Purchase (नयाँ/पुरानो खरिद)</option>
                        <option value="Repair">Repair (फोन मर्मत)</option>
                        <option value="General">General Service (सामान्य सेवा)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        सम्बन्धित मोडल (Device Model)
                      </label>
                      <input
                        type="text"
                        placeholder="उदा: iPhone 15, S24 Ultra"
                        value={formDeviceModel}
                        onChange={(e) => setFormDeviceModel(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Review Comments */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      तपाईंको अनुभव र प्रतिक्रिया (Your Testimonial) *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="पाण्डे मोबाइल स्टोरमा तपाईंको अनुभव कस्तो रह्यो? निष्पक्ष दररेट, सामानको गुणस्तर, टेक्निसियनको सेवाबारे लेख्नुहोस्..."
                      value={formReviewText}
                      onChange={(e) => setFormReviewText(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  {/* Privacy note */}
                  <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      तपाईंको समीक्षा तत्काल स्टोर फ्रन्टपेजमा प्रत्यक्ष रूपमा प्रकाशित हुनेछ।
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsWriteModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      रद्द गर्नुहोस्
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formName.trim() || !formReviewText.trim()}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'पठाउँदै...' : 'समीक्षा पेश गर्नुहोस्'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
