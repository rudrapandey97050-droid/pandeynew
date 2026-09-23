import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  Sliders,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  RotateCcw,
  Scissors
} from 'lucide-react';
import { SalesInvoice, AccountingSettings, BillPaperSize, PrintSetupConfig } from '../../types/accounting.ts';
import { AccountingStorageService } from '../../services/accountingStorage.ts';

interface InvoicePrintModalProps {
  invoice: SalesInvoice;
  settings: AccountingSettings;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  settings,
  onClose
}) => {
  // Load saved default print setup if available
  const initialSetup: PrintSetupConfig = settings.printSetup || {
    paperSize: settings.defaultPaperSize || 'a4',
    customWidthMm: 210,
    customHeightMm: 297,
    orientation: 'portrait',
    marginMm: 8,
    fontScale: 'normal',
    copies: 1,
    showPanVat: true,
    showImei: true,
    showWarranty: true,
    showTerms: true,
    showSignatures: true,
    showPaidStamp: true,
    showCustomerAddress: true,
    showCompanyHeader: true
  };

  const [paperSize, setPaperSize] = useState<BillPaperSize>(initialSetup.paperSize || 'a4');
  const [customWidthMm, setCustomWidthMm] = useState<number>(initialSetup.customWidthMm || 210);
  const [customHeightMm, setCustomHeightMm] = useState<number>(initialSetup.customHeightMm || 297);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(initialSetup.orientation || 'portrait');
  const [marginMm, setMarginMm] = useState<number>(initialSetup.marginMm ?? 8);
  const [fontScale, setFontScale] = useState<'compact' | 'normal' | 'large'>(initialSetup.fontScale || 'normal');
  const [copies, setCopies] = useState<1 | 2>(initialSetup.copies || 1);

  // Content toggles
  const [showPanVat, setShowPanVat] = useState<boolean>(initialSetup.showPanVat ?? true);
  const [showImei, setShowImei] = useState<boolean>(initialSetup.showImei ?? true);
  const [showWarranty, setShowWarranty] = useState<boolean>(initialSetup.showWarranty ?? true);
  const [showTerms, setShowTerms] = useState<boolean>(initialSetup.showTerms ?? true);
  const [showSignatures, setShowSignatures] = useState<boolean>(initialSetup.showSignatures ?? true);
  const [showPaidStamp, setShowPaidStamp] = useState<boolean>(initialSetup.showPaidStamp ?? true);
  const [showCustomerAddress, setShowCustomerAddress] = useState<boolean>(initialSetup.showCustomerAddress ?? true);
  const [showCompanyHeader, setShowCompanyHeader] = useState<boolean>(initialSetup.showCompanyHeader ?? true);

  const [showSetupPanel, setShowSetupPanel] = useState(false);
  const [savedDefaultSuccess, setSavedDefaultSuccess] = useState(false);

  // Preset dimension change handler
  const handlePaperSizeChange = (size: BillPaperSize) => {
    setPaperSize(size);
    if (size === 'a4') {
      setCustomWidthMm(210);
      setCustomHeightMm(297);
      setOrientation('portrait');
      setMarginMm(8);
      setFontScale('normal');
    } else if (size === 'a5_portrait') {
      setCustomWidthMm(148);
      setCustomHeightMm(210);
      setOrientation('portrait');
      setMarginMm(6);
      setFontScale('compact');
    } else if (size === 'a5_landscape') {
      setCustomWidthMm(210);
      setCustomHeightMm(148);
      setOrientation('landscape');
      setMarginMm(6);
      setFontScale('compact');
    } else if (size === 'thermal_80') {
      setCustomWidthMm(80);
      setCustomHeightMm(0); // 0 = auto height / continuous roll
      setOrientation('portrait');
      setMarginMm(2);
      setFontScale('normal');
    } else if (size === 'thermal_58') {
      setCustomWidthMm(58);
      setCustomHeightMm(0);
      setOrientation('portrait');
      setMarginMm(1);
      setFontScale('compact');
    }
  };

  // Save current setup as default for the shop
  const handleSaveAsDefault = () => {
    const newConfig: PrintSetupConfig = {
      paperSize,
      customWidthMm,
      customHeightMm,
      orientation,
      marginMm,
      fontScale,
      copies,
      showPanVat,
      showImei,
      showWarranty,
      showTerms,
      showSignatures,
      showPaidStamp,
      showCustomerAddress,
      showCompanyHeader
    };

    const updatedSettings: AccountingSettings = {
      ...settings,
      defaultPaperSize: paperSize,
      printSetup: newConfig
    };

    AccountingStorageService.saveSettings(updatedSettings);
    setSavedDefaultSuccess(true);
    setTimeout(() => setSavedDefaultSuccess(false), 2500);
  };

  // Calculate dynamic @page size for browser print dialog
  const getPageSizeCss = () => {
    if (paperSize === 'a4') {
      return orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait';
    }
    if (paperSize === 'a5_portrait') {
      return 'A5 portrait';
    }
    if (paperSize === 'a5_landscape') {
      return 'A5 landscape';
    }
    if (paperSize === 'thermal_80') {
      return '80mm auto';
    }
    if (paperSize === 'thermal_58') {
      return '58mm auto';
    }
    // Custom size
    const width = customWidthMm || 148;
    const height = customHeightMm && customHeightMm > 0 ? `${customHeightMm}mm` : 'auto';
    return `${width}mm ${height}`;
  };

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  // Preview container max-width / width calculation
  const getPreviewWidthClass = () => {
    if (paperSize === 'thermal_58') return 'w-[230px]';
    if (paperSize === 'thermal_80') return 'w-[320px]';
    if (paperSize === 'a5_portrait') return 'w-[480px] max-w-full';
    if (paperSize === 'a5_landscape') return 'w-[680px] max-w-full';
    if (paperSize === 'custom') {
      if (customWidthMm <= 65) return 'w-[240px]';
      if (customWidthMm <= 90) return 'w-[330px]';
      if (customWidthMm <= 160) return 'w-[500px] max-w-full';
      return 'w-[680px] max-w-full';
    }
    return 'w-[720px] max-w-full'; // A4
  };

  const isThermal = paperSize === 'thermal_80' || paperSize === 'thermal_58' || (paperSize === 'custom' && customWidthMm <= 90);

  // Render a single invoice copy (Sheet format)
  const renderStandardInvoiceCopy = (copyTitle?: string) => {
    const textSize = fontScale === 'compact' ? 'text-[11px]' : fontScale === 'large' ? 'text-[13px]' : 'text-xs';
    const subTextSize = fontScale === 'compact' ? 'text-[10px]' : fontScale === 'large' ? 'text-xs' : 'text-[11px]';
    const headingSize = fontScale === 'compact' ? 'text-lg' : fontScale === 'large' ? 'text-2xl' : 'text-xl';

    return (
      <div className={`bg-white text-slate-800 font-sans ${textSize} leading-relaxed relative`}>
        {/* Copy Label (e.g. Original / Duplicate) */}
        {copyTitle && (
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-dashed border-slate-300">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {copyTitle}
            </span>
            <span className="text-[10px] text-slate-400">Bill #{invoice.invoiceNumber}</span>
          </div>
        )}

        {/* Company Header */}
        {showCompanyHeader && (
          <div className="border-b-2 border-slate-800 pb-3 mb-4 flex justify-between items-start">
            <div className="space-y-0.5 max-w-[65%]">
              <h1 className={`${headingSize} font-extrabold text-slate-950 font-serif tracking-tight leading-none`}>
                {settings.companyName}
              </h1>
              <p className={`text-slate-600 ${subTextSize} font-medium mt-0.5`}>{settings.address}</p>
              <p className={`text-slate-600 ${subTextSize}`}>
                Phone: <span className="font-semibold text-slate-900">{settings.phone}</span>
                {settings.email && <span> | Email: {settings.email}</span>}
              </p>
              {showPanVat && settings.panNumber && (
                <div className="inline-block mt-0.5">
                  <span className="text-slate-800 text-[10px] font-mono font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                    PAN / VAT NO: {settings.panNumber}
                  </span>
                </div>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-extrabold text-[11px] tracking-wider uppercase rounded-md shadow-xs">
                {settings.enableVat ? 'TAX INVOICE' : 'CASH / CREDIT MEMO'}
              </span>
              <div className="mt-2 text-right space-y-0.5">
                <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Invoice No:</p>
                <p className="text-xs sm:text-sm font-mono font-black text-slate-950">{invoice.invoiceNumber}</p>
                <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider mt-0.5">Date:</p>
                <p className={`font-semibold text-slate-800 ${subTextSize}`}>{invoice.invoiceDate}</p>
              </div>
            </div>
          </div>
        )}

        {/* Billed To / Customer Details */}
        <div className="grid grid-cols-2 gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 mb-3 text-xs">
          <div>
            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block mb-0.5">
              Customer Details (ग्राहकको विवरण):
            </span>
            <p className="font-bold text-slate-950 text-xs sm:text-sm">{invoice.customerName}</p>
            <p className="text-slate-600 text-[11px] font-medium">{invoice.customerPhone}</p>
            {showCustomerAddress && invoice.customerAddress && (
              <p className="text-slate-600 text-[11px]">{invoice.customerAddress}</p>
            )}
            {showPanVat && invoice.customerPan && (
              <p className="text-slate-700 font-mono text-[10px] mt-0.5">Cust. PAN: {invoice.customerPan}</p>
            )}
          </div>

          <div className="text-right flex flex-col justify-between">
            <div>
              <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block mb-0.5">
                Payment Mode (विधि):
              </span>
              <p className="font-bold text-slate-900 text-xs">{invoice.paymentMethod}</p>
              <div className="mt-0.5 flex items-center justify-end gap-1.5">
                <span className="text-[10px] text-slate-500">Status:</span>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                  invoice.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                  invoice.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                  {invoice.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse mb-3 text-left">
          <thead>
            <tr className="bg-slate-900 text-white text-[11px]">
              <th className="py-2 px-2.5 font-bold text-center w-8">SN</th>
              <th className="py-2 px-2.5 font-bold">Item Description</th>
              {showWarranty && <th className="py-2 px-2 font-bold text-center w-16">Warr.</th>}
              <th className="py-2 px-2 font-bold text-center w-10">Qty</th>
              <th className="py-2 px-2.5 font-bold text-right w-20">Rate</th>
              {invoice.discountTotal > 0 && <th className="py-2 px-2 font-bold text-right w-16">Disc</th>}
              <th className="py-2 px-2.5 font-bold text-right w-24">Total (Rs.)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 border-b border-slate-300">
            {invoice.items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50">
                <td className="py-2 px-2.5 text-center text-slate-500 font-medium text-[10px]">{idx + 1}</td>
                <td className="py-2 px-2.5">
                  <p className="font-bold text-slate-900 leading-snug">{item.productName}</p>
                  {item.brand && (
                    <span className="text-[10px] text-slate-500 mr-2">{item.brand} {item.model}</span>
                  )}
                  {showImei && item.imeiOrSerial && (
                    <div className="mt-0.5 inline-flex items-center text-[9px] font-mono font-semibold text-indigo-800 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200">
                      IMEI/SN: {item.imeiOrSerial}
                    </div>
                  )}
                </td>
                {showWarranty && (
                  <td className="py-2 px-2 text-center text-slate-600 text-[10px]">
                    {item.warrantyMonths ? `${item.warrantyMonths} M` : '-'}
                  </td>
                )}
                <td className="py-2 px-2 text-center font-bold text-slate-900">{item.qty}</td>
                <td className="py-2 px-2.5 text-right font-mono text-slate-700">
                  {item.rate.toLocaleString()}
                </td>
                {invoice.discountTotal > 0 && (
                  <td className="py-2 px-2 text-right font-mono text-rose-600 text-[11px]">
                    {item.discount > 0 ? `${item.discount.toLocaleString()}` : '-'}
                  </td>
                )}
                <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-950">
                  {item.totalAmount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Calculation */}
        <div className="flex justify-between items-start mb-4">
          {/* Notes & Terms on the left for sheet layouts */}
          <div className="max-w-[55%] pr-4 space-y-1">
            {showTerms && (
              <div className="text-[9px] text-slate-500 space-y-0.5 pt-1">
                <p className="font-bold text-slate-700 uppercase tracking-wider">Terms & Conditions:</p>
                <p className="leading-snug">{settings.printTerms}</p>
              </div>
            )}
            {invoice.notes && (
              <p className="text-[10px] text-slate-700 italic font-medium">Remarks: {invoice.notes}</p>
            )}
          </div>

          <div className="w-56 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600 py-0.5 border-b border-slate-100">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900">Rs. {invoice.subtotal.toLocaleString()}</span>
            </div>

            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-rose-600 py-0.5 border-b border-slate-100">
                <span>Discount:</span>
                <span className="font-mono font-semibold">- Rs. {invoice.discountTotal.toLocaleString()}</span>
              </div>
            )}

            {settings.enableVat && (
              <div className="flex justify-between text-slate-600 py-0.5 border-b border-slate-100">
                <span>VAT ({settings.vatRate}%):</span>
                <span className="font-mono font-semibold text-slate-900">Rs. {invoice.taxTotal.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-xs sm:text-sm font-black text-slate-950 py-1 border-b-2 border-slate-900 bg-slate-100 px-2 rounded">
              <span>Grand Total:</span>
              <span className="font-mono">Rs. {invoice.grandTotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-emerald-700 font-semibold py-0.5">
              <span>Paid:</span>
              <span className="font-mono">Rs. {invoice.paidAmount.toLocaleString()}</span>
            </div>

            {invoice.dueAmount > 0 && (
              <div className="flex justify-between text-rose-700 font-bold py-1 bg-rose-50 px-2 rounded border border-rose-200">
                <span>Due Balance:</span>
                <span className="font-mono">Rs. {invoice.dueAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Paid Stamp */}
        {showPaidStamp && invoice.paymentStatus === 'paid' && (
          <div className="absolute right-64 bottom-14 opacity-25 pointer-events-none rotate-[-12deg] border-4 border-emerald-600 text-emerald-600 font-black text-2xl px-4 py-1 rounded-xl uppercase tracking-widest">
            PAID IN FULL
          </div>
        )}

        {/* Signatures */}
        {showSignatures && (
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-dashed border-slate-300 text-center">
            <div>
              <div className="w-32 border-b border-slate-400 mx-auto mb-1"></div>
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Customer Signature</p>
            </div>
            <div>
              <div className="w-32 border-b border-slate-400 mx-auto mb-1"></div>
              <p className="text-[9px] font-bold text-slate-800 uppercase tracking-wider font-serif">
                For {settings.companyName}
              </p>
              <p className="text-[8px] text-slate-400">Authorized Signatory</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render POS Thermal roll format (80mm / 58mm)
  const renderThermalInvoiceCopy = (copyTitle?: string) => {
    const is58 = paperSize === 'thermal_58' || (paperSize === 'custom' && customWidthMm <= 65);
    const fontSizeClass = is58 ? 'text-[9px]' : 'text-[11px]';
    const headerTitleSize = is58 ? 'text-xs' : 'text-sm';

    return (
      <div className={`bg-white text-slate-900 font-mono ${fontSizeClass} leading-tight`}>
        {copyTitle && (
          <div className="text-center font-bold pb-1 mb-1 border-b border-dashed border-slate-400 uppercase tracking-wider text-[9px]">
            [{copyTitle}]
          </div>
        )}

        {/* Header */}
        <div className="text-center pb-2 border-b border-dashed border-slate-400">
          <h2 className={`${headerTitleSize} font-black font-sans uppercase`}>{settings.companyName}</h2>
          <p className="text-[9px] text-slate-600">{settings.address}</p>
          <p className="text-[9px]">Tel: {settings.phone}</p>
          {showPanVat && settings.panNumber && (
            <p className="text-[9px] font-bold mt-0.5">PAN: {settings.panNumber}</p>
          )}
          <p className="mt-1 font-bold text-[10px] uppercase bg-slate-100 py-0.5">
            {settings.enableVat ? 'TAX INVOICE' : 'CASH / BILL MEMO'}
          </p>
        </div>

        {/* Bill & Customer Details */}
        <div className="py-1.5 border-b border-dashed border-slate-400 text-[9px] space-y-0.5">
          <div className="flex justify-between">
            <span>INV: <span className="font-bold font-mono">{invoice.invoiceNumber}</span></span>
            <span>{invoice.invoiceDate}</span>
          </div>
          <div>Cust: <span className="font-bold">{invoice.customerName}</span></div>
          {invoice.customerPhone && <div>Tel: {invoice.customerPhone}</div>}
          {showPanVat && invoice.customerPan && <div>PAN: {invoice.customerPan}</div>}
          <div>Mode: <span className="font-bold">{invoice.paymentMethod}</span></div>
        </div>

        {/* Items Table */}
        <div className="py-1.5 border-b border-dashed border-slate-400">
          <table className="w-full text-[9px]">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="text-left pb-1">Item</th>
                <th className="text-center pb-1 w-6">Qty</th>
                <th className="text-right pb-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-1 pr-1">
                    <div className="font-bold text-slate-950">{item.productName}</div>
                    {item.brand && <div className="text-[8px] text-slate-500">{item.brand} {item.model}</div>}
                    {showImei && item.imeiOrSerial && (
                      <div className="text-[8px] text-slate-600 font-mono font-bold">IMEI: {item.imeiOrSerial}</div>
                    )}
                    {showWarranty && item.warrantyMonths && (
                      <div className="text-[8px] text-slate-500">Warr: {item.warrantyMonths}M</div>
                    )}
                  </td>
                  <td className="text-center py-1 font-bold">{item.qty}</td>
                  <td className="text-right py-1 font-bold font-mono">
                    Rs.{item.totalAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="py-1.5 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono">Rs.{invoice.subtotal.toLocaleString()}</span>
          </div>
          {invoice.discountTotal > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>Discount:</span>
              <span className="font-mono">-Rs.{invoice.discountTotal.toLocaleString()}</span>
            </div>
          )}
          {settings.enableVat && (
            <div className="flex justify-between text-slate-600">
              <span>VAT ({settings.vatRate}%):</span>
              <span className="font-mono">Rs.{invoice.taxTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-300">
            <span>GRAND TOTAL:</span>
            <span className="font-mono">Rs.{invoice.grandTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-bold">
            <span>PAID:</span>
            <span className="font-mono">Rs.{invoice.paidAmount.toLocaleString()}</span>
          </div>
          {invoice.dueAmount > 0 && (
            <div className="flex justify-between text-rose-700 font-bold">
              <span>DUE BAL:</span>
              <span className="font-mono">Rs.{invoice.dueAmount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Footer Note & Terms */}
        <div className="text-center pt-2 text-[8px] text-slate-600 space-y-1">
          <p className="font-bold">*** धन्यवाद! फेरि पाल्नुहोला ***</p>
          {showTerms && <p className="leading-tight">{settings.printTerms}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      
      {/* Dynamic Print CSS injected during window.print() */}
      <style>
        {`
          @media print {
            @page {
              size: ${getPageSizeCss()};
              margin: ${marginMm}mm;
            }
            body {
              background: white !important;
              color: black !important;
            }
            /* Hide all UI elements except the printable bill container */
            body * {
              visibility: hidden;
            }
            #printable-bill-root, #printable-bill-root * {
              visibility: visible;
            }
            #printable-bill-root {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              margin: 0 !important;
              padding: ${marginMm}mm !important;
              background: white !important;
              box-shadow: none !important;
              border: none !important;
            }
          }
        `}
      </style>

      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col border border-slate-200 overflow-hidden">
        
        {/* MODAL TOP BAR (Print Setup & Controls) */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden border-b border-slate-800">
          
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Invoice #{invoice.invoiceNumber}</span>
                <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                  invoice.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  invoice.paymentStatus === 'partial' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {invoice.paymentStatus}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {invoice.customerName} • Rs. {invoice.grandTotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Quick Paper Size Selector Chips */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs font-semibold overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => handlePaperSizeChange('a4')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                paperSize === 'a4' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="A4 Full Page (२१० × २९७ mm)"
            >
              A4
            </button>
            <button
              type="button"
              onClick={() => handlePaperSizeChange('a5_portrait')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                paperSize === 'a5_portrait' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="A5 Half Sheet Portrait (१४८ × २१० mm)"
            >
              A5 Portrait
            </button>
            <button
              type="button"
              onClick={() => handlePaperSizeChange('a5_landscape')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                paperSize === 'a5_landscape' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="A5 Half Sheet Landscape (२१० × १४८ mm)"
            >
              A5 Landscape
            </button>
            <button
              type="button"
              onClick={() => handlePaperSizeChange('thermal_80')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                paperSize === 'thermal_80' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="POS 80mm (३ इन्च थर्मल रसिद)"
            >
              POS 80mm
            </button>
            <button
              type="button"
              onClick={() => handlePaperSizeChange('thermal_58')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                paperSize === 'thermal_58' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="POS 58mm (२ इन्च ब्लुटुथ रसिद)"
            >
              POS 58mm
            </button>
            <button
              type="button"
              onClick={() => handlePaperSizeChange('custom')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                paperSize === 'custom' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Custom Dimensions (कस्टम साइज सम्पादन)"
            >
              Custom
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowSetupPanel(!showSetupPanel)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                showSetupPanel
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Print Setup: Edit Paper Dimensions, Margins, Copies & Toggles"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>साइज सेटिङ</span>
              {showSetupPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* EXPANDABLE PRINT SETUP & PAPER SIZE EDITOR PANEL */}
        {showSetupPanel && (
          <div className="bg-slate-900/95 border-b border-slate-800 text-slate-200 p-4 text-xs shrink-0 print:hidden transition-all">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Paper Dimensions */}
              <div className="space-y-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>कागजको साइज (Dimensions)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {customWidthMm} × {customHeightMm ? `${customHeightMm}mm` : 'Auto'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">चौडाइ (Width mm)</label>
                    <input
                      type="number"
                      min={40}
                      max={350}
                      value={customWidthMm}
                      onChange={(e) => {
                        setCustomWidthMm(Number(e.target.value));
                        setPaperSize('custom');
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono text-xs focus:border-indigo-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">लम्बाइ (Height mm)</label>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={customHeightMm}
                      placeholder="0 = Auto Roll"
                      onChange={(e) => {
                        setCustomHeightMm(Number(e.target.value));
                        setPaperSize('custom');
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono text-xs focus:border-indigo-500 outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handlePaperSizeChange('a4')}
                    className="text-[10px] px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                  >
                    Set A4
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePaperSizeChange('a5_portrait')}
                    className="text-[10px] px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                  >
                    Set A5
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePaperSizeChange('thermal_80')}
                    className="text-[10px] px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                  >
                    Set 80mm
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePaperSizeChange('thermal_58')}
                    className="text-[10px] px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                  >
                    Set 58mm
                  </button>
                </div>
              </div>

              {/* Layout & Orientation */}
              <div className="space-y-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="font-bold text-slate-200 block">Orientation & Margins</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">अभिमुखीकरण</label>
                    <select
                      value={orientation}
                      onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs outline-hidden"
                    >
                      <option value="portrait">Portrait (ठाडो)</option>
                      <option value="landscape">Landscape (तेर्सो)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">मार्जिन (Margin mm)</label>
                    <select
                      value={marginMm}
                      onChange={(e) => setMarginMm(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs outline-hidden font-mono"
                    >
                      <option value={0}>0 mm (Borderless)</option>
                      <option value={3}>3 mm (Thermal)</option>
                      <option value={6}>6 mm (Compact)</option>
                      <option value={8}>8 mm (Normal)</option>
                      <option value={12}>12 mm (Wide)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">फन्ट स्केल (Font Scale)</label>
                    <select
                      value={fontScale}
                      onChange={(e) => setFontScale(e.target.value as 'compact' | 'normal' | 'large')}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs outline-hidden"
                    >
                      <option value="compact">Compact (सानो)</option>
                      <option value="normal">Normal (सामान्य)</option>
                      <option value="large">Large (ठूलो)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">प्रतिहरू (Copies)</label>
                    <select
                      value={copies}
                      onChange={(e) => setCopies(Number(e.target.value) as 1 | 2)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs outline-hidden"
                    >
                      <option value={1}>Single (१ प्रति)</option>
                      <option value={2}>Duplicate (२ प्रति)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Content Display Toggles */}
              <div className="space-y-1.5 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <span className="font-bold text-slate-200 block mb-1">बिलमा देखाउने विवरणहरू</span>
                
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPanVat}
                      onChange={(e) => setShowPanVat(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>PAN / VAT</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showImei}
                      onChange={(e) => setShowImei(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>IMEI / Serial</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showWarranty}
                      onChange={(e) => setShowWarranty(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Warranty</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSignatures}
                      onChange={(e) => setShowSignatures(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Signatures</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTerms}
                      onChange={(e) => setShowTerms(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Terms / Remarks</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPaidStamp}
                      onChange={(e) => setShowPaidStamp(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Paid Stamp</span>
                  </label>
                </div>
              </div>

              {/* Save As Default Button */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-200 block mb-1">सधैंको लागि सुरक्षित</span>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    यो कागजको साइज तथा सेटिङलाई पसलको स्थायी डिफल्ट बनाउनुहोस्।
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveAsDefault}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    {savedDefaultSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>डिफल्ट सुरक्षित भयो!</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save as Shop Default</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* PRINTABLE PREVIEW CANVAS AREA */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 bg-slate-100 flex justify-center items-start">
          
          <div
            id="printable-bill-root"
            className={`bg-white border border-slate-300 shadow-md ${getPreviewWidthClass()} p-4 sm:p-6 transition-all rounded-sm`}
            style={{
              padding: isThermal ? `${marginMm || 4}mm` : `${marginMm || 8}mm`
            }}
          >
            {/* FIRST COPY */}
            {isThermal ? (
              renderThermalInvoiceCopy(copies === 2 ? 'ORIGINAL - ग्राहक प्रति' : undefined)
            ) : (
              renderStandardInvoiceCopy(copies === 2 ? 'ORIGINAL - ग्राहक प्रति' : undefined)
            )}

            {/* DUPLICATE COPY IF ENABLED */}
            {copies === 2 && (
              <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-400 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 text-slate-400 text-[10px] flex items-center space-x-1">
                  <Scissors className="w-3 h-3" />
                  <span>यहाँबाट काट्नुहोस् (Cut along dashed line)</span>
                </div>

                {isThermal ? (
                  renderThermalInvoiceCopy('DUPLICATE - पसल प्रति')
                ) : (
                  renderStandardInvoiceCopy('DUPLICATE - पसल प्रति')
                )}
              </div>
            )}
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-4 sm:px-6 py-3 bg-white border-t border-slate-200 flex flex-wrap justify-between items-center text-xs text-slate-500 print:hidden gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">कागजको साइज:</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-900 uppercase">
              {paperSize} ({customWidthMm}mm × {customHeightMm ? `${customHeightMm}mm` : 'Auto'})
            </span>
            {copies === 2 && (
              <span className="px-2 py-0.5 rounded bg-amber-100 font-bold text-amber-800 text-[10px]">
                २ प्रति (Original + Duplicate)
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>प्रिन्ट गर्नुहोस् (Print Bill)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
