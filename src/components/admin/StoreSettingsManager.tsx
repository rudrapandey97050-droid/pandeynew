import React, { useState, useRef } from 'react';
import {
  Building2,
  Save,
  Check,
  Download,
  Upload,
  Database,
  Copy,
  AlertTriangle,
  RotateCcw,
  FileText,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Layers,
  Sparkles,
  Smartphone,
  Phone,
  MapPin,
  Clock,
  Globe,
  Info,
  X,
  ExternalLink,
  Wrench,
  Tag,
  ArrowRight,
  Lock,
  Key,
  Trash2,
  Cloud,
  UploadCloud,
  DownloadCloud,
  Printer
} from 'lucide-react';
import { StoreSettings, FullAppBackupData, RestoreResult } from '../../types.ts';
import { DataStorageService } from '../../services/dataStorage.ts';
import { SecurityPinManager } from './SecurityPinManager.tsx';
import { FirestoreService } from '../../services/firestoreService.ts';
import { firebaseConfig } from '../../lib/firebase.ts';
import { BillPrintSetupModal } from '../accounting/BillPrintSetupModal.tsx';

interface StoreSettingsManagerProps {
  settings: StoreSettings;
  onSettingsChange: () => void;
}

type ActiveSection = 'general' | 'firebase' | 'backup-restore' | 'security';

export const StoreSettingsManager: React.FC<StoreSettingsManagerProps> = ({
  settings,
  onSettingsChange
}) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('general');
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [showBillPrintSetup, setShowBillPrintSetup] = useState(false);

  // Firebase Cloud Sync states
  const [isPushingCloud, setIsPushingCloud] = useState(false);
  const [isPullingCloud, setIsPullingCloud] = useState(false);
  const [cloudStatusMsg, setCloudStatusMsg] = useState<string | null>(null);

  const handlePushToCloud = async () => {
    setIsPushingCloud(true);
    setCloudStatusMsg(null);
    try {
      const res = await FirestoreService.pushAllToCloud();
      setCloudStatusMsg(res.message);
      onSettingsChange();
    } catch (err: any) {
      setCloudStatusMsg(`Cloud Push Failed: ${err.message || String(err)}`);
    } finally {
      setIsPushingCloud(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsPullingCloud(true);
    setCloudStatusMsg(null);
    try {
      const res = await FirestoreService.pullAllFromCloud();
      setCloudStatusMsg(res.message);
      onSettingsChange();
    } catch (err: any) {
      setCloudStatusMsg(`Cloud Pull Failed: ${err.message || String(err)}`);
    } finally {
      setIsPullingCloud(false);
    }
  };

  // Backup & Restore states
  const [isExporting, setIsExporting] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [lastExportInfo, setLastExportInfo] = useState<{ filename: string; sizeKb: number } | null>(null);

  // Restore states
  const [restoreInputText, setRestoreInputText] = useState('');
  const [parsedBackup, setParsedBackup] = useState<FullAppBackupData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [showRestoreSuccessModal, setShowRestoreSuccessModal] = useState(false);
  const [showFactoryResetConfirm, setShowFactoryResetConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live summary of current store data
  const currentSummary = {
    products: DataStorageService.getProducts().length,
    rateList: DataStorageService.getRateList().length,
    valuations: DataStorageService.getValuationRequests().length,
    repairBookings: DataStorageService.getRepairBookings().length,
    upcomingModels: DataStorageService.getUpcomingModels().length,
    preBookings: DataStorageService.getPreBookings().length,
  };

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    DataStorageService.saveStoreSettings(formData, true);
    onSettingsChange();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // 1. ONE-CLICK INSTANT DOWNLOAD BACKUP
  const handleOneClickDownloadBackup = () => {
    setIsExporting(true);
    try {
      const result = DataStorageService.downloadBackupFile();
      setLastExportInfo({
        filename: result.filename,
        sizeKb: result.sizeKb
      });
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setTimeout(() => setIsExporting(false), 600);
    }
  };

  // 2. ONE-CLICK COPY BACKUP TO CLIPBOARD
  const handleCopyBackupToClipboard = async () => {
    const success = await DataStorageService.copyBackupToClipboard();
    if (success) {
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2500);
    }
  };

  // 3. HANDLE FILE UPLOAD FOR RESTORE
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRestoreInputText(content);
      validateContent(content);
    };
    reader.readAsText(file);
    // Reset file input value so same file can be selected again if needed
    e.target.value = '';
  };

  // Validate text content
  const validateContent = (text: string) => {
    setValidationError(null);
    setRestoreResult(null);

    if (!text.trim()) {
      setParsedBackup(null);
      return;
    }

    const valResult = DataStorageService.validateBackupPayload(text);
    if (valResult.valid && valResult.backup) {
      setParsedBackup(valResult.backup);
      setValidationError(null);
    } else {
      setParsedBackup(null);
      setValidationError(valResult.error || 'Invalid backup structure.');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRestoreInputText(text);
    validateContent(text);
  };

  // 4. ONE-CLICK RESTORE EXECUTION
  const handleExecuteRestore = () => {
    if (!parsedBackup) return;

    const confirmMsg = restoreMode === 'replace'
      ? 'Are you sure you want to perform a FULL RESTORE? This will overwrite all existing store products, prices, valuations, bookings, and settings with the backup file data.'
      : 'Merge backup data with your current store data? Any new items will be added without overwriting matching IDs.';

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsRestoring(true);
    try {
      const res = DataStorageService.restoreAllData(parsedBackup, restoreMode);
      setRestoreResult(res);
      setShowRestoreSuccessModal(true);
      setFormData(DataStorageService.getStoreSettings());
      onSettingsChange();
      setParsedBackup(null);
      setRestoreInputText('');
    } catch (err: any) {
      setValidationError(`Restore failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // 5. FACTORY RESET
  const handleFactoryReset = () => {
    if (!window.confirm('⚠️ WARNING: This will reset ALL products, rates, valuations, repair bookings, and settings to the original default seed data. Proceed?')) {
      return;
    }
    DataStorageService.resetAllDataToFactoryDefaults();
    setFormData(DataStorageService.getStoreSettings());
    onSettingsChange();
    setShowFactoryResetConfirm(false);
    alert('✅ Pandey Mobile Store data has been reset to factory defaults.');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Section Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <span>Web Settings & Data Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage store profile, contact details, and one-click data backup & recovery.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl shrink-0 self-start sm:self-auto border border-slate-200/80">
          <button
            onClick={() => setActiveSection('general')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeSection === 'general'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Store Profile & Info</span>
          </button>
          <button
            onClick={() => setActiveSection('firebase')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeSection === 'firebase'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Firebase Cloud DB</span>
          </button>
          <button
            onClick={() => setActiveSection('backup-restore')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeSection === 'backup-restore'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>One-Click Backup & Restore</span>
          </button>
          <button
            onClick={() => setActiveSection('security')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeSection === 'security'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Admin PIN & Security</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: GENERAL STORE PROFILE & CONTACT SETTINGS */}
      {/* ========================================================================= */}
      {activeSection === 'general' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Store Identity & Contact Details</span>
              </h3>
              <p className="text-xs text-slate-500">Physical address, hotline numbers, WhatsApp, and announcement notice</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowBillPrintSetup(true)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                title="बिल प्रिन्ट तथा कागज साइज (A4, A5, POS 80mm, POS 58mm, Custom mm)"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                <span>कागज साइज / बिल प्रिन्ट (Print Setup)</span>
              </button>

              {saved && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center space-x-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>Settings Saved!</span>
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleGeneralSubmit} className="space-y-5">
            
            {/* Store Name & Tagline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Store Legal Name
                </label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  placeholder="Pandey Mobile Store"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tagline / Sub-Heading
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  placeholder="Sales • Exchange • Express Repair • Butwal"
                />
              </div>
            </div>

            {/* Address & City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Street Location</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  placeholder="Traffic Chowk, Main Highway"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City & Province
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  placeholder="Butwal, Rupandehi, Nepal"
                  required
                />
              </div>
            </div>

            {/* Phone numbers & WhatsApp */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Primary Hotline</span>
                </label>
                <input
                  type="text"
                  value={formData.phone1}
                  onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  placeholder="9857039401"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Secondary Phone
                </label>
                <input
                  type="text"
                  value={formData.phone2}
                  onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  placeholder="9806939401"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-emerald-700">
                  WhatsApp Direct Number (With Country Code)
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-950 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  placeholder="9779857039401"
                  required
                />
              </div>
            </div>

            {/* Technician Direct Contact & Repair Lab */}
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Lab Technician Direct Contact & Helpline</h4>
                    <p className="text-[11px] text-slate-500">Default technician assigned to repairs & displayed on visitor live tracking receipts</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                  Technician Roster
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Technician / Lab Head Name
                  </label>
                  <input
                    type="text"
                    value={formData.technicianName || ''}
                    onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                    placeholder="e.g. Er. Ramesh Pandey (Chief Lab Specialist)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-amber-600" />
                      <span>Technician Direct Phone Number *</span>
                    </span>
                    {formData.technicianPhone && (
                      <span className="text-[10px] text-emerald-700 font-bold">Active in Live Tracker</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.technicianPhone || ''}
                    onChange={(e) => setFormData({ ...formData, technicianPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-amber-950 focus:border-amber-500 focus:outline-hidden"
                    placeholder="e.g. 9847460603 / 9804477123"
                  />
                </div>
              </div>
            </div>

            {/* Store Email & Opening Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Store Contact Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  placeholder="pandeymobile@gmail.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Business Hours</span>
                </label>
                <input
                  type="text"
                  value={formData.openingHours}
                  onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  placeholder="Sunday – Friday: 9:00 AM – 8:00 PM (Saturday Open)"
                />
              </div>
            </div>

            {/* Google Maps Embed Link */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Google Maps Direction URL</span>
              </label>
              <input
                type="text"
                value={formData.googleMapsUrl}
                onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                placeholder="https://maps.google.com/?q=Traffic+Chowk+Butwal"
              />
            </div>

            {/* Announcement Banner */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Top Header Announcement Strip</span>
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showBannerNotice}
                    onChange={(e) => setFormData({ ...formData, showBannerNotice: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-2 text-xs font-medium text-slate-600">
                    {formData.showBannerNotice ? 'Active on Storefront' : 'Hidden'}
                  </span>
                </label>
              </div>
              <textarea
                rows={2}
                value={formData.bannerNotice || ''}
                onChange={(e) => setFormData({ ...formData, bannerNotice: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                placeholder="Namaste! Official Nepal authorized iPhone & Android smartphones available with full store warranty at Traffic Chowk, Butwal."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save All Web Settings</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: FIREBASE CLOUD DATABASE (FIRESTORE) */}
      {/* ========================================================================= */}
      {activeSection === 'firebase' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800/60 inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Firebase Firestore Cloud Database
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-emerald-400" />
                  Google Firebase Cloud Synchronization
                </h3>
                <p className="text-xs text-slate-300 max-w-xl">
                  Your store is securely connected to Google Firebase Cloud Firestore. All product catalogs, valuations, service bookings, and settings sync across devices in real time.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePushToCloud}
                  disabled={isPushingCloud || isPullingCloud}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className={`w-4 h-4 ${isPushingCloud ? 'animate-bounce' : ''}`} />
                  <span>{isPushingCloud ? 'Pushing to Cloud...' : 'Push All Data to Cloud'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePullFromCloud}
                  disabled={isPushingCloud || isPullingCloud}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <DownloadCloud className={`w-4 h-4 ${isPullingCloud ? 'animate-bounce' : ''}`} />
                  <span>{isPullingCloud ? 'Pulling from Cloud...' : 'Pull Data from Cloud'}</span>
                </button>
              </div>
            </div>

            {/* Status Alert Banner */}
            {cloudStatusMsg && (
              <div className="mt-4 p-3 bg-emerald-900/60 border border-emerald-500/50 rounded-xl text-xs font-semibold text-emerald-200 flex items-center justify-between">
                <span>{cloudStatusMsg}</span>
                <button
                  type="button"
                  onClick={() => setCloudStatusMsg(null)}
                  className="text-emerald-400 hover:text-white font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Project Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 mt-2">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Storage Engine</span>
                <p className="text-xs font-mono font-bold text-emerald-400 truncate mt-1">
                  {firebaseConfig.projectId || 'Local Storage (Unlocked)'}
                </p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Persistence</span>
                <p className="text-xs font-mono font-bold text-white truncate mt-1">
                  Live Cloud Memory / Direct
                </p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Database Mode</span>
                <p className="text-xs font-semibold text-emerald-400 truncate mt-1">
                  Live Real-Time Online
                </p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status</span>
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Online & Connected
                </p>
              </div>
            </div>
          </div>

          {/* Sync Information & Collections Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-600" />
                Automatic Real-time Sync
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                When products, rates, valuations, repair bookings, or reviews are submitted on your store, they are instantly synchronized directly with Google Firebase Firestore in real-time.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li><strong className="text-slate-800">Fresh on refresh:</strong> No stale offline cache; browsers load live cloud data immediately.</li>
                <li><strong className="text-slate-800">Multi-device sync:</strong> Changes on admin devices update client screens in real-time.</li>
                <li><strong className="text-slate-800">Direct connection:</strong> Memory-based caching ensures the latest inventory is always served.</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                Cloud Collections Monitored
              </h4>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-1.5 flex justify-between">
                  <span className="font-mono text-slate-700">products</span>
                  <span className="font-semibold text-slate-900">{DataStorageService.getProducts().length} items</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="font-mono text-slate-700">valuations</span>
                  <span className="font-semibold text-slate-900">{DataStorageService.getValuations().length} requests</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="font-mono text-slate-700">repairs</span>
                  <span className="font-semibold text-slate-900">{DataStorageService.getRepairBookings().length} appointments</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="font-mono text-slate-700">preBookings</span>
                  <span className="font-semibold text-slate-900">{DataStorageService.getPreBookings().length} pre-orders</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="font-mono text-slate-700">storeSettings</span>
                  <span className="font-semibold text-emerald-600">Synced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: ONE-CLICK ALL BACKUP & ONE-CLICK ALL RESTORE */}
      {/* ========================================================================= */}
      {activeSection === 'backup-restore' && (
        <div className="space-y-6">
          
          {/* Current Live Database Snapshot Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-md border border-indigo-800/60 inline-flex items-center gap-1.5">
                  <Database className="w-3 h-3" />
                  Live Store Storage Engine
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  One-Click Full Database Backup & Disaster Recovery
                </h3>
                <p className="text-xs text-slate-400 max-w-xl">
                  Safely download an encrypted snapshot of every product, rate card, customer valuation, repair booking, upcoming release, and store preference with a single click.
                </p>
              </div>

              {/* Action Buttons: 1-Click Download & Copy */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  onClick={handleOneClickDownloadBackup}
                  disabled={isExporting}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
                  <span>{isExporting ? 'Generating...' : 'One-Click All Backup (JSON)'}</span>
                </button>

                <button
                  onClick={handleCopyBackupToClipboard}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-2 transition-colors cursor-pointer"
                  title="Copy formatted JSON to clipboard"
                >
                  {copiedBackup ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Data Counts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-5 text-center">
              <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3">
                <span className="text-2xl font-black text-white block">{currentSummary.products}</span>
                <span className="text-[11px] font-semibold text-slate-400">Products</span>
              </div>
              <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3">
                <span className="text-2xl font-black text-indigo-400 block">{currentSummary.rateList}</span>
                <span className="text-[11px] font-semibold text-slate-400">Rate Sheet Items</span>
              </div>
              <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3">
                <span className="text-2xl font-black text-amber-400 block">{currentSummary.valuations}</span>
                <span className="text-[11px] font-semibold text-slate-400">Valuation Requests</span>
              </div>
              <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3">
                <span className="text-2xl font-black text-emerald-400 block">{currentSummary.repairBookings}</span>
                <span className="text-[11px] font-semibold text-slate-400">Repair Bookings</span>
              </div>
              <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3">
                <span className="text-2xl font-black text-purple-400 block">{currentSummary.upcomingModels}</span>
                <span className="text-[11px] font-semibold text-slate-400">Upcoming Models</span>
              </div>
              <div className="bg-slate-800/60 border border-slate-800 rounded-xl p-3">
                <span className="text-2xl font-black text-sky-400 block">{currentSummary.preBookings}</span>
                <span className="text-[11px] font-semibold text-slate-400">Pre-Bookings</span>
              </div>
            </div>

            {lastExportInfo && (
              <div className="mt-4 p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-xl flex items-center justify-between text-xs text-indigo-200">
                <div className="flex items-center space-x-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">Downloaded: <strong>{lastExportInfo.filename}</strong> ({lastExportInfo.sizeKb} KB)</span>
                </div>
                <span className="text-[10px] text-indigo-300 shrink-0">Saved to your device</span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* RESTORE CENTER */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>One-Click All Data Restore</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select a backup JSON file or paste JSON code to restore your store.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-semibold text-slate-600 text-[11px]">Restore Strategy:</span>
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
                  <button
                    type="button"
                    onClick={() => setRestoreMode('replace')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                      restoreMode === 'replace'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Full Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestoreMode('merge')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                      restoreMode === 'merge'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Smart Merge
                  </button>
                </div>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,application/json"
              className="hidden"
            />

            {/* File Upload Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-2 group"
            >
              <div className="w-12 h-12 bg-white rounded-full shadow-xs border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800">
                  Click to Browse or Drag & Drop Backup (.JSON) File
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supports all standard Pandey Mobile Store backup files
                </p>
              </div>
              <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs">
                Select .json File
              </span>
            </div>

            {/* Alternative: Direct JSON Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Or Paste JSON Content Directly:</span>
                </label>
                {restoreInputText && (
                  <button
                    type="button"
                    onClick={() => {
                      setRestoreInputText('');
                      setParsedBackup(null);
                      setValidationError(null);
                    }}
                    className="text-[11px] text-slate-500 hover:text-red-600 underline cursor-pointer"
                  >
                    Clear Input
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                value={restoreInputText}
                onChange={handleTextChange}
                placeholder="Paste backup JSON code here to preview and restore..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Error Message */}
            {validationError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Validation Failed</span>
                  <span>{validationError}</span>
                </div>
              </div>
            )}

            {/* Validated Backup Preview Card */}
            {parsedBackup && (
              <div className="p-5 bg-emerald-50/70 border border-emerald-300 rounded-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950">
                        Valid Backup Detected ({parsedBackup.version})
                      </h4>
                      <p className="text-[11px] text-emerald-700">
                        Exported on: {new Date(parsedBackup.exportedAt).toLocaleString()} • {parsedBackup.appName}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-full shadow-2xs">
                    Ready to Restore
                  </span>
                </div>

                {/* Breakdown of items to be restored */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
                  <div className="bg-white/80 border border-emerald-200 rounded-xl p-2.5">
                    <span className="font-black text-slate-900 block text-base">{parsedBackup.summary.productsCount}</span>
                    <span className="text-[10px] text-slate-600 font-semibold">Products</span>
                  </div>
                  <div className="bg-white/80 border border-emerald-200 rounded-xl p-2.5">
                    <span className="font-black text-slate-900 block text-base">{parsedBackup.summary.rateListCount}</span>
                    <span className="text-[10px] text-slate-600 font-semibold">Rate Sheet Items</span>
                  </div>
                  <div className="bg-white/80 border border-emerald-200 rounded-xl p-2.5">
                    <span className="font-black text-slate-900 block text-base">{parsedBackup.summary.valuationsCount}</span>
                    <span className="text-[10px] text-slate-600 font-semibold">Valuations</span>
                  </div>
                  <div className="bg-white/80 border border-emerald-200 rounded-xl p-2.5">
                    <span className="font-black text-slate-900 block text-base">{parsedBackup.summary.repairBookingsCount}</span>
                    <span className="text-[10px] text-slate-600 font-semibold">Repairs</span>
                  </div>
                  <div className="bg-white/80 border border-emerald-200 rounded-xl p-2.5">
                    <span className="font-black text-slate-900 block text-base">{parsedBackup.summary.upcomingModelsCount}</span>
                    <span className="text-[10px] text-slate-600 font-semibold">Upcoming</span>
                  </div>
                  <div className="bg-white/80 border border-emerald-200 rounded-xl p-2.5">
                    <span className="font-black text-slate-900 block text-base">{parsedBackup.summary.preBookingsCount}</span>
                    <span className="text-[10px] text-slate-600 font-semibold">Pre-Bookings</span>
                  </div>
                </div>

                {/* Final Restore Trigger */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-emerald-200">
                  <div className="text-[11px] text-emerald-800">
                    Mode:{' '}
                    <strong>
                      {restoreMode === 'replace'
                        ? 'Full Overwrite (Clean replacement of all data)'
                        : 'Smart Merge (Preserve existing & append new)'}
                    </strong>
                  </div>
                  <button
                    onClick={handleExecuteRestore}
                    disabled={isRestoring}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-transform active:scale-95"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                    <span>{isRestoring ? 'Restoring Store...' : 'Confirm & Restore All Data Now'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Successful Restore Banner */}
            {restoreResult && (
              <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-2xl text-xs text-emerald-950 space-y-2 animate-in zoom-in-95">
                <div className="flex items-center space-x-2 font-bold text-sm text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{restoreResult.message}</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Applied {restoreResult.stats.products} products, {restoreResult.stats.rateList} price rates, {restoreResult.stats.valuations} valuation logs, {restoreResult.stats.repairBookings} repair tickets, {restoreResult.stats.upcomingModels} upcoming flagships, and {restoreResult.stats.preBookings} pre-booking leads.
                </p>
              </div>
            )}

          </div>

          {/* ========================================================================= */}
          {/* DANGER ZONE & CATALOG CLEANUP */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            {/* Clean Demo Products */}
            <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
                  <Trash2 className="w-4 h-4 text-amber-600" />
                  <span>डेमो / नक्कली उत्पादन हटाउनुहोस् (Remove Fake / Demo Products)</span>
                </h4>
                <p className="text-[11px] text-amber-800 max-w-xl">
                  क्याटलगबाट स्वतः थपिएका पुराना / Pre-Owned फोनहरू र डेमो डेटा एकै क्लिकमा हटाउँछ। तपाईँले आफैँ प्रविष्ट गरेका फोनहरू सुरक्षित रहनेछन्।
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('के तपाई सबै डेमो / Pre-Owned फोनहरू हटाउन चाहनुहुन्छ?')) {
                    DataStorageService.removePreOwnedProducts();
                    onSettingsChange();
                    alert('✅ सबै डेमो / Pre-Owned फोनहरू क्याटलगबाट हटाइयो!');
                  }
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0"
              >
                डेमो हटाउनुहोस्
              </button>
            </div>

            {/* Clear All Products to start fresh */}
            <div className="bg-rose-50/70 rounded-2xl border border-rose-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-rose-950 flex items-center space-x-1.5">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>खाली क्याटलग सुरु गर्नुहोस् (Wipe All Products & Start Empty)</span>
                </h4>
                <p className="text-[11px] text-rose-800 max-w-xl">
                  सबै उत्पादनहरू हटाएर पूरै खाली क्याटलग बनाउँछ। डेमो उत्पादनहरू फेरि स्वतः आउने छैनन्।
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('चेतावनी: के तपाई साँच्चै सबै उत्पादनहरू हटाएर क्याटलग शून्य बनाउन चाहनुहुन्छ?')) {
                    DataStorageService.clearAllProducts();
                    onSettingsChange();
                    alert('✅ क्याटलग पूरै खाली गरियो! अब तपाईँ आफ्ना नयाँ फोनहरू मात्र थप्न सक्नुहुन्छ।');
                  }
                }}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0"
              >
                सबै उत्पादन हटाउनुहोस्
              </button>
            </div>

            {/* Factory Reset */}
            <div className="bg-slate-100 rounded-2xl border border-slate-300 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                  <span>Reset to Factory Defaults</span>
                </h4>
                <p className="text-[11px] text-slate-600 max-w-xl">
                  Replaces all current database contents with original factory default catalogs, official Apple lineup, and standard Butwal store settings.
                </p>
              </div>

              <button
                type="button"
                onClick={handleFactoryReset}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0"
              >
                Reset to Defaults
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: ADMIN SECURITY & 4-DIGIT PIN RESET */}
      {/* ========================================================================= */}
      {activeSection === 'security' && (
        <SecurityPinManager onPinChanged={onSettingsChange} />
      )}

      {/* ========================================================================= */}
      {/* DATA RESTORE COMPLETE MESSAGE POPUP MODAL */}
      {/* ========================================================================= */}
      {showRestoreSuccessModal && restoreResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowRestoreSuccessModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setShowRestoreSuccessModal(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-inner">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200 bg-emerald-900/40 px-2 py-0.5 rounded-md border border-emerald-400/30">
                    Database Restored
                  </span>
                  <h3 className="text-xl font-black text-white tracking-tight mt-0.5">
                    Data Restore Complete!
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Pandey Mobile Store database is refreshed & active.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Summary message & Mode pill */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Applied Strategy</span>
                  <span className="font-bold text-slate-800">
                    {restoreResult.mode === 'replace' ? 'Full Overwrite (Clean Replace)' : 'Smart Merge with Existing'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[11px] block">Restored Time</span>
                  <span className="font-medium text-slate-700 font-mono text-[11px]">
                    {new Date(restoreResult.restoredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Restored Datasets Breakdown:
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 text-center">
                    <span className="text-2xl font-black text-emerald-700 block">
                      {restoreResult.stats.products}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-1 mt-0.5">
                      <Smartphone className="w-3 h-3 text-emerald-600" />
                      Products
                    </span>
                  </div>

                  <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-3 text-center">
                    <span className="text-2xl font-black text-indigo-700 block">
                      {restoreResult.stats.rateList}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-1 mt-0.5">
                      <Tag className="w-3 h-3 text-indigo-600" />
                      Rate List Items
                    </span>
                  </div>

                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 text-center">
                    <span className="text-2xl font-black text-amber-700 block">
                      {restoreResult.stats.valuations}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-1 mt-0.5">
                      <RotateCcw className="w-3 h-3 text-amber-600" />
                      Valuations
                    </span>
                  </div>

                  <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-3 text-center">
                    <span className="text-2xl font-black text-teal-700 block">
                      {restoreResult.stats.repairBookings}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-1 mt-0.5">
                      <Wrench className="w-3 h-3 text-teal-600" />
                      Repair Tickets
                    </span>
                  </div>

                  <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-3 text-center">
                    <span className="text-2xl font-black text-purple-700 block">
                      {restoreResult.stats.upcomingModels}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-1 mt-0.5">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      Upcoming Models
                    </span>
                  </div>

                  <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-3 text-center">
                    <span className="text-2xl font-black text-sky-700 block">
                      {restoreResult.stats.preBookings}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-1 mt-0.5">
                      <FileText className="w-3 h-3 text-sky-600" />
                      Pre-Bookings
                    </span>
                  </div>
                </div>
              </div>

              {/* Status footer notice */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/90 text-xs text-emerald-900 flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All storefront catalogs, prices, and settings have been refreshed across the website.</span>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowRestoreSuccessModal(false)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Done & Continue</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Bill Print Setup Modal (कागज साइज तथा बिल प्रिन्ट सेटअप) */}
      <BillPrintSetupModal
        isOpen={showBillPrintSetup}
        onClose={() => setShowBillPrintSetup(false)}
      />

    </div>
  );
};
