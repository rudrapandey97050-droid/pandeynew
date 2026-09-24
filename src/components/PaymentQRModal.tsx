import React, { useState } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  Download,
  Building2,
  Phone,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Printer
} from 'lucide-react';
import { StorePaymentQR } from '../types.ts';

interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentQRs: StorePaymentQR[];
  initialProvider?: string;
  storeName?: string;
}

export const PaymentQRModal: React.FC<PaymentQRModalProps> = ({
  isOpen,
  onClose,
  paymentQRs = [],
  initialProvider,
  storeName = 'Pandey Mobile Store'
}) => {
  const activeQRs = (paymentQRs || []).filter(q => q && q.isActive);
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (initialProvider) {
      const match = activeQRs.find(q => q.provider === initialProvider);
      if (match) return match.id;
    }
    const primary = activeQRs.find(q => q.isPrimary);
    return primary ? primary.id : (activeQRs[0]?.id || '');
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync selectedId if activeQRs changes or initialProvider changes
  React.useEffect(() => {
    if (activeQRs.length > 0 && !activeQRs.some(q => q.id === selectedId)) {
      if (initialProvider) {
        const match = activeQRs.find(q => q.provider === initialProvider);
        if (match) {
          setSelectedId(match.id);
          return;
        }
      }
      const primary = activeQRs.find(q => q.isPrimary) || activeQRs[0];
      if (primary) setSelectedId(primary.id);
    }
  }, [activeQRs, initialProvider, selectedId]);

  if (!isOpen || activeQRs.length === 0) return null;

  const currentQR = activeQRs.find(q => q.id === selectedId) || activeQRs[0];

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownload = (qr: StorePaymentQR) => {
    const a = document.createElement('a');
    a.href = qr.qrImageUrl;
    a.download = `${qr.provider}-${qr.accountName || 'pms-qr'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${currentQR.title} - ${storeName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px; }
            .card { max-width: 400px; margin: 0 auto; border: 2px solid #000; border-radius: 20px; padding: 24px; }
            h2 { margin: 0 0 8px 0; color: #1e293b; }
            p { margin: 4px 0; color: #475569; font-size: 14px; }
            .qr-img { width: 280px; height: 280px; object-fit: contain; margin: 20px 0; }
            .badge { display: inline-block; padding: 4px 12px; background: #000; color: #fff; border-radius: 999px; font-size: 12px; font-weight: bold; margin-bottom: 12px; }
            .acc { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 10px; }
            .notice { font-size: 11px; color: #64748b; margin-top: 16px; border-top: 1px dashed #cbd5e1; pt: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">SCAN & PAY</span>
            <h2>${storeName}</h2>
            <p>Traffic Chowk, Main Road, Butwal, Nepal</p>
            <img src="${currentQR.qrImageUrl}" class="qr-img" alt="QR Code" />
            <div class="acc">${currentQR.accountName}</div>
            ${currentQR.accountNumber ? `<p><strong>ID / A/C:</strong> ${currentQR.accountNumber}</p>` : ''}
            ${currentQR.bankName ? `<p><strong>Bank:</strong> ${currentQR.bankName}</p>` : ''}
            ${currentQR.instructions ? `<p class="notice">${currentQR.instructions}</p>` : ''}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'fonepay':
        return {
          bg: 'bg-rose-600',
          text: 'text-rose-600',
          border: 'border-rose-500',
          lightBg: 'bg-rose-50',
          label: 'FonePay (All Banks)'
        };
      case 'esewa':
        return {
          bg: 'bg-emerald-600',
          text: 'text-emerald-600',
          border: 'border-emerald-500',
          lightBg: 'bg-emerald-50',
          label: 'eSewa Wallet'
        };
      case 'khalti':
        return {
          bg: 'bg-purple-600',
          text: 'text-purple-600',
          border: 'border-purple-500',
          lightBg: 'bg-purple-50',
          label: 'Khalti Wallet'
        };
      case 'bank':
        return {
          bg: 'bg-blue-600',
          text: 'text-blue-600',
          border: 'border-blue-500',
          lightBg: 'bg-blue-50',
          label: 'Bank Account'
        };
      default:
        return {
          bg: 'bg-slate-800',
          text: 'text-slate-800',
          border: 'border-slate-700',
          lightBg: 'bg-slate-50',
          label: 'Payment QR'
        };
    }
  };

  const theme = getProviderColor(currentQR.provider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>डिजिटल भुक्तानी (Scan & Pay)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Instant
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {storeName} • Traffic Chowk, Butwal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Tabs */}
        {activeQRs.length > 1 && (
          <div className="bg-slate-100 p-2 border-b border-slate-200 overflow-x-auto scrollbar-none flex items-center gap-2">
            {activeQRs.map(qr => {
              const tabTheme = getProviderColor(qr.provider);
              const isSelected = qr.id === currentQR.id;
              return (
                <button
                  key={qr.id}
                  onClick={() => setSelectedId(qr.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? `${tabTheme.bg} text-white shadow-xs scale-[1.02]`
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white animate-pulse' : tabTheme.bg}`} />
                  <span>{qr.title || tabTheme.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Main QR Card */}
          <div className={`rounded-2xl p-5 border-2 ${theme.border} ${theme.lightBg} flex flex-col items-center text-center shadow-xs relative`}>
            {/* Top Badge */}
            <div className="flex items-center gap-1.5 mb-3">
              <span className={`px-3 py-1 rounded-full text-[11px] font-bold text-white ${theme.bg} shadow-xs`}>
                {theme.label}
              </span>
              {currentQR.isPrimary && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Primary
                </span>
              )}
            </div>

            <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {currentQR.accountName || storeName}
            </h4>

            {currentQR.bankName && (
              <p className="text-xs font-bold text-slate-600 mt-0.5 flex items-center justify-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{currentQR.bankName} {currentQR.branchName ? `(${currentQR.branchName})` : ''}</span>
              </p>
            )}

            {/* QR Image Display */}
            <div className="my-4 p-3.5 bg-white rounded-2xl shadow-md border border-slate-200/90 inline-block relative group">
              <img
                src={currentQR.qrImageUrl}
                alt={`${currentQR.title} QR Code`}
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
              />
              <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-2xl pointer-events-none">
                <span className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                  Camera Scan Ready
                </span>
              </div>
            </div>

            {/* Account / Mobile / ID field with Copy */}
            {currentQR.accountNumber && (
              <div className="w-full max-w-xs mt-1">
                <div className="bg-white/95 rounded-xl border border-slate-200 p-2.5 flex items-center justify-between shadow-2xs">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      {currentQR.provider === 'bank' ? 'Account Number (खाता नं)' : 'Mobile / ID (आईडी)'}
                    </span>
                    <span className="text-sm font-black text-slate-900 font-mono tracking-wide">
                      {currentQR.accountNumber}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(currentQR.accountNumber!, 'accNumber')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                    title="Copy to clipboard"
                  >
                    {copiedField === 'accNumber' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">कपी भयो!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>कपी</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Payment Instructions */}
            {currentQR.instructions && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 w-full text-left">
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{currentQR.instructions}</span>
                </p>
              </div>
            )}
          </div>

          {/* Quick Notice Card */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>भुक्तानी गर्दा ध्यान दिनुपर्ने कुरा:</span>
            </p>
            <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-0.5 pl-1">
              <li>भुक्तानी गर्दा <strong>Remarks (कैफियत)</strong> मा आफ्नो नाम वा मोबाइल नम्बर अनिवार्य लेख्नुहोला।</li>
              <li>भुक्तानी सफल भएपछि स्क्रिनसट हाम्रो ह्वाट्सएप (९८४७४६०६०३) मा सेयर गर्नुहोस्।</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleDownload(currentQR)}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Download QR Image"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>डाउनलोड (Save)</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Print QR Standee"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>प्रिन्ट</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            बन्द गर्नुहोस् (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
