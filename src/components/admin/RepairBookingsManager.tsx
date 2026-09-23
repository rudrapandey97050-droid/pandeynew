import React, { useState, useRef } from 'react';
import {
  Wrench,
  Search,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  User,
  Edit,
  Eye,
  Trash2,
  MessageCircle,
  DollarSign,
  FileText,
  Smartphone,
  Sparkles,
  AlertCircle,
  Tag,
  Check,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Filter,
  Plus,
  Printer,
  Receipt,
  MapPin,
  ShieldCheck,
  Copy,
  Upload,
  CheckCircle
} from 'lucide-react';
import { RepairBooking, RepairStatus } from '../../types.ts';
import { DataStorageService } from '../../services/dataStorage.ts';
import { formatDate, formatNPR } from '../../utils/formatters.ts';

interface RepairBookingsManagerProps {
  bookings: RepairBooking[];
  onBookingsChange: () => void;
}

const ALL_STATUSES: RepairStatus[] = [
  'New',
  'Contacted',
  'Diagnosing',
  'Price Estimated',
  'Repair Approved',
  'Repairing',
  'Ready',
  'Completed',
  'Cancelled'
];

const STATUS_COLORS: Record<RepairStatus, { bg: string; text: string; border: string; label: string }> = {
  'New': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'New' },
  'Contacted': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Contacted' },
  'Diagnosing': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Diagnosing' },
  'Price Estimated': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Price Estimated' },
  'Repair Approved': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', label: 'Repair Approved' },
  'Repairing': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Repairing' },
  'Ready': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Ready for Pickup' },
  'Completed': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', label: 'Completed' },
  'Cancelled': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', label: 'Cancelled' }
};

const POPULAR_BRANDS = [
  'Apple',
  'Samsung',
  'Xiaomi',
  'Vivo',
  'Realme',
  'OnePlus',
  'POCO',
  'HONOR',
  'Motorola',
  'Other'
];

const COMMON_REPAIR_PROBLEMS = [
  'Broken Display / Touch Screen',
  'Battery Replacement / Fast Drain',
  'Charging Port / Not Charging',
  'Motherboard / Dead Phone / Short Circuit',
  'Water Damage / Liquid Spill Treatment',
  'Back Glass / Housing Replacement',
  'Camera Lens / Camera Sensor Fault',
  'Speaker / Microphone / Receiver Audio',
  'Power / Volume Button Malfunction',
  'Software / Bootloop / FRP / Unlocking',
  'Other Problem'
];

export const RepairBookingsManager: React.FC<RepairBookingsManagerProps> = ({
  bookings,
  onBookingsChange
}) => {
  const storeSettings = DataStorageService.getStoreSettings();
  const todayStr = new Date().toISOString().split('T')[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');

  // Modal states
  const [viewingBooking, setViewingBooking] = useState<RepairBooking | null>(null);
  const [editingBooking, setEditingBooking] = useState<RepairBooking | null>(null);
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);
  const [printBooking, setPrintBooking] = useState<RepairBooking | null>(null);
  const [justAddedBooking, setJustAddedBooking] = useState<RepairBooking | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // ==========================================
  // ADD REPAIR BOOKING (ADMIN FORM STATE)
  // ==========================================
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addCustomerName, setAddCustomerName] = useState('');
  const [addPhoneNumber, setAddPhoneNumber] = useState('');
  const [addCustomerAddress, setAddCustomerAddress] = useState('Traffic Chowk, Butwal');
  const [addAlternatePhone, setAddAlternatePhone] = useState('');
  
  const [addMobileBrand, setAddMobileBrand] = useState('Apple');
  const [addCustomBrand, setAddCustomBrand] = useState('');
  const [addMobileModel, setAddMobileModel] = useState('');
  const [addImeiOrSerial, setAddImeiOrSerial] = useState('');
  const [addDevicePasscode, setAddDevicePasscode] = useState('');
  const [addAccessoriesReceived, setAddAccessoriesReceived] = useState('Only Handset');
  const [addPhysicalCondition, setAddPhysicalCondition] = useState('Normal minor scratches');

  const [addProblemType, setAddProblemType] = useState('Broken Display / Touch Screen');
  const [addCustomProblemType, setAddCustomProblemType] = useState('');
  const [addProblemDescription, setAddProblemDescription] = useState('');

  const [addPreferredDate, setAddPreferredDate] = useState(todayStr);
  const [addPreferredTime, setAddPreferredTime] = useState('10:00 AM - 01:00 PM (Morning Slot)');
  const [addDeliveryDate, setAddDeliveryDate] = useState(todayStr);
  const [addStatus, setAddStatus] = useState<RepairStatus>('Diagnosing');

  const [addTentativePrice, setAddTentativePrice] = useState('');
  const [addAdvancePaid, setAddAdvancePaid] = useState('');
  const [addFinalPrice, setAddFinalPrice] = useState('');
  const [addTechnicianName, setAddTechnicianName] = useState(storeSettings.technicianName || 'Dipak Pandey');
  const [addTechnicianPhone, setAddTechnicianPhone] = useState(storeSettings.technicianPhone || storeSettings.phone1 || '9847460603');
  const [addNotes, setAddNotes] = useState('');
  const [addPhoto, setAddPhoto] = useState<string | null>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Reset Add Form
  const resetAddForm = () => {
    setAddCustomerName('');
    setAddPhoneNumber('');
    setAddCustomerAddress('Traffic Chowk, Butwal');
    setAddAlternatePhone('');
    setAddMobileBrand('Apple');
    setAddCustomBrand('');
    setAddMobileModel('');
    setAddImeiOrSerial('');
    setAddDevicePasscode('');
    setAddAccessoriesReceived('Only Handset');
    setAddPhysicalCondition('Normal minor scratches');
    setAddProblemType('Broken Display / Touch Screen');
    setAddCustomProblemType('');
    setAddProblemDescription('');
    setAddPreferredDate(todayStr);
    setAddPreferredTime('10:00 AM - 01:00 PM (Morning Slot)');
    setAddDeliveryDate(todayStr);
    setAddStatus('Diagnosing');
    setAddTentativePrice('');
    setAddAdvancePaid('');
    setAddFinalPrice('');
    setAddTechnicianName(storeSettings.technicianName || 'Dipak Pandey');
    setAddTechnicianPhone(storeSettings.technicianPhone || storeSettings.phone1 || '9847460603');
    setAddNotes('');
    setAddPhoto(null);
    if (addFileInputRef.current) {
      addFileInputRef.current.value = '';
    }
  };

  // Submit Add Booking
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = addCustomerName.trim();
    const trimmedPhone = addPhoneNumber.trim();
    const trimmedModel = addMobileModel.trim();

    if (!trimmedName) {
      alert('Please enter customer full name.');
      return;
    }
    if (!trimmedPhone) {
      alert('Please enter customer contact number.');
      return;
    }
    if (!trimmedModel) {
      alert('Please enter device model (e.g. iPhone 13, Galaxy A54).');
      return;
    }

    const finalBrand = addMobileBrand === 'Other' ? (addCustomBrand.trim() || 'Other') : addMobileBrand;
    const finalProblem = addProblemType === 'Other Problem' ? (addCustomProblemType.trim() || 'General Repair') : addProblemType;

    const tentativeNum = addTentativePrice ? parseFloat(addTentativePrice) : undefined;
    const advanceNum = addAdvancePaid ? parseFloat(addAdvancePaid) : undefined;
    const finalNum = addFinalPrice ? parseFloat(addFinalPrice) : undefined;

    const newBooking = DataStorageService.addRepairBooking({
      customerName: trimmedName,
      phoneNumber: trimmedPhone,
      customerAddress: addCustomerAddress.trim() || undefined,
      alternatePhone: addAlternatePhone.trim() || undefined,
      mobileBrand: finalBrand,
      mobileModel: trimmedModel,
      imeiOrSerial: addImeiOrSerial.trim() || undefined,
      devicePasscode: addDevicePasscode.trim() || undefined,
      accessoriesReceived: addAccessoriesReceived.trim() || undefined,
      physicalCondition: addPhysicalCondition.trim() || undefined,
      problemType: finalProblem,
      problemDescription: addProblemDescription.trim() || 'Counter repair intake at Traffic Chowk store.',
      preferredDate: addPreferredDate || todayStr,
      preferredTime: addPreferredTime || '10:00 AM - 01:00 PM',
      deliveryDate: addDeliveryDate || undefined,
      photo: addPhoto || undefined,
      status: addStatus,
      tentativePrice: isNaN(tentativeNum as number) ? undefined : tentativeNum,
      advancePaid: isNaN(advanceNum as number) ? undefined : advanceNum,
      finalPrice: isNaN(finalNum as number) ? undefined : finalNum,
      technicianName: addTechnicianName.trim() || storeSettings.technicianName || 'Dipak Pandey',
      technicianPhone: addTechnicianPhone.trim() || storeSettings.technicianPhone || storeSettings.phone1,
      notes: addNotes.trim() || undefined
    });

    onBookingsChange();
    setIsAddModalOpen(false);
    setJustAddedBooking(newBooking);
    resetAddForm();
  };

  // Add Photo Handler
  const handleAddPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo size must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setAddPhoto(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // EDIT FORM FIELDS
  // ==========================================
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editCustomerAddress, setEditCustomerAddress] = useState('');
  const [editAlternatePhone, setEditAlternatePhone] = useState('');
  const [editMobileBrand, setEditMobileBrand] = useState('');
  const [editMobileModel, setEditMobileModel] = useState('');
  const [editImeiOrSerial, setEditImeiOrSerial] = useState('');
  const [editDevicePasscode, setEditDevicePasscode] = useState('');
  const [editAccessoriesReceived, setEditAccessoriesReceived] = useState('');
  const [editPhysicalCondition, setEditPhysicalCondition] = useState('');
  const [editProblemType, setEditProblemType] = useState('');
  const [editProblemDescription, setEditProblemDescription] = useState('');
  const [editPreferredDate, setEditPreferredDate] = useState('');
  const [editPreferredTime, setEditPreferredTime] = useState('');
  const [editDeliveryDate, setEditDeliveryDate] = useState('');
  const [editStatus, setEditStatus] = useState<RepairStatus>('New');
  const [editTentativePrice, setEditTentativePrice] = useState<string>('');
  const [editAdvancePaid, setEditAdvancePaid] = useState<string>('');
  const [editFinalPrice, setEditFinalPrice] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editTechnicianName, setEditTechnicianName] = useState<string>('');
  const [editTechnicianPhone, setEditTechnicianPhone] = useState<string>('');

  // Quick status update on table row
  const handleQuickStatusUpdate = (id: string, newStatus: RepairStatus) => {
    DataStorageService.updateRepairBookingStatus(id, newStatus);
    onBookingsChange();
    if (viewingBooking && viewingBooking.id === id) {
      setViewingBooking(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Open Edit Modal
  const openEditModal = (b: RepairBooking) => {
    setEditingBooking(b);
    setEditCustomerName(b.customerName || '');
    setEditPhoneNumber(b.phoneNumber || '');
    setEditCustomerAddress(b.customerAddress || '');
    setEditAlternatePhone(b.alternatePhone || '');
    setEditMobileBrand(b.mobileBrand || 'Other');
    setEditMobileModel(b.mobileModel || b.phoneModel || '');
    setEditImeiOrSerial(b.imeiOrSerial || '');
    setEditDevicePasscode(b.devicePasscode || '');
    setEditAccessoriesReceived(b.accessoriesReceived || '');
    setEditPhysicalCondition(b.physicalCondition || '');
    setEditProblemType(b.problemType || b.issueType || '');
    setEditProblemDescription(b.problemDescription || b.description || '');
    setEditPreferredDate(b.preferredDate || '');
    setEditPreferredTime(b.preferredTime || '');
    setEditDeliveryDate(b.deliveryDate || '');
    setEditStatus(b.status || 'New');
    setEditTentativePrice(b.tentativePrice !== undefined ? String(b.tentativePrice) : (b.estimatedCost !== undefined ? String(b.estimatedCost) : ''));
    setEditAdvancePaid(b.advancePaid !== undefined ? String(b.advancePaid) : '');
    setEditFinalPrice(b.finalPrice !== undefined ? String(b.finalPrice) : '');
    setEditNotes(b.notes || '');
    setEditTechnicianName(b.technicianName || storeSettings.technicianName || '');
    setEditTechnicianPhone(b.technicianPhone || storeSettings.technicianPhone || storeSettings.phone1 || '');
  };

  // Save Edit Form
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    const tentativeNum = editTentativePrice ? parseFloat(editTentativePrice) : undefined;
    const advanceNum = editAdvancePaid ? parseFloat(editAdvancePaid) : undefined;
    const finalNum = editFinalPrice ? parseFloat(editFinalPrice) : undefined;

    DataStorageService.updateRepairBooking(editingBooking.id, {
      customerName: editCustomerName.trim(),
      phoneNumber: editPhoneNumber.trim(),
      customerAddress: editCustomerAddress.trim() || undefined,
      alternatePhone: editAlternatePhone.trim() || undefined,
      mobileBrand: editMobileBrand.trim(),
      mobileModel: editMobileModel.trim(),
      imeiOrSerial: editImeiOrSerial.trim() || undefined,
      devicePasscode: editDevicePasscode.trim() || undefined,
      accessoriesReceived: editAccessoriesReceived.trim() || undefined,
      physicalCondition: editPhysicalCondition.trim() || undefined,
      problemType: editProblemType.trim(),
      problemDescription: editProblemDescription.trim(),
      preferredDate: editPreferredDate,
      preferredTime: editPreferredTime,
      deliveryDate: editDeliveryDate || undefined,
      status: editStatus,
      tentativePrice: isNaN(tentativeNum as number) ? undefined : tentativeNum,
      advancePaid: isNaN(advanceNum as number) ? undefined : advanceNum,
      finalPrice: isNaN(finalNum as number) ? undefined : finalNum,
      notes: editNotes.trim(),
      technicianName: editTechnicianName.trim() || undefined,
      technicianPhone: editTechnicianPhone.trim() || undefined
    });

    onBookingsChange();
    setEditingBooking(null);
  };

  // Delete booking
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this repair booking? This action cannot be undone.')) {
      DataStorageService.deleteRepairBooking(id);
      onBookingsChange();
      if (viewingBooking && viewingBooking.id === id) {
        setViewingBooking(null);
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Filter Bookings
  const filteredBookings = bookings.filter(b => {
    const q = searchQuery.toLowerCase().trim();
    const brand = b.mobileBrand || '';
    const model = b.mobileModel || b.phoneModel || '';
    const code = b.bookingCode || '';
    const customer = b.customerName || '';
    const phone = b.phoneNumber || '';
    const problem = b.problemType || b.issueType || '';

    const matchesSearch =
      !q ||
      customer.toLowerCase().includes(q) ||
      phone.toLowerCase().includes(q) ||
      brand.toLowerCase().includes(q) ||
      model.toLowerCase().includes(q) ||
      code.toLowerCase().includes(q) ||
      problem.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesBrand = brandFilter === 'ALL' || brand.toLowerCase() === brandFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesBrand;
  });

  // Calculate stats
  const stats = {
    total: bookings.length,
    newCount: bookings.filter(b => b.status === 'New').length,
    active: bookings.filter(b => ['New', 'Contacted', 'Diagnosing', 'Price Estimated', 'Repair Approved', 'Repairing'].includes(b.status)).length,
    ready: bookings.filter(b => b.status === 'Ready').length,
    completed: bookings.filter(b => b.status === 'Completed').length
  };

  // Generate WhatsApp notification text
  const generateWhatsAppMessage = (b: RepairBooking) => {
    let msg = `Namaste ${b.customerName || 'Sir/Madam'}, this is Pandey Mobile Store & Repair Lab, Traffic Chowk, Butwal.\n\n`;
    msg += `Regarding your device repair:\n`;
    msg += `• Booking ID: ${b.bookingCode || b.id}\n`;
    msg += `• Device: ${b.mobileBrand || ''} ${b.mobileModel || b.phoneModel || ''}\n`;
    msg += `• Issue: ${b.problemType || b.issueType || ''}\n`;
    msg += `• Status: ${b.status}\n`;

    if (b.tentativePrice) {
      msg += `• Tentative Cost: ${formatNPR(b.tentativePrice)}\n`;
    }
    if (b.finalPrice) {
      msg += `• Final Cost: ${formatNPR(b.finalPrice)}\n`;
    }
    if (b.notes) {
      msg += `• Lab Notes: ${b.notes}\n`;
    }
    msg += `\nPlease feel free to reply or visit our store at ${storeSettings.address}, ${storeSettings.city}. Phone: ${storeSettings.technicianPhone || storeSettings.phone1}.`;
    return encodeURIComponent(msg);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Stats */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Repair Bookings & Service Lab</h3>
              <p className="text-xs text-slate-500">
                Manage smartphone repairs, pricing quotes, technician notes and customer updates
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Stats Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>{stats.newCount} New</span>
            </div>

            <div className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
              <span>{stats.active} In Lab</span>
            </div>

            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
              <span>{stats.ready} Ready</span>
            </div>

            <div className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold">
              <span>{stats.total} Total</span>
            </div>
          </div>

          {/* Action Button: Add New Repair */}
          <button
            type="button"
            onClick={() => {
              resetAddForm();
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ नयाँ मर्मत / ग्राहक थप्नुहोस् (New Repair Ticket)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, phone, device model, booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Brand Filter */}
          <div className="sm:w-48">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Mobile Brands</option>
              <option value="Apple">Apple / iPhone</option>
              <option value="Samsung">Samsung</option>
              <option value="Vivo">Vivo</option>
              <option value="POCO">POCO</option>
              <option value="HONOR">HONOR</option>
              <option value="Redmi">Redmi / Xiaomi</option>
              <option value="OnePlus">OnePlus</option>
              <option value="Realme">Realme</option>
              <option value="Other">Other Brands</option>
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            All Bookings ({bookings.length})
          </button>

          {ALL_STATUSES.map(st => {
            const count = bookings.filter(b => b.status === st).length;
            const active = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{st}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-800'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bookings Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Wrench className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-700">No repair bookings match your filter</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              When visitors schedule a phone repair from the website, appointments will appear here with customer details and issue logs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Booking Code & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Device & Problem</th>
                  <th className="py-3 px-4">Appointment Slot</th>
                  <th className="py-3 px-4">Repair Pricing</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBookings.map((b) => {
                  const style = STATUS_COLORS[b.status] || STATUS_COLORS['New'];
                  const deviceTitle = `${b.mobileBrand || ''} ${b.mobileModel || b.phoneModel || ''}`.trim();

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Booking Code & Timestamp */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-100 block w-fit">
                            {b.bookingCode || 'ID-' + b.id.slice(-6)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {formatDate(b.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Customer info */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">{b.customerName}</span>
                          <a
                            href={`tel:${b.phoneNumber}`}
                            className="text-indigo-600 font-mono text-[11px] hover:underline flex items-center space-x-1"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{b.phoneNumber}</span>
                          </a>
                          {(b.technicianPhone || b.technicianName) && (
                            <div className="pt-1 flex items-center space-x-1">
                              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium" title="Assigned Technician">
                                <span>🔧</span>
                                <span className="font-bold truncate max-w-[85px]">{b.technicianName || 'Tech'}</span>
                                {b.technicianPhone && (
                                  <a href={`tel:${b.technicianPhone}`} className="font-mono text-amber-900 hover:underline">
                                    • {b.technicianPhone}
                                  </a>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Device & Problem */}
                      <td className="py-3.5 px-4 align-top max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-900">{deviceTitle}</span>
                            {b.photo && (
                              <button
                                type="button"
                                onClick={() => setPhotoModalUrl(b.photo || null)}
                                className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-black hover:bg-amber-200 cursor-pointer"
                                title="Click to view attached photo"
                              >
                                Photo 📷
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] font-semibold text-slate-700">
                            {b.problemType || b.issueType}
                          </p>
                          {(b.problemDescription || b.description) && (
                            <p className="text-[10px] text-slate-500 line-clamp-2 italic">
                              "{b.problemDescription || b.description}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Appointment Slot */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800 block">{b.preferredDate}</span>
                          <span className="text-[10px] text-slate-500 block">{b.preferredTime}</span>
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          {b.tentativePrice ? (
                            <div className="text-[11px]">
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">Tentative</span>
                              <span className="font-mono font-bold text-amber-700">{formatNPR(b.tentativePrice)}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No tentative</span>
                          )}

                          {b.finalPrice ? (
                            <div className="text-[11px]">
                              <span className="text-slate-400 block text-[9px] uppercase font-bold">Final Cost</span>
                              <span className="font-mono font-black text-emerald-700">{formatNPR(b.finalPrice)}</span>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1.5">
                          <select
                            value={b.status}
                            onChange={(e) => handleQuickStatusUpdate(b.id, e.target.value as RepairStatus)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black border cursor-pointer ${style.bg} ${style.text} ${style.border}`}
                          >
                            {ALL_STATUSES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>

                          {b.notes && (
                            <span className="text-[10px] text-slate-500 block truncate max-w-[120px]" title={b.notes}>
                              📝 {b.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          
                          {/* WhatsApp */}
                          <a
                            href={`https://wa.me/977${b.phoneNumber.replace(/\D/g, '')}?text=${generateWhatsAppMessage(b)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                            title="Message customer on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Print Token Slip */}
                          <button
                            type="button"
                            onClick={() => setPrintBooking(b)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition-colors cursor-pointer"
                            title="Print Customer Repair Slip / Job Sheet"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => setViewingBooking(b)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="View Full Booking Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => openEditModal(b)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit Repair, Prices & Notes"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW BOOKING DETAIL MODAL */}
      {viewingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center space-x-2.5">
                <Wrench className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base font-serif">Repair Booking Summary</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{viewingBooking.bookingCode || viewingBooking.id}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingBooking(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              
              {/* Status Header Bar */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Current Status</span>
                  <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black border mt-1 ${
                    STATUS_COLORS[viewingBooking.status]?.bg || 'bg-slate-100'
                  } ${STATUS_COLORS[viewingBooking.status]?.text || 'text-slate-800'} ${STATUS_COLORS[viewingBooking.status]?.border || 'border-slate-300'}`}>
                    {viewingBooking.status}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Booked At</span>
                  <span className="font-semibold text-slate-800 block mt-1">{formatDate(viewingBooking.createdAt)}</span>
                </div>
              </div>

              {/* Customer Info Section */}
              <div className="space-y-2">
                <h4 className="font-black uppercase tracking-wider text-slate-500 text-[10px] flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Customer Details (ग्राहकको विवरण)</span>
                </h4>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Full Name:</span>
                    <span className="font-bold text-slate-900">{viewingBooking.customerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Phone:</span>
                    <div className="flex items-center space-x-2">
                      <a href={`tel:${viewingBooking.phoneNumber}`} className="font-mono font-bold text-indigo-600 hover:underline">
                        {viewingBooking.phoneNumber}
                      </a>
                      <a
                        href={`https://wa.me/977${viewingBooking.phoneNumber.replace(/\D/g, '')}?text=${generateWhatsAppMessage(viewingBooking)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px]"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                  {viewingBooking.alternatePhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Alt Phone / WhatsApp:</span>
                      <a href={`tel:${viewingBooking.alternatePhone}`} className="font-mono font-bold text-slate-700 hover:underline">
                        {viewingBooking.alternatePhone}
                      </a>
                    </div>
                  )}
                  {viewingBooking.customerAddress && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Address / Location:</span>
                      <span className="font-semibold text-slate-800 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>{viewingBooking.customerAddress}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Device & Issue Section */}
              <div className="space-y-2">
                <h4 className="font-black uppercase tracking-wider text-slate-500 text-[10px] flex items-center space-x-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Device & Hardware Condition</span>
                </h4>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Brand & Model:</span>
                    <span className="font-bold text-slate-900">
                      {viewingBooking.mobileBrand} {viewingBooking.mobileModel || viewingBooking.phoneModel}
                    </span>
                  </div>
                  {viewingBooking.imeiOrSerial && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">IMEI / Serial No:</span>
                      <span className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {viewingBooking.imeiOrSerial}
                      </span>
                    </div>
                  )}
                  {viewingBooking.devicePasscode && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Screen Lock / Passcode:</span>
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {viewingBooking.devicePasscode}
                      </span>
                    </div>
                  )}
                  {viewingBooking.accessoriesReceived && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Accessories Received:</span>
                      <span className="font-semibold text-slate-800">{viewingBooking.accessoriesReceived}</span>
                    </div>
                  )}
                  {viewingBooking.physicalCondition && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Physical Condition:</span>
                      <span className="font-semibold text-slate-800">{viewingBooking.physicalCondition}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Problem Type:</span>
                    <span className="font-bold text-indigo-700">{viewingBooking.problemType || viewingBooking.issueType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Problem Description:</span>
                    <p className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 leading-relaxed font-normal">
                      {viewingBooking.problemDescription || viewingBooking.description || 'No additional description.'}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Intake / Preferred Date:</span>
                    <span className="font-semibold text-slate-800">
                      {viewingBooking.preferredDate} ({viewingBooking.preferredTime})
                    </span>
                  </div>
                  {viewingBooking.deliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimated Delivery Date:</span>
                      <span className="font-bold text-emerald-800">{viewingBooking.deliveryDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Attached Photo */}
              {viewingBooking.photo && (
                <div className="space-y-2">
                  <h4 className="font-black uppercase tracking-wider text-slate-500 text-[10px]">Customer Attached Photo</h4>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center p-2">
                    <img
                      src={viewingBooking.photo}
                      alt="Damaged device"
                      className="max-h-52 w-auto object-contain rounded-xl cursor-pointer"
                      onClick={() => setPhotoModalUrl(viewingBooking.photo || null)}
                    />
                  </div>
                </div>
              )}

              {/* Assigned Technician & Direct Contact */}
              <div className="space-y-2">
                <h4 className="font-black uppercase tracking-wider text-slate-500 text-[10px] flex items-center space-x-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-600" />
                  <span>Assigned Lab Technician & Direct Helpline</span>
                </h4>
                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Technician Name:</span>
                      <span className="font-bold text-slate-900 text-xs">
                        {viewingBooking.technicianName || storeSettings.technicianName || 'Pandey Mobile Senior Lab Engineer'}
                      </span>
                    </div>

                    {(viewingBooking.technicianPhone || storeSettings.technicianPhone || storeSettings.phone1) && (
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Direct Phone:</span>
                        <span className="font-mono font-black text-amber-950 text-xs">
                          {viewingBooking.technicianPhone || storeSettings.technicianPhone || storeSettings.phone1}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Contact Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60">
                    <a
                      href={`tel:${viewingBooking.technicianPhone || storeSettings.technicianPhone || storeSettings.phone1}`}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call Technician</span>
                    </a>

                    <a
                      href={`https://wa.me/977${(viewingBooking.technicianPhone || storeSettings.technicianPhone || storeSettings.whatsapp || '').replace(/\D/g, '')}?text=Namaste%20Technician%2C%20regarding%20Repair%20Ticket%20${viewingBooking.bookingCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Lab Pricing & Notes */}
              <div className="space-y-2">
                <h4 className="font-black uppercase tracking-wider text-slate-500 text-[10px] flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cost, Advance & Payment Status</span>
                </h4>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tentative Price Quote:</span>
                    <span className="font-bold font-mono text-amber-700">
                      {viewingBooking.tentativePrice ? formatNPR(viewingBooking.tentativePrice) : 'Not provided yet'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Advance Paid (अग्रिम रकम):</span>
                    <span className="font-bold font-mono text-indigo-700">
                      {viewingBooking.advancePaid ? formatNPR(viewingBooking.advancePaid) : 'रु. 0 (Nil)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Final Repair Price:</span>
                    <span className="font-black font-mono text-emerald-700">
                      {viewingBooking.finalPrice ? formatNPR(viewingBooking.finalPrice) : 'Pending final invoice'}
                    </span>
                  </div>
                  {viewingBooking.finalPrice && viewingBooking.advancePaid && (
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                      <span className="text-slate-700">Remaining Balance Due (बाँकी):</span>
                      <span className="font-mono text-rose-700">
                        {formatNPR(Math.max(0, viewingBooking.finalPrice - viewingBooking.advancePaid))}
                      </span>
                    </div>
                  )}
                  {viewingBooking.notes && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 block mb-1">Internal Lab Notes:</span>
                      <p className="bg-amber-50/70 p-2 rounded-xl border border-amber-200 text-amber-900 text-xs">
                        {viewingBooking.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const toPrint = viewingBooking;
                    setViewingBooking(null);
                    setPrintBooking(toPrint);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Repair Slip (प्रिन्ट स्लिप)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const toEdit = viewingBooking;
                    setViewingBooking(null);
                    openEditModal(toEdit);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs transition"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setViewingBooking(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT BOOKING MODAL */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center space-x-2.5">
                <Edit className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base font-serif">Edit Repair Booking & Service Quote</h3>
                  <p className="text-xs text-slate-400">Booking Code: {editingBooking.bookingCode || editingBooking.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingBooking(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              
              {/* Customer Info */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center space-x-1.5 text-xs">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Customer Information (ग्राहकको विवरण)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Mobile) *</label>
                    <input
                      type="tel"
                      required
                      value={editPhoneNumber}
                      onChange={(e) => setEditPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alternate Phone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9804477123"
                      value={editAlternatePhone}
                      onChange={(e) => setEditAlternatePhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Customer Address / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Traffic Chowk, Butwal"
                      value={editCustomerAddress}
                      onChange={(e) => setEditCustomerAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Device & Specs */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center space-x-1.5 text-xs">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Device & Hardware Details</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Brand *</label>
                    <input
                      type="text"
                      required
                      value={editMobileBrand}
                      onChange={(e) => setEditMobileBrand(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Model *</label>
                    <input
                      type="text"
                      required
                      value={editMobileModel}
                      onChange={(e) => setEditMobileModel(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">IMEI / Serial Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 864521049283719"
                      value={editImeiOrSerial}
                      onChange={(e) => setEditImeiOrSerial(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Screen Lock / Passcode</label>
                    <input
                      type="text"
                      placeholder="e.g. 1234 or Pattern / None"
                      value={editDevicePasscode}
                      onChange={(e) => setEditDevicePasscode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Accessories Received</label>
                    <input
                      type="text"
                      placeholder="e.g. Handset Only / SIM Card / Case"
                      value={editAccessoriesReceived}
                      onChange={(e) => setEditAccessoriesReceived(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Physical Condition (Scratches/Dents)</label>
                    <input
                      type="text"
                      placeholder="e.g. Screen cracked, body minor scratches"
                      value={editPhysicalCondition}
                      onChange={(e) => setEditPhysicalCondition(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Problem Type & Description */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Problem Type *</label>
                  <input
                    type="text"
                    required
                    value={editProblemType}
                    onChange={(e) => setEditProblemType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Problem Description</label>
                  <textarea
                    rows={2}
                    value={editProblemDescription}
                    onChange={(e) => setEditProblemDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred / Intake Date</label>
                  <input
                    type="date"
                    value={editPreferredDate}
                    onChange={(e) => setEditPreferredDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Time</label>
                  <input
                    type="text"
                    value={editPreferredTime}
                    onChange={(e) => setEditPreferredTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Promised Delivery Date</label>
                  <input
                    type="date"
                    value={editDeliveryDate}
                    onChange={(e) => setEditDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-indigo-950">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Repair Lifecycle Status</span>
                </div>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as RepairStatus)}
                  className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 cursor-pointer shadow-xs"
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Pricing & Advance Payment */}
              <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200/70 space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-amber-950">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  <span>Repair Pricing & Advance Payment (लागत तथा अग्रिम भुक्तानी)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tentative Cost (रु.)</label>
                    <input
                      type="number"
                      placeholder="Tentative"
                      value={editTentativePrice}
                      onChange={(e) => setEditTentativePrice(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Advance Paid (अग्रिम रु.)</label>
                    <input
                      type="number"
                      placeholder="Advance paid"
                      value={editAdvancePaid}
                      onChange={(e) => setEditAdvancePaid(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-mono font-bold text-indigo-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Final Price (अन्तिम रु.)</label>
                    <input
                      type="number"
                      placeholder="Final price"
                      value={editFinalPrice}
                      onChange={(e) => setEditFinalPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-emerald-800"
                    />
                  </div>
                </div>
              </div>

              {/* Assigned Lab Technician & Number */}
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-black uppercase tracking-wider text-amber-950">
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    <span>Assigned Technician & Direct Contact</span>
                  </div>
                  {storeSettings.technicianPhone && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditTechnicianName(storeSettings.technicianName || 'Chief Lab Specialist');
                        setEditTechnicianPhone(storeSettings.technicianPhone || storeSettings.phone1 || '');
                      }}
                      className="text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md border border-amber-300 cursor-pointer"
                    >
                      ⚡ Use Store Default Tech
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Technician / Lab Specialist Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Er. Ramesh Pandey"
                      value={editTechnicianName}
                      onChange={(e) => setEditTechnicianName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Technician Direct Phone Number</span>
                      {editTechnicianPhone && (
                        <span className="text-[10px] text-emerald-700 font-bold">Visible on receipt</span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9847460603"
                      value={editTechnicianPhone}
                      onChange={(e) => setEditTechnicianPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-amber-950"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Technician / Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Enter technician remarks, replacement parts status, or customer notes..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                />
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ADD NEW REPAIR BOOKING MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg font-serif flex items-center space-x-2">
                    <span>नयाँ ग्राहक तथा मोबाइल मर्मत दर्ता</span>
                    <span className="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/30 font-sans font-normal">
                      Admin Desk
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Add new repair entry with full customer details, phone diagnostics, passcode & advance payment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateBooking} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              
              {/* SECTION 1: CUSTOMER DETAILS */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>१. ग्राहकको विवरण (Customer Information)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Customer Full Name (ग्राहकको पूरा नाम) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bikash Sharma"
                      value={addCustomerName}
                      onChange={(e) => setAddCustomerName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Primary Phone Number (सम्पर्क मोबाइल नं.) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9847460603"
                      value={addPhoneNumber}
                      onChange={(e) => setAddPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alternate Phone / WhatsApp (वैकल्पिक सम्पर्क)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9804477123"
                      value={addAlternatePhone}
                      onChange={(e) => setAddAlternatePhone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Customer Address / Location (ठेगाना)
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Traffic Chowk, Butwal"
                        value={addCustomerAddress}
                        onChange={(e) => setAddCustomerAddress(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: DEVICE & HARDWARE */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>२. मोबाइल डिभाइस तथा भौतिक विवरण (Device & Hardware)</span>
                </div>

                {/* Popular Brand Chips */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Brand or Type Below *
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {['Apple iPhone', 'Samsung', 'Xiaomi / Redmi', 'OnePlus', 'Realme', 'Vivo', 'Oppo', 'Nothing', 'Other'].map(b => (
                      <button
                        type="button"
                        key={b}
                        onClick={() => setAddMobileBrand(b === 'Other' ? '' : b)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                          addMobileBrand === b
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Brand Name (e.g. Apple, Samsung, Xiaomi)"
                        value={addMobileBrand}
                        onChange={(e) => setAddMobileBrand(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Model Name (e.g. iPhone 14 Pro, Redmi Note 13) *"
                        value={addMobileModel}
                        onChange={(e) => setAddMobileModel(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      IMEI / Serial Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 864521049283719"
                      value={addImeiOrSerial}
                      onChange={(e) => setAddImeiOrSerial(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Screen Lock / Passcode
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1234 or Pattern / None"
                      value={addDevicePasscode}
                      onChange={(e) => setAddDevicePasscode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-indigo-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Accessories Taken
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Handset only / SIM"
                      value={addAccessoriesReceived}
                      onChange={(e) => setAddAccessoriesReceived(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Physical Condition
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Screen cracked, back clean"
                      value={addPhysicalCondition}
                      onChange={(e) => setAddPhysicalCondition(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: REPAIR ISSUE */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span>३. मर्मत तथा समस्याको विवरण (Issue & Diagnostics)</span>
                </div>

                {/* Common Issue Pills */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Common Issue or Type Custom *
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      'Screen / Display Broken (डिस्प्ले फुटेको)',
                      'Battery Drain / Replacement',
                      'Charging Port / Pin Damaged',
                      'Water / Liquid Damaged',
                      'Dead Boot / Motherboard IC',
                      'Speaker / Mic Problem',
                      'Camera Glass / Focus Issue',
                      'Software / Network Unlock'
                    ].map(issue => (
                      <button
                        type="button"
                        key={issue}
                        onClick={() => setAddProblemType(issue)}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-medium transition-all cursor-pointer border ${
                          addProblemType === issue
                            ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {issue}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Specific Problem Type *"
                    value={addProblemType}
                    onChange={(e) => setAddProblemType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Problem Detailed Description (विस्तृत जानकारी / ग्राहकको भनाइ)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe specific symptoms, drops, water contact, or customer requests..."
                    value={addProblemDescription}
                    onChange={(e) => setAddProblemDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Attach Damage Photo (वैकल्पिक फोटो)
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="px-3 py-2 bg-white border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl text-xs text-slate-600 font-semibold cursor-pointer flex items-center space-x-2 transition">
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{addPhoto ? 'Change Photo' : 'Upload Device Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAddPhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {addPhoto && (
                      <div className="flex items-center space-x-2">
                        <img src={addPhoto} alt="preview" className="w-9 h-9 object-cover rounded-lg border border-slate-200" />
                        <button
                          type="button"
                          onClick={() => setAddPhoto(null)}
                          className="text-rose-600 hover:text-rose-800 text-[11px] font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 4: PRICING, ADVANCE, STATUS & DATES */}
              <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200/70 space-y-4">
                <div className="flex items-center space-x-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>४. लागत, अग्रिम भुक्तानी तथा डेलिभरी मिति (Cost, Advance & Dates)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tentative Cost Quote (अनुमानित रु.)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2500"
                      value={addTentativePrice}
                      onChange={(e) => setAddTentativePrice(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Advance Paid (अग्रिम रकम रु.)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 500 or 0"
                      value={addAdvancePaid}
                      onChange={(e) => setAddAdvancePaid(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-mono font-bold text-indigo-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Final Agreed Price (अन्तिम रु. यदि तय छ भने)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2400"
                      value={addFinalPrice}
                      onChange={(e) => setAddFinalPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-emerald-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Intake Date (दाखिला मिति)
                    </label>
                    <input
                      type="date"
                      value={addPreferredDate}
                      onChange={(e) => setAddPreferredDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Time Slot
                    </label>
                    <input
                      type="text"
                      value={addPreferredTime}
                      onChange={(e) => setAddPreferredTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Promised Delivery Date (सम्पर्क/डेलिभरी)
                    </label>
                    <input
                      type="date"
                      value={addDeliveryDate}
                      onChange={(e) => setAddDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-emerald-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Initial Status (सुरुवाती अवस्था)
                    </label>
                    <select
                      value={addStatus}
                      onChange={(e) => setAddStatus(e.target.value as RepairStatus)}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 cursor-pointer"
                    >
                      {ALL_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assigned Lab Technician
                    </label>
                    <input
                      type="text"
                      placeholder="Technician Name"
                      value={addTechnicianName}
                      onChange={(e) => setAddTechnicianName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Technician Direct Helpline
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9847460603"
                      value={addTechnicianPhone}
                      onChange={(e) => setAddTechnicianPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Internal Lab / Technician Notes (आन्तरिक टिपोट)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Part ordered, tested display before fitment, customer requested original battery..."
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>मर्मत दर्ता गर्नुहोस् (Create Repair Ticket)</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* JUST ADDED SUCCESS POPUP */}
      {justAddedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 text-center">
            
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 font-serif">
                मर्मत दर्ता सम्पन्न भयो!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                New repair ticket has been successfully registered in the system.
              </p>
            </div>

            <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-2 text-left text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Booking Code / Token:</span>
                <span className="font-mono font-black text-indigo-700 text-sm bg-white px-2 py-0.5 rounded border border-indigo-200">
                  {justAddedBooking.bookingCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-800">{justAddedBooking.customerName} ({justAddedBooking.phoneNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Device:</span>
                <span className="font-bold text-slate-800">{justAddedBooking.mobileBrand} {justAddedBooking.mobileModel}</span>
              </div>
              {justAddedBooking.advancePaid ? (
                <div className="flex justify-between">
                  <span className="text-slate-500">Advance Paid:</span>
                  <span className="font-bold font-mono text-emerald-700">{formatNPR(justAddedBooking.advancePaid)}</span>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const b = justAddedBooking;
                  setJustAddedBooking(null);
                  setPrintBooking(b);
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Customer Repair Token Slip (स्लिप प्रिन्ट)</span>
              </button>

              <a
                href={`https://wa.me/977${justAddedBooking.phoneNumber.replace(/\D/g, '')}?text=${generateWhatsAppMessage(justAddedBooking)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Customer Confirmation</span>
              </a>

              <button
                type="button"
                onClick={() => setJustAddedBooking(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Done / Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PRINTABLE JOB SLIP / REPAIR TOKEN MODAL */}
      {printBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 md:p-6 overflow-y-auto print:p-0 print:bg-white">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto print:shadow-none print:border-none print:max-w-none">
            
            {/* Header bar (hidden during print) */}
            <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs sm:text-sm">Repair Job Sheet & Customer Token Slip</span>
              </div>
              <button
                onClick={() => setPrintBooking(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Ticket Content */}
            <div className="p-6 text-slate-900 space-y-4 text-xs font-sans">
              
              {/* Store Receipt Header */}
              <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 space-y-1">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm mb-1">
                  P
                </div>
                <h2 className="text-base font-black tracking-wide uppercase font-serif">
                  {storeSettings.storeName || 'PANDEY MOBILE STORE & REPAIR LAB'}
                </h2>
                <p className="text-[11px] font-medium text-slate-600">
                  {storeSettings.address || 'Traffic Chowk, Main Road'}, {storeSettings.city || 'Butwal'}, Rupandehi, Nepal
                </p>
                <p className="text-[11px] font-mono text-slate-700">
                  Tel: {storeSettings.phone1 || '9847460603'} / {storeSettings.phone2 || '9804477123'}
                </p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[11px] font-black rounded-md tracking-wider">
                    DEVICE INTAKE / REPAIR TOKEN SLIP
                  </span>
                </div>
              </div>

              {/* Booking Code & Timestamp */}
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Token / Booking ID</span>
                  <span className="text-sm font-mono font-black text-indigo-700">
                    {printBooking.bookingCode || printBooking.id}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Intake Date & Time</span>
                  <span className="font-semibold text-[11px]">
                    {formatDate(printBooking.createdAt)}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-1.5 border-b border-slate-200 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Customer Information</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">Name:</span> <strong className="text-slate-900">{printBooking.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Phone:</span> <strong className="font-mono">{printBooking.phoneNumber}</strong>
                  </div>
                  {printBooking.customerAddress && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Address:</span> <span>{printBooking.customerAddress}</span>
                    </div>
                  )}
                  {printBooking.alternatePhone && (
                    <div>
                      <span className="text-slate-500">Alt Phone:</span> <span className="font-mono">{printBooking.alternatePhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Device Specs & Condition */}
              <div className="space-y-1.5 border-b border-slate-200 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Device & Intake Diagnostics</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500">Device Model:</span> <strong className="text-slate-900">{printBooking.mobileBrand} {printBooking.mobileModel || printBooking.phoneModel}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Issue:</span> <strong className="text-indigo-700">{printBooking.problemType || printBooking.issueType}</strong>
                  </div>
                  {printBooking.imeiOrSerial && (
                    <div>
                      <span className="text-slate-500">IMEI/Serial:</span> <span className="font-mono">{printBooking.imeiOrSerial}</span>
                    </div>
                  )}
                  {printBooking.devicePasscode && (
                    <div>
                      <span className="text-slate-500">Passcode:</span> <span className="font-mono font-bold text-indigo-700">{printBooking.devicePasscode}</span>
                    </div>
                  )}
                  {printBooking.accessoriesReceived && (
                    <div>
                      <span className="text-slate-500">Accessories:</span> <span>{printBooking.accessoriesReceived}</span>
                    </div>
                  )}
                  {printBooking.physicalCondition && (
                    <div>
                      <span className="text-slate-500">Physical State:</span> <span>{printBooking.physicalCondition}</span>
                    </div>
                  )}
                </div>

                {(printBooking.problemDescription || printBooking.description) && (
                  <div className="mt-1 bg-slate-50 p-2 rounded-lg text-[10.5px] italic text-slate-600">
                    "{printBooking.problemDescription || printBooking.description}"
                  </div>
                )}
              </div>

              {/* Pricing, Advance & Balance */}
              <div className="space-y-1.5 border-b border-slate-200 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Payment & Accounts Summary</span>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Estimated / Final Amount:</span>
                    <span className="font-mono font-bold">
                      {printBooking.finalPrice ? formatNPR(printBooking.finalPrice) : printBooking.tentativePrice ? formatNPR(printBooking.tentativePrice) : 'TBD (To Be Diagnosed)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-indigo-700">
                    <span>Advance Payment Received (अग्रिम रकम):</span>
                    <span className="font-mono font-bold">
                      {printBooking.advancePaid ? formatNPR(printBooking.advancePaid) : 'रु. 0'}
                    </span>
                  </div>
                  {(printBooking.finalPrice || printBooking.tentativePrice) && (
                    <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
                      <span>Approx. Remaining Due (अनुमानित बाँकी):</span>
                      <span className="font-mono text-rose-700">
                        {formatNPR(Math.max(0, (printBooking.finalPrice || printBooking.tentativePrice || 0) - (printBooking.advancePaid || 0)))}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Technician In-Charge */}
              <div className="flex justify-between items-center text-[10.5px] text-slate-600 bg-amber-50/60 p-2 rounded-xl border border-amber-200/70">
                <div>
                  <span className="block font-bold text-amber-950">Tech Specialist In-Charge:</span>
                  <span>{printBooking.technicianName || storeSettings.technicianName || 'Chief Engineer'}</span>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-amber-950">Direct Helpline:</span>
                  <span className="font-mono font-bold">{printBooking.technicianPhone || storeSettings.technicianPhone || storeSettings.phone1}</span>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="text-[9px] text-slate-400 space-y-0.5 pt-1 leading-normal">
                <p>• Please produce this original slip during device collection / pickup.</p>
                <p>• Pandey Mobile Store is not responsible for data loss. Please keep your SIM/Memory card safely.</p>
                <p>• Unclaimed devices past 30 days of completion notification will incur holding fees.</p>
              </div>

              {/* Signature Lines */}
              <div className="grid grid-cols-2 gap-6 pt-6 text-[10px] text-slate-500 text-center">
                <div className="border-t border-slate-300 pt-1">
                  Customer Signature
                </div>
                <div className="border-t border-slate-300 pt-1">
                  Authorized Sign / Pandey Mobile Stamp
                </div>
              </div>

            </div>

            {/* Print Dialog Actions (hidden when printing) */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>प्रिन्ट गर्नुहोस् (Print Receipt)</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintBooking(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PHOTO ZOOM MODAL */}
      {photoModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-pointer"
          onClick={() => setPhotoModalUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-slate-900 rounded-2xl p-2 border border-slate-700">
            <button
              onClick={() => setPhotoModalUrl(null)}
              className="absolute top-4 right-4 p-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors shadow-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={photoModalUrl}
              alt="Zoomed phone damage"
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

    </div>
  );
};
