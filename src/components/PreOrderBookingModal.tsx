import React, { useState } from 'react';
import { X, CheckCircle2, ShoppingBag, ShieldCheck, MapPin, Phone } from 'lucide-react';
import { Product } from '../types.ts';
import { DataStorageService } from '../services/dataStorage.ts';
import { formatNPR } from '../utils/formatters.ts';

interface PreOrderBookingModalProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PreOrderBookingModal: React.FC<PreOrderBookingModalProps> = ({
  product,
  onClose,
  onSuccess
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState('');

  if (!product) return null;

  const storeSettings = DataStorageService.getStoreSettings();
  const rawWa = storeSettings.whatsapp || storeSettings.phone1 || '9847460603';
  const cleanWa = rawWa.replace(/[^0-9]/g, '');
  const finalWa = cleanWa.startsWith('977') ? cleanWa : `977${cleanWa}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phoneNumber) {
      alert('Please fill your name and phone number');
      return;
    }

    const order = DataStorageService.addOrder({
      customerName,
      customerPhone: phoneNumber,
      deliveryAddress: address || 'Traffic Chowk, Butwal Counter Pickup',
      items: [
        {
          productId: product.id,
          name: product.name,
          image: product.image,
          quantity: 1,
          price: product.price,
          storage: product.storage,
          color: product.color
        }
      ],
      totalAmount: product.price,
      paymentMethod: 'Store Pickup',
      notes
    });

    setOrderId(order.id);
    setSubmitted(true);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base font-serif">Order / Store Hold Booking</h3>
              <p className="text-xs text-slate-400">Traffic Chowk, Butwal • Pandey Mobile Store</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Phone Reserved Successfully!</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Your device has been reserved at our Traffic Chowk store under Order ID <span className="font-mono font-bold text-indigo-700">{orderId}</span>.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Reserved Model:</span>
                <span className="font-bold text-slate-900">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Price:</span>
                <span className="font-black text-indigo-700">{formatNPR(product.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pickup Location:</span>
                <span className="font-semibold text-slate-800">{storeSettings.address}, {storeSettings.city}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <a
                href={`https://wa.me/${finalWa}?text=Hello%20${encodeURIComponent(storeSettings.storeName)}%2C%20I%20have%20placed%20order%20for%20${encodeURIComponent(product.name)}%20(Order%20ID%3A%20${orderId}).`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl text-center"
              >
                Confirm on WhatsApp
              </a>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            
            {/* Selected Phone Snippet */}
            <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <img src={product.image} alt={product.name} className="w-14 h-14 object-cover rounded-xl" />
              <div>
                <h4 className="font-bold text-slate-900 text-xs">{product.name}</h4>
                <span className="text-sm font-black text-indigo-700">{formatNPR(product.price)}</span>
                <span className="text-[10px] text-slate-500 block">{product.storage} • {product.condition}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bishal Sharma"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                placeholder="e.g. 9847XXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Delivery / Pickup City</label>
              <input
                type="text"
                placeholder="e.g. Traffic Chowk / Golpark / Drivertole, Butwal"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Special Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="Preferred pickup timing or questions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Place Order / Hold
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
