import React, { useState } from 'react';
import {
  Printer,
  X,
  Sliders,
  CheckCircle2,
  Maximize2,
  RotateCcw,
  FileText,
  Check,
  Smartphone,
  Eye,
  Settings,
  Sparkles
} from 'lucide-react';
import {
  AccountingSettings,
  BillPaperSize,
  PrintSetupConfig,
  SalesInvoice
} from '../../types/accounting.ts';
import { AccountingStorageService } from '../../services/accountingStorage.ts';

interface BillPrintSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestPrint?: (sampleInvoice: SalesInvoice) => void;
  onSaved?: (updatedSettings: AccountingSettings) => void;
}

export const BillPrintSetupModal: React.FC<BillPrintSetupModalProps> = ({
  isOpen,
  onClose,
  onTestPrint,
  onSaved
}) => {
  if (!isOpen) return null;

  const currentSettings = AccountingStorageService.getSettings();
  const initialSetup: PrintSetupConfig = currentSettings.printSetup || {
    paperSize: currentSettings.defaultPaperSize || 'a4',
    customWidthMm: 210,
    customHeightMm: 297,
    orientation: 'portrait',
    marginMm: 8,
    fontScale: 'normal',
    copies: 1,
    showPanVat: true,
    showImei: true,
    showWarranty: true,
    showTerms: true,
    showSignatures: true,
    showPaidStamp: true,
    showCustomerAddress: true,
    showCompanyHeader: true
  };

  const [paperSize, setPaperSize] = useState<BillPaperSize>(initialSetup.paperSize || 'a4');
  const [customWidthMm, setCustomWidthMm] = useState<number>(initialSetup.customWidthMm || 210);
  const [customHeightMm, setCustomHeightMm] = useState<number>(initialSetup.customHeightMm ?? 297);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(initialSetup.orientation || 'portrait');
  const [marginMm, setMarginMm] = useState<number>(initialSetup.marginMm ?? 8);
  const [fontScale, setFontScale] = useState<'compact' | 'normal' | 'large'>(initialSetup.fontScale || 'normal');
  const [copies, setCopies] = useState<1 | 2>(initialSetup.copies || 1);

  // Content toggles
  const [showPanVat, setShowPanVat] = useState<boolean>(initialSetup.showPanVat ?? true);
  const [showImei, setShowImei] = useState<boolean>(initialSetup.showImei ?? true);
  const [showWarranty, setShowWarranty] = useState<boolean>(initialSetup.showWarranty ?? true);
  const [showTerms, setShowTerms] = useState<boolean>(initialSetup.showTerms ?? true);
  const [showSignatures, setShowSignatures] = useState<boolean>(initialSetup.showSignatures ?? true);
  const [showPaidStamp, setShowPaidStamp] = useState<boolean>(initialSetup.showPaidStamp ?? true);
  const [showCustomerAddress, setShowCustomerAddress] = useState<boolean>(initialSetup.showCustomerAddress ?? true);
  const [showCompanyHeader, setShowCompanyHeader] = useState<boolean>(initialSetup.showCompanyHeader ?? true);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Quick preset apply
  const handleSelectPreset = (size: BillPaperSize) => {
    setPaperSize(size);
    if (size === 'a4') {
      setCustomWidthMm(210);
      setCustomHeightMm(297);
      setOrientation('portrait');
      setMarginMm(8);
      setFontScale('normal');
    } else if (size === 'a5_portrait') {
      setCustomWidthMm(148);
      setCustomHeightMm(210);
      setOrientation('portrait');
      setMarginMm(6);
      setFontScale('compact');
    } else if (size === 'a5_landscape') {
      setCustomWidthMm(210);
      setCustomHeightMm(148);
      setOrientation('landscape');
      setMarginMm(6);
      setFontScale('compact');
    } else if (size === 'thermal_80') {
      setCustomWidthMm(80);
      setCustomHeightMm(0);
      setOrientation('portrait');
      setMarginMm(2);
      setFontScale('normal');
    } else if (size === 'thermal_58') {
      setCustomWidthMm(58);
      setCustomHeightMm(0);
      setOrientation('portrait');
      setMarginMm(1);
      setFontScale('compact');
    }
  };

  // Save changes to localStorage via AccountingStorageService
  const handleSave = () => {
    const newConfig: PrintSetupConfig = {
      paperSize,
      customWidthMm,
      customHeightMm,
      orientation,
      marginMm,
      fontScale,
      copies,
      showPanVat,
      showImei,
      showWarranty,
      showTerms,
      showSignatures,
      showPaidStamp,
      showCustomerAddress,
      showCompanyHeader
    };

    const updatedSettings: AccountingSettings = {
      ...currentSettings,
      defaultPaperSize: paperSize,
      printSetup: newConfig
    };

    AccountingStorageService.saveSettings(updatedSettings);
    setSavedSuccess(true);
    if (onSaved) onSaved(updatedSettings);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Generate a realistic sample invoice for testing
  const createSampleInvoice = (): SalesInvoice => {
    return {
      id: 'sample_' + Date.now(),
      invoiceNumber: `${currentSettings.invoicePrefix || 'PMS-INV-'}SAMPLE-001`,
      invoiceDate: new Date().toISOString().slice(0, 10),
      customerId: 'sample_cust',
      customerName: 'Aayush Shrestha (नमुना ग्राहक)',
      customerPhone: '9857012345',
      customerAddress: 'Milanchowk, Butwal-8',
      customerPan: '601234567',
      items: [
        {
          id: 'item_sample_1',
          productName: 'iPhone 15 Pro Max',
          brand: 'Apple',
          model: '256GB Natural Titanium',
          imeiOrSerial: '358741092837412',
          warrantyMonths: 12,
          qty: 1,
          purchaseCost: 145000,
          rate: 168000,
          discount: 3000,
          taxPercent: currentSettings.enableVat ? 13 : 0,
          taxAmount: currentSettings.enableVat ? 21450 : 0,
          totalAmount: currentSettings.enableVat ? 186450 : 165000
        },
        {
          id: 'item_sample_2',
          productName: 'Apple 20W USB-C Power Adapter',
          brand: 'Apple',
          model: 'Original Fast Charger',
          warrantyMonths: 6,
          qty: 1,
          purchaseCost: 2400,
          rate: 3500,
          discount: 0,
          taxPercent: currentSettings.enableVat ? 13 : 0,
          taxAmount: currentSettings.enableVat ? 455 : 0,
          totalAmount: currentSettings.enableVat ? 3955 : 3500
        }
      ],
      subtotal: 171500,
      discountTotal: 3000,
      taxableAmount: 168500,
      taxTotal: currentSettings.enableVat ? 21905 : 0,
      grandTotal: currentSettings.enableVat ? 190405 : 168500,
      paidAmount: currentSettings.enableVat ? 190405 : 168500,
      dueAmount: 0,
      paymentStatus: 'paid',
      paymentMethod: 'eSewa / Cash',
      paymentAccountId: 'acc_cash',
      notes: 'Thank you for choosing Pandey Mobile Store! Always keep this bill safe for warranty claim.',
      status: 'active',
      totalCost: 147400,
      grossProfit: 21100,
      createdBy: 'Store Cashier',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const handleRunTestPrint = () => {
    // First save settings so the print modal picks them up
    handleSave();
    if (onTestPrint) {
      onTestPrint(createSampleInvoice());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif text-white">
                बिल प्रिन्ट तथा कागज साइज सेटअप (Bill Print & Paper Size Setup)
              </h2>
              <p className="text-xs text-slate-400">
                पसलको बिल प्रिन्टर अनुसार कागज साइज (A4, A5, POS Thermal वा Custom mm) सम्पादन गरी सुरक्षित गर्नुहोस्
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saved Success Notification */}
        {savedSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>कागज साइज र बिल प्रिन्ट सेटअप सफलतापूर्वक सुरक्षित भयो (Print setup saved successfully)!</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">

          {/* Section 1: Paper Size Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-indigo-600" />
                <span>१. कागजको साइज छान्नुहोस् (Choose Paper Size Preset)</span>
              </label>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                हालको साइज: {customWidthMm} × {customHeightMm > 0 ? `${customHeightMm} mm` : 'Auto Roll'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {/* A4 */}
              <button
                type="button"
                onClick={() => handleSelectPreset('a4')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  paperSize === 'a4'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black">A4 Sheet</span>
                  {paperSize === 'a4' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <div className="mt-2 text-[10px] text-slate-500 leading-tight">
                  <p className="font-semibold text-slate-800">२१० × २९७ mm</p>
                  <p>समान्य ठूलो पाना</p>
                </div>
              </button>

              {/* A5 Portrait */}
              <button
                type="button"
                onClick={() => handleSelectPreset('a5_portrait')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  paperSize === 'a5_portrait'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black">A5 Portrait</span>
                  {paperSize === 'a5_portrait' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <div className="mt-2 text-[10px] text-slate-500 leading-tight">
                  <p className="font-semibold text-slate-800">१४८ × २१० mm</p>
                  <p>आधा पाना ठाडो</p>
                </div>
              </button>

              {/* A5 Landscape */}
              <button
                type="button"
                onClick={() => handleSelectPreset('a5_landscape')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  paperSize === 'a5_landscape'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black">A5 Landscape</span>
                  {paperSize === 'a5_landscape' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <div className="mt-2 text-[10px] text-slate-500 leading-tight">
                  <p className="font-semibold text-slate-800">२१० × १४८ mm</p>
                  <p>आधा पाना तेर्सो</p>
                </div>
              </button>

              {/* Thermal 80mm */}
              <button
                type="button"
                onClick={() => handleSelectPreset('thermal_80')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  paperSize === 'thermal_80'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black">POS 80mm</span>
                  {paperSize === 'thermal_80' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <div className="mt-2 text-[10px] text-slate-500 leading-tight">
                  <p className="font-semibold text-slate-800">८० mm Roll</p>
                  <p>३ इन्च थर्मल रसिद</p>
                </div>
              </button>

              {/* Thermal 58mm */}
              <button
                type="button"
                onClick={() => handleSelectPreset('thermal_58')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  paperSize === 'thermal_58'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black">POS 58mm</span>
                  {paperSize === 'thermal_58' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <div className="mt-2 text-[10px] text-slate-500 leading-tight">
                  <p className="font-semibold text-slate-800">५८ mm Roll</p>
                  <p>२ इन्च सानो रसिद</p>
                </div>
              </button>

              {/* Custom */}
              <button
                type="button"
                onClick={() => setPaperSize('custom')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  paperSize === 'custom'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black">Custom mm</span>
                  {paperSize === 'custom' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <div className="mt-2 text-[10px] text-slate-500 leading-tight">
                  <p className="font-semibold text-slate-800">आफ्नो साइज</p>
                  <p>चौडाइ / लम्बाइ mm</p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Precise Paper Dimension Editing (चौडाइ र लम्बाइ सम्पादन) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>२. कागजको चौडाइ र लम्बाइ सम्पादन गर्नुहोस् (Edit Dimensions in mm)</span>
              </label>
              <span className="text-[11px] text-slate-500">
                (तपाईंको प्रिन्टरको कागज अनुसार सिधै मान परिवर्तन गर्न सक्नुहुन्छ)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {/* Width mm */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  कागजको चौडाइ (Width in mm) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={40}
                    max={350}
                    value={customWidthMm}
                    onChange={(e) => {
                      setCustomWidthMm(Number(e.target.value));
                      setPaperSize('custom');
                    }}
                    className="w-full p-2.5 pr-10 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    mm
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">उदाहरण: A4=210, A5=148, 3"=80, 2"=58</p>
              </div>

              {/* Height mm */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  कागजको लम्बाइ (Height in mm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={600}
                    value={customHeightMm}
                    placeholder="0 for Continuous Roll"
                    onChange={(e) => {
                      setCustomHeightMm(Number(e.target.value));
                      setPaperSize('custom');
                    }}
                    className="w-full p-2.5 pr-10 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    {customHeightMm === 0 ? 'Roll' : 'mm'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">० राखेमा रोल प्रिन्टरमा अटो-हाइट हुन्छ</p>
              </div>

              {/* Margin mm */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  किनारा मार्जिन (Margin in mm)
                </label>
                <select
                  value={marginMm}
                  onChange={(e) => setMarginMm(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 font-mono focus:border-indigo-600 outline-hidden"
                >
                  <option value={0}>0 mm (Borderless / Thermal)</option>
                  <option value={2}>2 mm (Minimal POS)</option>
                  <option value={4}>4 mm (Tight)</option>
                  <option value={6}>6 mm (Compact A5)</option>
                  <option value={8}>8 mm (Normal A4/A5)</option>
                  <option value={12}>12 mm (Spacious)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">कागजको छेउबाट खाली छोडिने भाग</p>
              </div>

              {/* Orientation */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  दिशा (Page Orientation)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      orientation === 'portrait'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    ठाडो (Portrait)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      orientation === 'landscape'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    तेर्सो (Landscape)
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">A5 साइजमा तेर्सो धेरै चल्छ</p>
              </div>
            </div>
          </div>

          {/* Section 3: Font Scale & Copies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Font Scale */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-700 block">
                अक्षरको आकार (Font Scaling for Bill)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFontScale('compact')}
                  className={`py-2 rounded-xl border font-bold text-center transition cursor-pointer ${
                    fontScale === 'compact'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  सानो (Compact)
                </button>
                <button
                  type="button"
                  onClick={() => setFontScale('normal')}
                  className={`py-2 rounded-xl border font-bold text-center transition cursor-pointer ${
                    fontScale === 'normal'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  समान्य (Normal)
                </button>
                <button
                  type="button"
                  onClick={() => setFontScale('large')}
                  className={`py-2 rounded-xl border font-bold text-center transition cursor-pointer ${
                    fontScale === 'large'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ठूलो (Large)
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                A5 र 58mm साइजका लागि सानो वा समान्य उपयुक्त हुन्छ
              </p>
            </div>

            {/* Copies */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="font-bold text-slate-700 block">
                प्रिन्ट प्रति संख्या (Default Copies Per Bill)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCopies(1)}
                  className={`py-2 rounded-xl border font-bold text-center transition cursor-pointer ${
                    copies === 1
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Single (१ प्रति - ग्राहक मात्र)
                </button>
                <button
                  type="button"
                  onClick={() => setCopies(2)}
                  className={`py-2 rounded-xl border font-bold text-center transition cursor-pointer ${
                    copies === 2
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Duplicate (२ प्रति - ग्राहक + पसल)
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                २ प्रति छान्दा एउटै पानामा वा दुईवटा रसिद क्रमैसँग छापिन्छ
              </p>
            </div>
          </div>

          {/* Section 4: Content Elements Toggles */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              ३. बिलमा छापिने विवरणहरू (Invoice Details & Content Toggles)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <label className="flex items-center space-x-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPanVat}
                  onChange={(e) => setShowPanVat(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span className="font-semibold text-slate-800">PAN / VAT नम्बर</span>
              </label>

              <label className="flex items-center space-x-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showImei}
                  onChange={(e) => setShowImei(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span className="font-semibold text-slate-800">IMEI / सिरियल नम्बर</span>
              </label>

              <label className="flex items-center space-x-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWarranty}
                  onChange={(e) => setShowWarranty(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span className="font-semibold text-slate-800">वारेन्टी महिना</span>
              </label>

              <label className="flex items-center space-x-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTerms}
                  onChange={(e) => setShowTerms(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span className="font-semibold text-slate-800">नियम तथा सर्तहरू</span>
              </label>

              <label className="flex items-center space-x-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={(e) => setShowSignatures(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span className="font-semibold text-slate-800">हस्ताक्षर लाइन (Signatures)</span>
              </label>

              <label className="flex items-center space-x-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPaidStamp}
                  onChange={(e) => setShowPaidStamp(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span className="font-semibold text-slate-800">PAID स्ट्याम्प छाप</span>
              </label>

              <label className="flex items-center space-x-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCustomerAddress}
                  onChange={(e) => setShowCustomerAddress(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span className="font-semibold text-slate-800">ग्राहक ठेगाना र फोन</span>
              </label>

              <label className="flex items-center space-x-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCompanyHeader}
                  onChange={(e) => setShowCompanyHeader(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span className="font-semibold text-slate-800">कम्पनीको मुख्य हेडर</span>
              </label>
            </div>
          </div>

          {/* Section 5: Mini Live Preview Card */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5 text-indigo-300">
                <Eye className="w-4 h-4" />
                <span>कागज ढाँचा पूर्वावलोकन (Live Aspect Proportion)</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                प्रकार: {paperSize.toUpperCase()} | चौडाइ: {customWidthMm}mm | लम्बाइ: {customHeightMm > 0 ? `${customHeightMm}mm` : 'Auto Continuous Roll'}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl flex items-center justify-center min-h-[110px]">
              <div
                className="bg-white text-slate-900 p-2.5 rounded shadow-lg text-[9px] font-sans flex flex-col justify-between transition-all"
                style={{
                  width: customWidthMm <= 65 ? '130px' : customWidthMm <= 90 ? '160px' : customWidthMm <= 160 ? '240px' : '300px',
                  minHeight: customHeightMm > 0 ? `${Math.min(customHeightMm * 0.5, 140)}px` : '100px'
                }}
              >
                <div>
                  <div className="text-center font-black border-b pb-1 mb-1">
                    <p className="text-[10px] font-serif leading-none">{currentSettings.companyName || 'Pandey Mobile Store'}</p>
                    <p className="text-[8px] text-slate-500">Traffic Chowk, Butwal • Tel: {currentSettings.phone || '9857012345'}</p>
                    {showPanVat && currentSettings.panNumber && (
                      <p className="text-[7px] text-slate-600 font-mono">PAN: {currentSettings.panNumber}</p>
                    )}
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-600 border-b pb-0.5 mb-1">
                    <span>INV: SAMPLE-001</span>
                    <span>Date: {new Date().toISOString().slice(0, 10)}</span>
                  </div>
                  <div className="space-y-0.5 text-[8px]">
                    <div className="flex justify-between font-semibold">
                      <span>1x iPhone 15 Pro</span>
                      <span>Rs. 1,65,000</span>
                    </div>
                    {showImei && (
                      <div className="text-[7px] text-slate-500 font-mono">IMEI: 358741092837412</div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-1 mt-1 flex justify-between font-black text-[9px]">
                  <span>जम्मा (Total):</span>
                  <span>Rs. 1,65,000</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            * सेभ गरेपछि सबै नयाँ र पुराना बिलहरू यही साइजमा प्रिन्ट हुनेछन्।
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            {onTestPrint && (
              <button
                type="button"
                onClick={handleRunTestPrint}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                title="नमुना बिल प्रिन्ट गरी हेर्नुहोस्"
              >
                <Printer className="w-4 h-4 text-indigo-400" />
                <span>बिल प्रिन्ट परीक्षण (Test Print)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>सेटिङ सेभ गर्नुहोस् (Save Setup)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
