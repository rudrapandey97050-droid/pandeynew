import React from 'react';
import { MessageCircle } from 'lucide-react';

interface FloatingWhatsAppProps {
  whatsappNumber: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ whatsappNumber }) => {
  return (
    <a
      href={`https://wa.me/977${whatsappNumber}?text=Namaste%20Pandey%20Mobile%20Store%2C%20I%20have%20an%20inquiry%20regarding%20smartphones%20and%20exchange%20valuation.`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-2xl flex items-center space-x-2 transition-all hover:scale-105 group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6 fill-white" />
      <span className="hidden sm:inline-block font-bold text-xs pr-1">Chat on WhatsApp</span>
    </a>
  );
};
