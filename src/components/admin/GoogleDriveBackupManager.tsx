import React, { useState, useEffect } from 'react';
import {
  Cloud,
  HardDrive,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  FileJson,
  Trash2,
  Clock,
  ShieldCheck,
  Check,
  ChevronRight,
  Database,
  ArrowRight
} from 'lucide-react';
import { GoogleDriveService, DriveBackupFile } from '../../services/googleDriveService.ts';
import { DataStorageService } from '../../services/dataStorage.ts';
import { FullAppBackupData } from '../../types.ts';

interface GoogleDriveBackupManagerProps {
  onDataRefresh?: () => void;
}

export const GoogleDriveBackupManager: React.FC<GoogleDriveBackupManagerProps> = ({
  onDataRefresh
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(() => GoogleDriveService.isConnected());
  const [currentUser, setCurrentUser] = useState<{ email: string | null; displayName: string | null; photoURL: string | null } | null>(
    () => GoogleDriveService.getCurrentAccount()
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isListing, setIsListing] = useState<boolean>(false);
  const [backups, setBackups] = useState<DriveBackupFile[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [backupNote, setBackupNote] = useState<string>('');
  const [lastUploadedLink, setLastUploadedLink] = useState<{ name: string; url?: string } | null>(null);

  // Restore preview modal state
  const [restoreModalData, setRestoreModalData] = useState<{
    file: DriveBackupFile;
    backup: FullAppBackupData;
  } | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // Load backups when connected
  const refreshBackupsList = async () => {
    setIsListing(true);
    try {
      const files = await GoogleDriveService.listBackups();
      setBackups(files);
      setIsConnected(true);
      setCurrentUser(GoogleDriveService.getCurrentAccount());
    } catch (err: any) {
      if (isConnected) {
        setStatusMsg({ text: err?.message || 'Failed to list Google Drive backups', isError: true });
      }
    } finally {
      setIsListing(false);
    }
  };

  useEffect(() => {
    if (GoogleDriveService.isConnected()) {
      setIsConnected(true);
      setCurrentUser(GoogleDriveService.getCurrentAccount());
      refreshBackupsList();
    }
  }, []);

  const handleSignInGoogle = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      await GoogleDriveService.getValidToken(true);
      setIsConnected(true);
      setCurrentUser(GoogleDriveService.getCurrentAccount());
      setStatusMsg({ text: 'Successfully authenticated with Google Drive!' });
      await refreshBackupsList();
    } catch (err: any) {
      setStatusMsg({ text: err?.message || 'Failed to connect Google account.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await GoogleDriveService.disconnectGoogle();
    setIsConnected(false);
    setCurrentUser(null);
    setBackups([]);
    setStatusMsg({ text: 'Disconnected from Google Drive.' });
  };

  const handleUploadBackup = async () => {
    setStatusMsg(null);
    setIsUploading(true);
    try {
      const backupPayload = DataStorageService.exportAllData();
      const result = await GoogleDriveService.uploadWebsiteBackup(backupPayload, backupNote);

      setStatusMsg({ text: result.message });
      setLastUploadedLink({ name: result.fileName || 'backup.json', url: result.webViewLink });
      setBackupNote('');
      await refreshBackupsList();
    } catch (err: any) {
      setStatusMsg({ text: err?.message || 'Upload to Google Drive failed.', isError: true });
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartRestore = async (file: DriveBackupFile) => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const data = await GoogleDriveService.downloadBackup(file.id);
      const valResult = DataStorageService.validateBackupPayload(JSON.stringify(data));
      if (!valResult.valid || !valResult.backup) {
        throw new Error(valResult.error || 'Invalid backup structure.');
      }
      setRestoreModalData({
        file,
        backup: valResult.backup
      });
    } catch (err: any) {
      setStatusMsg({ text: err?.message || 'Failed to download backup for restore.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoreModalData) return;
    setIsRestoring(true);
    try {
      const res = DataStorageService.restoreAllData(restoreModalData.backup, restoreMode);
      if (res.success) {
        setStatusMsg({ text: `Backup "${restoreModalData.file.name}" restored successfully!` });
        setRestoreModalData(null);
        if (onDataRefresh) {
          onDataRefresh();
        }
      } else {
        throw new Error(res.message || 'Restore failed.');
      }
    } catch (err: any) {
      setStatusMsg({ text: err?.message || 'Failed to restore backup.', isError: true });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = async (file: DriveBackupFile) => {
    if (!window.confirm(`Are you sure you want to delete "${file.name}" from your Google Drive?`)) {
      return;
    }
    setIsLoading(true);
    try {
      await GoogleDriveService.deleteBackup(file.id);
      setStatusMsg({ text: `Deleted "${file.name}" from Google Drive.` });
      await refreshBackupsList();
    } catch (err: any) {
      setStatusMsg({ text: err?.message || 'Failed to delete backup.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return 'JSON File';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return 'JSON File';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Configuration Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <HardDrive className="w-48 h-48" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black rounded-full uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Firebase Firestore: Disconnected</span>
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black rounded-full uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Primary Cloud Backup: Google Drive</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <HardDrive className="w-6 h-6 text-emerald-400" />
              <span>Google Drive Website Backup & Recovery</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Google Cloud Firebase Firestore has been disconnected. Your website data (catalog, prices, repair bookings, valuations, settings) is safely preserved and backed up directly to your personal Google Drive with version history.
            </p>
          </div>

          {/* Connect / User Info Box */}
          <div className="shrink-0 bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl w-full md:w-auto min-w-[280px]">
            {isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Google User"
                      className="w-10 h-10 rounded-full border-2 border-emerald-400"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                      G
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">
                      {currentUser?.displayName || 'Google Account'}
                    </p>
                    <p className="text-[11px] text-emerald-400 truncate">
                      {currentUser?.email || 'Connected to Drive'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={refreshBackupsList}
                    disabled={isListing}
                    className="flex-1 py-1.5 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isListing ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="py-1.5 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center sm:text-left">
                <p className="text-xs text-slate-300">
                  Sign in with your Google Account to enable automatic and one-click backups directly into your Google Drive:
                </p>
                <button
                  type="button"
                  onClick={handleSignInGoogle}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl shadow-md flex items-center justify-center space-x-2.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoading ? 'Connecting...' : 'Connect Google Drive'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback message */}
        {statusMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
              statusMsg.isError
                ? 'bg-rose-950/80 border border-rose-500/60 text-rose-200'
                : 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {statusMsg.isError ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
            {lastUploadedLink?.url && (
              <a
                href={lastUploadedLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-[11px] hover:bg-emerald-400 transition flex items-center space-x-1 ml-3"
              >
                <span>Open in Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Main Backup & Restore Workflow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Create Google Drive Backup */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Backup to Google Drive
                </h3>
                <p className="text-xs text-slate-500">
                  Exports your entire store state to your Google Drive account.
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600">
              <p className="font-bold text-slate-800">What will be backed up:</p>
              <ul className="space-y-1.5 text-[11px] list-disc pl-4 text-slate-600">
                <li>All Store Smartphones & Accessory Lineups</li>
                <li>Nepal Daily Market Rate List (Grade A / B)</li>
                <li>Customer Phone Valuation Requests</li>
                <li>Phone Repair Service Bookings & Estimates</li>
                <li>Upcoming Models & Pre-Bookings</li>
                <li>Store Profile & Contact Information</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Optional Backup Label / Note</label>
              <input
                type="text"
                value={backupNote}
                onChange={e => setBackupNote(e.target.value)}
                placeholder="e.g. Before stock update, Weekly backup"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleUploadBackup}
                disabled={isUploading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <UploadCloud className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
                <span>
                  {isUploading ? 'Uploading to Google Drive...' : 'Backup Entire Website to Google Drive'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  DataStorageService.downloadBackupFile();
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <DownloadCloud className="w-4 h-4 text-slate-500" />
                <span>Download Offline Backup File (.JSON)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Google Drive Backups List */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <FileJson className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Google Drive Cloud Backups ({backups.length})
                </h3>
              </div>

              {isConnected && (
                <button
                  type="button"
                  onClick={refreshBackupsList}
                  disabled={isListing}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isListing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              )}
            </div>

            {!isConnected ? (
              <div className="text-center py-12 px-4 space-y-3 bg-slate-50 rounded-2xl border border-slate-100">
                <HardDrive className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  Connect your Google Drive account to view and restore cloud backups.
                </p>
                <button
                  type="button"
                  onClick={handleSignInGoogle}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Connect Google Drive
                </button>
              </div>
            ) : isListing && backups.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                <p className="text-xs">Loading backups from your Google Drive...</p>
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3 bg-slate-50 rounded-2xl border border-slate-100">
                <FileJson className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800">No Backups Found on Google Drive</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click "Backup Entire Website to Google Drive" to create your first cloud backup.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {backups.map(file => {
                  const dateStr = file.createdTime
                    ? new Date(file.createdTime).toLocaleString()
                    : 'Unknown Date';

                  return (
                    <div
                      key={file.id}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-emerald-300 transition-all shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 overflow-hidden min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-slate-900 truncate block">
                            {file.name}
                          </span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full shrink-0 font-medium">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>Saved on: {dateStr}</span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => handleStartRestore(file)}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                        >
                          <DownloadCloud className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>

                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteBackup(file)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                          title="Delete from Google Drive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Restore Preview & Confirmation Modal */}
      {restoreModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <DownloadCloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Restore from Google Drive Backup
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">
                  {restoreModalData.file.name}
                </p>
              </div>
            </div>

            {/* Backup Summary Stats */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <p className="text-xs font-bold text-slate-700">Backup Contents Overview:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="block text-base font-black text-slate-900">
                    {restoreModalData.backup.summary.productsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Products</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="block text-base font-black text-slate-900">
                    {restoreModalData.backup.summary.rateListCount}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Rates</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="block text-base font-black text-slate-900">
                    {restoreModalData.backup.summary.valuationsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Valuations</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="block text-base font-black text-slate-900">
                    {restoreModalData.backup.summary.repairBookingsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Repairs</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="block text-base font-black text-slate-900">
                    {restoreModalData.backup.summary.upcomingModelsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Upcoming</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="block text-base font-black text-slate-900">
                    {restoreModalData.backup.summary.preBookingsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Pre-Bookings</span>
                </div>
              </div>
            </div>

            {/* Restore Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Restore Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRestoreMode('replace')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    restoreMode === 'replace'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 text-xs'
                  }`}
                >
                  <p className="text-xs font-bold">Full Replace</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Overwrites store data with exact backup snapshot.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRestoreMode('merge')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    restoreMode === 'merge'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 text-xs'
                  }`}
                >
                  <p className="text-xs font-bold">Smart Merge</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Merges items without overwriting current data.
                  </p>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRestoreModalData(null)}
                disabled={isRestoring}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isRestoring ? 'Restoring...' : 'Confirm Restore Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
