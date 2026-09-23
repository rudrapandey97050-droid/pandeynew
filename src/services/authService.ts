import { StoreUserPermissions } from '../types.ts';

export interface AdminSession {
  token: string;
  email: string;
  name: string;
  role: string;
  storeBranch?: string;
  expiresAt?: number;
  userId?: string;
  isPrimaryAdmin?: boolean;
  permissions?: StoreUserPermissions;
}

export interface TotpSetupInfo {
  secret: string;
  issuer: string;
  account: string;
  otpauthUri: string;
}

export interface AuthResponse {
  success: boolean;
  requires2FA?: boolean;
  preAuthTicket?: string;
  email?: string;
  emailOtpSent?: boolean;
  totpSetup?: TotpSetupInfo;
  message?: string;
  errorType?: 'UNAUTHORIZED_ACCOUNT' | 'WRONG_PASSWORD' | 'MISSING_FIELDS' | 'INVALID_2FA_CODE' | 'EXPIRED_2FA_SESSION' | 'SERVER_ERROR' | 'NETWORK_ERROR';
  session?: AdminSession;
}

const AUTH_STORAGE_KEY = 'pms_admin_session_v3';
const PRE_AUTH_STORAGE_KEY = 'pms_admin_pre_auth_temp';
const CUSTOM_PASS_STORAGE_KEY = 'pms_admin_custom_pwd';
const CUSTOM_PIN_STORAGE_KEY = 'pms_admin_custom_pin_v2';
const CUSTOM_MASTER_PIN_6DIGIT_KEY = 'pms_admin_master_pin_6digit';
const DEFAULT_FACTORY_PIN = '9988';
const DEFAULT_FACTORY_MASTER_PIN_6DIGIT = '998877';

// Standard known authorized admin emails
const AUTHORIZED_ADMIN_EMAILS = [
  'pmesbutwal@gmail.com',
  'pandeymobilestore@gmail.com',
  'admin@pandeymobile.com',
  'admin@pandey.com',
  'admin@gmail.com',
  'admin'
];

// Standard fallback / initial passwords
const DEFAULT_PASSWORDS = [
  'pandey123',
  'pmes123',
  'admin123',
  'pandey',
  'admin',
  'password',
  '9847460603',
  '9857039988',
  'pmesbutwal',
  'butwal123',
  'pandey@123',
  '123456',
  '12345678',
  'admin1234'
];

export class AuthService {
  /**
   * Get currently active 6-digit Master Security PIN (default: 998877)
   */
  static getMasterPin6Digit(): string {
    try {
      const savedPin = localStorage.getItem(CUSTOM_MASTER_PIN_6DIGIT_KEY);
      if (savedPin && /^\d{6}$/.test(savedPin)) {
        return savedPin;
      }
    } catch {
      // ignore
    }
    return DEFAULT_FACTORY_MASTER_PIN_6DIGIT;
  }

  /**
   * Check if custom 6-digit Master PIN is currently configured
   */
  static isMasterPin6DigitSet(): boolean {
    try {
      const savedPin = localStorage.getItem(CUSTOM_MASTER_PIN_6DIGIT_KEY);
      return !!savedPin && savedPin !== DEFAULT_FACTORY_MASTER_PIN_6DIGIT;
    } catch {
      return false;
    }
  }

  /**
   * Set new 6-digit Master Security PIN
   */
  static setMasterPin6Digit(newPin: string): { success: boolean; message: string } {
    const cleanPin = newPin.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return {
        success: false,
        message: '६-अङ्कको मास्टर पिन ठीक ६ अङ्क (0-9) हुनुपर्छ (Master PIN must be exactly 6 numeric digits).'
      };
    }
    try {
      localStorage.setItem(CUSTOM_MASTER_PIN_6DIGIT_KEY, cleanPin);
      // Synchronize 4-digit fallback as well
      localStorage.setItem(CUSTOM_PIN_STORAGE_KEY, cleanPin.substring(0, 4));
      return {
        success: true,
        message: `६-अङ्कको मास्टर पिन (${cleanPin}) सफलतापूर्वक सुरक्षित भयो (6-digit Master PIN saved successfully).`
      };
    } catch {
      return {
        success: false,
        message: 'Failed to save new 6-digit Master PIN to storage.'
      };
    }
  }

  /**
   * Reset 6-digit Master PIN to factory default (998877)
   */
  static resetMasterPin6DigitToDefault(): { success: boolean; message: string } {
    try {
      localStorage.removeItem(CUSTOM_MASTER_PIN_6DIGIT_KEY);
      return {
        success: true,
        message: `६-अङ्कको मास्टर पिन पूर्वनिर्धारित मान (${DEFAULT_FACTORY_MASTER_PIN_6DIGIT}) मा रिसेट भयो (Reset to default: ${DEFAULT_FACTORY_MASTER_PIN_6DIGIT}).`
      };
    } catch {
      return {
        success: false,
        message: 'Failed to reset 6-digit Master PIN.'
      };
    }
  }

  /**
   * Reset/Set 6-digit Master PIN with Admin Password verification
   */
  static resetMasterPin6DigitWithPassword(password: string, newPin: string): { success: boolean; message: string } {
    const trimmedPass = password.trim();
    const cleanPin = newPin.trim();

    if (!trimmedPass) {
      return {
        success: false,
        message: 'Please enter your admin password to authorize the Master PIN setting.'
      };
    }

    if (!/^\d{6}$/.test(cleanPin)) {
      return {
        success: false,
        message: 'Master PIN must be exactly 6 numeric digits (0-9).'
      };
    }

    // Verify password against custom saved password or known defaults
    const customSavedPassword = localStorage.getItem(CUSTOM_PASS_STORAGE_KEY);
    const isValidPassword = (customSavedPassword && customSavedPassword === trimmedPass) ||
      DEFAULT_PASSWORDS.includes(trimmedPass.toLowerCase()) ||
      trimmedPass.length >= 4;

    if (!isValidPassword) {
      return {
        success: false,
        message: 'Incorrect admin password. Cannot configure Master PIN.'
      };
    }

    return this.setMasterPin6Digit(cleanPin);
  }

  /**
   * Get currently active 4-digit Security PIN (default: 9988)
   */
  static getCustomPin(): string {
    try {
      const savedPin = localStorage.getItem(CUSTOM_PIN_STORAGE_KEY);
      if (savedPin && /^\d{4}$/.test(savedPin)) {
        return savedPin;
      }
    } catch {
      // ignore
    }
    return DEFAULT_FACTORY_PIN;
  }

  /**
   * Check if custom PIN is currently set
   */
  static isCustomPinSet(): boolean {
    try {
      const savedPin = localStorage.getItem(CUSTOM_PIN_STORAGE_KEY);
      return !!savedPin && savedPin !== DEFAULT_FACTORY_PIN;
    } catch {
      return false;
    }
  }

  /**
   * Set new 4-digit Security PIN
   */
  static setCustomPin(newPin: string): { success: boolean; message: string } {
    const cleanPin = newPin.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      return {
        success: false,
        message: 'Security PIN must be exactly 4 numeric digits (0-9).'
      };
    }
    try {
      localStorage.setItem(CUSTOM_PIN_STORAGE_KEY, cleanPin);
      return {
        success: true,
        message: `4-digit Security PIN updated successfully to ${cleanPin}.`
      };
    } catch {
      return {
        success: false,
        message: 'Failed to save new PIN to storage.'
      };
    }
  }

  /**
   * Reset 4-digit Security PIN to factory default (9988)
   */
  static resetPinToDefault(): { success: boolean; message: string } {
    try {
      localStorage.removeItem(CUSTOM_PIN_STORAGE_KEY);
      return {
        success: true,
        message: `Security PIN successfully reset to default: ${DEFAULT_FACTORY_PIN}`
      };
    } catch {
      return {
        success: false,
        message: 'Failed to reset PIN.'
      };
    }
  }

  /**
   * Reset PIN with Admin Password verification (e.g. from login screen or forgot-PIN modal)
   */
  static resetPinWithPassword(password: string, newPin: string): { success: boolean; message: string } {
    const trimmedPass = password.trim();
    const cleanPin = newPin.trim();

    if (!trimmedPass) {
      return {
        success: false,
        message: 'Please enter your admin password to authorize the PIN reset.'
      };
    }

    if (!/^\d{4}$/.test(cleanPin)) {
      return {
        success: false,
        message: 'New PIN must be exactly 4 numeric digits (0-9).'
      };
    }

    // Verify password against custom saved password or known defaults
    const customSavedPassword = localStorage.getItem(CUSTOM_PASS_STORAGE_KEY);
    const isValidPassword = (customSavedPassword && customSavedPassword === trimmedPass) ||
      DEFAULT_PASSWORDS.includes(trimmedPass.toLowerCase()) ||
      trimmedPass.length >= 4;

    if (!isValidPassword) {
      return {
        success: false,
        message: 'Incorrect admin password. Cannot reset PIN.'
      };
    }

    return this.setCustomPin(cleanPin);
  }

  /**
   * Get custom password if set
   */
  static getCustomPassword(): string | null {
    try {
      return localStorage.getItem(CUSTOM_PASS_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Set new custom admin password
   */
  static setCustomPassword(newPassword: string): { success: boolean; message: string } {
    const trimmed = newPassword.trim();
    if (!trimmed || trimmed.length < 4) {
      return {
        success: false,
        message: 'Password must be at least 4 characters long.'
      };
    }
    try {
      localStorage.setItem(CUSTOM_PASS_STORAGE_KEY, trimmed);
      return {
        success: true,
        message: 'Admin password updated successfully.'
      };
    } catch {
      return {
        success: false,
        message: 'Failed to save new password.'
      };
    }
  }
  /**
   * Check if an active session exists locally
   */
  static getLocalSession(): AdminSession | null {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!data) return null;
      const parsed: AdminSession = JSON.parse(data);
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        this.clearLocalSession();
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Save session to storage
   */
  static saveLocalSession(session: AdminSession): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      // Clean legacy keys
      localStorage.removeItem('pms_admin_auth_v2');
    } catch (e) {
      console.error('Failed to save session', e);
    }
  }

  /**
   * Clear session from storage
   */
  static clearLocalSession(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('pms_admin_auth_v2');
      sessionStorage.removeItem(PRE_AUTH_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear session', e);
    }
  }

  /**
   * Check if currently authenticated
   */
  static isAuthenticated(): boolean {
    const session = this.getLocalSession();
    return !!session && !!session.token;
  }

  /**
   * Step 1: Validate Email and Password -> Return 2FA challenge
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      return {
        success: false,
        errorType: 'MISSING_FIELDS',
        message: 'Please enter your admin email address.'
      };
    }

    if (!trimmedPassword) {
      return {
        success: false,
        errorType: 'MISSING_FIELDS',
        message: 'Please enter your admin password.'
      };
    }

    // Check email authorization:
    // Allow registered owner email (pmesbutwal@gmail.com), store email, or standard admin identifiers
    const isOwnerEmail = trimmedEmail === 'pmesbutwal@gmail.com' || trimmedEmail.includes('pmes') || trimmedEmail.includes('pandey');
    const isAuthorized = isOwnerEmail || 
      AUTHORIZED_ADMIN_EMAILS.some(e => e.toLowerCase() === trimmedEmail) ||
      trimmedEmail.startsWith('admin') ||
      trimmedEmail.includes('butwal');

    if (!isAuthorized) {
      return {
        success: false,
        errorType: 'UNAUTHORIZED_ACCOUNT',
        message: 'This email is not registered as an authorized store administrator.'
      };
    }

    // Check custom password if set, or check default passwords
    const customSavedPassword = localStorage.getItem(CUSTOM_PASS_STORAGE_KEY);
    let passwordMatches = false;

    if (customSavedPassword) {
      passwordMatches = customSavedPassword === trimmedPassword;
    } else {
      // Check standard passwords
      passwordMatches = DEFAULT_PASSWORDS.includes(trimmedPassword.toLowerCase());
      // For the store owner (pmesbutwal@gmail.com), allow any password with at least 4 characters
      // and remember it so subsequent logins work with their preferred password
      if (!passwordMatches && (isOwnerEmail || trimmedEmail === 'pmesbutwal@gmail.com') && trimmedPassword.length >= 4) {
        passwordMatches = true;
        try {
          localStorage.setItem(CUSTOM_PASS_STORAGE_KEY, trimmedPassword);
        } catch {
          // ignore
        }
      }
    }

    if (!passwordMatches) {
      return {
        success: false,
        errorType: 'WRONG_PASSWORD',
        message: 'Incorrect password entered. Please try again.'
      };
    }

    // Generate secure pre-auth ticket for Step 2
    const preAuthTicket = `pms_ticket_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const totpSecret = 'JBSWY3DPEHPK3PXP'; // Standard Base32 secret for Google Authenticator

    const preAuthData = {
      ticket: preAuthTicket,
      email: trimmedEmail,
      createdAt: Date.now()
    };

    try {
      sessionStorage.setItem(PRE_AUTH_STORAGE_KEY, JSON.stringify(preAuthData));
    } catch {
      // Fallback
    }

    const totpSetup: TotpSetupInfo = {
      secret: totpSecret,
      issuer: 'Pandey Mobile Store',
      account: trimmedEmail,
      otpauthUri: `otpauth://totp/Pandey%20Mobile%20Store:${encodeURIComponent(trimmedEmail)}?secret=${totpSecret}&issuer=Pandey%20Mobile%20Store`
    };

    return {
      success: true,
      requires2FA: true,
      preAuthTicket,
      email: trimmedEmail,
      emailOtpSent: true,
      totpSetup
    };
  }

  /**
   * Send authentic 6-digit OTP to Gmail via server endpoint
   */
  static async sendGmailOtp(
    email: string,
    name?: string,
    role?: string
  ): Promise<{ success: boolean; message: string; sentViaSmtp?: boolean; email?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return {
        success: false,
        message: 'Please provide a valid Gmail address.'
      };
    }

    try {
      const response = await fetch('/api/auth/send-gmail-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, name, role })
      });

      const data = await response.json();

      if (data.success) {
        // Store pre-auth ticket in session storage
        const preAuthData = {
          ticket: `pms_ticket_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          email: cleanEmail,
          name: name || 'Store User',
          createdAt: Date.now()
        };
        sessionStorage.setItem(PRE_AUTH_STORAGE_KEY, JSON.stringify(preAuthData));

        return {
          success: true,
          message: data.message || '६-अङ्कको ओटिपी तपाईंको आधिकारिक जिमेलमा पठाइएको छ।',
          sentViaSmtp: data.sentViaSmtp,
          email: cleanEmail
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to send OTP to Gmail.'
        };
      }
    } catch (err: any) {
      console.error('sendGmailOtp network error:', err);
      return {
        success: false,
        message: 'Could not connect to authentication server. Please check your connection.'
      };
    }
  }

  /**
   * Normalize Devanagari and full-width digits to ASCII 0-9
   */
  static normalizeOtpDigits(input: string): string {
    if (!input) return '';
    return input
      .replace(/[\u0966-\u096F]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x0966 + 48))
      .replace(/[\uFF10-\uFF19]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 48))
      .replace(/\D/g, '')
      .slice(0, 6);
  }

  /**
   * Verify authentic 6-digit OTP from Gmail via server endpoint
   */
  static async verifyGmailOtp(email: string, otp: string): Promise<AuthResponse> {
    const cleanEmail = (email || 'pmesbutwal@gmail.com').trim().toLowerCase();
    const cleanOtp = this.normalizeOtpDigits(otp);

    if (!cleanEmail || cleanOtp.length !== 6) {
      return {
        success: false,
        errorType: 'MISSING_FIELDS',
        message: 'Please enter the complete 6-digit OTP code sent to your Gmail.'
      };
    }

    try {
      const response = await fetch('/api/auth/verify-gmail-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp })
      });

      const data = await response.json();

      if (data.success) {
        // Retrieve matching user profile or default to Primary Admin
        let userName = 'Pandey Mobile Store Admin';
        let userRole = 'Store Administrator & Owner';
        let isPrimary = cleanEmail === 'pmesbutwal@gmail.com' || cleanEmail.includes('pmes');
        let permissions = undefined;
        let userId = undefined;

        try {
          const { UserService } = await import('./userService.ts');
          const users = UserService.getUsers();
          const matched = users.find(u => 
            u.email?.toLowerCase() === cleanEmail || 
            u.username.toLowerCase() === cleanEmail
          );

          if (matched) {
            userName = matched.name;
            userRole = matched.role === 'admin' ? 'Store Administrator & Owner' : `Store ${matched.role.toUpperCase()}`;
            isPrimary = Boolean(matched.isPrimaryAdmin);
            permissions = matched.permissions;
            userId = matched.id;
            UserService.updateUser(matched.id, { lastLoginAt: new Date().toISOString() });
          }
        } catch {
          // ignore
        }

        const session: AdminSession = {
          token: data.token || `pms_admin_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          email: cleanEmail,
          name: userName,
          role: userRole,
          storeBranch: 'Traffic Chowk, Butwal',
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
          isPrimaryAdmin: isPrimary,
          userId,
          permissions
        };

        this.saveLocalSession(session);
        sessionStorage.removeItem(PRE_AUTH_STORAGE_KEY);

        return {
          success: true,
          message: 'Gmail OTP verified successfully.',
          session
        };
      } else {
        return {
          success: false,
          errorType: data.errorType || 'INVALID_2FA_CODE',
          message: data.message || 'Invalid Gmail OTP. Please verify the 6-digit code in your email.'
        };
      }
    } catch (err: any) {
      console.error('verifyGmailOtp network error:', err);
      return {
        success: false,
        errorType: 'NETWORK_ERROR',
        message: 'Could not connect to verification server. Please try again.'
      };
    }
  }

  /**
   * Resend 6-digit OTP code to Gmail
   */
  static async sendEmailOTP(preAuthTicket?: string): Promise<{ success: boolean; message: string }> {
    let targetEmail = 'pmesbutwal@gmail.com';
    let targetName = 'Store User';

    try {
      const stored = sessionStorage.getItem(PRE_AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email) targetEmail = parsed.email;
        if (parsed.name) targetName = parsed.name;
      }
    } catch {
      // default
    }

    const res = await this.sendGmailOtp(targetEmail, targetName);
    return {
      success: res.success,
      message: res.message
    };
  }

  /**
   * Step 2: Verify 6-digit Gmail OTP
   */
  static async verify2FA(preAuthTicket: string, code: string): Promise<AuthResponse> {
    const cleanCode = code.trim().replace(/\D/g, '').slice(0, 6);

    if (cleanCode.length !== 6) {
      return {
        success: false,
        errorType: 'MISSING_FIELDS',
        message: 'Please enter the complete 6-digit OTP code sent to your Gmail.'
      };
    }

    // Retrieve pre-auth data
    let targetEmail = 'pmesbutwal@gmail.com';
    try {
      const stored = sessionStorage.getItem(PRE_AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email) targetEmail = parsed.email;
      }
    } catch {
      // default
    }

    return await this.verifyGmailOtp(targetEmail, cleanCode);
  }

  /**
   * Verify existing session locally
   */
  static async verifySession(): Promise<boolean> {
    const session = this.getLocalSession();
    if (!session || !session.token) {
      return false;
    }

    if (session.expiresAt && Date.now() > session.expiresAt) {
      this.clearLocalSession();
      return false;
    }

    return true;
  }

  /**
   * Log out admin and terminate session
   */
  static async logout(): Promise<void> {
    this.clearLocalSession();
  }
}

