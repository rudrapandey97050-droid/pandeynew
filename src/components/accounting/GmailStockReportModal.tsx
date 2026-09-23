import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  Settings,
  Eye,
  RefreshCw,
  X,
  Package,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import {
  GmailStockReportService,
  DailyStockReportData,
  GmailStockReportHistoryItem,
  GmailScheduleConfig,
  DEFAULT_SENDER,
  DEFAULT_RECIPIENT,
  DEFAULT_SCHEDULED_TIME
} from '../../services/gmailStockReportService.ts';

interface GmailStockReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GmailStockReportModal: React.FC<GmailStockReportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'send' | 'preview' | 'schedule' | 'history'>('send');
  const [reportData, setReportData] = useState<DailyStockReportData | null>(null);
  const [history, setHistory] = useState<GmailStockReportHistoryItem[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<GmailScheduleConfig>(
    GmailStockReportService.getScheduleConfig()
  );

  const [recipientEmail, setRecipientEmail] = useState(DEFAULT_RECIPIENT);
  const [senderEmail, setSenderEmail] = useState(DEFAULT_SENDER);
  const [customSubject, setCustomSubject] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);
  const [sendErrorMsg, setSendErrorMsg] = useState<string | null>(null);
  const [savedScheduleMsg, setSavedScheduleMsg] = useState(false);

  // Initialize and refresh report data whenever opened
  useEffect(() => {
    if (isOpen) {
      const data = GmailStockReportService.generateStockReportData();
      setReportData(data);
      const conf = GmailStockReportService.getScheduleConfig();
      setScheduleConfig(conf);
      setRecipientEmail(conf.recipientEmail || DEFAULT_RECIPIENT);
      setSenderEmail(conf.senderEmail || DEFAULT_SENDER);
      setCustomSubject(
        `[Daily 9:00 PM Stock Report] ${data.storeName} - ${data.reportDate} (Valuation: Rs. ${data.totalCostValuation.toLocaleString()})`
      );
      setHistory(GmailStockReportService.getHistory());
      setSendSuccessMsg(null);
      setSendErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendNow = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setSendErrorMsg('कृपया मान्य प्राप्तकर्ता इमेल ठेगाना प्रविष्ट गर्नुहोस् (Please enter a valid receiver email)');
      return;
    }

    setIsSending(true);
    setSendErrorMsg(null);
    setSendSuccessMsg(null);

    try {
      const res = await GmailStockReportService.sendStockReport({
        recipientEmail,
        senderEmail,
        customSubject: customSubject.trim() || undefined,
      });

      setSendSuccessMsg(
        `✅ दैनिक ९ बजेको स्टक रिपोर्ट सफलतापूर्वक पठाइयो! (${res.recipient})`
      );
      setHistory(GmailStockReportService.getHistory());
      setScheduleConfig(GmailStockReportService.getScheduleConfig());
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setSendErrorMsg(
        err.message || 'Gmail बाट रिपोर्ट पठाउन असफल भयो। कृपया पुन: प्रयास गर्नुहोस्।'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    GmailStockReportService.saveScheduleConfig(scheduleConfig);
    setSavedScheduleMsg(true);
    setTimeout(() => setSavedScheduleMsg(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Daily Stock Report to Gmail
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase font-mono">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400">
                दैनिक मौज्दात, स्टक भ्यालुएसन र बिक्री विवरण Gmail मा पठाउनुहोस्
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

        {/* Tab Selector */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center space-x-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('send')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'send'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Now (अहिले पठाउनुहोस्)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'preview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Email Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'schedule'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Auto-Schedule Settings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Send History ({history.length})</span>
            </button>
          </div>

          {reportData && (
            <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>As of: {reportData.reportDate} {reportData.reportTime}</span>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Success / Error Alerts */}
          {sendSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center space-x-3 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1">{sendSuccessMsg}</div>
            </div>
          )}

          {sendErrorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center space-x-3 shadow-xs animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="flex-1">{sendErrorMsg}</div>
            </div>
          )}

          {/* TAB 1: SEND NOW */}
          {activeTab === 'send' && reportData && (
            <div className="space-y-6">

              {/* Auto 9 PM Schedule Active Callout */}
              <div className="p-4 bg-gradient-to-r from-indigo-900/90 via-slate-900 to-slate-950 text-white rounded-2xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-indigo-950/20">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>9:00 PM ALWAYS</span>
                    </span>
                    <span className="text-xs font-bold text-indigo-200">
                      Auto-Send Stock Scheduled (स्वचालित दैनिक ९ बजे)
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      <strong className="text-white">Sender:</strong> <span className="font-mono text-indigo-300">{senderEmail}</span>
                    </span>
                    <span>→</span>
                    <span>
                      <strong className="text-white">Receiver:</strong> <span className="font-mono text-emerald-300 font-bold">{recipientEmail}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('schedule')}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Adjust Time
                  </button>
                  <button
                    type="button"
                    onClick={handleSendNow}
                    disabled={isSending}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isSending ? 'Sending...' : 'Test Send Now'}</span>
                  </button>
                </div>
              </div>

              {/* KPI Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total In-Stock</span>
                  <p className="text-xl font-black text-slate-900 mt-1">{reportData.totalStockUnits.toLocaleString()} units</p>
                  <span className="text-[10px] text-slate-500">{reportData.totalProductsCount} phone models</span>
                </div>

                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Stock Cost Valuation</span>
                  <p className="text-lg font-black text-emerald-700 mt-1">Rs. {reportData.totalCostValuation.toLocaleString()}</p>
                  <span className="text-[10px] text-emerald-600">Retail: Rs. {reportData.totalSellingValuation.toLocaleString()}</span>
                </div>

                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 text-center">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Today's Sales</span>
                  <p className="text-lg font-black text-indigo-700 mt-1">Rs. {reportData.todaySalesRevenue.toLocaleString()}</p>
                  <span className="text-[10px] text-indigo-600">{reportData.todaySalesUnits} phone(s) sold</span>
                </div>

                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Low Stock Alert</span>
                  <p className="text-lg font-black text-amber-700 mt-1">{reportData.lowStockCount} items</p>
                  <span className="text-[10px] text-amber-600">{reportData.outOfStockCount} items sold out</span>
                </div>
              </div>

              {/* Form Input for Dispatch */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span>Email Dispatch Routing</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sender Gmail (पठाउने इमेल)
                    </label>
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="pmesbutwal@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-700"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Store sender: <span className="font-mono font-semibold text-slate-700">pmesbutwal@gmail.com</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Receiver Gmail (पाउने इमेल) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="rudra.pandey97050@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-indigo-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold text-indigo-900"
                    />
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                      Target receiver: <span className="font-mono">rudra.pandey97050@gmail.com</span>
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subject Line (विषय)
                    </label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="Daily 9:00 PM Stock Report Subject"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Brand breakdown mini overview */}
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block mb-2">
                    Top Brands Included in this Report:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {reportData.brandSummary.map((b) => (
                      <span
                        key={b.brand}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 flex items-center space-x-1"
                      >
                        <span className="font-bold text-indigo-600">{b.brand}:</span>
                        <span>{b.units} pcs</span>
                        <span className="text-slate-400 text-[10px]">(Rs. {b.costValuation.toLocaleString()})</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Authenticated directly via Google Workspace Gmail API</span>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendNow}
                    disabled={isSending}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending to Gmail...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Daily Stock Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: EMAIL PREVIEW */}
          {activeTab === 'preview' && reportData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>HTML Email Live Preview (Exact view recipient sees in Gmail)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('send')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold"
                >
                  ← Back to Send
                </button>
              </div>

              <div className="border border-slate-300 rounded-2xl overflow-hidden bg-slate-100 p-2 shadow-inner">
                <iframe
                  title="Gmail Report Preview"
                  srcDoc={GmailStockReportService.generateHtmlEmail(reportData, senderEmail, recipientEmail)}
                  className="w-full h-[480px] bg-white rounded-xl border border-slate-200"
                />
              </div>
            </div>
          )}

          {/* TAB 3: AUTO-SCHEDULE SETTINGS */}
          {activeTab === 'schedule' && (
            <form onSubmit={handleSaveSchedule} className="space-y-6 max-w-2xl">
              
              {savedScheduleMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Schedule settings successfully saved! (दैनिक ९ बजेको अटो-सेन्ड सेटिङ सुरक्षित गरियो)</span>
                </div>
              )}

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>Auto Send Stock in Mail 9 PM Always</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Active Routine
                  </span>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="autoSendCheck"
                    checked={scheduleConfig.autoSendEnabled}
                    onChange={(e) =>
                      setScheduleConfig({ ...scheduleConfig, autoSendEnabled: e.target.checked })
                    }
                    className="w-4 h-4 mt-0.5 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="autoSendCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Auto Send Stock in Mail at 9:00 PM Always (सधैं बेलुका ९ बजे अटो सेन्ड)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      The accounting engine automatically compiles total stock units, inventory cost valuation, today's sales, purchases, and brand totals every night at 9:00 PM and dispatches directly to Gmail.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sender Gmail Address (पठाउने इमेल)
                    </label>
                    <input
                      type="email"
                      required
                      value={scheduleConfig.senderEmail || DEFAULT_SENDER}
                      onChange={(e) =>
                        setScheduleConfig({ ...scheduleConfig, senderEmail: e.target.value })
                      }
                      placeholder="pmesbutwal@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Sender: <span className="font-mono font-semibold">pmesbutwal@gmail.com</span></p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Receiver Gmail Address (पाउने इमेल)
                    </label>
                    <input
                      type="email"
                      required
                      value={scheduleConfig.recipientEmail}
                      onChange={(e) =>
                        setScheduleConfig({ ...scheduleConfig, recipientEmail: e.target.value })
                      }
                      placeholder="rudra.pandey97050@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-indigo-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold text-indigo-900"
                    />
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">Receiver: <span className="font-mono">rudra.pandey97050@gmail.com</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Daily Send Time (दैनिक पठाउने समय)
                    </label>
                    <input
                      type="time"
                      value={scheduleConfig.scheduledTime || DEFAULT_SCHEDULED_TIME}
                      onChange={(e) =>
                        setScheduleConfig({ ...scheduleConfig, scheduledTime: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono font-bold text-slate-900"
                    />
                    <p className="text-[10px] text-indigo-600 font-semibold mt-1">Scheduled: 21:00 (9:00 PM Always)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Today's Dispatch Status
                    </label>
                    <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700">
                      {scheduleConfig.lastSentDate
                        ? `✅ Sent for ${scheduleConfig.lastSentDate}`
                        : '⏳ Scheduled for 9:00 PM today'}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Save Schedule Settings (९ बजेको सेटिङ सुरक्षित गर्नुहोस्)
              </button>
            </form>
          )}

          {/* TAB 4: DISPATCH HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <span>Previous Gmail Stock Dispatches</span>
                </h3>
                <span className="text-xs text-slate-500">Total sent: {history.length}</span>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <Mail className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No stock reports sent yet</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Click "Send Now" to dispatch today's first stock report to Gmail!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  {history.map((item) => (
                    <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              item.status === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{item.recipientEmail}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-1">{item.subject}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.sentAt).toLocaleString()} • {item.totalUnits} Units • Valuation: Rs. {item.totalValuation.toLocaleString()}
                        </span>
                      </div>

                      {item.messageId && (
                        <div className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          ID: {item.messageId.slice(0, 16)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
