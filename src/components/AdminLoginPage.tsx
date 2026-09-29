import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { AuthService } from '../services/authService.ts';

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
  const [accountInput, setAccountInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Direct secure admin login using username/email and password or master PIN
   */
  const handleLogin = async (e?: React.FormEvent) => {
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
      setErrorMessage('कृपया पासवर्ड वा मास्टर सुरक्षा पिन प्रविष्ट गर्नुहोस्।');
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
        setErrorMessage(result.message || 'प्रमाणीकरण असफल भयो। कृपया आफ्नो विवरण जाँच गर्नुहोस्।');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('लगइन सेवामा समस्या आयो। कृपया पुनः प्रयास गर्नुहोस्।');
    }
  };

  return (
    <div
      id="admin-login-page"
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-slate-900 selection:text-white antialiased"
    >
      {/* Top Bar Navigation */}
      <header className="w-full bg-white border-b border-slate-200/80 py-4 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            id="btn-back-to-store"
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>पसलमा फर्कनुहोस्</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-800 font-semibold">सुरक्षित प्रशासनिक गेटवे</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 text-white mb-4 shadow-md">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {portalTitle || 'पाण्डेय मोबाइल स्टोर'}
            </h1>
            <p className="mt-1.5 text-xs text-slate-600 max-w-sm mx-auto">
              {portalSubtitle || 'व्यवस्थापक तथा कर्मचारी सुरक्षित लगइन पोर्टल • बुटवल, नेपाल'}
            </p>
          </div>

          {/* Form Surface */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="leading-relaxed font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <div className="leading-relaxed font-medium">{successMessage}</div>
              </div>
            )}

            {/* Direct Credential Login Form */}
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div>
                <label
                  htmlFor="account-input"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  युजरनेम वा आधिकारिक इमेल
                </label>
                <div className="relative">
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
                    autoFocus
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  प्रणालीमा दर्ता भएको प्रयोगकर्ता नाम वा इमेल (उदा: admin वा pmesbutwal@gmail.com)।
                </p>
              </div>

              <div>
                <label
                  htmlFor="password-input"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  पासवर्ड वा मास्टर सुरक्षा पिन
                </label>
                <div className="relative">
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="पासवर्ड वा ६-अङ्कको पिन प्रविष्ट गर्नुहोस्"
                    required
                    className="w-full pl-10 pr-10 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                    title={showPassword ? 'पासवर्ड लुकाउनुहोस्' : 'पासवर्ड देखाउनुहोस्'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  आफ्नो व्यवस्थापक पासवर्ड वा ६-अङ्कको मास्टर सुरक्षा पिन प्रविष्ट गर्नुहोस्।
                </p>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>प्रमाणीकरण हुँदैछ...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>लगइन गर्नुहोस्</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>२५६-बिट ईन्क्रिप्टेड सुरक्षित प्रशासनिक लगइन</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <p>पाण्डेय मोबाइल स्टोर एण्ड इलेक्ट्रोनिक्स • ट्राफिक चोक, बुटवल, नेपाल</p>
      </footer>
    </div>
  );
};
