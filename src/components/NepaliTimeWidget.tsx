import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const NepaliTimeWidget: React.FC = () => {
  const [nepaliTime, setNepaliTime] = useState('');
  const [nepaliDate, setNepaliDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Nepal is UTC+5:45
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const nptTime = new Date(utcTime + 3600000 * 5.75);

      const timeStr = nptTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      const dateStr = nptTime.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      setNepaliTime(timeStr);
      setNepaliDate(dateStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200">
      <Clock className="w-3.5 h-3.5 text-indigo-600" />
      <span className="font-bold text-slate-800 font-mono">{nepaliTime}</span>
      <span className="text-slate-400">|</span>
      <span>{nepaliDate} (Nepal Time)</span>
    </div>
  );
};
