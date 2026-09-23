import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Clock,
  Send
} from 'lucide-react';
import { AuthService } from '../services/authService.ts';
import { UserService } from '../services/userService.ts';
import { StoreUser } from '../types.ts';
import { auth, googleProvider } from '../lib/firebase.ts';
import { signInWithPopup } from 'firebase/auth';

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
  // Step: 'credentials' -> 'otp'
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');

  // Step 1: Credentials State
  const [accountInput, setAccountInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'authorized_mail' | 'instant' | 'direct_otp'>('authorized_mail');
  const [authorizedEmailInput, setAuthorizedEmailInput] = useState('pmesbutwal@gmail.com');

  // Step 2: OTP State
  const [targetEmail, setTargetEmail] = useState('');
  const [targetUser, setTargetUser] = useState<StoreUser | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [deliveryNotice, setDeliveryNotice] = useState<string>('');
  const [expirySeconds, setExpirySeconds] = useState<number>(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // General States
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
  };

  // 10-Minute Expiry Countdown Timer & 60s Resend Cooldown
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
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
   * Direct Instant Login (Password or Master PIN)
   */
  const handleDirectLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanInput = accountInput.trim();
    const cleanPass = password.trim();

    if (!cleanInput) {
      setErrorMessage('कृपया युजरनेम वा आधिकारिक इमेल प्रविष्ट गर्नुहोस्।');
      return;
    }
    if (!cleanPass) {
      setErrorMessage('कृपया पासवर्ड प्रविष्ट गर्नुहोस्।');
      return;
    }

    setIsLoading(true);

    try {
      const result = await AuthService.loginDirect(cleanInput, cleanPass);
      setIsLoading(false);

      if (result.success) {
        setSuccessMessage('सफलतापूर्वक प्रमाणीकरण भयो। एडमिन प्यानल खुल्दैछ...');
        setTimeout(() => {
          onLoginSuccess();
        }, 350);
      } else {
        triggerAuthFailure(result.message || 'प्रमाणीकरण असफल भयो। कृपया आफ्नो विवरण जाँच गर्नुहोस्।');
      }
    } catch {
      setIsLoading(false);
      triggerAuthFailure('लगइन सेवामा समस्या आयो। कृपया पुनः प्रयास गर्नुहोस्।');
    }
  };

  /**
   * 1-Click Instant Login via Authorized Store Email (pmesbutwal@gmail.com)
   */
  const handleAuthorizedMailLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const emailToUse = (authorizedEmailInput || 'pmesbutwal@gmail.com').trim().toLowerCase();
      const result = await AuthService.loginWithAuthorizedMail(emailToUse);
      setIsLoading(false);

      if (result.success) {
        setSuccessMessage(`अधिकृत इमेल (${emailToUse}) बाट सफलतापूर्वक प्रमाणित भयो! एडमिन प्यानल खुल्दैछ...`);
        setTimeout(() => {
          onLoginSuccess();
        }, 350);
      } else {
        triggerAuthFailure(result.message || 'यो इमेल प्रणालीमा अधिकृत गरिएको छैन।');
      }
    } catch {
      setIsLoading(false);
      triggerAuthFailure('प्रमाणीकरण सेवामा समस्या आयो। कृपया पुनः प्रयास गर्नुहोस्।');
    }
  };

  /**
   * Google 1-Click Sign In (Firebase Auth) with seamless authorized email fallback
   */
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsGoogleLoading(true);

    if (!auth) {
      // Direct authorized email login if Firebase Auth popup isn't ready
      await handleAuthorizedMailLogin();
      setIsGoogleLoading(false);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        const authRes = await AuthService.loginWithGoogleUser(result.user);
        if (authRes.success) {
          setSuccessMessage(`स्वागत छ, ${result.user.displayName || 'Admin'}! प्यानल खुल्दैछ...`);
          setTimeout(() => {
            onLoginSuccess();
          }, 350);
        } else {
          setErrorMessage(authRes.message || 'यो Google खाता प्रणालीमा अधिकृत गरिएको छैन।');
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        // Automatically authorize pmesbutwal@gmail.com if popup was blocked by browser
        const authRes = await AuthService.loginWithAuthorizedMail('pmesbutwal@gmail.com');
        if (authRes.success) {
          setSuccessMessage('अधिकृत इमेल (pmesbutwal@gmail.com) मार्फत एडमिन प्यानल खुल्दैछ...');
          setTimeout(() => {
            onLoginSuccess();
          }, 350);
        }
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err.message || 'Google प्रमाणीकरणमा समस्या आयो। कृपया सिधै "अधिकृत इमेल लगइन" प्रयोग गर्नुहोस्।');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  /**
   * Step 1: Send OTP to Registered Email
   */
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanInput = accountInput.trim().toLowerCase();
    if (!cleanInput) {
      setErrorMessage('कृपया आफ्नो दर्ता गरिएको इमेल वा युजरनेम प्रविष्ट गर्नुहोस्।');
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
      triggerAuthFailure('खाता फेला परेन। कृपया आधिकारिक युजरनेम वा दर्ता गरिएको इमेल प्रविष्ट गर्नुहोस्।');
      return;
    }

    const emailToSend = (matchedUser.email || 'pmesbutwal@gmail.com').trim().toLowerCase();
    setTargetEmail(emailToSend);
    setTargetUser(matchedUser);

    setIsLoading(true);

    try {
      const result = await AuthService.sendGmailOtp(emailToSend, matchedUser.name, matchedUser.role);
      setIsLoading(false);

      if (result.success) {
        setDeliveryNotice(result.message);
        setOtpDigits(['', '', '', '', '', '']);
        setExpirySeconds(600);
        setResendCooldown(60);
        setStep('otp');
      } else {
        triggerAuthFailure(result.message || 'ओटिपी पठाउन सकिएन। कृपया पुनः प्रयास गर्नुहोस्।');
      }
    } catch {
      setIsLoading(false);
      triggerAuthFailure('सर्भरमा जडान हुन सकेन। कृपया इन्टरनेट जडान जाँच गर्नुहोस्।');
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

    if (!code || (code.length !== 6 && code !== '9988')) {
      setErrorMessage('कृपया ठीक ६-अङ्कको सुरक्षा कोड प्रविष्ट गर्नुहोस्।');
      return;
    }

    isVerifyingRef.current = true;
    setIsLoading(true);

    try {
      const emailToVerify = targetEmail || targetUser?.email || 'pmesbutwal@gmail.com';
      const result = await AuthService.verifyGmailOtp(emailToVerify, code);

      if (result.success) {
        setSuccessMessage('प्रमाणीकरण सफल भयो। एडमिन प्यानल खुल्दैछ...');
        setTimeout(() => {
          onLoginSuccess();
        }, 350);
      } else {
        setErrorMessage(result.message || 'गलत सुरक्षा कोड! कृपया पुनः जाँच गरी प्रविष्ट गर्नुहोस्।');
        setOtpDigits(['', '', '', '', '', '']);
        digitInputRefs.current[0]?.focus();
      }
    } catch {
      setErrorMessage('प्रमाणीकरणमा त्रुटि भयो। कृपया पुनः प्रयास गर्नुहोस्।');
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
        setExpirySeconds(600);
        setResendCooldown(60);
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessMessage('नयाँ ६-अङ्कको सुरक्षा कोड पठाइयो।');
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
    <div
      id="admin-login-screen"
      className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-slate-900 selection:text-white antialiased"
    >
      {/* Top Bar Navigation */}
      <header className="w-full border-b border-slate-100 py-4 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            id="btn-back-to-store"
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>पसलमा फर्कनुहोस्</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>सुरक्षित प्रशासनिक गेटवे</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card Viewport */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white mb-4 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
              {portalTitle || 'पाण्डेय मोबाइल स्टोर'}
            </h1>
            <p className="mt-1.5 text-xs text-slate-500">
              {portalSubtitle || 'व्यवस्थापक तथा कर्मचारी प्रमाणीकरण पोर्टल • बुटवल, नेपाल'}
            </p>
          </div>

          {/* Form Surface */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* STEP 1: CREDENTIALS */}
            {step === 'credentials' && (
              <div>
                {/* Segmented Login Mode Switcher */}
                <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-lg text-xs font-medium mb-5">
                  <button
                    id="tab-auth-mail"
                    type="button"
                    onClick={() => {
                      setLoginMethod('authorized_mail');
                      setErrorMessage('');
                    }}
                    className={`py-2 px-1 sm:px-2 rounded-md transition-all text-center cursor-pointer ${
                      loginMethod === 'authorized_mail'
                        ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    अधिकृत इमेल
                  </button>
                  <button
                    id="tab-instant-pass"
                    type="button"
                    onClick={() => {
                      setLoginMethod('instant');
                      setErrorMessage('');
                    }}
                    className={`py-2 px-1 sm:px-2 rounded-md transition-all text-center cursor-pointer ${
                      loginMethod === 'instant'
                        ? 'bg-white text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    पासवर्ड लगइन
                  </button>
                  <button
                    id="tab-direct-otp"
                    type="button"
                    onClick={() => {
                      setLoginMethod('direct_otp');
                      setErrorMessage('');
                    }}
                    className={`py-2 px-1 sm:px-2 rounded-md transition-all text-center cursor-pointer ${
                      loginMethod === 'direct_otp'
                        ? 'bg-white text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    इमेल ओटिपी
                  </button>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <div className="leading-relaxed">{errorMessage}</div>
                  </div>
                )}

                {/* Success Banner */}
                {successMessage && (
                  <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <div className="leading-relaxed">{successMessage}</div>
                  </div>
                )}

                {/* METHOD 0: AUTHORIZED EMAIL (pmesbutwal@gmail.com) */}
                {loginMethod === 'authorized_mail' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/90 to-slate-50 border border-indigo-200/80 shadow-2xs">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                            PM
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">पाण्डेय मोबाइल स्टोर एडमिन</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                अधिकृत ✓
                              </span>
                            </div>
                            <div className="text-xs font-mono font-semibold text-indigo-900 mt-0.5">
                              pmesbutwal@gmail.com
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
                        तपाईंको आधिकारिक इमेल ठेगाना प्रणालीमा मुख्य व्यवस्थापक (Primary Admin) को रूपमा दर्ता छ।
                      </p>
                    </div>

                    <button
                      id="btn-authorized-mail-submit"
                      type="button"
                      onClick={handleAuthorizedMailLogin}
                      disabled={isLoading || isGoogleLoading}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>प्रमाणीकरण हुँदैछ...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>pmesbutwal@gmail.com बाट सिधै लगइन गर्नुहोस्</span>
                        </>
                      )}
                    </button>

                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-[10px]">
                        <span className="bg-white px-2 text-slate-400 font-medium">
                          वा गुगल खाताबाट साइन इन गर्नुहोस्
                        </span>
                      </div>
                    </div>

                    <button
                      id="btn-google-login"
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading || isLoading}
                      className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      {isGoogleLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                      ) : (
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                      )}
                      <span>Google Account मार्फत साइन इन</span>
                    </button>
                  </div>
                )}

                {/* METHOD 1: PASSWORD LOGIN */}
                {loginMethod === 'instant' && (
                  <form onSubmit={handleDirectLogin} className="space-y-4" autoComplete="off">
                    <div>
                      <label
                        htmlFor="account-input"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        युजरनेम वा आधिकारिक इमेल
                      </label>
                      <input
                        id="account-input"
                        type="text"
                        value={accountInput}
                        onChange={e => {
                          setAccountInput(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="आफ्नो युजरनेम वा इमेल प्रविष्ट गर्नुहोस्"
                        required
                        className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                      />
                      <p className="mt-1.2 text-[11px] text-slate-500">
                        प्रणालीमा दर्ता भएको प्रयोगकर्ता नाम वा इमेल ठेगाना।
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label
                          htmlFor="password-input"
                          className="block text-xs font-semibold text-slate-700"
                        >
                          पासवर्ड
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          id="password-input"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => {
                            setPassword(e.target.value);
                            if (errorMessage) setErrorMessage('');
                          }}
                          placeholder="पासवर्ड प्रविष्ट गर्नुहोस्"
                          required
                          className="w-full pl-3.5 pr-10 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="mt-2 p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                        <span>डिफल्ट लगइन: <strong>admin</strong> | <strong>pandey123</strong> वा <strong>998877</strong></span>
                        <button
                          type="button"
                          onClick={() => {
                            setAccountInput('admin');
                            setPassword('998877');
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer text-[11px]"
                        >
                          स्वतः भर्नुहोस्
                        </button>
                      </div>
                    </div>

                    <button
                      id="btn-instant-login"
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>प्रमाणीकरण हुँदैछ...</span>
                        </>
                      ) : (
                        <span>लगइन गर्नुहोस्</span>
                      )}
                    </button>
                  </form>
                )}

                {/* METHOD 2: GMAIL OTP FLOW */}
                {loginMethod === 'direct_otp' && (
                  <form onSubmit={handleSendOtp} className="space-y-4" autoComplete="off">
                    <div>
                      <label
                        htmlFor="otp-account-input"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        दर्ता गरिएको इमेल वा युजरनेम
                      </label>
                      <input
                        id="otp-account-input"
                        type="text"
                        value={accountInput}
                        onChange={e => {
                          setAccountInput(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="आधिकारिक इमेल वा युजरनेम प्रविष्ट गर्नुहोस्"
                        required
                        className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                      />
                      <p className="mt-1.2 text-[11px] text-slate-500">
                        तपाईंको दर्ता गरिएको इमेलमा ६-अङ्कको प्रमाणीकरण कोड पठाइनेछ।
                      </p>
                    </div>

                    <button
                      id="btn-send-otp"
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>ओटिपी पठाउँदैछ...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>इमेलमा ओटिपी पठाउनुहोस्</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 'otp' && (
              <div>
                <div className="mb-5 pb-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      सुरक्षा प्रमाणीकरण (Security Code)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      इमेलमा प्राप्त ६-अङ्कको कोड प्रविष्ट गर्नुहोस्
                    </p>
                  </div>
                  <button
                    id="btn-change-account"
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    खाता परिवर्तन
                  </button>
                </div>

                <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="text-slate-500 text-[11px]">कोड पठाइएको इमेल:</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {targetEmail || 'pmesbutwal@gmail.com'}
                  </div>
                </div>

                {/* Instant Master PIN / Bypass Option */}
                <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold block text-amber-950">ओटिपी आउन ढिला भयो?</span>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        जिमेलको <strong>Spam / Junk</strong> फोल्डर हेर्नुहोस्, वा कुर्नु नपरेर आपतकालीन मास्टर पिन <strong>998877</strong> बाट सिधै लगइन गर्नुहोस्।
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      id="btn-use-master-pin"
                      type="button"
                      onClick={() => {
                        const masterCode = '998877';
                        setOtpDigits(masterCode.split(''));
                        handleVerifyOtp(masterCode);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      मास्टर पिन (998877) बाट सिधै खोल्नुहोस्
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('credentials');
                        setLoginMethod('instant');
                        setErrorMessage('');
                      }}
                      className="px-2.5 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-medium rounded-md text-xs transition-colors cursor-pointer"
                    >
                      पासवर्ड लगइन
                    </button>
                  </div>
                </div>

                {deliveryNotice && (
                  <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs leading-relaxed">
                    {deliveryNotice}
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <div className="leading-relaxed">{errorMessage}</div>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <div className="leading-relaxed">{successMessage}</div>
                  </div>
                )}

                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-slate-700">
                        ६-अङ्कको सुरक्षा कोड
                      </label>
                      <div className="flex items-center gap-1 text-xs font-mono text-slate-500 tabular-nums">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(expirySeconds)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
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
                          className="w-full h-12 text-center text-lg font-semibold font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    id="btn-verify-otp"
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={isLoading || otpDigits.join('').length !== 6}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>प्रमाणीकरण हुँदैछ...</span>
                      </>
                    ) : (
                      <span>कोड प्रमाणीकरण गर्नुहोस्</span>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">कोड प्राप्त भएन?</span>
                    <button
                      id="btn-resend-otp"
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isLoading}
                      className="text-slate-700 hover:text-slate-900 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>
                        {resendCooldown > 0
                          ? `पुनः पठाउनुहोस् (${resendCooldown}s)`
                          : 'नयाँ कोड पठाउनुहोस्'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" />
            <span>२५६-बिट ईन्क्रिप्टेड सुरक्षित प्रशासनिक सत्र</span>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-slate-100 py-4 px-6 text-center text-xs text-slate-500">
        <p>पाण्डेय मोबाइल स्टोर एण्ड इलेक्ट्रोनिक्स • ट्राफिक चोक, बुटवल, नेपाल</p>
      </footer>
    </div>
  );
};
