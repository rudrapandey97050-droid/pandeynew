import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
  Download,
  Trash2,
  RefreshCw,
  Filter,
  User,
  Clock,
  Laptop,
  Layers,
  Key,
  Settings,
  LogIn,
  LogOut,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { AuditLogEntry, AuditLogCategory, AuditLogStatus } from '../../types.ts';
import { AuditLogService } from '../../services/auditService.ts';

interface AuditLogManagerProps {
  onRefreshParent?: () => void;
}

export const AuditLogManager: React.FC<AuditLogManagerProps> = ({ onRefreshParent }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadLogs = () => {
    setIsRefreshing(true);
    const data = AuditLogService.getLogs();
    setLogs(data);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    loadLogs();
    const unsubscribe = AuditLogService.subscribe(() => {
      loadLogs();
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleClearLogs = () => {
    AuditLogService.clearLogs();
    setShowClearConfirm(false);
    loadLogs();
    showToast('अडिट लग इतिहास सफलतापूर्वक खाली गरियो (Audit logs cleared)');
    if (onRefreshParent) onRefreshParent();
  };

  const handleDeleteSingle = (id: string) => {
    AuditLogService.deleteLog(id);
    loadLogs();
    showToast('लग रेकर्ड हटाइयो (Log deleted)');
  };

  const handleExportCsv = () => {
    AuditLogService.exportToCsv();
    showToast('अडिट लग CSV फाइल डाउनलोड भयो (CSV exported)');
  };

  const handleExportJson = () => {
    AuditLogService.exportToJson();
    showToast('अडिट लग JSON फाइल डाउनलोड भयो (JSON exported)');
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Category filter
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && log.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchAction = log.action.toLowerCase().includes(q);
        const matchUser = (log.userName || '').toLowerCase().includes(q);
        const matchRole = (log.role || '').toLowerCase().includes(q);
        const matchDetails = (log.details || '').toLowerCase().includes(q);
        const matchDevice = (log.ipOrDevice || '').toLowerCase().includes(q);
        if (!matchAction && !matchUser && !matchRole && !matchDetails && !matchDevice) {
          return false;
        }
      }
      return true;
    });
  }, [logs, selectedCategory, selectedStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const successCount = logs.filter(l => l.status === 'SUCCESS').length;
    const failedCount = logs.filter(l => l.status === 'FAILED').length;
    const warningCount = logs.filter(l => l.status === 'WARNING').length;
    const authAttempts = logs.filter(l => l.category === 'AUTH').length;
    const productEdits = logs.filter(l => l.category === 'PRODUCT').length;

    return {
      total,
      successCount,
      failedCount,
      warningCount,
      authAttempts,
      productEdits
    };
  }, [logs]);

  // Helpers for Action formatting
  const getActionBadge = (action: string, category: AuditLogCategory) => {
    let icon = <Sparkles className="w-3.5 h-3.5" />;
    let bg = 'bg-slate-100 text-slate-700 border-slate-200';

    if (action.includes('LOGIN') || action.includes('AUTH')) {
      icon = action.includes('FAILED') ? (
        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
      ) : (
        <LogIn className="w-3.5 h-3.5 text-emerald-600" />
      );
      bg = action.includes('FAILED')
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (action.includes('LOGOUT')) {
      icon = <LogOut className="w-3.5 h-3.5 text-slate-500" />;
      bg = 'bg-slate-100 text-slate-700 border-slate-200';
    } else if (action.includes('PRODUCT')) {
      icon = <Layers className="w-3.5 h-3.5 text-indigo-600" />;
      bg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    } else if (action.includes('PIN') || action.includes('PASSWORD') || action.includes('SECURITY')) {
      icon = <Key className="w-3.5 h-3.5 text-amber-600" />;
      bg = 'bg-amber-50 text-amber-800 border-amber-200';
    } else if (action.includes('SETTINGS') || action.includes('BACKUP')) {
      icon = <Settings className="w-3.5 h-3.5 text-blue-600" />;
      bg = 'bg-blue-50 text-blue-700 border-blue-200';
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border ${bg}`}>
        {icon}
        <span>{action}</span>
      </span>
    );
  };

  const getStatusBadge = (status: AuditLogStatus) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Success</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            <span>Warning</span>
          </span>
        );
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      const dateStr = d.toLocaleDateString('ne-NP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const timeStr = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      // Relative time
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      let relative = '';
      if (diffMins < 1) relative = 'भर्खरै (Just now)';
      else if (diffMins < 60) relative = `${diffMins} मिनेट अघि`;
      else if (diffMins < 1440) relative = `${Math.floor(diffMins / 60)} घण्टा अघि`;
      else relative = `${Math.floor(diffMins / 1440)} दिन अघि`;

      return {
        formatted: `${dateStr}, ${timeStr}`,
        relative
      };
    } catch {
      return { formatted: iso, relative: '' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Security Status */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE SECURITY MONITORING • सक्रिय अडिट प्रणाली</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-serif tracking-tight">
              Admin Audit Log & Activity Trail
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              प्रशासनिक पोर्टलमा भएका संवेदनशील गतिविधिहरू (लगइन प्रयास, उत्पादन थप/सम्पादन, पासवर्ड तथा सुरक्षा पिन परिवर्तन) को पूर्ण सुरक्षा अडिट ट्र्याकिङ।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={loadLogs}
              disabled={isRefreshing}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-xs"
              title="ताजा अडिट लगहरू लोड गर्नुहोस्"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
              title="अडिट लग CSV फाइल डाउनलोड गर्नुहोस्"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer border border-slate-700"
              title="JSON ब्याकअप"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
              <span>JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-rose-500/30 cursor-pointer"
              title="लग इतिहास खाली गर्नुहोस्"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Logged Events
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {stats.total}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Successful Actions
            </span>
            <span className="text-xl font-black text-emerald-700 font-mono">
              {stats.successCount}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Security Alerts / Fails
            </span>
            <span className="text-xl font-black text-rose-700 font-mono">
              {stats.failedCount + stats.warningCount}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Product & Auth Events
            </span>
            <span className="text-xl font-black text-amber-700 font-mono">
              {stats.authAttempts + stats.productEdits}
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="खोजी गर्नुहोस् (Action, User, Details, Device...)"
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="AUTH">Authentication (लगइन)</option>
                <option value="PRODUCT">Products (उत्पादन)</option>
                <option value="SECURITY">Security & PIN (सुरक्षा)</option>
                <option value="SETTINGS">Settings & Backup (सेटिङ्स)</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="SUCCESS">Success Only (सफल)</option>
                <option value="FAILED">Failed Only (असफल)</option>
                <option value="WARNING">Warnings (सचेत)</option>
              </select>
            </div>

            {(selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                }}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/75 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Action & Type</th>
                <th className="py-3 px-4">User & Role</th>
                <th className="py-3 px-4">Details / Description</th>
                <th className="py-3 px-4">Device & Client</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-700 text-sm">कुनै अडिट रेकर्ड भेटिएन</p>
                      <p className="text-xs text-slate-500">
                        {searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL'
                          ? 'चयन गरिएका फिल्टर वा खोजी शब्द अनुसार कुनै रेकर्ड फेला परेन।'
                          : 'हालसम्म कुनै संवेदनशील कार्य लग भएको छैन।'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const { formatted, relative } = formatTimestamp(log.timestamp);
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center space-x-1.5 font-medium text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatted}</span>
                        </div>
                        {relative && (
                          <span className="text-[10px] text-slate-400 block ml-5">
                            {relative}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getActionBadge(log.action, log.category)}
                      </td>

                      {/* User & Role */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] uppercase shrink-0 shadow-xs">
                            {(log.userName || 'A').slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {log.userName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block">
                              {log.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 min-w-[240px]">
                        <p className="text-slate-800 font-medium leading-relaxed">
                          {log.details}
                        </p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            {Object.entries(log.metadata).map(([k, v]) => (
                              <span
                                key={k}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono"
                              >
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Device */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center space-x-1.5 text-xs text-slate-700">
                          <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{log.ipOrDevice || 'Desktop'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSingle(log.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="यो रेकर्ड मेटाउनुहोस्"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              कुल <strong>{filteredLogs.length}</strong> रेकर्ड देखाइएको छ (अन्तिम {stats.total} मध्ये)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Audit logs are securely retained in local system cache (Max 500 records)
          </span>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Logs */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                सबै अडिट लगहरू खाली गर्ने निश्चित हुनुहुन्छ?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                यो कार्यले सबै हालका अडिट रेकर्डहरू मेटाउनेछ। अडिट अनुपालनका लागि यो कार्य समेत सुरक्षा लगमा दर्ता हुनेछ।
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                रद्द गर्नुहोस्
              </button>
              <button
                type="button"
                onClick={handleClearLogs}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-rose-600/20"
              >
                हो, खाली गर्नुहोस्
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
