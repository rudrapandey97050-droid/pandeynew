import { AuditLogEntry, AuditLogCategory, AuditLogStatus } from '../types.ts';
import { UserService } from './userService.ts';
import { AuthService } from './authService.ts';

const AUDIT_STORAGE_KEY = 'pms_admin_audit_logs_v1';
const MAX_AUDIT_LOGS = 500;
const AUDIT_EVENT = 'pms_audit_log_changed';

const getClientDevice = (): string => {
  if (typeof window === 'undefined' || !navigator) return 'Server/CLI';
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  if (ua.indexOf('Win') !== -1) os = 'Windows';
  else if (ua.indexOf('Mac') !== -1) os = 'macOS';
  else if (ua.indexOf('Linux') !== -1) os = 'Linux';
  else if (ua.indexOf('Android') !== -1) os = 'Android';
  else if (ua.indexOf('like Mac') !== -1) os = 'iOS';

  let browser = 'Browser';
  if (ua.indexOf('Chrome') !== -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') !== -1) browser = 'Safari';
  else if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
  else if (ua.indexOf('Edge') !== -1) browser = 'Edge';

  return `${browser} on ${os}`;
};

const getInitialSeedLogs = (): AuditLogEntry[] => {
  const now = Date.now();
  return [
    {
      id: `audit-${now - 120000}-01`,
      timestamp: new Date(now - 120000).toISOString(),
      action: 'ADMIN_LOGIN',
      category: 'AUTH',
      userName: 'pmesbutwal@gmail.com',
      role: 'Primary Admin',
      ipOrDevice: getClientDevice(),
      status: 'SUCCESS',
      details: 'व्यवस्थापक पोर्टलमा सफलतापूर्वक लगइन भयो (Admin signed in via Master Credential)'
    },
    {
      id: `audit-${now - 300000}-02`,
      timestamp: new Date(now - 300000).toISOString(),
      action: 'SECURITY_RULE_ACTIVE',
      category: 'SECURITY',
      userName: 'System Security',
      role: 'System',
      ipOrDevice: 'Internal Gateway',
      status: 'SUCCESS',
      details: '२५६-बिट ईन्क्रिप्टेड लगइन प्रणाली तथा मास्टर पिन प्रमाणीकरण सक्रिय गरियो'
    },
    {
      id: `audit-${now - 900000}-03`,
      timestamp: new Date(now - 900000).toISOString(),
      action: 'PRODUCT_CATALOG_SYNC',
      category: 'PRODUCT',
      userName: 'Store Administrator',
      role: 'Primary Admin',
      ipOrDevice: getClientDevice(),
      status: 'SUCCESS',
      details: 'स्मार्टफोन क्याटलग तथा मूल्य सूची सिङ्क सम्पन्न (Catalog initialized)'
    },
    {
      id: `audit-${now - 1800000}-04`,
      timestamp: new Date(now - 1800000).toISOString(),
      action: 'BACKUP_SYNC',
      category: 'SETTINGS',
      userName: 'Cloud Backup Agent',
      role: 'System',
      ipOrDevice: 'Google Drive Connector',
      status: 'SUCCESS',
      details: 'गुगल ड्राइभ ब्याकअप इन्टिग्रेशन सेवा प्रमाणीकरण तयारी अवस्थामा छ'
    }
  ];
};

export class AuditLogService {
  /**
   * Retrieve all audit logs from storage
   */
  static getLogs(): AuditLogEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }

    // Seed default logs if empty
    const initial = getInitialSeedLogs();
    this.saveLogs(initial);
    return initial;
  }

  /**
   * Save audit logs array to localStorage and notify listeners
   */
  private static saveLogs(logs: AuditLogEntry[]): void {
    if (typeof window === 'undefined') return;
    try {
      const trimmed = logs.slice(0, MAX_AUDIT_LOGS);
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(trimmed));
      window.dispatchEvent(new CustomEvent(AUDIT_EVENT, { detail: { count: trimmed.length } }));
    } catch (e) {
      console.error('Failed to save audit logs:', e);
    }
  }

  /**
   * Record a new audit log entry
   */
  static logAction(params: {
    action: string;
    category: AuditLogCategory;
    userName?: string;
    role?: string;
    ipOrDevice?: string;
    status?: AuditLogStatus;
    details: string;
    metadata?: Record<string, any>;
  }): AuditLogEntry {
    const activeUser = UserService.getActiveUser();
    const session = AuthService.getLocalSession();

    const finalUser =
      params.userName ||
      activeUser?.name ||
      session?.name ||
      session?.email ||
      'Store Admin';

    const finalRole =
      params.role ||
      (activeUser?.isPrimaryAdmin ? 'Primary Admin' : activeUser?.role) ||
      session?.role ||
      'Admin';

    const newEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      action: params.action,
      category: params.category,
      userName: finalUser,
      role: finalRole,
      ipOrDevice: params.ipOrDevice || getClientDevice(),
      status: params.status || 'SUCCESS',
      details: params.details,
      metadata: params.metadata
    };

    const existing = this.getLogs();
    const updated = [newEntry, ...existing];
    this.saveLogs(updated);

    return newEntry;
  }

  /**
   * Clear all audit logs
   */
  static clearLogs(): void {
    const activeUser = UserService.getActiveUser();
    const session = AuthService.getLocalSession();
    const clearedBy = activeUser?.name || session?.name || 'Administrator';

    const clearNotice: AuditLogEntry = {
      id: `audit-${Date.now()}-reset`,
      timestamp: new Date().toISOString(),
      action: 'AUDIT_LOG_CLEARED',
      category: 'SECURITY',
      userName: clearedBy,
      role: 'Primary Admin',
      ipOrDevice: getClientDevice(),
      status: 'WARNING',
      details: `अडिट लग इतिहास ${clearedBy} द्वारा खाली गरियो (Audit logs cleared by admin)`
    };

    this.saveLogs([clearNotice]);
  }

  /**
   * Delete a single audit log by ID
   */
  static deleteLog(id: string): void {
    const existing = this.getLogs();
    const filtered = existing.filter(log => log.id !== id);
    this.saveLogs(filtered);
  }

  /**
   * Subscribe to live audit log changes
   */
  static subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback();
    window.addEventListener(AUDIT_EVENT, handler);
    window.addEventListener('storage', e => {
      if (e.key === AUDIT_STORAGE_KEY) {
        callback();
      }
    });
    return () => {
      window.removeEventListener(AUDIT_EVENT, handler);
    };
  }

  /**
   * Export audit logs as downloadable JSON file
   */
  static exportToJson(): void {
    const logs = this.getLogs();
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pms-audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export audit logs as CSV file
   */
  static exportToCsv(): void {
    const logs = this.getLogs();
    const headers = ['ID', 'Date & Time', 'Action', 'Category', 'User', 'Role', 'Status', 'Device', 'Details'];
    const rows = logs.map(l => [
      `"${l.id}"`,
      `"${new Date(l.timestamp).toLocaleString()}"`,
      `"${l.action}"`,
      `"${l.category}"`,
      `"${(l.userName || '').replace(/"/g, '""')}"`,
      `"${(l.role || '').replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${(l.ipOrDevice || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pms-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
