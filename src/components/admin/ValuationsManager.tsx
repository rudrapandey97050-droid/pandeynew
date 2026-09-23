import React, { useState } from 'react';
import {
  Smartphone,
  RefreshCw,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  DollarSign,
  User,
  Phone,
  Calendar,
  AlertTriangle,
  FileText,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  Camera,
  Layers,
  Sparkles
} from 'lucide-react';
import { PhoneValuationRequest, ValuationStatus, ValuationType } from '../../types.ts';
import { DataStorageService } from '../../services/dataStorage.ts';
import { formatNPR, formatDate } from '../../utils/formatters.ts';

interface ValuationsManagerProps {
  valuations: PhoneValuationRequest[];
  onValuationsChange: () => void;
}

const STATUS_CONFIG: Record<ValuationStatus, { label: string; bg: string; text: string; border: string }> = {
  'New': { label: 'New Request', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Under Review': { label: 'Under Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Contacted': { label: 'Customer Contacted', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Physical Inspection Required': { label: 'Inspection Needed', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Valuation Given': { label: 'Valuation Given', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Accepted': { label: 'Accepted by Customer', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Rejected': { label: 'Rejected / Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Completed': { label: 'Deal Completed', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' }
};

export const ValuationsManager: React.FC<ValuationsManagerProps> = ({
  valuations,
  onValuationsChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [selectedValuation, setSelectedValuation] = useState<PhoneValuationRequest | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ src: string; title: string } | null>(null);

  // Edit fields for the selected modal
  const [editEstimatedPrice, setEditEstimatedPrice] = useState<string>('');
  const [editFinalPrice, setEditFinalPrice] = useState<string>('');
  const [editAdminNotes, setEditAdminNotes] = useState<string>('');
  const [editStatus, setEditStatus] = useState<ValuationStatus>('New');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const openDetails = (val: PhoneValuationRequest) => {
    setSelectedValuation(val);
    setEditEstimatedPrice(val.estimatedValuationPrice ? val.estimatedValuationPrice.toString() : '');
    setEditFinalPrice(val.finalValuationPrice ? val.finalValuationPrice.toString() : '');
    setEditAdminNotes(val.adminNotes || '');
    setEditStatus(val.status);
    setSaveSuccess(false);
  };

  const handleSaveDetails = () => {
    if (!selectedValuation) return;
    setIsSaving(true);

    const estVal = editEstimatedPrice ? parseFloat(editEstimatedPrice) : undefined;
    const finalVal = editFinalPrice ? parseFloat(editFinalPrice) : undefined;
    
    // If exchange request, calculate exchange adjustment
    let exchangeAdj: number | undefined = undefined;
    if (selectedValuation.type === 'exchange' && selectedValuation.exchangeTarget?.targetPrice) {
      const baseVal = finalVal || estVal || 0;
      exchangeAdj = Math.max(0, selectedValuation.exchangeTarget.targetPrice - baseVal);
    }

    const updated = DataStorageService.updateValuation(selectedValuation.id, {
      estimatedValuationPrice: estVal,
      finalValuationPrice: finalVal,
      exchangeAdjustmentAmount: exchangeAdj,
      adminNotes: editAdminNotes.trim() || undefined,
      status: editStatus
    });

    if (updated) {
      setSelectedValuation(updated);
      onValuationsChange();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
    setIsSaving(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this valuation request?')) {
      DataStorageService.deleteValuation(id);
      setSelectedValuation(null);
      onValuationsChange();
    }
  };

  const filteredValuations = valuations.filter((v) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      v.customerName.toLowerCase().includes(query) ||
      v.mobileNumber.toLowerCase().includes(query) ||
      v.valuationId.toLowerCase().includes(query) ||
      v.phoneBrand.toLowerCase().includes(query) ||
      v.phoneModel.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    const matchesType = typeFilter === 'All' || v.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalNew = valuations.filter(v => v.status === 'New').length;
  const totalExchanges = valuations.filter(v => v.type === 'exchange').length;
  const totalSells = valuations.filter(v => v.type === 'sell').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Requests</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{valuations.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">{totalSells} Sell • {totalExchanges} Exchange</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">New Action Required</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{totalNew}</p>
            <p className="text-xs text-slate-500 mt-0.5">Pending review / contact</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Exchange Upgrades</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{totalExchanges}</p>
            <p className="text-xs text-slate-500 mt-0.5">Trade-in deals in pipeline</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, mobile, Valuation ID, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Under Review">Under Review</option>
              <option value="Contacted">Contacted</option>
              <option value="Physical Inspection Required">Inspection Needed</option>
              <option value="Valuation Given">Valuation Given</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white"
            >
              <option value="All">All Types</option>
              <option value="sell">Sell Old Phone</option>
              <option value="exchange">Exchange Upgrade</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredValuations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Smartphone className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">No Valuation Requests Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {valuations.length === 0
                ? "No customer valuation or exchange requests have been submitted yet."
                : "No requests match your current search or filter criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Valuation ID & Date</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Old Phone Model</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Store Valuation (Est / Final)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredValuations.map((val) => {
                  const statusInfo = STATUS_CONFIG[val.status] || STATUS_CONFIG['New'];
                  const photoCount = Object.keys(val.photos || {}).length;

                  return (
                    <tr key={val.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-indigo-700 block">{val.valuationId}</span>
                        <span className="text-[11px] text-slate-400">{formatDate(val.createdAt)}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{val.customerName}</span>
                        <span className="text-slate-500 font-mono text-[11px]">{val.mobileNumber}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">
                          {val.phoneBrand} {val.phoneModel}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {val.storage} • {val.ram} RAM • {photoCount} Photos
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {val.type === 'exchange' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <RefreshCw className="w-3 h-3 mr-1" /> Exchange
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            <DollarSign className="w-3 h-3 mr-1" /> Sell Phone
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {val.finalValuationPrice ? (
                          <span className="font-bold text-emerald-700 block">
                            Final: {formatNPR(val.finalValuationPrice)}
                          </span>
                        ) : val.estimatedValuationPrice ? (
                          <span className="font-semibold text-indigo-600 block">
                            Est: {formatNPR(val.estimatedValuationPrice)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not set yet</span>
                        )}
                        {val.expectedPrice && (
                          <span className="text-[10px] text-slate-400 block">
                            User Asked: {formatNPR(val.expectedPrice)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openDetails(val)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs transition-colors inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL INSPECTION MODAL */}
      {selectedValuation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold font-mono text-amber-400">
                      {selectedValuation.valuationId}
                    </h3>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                      {selectedValuation.type === 'exchange' ? 'Exchange Upgrade' : 'Sell Phone'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Submitted on {formatDate(selectedValuation.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDelete(selectedValuation.id)}
                  className="p-2 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Delete Request"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedValuation(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Customer Info & Direct Communication */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Customer Name</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedValuation.customerName}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mobile Number</span>
                  <p className="text-sm font-bold font-mono text-indigo-700 mt-0.5">{selectedValuation.mobileNumber}</p>
                </div>
                <div className="flex items-center space-x-2 pt-2 md:pt-0">
                  <a
                    href={`tel:${selectedValuation.mobileNumber}`}
                    className="flex-1 py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center space-x-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/977${selectedValuation.mobileNumber}?text=Hello%20${encodeURIComponent(selectedValuation.customerName)}%2C%20this%20is%20Pandey%20Mobile%20Store%2C%20Traffic%20Chowk%20Butwal%20regarding%20your%20Valuation%20Request%20(${selectedValuation.valuationId})%20for%20${encodeURIComponent(selectedValuation.phoneBrand + ' ' + selectedValuation.phoneModel)}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1"
                  >
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Phone Specifications Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>Submitted Phone Specifications</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 block">Brand & Model:</span>
                    <span className="font-bold text-slate-900">{selectedValuation.phoneBrand} {selectedValuation.phoneModel}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 block">Storage & RAM:</span>
                    <span className="font-bold text-slate-900">{selectedValuation.storage} • {selectedValuation.ram}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 block">Age of Phone:</span>
                    <span className="font-bold text-slate-900">{selectedValuation.purchaseAge}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 block">Customer Expected:</span>
                    <span className="font-bold text-slate-900">{selectedValuation.expectedPrice ? formatNPR(selectedValuation.expectedPrice) : 'Open'}</span>
                  </div>
                </div>

                {selectedValuation.imeiNumber && (
                  <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500 mr-2">IMEI Number:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedValuation.imeiNumber}</span>
                  </div>
                )}

                {selectedValuation.additionalNotes && (
                  <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500 mr-2">Customer Notes:</span>
                    <span className="text-slate-800">{selectedValuation.additionalNotes}</span>
                  </div>
                )}
              </div>

              {/* Exchange Target (if applicable) */}
              {selectedValuation.type === 'exchange' && selectedValuation.exchangeTarget && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <RefreshCw className="w-4 h-4 text-amber-600" />
                    <span>Desired Phone for Exchange Upgrade</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{selectedValuation.exchangeTarget.productName}</p>
                      <p className="text-slate-600">{selectedValuation.exchangeTarget.targetStorage} • {selectedValuation.exchangeTarget.targetColor || 'Standard'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block">Retail Price:</span>
                      <span className="font-bold text-indigo-700 text-sm">
                        {selectedValuation.exchangeTarget.targetPrice ? formatNPR(selectedValuation.exchangeTarget.targetPrice) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 14-Point Hardware Condition Checklist (Organized Grid) */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>14-Point Hardware Condition Breakdown</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-[11px]">
                  
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">1. Front Display</span>
                    <span className="font-bold text-slate-900">{selectedValuation.condition.frontDisplay}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">2. Touch Screen</span>
                    <span className="font-bold text-slate-900">{selectedValuation.condition.touchScreen}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">3. Back Panel</span>
                    <span className="font-bold text-slate-900">{selectedValuation.condition.backGlass}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">4. Frame / Body</span>
                    <span className="font-bold text-slate-900">{selectedValuation.condition.frameBody}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">5. Camera</span>
                    <span className="font-bold text-slate-900">{selectedValuation.condition.camera}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">6. Audio Speaker</span>
                    <span className="font-bold text-slate-900">{selectedValuation.condition.speaker}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">7. Microphone</span>
                    <span className="font-bold text-slate-900">{selectedValuation.condition.microphone}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">8. Charging Port</span>
                    <span className="font-bold text-slate-900">{selectedValuation.condition.chargingPort}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">9. Buttons</span>
                    <span className="font-bold text-slate-900">{selectedValuation.condition.buttons}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">10. Battery Condition</span>
                    <span className="font-bold text-slate-900">{selectedValuation.condition.batteryHealth}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">11. Face ID / Sensor</span>
                    <span className="font-bold text-slate-900">{selectedValuation.condition.faceIdFingerprint}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">12. Wi-Fi & Network</span>
                    <span className="font-bold text-slate-900">{selectedValuation.condition.networkWifi}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">13. Liquid Damage</span>
                    <span className={`font-bold ${selectedValuation.condition.waterDamage === 'No' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {selectedValuation.condition.waterDamage}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">14. Previous Repair</span>
                    <span className={`font-bold ${selectedValuation.condition.previousRepair === 'No' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {selectedValuation.condition.previousRepair}
                    </span>
                  </div>

                </div>
              </div>

              {/* Uploaded Photos Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Customer Uploaded Device Photos ({Object.keys(selectedValuation.photos || {}).length})</span>
                </h4>

                {Object.keys(selectedValuation.photos || {}).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No photos uploaded with this request.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {(
                      [
                        { key: 'front', label: 'Front Display' },
                        { key: 'back', label: 'Back Panel' },
                        { key: 'leftSide', label: 'Left Edge' },
                        { key: 'rightSide', label: 'Right Edge' },
                        { key: 'top', label: 'Top Edge' },
                        { key: 'bottom', label: 'Bottom Port' }
                      ] as const
                    ).map(({ key, label }) => {
                      const photoUrl = selectedValuation.photos[key];
                      if (!photoUrl) return null;

                      return (
                        <div
                          key={key}
                          onClick={() => setPreviewPhoto({ src: photoUrl, title: label })}
                          className="group relative h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer"
                        >
                          <img
                            src={photoUrl}
                            alt={label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                            <span className="text-[10px] text-white font-semibold truncate">{label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ADMIN VALUATION CONTROLS & STATUS UPDATE */}
              <div className="bg-indigo-50/70 border-2 border-indigo-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-indigo-950 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Admin Valuation Controls & Decision</span>
                  </h4>
                  {saveSuccess && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Changes Saved!</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Estimated Valuation Price (NPR)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter estimated price"
                      value={editEstimatedPrice}
                      onChange={(e) => setEditEstimatedPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Initial quote before inspection</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Final Valuation Price (NPR)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter final price"
                      value={editFinalPrice}
                      onChange={(e) => setEditFinalPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Final physical check value</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Valuation Request Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as ValuationStatus)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="New">New</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Physical Inspection Required">Physical Inspection Required</option>
                      <option value="Valuation Given">Valuation Given</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Exchange Adjustment Calculation display */}
                {selectedValuation.type === 'exchange' && selectedValuation.exchangeTarget?.targetPrice && (
                  <div className="bg-white p-3.5 rounded-xl border border-indigo-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block">Target Phone Price:</span>
                      <span className="font-bold text-slate-900">{formatNPR(selectedValuation.exchangeTarget.targetPrice)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Old Phone Value (Final/Est):</span>
                      <span className="font-bold text-indigo-700">
                        {editFinalPrice ? formatNPR(Number(editFinalPrice)) : editEstimatedPrice ? formatNPR(Number(editEstimatedPrice)) : 'Rs. 0'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-800 font-bold block">Exchange Customer Adjustment to Pay:</span>
                      <span className="font-black text-sm text-emerald-700">
                        {formatNPR(
                          Math.max(
                            0,
                            selectedValuation.exchangeTarget.targetPrice -
                              (Number(editFinalPrice) || Number(editEstimatedPrice) || 0)
                          )
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Admin Internal Notes (Staff observations, inspection comments)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter internal inspection remarks or customer agreement notes..."
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedValuation(null)}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveDetails}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-1.5"
                  >
                    {isSaving ? <span>Saving...</span> : <span>Save Valuation & Status</span>}
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* FULL-SIZE PHOTO PREVIEW MODAL */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <div className="flex items-center justify-between w-full text-white mb-2 px-2">
              <span className="text-sm font-bold">{previewPhoto.title}</span>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 bg-slate-800 rounded-full hover:bg-slate-700 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewPhoto.src}
              alt={previewPhoto.title}
              className="max-h-[80vh] w-auto object-contain rounded-xl border border-slate-800"
            />
          </div>
        </div>
      )}

    </div>
  );
};
