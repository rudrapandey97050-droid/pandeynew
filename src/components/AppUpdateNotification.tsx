import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Sparkles, X, ArrowRight } from 'lucide-react';
import { VersionService } from '../services/versionService.ts';

interface AppUpdateNotificationProps {
  onManualRefresh?: () => void;
}

export const AppUpdateNotification: React.FC<AppUpdateNotificationProps> = ({ onManualRefresh }) => {
  const [updateInfo, setUpdateInfo] = useState<{
    newVersion: string;
    countdown: number;
  } | null>(null);
  const [justUpdated, setJustUpdated] = useState(false);
  const [isRefreshingNow, setIsRefreshingNow] = useState(false);

  useEffect(() => {
    // 1. Check if we just refreshed from an update
    if (VersionService.checkJustUpdated()) {
      setJustUpdated(true);
      const t = setTimeout(() => {
        setJustUpdated(false);
      }, 5000);
      return () => clearTimeout(t);
    }

    // 2. Listen for upcoming updates
    const unsubscribe = VersionService.onUpdateAvailable((info) => {
      setUpdateInfo({
        newVersion: info.newVersion,
        countdown: info.autoRefreshInSeconds
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!updateInfo || updateInfo.countdown <= 0) return;

    const timer = setInterval(() => {
      setUpdateInfo((prev) => {
        if (!prev) return null;
        if (prev.countdown <= 1) {
          clearInterval(timer);
          return { ...prev, countdown: 0 };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [updateInfo?.countdown]);

  const handleManualRefresh = () => {
    setIsRefreshingNow(true);
    if (onManualRefresh) {
      onManualRefresh();
    }
    VersionService.forceHardRefresh(true);
  };

  const handleDismissCountdown = () => {
    setUpdateInfo(null);
  };

  return (
    <>
      {/* 1. Just Updated Success Banner (Auto-dismisses after 5s) */}
      {justUpdated && (
        <div className="fixed top-14 left-1/2 transform -translate-x-1/2 z-[100] px-4 w-full max-w-md pointer-events-auto transition-all animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-950/95 border border-emerald-500/30 text-white rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">
                  पछिल्लो नयाँ भर्सन सफलतापूर्वक लोड भयो!
                </p>
                <p className="text-[11px] text-emerald-300/80">
                  App updated to latest functions • Fresh cache loaded
                </p>
              </div>
            </div>
            <button
              onClick={() => setJustUpdated(false)}
              className="text-emerald-400/80 hover:text-white p-1 rounded-lg hover:bg-emerald-800/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. New Version Detected / Auto-Refresh Countdown Notification */}
      {updateInfo && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] px-4 w-full max-w-lg pointer-events-auto transition-all animate-in fade-in slide-in-from-top-6 duration-300">
          <div className="bg-[#1c1c1e]/95 border border-amber-500/40 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    नयाँ अपडेट (New Update)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {updateInfo.countdown > 0 ? `रिफ्रेस हुन बाँकी ${updateInfo.countdown}s` : 'रिफ्रेस हुँदैछ...'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white mt-1">
                  नयाँ फिचर तथा अपडेट उपलब्ध छ!
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  नयाँ फंक्सनहरू लोड गर्न पृष्ठ स्वचालित रिफ्रेस हुँदैछ। पुरानो क्यास हटाइएको छ।
                </p>

                <div className="flex items-center space-x-2.5 mt-3">
                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshingNow}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-semibold text-xs hover:from-amber-400 hover:to-orange-400 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingNow ? 'animate-spin' : ''}`} />
                    <span>अहिले रिफ्रेस गर्नुहोस् (Refresh Now)</span>
                  </button>
                  <button
                    onClick={handleDismissCountdown}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    पछि गर्नुहोस्
                  </button>
                </div>
              </div>

              <button
                onClick={handleDismissCountdown}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
