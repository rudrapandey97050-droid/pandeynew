import React, { useState } from 'react';
import {
  X,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  DollarSign,
  Info,
  Copy,
  Check,
  Building2,
  Trash2
} from 'lucide-react';
import { Product, PhoneConditionCheck, PhonePhotos, ValuationType, PhoneValuationRequest } from '../types.ts';
import { DataStorageService } from '../services/dataStorage.ts';
import { compressAndConvertImage, formatNPR } from '../utils/formatters.ts';

interface PhoneValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialType?: ValuationType;
  selectedTargetProduct?: Product | null;
  onSuccess?: (request: PhoneValuationRequest) => void;
}

const initialConditionState: PhoneConditionCheck = {
  frontDisplay: 'Good',
  touchScreen: 'Working',
  backGlass: 'Good',
  frameBody: 'Good',
  camera: 'Front & Rear Working',
  speaker: 'Working',
  microphone: 'Working',
  chargingPort: 'Working',
  buttons: 'All Working',
  batteryHealth: 'Good',
  faceIdFingerprint: 'Working',
  networkWifi: 'Working',
  waterDamage: 'No',
  previousRepair: 'No'
};

export const PhoneValuationModal: React.FC<PhoneValuationModalProps> = ({
  isOpen,
  onClose,
  products,
  initialType = 'sell',
  selectedTargetProduct = null,
  onSuccess
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [valuationType, setValuationType] = useState<ValuationType>(initialType);
  
  // Step 1: Customer & Phone
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [phoneBrand, setPhoneBrand] = useState('Apple');
  const [phoneModel, setPhoneModel] = useState('');
  const [storage, setStorage] = useState('128GB');
  const [ram, setRam] = useState('6GB');
  const [imeiNumber, setImeiNumber] = useState('');
  const [purchaseAge, setPurchaseAge] = useState('6 - 12 Months');
  const [expectedPrice, setExpectedPrice] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Exchange Target
  const [targetProductId, setTargetProductId] = useState<string>(selectedTargetProduct?.id || '');
  
  // Step 2: 14-Point Condition
  const [condition, setCondition] = useState<PhoneConditionCheck>(initialConditionState);
  
  // Step 3: Photos
  const [photos, setPhotos] = useState<PhonePhotos>({});
  const [uploadingAngle, setUploadingAngle] = useState<string | null>(null);

  // Step 5: Submitted Result
  const [submittedValuation, setSubmittedValuation] = useState<PhoneValuationRequest | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const targetProduct = products.find(p => p.id === targetProductId) || selectedTargetProduct;

  const handlePhotoUpload = async (angle: keyof PhonePhotos, file: File) => {
    try {
      setUploadingAngle(angle);
      const dataUrl = await compressAndConvertImage(file, 1000, 0.7);
      setPhotos(prev => ({
        ...prev,
        [angle]: dataUrl
      }));
    } catch (err) {
      console.error('Failed to compress image', err);
      alert('Could not process this image. Please try a different photo.');
    } finally {
      setUploadingAngle(null);
    }
  };

  const removePhoto = (angle: keyof PhonePhotos) => {
    setPhotos(prev => {
      const copy = { ...prev };
      delete copy[angle];
      return copy;
    });
  };

  const validateStep1 = () => {
    setErrorMsg('');
    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name');
      return false;
    }
    if (!mobileNumber.trim() || mobileNumber.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return false;
    }
    if (!phoneBrand.trim()) {
      setErrorMsg('Please select or specify phone brand');
      return false;
    }
    if (!phoneModel.trim()) {
      setErrorMsg('Please enter your phone model name');
      return false;
    }
    if (valuationType === 'exchange' && !targetProductId) {
      setErrorMsg('Please select the new phone you wish to exchange for');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const exchangeData = valuationType === 'exchange' && targetProduct ? {
        productId: targetProduct.id,
        productName: targetProduct.name,
        targetStorage: targetProduct.storage,
        targetColor: targetProduct.color,
        targetPrice: targetProduct.price,
        targetImage: targetProduct.image
      } : undefined;

      const created = DataStorageService.addValuation({
        type: valuationType,
        customerName: customerName.trim(),
        mobileNumber: mobileNumber.trim(),
        phoneBrand: phoneBrand.trim(),
        phoneModel: phoneModel.trim(),
        storage,
        ram,
        imeiNumber: imeiNumber.trim() || undefined,
        purchaseAge,
        expectedPrice: expectedPrice ? parseFloat(expectedPrice) : undefined,
        additionalNotes: additionalNotes.trim() || undefined,
        condition,
        photos,
        exchangeTarget: exchangeData
      });

      setSubmittedValuation(created);
      setStep(5);
      if (onSuccess) onSuccess(created);
    } catch (e) {
      console.error(e);
      setErrorMsg('Failed to submit valuation request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyValuationId = () => {
    if (submittedValuation?.valuationId) {
      navigator.clipboard.writeText(submittedValuation.valuationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const photoPositions: { key: keyof PhonePhotos; label: string; desc: string }[] = [
    { key: 'front', label: 'Front Display', desc: 'Screen on or off, clear view of glass' },
    { key: 'back', label: 'Back Panel', desc: 'Rear cameras and back glass/panel' },
    { key: 'leftSide', label: 'Left Side', desc: 'Volume buttons & SIM tray area' },
    { key: 'rightSide', label: 'Right Side', desc: 'Power button & frame edges' },
    { key: 'top', label: 'Top Edge', desc: 'Top microphone & frame corners' },
    { key: 'bottom', label: 'Bottom Edge', desc: 'Charging port, speakers & mic' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              {valuationType === 'exchange' ? <RefreshCw className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold font-serif tracking-tight">
                {valuationType === 'exchange' ? 'Exchange Old Phone with New' : 'Mobile Valuation & Sell Request'}
              </h2>
              <p className="text-xs text-slate-300">
                Pandey Mobile Store • Traffic Chowk, Butwal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar (for steps 1-4) */}
        {step <= 4 && (
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <span className={step >= 1 ? 'text-indigo-600 font-bold' : ''}>1. Phone Info</span>
              <span className={step >= 2 ? 'text-indigo-600 font-bold' : ''}>2. 14-Point Condition</span>
              <span className={step >= 3 ? 'text-indigo-600 font-bold' : ''}>3. Photos</span>
              <span className={step >= 4 ? 'text-indigo-600 font-bold' : ''}>4. Review & Submit</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Phone & Customer Details */}
          {step === 1 && (
            <div className="space-y-6">
              
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  What would you like to do?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValuationType('sell')}
                    className={`p-4 rounded-xl border-2 text-left flex items-start space-x-3 transition-all ${
                      valuationType === 'sell'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <DollarSign className={`w-5 h-5 mt-0.5 ${valuationType === 'sell' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div>
                      <p className="font-bold text-sm">Sell Old Phone</p>
                      <p className="text-xs text-slate-500 mt-0.5">Get cash or store valuation for your used phone</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setValuationType('exchange')}
                    className={`p-4 rounded-xl border-2 text-left flex items-start space-x-3 transition-all ${
                      valuationType === 'exchange'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <RefreshCw className={`w-5 h-5 mt-0.5 ${valuationType === 'exchange' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div>
                      <p className="font-bold text-sm">Exchange Old Phone</p>
                      <p className="text-xs text-slate-500 mt-0.5">Upgrade to a brand new or certified used phone</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* If Exchange: Select Target Phone */}
              {valuationType === 'exchange' && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-amber-900 flex items-center space-x-2">
                      <RefreshCw className="w-4 h-4 text-amber-600" />
                      <span>Select the Phone You Wish to Upgrade To *</span>
                    </label>
                  </div>
                  <select
                    value={targetProductId}
                    onChange={(e) => setTargetProductId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-amber-300 rounded-lg text-slate-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose Desired Phone from Store Catalog --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.storage || 'Default'}) - {formatNPR(p.price)} [{p.condition}]
                      </option>
                    ))}
                  </select>

                  {targetProduct && (
                    <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-amber-200 mt-2">
                      <img
                        src={targetProduct.image}
                        alt={targetProduct.name}
                        className="w-12 h-12 rounded-md object-cover border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{targetProduct.name}</p>
                        <p className="text-xs text-slate-500">{targetProduct.storage} • {targetProduct.condition}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-slate-500">Retail Price:</span>
                        <p className="text-sm font-bold text-indigo-700">{formatNPR(targetProduct.price)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Poudel"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98XXXXXXXX"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Phone Details */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>Your Current Old Phone Details</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Brand *</label>
                    <select
                      value={phoneBrand}
                      onChange={(e) => setPhoneBrand(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white"
                    >
                      <option value="Apple">Apple (iPhone)</option>
                      <option value="Samsung">Samsung</option>
                      <option value="Xiaomi">Xiaomi / Redmi / POCO</option>
                      <option value="OnePlus">OnePlus</option>
                      <option value="Vivo">Vivo</option>
                      <option value="Oppo">Oppo</option>
                      <option value="Realme">Realme</option>
                      <option value="Google Pixel">Google Pixel</option>
                      <option value="Other">Other Brand</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Model *</label>
                    <input
                      type="text"
                      placeholder="e.g. iPhone 13 Pro / S21 FE"
                      value={phoneModel}
                      onChange={(e) => setPhoneModel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Storage *</label>
                    <select
                      value={storage}
                      onChange={(e) => setStorage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white"
                    >
                      <option value="32GB">32GB</option>
                      <option value="64GB">64GB</option>
                      <option value="128GB">128GB</option>
                      <option value="256GB">256GB</option>
                      <option value="512GB">512GB</option>
                      <option value="1TB">1TB</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">RAM Capacity</label>
                    <select
                      value={ram}
                      onChange={(e) => setRam(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white"
                    >
                      <option value="3GB">3GB</option>
                      <option value="4GB">4GB</option>
                      <option value="6GB">6GB</option>
                      <option value="8GB">8GB</option>
                      <option value="12GB">12GB</option>
                      <option value="16GB">16GB</option>
                      <option value="Apple Default">iOS Standard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Purchase / Usage Age *</label>
                    <select
                      value={purchaseAge}
                      onChange={(e) => setPurchaseAge(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white"
                    >
                      <option value="Less than 3 Months">Less than 3 Months</option>
                      <option value="3 - 6 Months">3 - 6 Months</option>
                      <option value="6 - 12 Months">6 - 12 Months</option>
                      <option value="1 - 2 Years">1 - 2 Years</option>
                      <option value="2+ Years">2+ Years</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Expected Price (NPR)</label>
                    <input
                      type="number"
                      placeholder="e.g. 45000"
                      value={expectedPrice}
                      onChange={(e) => setExpectedPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      IMEI Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Dial *#06# to check IMEI"
                      value={imeiNumber}
                      onChange={(e) => setImeiNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Additional Notes / Box & Accessories Available
                    </label>
                    <input
                      type="text"
                      placeholder="Original box, bill, charger/cable condition details"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: 14-Point Condition Checklist */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start space-x-3">
                <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs md:text-sm text-indigo-900 leading-relaxed">
                  <strong>Accurate Condition Check:</strong> Please answer honestly for all 14 hardware parts below. This helps us provide an accurate preliminary price before physical inspection at our Butwal store.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Front Display */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    1. Front Display Glass
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(['Excellent', 'Good', 'Scratched', 'Cracked', 'Damaged'] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition({ ...condition, frontDisplay: val })}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                          condition.frontDisplay === val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Touch Screen */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    2. Touch Screen Functionality
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Working', 'Partially Working', 'Not Working'] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition({ ...condition, touchScreen: val })}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                          condition.touchScreen === val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Back Glass / Back Panel */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    3. Back Glass / Back Panel
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(['Excellent', 'Good', 'Scratched', 'Cracked', 'Damaged'] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition({ ...condition, backGlass: val })}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                          condition.backGlass === val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Frame / Body */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    4. Frame / Outer Body
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(['Excellent', 'Good', 'Scratched', 'Dented', 'Damaged'] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition({ ...condition, frameBody: val })}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                          condition.frameBody === val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Camera */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    5. Camera (Front & Rear)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      'Front & Rear Working',
                      'Front Camera Working',
                      'Rear Camera Working',
                      'Camera Problem'
                    ] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition({ ...condition, camera: val })}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                          condition.camera === val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Speaker */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    6. Audio Speakers
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Working', 'Problem'] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition({ ...condition, speaker: val })}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                          condition.speaker === val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. Microphone */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    7. Call Microphone
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Working', 'Problem'] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition({ ...condition, microphone: val })}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                          condition.microphone === val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 8. Charging Port */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    8. Charging Port
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Working', 'Loose', 'Damaged'] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition({ ...condition, chargingPort: val })}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                          condition.chargingPort === val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 9. Buttons */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    9. Power & Volume Buttons
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['All Working', 'Some Problem'] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition({ ...condition, buttons: val })}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                          condition.buttons === val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 10. Battery Health / Condition */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    10. Battery Condition / Health
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(['Excellent', 'Good', 'Average', 'Poor', 'Unknown'] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition({ ...condition, batteryHealth: val })}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                          condition.batteryHealth === val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 11. Face ID / Fingerprint */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    11. Face ID / Fingerprint Sensor
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Working', 'Not Working', 'Not Available'] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition({ ...condition, faceIdFingerprint: val })}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                          condition.faceIdFingerprint === val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 12. Wi-Fi / Bluetooth / Network */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    12. Wi-Fi / Bluetooth / Network
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Working', 'Problem'] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition({ ...condition, networkWifi: val })}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                          condition.networkWifi === val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 13. Water/Liquid Damage */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    13. Any Liquid / Water Damage?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['No', 'Yes', 'Unknown'] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition({ ...condition, waterDamage: val })}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                          condition.waterDamage === val
                            ? val === 'No' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 14. Previous Repair */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    14. Any Previous Screen or Motherboard Repair?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['No', 'Yes'] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCondition({ ...condition, previousRepair: val })}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-center ${
                          condition.previousRepair === val
                            ? val === 'No' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: Multi-angle Photos */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 flex items-start space-x-3">
                <Camera className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Upload Photos of Your Device</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Clear photos help our technician verify condition faster. We recommend uploading all 6 angles: Front, Back, Left Side, Right Side, Top, and Bottom.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photoPositions.map(({ key, label, desc }) => {
                  const hasPhoto = Boolean(photos[key]);
                  const isUploading = uploadingAngle === key;

                  return (
                    <div
                      key={key}
                      className={`relative rounded-xl border-2 p-3 text-center transition-all ${
                        hasPhoto
                          ? 'border-emerald-500 bg-emerald-50/40'
                          : 'border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50'
                      }`}
                    >
                      {hasPhoto ? (
                        <div className="space-y-2">
                          <div className="relative h-32 w-full rounded-lg overflow-hidden bg-slate-900">
                            <img
                              src={photos[key]}
                              alt={label}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(key)}
                              className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md transition-colors"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs font-bold text-slate-900 truncate">{label}</p>
                          <span className="inline-flex items-center text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3 mr-1" /> Added
                          </span>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-36 cursor-pointer space-y-1">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoUpload(key, file);
                            }}
                          />
                          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 mb-1">
                            {isUploading ? (
                              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Upload className="w-5 h-5" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-800">{label}</span>
                          <span className="text-[10px] text-slate-500 line-clamp-2 px-1">{desc}</span>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Review & Final Submit */}
          {step === 4 && (
            <div className="space-y-6">
              
              {/* Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      {valuationType === 'exchange' ? 'Exchange Request Summary' : 'Sell Phone Valuation Summary'}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      {phoneBrand} {phoneModel} ({storage}, {ram} RAM)
                    </h3>
                  </div>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full">
                    {purchaseAge}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Customer:</span>
                    <span className="font-semibold text-slate-900">{customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Mobile:</span>
                    <span className="font-semibold text-slate-900">{mobileNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Expected Price:</span>
                    <span className="font-semibold text-slate-900">{expectedPrice ? formatNPR(Number(expectedPrice)) : 'Open for store quote'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Photos Attached:</span>
                    <span className="font-semibold text-slate-900">{Object.keys(photos).length} / 6</span>
                  </div>
                </div>

                {valuationType === 'exchange' && targetProduct && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center space-x-3">
                    <RefreshCw className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="flex-1 min-w-0 text-xs">
                      <span className="text-amber-900 font-bold block">Desired Exchange Phone:</span>
                      <span className="text-slate-800 font-semibold">{targetProduct.name} ({targetProduct.storage}) - {formatNPR(targetProduct.price)}</span>
                    </div>
                  </div>
                )}

                {/* Condition Highlights */}
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-bold text-slate-700 mb-2">14-Point Condition Checklist Highlights:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Front Display</span>
                      <span className="font-semibold text-slate-800">{condition.frontDisplay}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Touch Screen</span>
                      <span className="font-semibold text-slate-800">{condition.touchScreen}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Battery Health</span>
                      <span className="font-semibold text-slate-800">{condition.batteryHealth}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Water Damage</span>
                      <span className={`font-semibold ${condition.waterDamage === 'No' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {condition.waterDamage}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MANDATORY DISCLAIMER BOX */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-amber-950 space-y-2 shadow-xs">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Physical Inspection & Store Valuation Terms</span>
                </div>
                <p className="text-xs md:text-sm text-amber-900/90 leading-relaxed">
                  <strong>Important Notice:</strong> Submission of this valuation or exchange request does <strong>NOT</strong> automatically promise a final buying or trade-in price. 
                  All final valuations are strictly subject to physical verification and technical motherboard/screen inspection by certified technicians at <strong>Pandey Mobile Store, Traffic Chowk, Butwal</strong>.
                </p>
              </div>

            </div>
          )}

          {/* STEP 5: SUCCESS CONFIRMATION */}
          {step === 5 && submittedValuation && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 font-serif">
                  Valuation Request Submitted!
                </h3>
                <p className="text-sm text-slate-600 max-w-lg mx-auto">
                  Thank you, <strong>{submittedValuation.customerName}</strong>. Your request has been securely recorded.
                </p>
              </div>

              {/* Valuation ID Badge */}
              <div className="inline-block bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 max-w-md w-full mx-auto text-left">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>YOUR UNIQUE VALUATION ID</span>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">STATUS: NEW</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl md:text-2xl font-mono font-black text-amber-400 tracking-wider">
                    {submittedValuation.valuationId}
                  </span>
                  <button
                    onClick={copyValuationId}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{submittedValuation.phoneBrand} {submittedValuation.phoneModel}</span>
                  <span>{submittedValuation.type === 'exchange' ? 'Exchange Request' : 'Sell Request'}</span>
                </div>
              </div>

              {(() => {
                const storeSettings = DataStorageService.getStoreSettings();
                const rawWa = storeSettings.whatsapp || storeSettings.phone1 || '9847460603';
                const cleanWa = rawWa.replace(/[^0-9]/g, '');
                const finalWa = cleanWa.startsWith('977') ? cleanWa : `977${cleanWa}`;

                return (
                  <>
                    {/* Next Steps Guide */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left max-w-md mx-auto space-y-2 text-xs text-slate-700">
                      <div className="font-bold text-slate-900 flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span>Next Steps: Visit Our Store</span>
                      </div>
                      <p>1. Bring your phone, charger and valid ID to <strong>{storeSettings.storeName}, {storeSettings.address}, {storeSettings.city}</strong>.</p>
                      <p>2. Show your <strong>Valuation ID ({submittedValuation.valuationId})</strong> at our counter.</p>
                      <p>3. Our technician will perform a 10-minute physical inspection and provide your instant final cash or exchange trade-in amount.</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <a
                        href={`https://wa.me/${finalWa}?text=Hello%20${encodeURIComponent(storeSettings.storeName)}%2C%20I%20have%20submitted%20a%20valuation%20request%20for%20my%20${encodeURIComponent(submittedValuation.phoneBrand + ' ' + submittedValuation.phoneModel)}.%20My%20Valuation%20ID%20is%20${submittedValuation.valuationId}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center space-x-2"
                      >
                        <span>Chat on WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-sm transition-colors"
                      >
                        Done & Back to Store
                      </button>
                    </div>
                  </>
                );
              })()}

            </div>
          )}

        </div>

        {/* Footer Navigation (Steps 1-4) */}
        {step <= 4 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-xl flex items-center space-x-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1) {
                    if (validateStep1()) setStep(2);
                  } else {
                    setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
                  }
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl flex items-center space-x-2 transition-colors shadow-md"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm rounded-xl flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Valuation Request</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
