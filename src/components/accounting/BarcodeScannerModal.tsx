import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  X,
  RefreshCw,
  Zap,
  ZapOff,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Barcode,
  Keyboard,
  Smartphone
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedValue: string) => void;
  title?: string;
  subtitle?: string;
  placeholderText?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Barcode & IMEI Scanner',
  subtitle = 'मोडल बारकोड वा IMEI स्क्यान गर्नुहोस्',
  placeholderText = 'Type barcode or IMEI manually...'
}) => {
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [scannerStatus, setScannerStatus] = useState<'starting' | 'scanning' | 'scanned' | 'error'>('starting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'accounting-barcode-scanner-viewport';
  const hasHandledScanRef = useRef(false);

  // Synthesized scanner audio beep
  const playBeep = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1750, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.13);
    } catch {
      // AudioContext may be restricted by autoplay policy; fail gracefully
    }
  }, []);

  // Trigger vibration feedback on supported mobile devices
  const triggerHaptic = useCallback(() => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(100);
      }
    } catch {
      // Ignore vibration error
    }
  }, []);

  const handleSuccessfulScan = useCallback((decodedText: string) => {
    if (hasHandledScanRef.current) return;
    hasHandledScanRef.current = true;

    const cleanCode = decodedText.trim();
    setLastScannedCode(cleanCode);
    setScannerStatus('scanned');
    playBeep();
    triggerHaptic();

    // Auto-deliver after brief visual confirmation
    setTimeout(() => {
      onScan(cleanCode);
      onClose();
    }, 450);
  }, [onScan, onClose, playBeep, triggerHaptic]);

  // Stop camera stream safely
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Scanner stop error:', e);
      }
      scannerRef.current = null;
    }
  }, []);

  // Initialize and start camera
  const startScanner = useCallback(async (cameraIdToUse?: string) => {
    if (!isOpen) return;
    await stopScanner();

    setScannerStatus('starting');
    setErrorMessage('');
    hasHandledScanRef.current = false;

    try {
      // Check for available cameras
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setScannerStatus('error');
        setErrorMessage('कुनै क्यामरा फेला परेन। कृपया क्यामरा अनुमति (Permission) जाँच गर्नुहोस्।');
        return;
      }

      setCameras(devices);

      // Choose environment (back) camera by default if not specified
      let targetId = cameraIdToUse;
      if (!targetId) {
        const backCam = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') || 
          d.label.toLowerCase().includes('environment')
        );
        targetId = backCam ? backCam.id : devices[0].id;
      }

      setActiveCameraId(targetId);

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.DATA_MATRIX
        ],
        verbose: false
      });

      scannerRef.current = html5QrCode;

      const config = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          // Optimized rectangular scanning window for 1D barcodes and 2D codes
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const width = Math.floor(minEdge * 0.9);
          const height = Math.floor(width * 0.55);
          return { width, height };
        },
        aspectRatio: 1.3333
      };

      await html5QrCode.start(
        targetId ? { deviceId: { exact: targetId } } : { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        () => {
          // Continuous scanning ticks, no action needed for frame failures
        }
      );

      setScannerStatus('scanning');

      // Check torch capabilities
      try {
        const anyScanner = html5QrCode as unknown as { getRunningTrackCameraCapabilities?: () => { torchFeature?: () => { isSupported: () => boolean; apply: (val: boolean) => Promise<void> } } };
        const track = anyScanner.getRunningTrackCameraCapabilities?.();
        if (track && track.torchFeature && track.torchFeature().isSupported()) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: unknown) {
      console.error('Failed to start barcode camera:', err);
      setScannerStatus('error');
      const errStr = String(err);
      if (errStr.includes('NotAllowedError') || errStr.includes('Permission')) {
        setErrorMessage('क्यामरा चलाउने अनुमति अस्वीकृत गरियो (Camera Permission Denied)। कृपया ब्राउजर सेटिङमा क्यामरालाई Allow गर्नुहोस्।');
      } else {
        setErrorMessage('क्यामरा खोल्न सकिएन। तपाईं तल म्यानुअल रूपमा टाइप गरेर पनि बारकोड/IMEI प्रविष्टि गर्न सक्नुहुन्छ।');
      }
    }
  }, [isOpen, handleSuccessfulScan, stopScanner]);

  // Flip camera (switch between back and front cameras)
  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    if (nextCamera) {
      setActiveCameraId(nextCamera.id);
      await startScanner(nextCamera.id);
    }
  };

  // Toggle flashlight / torch
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const anyScanner = scannerRef.current as unknown as { getRunningTrackCameraCapabilities?: () => { torchFeature?: () => { apply: (val: boolean) => Promise<void> } } };
      const track = anyScanner.getRunningTrackCameraCapabilities?.();
      if (track && track.torchFeature) {
        const nextState = !torchEnabled;
        await track.torchFeature().apply(nextState);
        setTorchEnabled(nextState);
      }
    } catch (e) {
      console.warn('Torch toggle not supported on this device:', e);
    }
  };

  // Scan from photo / image upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScannerStatus('starting');
      await stopScanner();

      const tempScanner = new Html5Qrcode('accounting-file-scan-temp', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.UPC_A
        ],
        verbose: false
      });

      const result = await tempScanner.scanFile(file, true);
      tempScanner.clear();

      if (result) {
        handleSuccessfulScan(result);
      }
    } catch (err) {
      console.warn('File scan error:', err);
      setScannerStatus('error');
      setErrorMessage('फोटोमा बारकोड फेला परेन। कृपया स्पष्ट फोटो खिच्नुहोस् वा म्यानुअल लेख्नुहोस्।');
      // Restart camera scanner
      setTimeout(() => {
        startScanner(activeCameraId);
      }, 1500);
    }
  };

  // Submit manual input
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleSuccessfulScan(manualInput.trim());
  };

  // Mount / Unmount lifecycle
  useEffect(() => {
    if (isOpen && !isManualMode) {
      // Small timeout to allow DOM container to render
      const timer = setTimeout(() => {
        startScanner();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, isManualMode, startScanner, stopScanner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-white flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <span>{title}</span>
                <span className="px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-[10px] rounded font-mono font-semibold">
                  LIVE CAM
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative bg-black w-full min-h-[290px] sm:min-h-[320px] flex items-center justify-center overflow-hidden">
          {/* HTML5 QR Code Container */}
          <div
            id={scannerContainerId}
            className="w-full h-full min-h-[290px] sm:min-h-[320px]"
          />

          {/* Hidden element for file scanning */}
          <div id="accounting-file-scan-temp" className="hidden" />

          {/* Scanning Reticle & Overlay Guide */}
          {scannerStatus === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Target box */}
              <div className="w-[82%] max-w-[290px] h-[150px] border-2 border-indigo-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                {/* Red scanning laser bar */}
                <div className="absolute left-1 right-1 h-0.5 bg-rose-500/90 shadow-[0_0_10px_#f43f5e] animate-pulse top-1/2 -translate-y-1/2" />
                
                {/* Corner markers */}
                <div className="absolute top-1 left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-white rounded-tl" />
                <div className="absolute top-1 right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-white rounded-tr" />
                <div className="absolute bottom-1 left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-white rounded-bl" />
                <div className="absolute bottom-1 right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-white rounded-br" />

                <div className="absolute -bottom-7 left-0 right-0 text-center">
                  <span className="text-[11px] font-semibold text-white/90 bg-black/60 px-2.5 py-0.5 rounded-full border border-white/20 backdrop-blur-xs">
                    बारकोड वा IMEI फ्रेमभित्र राख्नुहोस्
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Scanned Confirmation Screen */}
          {scannerStatus === 'scanned' && (
            <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-150">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                सफलतापूर्वक स्क्यान भयो!
              </h4>
              <p className="text-xs text-emerald-300 font-mono bg-black/40 px-3 py-1.5 rounded-lg border border-emerald-500/30 break-all max-w-[280px]">
                {lastScannedCode}
              </p>
            </div>
          )}

          {/* Error Message Screen */}
          {scannerStatus === 'error' && (
            <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-rose-300 font-medium mb-4 max-w-[280px]">
                {errorMessage || 'क्यामरा सुरु गर्दा समस्या आयो।'}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => startScanner(activeCameraId)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>पुनः प्रयास गर्नुहोस्</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualMode(true)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  म्यानुअल लेख्नुहोस्
                </button>
              </div>
            </div>
          )}

          {/* Camera Controls Floating Bar */}
          {scannerStatus === 'scanning' && (
            <div className="absolute top-3 right-3 flex items-center space-x-2 z-20">
              {/* Torch button (if supported) */}
              {hasTorch && (
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`p-2 rounded-xl backdrop-blur-md border transition-colors cursor-pointer ${
                    torchEnabled
                      ? 'bg-amber-400 text-slate-900 border-amber-300'
                      : 'bg-black/50 text-white border-white/20 hover:bg-black/70'
                  }`}
                  title="Toggle Flashlight"
                >
                  {torchEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                </button>
              )}

              {/* Flip camera button (if multiple cameras exist) */}
              {cameras.length > 1 && (
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md transition-colors cursor-pointer"
                  title="Switch Camera (अगाडि/पछाडि क्यामरा)"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions / Manual Input */}
        <div className="p-4 bg-slate-850 border-t border-slate-700/80 space-y-3">
          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={placeholderText}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Enter
            </button>
          </form>

          {/* Quick Upload from Gallery & Manual toggle */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
            <label className="flex items-center space-x-1.5 hover:text-white transition-colors cursor-pointer">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>ग्यालरीबाट फोटो छान्नुहोस्</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <span className="flex items-center space-x-1 text-slate-500">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Camera Optimized</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
