/**
 * VersionService - Handles automatic detection of app updates,
 * background polling, cache clearing, and seamless page reloads
 * to prevent users from seeing outdated files and functions.
 */

export interface AppVersionInfo {
  version: string;
  serverStartTime: number;
  timestamp: number;
  appName: string;
}

export type VersionUpdateListener = (info: {
  currentVersion: string;
  newVersion: string;
  serverStartTime: number;
  autoRefreshInSeconds: number;
}) => void;

class VersionServiceImpl {
  private currentBuildTime: number = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : Date.now();
  private currentVersion: string = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.1';
  private initialServerStartTime: number | null = null;
  private isChecking: boolean = false;
  private listeners: VersionUpdateListener[] = [];
  private pollIntervalId: any = null;
  private hasDetectedUpdate: boolean = false;
  private countdownTimerId: any = null;
  private isUserTyping: boolean = false;

  constructor() {
    this.cleanupStaleServiceWorkers();
    this.monitorUserActivity();
  }

  /**
   * Initializes the auto-updater background service
   */
  public init(): () => void {
    if (typeof window === 'undefined') return () => {};

    // Check on startup
    this.checkVersion();

    // Check periodically every 30 seconds
    if (!this.pollIntervalId) {
      this.pollIntervalId = setInterval(() => {
        this.checkVersion();
      }, 30000);
    }

    // Check immediately when user returns to the browser tab or unlocks phone
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        this.checkVersion();
      }
    };
    const onFocus = () => {
      this.checkVersion();
    };
    const onOnline = () => {
      this.checkVersion();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    return () => {
      if (this.pollIntervalId) {
        clearInterval(this.pollIntervalId);
        this.pollIntervalId = null;
      }
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }

  /**
   * Track whether user is actively typing in a form so auto-refresh
   * won't disrupt active input.
   */
  private monitorUserActivity() {
    if (typeof window === 'undefined') return;

    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        this.isUserTyping = true;
      }
    });

    document.addEventListener('focusout', (e) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        this.isUserTyping = false;
      }
    });
  }

  /**
   * Unregister any stale service workers from previous builds
   * that may be serving obsolete, cached files.
   */
  public async cleanupStaleServiceWorkers() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
        console.log('[VersionService] Unregistered stale service worker');
      }
    } catch (err) {
      console.warn('[VersionService] Service worker unregister check:', err);
    }
  }

  /**
   * Check if a newer version of the application has been deployed on the server
   */
  public async checkVersion(): Promise<{ hasUpdate: boolean; newVersion?: string }> {
    if (this.isChecking || typeof window === 'undefined') {
      return { hasUpdate: false };
    }

    this.isChecking = true;

    try {
      // Bust browser cache using timestamp query
      const res = await fetch(`/api/app-version?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!res.ok) {
        this.isChecking = false;
        return { hasUpdate: false };
      }

      const data: AppVersionInfo = await res.json();

      // First run: record initial server start time
      if (this.initialServerStartTime === null) {
        this.initialServerStartTime = data.serverStartTime;
        this.isChecking = false;
        return { hasUpdate: false };
      }

      // Check if server was restarted or new code deployed
      const isNewBuild = data.serverStartTime > this.initialServerStartTime || data.version !== this.currentVersion;

      if (isNewBuild && !this.hasDetectedUpdate) {
        this.hasDetectedUpdate = true;
        console.log(`[VersionService] 🚀 New app build detected! Server start: ${data.serverStartTime} (initial: ${this.initialServerStartTime})`);
        
        this.triggerUpdateNotification({
          currentVersion: this.currentVersion,
          newVersion: data.version,
          serverStartTime: data.serverStartTime,
          autoRefreshInSeconds: 3
        });

        this.isChecking = false;
        return { hasUpdate: true, newVersion: data.version };
      }
    } catch (err) {
      // Network failure or offline, silently ignore background check
    } finally {
      this.isChecking = false;
    }

    return { hasUpdate: false };
  }

  /**
   * Notify registered listeners and start auto-refresh countdown
   */
  private triggerUpdateNotification(info: {
    currentVersion: string;
    newVersion: string;
    serverStartTime: number;
    autoRefreshInSeconds: number;
  }) {
    // Notify all UI listeners (toast, banner)
    this.listeners.forEach((listener) => {
      try {
        listener(info);
      } catch (e) {
        console.error(e);
      }
    });

    // Auto-refresh after countdown unless user is actively typing in a form
    let remainingSeconds = info.autoRefreshInSeconds;
    
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
    }

    this.countdownTimerId = setInterval(() => {
      remainingSeconds -= 1;
      
      if (remainingSeconds <= 0) {
        clearInterval(this.countdownTimerId);
        this.countdownTimerId = null;

        // If user is actively typing, delay reload by 5 seconds to avoid data loss
        if (this.isUserTyping) {
          setTimeout(() => {
            this.forceHardRefresh();
          }, 5000);
        } else {
          this.forceHardRefresh();
        }
      }
    }, 1000);
  }

  /**
   * Subscribe to new version notifications
   */
  public onUpdateAvailable(listener: VersionUpdateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Force hard reload: clears Cache API, unregisters workers, and reloads
   * with cache-busting timestamp so the browser never serves stale JS/HTML
   */
  public async forceHardRefresh(announce: boolean = true) {
    if (typeof window === 'undefined') return;

    try {
      // 1. Clear any CacheStorage
      if ('caches' in window) {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
      }

      // 2. Unregister all service workers
      await this.cleanupStaleServiceWorkers();

      // 3. Mark update timestamp
      if (announce) {
        sessionStorage.setItem('pms_fresh_update_time', Date.now().toString());
      }
    } catch (e) {
      console.warn('Error clearing caches before reload', e);
    }

    // 4. Force browser to reload with clean timestamp parameter
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('_r', Date.now().toString());
    window.location.replace(currentUrl.toString());
  }

  /**
   * Check if page was just refreshed from an update
   */
  public checkJustUpdated(): boolean {
    if (typeof window === 'undefined') return false;
    const item = sessionStorage.getItem('pms_fresh_update_time');
    if (item) {
      sessionStorage.removeItem('pms_fresh_update_time');
      return true;
    }
    return false;
  }

  public getCurrentVersion(): string {
    return this.currentVersion;
  }
}

export const VersionService = new VersionServiceImpl();
