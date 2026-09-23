import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Smartphone,
  Loader2,
  KeyRound,
  CheckCircle2,
  RotateCcw,
  Shield,
  Clock,
  UserCheck,
  Send,
  Inbox,
  X
} from 'lucide-react';
import { AuthService } from '../services/authService.ts';
import { UserService } from '../services/userService.ts';
import { StoreUser } from '../types.ts';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onBackToStore: () => void;
  portalTitle?: string;
  portalSubtitle?: string;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBackToStore,
  portalTitle,
  portalSubtitle
}) => {
  // Step: 'credentials' (Enter Gmail/Username & Password) -> 'otp' (Enter 6-digit Gmail OTP)
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');

  // Step 1: Credentials State
  const [accountInput, setAccountInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'direct_otp' | 'password_otp'>('direct_otp');

  // Step 2: OTP State
  const [targetEmail, setTargetEmail] = useState('');
  const [targetUser, setTargetUser] = useState<StoreUser | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [deliveryNotice, setDeliveryNotice] = useState<string>('');
  const [sentViaSmtp, setSentViaSmtp] = useState<boolean>(false);
  const [expirySeconds, setExpirySeconds] = useState<number>(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // General States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [attemptKey, setAttemptKey] = useState<number>(0);

  const isVerifyingRef = useRef(false);
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Helper to normalize Devanagari / full-width digits to ASCII 0-9
  const normalizeDigit = (val: string): string => {
    if (!val) return '';
    return val
      .replace(/[\u0966-\u096F]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x0966 + 48))
      .replace(/[\uFF10-\uFF19]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 48))
      .replace(/\D/g, '');
  };

  const triggerAuthFailure = (msg: string) => {
    setErrorMessage(msg);
    setAccountInput('');
    setPassword('');
    setAttemptKey(prev => prev + 1);
  };

  // 10-Minute Expiry Countdown Timer & 60s Resend Cooldown
  useEffect(() => {
    let timer: any = null;
    if (step === 'otp') {
      timer = setInterval(() => {
        setExpirySeconds(prev => (prev > 0 ? prev - 1 : 0));
        setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step]);

  // Auto focus first OTP input when reaching step 'otp'
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  /**
   * Step 1: Send OTP to Gmail
   */
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanInput = accountInput.trim().toLowerCase();
    if (!cleanInput) {
      setErrorMessage('कृपया आफ्नो दर्ता गरिएको जिमेल वा युजरनेम प्रविष्ट गर्नुहोस् (Please enter your registered Gmail or username).');
      return;
    }

    // Identify user in UserService
    const users = UserService.getUsers();
    let matchedUser: StoreUser | undefined = users.find(u =>
      u.email?.toLowerCase() === cleanInput ||
      u.username.toLowerCase() === cleanInput ||
      u.phone === cleanInput
    );

    // Primary admin alias resolution
    if (!matchedUser && (cleanInput === 'admin' || cleanInput === 'pmes' || cleanInput.includes('pmesbutwal') || cleanInput === 'pandey')) {
      matchedUser = users.find(u => u.isPrimaryAdmin) || {
        id: 'user_primary_admin',
        name: 'Pandey Mobile Store (Primary Admin)',
        username: 'admin',
        email: 'pmesbutwal@gmail.com',
        phone: '9857039988',
        role: 'admin',
        pin: '9988',
        password: AuthService.getCustomPassword() || 'pandey123',
        permissions: { ...UserService.getActiveUser()?.permissions } as any,
        status: 'active',
        createdAt: '2025-01-01',
        isPrimaryAdmin: true,
        avatarColor: 'bg-indigo-600'
      };
    }

    if (!matchedUser) {
      triggerAuthFailure(
        'खाता फेला परेन। कृपया आफ्नो आधिकारिक जिमेल वा युजरनेम प्रविष्ट गर्नुहोस् (Account not found. Please enter your authorized store Gmail).'
      );
      return;
    }

    if (matchedUser.status !== 'active') {
      triggerAuthFailure('यो खाता हाल निष्क्रिय गरिएको छ। कृपया पसल सञ्चालकलाई सम्पर्क गर्नुहोस् (Account is deactivated).');
      return;
    }

    // If password method is selected, verify password
    if (loginMethod === 'password_otp') {
      const cleanPass = password.trim();
      if (!cleanPass) {
        setErrorMessage('कृपया आफ्नो पासवर्ड प्रविष्ट गर्नुहोस् (Please enter your password).');
        return;
      }

      const passMatches = matchedUser.password === cleanPass;
      const customMatches = matchedUser.isPrimaryAdmin && (cleanPass === AuthService.getCustomPassword() || cleanPass === 'pandey123');

      if (!passMatches && !customMatches) {
        triggerAuthFailure('गलत पासवर्ड! कृपया सही पासवर्ड प्रविष्ट गर्नुहोस् (Incorrect password).');
        return;
      }
    }

    // Determine target Gmail
    const emailToSend = (matchedUser.email || 'pmesbutwal@gmail.com').trim().toLowerCase();
    setTargetEmail(emailToSend);
    setTargetUser(matchedUser);

    setIsLoading(true);

    try {
      const result = await AuthService.sendGmailOtp(emailToSend, matchedUser.name, matchedUser.role);
      setIsLoading(false);

      if (result.success) {
        setSentViaSmtp(!!result.sentViaSmtp);
        setDeliveryNotice(result.message);
        setOtpDigits(['', '', '', '', '', '']);
        setExpirySeconds(600);
        setResendCooldown(60);
        setStep('otp');
      } else {
        triggerAuthFailure(result.message || 'ओटिपी पठाउन असफल भयो। कृपया पुन: प्रयास गर्नुहोस्।');
      }
    } catch {
      setIsLoading(false);
      triggerAuthFailure('सर्भरमा जडान हुन सकेन। कृपया पुन: प्रयास गर्नुहोस्।');
    }
  };

  /**
   * Step 2: Verify 6-digit OTP
   */
  const handleVerifyOtp = async (codeToVerify?: string) => {
    if (isVerifyingRef.current) return;
    const rawCode = codeToVerify || otpDigits.join('');
    const code = normalizeDigit(rawCode);
    setErrorMessage('');
    setSuccessMessage('');

    if (!code || code.length !== 6) {
      setErrorMessage('कृपया ठीक ६-अङ्कको ओटिपी प्रविष्ट गर्नुहोस् (Please enter all 6 digits).');
      return;
    }

    if (expirySeconds <= 0) {
      setErrorMessage('ओटिपीको समय समाप्त भइसकेको छ। कृपया नयाँ कोड पठाउनुहोस् (OTP expired. Request a new code).');
      return;
    }

    isVerifyingRef.current = true;
    setIsLoading(true);

    try {
      const emailToVerify = targetEmail || targetUser?.email || 'pmesbutwal@gmail.com';
      const result = await AuthService.verifyGmailOtp(emailToVerify, code);

      if (result.success) {
        setSuccessMessage('ओटिपी सफलतापूर्वक प्रमाणित भयो! पोर्टल खुल्दैछ...');
        setTimeout(() => {
          onLoginSuccess();
        }, 600);
      } else {
        setErrorMessage(result.message || 'गलत ओटिपी कोड! कृपया आफ्नो जिमेल जाँच गरी पुनः प्रयास गर्नुहोस्।');
        setOtpDigits(['', '', '', '', '', '']);
        digitInputRefs.current[0]?.focus();
      }
    } catch {
      setErrorMessage('प्रमाणीकरणमा त्रुटि भयो। कृपया पुन: प्रयास गर्नुहोस्।');
    } finally {
      setIsLoading(false);
      isVerifyingRef.current = false;
    }
  };

  /**
   * Resend OTP Handler
   */
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading || isVerifyingRef.current) return;
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const emailToSend = targetEmail || targetUser?.email || 'pmesbutwal@gmail.com';
      const result = await AuthService.sendGmailOtp(
        emailToSend,
        targetUser?.name || 'Store User',
        targetUser?.role || 'admin'
      );
      setIsLoading(false);

      if (result.success) {
        setSentViaSmtp(!!result.sentViaSmtp);
        setExpirySeconds(600);
        setResendCooldown(60);
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessMessage('नयाँ ६-अङ्कको ओटिपी जिमेलमा पठाइयो (New OTP sent).');
        digitInputRefs.current[0]?.focus();
      } else {
        setErrorMessage(result.message || 'ओटिपी पुन: पठाउन सकिएन।');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('सर्भरमा जडान हुन सकेन।');
    }
  };

  /**
   * Digit inputs handling
   */
  const handleDigitChange = (index: number, value: string) => {
    if (errorMessage) setErrorMessage('');

    // Handle multi-character paste or autofill
    const normalizedInput = normalizeDigit(value);
    if (normalizedInput.length > 1) {
      const pasted = normalizedInput.slice(0, 6).split('');
      const nextDigits = ['', '', '', '', '', ''];
      pasted.forEach((ch, idx) => {
        if (idx < 6) nextDigits[idx] = ch;
      });
      setOtpDigits(nextDigits);

      if (pasted.length === 6) {
        handleVerifyOtp(pasted.join(''));
      } else {
        digitInputRefs.current[Math.min(pasted.length, 5)]?.focus();
      }
      return;
    }

    const cleanChar = normalizeDigit(value).slice(-1);
    const updated = [...otpDigits];
    updated[index] = cleanChar;
    setOtpDigits(updated);

    if (cleanChar && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }

    // Auto submit safely ONLY when all 6 distinct boxes are filled
    if (cleanChar && updated.every(d => Boolean(d)) && updated.join('').length === 6) {
      handleVerifyOtp(updated.join(''));
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div id="admin-login-screen" className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-slate-100">
      {/* Ambient background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Back to store navigation */}
        <button
          id="btn-back-to-store"
          type="button"
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>पसलमा फर्कनुहोस् (Back to Store)</span>
        </button>

        {/* Store Brand Badge */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-xl shadow-indigo-500/20 mb-4 border border-indigo-400/30">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {portalTitle || 'Pandey Mobile Store'}
          </h1>
          <p className="mt-1 text-sm text-indigo-300 font-medium">
            {portalSubtitle || 'Admin & Staff Security Gateway • Traffic Chowk, Butwal'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl border border-slate-800 sm:px-10">
          {/* STEP 1: CREDENTIALS / ACCOUNT INPUT */}
          {step === 'credentials' && (
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-indigo-400" />
                      <span>खाता प्रमाणीकरण (Account Sign-In)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      जिमेल ओटिपी मार्फत सुरक्षित लगइन गर्नुहोस्
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-semibold rounded-full border border-indigo-500/20">
                    Gmail OTP
                  </span>
                </div>

                {/* Login Method Toggle */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    id="tab-direct-otp"
                    type="button"
                    onClick={() => setLoginMethod('direct_otp')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      loginMethod === 'direct_otp'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>सिधा जिमेल ओटिपी</span>
                  </button>
                  <button
                    id="tab-password-otp"
                    type="button"
                    onClick={() => setLoginMethod('password_otp')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      loginMethod === 'password_otp'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>पासवर्ड + ओटिपी</span>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4" autoComplete="off" noValidate>
                {/* Account / Gmail field */}
                <div>
                  <label htmlFor="account-input" className="block text-xs font-medium text-slate-300 mb-1.5">
                    दर्ता गरिएको जिमेल वा युजरनेम (Registered Gmail / Username)
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      key={`auth-acc-${attemptKey}`}
                      id="account-input"
                      name={`admin_cred_${attemptKey}`}
                      type="text"
                      value={accountInput}
                      onChange={e => {
                        setAccountInput(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="आफ्नो जिमेल वा युजरनेम प्रविष्ट गर्नुहोस्"
                      required
                      autoComplete="one-time-code"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                      className={`no-autofill-preview block w-full pl-10 pr-10 py-3 rounded-xl text-white placeholder:text-slate-500 placeholder:select-none text-sm transition-all duration-200 focus:outline-none ${
                        errorMessage
                          ? 'bg-rose-950/20 border border-rose-500/50 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                          : 'bg-slate-950/80 border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                    />
                    {accountInput && (
                      <button
                        type="button"
                        onClick={() => setAccountInput('')}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                        title="Clear"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    आफ्नो दर्ता गरिएको आधिकारिक खाता विवरण प्रविष्ट गर्नुहोस्
                  </p>
                </div>

                {/* Password field if password method chosen */}
                {loginMethod === 'password_otp' && (
                  <div>
                    <label htmlFor="password-input" className="block text-xs font-medium text-slate-300 mb-1.5">
                      पासवर्ड (Account Password)
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        key={`auth-pass-${attemptKey}`}
                        id="password-input"
                        name={`admin_secret_${attemptKey}`}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="आफ्नो खाताको पासवर्ड हाल्नुहोस्"
                        required
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-form-type="other"
                        className={`no-autofill-preview block w-full pl-10 pr-10 py-3 rounded-xl text-white placeholder:text-slate-500 placeholder:select-none text-sm transition-all duration-200 focus:outline-none ${
                          errorMessage
                            ? 'bg-rose-950/20 border border-rose-500/50 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                            : 'bg-slate-950/80 border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button
                  id="btn-send-otp"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>ओटिपी पठाउँदैछ (Sending OTP)...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>जिमेलमा ६-अङ्कको ओटिपी पठाउनुहोस् (Send Gmail OTP)</span>
                    </>
                  )}
                </button>
              </form>

              {/* Security guarantee notice */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
                <div className="inline-flex items-center gap-2 text-xs text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>वास्तविक जिमेल ओटिपी प्रमाणीकरण • सुरक्षित दुई-चरण सुरक्षा</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GMAIL OTP VERIFICATION */}
          {step === 'otp' && (
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <Inbox className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">
                        जिमेल ओटिपी प्रमाणीकरण (Gmail OTP Verification)
                      </h2>
                      <p className="text-xs text-slate-400">
                        तपाईंको जिमेलमा प्राप्त ६-अङ्कको कोड
                      </p>
                    </div>
                  </div>
                  <button
                    id="btn-change-account"
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setAccountInput('');
                      setPassword('');
                      setTargetEmail('');
                      setTargetUser(null);
                      setErrorMessage('');
                      setSuccessMessage('');
                      setAttemptKey(prev => prev + 1);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    खाता फेर्नुहोस्
                  </button>
                </div>

                {/* Secure Session Indicator (No email preview leak) */}
                <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        दुई-चरण प्रमाणीकरण (Two-Factor Authentication)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        ओटिपी कोड तपाईंको आधिकारिक जिमेलमा पठाइएको छ
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 text-[10px] font-semibold rounded-md border border-indigo-500/20 shrink-0">
                    Gmail OTP
                  </span>
                </div>
              </div>

              {/* Delivery notification notice */}
              {deliveryNotice && (
                <div className="mb-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2.5 text-indigo-200 text-xs leading-relaxed">
                  <Inbox className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <div>{deliveryNotice}</div>
                    <div className="text-[11px] text-indigo-300/80 mt-1">
                      यदि इनबक्समा नदेखिएमा कृपया स्पाम (Spam) फोल्डर पनि जाँच गर्नुहोस्।
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{successMessage}</div>
                </div>
              )}

              {/* 6 Digit Input Boxes */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium text-slate-300">
                      ६-अङ्कको ओटिपी कोड (6-Digit OTP Code):
                    </label>
                    <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(expirySeconds)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => {
                          digitInputRefs.current[index] = el;
                        }}
                        id={`otp-input-${index}`}
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={6}
                        value={digit}
                        onChange={e => handleDigitChange(index, e.target.value)}
                        onKeyDown={e => handleDigitKeyDown(index, e)}
                        className="w-full h-13 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
                      />
                    ))}
                  </div>
                </div>

                {/* Primary Verify Button */}
                <button
                  id="btn-verify-otp"
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={isLoading || otpDigits.join('').length !== 6}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>प्रमाणीकरण हुँदैछ (Verifying OTP)...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>प्रमाणीकरण गरी लगइन गर्नुहोस् (Verify & Enter Portal)</span>
                    </>
                  )}
                </button>

                {/* Resend OTP button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">कोड प्राप्त भएन?</span>
                  <button
                    id="btn-resend-otp"
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold disabled:text-slate-600 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {resendCooldown > 0
                        ? `पुन: पठाउनुहोस् (${resendCooldown}s)`
                        : 'नयाँ ओटिपी पठाउनुहोस् (Resend OTP)'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500">
          <p>Pandey Mobile Store & Electronics • Traffic Chowk, Butwal, Nepal</p>
          <p className="mt-1 text-[11px] text-slate-600">
            Helpline: 9847460603 / 9857039988 • Official: pmesbutwal@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
};
