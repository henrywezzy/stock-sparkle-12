import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose?: () => void;
  className?: string;
}

export function BarcodeScanner({ onScan, onClose, className }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    if (!containerRef.current) return;

    try {
      setError(null);
      const scanner = new Html5Qrcode('barcode-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Vibrate on successful scan
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
          
          // Play beep sound
          const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU');
          audio.volume = 0.3;
          audio.play().catch(() => {});
          
          onScan(decodedText);
          stopScanner();
        },
        () => {} // Ignore scan errors
      );

      setIsScanning(true);
    } catch (err) {
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
      console.error('Scanner error:', err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  const toggleCamera = async () => {
    await stopScanner();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (isScanning) {
      stopScanner().then(() => startScanner());
    }
  }, [facingMode]);

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Scanner container */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-sm aspect-square bg-muted rounded-2xl overflow-hidden"
      >
        <div id="barcode-reader" className="w-full h-full" />
        
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/80 backdrop-blur-sm">
            <Camera className="w-16 h-16 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center px-4">
              Clique em "Iniciar Scanner" para escanear códigos de barras ou QR codes
            </p>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Scan frame overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-primary rounded-lg">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              </div>
            </div>
            {/* Scanning line animation */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-64">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="w-full max-w-sm p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive text-center">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {isScanning ? (
          <>
            <Button
              variant="outline"
              size="lg"
              onClick={toggleCamera}
              className="h-14 px-6"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Trocar Câmera
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onClick={stopScanner}
              className="h-14 px-6"
            >
              <CameraOff className="w-5 h-5 mr-2" />
              Parar
            </Button>
          </>
        ) : (
          <Button
            size="lg"
            onClick={startScanner}
            className="h-14 px-8 text-lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            Iniciar Scanner
          </Button>
        )}

        {onClose && (
          <Button
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="h-14"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
