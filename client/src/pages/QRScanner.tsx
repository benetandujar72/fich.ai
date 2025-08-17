import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  QrCode, 
  Camera, 
  CheckCircle, 
  Clock, 
  User,
  AlertTriangle,
  Smartphone,
  ArrowLeft,
  FileText
} from 'lucide-react';
import { Link } from 'wouter';

export default function QRScanner() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [lastResult, setLastResult] = useState<any>(null);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // QR Processing mutation - uses authenticated session
  const processQRMutation = useMutation({
    mutationFn: async (qrData: string) => {
      console.log("🔥 PROCESSING QR WITH USER SESSION:", user?.id);
      
      // Extract employee ID from QR code (format: userId-YYYY-MM-DD)
      const qrParts = qrData.trim().split('-');
      if (qrParts.length < 4) {
        throw new Error('Format del codi QR no vàlid');
      }
      
      const userIdParts = qrParts.slice(0, -3);
      const employeeId = userIdParts.join('-');
      const qrDate = `${qrParts[qrParts.length-3]}-${qrParts[qrParts.length-2]}-${qrParts[qrParts.length-1]}`;
      const todayDate = new Date().toISOString().split('T')[0];
      
      // Validate QR is from today
      if (qrDate !== todayDate) {
        throw new Error('Aquest codi QR ha caducat. Genera un nou codi QR.');
      }
      
      // SECURITY: Only allow user to scan their own QR code
      if (employeeId !== user?.id) {
        throw new Error('Només pots utilitzar el teu propi codi QR personal segons la normativa vigent.');
      }
      
      // Process the QR code with the authenticated session
      return await apiRequest("POST", "/api/attendance/qr-process", {
        qrData: qrData.trim(),
        timestamp: new Date().toISOString(),
        location: window.location.origin
      });
    },
    onSuccess: (data: any) => {
      console.log("✅ QR PROCESSED SUCCESSFULLY:", data);
      setLastResult(data);
      
      toast({
        title: "Fitxatge Registrat!",
        description: `${data.type === 'check_in' ? 'Entrada' : 'Sortida'} registrada correctament`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/attendance", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      // Clear inputs
      setScannedCode('');
      setManualInput('');
    },
    onError: (error: any) => {
      console.error('❌ QR PROCESSING ERROR:', error);
      toast({
        title: "Error",
        description: error.message || 'Error processant el codi QR',
        variant: "destructive",
      });
    },
  });

  // Start camera for scanning
  const startScanning = async () => {
    try {
      // Check if we're on mobile and request camera permissions explicitly
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

      console.log('🎥 Requesting camera access...');
      
      // First try with environment camera (back camera on mobile)
      let constraints = { 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (envError) {
        console.log('🎥 Environment camera failed, trying any camera...');
        // Fallback to any available camera
        constraints = { 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }
      
      console.log('🎥 Camera access granted!');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        
        // Wait for video to load
        videoRef.current.onloadedmetadata = () => {
          console.log('🎥 Video metadata loaded');
          videoRef.current?.play();
        };
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      let errorMessage = "No es pot accedir a la càmera.";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Permisos de càmera denegats. Permet l'accés a la càmera i torna a provar.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No s'ha trobat cap càmera. Utilitza l'entrada manual.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Càmera no compatible amb aquest dispositiu.";
      }
      
      toast({
        title: "Error de Càmera",
        description: errorMessage,
        variant: "destructive",
      });
      setShowManualInput(true);
    }
  };

  // Stop camera
  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  // Process manual input
  const processManualInput = () => {
    if (!manualInput.trim()) {
      toast({
        title: "Error",
        description: "Introdueix un codi QR vàlid",
        variant: "destructive",
      });
      return;
    }
    
    processQRMutation.mutate(manualInput.trim());
  };

  // Generate today's QR for the current user
  const generateMyQR = () => {
    if (!user?.id) return '';
    const today = new Date().toISOString().split('T')[0];
    return `${user.id}-${today}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ca-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href={user?.role === 'employee' ? "/my-qr" : "/dashboard"}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Escàner QR Mòbil</h1>
            <p className="text-sm text-muted-foreground">Apunta al teu codi QR per fitxar</p>
          </div>
        </div>
        
        {/* Current Time */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="text-center p-4">
            <div className="text-2xl font-mono font-bold text-primary">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-muted-foreground">
              {currentTime.toLocaleDateString('ca-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Info */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">{user?.firstName} {user?.lastName}</div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Result */}
      {lastResult && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800">
            <strong>Fitxatge registrat!</strong> {lastResult.type === 'check_in' ? 'Entrada' : 'Sortida'} a les {new Date(lastResult.timestamp).toLocaleTimeString('ca-ES')}
          </AlertDescription>
        </Alert>
      )}

      {/* Scanner Section */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Escanejar Codi QR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Scanner */}
          {!isScanning ? (
            <div className="text-center space-y-4">
              <Button 
                onClick={startScanning}
                className="w-full h-12"
                size="lg"
              >
                <Camera className="mr-2 h-5 w-5" />
                Obrir Càmera
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline
                  muted
                  className="w-full rounded-lg border-2 border-dashed border-primary"
                  style={{ maxHeight: '400px', objectFit: 'cover' }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-primary rounded-lg bg-white/10 backdrop-blur-sm">
                    <div className="w-full h-full border border-primary/50 rounded-lg m-1"></div>
                  </div>
                </div>
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  📱 Apunta al QR
                </div>
              </div>
              
              <Button 
                onClick={stopScanning}
                variant="outline"
                className="w-full"
              >
                Tancar Càmera
              </Button>
            </div>
          )}

          {/* Manual Input Toggle */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-sm"
            >
              <FileText className="mr-2 h-4 w-4" />
              {showManualInput ? 'Amagar entrada manual' : 'Entrada manual'}
            </Button>
          </div>

          {/* Manual Input */}
          {showManualInput && (
            <div className="space-y-3 pt-4 border-t">
              <Input
                placeholder="Introdueix o enganxa el codi QR..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="font-mono text-sm"
              />
              <Button 
                onClick={processManualInput}
                disabled={!manualInput.trim() || processQRMutation.isPending}
                className="w-full"
              >
                {processQRMutation.isPending ? 'Processant...' : 'Processar Codi'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Com utilitzar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
              <div>
                <p className="text-sm">Genera el teu codi QR des de l'àrea personal</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
              <div>
                <p className="text-sm">Obre la càmera i apunta al codi QR</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
              <div>
                <p className="text-sm">El sistema detectarà automàticament si és entrada o sortida</p>
              </div>
            </div>
          </div>
          
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-orange-800">
              <strong>Important:</strong> Només pots utilitzar el teu propi codi QR personal. Els codis caduquen diàriament per complir la normativa vigent.
            </AlertDescription>
          </Alert>

          {/* Quick access to generate QR */}
          <div className="pt-4 border-t space-y-3">
            <Link href="/my-qr">
              <Button variant="outline" className="w-full">
                <QrCode className="mr-2 h-4 w-4" />
                Anar a generar el meu QR
              </Button>
            </Link>
            
            {/* Auto-start camera on mobile */}
            {!isScanning && !showManualInput && (
              <Button
                onClick={startScanning}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Camera className="mr-2 h-5 w-5" />
                Començar a escanejar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}