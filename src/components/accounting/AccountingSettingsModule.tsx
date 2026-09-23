import React, { useState } from 'react';
import {
  Settings,
  Shield,
  FileText,
  Key,
  Database,
  CheckCircle2,
  Lock,
  UserCheck,
  Building,
  Hash,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Link2,
  Sparkles,
  Server,
  Printer,
  Sliders
} from 'lucide-react';
import { AccountingStorageService } from '../../services/accountingStorage.ts';
import { AccountingSettings, AccountingUserRole, BillPaperSize, PrintSetupConfig, SalesInvoice } from '../../types/accounting.ts';
import { InvoicePrintModal } from './InvoicePrintModal.tsx';

export const AccountingSettingsModule: React.FC = () => {
  const currentSettings = AccountingStorageService.getSettings();
  const [settings, setSettings] = useState<AccountingSettings>(currentSettings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'printSetup' | 'roles' | 'audit' | 'subdomain'>('general');
  const [sampleInvoiceToPrint, setSampleInvoiceToPrint] = useState<SalesInvoice | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const auditLogs = AccountingStorageService.getAuditLogs();

  const handleCopy = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(label);
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    AccountingStorageService.saveSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const createSampleInvoiceForPrint = (): SalesInvoice => ({
    id: 'sample_print_' + Date.now(),
    invoiceNumber: `${settings.invoicePrefix || 'PMS-INV-'}SAMPLE-001`,
    invoiceDate: new Date().toISOString().slice(0, 10),
    customerId: 'sample_cust',
    customerName: 'Aayush Shrestha (नमुना ग्राहक)',
    customerPhone: '9857012345',
    customerAddress: 'Milanchowk, Butwal-8',
    customerPan: '601234567',
    items: [
      {
        id: 'item_sample_1',
        productName: 'Samsung Galaxy S24 Ultra',
        brand: 'Samsung',
        model: '12GB/256GB Titanium Gray',
        imeiOrSerial: '354892019284719',
        warrantyMonths: 12,
        qty: 1,
        purchaseCost: 155000,
        rate: 184999,
        discount: 2000,
        taxPercent: settings.enableVat ? 13 : 0,
        taxAmount: settings.enableVat ? 23789 : 0,
        totalAmount: settings.enableVat ? 206788 : 182999
      },
      {
        id: 'item_sample_2',
        productName: 'Samsung 45W Super Fast Charger',
        brand: 'Samsung',
        model: 'Original Type-C Adapter',
        warrantyMonths: 6,
        qty: 1,
        purchaseCost: 2800,
        rate: 4200,
        discount: 0,
        taxPercent: settings.enableVat ? 13 : 0,
        taxAmount: settings.enableVat ? 546 : 0,
        totalAmount: settings.enableVat ? 4746 : 4200
      }
    ],
    subtotal: 189199,
    discountTotal: 2000,
    taxableAmount: 187199,
    taxTotal: settings.enableVat ? 24335 : 0,
    grandTotal: settings.enableVat ? 211534 : 187199,
    paidAmount: settings.enableVat ? 211534 : 187199,
    dueAmount: 0,
    paymentStatus: 'paid',
    paymentMethod: 'Cash',
    paymentAccountId: 'acc_cash',
    notes: 'Thank you for shopping at Pandey Mobile Store!',
    status: 'active',
    totalCost: 157800,
    grossProfit: 29399,
    createdBy: 'Store Staff',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const handlePurgeDemoData = () => {
    const confirmMsg = 'के तपाईं सबै डेमो हिसाब-किताब मेटाउन निश्चित हुनुहुन्छ?\n\n- सबै डेमो बिक्री, खरिद, भौचर र पार्टी खाता मेटिनेछ।\n- नगद र बैंक खाताको ब्यालेन्स ० हुनेछ।\n- वेबसाइटका उत्पादनहरू (Products) सुरक्षित रहनेछन्।';
    if (window.confirm(confirmMsg)) {
      AccountingStorageService.clearAllDemoAccountingData('admin');
      setPurgeSuccess(true);
      setTimeout(() => {
        setPurgeSuccess(false);
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 font-serif">
            Accounting Configuration & Security (लेखा प्रणाली सेटिङ)
          </h2>
          <p className="text-xs text-slate-500">
            Configure financial year, invoice prefixes, PAN/VAT, multi-role access & audit trail
          </p>
        </div>

        <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'general' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            System Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('printSetup')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'printSetup' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>कागज साइज / बिल प्रिन्ट (Print Setup)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'roles' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            User Roles & Permissions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subdomain')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'subdomain' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>छुट्टै लिङ्क / सब-डोमेन</span>
          </button>
        </div>
      </div>

      {/* TAB 1: General Settings Form */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6">
          
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>सेटिङ सफलतापूर्वक सेभ भयो (Settings updated successfully)!</span>
            </div>
          )}

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Company Information for Invoices & Bill Headers</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company / Store Name *</label>
                <input
                  type="text"
                  required
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full p-2 border rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">PAN / VAT Number</label>
                <input
                  type="text"
                  value={settings.panNumber}
                  onChange={(e) => setSettings({ ...settings, panNumber: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Store Phone / Mobile</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Store Physical Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Store Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Financial Year & VAT */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <Settings className="w-4 h-4 text-emerald-600" />
              <span>Financial Year & Tax/VAT Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Financial Year (आर्थिक वर्ष) *</label>
                <input
                  type="text"
                  value={settings.financialYear}
                  onChange={(e) => setSettings({ ...settings, financialYear: e.target.value })}
                  className="w-full p-2 border rounded-lg font-bold font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 pt-5">
                <input
                  type="checkbox"
                  id="enableVat"
                  checked={settings.enableVat}
                  onChange={(e) => setSettings({ ...settings, enableVat: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <label htmlFor="enableVat" className="font-bold text-slate-800">
                  Enable Nepal Government VAT (१३% भ्याट)
                </label>
              </div>

              {settings.enableVat && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">VAT Rate (%)</label>
                  <input
                    type="number"
                    value={settings.vatRate}
                    onChange={(e) => setSettings({ ...settings, vatRate: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg font-mono font-bold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Voucher Prefixing & Numbering */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <Hash className="w-4 h-4 text-purple-600" />
              <span>Invoice & Voucher Auto-Numbering Sequences</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Sales Prefix</label>
                <input
                  type="text"
                  value={settings.invoicePrefix}
                  onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Purchase Prefix</label>
                <input
                  type="text"
                  value={settings.purchasePrefix}
                  onChange={(e) => setSettings({ ...settings, purchasePrefix: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Receipt Prefix</label>
                <input
                  type="text"
                  value={settings.receiptPrefix}
                  onChange={(e) => setSettings({ ...settings, receiptPrefix: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Prefix</label>
                <input
                  type="text"
                  value={settings.paymentPrefix}
                  onChange={(e) => setSettings({ ...settings, paymentPrefix: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          {/* Bill Print & Paper Size Setup (बिल प्रिन्ट तथा कागजको साइज सेटिङ) */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Bill Print Setup & Paper Size (बिल प्रिन्ट तथा कागज साइज सेटिङ)</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Default: {settings.defaultPaperSize || 'a4'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {/* Paper Size Preset */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  डिफल्ट कागजको साइज (Default Paper Size) *
                </label>
                <select
                  value={settings.defaultPaperSize || settings.printSetup?.paperSize || 'a4'}
                  onChange={(e) => {
                    const selectedSize = e.target.value as BillPaperSize;
                    const prevSetup = settings.printSetup || {
                      paperSize: selectedSize,
                      customWidthMm: 210,
                      customHeightMm: 297,
                      orientation: 'portrait',
                      marginMm: 8,
                      fontScale: 'normal',
                      copies: 1
                    };
                    let width = prevSetup.customWidthMm || 210;
                    let height = prevSetup.customHeightMm || 297;
                    let orient: 'portrait' | 'landscape' = prevSetup.orientation || 'portrait';
                    let margin = prevSetup.marginMm ?? 8;
                    let font: 'compact' | 'normal' | 'large' = prevSetup.fontScale || 'normal';

                    if (selectedSize === 'a4') {
                      width = 210;
                      height = 297;
                      orient = 'portrait';
                      margin = 8;
                      font = 'normal';
                    } else if (selectedSize === 'a5_portrait') {
                      width = 148;
                      height = 210;
                      orient = 'portrait';
                      margin = 6;
                      font = 'compact';
                    } else if (selectedSize === 'a5_landscape') {
                      width = 210;
                      height = 148;
                      orient = 'landscape';
                      margin = 6;
                      font = 'compact';
                    } else if (selectedSize === 'thermal_80') {
                      width = 80;
                      height = 0;
                      orient = 'portrait';
                      margin = 2;
                      font = 'normal';
                    } else if (selectedSize === 'thermal_58') {
                      width = 58;
                      height = 0;
                      orient = 'portrait';
                      margin = 1;
                      font = 'compact';
                    }

                    setSettings({
                      ...settings,
                      defaultPaperSize: selectedSize,
                      printSetup: {
                        ...prevSetup,
                        paperSize: selectedSize,
                        customWidthMm: width,
                        customHeightMm: height,
                        orientation: orient,
                        marginMm: margin,
                        fontScale: font
                      }
                    });
                  }}
                  className="w-full p-2 border rounded-lg font-bold bg-white"
                >
                  <option value="a4">A4 Full Page (२१० × २९७ mm)</option>
                  <option value="a5_portrait">A5 Half Sheet Portrait (१४८ × २१० mm)</option>
                  <option value="a5_landscape">A5 Half Sheet Landscape (२१० × १४८ mm)</option>
                  <option value="thermal_80">POS 80mm Roll (३ इन्च थर्मल रसिद)</option>
                  <option value="thermal_58">POS 58mm Roll (२ इन्च मिनी रसिद)</option>
                  <option value="custom">Custom Size (कस्टम साइज mm सम्पादन)</option>
                </select>
              </div>

              {/* Custom Dimensions */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  चौडाइ x लम्बाइ (Width × Height mm)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    min={40}
                    max={350}
                    value={settings.printSetup?.customWidthMm ?? 210}
                    onChange={(e) => {
                      const w = Number(e.target.value);
                      setSettings({
                        ...settings,
                        printSetup: {
                          ...(settings.printSetup || { paperSize: 'custom', copies: 1 }),
                          paperSize: 'custom',
                          customWidthMm: w
                        }
                      });
                    }}
                    placeholder="Width"
                    className="w-full p-2 border rounded-lg font-mono"
                    title="Width in mm"
                  />
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={settings.printSetup?.customHeightMm ?? 297}
                    onChange={(e) => {
                      const h = Number(e.target.value);
                      setSettings({
                        ...settings,
                        printSetup: {
                          ...(settings.printSetup || { paperSize: 'custom', copies: 1 }),
                          paperSize: 'custom',
                          customHeightMm: h
                        }
                      });
                    }}
                    placeholder="Height (0=roll)"
                    className="w-full p-2 border rounded-lg font-mono"
                    title="Height in mm (0 for auto roll)"
                  />
                </div>
              </div>

              {/* Copies & Font Scale */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  प्रिन्ट प्रतिहरू (Default Copies)
                </label>
                <select
                  value={settings.printSetup?.copies ?? 1}
                  onChange={(e) => {
                    const c = Number(e.target.value) as 1 | 2;
                    setSettings({
                      ...settings,
                      printSetup: {
                        ...(settings.printSetup || { paperSize: 'a4' }),
                        copies: c
                      }
                    });
                  }}
                  className="w-full p-2 border rounded-lg font-semibold bg-white"
                >
                  <option value={1}>Single (१ प्रति - ग्राहक मात्र)</option>
                  <option value={2}>Duplicate (२ प्रति - ग्राहक + पसल प्रति)</option>
                </select>
              </div>

              {/* Font Scale & Margin */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  अक्षरको आकार (Font Scale)
                </label>
                <select
                  value={settings.printSetup?.fontScale || 'normal'}
                  onChange={(e) => {
                    const f = e.target.value as 'compact' | 'normal' | 'large';
                    setSettings({
                      ...settings,
                      printSetup: {
                        ...(settings.printSetup || { paperSize: 'a4', copies: 1 }),
                        fontScale: f
                      }
                    });
                  }}
                  className="w-full p-2 border rounded-lg font-semibold bg-white"
                >
                  <option value="compact">Compact (सानो - A5/Thermal का लागि)</option>
                  <option value="normal">Normal (सामान्य)</option>
                  <option value="large">Large (ठूलो)</option>
                </select>
              </div>
            </div>

            {/* Print Header / Footer Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Header Tagline (बिलको माथि आउने विवरण)
                </label>
                <input
                  type="text"
                  value={settings.printHeaderNote || ''}
                  onChange={(e) => setSettings({ ...settings, printHeaderNote: e.target.value })}
                  placeholder="Official Smartphone & Service Center • Butwal, Nepal"
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Margin (मार्जिन mm)
                </label>
                <select
                  value={settings.printSetup?.marginMm ?? 8}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setSettings({
                      ...settings,
                      printSetup: {
                        ...(settings.printSetup || { paperSize: 'a4', copies: 1 }),
                        marginMm: m
                      }
                    });
                  }}
                  className="w-full p-2 border rounded-lg font-semibold bg-white font-mono"
                >
                  <option value={0}>0 mm (Borderless / Thermal Roll)</option>
                  <option value={3}>3 mm (Minimal POS)</option>
                  <option value={6}>6 mm (Compact A5)</option>
                  <option value={8}>8 mm (Normal A4/A5)</option>
                  <option value={12}>12 mm (Wide)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Terms for Invoices */}
          <div className="space-y-2 pt-4 border-t">
            <label className="font-bold text-slate-700 block text-xs">
              Printed Terms & Warranty Notice on Customer Invoices (बिलमा छापिने सर्तहरू)
            </label>
            <textarea
              rows={3}
              value={settings.printTerms}
              onChange={(e) => setSettings({ ...settings, printTerms: e.target.value })}
              className="w-full p-2.5 border rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Accounting & Print Configuration</span>
            </button>
          </div>

        </form>

        {/* Demo Data Purge & Database Maintenance Card */}
        <div className="bg-white rounded-2xl border border-rose-200 shadow-xs p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900">
                  Purge All Accounting Demo Data (डेमो हिसाब-किताब डाटा मेटाउनुहोस्)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  नयाँ वास्तविक हिसाब सुरु गर्नका लागि सबै डेमो बिलहरू, खरिद दाखिला, भुक्तानी, पार्टी खाता र लेजर ब्यालेन्स खाली (०) बनाउनुहोस्। वेबसाइटको उत्पादन क्याटलग र मूल्यहरू सुरक्षित रहनेछन्।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePurgeDemoData}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center space-x-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>डेमो डाटा हटाउनुहोस् (Purge Demo)</span>
            </button>
          </div>

          {purgeSuccess && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-rose-600" />
              <span>सबै डेमो डाटा सफलतापूर्वक हटाइयो। पेज रिफ्रेस हुँदैछ...</span>
            </div>
          )}
        </div>
      </div>
      )}

      {/* TAB: Bill Print Setup & Paper Size */}
      {activeTab === 'printSetup' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6">
            
            {/* Header */}
            <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Printer className="w-5 h-5 text-indigo-600" />
                  <span>बिल प्रिन्ट तथा कागज साइज सेटअप (Bill Print & Paper Size Setup)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  पसलको प्रिन्टर अनुसार कागज साइज (A4, A5, POS 80mm, POS 58mm वा Custom mm) सम्पादन गरी स्थायी सुरक्षित गर्नुहोस्
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSampleInvoiceToPrint(createSampleInvoiceForPrint())}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  title="नमुना बिल प्रिन्ट परीक्षण"
                >
                  <Printer className="w-4 h-4 text-indigo-400" />
                  <span>प्रिन्ट परीक्षण (Test Print)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>सेटिङ सेभ गर्नुहोस् (Save)</span>
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                १. कागज साइज प्रिसेट (Choose Preset)
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {[
                  { id: 'a4', name: 'A4 Sheet', size: '210 × 297 mm', desc: 'समान्य ठूलो पाना', w: 210, h: 297, o: 'portrait', m: 8, f: 'normal' },
                  { id: 'a5_portrait', name: 'A5 Portrait', size: '148 × 210 mm', desc: 'आधा पाना ठाडो', w: 148, h: 210, o: 'portrait', m: 6, f: 'compact' },
                  { id: 'a5_landscape', name: 'A5 Landscape', size: '210 × 148 mm', desc: 'आधा पाना तेर्सो', w: 210, h: 148, o: 'landscape', m: 6, f: 'compact' },
                  { id: 'thermal_80', name: 'POS 80mm', size: '80 mm Roll', desc: '३ इन्च थर्मल रसिद', w: 80, h: 0, o: 'portrait', m: 2, f: 'normal' },
                  { id: 'thermal_58', name: 'POS 58mm', size: '58 mm Roll', desc: '२ इन्च सानो रसिद', w: 58, h: 0, o: 'portrait', m: 1, f: 'compact' },
                  { id: 'custom', name: 'Custom mm', size: 'आफ्नो साइज', desc: 'चौडाइ र लम्बाइ mm', w: settings.printSetup?.customWidthMm || 148, h: settings.printSetup?.customHeightMm ?? 210, o: 'portrait', m: 6, f: 'normal' }
                ].map((preset) => {
                  const currentPaperSize = settings.defaultPaperSize || settings.printSetup?.paperSize || 'a4';
                  const isSelected = currentPaperSize === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        const newSetup: PrintSetupConfig = {
                          ...(settings.printSetup || {}),
                          paperSize: preset.id as BillPaperSize,
                          customWidthMm: preset.w,
                          customHeightMm: preset.h,
                          orientation: preset.o as 'portrait' | 'landscape',
                          marginMm: preset.m,
                          fontScale: preset.f as 'compact' | 'normal' | 'large'
                        };
                        setSettings({
                          ...settings,
                          defaultPaperSize: preset.id as BillPaperSize,
                          printSetup: newSetup
                        });
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-black">{preset.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <div className="mt-2 text-[10px] text-slate-500 leading-tight">
                        <p className="font-semibold text-slate-800">{preset.size}</p>
                        <p>{preset.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Dimension Inputs */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                २. कागजको चौडाइ, लम्बाइ र मार्जिन सम्पादन गर्नुहोस् (Edit mm Dimensions)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {/* Width */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">कागज चौडाइ (Width mm) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={40}
                      max={350}
                      value={settings.printSetup?.customWidthMm || 210}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSettings({
                          ...settings,
                          defaultPaperSize: 'custom',
                          printSetup: {
                            ...(settings.printSetup || { paperSize: 'custom' }),
                            paperSize: 'custom',
                            customWidthMm: val
                          }
                        });
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:border-indigo-600 outline-hidden"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">mm</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">A4=210, A5=148, 3"=80, 2"=58</p>
                </div>

                {/* Height */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">कागज लम्बाइ (Height mm)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={600}
                      value={settings.printSetup?.customHeightMm ?? 297}
                      placeholder="0 for Auto Roll"
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSettings({
                          ...settings,
                          defaultPaperSize: 'custom',
                          printSetup: {
                            ...(settings.printSetup || { paperSize: 'custom' }),
                            paperSize: 'custom',
                            customHeightMm: val
                          }
                        });
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:border-indigo-600 outline-hidden"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      {settings.printSetup?.customHeightMm === 0 ? 'Roll' : 'mm'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">० राखेमा रोलमा अटो-हाइट हुन्छ</p>
                </div>

                {/* Margins */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">कागज मार्जिन (Margins)</label>
                  <select
                    value={settings.printSetup?.marginMm ?? 8}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSettings({
                        ...settings,
                        printSetup: {
                          ...(settings.printSetup || { paperSize: settings.defaultPaperSize || 'a4' }),
                          paperSize: settings.printSetup?.paperSize || settings.defaultPaperSize || 'a4',
                          marginMm: val
                        }
                      });
                    }}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold font-mono focus:border-indigo-600 outline-hidden"
                  >
                    <option value={0}>0 mm (Borderless)</option>
                    <option value={2}>2 mm (Minimal POS)</option>
                    <option value={4}>4 mm (Tight)</option>
                    <option value={6}>6 mm (Compact A5)</option>
                    <option value={8}>8 mm (Normal)</option>
                    <option value={12}>12 mm (Spacious)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">कागजको किनारा खाली ठाउँ</p>
                </div>

                {/* Orientation */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">दिशा (Orientation)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSettings({
                          ...settings,
                          printSetup: {
                            ...(settings.printSetup || { paperSize: settings.defaultPaperSize || 'a4' }),
                            paperSize: settings.printSetup?.paperSize || settings.defaultPaperSize || 'a4',
                            orientation: 'portrait'
                          }
                        });
                      }}
                      className={`py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        (settings.printSetup?.orientation || 'portrait') === 'portrait'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ठाडो (Portrait)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSettings({
                          ...settings,
                          printSetup: {
                            ...(settings.printSetup || { paperSize: settings.defaultPaperSize || 'a4' }),
                            paperSize: settings.printSetup?.paperSize || settings.defaultPaperSize || 'a4',
                            orientation: 'landscape'
                          }
                        });
                      }}
                      className={`py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        settings.printSetup?.orientation === 'landscape'
                          ? 'bg-indigo-600 text-white border-indigo-600'
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

            {/* Font Scale & Copies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-700 block">अक्षरको आकार (Font Scale)</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['compact', 'normal', 'large'] as const).map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => {
                        setSettings({
                          ...settings,
                          printSetup: {
                            ...(settings.printSetup || { paperSize: settings.defaultPaperSize || 'a4' }),
                            paperSize: settings.printSetup?.paperSize || settings.defaultPaperSize || 'a4',
                            fontScale: scale
                          }
                        });
                      }}
                      className={`py-2 rounded-xl border font-bold text-center transition cursor-pointer ${
                        (settings.printSetup?.fontScale || 'normal') === scale
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {scale === 'compact' ? 'सानो (Compact)' : scale === 'normal' ? 'समान्य (Normal)' : 'ठूलो (Large)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-700 block">प्रिन्ट प्रति संख्या (Copies)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setSettings({
                          ...settings,
                          printSetup: {
                            ...(settings.printSetup || { paperSize: settings.defaultPaperSize || 'a4' }),
                            paperSize: settings.printSetup?.paperSize || settings.defaultPaperSize || 'a4',
                            copies: num as 1 | 2
                          }
                        });
                      }}
                      className={`py-2 rounded-xl border font-bold text-center transition cursor-pointer ${
                        (settings.printSetup?.copies || 1) === num
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {num === 1 ? 'Single (१ प्रति - ग्राहक)' : 'Duplicate (२ प्रति - ग्राहक + पसल)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Proportion Box & Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-300">कागज ढाँचा पूर्वावलोकन (Live Proportion)</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {settings.printSetup?.customWidthMm || 210}mm × {settings.printSetup?.customHeightMm || 297}mm
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl flex items-center justify-center min-h-[120px]">
                  <div
                    className="bg-white text-slate-900 p-3 rounded shadow-md text-[9px] font-sans flex flex-col justify-between"
                    style={{
                      width: (settings.printSetup?.customWidthMm || 210) <= 65 ? '130px' : (settings.printSetup?.customWidthMm || 210) <= 90 ? '160px' : (settings.printSetup?.customWidthMm || 210) <= 160 ? '220px' : '260px',
                      minHeight: (settings.printSetup?.customHeightMm || 297) > 0 ? `${Math.min((settings.printSetup?.customHeightMm || 297) * 0.4, 130)}px` : '100px'
                    }}
                  >
                    <div className="text-center font-black border-b pb-1">
                      <p className="text-[10px]">{settings.companyName || 'Pandey Mobile Store'}</p>
                      <p className="text-[8px] text-slate-500">Milanchowk, Butwal • Tel: {settings.phone || '9857012345'}</p>
                    </div>
                    <div className="py-1 text-[8px] space-y-0.5">
                      <div className="flex justify-between">
                        <span>1x Galaxy S24 Ultra</span>
                        <span>Rs. 1,84,999</span>
                      </div>
                      <div className="text-[7px] text-slate-500 font-mono">IMEI: 354892019284719</div>
                    </div>
                    <div className="border-t pt-1 flex justify-between font-black text-[9px]">
                      <span>जम्मा:</span>
                      <span>Rs. 1,84,999</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Terms */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="font-bold text-slate-700 block text-xs">
                  बिलको मुनि छापिने नियम तथा वारेन्टी सर्तहरू (Printed Terms)
                </label>
                <textarea
                  rows={4}
                  value={settings.printTerms}
                  onChange={(e) => setSettings({ ...settings, printTerms: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-hidden"
                  placeholder="१. सामान फिर्ता वा साट्न बिल अनिवार्य छ। २. डिस्प्ले र पानीको क्षतिमा वारेन्टी हुँदैन..."
                />
                <p className="text-[10px] text-slate-500">यी सर्तहरू प्रत्येक ग्राहक बिलको तल्लो भागमा छापिन्छन्।</p>
              </div>
            </div>

            {/* Bottom Save & Test Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setSampleInvoiceToPrint(createSampleInvoiceForPrint())}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-400" />
                <span>प्रिन्ट पूर्वावलोकन (Preview & Test Print)</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>कागज साइज तथा प्रिन्ट सेटिङ सेभ गर्नुहोस्</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: User Roles & Permissions */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Logical Role-Based Separation (लेखा प्रणाली अनुमतिहरू)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Accounting data and operations are restricted from regular website staff.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            {/* Admin */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-indigo-700" />
                <div>
                  <h4 className="font-black text-slate-900 text-sm">System Administrator</h4>
                  <span className="text-[10px] text-indigo-700 font-bold uppercase">Full Access</span>
                </div>
              </div>
              <ul className="space-y-1.5 text-slate-700">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> All Sales & Invoices</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Supplier Purchase Bills</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Full Profit & Loss Reports</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Bank & Cash Balances</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delete & Cancel Invoices</li>
              </ul>
            </div>

            {/* Accountant */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-slate-700" />
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Head Accountant</h4>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Accounting Core</span>
                </div>
              </div>
              <ul className="space-y-1.5 text-slate-700">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Create Sales & Purchases</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Record Receipts & Payments</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> View Ledgers & Tax Reports</li>
                <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-slate-400" /> Cannot Alter Company Config</li>
              </ul>
            </div>

            {/* Cashier / POS */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-slate-700" />
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Counter Cashier</h4>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Billing Only</span>
                </div>
              </div>
              <ul className="space-y-1.5 text-slate-700">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Issue Sales Invoices & Print</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Receive Customer Cash</li>
                <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-slate-400" /> Hidden Supplier Cost Prices</li>
                <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-slate-400" /> Hidden Profit & Loss Reports</li>
              </ul>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
          <div className="border-b pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                System Security & Activity Audit Log (अडिट लग)
              </h3>
              <p className="text-slate-500 text-[11px]">
                Immutable timestamped logs of invoices created, payments recorded & settings modified
              </p>
            </div>
            <span className="font-mono text-slate-500">Total Events: {auditLogs.length}</span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">कुनै अडिट लग छैन (No audit logs).</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-3 font-sans font-bold text-slate-800">{log.userName}</td>
                    <td className="py-2 px-3 text-indigo-700 font-bold">{log.action}</td>
                    <td className="py-2 px-3 text-slate-600">{log.entityType} ({log.entityId})</td>
                    <td className="py-2 px-3 font-sans text-slate-700">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 4: Dedicated Subdomain & Direct Links Module */}
      {activeTab === 'subdomain' && (
        <div className="space-y-6">
          {/* Main Subdomain Banner */}
          <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border border-indigo-900/60 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold font-mono">
                <Globe className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>DEDICATED ACCOUNTING GATEWAY URL</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-tight">
                खाता प्रणालीको लागि छुट्टै लिङ्क (Direct Access Links)
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                तपाईं वा तपाईंको अकाउन्टेन्ट/कर्मचारीले स्टोरको मुख्य वेबसाइट भित्र नगईकन, सिधै खाता, बिलिङ, र स्टक व्यवस्थापन पोर्टल खोल्न सक्नुहुन्छ।
                तल दिइएका कुनै पनि लिङ्क प्रयोग गरेर सिधै एकाउन्टिङ सिस्टममा लगइन गर्न सकिन्छ।
              </p>
            </div>

            {/* Links Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 relative z-10">
              {/* 1. Subdomain Link */}
              <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-emerald-400/60 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center space-x-1.5">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Dedicated Subdomain (सिफारिस गरिएको)</span>
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 text-[10px] font-bold rounded-full border border-emerald-400/30">
                    Primary Domain
                  </span>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/10 font-mono text-sm text-emerald-400 break-all select-all font-bold flex items-center justify-between">
                  <span>https://account.pandeymobile.com.np</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopy('https://account.pandeymobile.com.np', 'subdomain')}
                    className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer"
                  >
                    {copiedLink === 'subdomain' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>लिङ्क कपी भयो (Copied)!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>लिङ्क कपी गर्नुहोस् (Copy)</span>
                      </>
                    )}
                  </button>

                  <a
                    href="https://account.pandeymobile.com.np"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center space-x-1 transition-colors border border-white/20 cursor-pointer"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </a>
                </div>
              </div>

              {/* 2. Direct Path URL Link */}
              <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-indigo-400/60 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center space-x-1.5">
                    <Link2 className="w-4 h-4 text-indigo-400" />
                    <span>Direct Route Path (तत्काल चल्ने)</span>
                  </span>
                  <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 text-[10px] font-bold rounded-full border border-indigo-400/30">
                    Always Instant
                  </span>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/10 font-mono text-sm text-indigo-300 break-all select-all font-bold flex items-center justify-between">
                  <span>https://pandeymobile.com.np/account</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopy('https://pandeymobile.com.np/account', 'path')}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer"
                  >
                    {copiedLink === 'path' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>लिङ्क कपी भयो (Copied)!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>लिङ्क कपी गर्नुहोस् (Copy)</span>
                      </>
                    )}
                  </button>

                  <a
                    href="/account"
                    className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center space-x-1 transition-colors border border-white/20 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test Now</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Current Session Host Info */}
            <div className="mt-6 pt-4 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-300 font-mono">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Current Browser Host: <strong className="text-white">{typeof window !== 'undefined' ? window.location.host : ''}</strong></span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Authentication session is shared securely across the platform.
              </div>
            </div>
          </div>

          {/* DNS Configuration Guide Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 font-serif flex items-center space-x-2">
                  <Server className="w-5 h-5 text-indigo-600" />
                  <span>सब-डोमेन जोड्ने तरिका (DNS Setup Instructions for Nepal .com.np)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  <code className="text-indigo-600 font-bold font-mono">account.pandeymobile.com.np</code> लाई तपाईंको वेबसाइट वा सर्भरमा जोड्न तलको CNAME रेकर्ड थप्नुहोस्:
                </p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200">
                DNS Guide
              </span>
            </div>

            {/* DNS Records Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Record Type (प्रकार)</th>
                    <th className="py-3 px-4">Name / Host (नाम)</th>
                    <th className="py-3 px-4">Value / Target (लक्ष्य)</th>
                    <th className="py-3 px-4">TTL</th>
                    <th className="py-3 px-4">कार्य (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr className="bg-white hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-indigo-600">CNAME</td>
                    <td className="py-3 px-4 font-bold text-slate-900">account</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">pandeymobile.com.np</td>
                    <td className="py-3 px-4 text-slate-500">Auto / 3600</td>
                    <td className="py-3 px-4 font-sans">
                      <button
                        type="button"
                        onClick={() => handleCopy('account CNAME pandeymobile.com.np', 'cname')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        {copiedLink === 'cname' ? 'Copied!' : 'Copy Value'}
                      </button>
                    </td>
                  </tr>
                  <tr className="bg-slate-50/60 hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-indigo-600">CNAME (वैकल्पिक)</td>
                    <td className="py-3 px-4 font-bold text-slate-900">accounting</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">pandeymobile.com.np</td>
                    <td className="py-3 px-4 text-slate-500">Auto / 3600</td>
                    <td className="py-3 px-4 font-sans">
                      <button
                        type="button"
                        onClick={() => handleCopy('accounting CNAME pandeymobile.com.np', 'cname2')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        {copiedLink === 'cname2' ? 'Copied!' : 'Copy Value'}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <h4 className="font-bold text-slate-900 text-sm">DNS Provider खोल्नुहोस्</h4>
                <p className="text-slate-600 leading-relaxed">
                  तपाईंको डोमेन व्यवस्थापन गर्ने प्यानल खोल्नुहोस् (जस्तै: Cloudflare, cPanel Zone Editor, वा Mercantile DNS)।
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <h4 className="font-bold text-slate-900 text-sm">CNAME Record थप्नुहोस्</h4>
                <p className="text-slate-600 leading-relaxed">
                  Type मा <strong>CNAME</strong>, Name मा <strong>account</strong>, र Target मा <strong>pandeymobile.com.np</strong> राखी सेभ गर्नुहोस्।
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <h4 className="font-bold text-slate-900 text-sm">सिधै प्रयोग गर्नुहोस्</h4>
                <p className="text-slate-600 leading-relaxed">
                  सब-डोमेन अपडेट हुनुअघि पनि <strong>/account</strong> वा <strong>/#account</strong> लिङ्क तुरुन्तै १००% चालु छ।
                </p>
              </div>
            </div>

            {/* Smart Detection Details */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>अटोमेटिक सब-डोमेन डिटेक्सन (Automatic Detection Active)</span>
              </div>
              <p className="text-emerald-700 leading-relaxed">
                एप्लिकेशनको कोडमा <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">account.*</code> र <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">accounting.*</code> सब-डोमेन पत्ता लगाउने प्रविधि पूर्ण रूपमा सक्रिय छ।
                प्रयोगकर्ताले <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">account.pandeymobile.com.np</code> खोल्ने बित्तिकै वेबसाइटका अन्य पेजहरू बाइपास भई सिधै अकाउन्टिङ लगइन वा ड्यासबोर्ड लोड हुन्छ।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SAMPLE INVOICE PRINT MODAL */}
      {sampleInvoiceToPrint && (
        <InvoicePrintModal
          invoice={sampleInvoiceToPrint}
          settings={settings}
          onClose={() => setSampleInvoiceToPrint(null)}
        />
      )}

    </div>
  );
};
