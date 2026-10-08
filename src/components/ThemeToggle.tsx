import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'compact';
  className?: string;
  showText?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
  showText = false
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        title={isDark ? 'लाइट मोडमा जानुहोस् (Light Mode)' : 'डार्क मोडमा जानुहोस् (Dark Mode)'}
        className={`flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full transition-all cursor-pointer ${
          isDark
            ? 'bg-slate-800 text-amber-300 border border-slate-700 hover:bg-slate-750'
            : 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-100'
        } ${className}`}
      >
        {isDark ? (
          <>
            <Sun className="w-3 h-3 text-amber-400 animate-spin-slow" />
            <span>लाइट</span>
          </>
        ) : (
          <>
            <Moon className="w-3 h-3 text-indigo-600" />
            <span>डार्क</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
          isDark
            ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        } ${className}`}
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-amber-400" />
            <span>लाइट मोड (Light)</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-indigo-600" />
            <span>डार्क मोड (Dark)</span>
          </>
        )}
      </button>
    );
  }

  // Standard icon variant
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode (लाइट मोड)' : 'Switch to Dark Mode (डार्क मोड)'}
      className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center relative group ${
        isDark
          ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-400 border border-slate-700/60 shadow-xs'
          : 'bg-slate-100/90 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-xs'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center transition-transform group-active:scale-90">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-all transform rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 group-hover:text-indigo-600 transition-all transform rotate-0 hover:-rotate-12" />
        )}
      </div>

      {showText && (
        <span className="ml-1.5 text-[11px] font-semibold hidden sm:inline">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
