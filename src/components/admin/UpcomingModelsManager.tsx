import React, { useState, useEffect } from 'react';
import { UpcomingModel, PreBookingRequest, PopupSettings, PreBookingStatus } from '../../types.ts';
import { DataStorageService } from '../../services/dataStorage.ts';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Phone,
  MessageSquare,
  Eye,
  Settings,
  Calendar,
  Layers,
  Save,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  Wand2
} from 'lucide-react';
import { generateProductDescription, extractModelFromUrlOrFilename } from '../../utils/productDescriptionGenerator.ts';
import { generateSmartProductDescription } from '../../services/aiDescriptionService.ts';

interface UpcomingModelsManagerProps {
  onRefresh?: () => void;
}

export const UpcomingModelsManager: React.FC<UpcomingModelsManagerProps> = ({ onRefresh }) => {
  const [subTab, setSubTab] = useState<'models' | 'bookings' | 'settings'>('models');
  
  // Data states
  const [models, setModels] = useState<UpcomingModel[]>([]);
  const [bookings, setBookings] = useState<PreBookingRequest[]>([]);
  const [popupSettings, setPopupSettings] = useState<PopupSettings>(() => DataStorageService.getPopupSettings());
  
  // Model Edit / Add modal
  const [isEditingModel, setIsEditingModel] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  
  // Model Form States
  const [brand, setBrand] = useState('Apple');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [badge, setBadge] = useState('COMING SOON');
  const [image, setImage] = useState('');
  const [expectedLaunchDate, setExpectedLaunchDate] = useState('');
  const [expectedPrice, setExpectedPrice] = useState<string>('');
  const [expectedPriceText, setExpectedPriceText] = useState('');
  const [description, setDescription] = useState('');
  const [keyFeaturesText, setKeyFeaturesText] = useState('');
  const [colorsText, setColorsText] = useState('');
  const [storageVariantsText, setStorageVariantsText] = useState('');
  const [isFeaturedInPopup, setIsFeaturedInPopup] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [specsList, setSpecsList] = useState<{ label: string; value: string }[]>([
    { label: 'Display', value: '' },
    { label: 'Processor', value: '' },
    { label: 'Rear Cameras', value: '' },
    { label: 'Battery', value: '' }
  ]);

  // Bookings Filter & Search
  const [bookingSearch, setBookingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<PreBookingRequest | null>(null);

  // Deletion modals & Feedback
  const [modelToDelete, setModelToDelete] = useState<{ id: string; name: string } | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Settings Feedback
  const [settingsSaved, setSettingsSaved] = useState(false);

  const loadData = () => {
    setModels(DataStorageService.getUpcomingModels());
    setBookings(DataStorageService.getPreBookings());
    setPopupSettings(DataStorageService.getPopupSettings());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Form for New Model
  const handleOpenAdd = () => {
    setEditingModelId(null);
    setBrand('Apple');
    setName('');
    setSlug('');
    setTagline('');
    setBadge('COMING SOON');
    setImage('https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80');
    setExpectedLaunchDate('Expected Late 2026');
    setExpectedPrice('');
    setExpectedPriceText('Price Coming Soon');
    setDescription('');
    setKeyFeaturesText('Next-Gen Processor\nUnder-Display Face ID\nEnhanced Periscope Zoom');
    setColorsText('Natural Titanium, Desert Titanium, Deep Blue, Space Black');
    setStorageVariantsText('256GB, 512GB, 1TB');
    setIsFeaturedInPopup(true);
    setDisplayOrder(models.length + 1);
    setIsActive(true);
    setSpecsList([
      { label: 'Display', value: '6.9" Super Retina OLED, 120Hz LTPO' },
      { label: 'Processor', value: 'Next-Gen Flagship Chipset' },
      { label: 'Rear Cameras', value: 'Triple 48MP Periscope Matrix' },
      { label: 'Battery', value: '4,850 mAh with Fast MagSafe Charging' }
    ]);
    setIsEditingModel(true);
  };

  // Open Form for Edit Model
  const handleOpenEdit = (m: UpcomingModel) => {
    setEditingModelId(m.id);
    setBrand(m.brand);
    setName(m.name);
    setSlug(m.slug);
    setTagline(m.tagline || '');
    setBadge(m.badge || 'COMING SOON');
    setImage(m.image);
    setExpectedLaunchDate(m.expectedLaunchDate);
    setExpectedPrice(m.expectedPrice ? m.expectedPrice.toString() : '');
    setExpectedPriceText(m.expectedPriceText || '');
    setDescription(m.description || '');
    setKeyFeaturesText((m.keyFeatures || []).join('\n'));
    setColorsText((m.availableColors || []).join(', '));
    setStorageVariantsText((m.storageVariants || []).join(', '));
    setIsFeaturedInPopup(m.isFeaturedInPopup);
    setDisplayOrder(m.displayOrder || 1);
    setIsActive(m.isActive);
    setSpecsList(m.specs && m.specs.length > 0 ? [...m.specs] : [
      { label: 'Display', value: '' },
      { label: 'Processor', value: '' },
      { label: 'Rear Cameras', value: '' }
    ]);
    setIsEditingModel(true);
  };

  const handleSaveModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedKeyFeatures = keyFeaturesText
      .split('\n')
      .map(k => k.trim())
      .filter(Boolean);

    const parsedColors = colorsText
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    const parsedVariants = storageVariantsText
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

    const validSpecs = specsList.filter(s => s.label.trim() && s.value.trim());

    let finalImage = image.trim();
    if (!finalImage) {
      const bLower = brand.toLowerCase();
      if (bLower.includes('apple') || bLower.includes('iphone')) {
        finalImage = 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80';
      } else if (bLower.includes('samsung')) {
        finalImage = 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80';
      } else {
        finalImage = 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80';
      }
    }

    const payload = {
      brand: brand.trim(),
      name: name.trim(),
      model: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      tagline: tagline.trim() || undefined,
      badge: badge.trim() || 'COMING SOON',
      image: finalImage,
      expectedLaunchDate: expectedLaunchDate.trim(),
      expectedPrice: expectedPrice ? parseFloat(expectedPrice) : undefined,
      expectedPriceText: expectedPriceText.trim() || undefined,
      description: description.trim(),
      keyFeatures: parsedKeyFeatures,
      specs: validSpecs,
      availableColors: parsedColors,
      storageVariants: parsedVariants,
      isFeaturedInPopup,
      displayOrder: Number(displayOrder) || 1,
      isActive
    };

    if (editingModelId) {
      DataStorageService.updateUpcomingModel(editingModelId, payload);
    } else {
      DataStorageService.addUpcomingModel(payload);
    }

    setIsEditingModel(false);
    loadData();
    if (onRefresh) onRefresh();
    showToast(editingModelId ? 'Upcoming model updated successfully!' : 'New upcoming model published!');
  };

  const handleDeleteModel = (id: string, modelName: string) => {
    setModelToDelete({ id, name: modelName });
  };

  const confirmDeleteModel = () => {
    if (!modelToDelete) return;
    const deletedName = modelToDelete.name;
    DataStorageService.deleteUpcomingModel(modelToDelete.id);
    setModelToDelete(null);
    loadData();
    if (onRefresh) onRefresh();
    showToast(`"${deletedName}" successfully removed.`);
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('Restore original upcoming models lineup (iPhone 18 Pro Max, iPhone 17 Air, Galaxy S26 Ultra, etc.)?')) {
      DataStorageService.resetUpcomingModelsToDefault();
      loadData();
      if (onRefresh) onRefresh();
      showToast('Default upcoming models catalog restored.');
    }
  };

  const handleToggleModelActive = (id: string, current: boolean) => {
    DataStorageService.updateUpcomingModel(id, { isActive: !current });
    loadData();
    if (onRefresh) onRefresh();
  };

  const handleToggleModelPopup = (id: string, current: boolean) => {
    DataStorageService.updateUpcomingModel(id, { isFeaturedInPopup: !current });
    loadData();
    if (onRefresh) onRefresh();
  };

  // Popup Settings Save
  const handleSavePopupSettings = () => {
    DataStorageService.savePopupSettings(popupSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
    if (onRefresh) onRefresh();
    showToast('Popup settings saved successfully.');
  };

  const handleResetPopupSession = () => {
    DataStorageService.resetPopupDismissed();
    showToast('Popup view session reset! The banner will trigger on the next visit.');
  };

  // Booking status changes
  const handleUpdateBookingStatus = (id: string, status: PreBookingStatus) => {
    DataStorageService.updatePreBookingStatus(id, status);
    loadData();
    if (onRefresh) onRefresh();
    showToast(`Booking status updated to ${status}`);
  };

  const handleDeleteBooking = (id: string) => {
    setBookingToDelete(id);
  };

  const confirmDeleteBooking = () => {
    if (!bookingToDelete) return;
    DataStorageService.deletePreBooking(bookingToDelete);
    setBookingToDelete(null);
    setSelectedBookingDetail(null);
    loadData();
    if (onRefresh) onRefresh();
    showToast('Pre-booking lead removed.');
  };

  // Filtered Bookings
  const filteredBookings = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase();
      const match =
        b.customerName.toLowerCase().includes(q) ||
        b.mobileNumber.toLowerCase().includes(q) ||
        b.whatsappNumber.toLowerCase().includes(q) ||
        b.modelName.toLowerCase().includes(q) ||
        b.bookingCode.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getStatusBadge = (status: PreBookingStatus) => {
    switch (status) {
      case 'New':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Contacted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Header Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Upcoming Models & Pre-Booking Control</span>
          </h2>
          <p className="text-xs text-slate-500">
            Manage upcoming flagship phones, first-visit popup automation, and customer pre-reservations.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSubTab('models')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              subTab === 'models'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming Models ({models.length})
          </button>
          <button
            onClick={() => setSubTab('bookings')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer relative ${
              subTab === 'bookings'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pre-Bookings ({bookings.length})</span>
            {bookings.filter(b => b.status === 'New').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-extrabold">
                {bookings.filter(b => b.status === 'New').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab('settings')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              subTab === 'settings'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Popup Automation
          </button>
        </div>
      </div>

      {/* ================= TAB 1: UPCOMING MODELS ================= */}
      {subTab === 'models' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Configured Upcoming Models ({models.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="inline-flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                title="Restore original factory upcoming models catalog"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore Defaults</span>
              </button>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Upcoming Model</span>
              </button>
            </div>
          </div>

          {models.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-4">
              <Sparkles className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-base font-bold text-slate-700">No Upcoming Models Configured</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All upcoming models have been removed or deleted. You can create a new model or restore default models anytime.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleRestoreDefaults}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restore Defaults</span>
                </button>
                <button
                  onClick={handleOpenAdd}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow hover:bg-indigo-700 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Model</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {models.map(m => (
                <div
                  key={m.id}
                  className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow transition space-y-3 flex flex-col justify-between ${
                    m.isActive ? 'border-slate-200' : 'border-slate-300 opacity-60 bg-slate-50'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Status Badges */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold rounded-full uppercase">
                          {m.brand}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">
                          Order #{m.displayOrder}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {m.isFeaturedInPopup && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            In Popup
                          </span>
                        )}
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            m.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                          title={m.isActive ? 'Active on Storefront' : 'Hidden / Inactive'}
                        />
                      </div>
                    </div>

                    {/* Image & Title */}
                    <div className="flex space-x-3 items-center">
                      <img
                        src={m.image}
                        alt={m.name}
                        className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-slate-50 shrink-0 p-1"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {m.name}
                        </h4>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>{m.expectedLaunchDate}</span>
                        </p>
                        <p className="text-xs font-bold text-indigo-600 mt-1">
                          {m.expectedPriceText || (m.expectedPrice ? `Rs. ${m.expectedPrice.toLocaleString('en-IN')}` : 'Price Coming Soon')}
                        </p>
                      </div>
                    </div>

                    {/* Tagline / Highlights */}
                    {m.tagline && (
                      <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{m.tagline}"
                      </p>
                    )}

                    {/* Slug URL */}
                    <div className="text-[11px] text-slate-500 flex items-center justify-between font-mono bg-slate-100 px-2 py-1 rounded">
                      <span className="truncate">/upcoming-models/{m.slug}</span>
                      <a
                        href={`/upcoming-models/${m.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 shrink-0 ml-1"
                        title="View public page"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleModelActive(m.id, m.isActive)}
                        className={`text-[11px] font-bold px-2 py-1 rounded cursor-pointer ${
                          m.isActive
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                      >
                        {m.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleToggleModelPopup(m.id, m.isFeaturedInPopup)}
                        className={`text-[11px] font-bold px-2 py-1 rounded cursor-pointer ${
                          m.isFeaturedInPopup
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {m.isFeaturedInPopup ? 'Popup: On' : 'Popup: Off'}
                      </button>
                    </div>

                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                        title="Edit model"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteModel(m.id, m.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                        title="Delete model"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: PRE-BOOKING REQUESTS ================= */}
      {subTab === 'bookings' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by customer, phone, model, or code..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Statuses ({bookings.length})</option>
                <option value="New">New ({bookings.filter(b => b.status === 'New').length})</option>
                <option value="Contacted">Contacted ({bookings.filter(b => b.status === 'Contacted').length})</option>
                <option value="Confirmed">Confirmed ({bookings.filter(b => b.status === 'Confirmed').length})</option>
                <option value="Cancelled">Cancelled ({bookings.filter(b => b.status === 'Cancelled').length})</option>
              </select>
            </div>
          </div>

          {/* Bookings Table */}
          {filteredBookings.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No Pre-Bookings Found</h4>
              <p className="text-xs text-slate-500">
                Customer pre-bookings submitted through the website or popup will appear here immediately.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Code & Date</th>
                      <th className="px-4 py-3">Customer Details</th>
                      <th className="px-4 py-3">Pre-Booked Model</th>
                      <th className="px-4 py-3">Variant / Color</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredBookings.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-indigo-700 block">
                            {b.bookingCode}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(b.createdAt).toLocaleDateString()} {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{b.customerName}</span>
                          <span className="text-slate-500 font-mono text-[11px] block">{b.mobileNumber}</span>
                          {b.whatsappNumber && b.whatsappNumber !== b.mobileNumber && (
                            <span className="text-emerald-600 text-[10px] block">WA: {b.whatsappNumber}</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800">{b.modelName}</span>
                          <span className="text-[10px] text-slate-400 block">{b.brand}</span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700 inline-block mr-1">
                            {b.variant || 'Standard'}
                          </span>
                          {b.color && (
                            <span className="text-[11px] text-slate-500">
                              {b.color}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-900">
                          {b.quantity || 1}
                        </td>

                        <td className="px-4 py-3">
                          <select
                            value={b.status}
                            onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value as PreBookingStatus)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-full border cursor-pointer focus:outline-none ${getStatusBadge(b.status)}`}
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center space-x-1.5">
                            {/* Call Customer Button */}
                            <a
                              href={`tel:${b.mobileNumber}`}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                              title="Call Customer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>

                            {/* WhatsApp Customer Button */}
                            <a
                              href={`https://wa.me/977${b.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Namaste ${b.customerName} ji, this is Pandey Mobile Store, Traffic Chowk Butwal regarding your pre-booking reservation (${b.bookingCode}) for ${b.modelName}.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition"
                              title="WhatsApp Customer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>

                            {/* View Details modal */}
                            <button
                              onClick={() => setSelectedBookingDetail(b)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition cursor-pointer"
                              title="View Full Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteBooking(b.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: POPUP SETTINGS ================= */}
      {subTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>Automatic First-Visit Popup Configuration</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure timing, display mode, and automation triggers for incoming website visitors.
            </p>
          </div>

          <div className="space-y-4">
            {/* Enable/Disable Master Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="block text-xs font-bold text-slate-900">
                  Enable Automatic Storefront Popup
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  When enabled, visitors will see the upcoming model popup after the configured delay.
                </p>
              </div>
              <input
                type="checkbox"
                checked={popupSettings.isEnabled}
                onChange={(e) => setPopupSettings(prev => ({ ...prev, isEnabled: e.target.checked }))}
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
              />
            </div>

            {/* Delay in seconds */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Popup Delay (Seconds after page load)
              </label>
              <select
                value={popupSettings.delaySeconds}
                onChange={(e) => setPopupSettings(prev => ({ ...prev, delaySeconds: parseInt(e.target.value, 10) }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value={1}>1 Second (Immediate)</option>
                <option value={2}>2 Seconds (Recommended)</option>
                <option value={3}>3 Seconds (Standard)</option>
                <option value={5}>5 Seconds (Relaxed)</option>
              </select>
            </div>

            {/* Mode: Single Model vs Carousel */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Popup Display Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPopupSettings(prev => ({ ...prev, mode: 'single' }))}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    popupSettings.mode === 'single'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <span className="block text-xs">Single Featured Model</span>
                  <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                    Focus prominently on one top flagship
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPopupSettings(prev => ({ ...prev, mode: 'carousel' }))}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    popupSettings.mode === 'carousel'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <span className="block text-xs">Slider / Carousel</span>
                  <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                    Cycle through all featured models
                  </span>
                </button>
              </div>
            </div>

            {/* If Single mode, pick which active model */}
            {popupSettings.mode === 'single' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Featured Model for Single Popup
                </label>
                <select
                  value={popupSettings.activeModelId || ''}
                  onChange={(e) => setPopupSettings(prev => ({ ...prev, activeModelId: e.target.value || undefined }))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="">Default (First Active Model)</option>
                  {models.filter(m => m.isActive).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.brand} - {m.name} ({m.expectedLaunchDate})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Heading */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Popup Top Heading / Label
              </label>
              <input
                type="text"
                placeholder="COMING SOON / UPCOMING MODEL"
                value={popupSettings.heading || ''}
                onChange={(e) => setPopupSettings(prev => ({ ...prev, heading: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
              />
            </div>

            {/* Testing Tools */}
            <div className="pt-3 border-t border-slate-100 bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Testing & Preview Assistant</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                By default, the popup stores a dismissal token in the visitor's browser for 24 hours so it won't repeatedly interrupt their browsing on every refresh. Click below to reset your dismissal token for testing.
              </p>
              <button
                type="button"
                onClick={handleResetPopupSession}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
              >
                Reset My Popup Dismissal Token
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSavePopupSettings}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Popup Settings</span>
            </button>

            {settingsSaved && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>Settings Saved Successfully!</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ================= MODEL ADD / EDIT MODAL ================= */}
      {isEditingModel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 my-auto max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{editingModelId ? 'Edit Upcoming Model' : 'Add New Upcoming Model'}</span>
              </h3>
              <button
                onClick={() => setIsEditingModel(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Brand */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand *</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Xiaomi">Xiaomi / Redmi</option>
                    <option value="POCO">POCO</option>
                    <option value="Vivo">Vivo</option>
                    <option value="HONOR">HONOR</option>
                    <option value="OnePlus">OnePlus</option>
                    <option value="Google">Google Pixel</option>
                  </select>
                </div>

                {/* Model Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter model name (e.g. iPhone 18 Pro Max)"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Custom Slug */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL Slug (/upcoming-models/your-slug)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. iphone-18-pro-max"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>

                {/* Badge Label */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Badge Text</label>
                  <input
                    type="text"
                    placeholder="COMING SOON, PRE-BOOKING OPEN, etc."
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Marketing Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Titanium Redefined. Next-Gen Apple Intelligence."
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>

              {/* Image URL */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Product Image URL *</label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!image && !name) return;
                      const res = await generateSmartProductDescription({
                        brand,
                        model: name,
                        url: image
                      });
                      if (res.description) {
                        setDescription(res.description);
                      }
                      if (res.detectedModel && !name) {
                        setName(res.detectedModel);
                      }
                      if (res.detectedBrand && (!brand || brand === 'Apple')) {
                        setBrand(res.detectedBrand);
                      }
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Auto-Fill Description from Link</span>
                  </button>
                </div>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/... or official product link"
                  value={image}
                  onChange={async (e) => {
                    const newUrl = e.target.value;
                    setImage(newUrl);
                    if (!description && newUrl) {
                      const res = await generateSmartProductDescription({
                        brand,
                        model: name,
                        url: newUrl
                      });
                      if (res.description) {
                        setDescription(res.description);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Expected Launch Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Launch / Arrival *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Expected Autumn 2026, Q3 2026"
                    value={expectedLaunchDate}
                    onChange={(e) => setExpectedLaunchDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                {/* Expected Price Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Price Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Expected Rs. 2,24,999 or Price Coming Soon"
                    value={expectedPriceText}
                    onChange={(e) => setExpectedPriceText(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  placeholder="Overview of phone features, processor upgrades, and camera capabilities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>

              {/* Key Features (One per line) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Key Anticipated Highlights (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Next-Gen 2nm Chipset&#10;Under-Display Face ID&#10;48MP Triple Periscope Zoom"
                  value={keyFeaturesText}
                  onChange={(e) => setKeyFeaturesText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Available Colors (Comma separated) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Available Colors (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Desert Titanium, Natural Titanium, Black"
                    value={colorsText}
                    onChange={(e) => setColorsText(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                {/* Storage Variants (Comma separated) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Storage Variants (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="256GB, 512GB, 1TB, 2TB"
                    value={storageVariantsText}
                    onChange={(e) => setStorageVariantsText(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Specifications List Editor */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    Key Specifications Table
                  </label>
                  <button
                    type="button"
                    onClick={() => setSpecsList(prev => [...prev, { label: '', value: '' }])}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    + Add Spec Row
                  </button>
                </div>
                <div className="space-y-2">
                  {specsList.map((spec, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Spec Label (e.g. Display)"
                        value={spec.label}
                        onChange={(e) => {
                          const copy = [...specsList];
                          copy[idx].label = e.target.value;
                          setSpecsList(copy);
                        }}
                        className="w-1/3 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Spec Details"
                        value={spec.value}
                        onChange={(e) => {
                          const copy = [...specsList];
                          copy[idx].value = e.target.value;
                          setSpecsList(copy);
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setSpecsList(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Display & Popup Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Priority Order</label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="isFeaturedInPopup"
                    checked={isFeaturedInPopup}
                    onChange={(e) => setIsFeaturedInPopup(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isFeaturedInPopup" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Show in Visitor Popup
                  </label>
                </div>

                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Active on Storefront
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditingModel(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  {editingModelId ? 'Update Model' : 'Save Upcoming Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= BOOKING DETAIL MODAL ================= */}
      {selectedBookingDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Pre-Booking Request Details
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedBookingDetail.bookingCode}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBookingDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-500 block">Customer Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedBookingDetail.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Booking Date</span>
                  <span className="font-bold text-slate-900">{new Date(selectedBookingDetail.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Mobile Phone</span>
                  <a href={`tel:${selectedBookingDetail.mobileNumber}`} className="font-bold text-indigo-600 underline">
                    {selectedBookingDetail.mobileNumber}
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block">WhatsApp Number</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {selectedBookingDetail.whatsappNumber}
                  </span>
                </div>
              </div>

              {selectedBookingDetail.email && (
                <div>
                  <span className="text-slate-500 block">Email Address</span>
                  <span className="font-bold">{selectedBookingDetail.email}</span>
                </div>
              )}

              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1">
                <span className="text-slate-500 block font-semibold">Reserved Item</span>
                <span className="font-extrabold text-indigo-950 text-sm block">
                  {selectedBookingDetail.modelName} ({selectedBookingDetail.brand})
                </span>
                <span className="text-xs text-indigo-800">
                  Variant: <strong>{selectedBookingDetail.variant || 'Standard'}</strong> • Color: <strong>{selectedBookingDetail.color || 'Standard'}</strong> • Quantity: <strong>{selectedBookingDetail.quantity || 1} unit(s)</strong>
                </span>
              </div>

              {selectedBookingDetail.message && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block font-semibold mb-1">Customer Note</span>
                  <p className="italic text-slate-800">"{selectedBookingDetail.message}"</p>
                </div>
              )}

              {/* Status Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reservation Status</label>
                <select
                  value={selectedBookingDetail.status}
                  onChange={(e) => {
                    const next = e.target.value as PreBookingStatus;
                    handleUpdateBookingStatus(selectedBookingDetail.id, next);
                    setSelectedBookingDetail(prev => prev ? { ...prev, status: next } : null);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <a
                href={`tel:${selectedBookingDetail.mobileNumber}`}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Customer</span>
              </a>
              <a
                href={`https://wa.me/977${selectedBookingDetail.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Namaste ${selectedBookingDetail.customerName} ji, this is Pandey Mobile Store, Traffic Chowk Butwal regarding your pre-booking (${selectedBookingDetail.bookingCode}) for ${selectedBookingDetail.modelName}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Model Confirmation Modal */}
      {modelToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Delete Upcoming Model?
                </h3>
                <p className="text-xs text-slate-500">
                  यो मोडल स्थायी रूपमा हटाइनेछ (Permanent Removal)
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl">
              <p className="text-xs text-rose-950 leading-relaxed">
                Are you sure you want to delete <strong className="font-bold underline">{modelToDelete.name}</strong>?
                This will immediately remove this model from the upcoming models catalog, navbar quick menus, and the first-visit popup showcase.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setModelToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel (रद्द गर्नुहोस्)
              </button>
              <button
                type="button"
                onClick={confirmDeleteModel}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Model (हटाउनुहोस्)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Booking Confirmation Modal */}
      {bookingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Delete Pre-Booking Lead?
                </h3>
                <p className="text-xs text-slate-500">
                  ग्राहकको प्रि-बुकिङ रेकर्ड हटाउनुहोस्
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700">
              Are you sure you want to delete this customer pre-booking inquiry? This action cannot be undone.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setBookingToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteBooking}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Lead</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-2xl border border-slate-800 animate-slideUp">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
