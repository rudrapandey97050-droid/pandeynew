import React, { useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Eye,
  Download,
  Sparkles,
  RefreshCw,
  Sliders,
  Smartphone,
  Save
} from 'lucide-react';
import { StorePaymentQR, PaymentQRProvider, StoreSettings } from '../../types.ts';
import { DataStorageService } from '../../services/dataStorage.ts';
import { initialPaymentQRs } from '../../data/initialPaymentQRs.ts';
import { PaymentQRModal } from '../PaymentQRModal.tsx';

interface QRPaymentsManagerProps {
  storeSettings: StoreSettings;
  onSettingsChange: () => void;
}

export const QRPaymentsManager: React.FC<QRPaymentsManagerProps> = ({
  storeSettings,
  onSettingsChange
}) => {
  const [qrs, setQrs] = useState<StorePaymentQR[]>(() => {
    return storeSettings.paymentQRs && storeSettings.paymentQRs.length > 0
      ? storeSettings.paymentQRs
      : DataStorageService.getPaymentQRs();
  });

  const [showFooterQRs, setShowFooterQRs] = useState<boolean>(
    storeSettings.showPaymentQRsInFooter !== false
  );
  const [showContactQRs, setShowContactQRs] = useState<boolean>(
    storeSettings.showPaymentQRsInContact !== false
  );
  const [qrHeading, setQrHeading] = useState<string>(
    storeSettings.qrPaymentHeading || 'डिजिटल भुक्तानी (Scan & Pay)'
  );
  const [qrSubheading, setQrSubheading] = useState<string>(
    storeSettings.qrPaymentSubheading ||
      'FonePay, eSewa, Khalti तथा नेपालका सबै मोबाइल बैंकिङ्गबाट सुरक्षित भुक्तानी गर्नुहोस्'
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQR, setEditingQR] = useState<StorePaymentQR | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState<PaymentQRProvider>('fonepay');
  const [accountName, setAccountName] = useState('PANDEY MOBILE STORE');
  const [accountNumber, setAccountNumber] = useState('9847460603');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [instructions, setInstructions] = useState(
    'नेपालका कुनै पनि बैंकको मोबाइल बैंकिङ्ग वा FonePay एपबाट स्क्यान गरी भुक्तानी गर्नुहोस्।'
  );
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPrimary, setIsPrimary] = useState(false);
  const [showInFooter, setShowInFooter] = useState(true);
  const [showInContact, setShowInContact] = useState(true);

  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Sync state if external storeSettings updates
  React.useEffect(() => {
    if (storeSettings.paymentQRs && storeSettings.paymentQRs.length > 0) {
      setQrs(storeSettings.paymentQRs);
    }
    setShowFooterQRs(storeSettings.showPaymentQRsInFooter !== false);
    setShowContactQRs(storeSettings.showPaymentQRsInContact !== false);
    if (storeSettings.qrPaymentHeading) setQrHeading(storeSettings.qrPaymentHeading);
    if (storeSettings.qrPaymentSubheading) setQrSubheading(storeSettings.qrPaymentSubheading);
  }, [storeSettings]);

  // Save global store settings toggles
  const handleSaveGlobalSettings = () => {
    const updatedSettings: StoreSettings = {
      ...storeSettings,
      paymentQRs: qrs,
      showPaymentQRsInFooter: showFooterQRs,
      showPaymentQRsInContact: showContactQRs,
      qrPaymentHeading: qrHeading,
      qrPaymentSubheading: qrSubheading
    };
    DataStorageService.saveStoreSettings(updatedSettings, true);
    onSettingsChange();
    showToast('Storefront QR settings saved successfully!');
  };

  // Reset / Open Add QR
  const handleOpenAdd = () => {
    setEditingQR(null);
    setTitle('FonePay / All Bank QR');
    setProvider('fonepay');
    setAccountName('PANDEY MOBILE STORE');
    setAccountNumber('9847460603');
    setBankName('FonePay Merchant Network');
    setBranchName('Traffic Chowk, Butwal');
    setInstructions('मोबाइल बैंकिङ्ग वा FonePay एपबाट स्क्यान गरी सिधै भुक्तानी गर्नुहोस्। Remarks मा नाम लेख्नुहोला।');
    setQrImageUrl(initialPaymentQRs[0]?.qrImageUrl || '');
    setIsActive(true);
    setIsPrimary(false);
    setShowInFooter(true);
    setShowInContact(true);
    setUploadError(null);
    setIsEditModalOpen(true);
  };

  // Open Edit QR
  const handleOpenEdit = (item: StorePaymentQR) => {
    setEditingQR(item);
    setTitle(item.title);
    setProvider(item.provider);
    setAccountName(item.accountName);
    setAccountNumber(item.accountNumber || '');
    setBankName(item.bankName || '');
    setBranchName(item.branchName || '');
    setInstructions(item.instructions || '');
    setQrImageUrl(item.qrImageUrl);
    setIsActive(item.isActive);
    setIsPrimary(Boolean(item.isPrimary));
    setShowInFooter(item.showInFooter !== false);
    setShowInContact(item.showInContact !== false);
    setUploadError(null);
    setIsEditModalOpen(true);
  };

  // Handle Provider preset changes
  const handleProviderChange = (newProvider: PaymentQRProvider) => {
    setProvider(newProvider);
    if (newProvider === 'fonepay') {
      setTitle('FonePay / All Bank QR');
      setBankName('FonePay Merchant Network');
      setInstructions('कुनै पनि बैंकको मोबाइल बैंकिङ्ग वा FonePay एपबाट स्क्यान गरी भुक्तानी गर्नुहोस्।');
    } else if (newProvider === 'esewa') {
      setTitle('eSewa Direct Payment QR');
      setBankName('eSewa Nepal');
      setInstructions('eSewa एप खोलेर यो क्यूआर स्क्यान गर्नुहोस् वा सिधै ९८४७४६०६०३ मा eSewa गर्नुहोस्।');
    } else if (newProvider === 'khalti') {
      setTitle('Khalti Digital Wallet QR');
      setBankName('Khalti Nepal');
      setInstructions('Khalti एपबाट स्क्यान गरी तुरुन्तै बिल भुक्तानी गर्न सक्नुहुन्छ।');
    } else if (newProvider === 'bank') {
      setTitle('Nabil Bank Direct Account QR');
      setBankName('Nabil Bank Ltd.');
      setBranchName('Traffic Chowk, Butwal');
      setInstructions('मोबाइल बैंकिङ्ग वा ConnectIPS मार्फत रकम ट्रान्सफर गरी स्क्रिनसट सुरक्षित राख्नुहोस्।');
    } else {
      setTitle('Store Payment QR');
      setBankName('');
      setInstructions('स्क्यान गरी भुक्तानी गर्नुहोस्।');
    }
  };

  // Process image file upload with canvas optimization
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('कृपया फोटो (PNG, JPG, WEBP) मात्र छान्नुहोस्।');
      return;
    }

    // Limit original file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('फोटोको साइज 10MB भन्दा कम हुनुपर्छ।');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize and resize to max 800px width/height
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL('image/png', 0.9);
          setQrImageUrl(compressedDataUrl);
        } else {
          setQrImageUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setUploadError('फोटो लोड गर्दा समस्या भयो।');
    };
    reader.readAsDataURL(file);
  };

  // Generate instant QR Code data URL using qrcode package
  const handleGenerateSampleQR = async () => {
    setIsGeneratingQR(true);
    try {
      let payload = '';
      if (provider === 'fonepay') {
        payload = `fonepay://pay?merchant=${encodeURIComponent(accountName)}&mobile=${accountNumber}&branch=Butwal`;
      } else if (provider === 'esewa') {
        payload = `esewa://pay?account=${accountNumber}&name=${encodeURIComponent(accountName)}`;
      } else if (provider === 'khalti') {
        payload = `khalti://pay?phone=${accountNumber}&merchant=${encodeURIComponent(accountName)}`;
      } else {
        payload = `bank://transfer?bank=${encodeURIComponent(bankName || 'Bank')}&account=${accountNumber}&name=${encodeURIComponent(accountName)}`;
      }
      const dataUrl = await QRCode.toDataURL(payload, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrImageUrl(dataUrl);
      showToast('QR Code generated successfully!');
    } catch (err: any) {
      setUploadError('QR Code बनाउन सकिएन: ' + (err.message || 'Unknown error'));
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Save QR (Create or Update)
  const handleSaveQR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setUploadError('कृपया QR को शीर्षक (Title) लेख्नुहोस्।');
      return;
    }
    if (!accountName.trim()) {
      setUploadError('कृपया खातावाला / पसलको नाम (Account Name) लेख्नुहोस्।');
      return;
    }
    if (!qrImageUrl) {
      setUploadError('कृपया QR Code को फोटो अपलोड गर्नुहोस् वा Generate बटन थिच्नुहोस्।');
      return;
    }

    if (editingQR) {
      // Update
      const updated = DataStorageService.updatePaymentQR(editingQR.id, {
        title: title.trim(),
        provider,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        bankName: bankName.trim(),
        branchName: branchName.trim(),
        instructions: instructions.trim(),
        qrImageUrl,
        isActive,
        isPrimary,
        showInFooter,
        showInContact
      });
      if (updated) {
        setQrs(DataStorageService.getPaymentQRs());
        onSettingsChange();
        setIsEditModalOpen(false);
        showToast('Payment QR updated successfully!');
      }
    } else {
      // Add
      DataStorageService.addPaymentQR({
        title: title.trim(),
        provider,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        bankName: bankName.trim(),
        branchName: branchName.trim(),
        instructions: instructions.trim(),
        qrImageUrl,
        isActive,
        isPrimary,
        showInFooter,
        showInContact,
        displayOrder: qrs.length + 1
      });
      setQrs(DataStorageService.getPaymentQRs());
      onSettingsChange();
      setIsEditModalOpen(false);
      showToast('New Payment QR added successfully!');
    }
  };

  // Toggle active directly from card
  const handleToggleActive = (id: string, currentVal: boolean) => {
    DataStorageService.updatePaymentQR(id, { isActive: !currentVal });
    setQrs(DataStorageService.getPaymentQRs());
    onSettingsChange();
    showToast(`QR ${!currentVal ? 'activated' : 'deactivated'}`);
  };

  // Delete QR
  const handleDelete = (id: string, qrTitle: string) => {
    if (window.confirm(`के तपाईं "${qrTitle}" QR कोड हटाउन चाहनुहुन्छ?`)) {
      DataStorageService.deletePaymentQR(id);
      setQrs(DataStorageService.getPaymentQRs());
      onSettingsChange();
      showToast('QR Code deleted.');
    }
  };

  // Reset to default presets
  const handleResetDefaults = () => {
    if (window.confirm('के तपाईं सबै भुक्तानी क्यूआरलाई सुरुको डिफल्ट (FonePay, eSewa, Khalti, Nabil Bank) मा रिसेट गर्न चाहनुहुन्छ?')) {
      DataStorageService.savePaymentQRs(initialPaymentQRs, true);
      setQrs(initialPaymentQRs);
      onSettingsChange();
      showToast('Reset to default Nepal payment QRs.');
    }
  };

  const getProviderBadge = (prov: string) => {
    switch (prov) {
      case 'fonepay':
        return { label: 'FonePay', color: 'bg-rose-600 text-white' };
      case 'esewa':
        return { label: 'eSewa', color: 'bg-emerald-600 text-white' };
      case 'khalti':
        return { label: 'Khalti', color: 'bg-purple-600 text-white' };
      case 'bank':
        return { label: 'Bank QR', color: 'bg-blue-600 text-white' };
      default:
        return { label: 'Payment QR', color: 'bg-slate-700 text-white' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-slate-700 animate-fadeIn text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <QrCode className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Store QR Payments (डिजिटल भुक्तानी क्यूआर)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {qrs.filter(q => q.isActive).length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Upload and manage your store payment QR codes (eSewa, FonePay, Khalti, Mobile Banking) to show them in the storefront footer and contact section. Customers can scan and pay seamlessly.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setPreviewModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Preview customer scan popup"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>Storefront Preview</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Payment QR</span>
          </button>
        </div>
      </div>

      {/* Global Storefront Display Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Storefront Display Controls (वेबसाइटमा देखाउने सेटिङ)
            </h3>
          </div>
          <button
            type="button"
            onClick={handleSaveGlobalSettings}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
            <input
              type="checkbox"
              checked={showFooterQRs}
              onChange={(e) => setShowFooterQRs(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Show Payment QR Section in Website Footer (फुटरमा देखाउने)
              </span>
              <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                Displays active payment QR codes and "Scan to Pay" button in the storefront bottom footer.
              </span>
            </div>
          </label>

          <label className="flex items-start space-x-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
            <input
              type="checkbox"
              checked={showContactQRs}
              onChange={(e) => setShowContactQRs(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Show Payment QR Card in Store Location / Contact (सम्पर्क सेक्सनमा देखाउने)
              </span>
              <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                Displays a dedicated "Scan & Pay / अनलाइन भुक्तानी" card beside store hours and Google Maps.
              </span>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              QR Section Heading (शीर्षक)
            </label>
            <input
              type="text"
              value={qrHeading}
              onChange={(e) => setQrHeading(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              placeholder="e.g. डिजिटल भुक्तानी (Scan & Pay)"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              QR Section Subheading (उप-शीर्षक)
            </label>
            <input
              type="text"
              value={qrSubheading}
              onChange={(e) => setQrSubheading(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-700"
              placeholder="e.g. FonePay, eSewa, Khalti तथा नेपालका सबै मोबाइल बैंकिङ्गबाट भुक्तानी"
            />
          </div>
        </div>
      </div>

      {/* QR Codes Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span>Configured Store Payment QR Codes ({qrs.length})</span>
          </h3>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset to Nepal Defaults</span>
          </button>
        </div>

        {qrs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
            <QrCode className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">कुनै पनि QR कोड भेटिएन।</p>
            <p className="text-[11px] text-slate-500">
              eSewa, FonePay वा बैंक QR थप्न "+ Add Payment QR" बटन थिच्नुहोस्।
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Add First QR
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {qrs.map((qr) => {
              const badge = getProviderBadge(qr.provider);
              return (
                <div
                  key={qr.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between shadow-xs hover:shadow-md ${
                    qr.isActive ? 'border-slate-200' : 'border-slate-200/60 opacity-60 bg-slate-50/40'
                  }`}
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                        {qr.isPrimary && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            Primary
                          </span>
                        )}
                      </div>

                      {/* Active toggle button */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(qr.id, qr.isActive)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition ${
                          qr.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {qr.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    {/* QR Image and Info */}
                    <div className="flex items-start space-x-3">
                      <div
                        onClick={() => setPreviewModalOpen(true)}
                        className="w-24 h-24 rounded-xl border border-slate-200 bg-white p-1.5 shrink-0 shadow-2xs cursor-pointer hover:scale-105 transition"
                        title="Click to preview full QR"
                      >
                        <img
                          src={qr.qrImageUrl}
                          alt={qr.title}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {qr.title}
                        </h4>
                        <p className="text-[11px] font-semibold text-indigo-700 truncate">
                          {qr.accountName}
                        </p>
                        {qr.accountNumber && (
                          <p className="text-[11px] font-mono text-slate-600 truncate">
                            ID: {qr.accountNumber}
                          </p>
                        )}
                        {qr.bankName && (
                          <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{qr.bankName}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Display Badges */}
                    <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500">
                      {qr.showInFooter && (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          ✓ Footer
                        </span>
                      )}
                      {qr.showInContact && (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          ✓ Contact Section
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                    <a
                      href={qr.qrImageUrl}
                      download={`${qr.provider}-qr.png`}
                      className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 transition"
                      title="Download QR image"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(qr)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        title="Edit QR"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(qr.id, qr.title)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete QR"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit QR Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingQR ? 'Edit Payment QR (क्यूआर सम्पादन)' : 'Add New Payment QR (नयाँ क्यूआर थप्नुहोस्)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveQR} className="p-5 overflow-y-auto space-y-4">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Payment Provider / सेवा प्रदायक *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'fonepay', label: 'FonePay (All Bank)', color: 'hover:border-rose-500' },
                    { id: 'esewa', label: 'eSewa Wallet', color: 'hover:border-emerald-500' },
                    { id: 'khalti', label: 'Khalti Wallet', color: 'hover:border-purple-500' },
                    { id: 'bank', label: 'Bank Account', color: 'hover:border-blue-500' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProviderChange(p.id as PaymentQRProvider)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                        provider === p.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : `bg-slate-50 text-slate-700 border-slate-200 ${p.color}`
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Account Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Title / Display Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                    placeholder="e.g. FonePay / All Bank QR"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account / Merchant Holder Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                    placeholder="e.g. PANDEY MOBILE STORE"
                  />
                </div>
              </div>

              {/* Number / ID & Bank Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile / A/C / Merchant ID
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                    placeholder="e.g. 9847460603"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank / Network Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                    placeholder="e.g. FonePay Network or Nabil Bank Ltd."
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Instructions / Remarks Guide
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                  placeholder="e.g. Remarks मा आफ्नो नाम वा अर्डर नम्बर लेख्नुहोला।"
                />
              </div>

              {/* QR Image Upload & Preview */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  QR Code Image (फोटो अपलोड वा सिर्जना गर्नुहोस्) *
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Preview Box */}
                  <div className="w-28 h-28 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center p-2 shrink-0 relative group">
                    {qrImageUrl ? (
                      <img
                        src={qrImageUrl}
                        alt="QR Preview"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center text-slate-400 text-[10px]">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        <span>No image</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Upload QR Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateSampleQR}
                        disabled={isGeneratingQR}
                        className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{isGeneratingQR ? 'Generating...' : 'Generate from ID'}</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-500">
                      Supports PNG, JPG, WEBP. Upload the official QR downloaded from your eSewa/FonePay merchant app or physical standee photo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Active (सक्रिय QR)
                  </span>
                </label>

                <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Set as Primary (मुख्य QR)
                  </span>
                </label>

                <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInFooter}
                    onChange={(e) => setShowInFooter(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Show in Website Footer
                  </span>
                </label>

                <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInContact}
                    onChange={(e) => setShowInContact(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Show in Contact & Location
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  रद्द गर्नुहोस् (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingQR ? 'Update Payment QR' : 'Save New Payment QR'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Scan Simulation / Preview Modal */}
      <PaymentQRModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        paymentQRs={qrs}
        storeName={storeSettings.storeName}
      />
    </div>
  );
};
