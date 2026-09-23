import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Table,
  Wrench,
  Smartphone,
  Info,
  Layers
} from 'lucide-react';
import { GoogleSheetsService, GoogleSheetsHistoryItem } from '../../services/googleSheetsService.ts';
import { DataStorageService } from '../../services/dataStorage.ts';
import { RateListItem, PhoneValuationRequest, RepairBooking } from '../../types.ts';

interface GoogleSheetsManagerProps {
  rateList?: RateListItem[];
  valuations?: PhoneValuationRequest[];
  bookings?: RepairBooking[];
  onDataRefresh?: () => void;
  onRefresh?: () => void;
}

export const GoogleSheetsManager: React.FC<GoogleSheetsManagerProps> = ({
  rateList,
  valuations,
  bookings,
  onDataRefresh,
  onRefresh
}) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [history, setHistory] = useState<GoogleSheetsHistoryItem[]>([]);
  const [importSheetId, setImportSheetId] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Confirmation dialog state (mandatory for workspace mutations)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    const token = GoogleSheetsService.getAccessToken();
    if (token) {
      setIsConnected(true);
      setUserEmail('Google Account Connected');
    }
    setHistory(GoogleSheetsService.getHistory());
  }, []);

  const handleConnectGoogle = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await GoogleSheetsService.signInWithGoogle();
      setIsConnected(true);
      setUserEmail(res.userEmail);
      setStatusMessage({ text: `Successfully connected with Google account: ${res.userEmail}` });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to connect Google account', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await GoogleSheetsService.signOut();
    setIsConnected(false);
    setUserEmail(null);
    setStatusMessage({ text: 'Google account disconnected.' });
  };

  const executeExportRateList = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const rateList = DataStorageService.getRateList();
      const res = await GoogleSheetsService.exportRateListToSheet(rateList);
      setHistory(GoogleSheetsService.getHistory());
      setStatusMessage({
        text: `Exported ${res.rowCount} iPhone rates to new Google Sheet: "${res.spreadsheetId}". Click link below to view.`,
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to export rate list', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportRateListPrompt = () => {
    const rateList = DataStorageService.getRateList();
    setConfirmModal({
      isOpen: true,
      title: 'Export Nepal iPhone Rates to Google Sheet',
      description: `This will create a new spreadsheet in your Google Drive containing ${rateList.length} used iPhone market rates with Grade A and Grade B pricing.`,
      onConfirm: async () => {
        await executeExportRateList();
      },
    });
  };

  const executeExportValuations = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const valuations = DataStorageService.getValuations();
      const res = await GoogleSheetsService.exportValuationsToSheet(valuations);
      setHistory(GoogleSheetsService.getHistory());
      setStatusMessage({
        text: `Exported ${res.rowCount} customer valuations to Google Sheet!`,
      });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to export valuations', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportValuationsPrompt = () => {
    const valuations = DataStorageService.getValuations();
    setConfirmModal({
      isOpen: true,
      title: 'Export Customer Valuations to Google Sheet',
      description: `This will export all ${valuations.length} customer phone valuation inquiries and condition notes to your Google Drive.`,
      onConfirm: async () => {
        await executeExportValuations();
      },
    });
  };

  const executeExportRepairs = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const repairs = DataStorageService.getRepairBookings();
      const res = await GoogleSheetsService.exportRepairsToSheet(repairs);
      setHistory(GoogleSheetsService.getHistory());
      setStatusMessage({
        text: `Exported ${res.rowCount} repair appointments to Google Sheet!`,
      });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to export repairs', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportRepairsPrompt = () => {
    const repairs = DataStorageService.getRepairBookings();
    setConfirmModal({
      isOpen: true,
      title: 'Export Repair Appointments to Google Sheet',
      description: `This will export all ${repairs.length} repair bookings and service inquiries to Google Sheets.`,
      onConfirm: async () => {
        await executeExportRepairs();
      },
    });
  };

  const handleImportRateListPrompt = () => {
    if (!importSheetId.trim()) {
      setStatusMessage({ text: 'Please enter a valid Google Spreadsheet ID or URL', isError: true });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Import Rates from Google Sheet',
      description: 'This will read model names, storage, and Grade A/B prices from the provided Google Spreadsheet and merge them into your store rate list. Existing matching models will be updated.',
      onConfirm: async () => {
        setIsImporting(true);
        setStatusMessage(null);
        try {
          const imported = await GoogleSheetsService.importRateListFromSheet(importSheetId);
          if (imported.length === 0) {
            throw new Error('No valid rate rows found in sheet. Ensure columns: Model, Storage, Grade A, Grade B.');
          }

          const current = DataStorageService.getRateList();
          const currentMap = new Map(current.map(c => [`${c.model}-${c.storage}`, c]));

          imported.forEach((item, idx) => {
            if (item.model && item.storage) {
              const key = `${item.model}-${item.storage}`;
              const existing = currentMap.get(key);
              if (existing) {
                existing.priceA = item.priceA || existing.priceA;
                existing.priceB = item.priceB || existing.priceB;
                existing.sellingPrice = item.priceA || existing.sellingPrice;
                existing.lastUpdated = new Date().toISOString().split('T')[0];
              } else {
                current.push({
                  id: `rate-import-${Date.now()}-${idx}`,
                  model: item.model,
                  brand: 'Apple',
                  storage: item.storage,
                  condition: 'Pre-Owned',
                  sellingPrice: item.priceA || 0,
                  priceA: item.priceA || 0,
                  priceB: item.priceB || 0,
                  status: 'In Stock',
                  category: 'Smartphone',
                  updatedAt: new Date().toISOString(),
                  lastUpdated: new Date().toISOString().split('T')[0],
                });
              }
            }
          });

          DataStorageService.saveRateList(current);
          setStatusMessage({ text: `Successfully merged ${imported.length} rates from Google Sheet into store rate list!` });
          setImportSheetId('');
          if (onDataRefresh) onDataRefresh();
          else if (onRefresh) onRefresh();
        } catch (err: any) {
          setStatusMessage({ text: err.message || 'Import failed', isError: true });
        } finally {
          setIsImporting(false);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-700/60 inline-flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Google Workspace Integration
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Google Sheets Live Connector
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Export store catalogs, Nepal used iPhone rate lists, customer valuation leads, and repair tickets directly to your Google Sheets account in real-time.
            </p>
          </div>

          {/* Connect / Disconnect button */}
          <div className="shrink-0">
            {isConnected ? (
              <div className="flex items-center gap-2 bg-slate-950/60 border border-emerald-600/50 px-3 py-2 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <div className="text-left mr-2">
                  <p className="text-[11px] font-bold text-white leading-none">{userEmail}</p>
                  <p className="text-[9px] text-emerald-400 mt-0.5">Google Sheets Authorized</p>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
                  title="Disconnect Google account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isLoading}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2.5 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoading ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
              statusMessage.isError
                ? 'bg-red-950/80 border border-red-500/50 text-red-200'
                : 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.isError ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-xs font-bold px-2 py-0.5 hover:opacity-75 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Rate List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Nepal iPhone Rate List</h4>
              <p className="text-xs text-slate-500 mt-1">
                Creates a new Google Spreadsheet with all iPhone models, storage variants, and Grade A/B pricing.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">
              {DataStorageService.getRateList().length} Models
            </span>
            <button
              type="button"
              onClick={handleExportRateListPrompt}
              disabled={!isConnected || isLoading}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Sheet</span>
            </button>
          </div>
        </div>

        {/* Card 2: Valuations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Customer Valuations</h4>
              <p className="text-xs text-slate-500 mt-1">
                Export customer buy-back valuation inquiries, phone health, and estimated quotes to Google Sheets.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">
              {DataStorageService.getValuations().length} Requests
            </span>
            <button
              type="button"
              onClick={handleExportValuationsPrompt}
              disabled={!isConnected || isLoading}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Sheet</span>
            </button>
          </div>
        </div>

        {/* Card 3: Repair Bookings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Repair Appointments</h4>
              <p className="text-xs text-slate-500 mt-1">
                Export service orders, customer contact info, device defects, and preferred appointment dates.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">
              {DataStorageService.getRepairBookings().length} Appointments
            </span>
            <button
              type="button"
              onClick={handleExportRepairsPrompt}
              disabled={!isConnected || isLoading}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Import from Google Sheets */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-600" />
          <h4 className="text-sm font-bold text-slate-900">Import & Sync Rates from Existing Google Sheet</h4>
        </div>
        <p className="text-xs text-slate-500">
          Paste the Google Spreadsheet URL or Sheet ID (e.g. <code>https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit</code>) to sync your live inventory rates directly into the app.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={importSheetId}
            onChange={(e) => setImportSheetId(e.target.value)}
            placeholder="Paste Google Spreadsheet URL or ID..."
            className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={handleImportRateListPrompt}
            disabled={!isConnected || isImporting || !importSheetId.trim()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{isImporting ? 'Importing...' : 'Import to App'}</span>
          </button>
        </div>
      </div>

      {/* Export History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" />
            <h4 className="text-sm font-bold text-slate-900">Generated Google Spreadsheets</h4>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => {
                GoogleSheetsService.clearHistory();
                setHistory([]);
              }}
              className="text-[11px] font-semibold text-slate-400 hover:text-red-600 cursor-pointer"
            >
              Clear History
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
            <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">No Google Sheets created yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click "Export Sheet" above to generate your first live spreadsheet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {history.map((item) => (
              <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{item.title}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(item.createdAt).toLocaleString()} • {item.rowCount} rows
                    </p>
                  </div>
                </div>

                <a
                  href={item.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 shrink-0"
                >
                  <span>Open in Sheets</span>
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mandatory User Confirmation Modal for Mutating/Exporting Data */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">{confirmModal.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{confirmModal.description}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-amber-800 text-[11px]">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                This operation will write data with permission from your connected Google account to your Google Drive.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const onConfirm = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await onConfirm();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirm & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
