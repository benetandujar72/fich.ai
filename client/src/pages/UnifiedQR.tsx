import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  QrCode, 
  Camera, 
  Download, 
  Printer, 
  User,
  Building2,
  Info,
  Copy,
  Clock,
  UserCheck,
  ArrowLeft,
  AlertTriangle,
  Scan,
  Eye,
  EyeOff
} from 'lucide-react';
import { Link } from 'wouter';
import QRCodeLib from 'qrcode';
import { queryClient } from '@/lib/queryClient';

export default function UnifiedQR() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  // QR Generation states
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrCanvas, setQrCanvas] = useState<HTMLCanvasElement | null>(null);
  
  // QR Scanning states
  const [isScanning, setIsScanning] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [lastResult, setLastResult] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get current attendance status
  const { data: attendance = [] } = useQuery<any[]>({
    queryKey: ["/api/attendance", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Generate today's QR for the current user
  const generateMyQR = () => {
    if (!user?.id) return '';
    const today = new Date().toISOString().split('T')[0];
    return `${user.id}-${today}`;
  };

  // Generate QR Code
  useEffect(() => {
    const generateQR = async () => {
      if (!user) return;
      
      try {
        const qrData = generateMyQR();
        const canvas = document.createElement('canvas');
        
        await QRCodeLib.toCanvas(canvas, qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        setQrDataUrl(dataUrl);
        setQrCanvas(canvas);
      } catch (error) {
        console.error('Error generating QR:', error);
      }
    };

    generateQR();
  }, [user]);

  // Process QR mutation
  const processQRMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      const response = await fetch('/api/qr/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          qrCode: qrCode.trim(),
          timestamp: new Date().toISOString(),
          location: window.location.origin
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error processant QR');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      console.log("✅ QR PROCESSED SUCCESSFULLY:", data);
      setLastResult(data);
      
      toast({
        title: "Fitxatge Registrat!",
        description: `${data.type === 'check_in' ? 'Entrada' : 'Sortida'} registrada correctament a les ${new Date().toLocaleTimeString('ca-ES')}`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/attendance", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      // Clear inputs
      setScannedCode('');
      setManualInput('');
      
      // Stop camera after successful scan
      if (isScanning) {
        stopScanning();
      }
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
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

      console.log('🎥 Requesting camera access...');
      
      // Detect iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      
      console.log('📱 Device detection:', { isIOS, isSafari });
      
      // iOS Safari specific constraints
      let constraints;
      if (isIOS && isSafari) {
        constraints = { 
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 640, max: 1920 },
            height: { ideal: 480, max: 1080 },
            frameRate: { ideal: 30, max: 30 }
          },
          audio: false
        };
      } else {
        constraints = { 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        };
      }

      let stream;
      try {
        console.log('🎥 Trying with environment camera...');
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (envError) {
        console.log('🎥 Environment camera failed, trying any camera...', envError);
        const fallbackConstraints = { 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        };
        stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      }
      
      console.log('🎥 Camera access granted!');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        
        // iOS Safari specific handling
        if (isIOS && isSafari) {
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('webkit-playsinline', 'true');
          videoRef.current.muted = true;
        }
        
        // Wait for video to load
        videoRef.current.onloadedmetadata = () => {
          console.log('🎥 Video metadata loaded');
          if (videoRef.current) {
            videoRef.current.play().catch(playError => {
              console.error('Play error:', playError);
            });
          }
        };
      }
    } catch (error: any) {
      console.error('❌ Camera error:', error);
      let errorMessage = "No es pot accedir a la càmera.";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Permisos de càmera denegats. A iOS, ves a Configuració > Safari > Càmera i permet l'accés.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No s'ha trobat cap càmera. Utilitza l'entrada manual.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Càmera no compatible amb aquest dispositiu.";
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = "Configuració de càmera no compatible. Provant amb configuració bàsica...";
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

  // Download QR as PNG
  const downloadQR = () => {
    if (!qrCanvas) return;
    
    const link = document.createElement('a');
    link.download = `fitxatge-qr-${new Date().toISOString().split('T')[0]}.png`;
    link.href = qrCanvas.toDataURL();
    link.click();
  };

  // Print QR
  const printQR = () => {
    if (!qrDataUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Codi QR - ${user?.firstName} ${user?.lastName}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px; 
              }
              .qr-container { 
                display: inline-block; 
                border: 2px solid #000; 
                padding: 20px; 
                margin: 20px; 
              }
              .user-info { 
                margin-bottom: 15px; 
                font-weight: bold; 
              }
              .date-info { 
                margin-top: 15px; 
                font-size: 12px; 
                color: #666; 
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="user-info">
                ${user?.firstName} ${user?.lastName}<br/>
                ${user?.email}
              </div>
              <img src="${qrDataUrl}" alt="QR Code" />
              <div class="date-info">
                Vàlid per: ${new Date().toLocaleDateString('ca-ES')}<br/>
                (Renova cada dia)
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Copy QR data to clipboard
  const copyQRData = () => {
    const qrData = generateMyQR();
    navigator.clipboard.writeText(qrData);
    toast({
      title: "Copiat!",
      description: "Codi QR copiat al portapapers",
    });
  };

  // Get last attendance record
  const lastAttendance = attendance?.[0];
  const isCheckedIn = lastAttendance?.type === 'check_in';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ca-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!user) {
    return <div>Loading...</div>;
  }

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
            <h1 className="text-2xl font-bold text-foreground">Fitxatge QR Unificat</h1>
            <p className="text-sm text-muted-foreground">Genera, visualitza i escaneja el teu QR personal</p>
          </div>
        </div>

        {/* Current status */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={isCheckedIn ? "default" : "secondary"}>
            {isCheckedIn ? "Dins del centre" : "Fora del centre"}
          </Badge>
          {lastAttendance && (
            <span className="text-sm text-muted-foreground">
              Últim registre: {formatTime(new Date(lastAttendance.timestamp))}
            </span>
          )}
        </div>
      </div>

      <Tabs defaultValue="my-qr" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-qr" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            El Meu QR
          </TabsTrigger>
          <TabsTrigger value="scanner" className="flex items-center gap-2">
            <Scan className="h-4 w-4" />
            Escanejar
          </TabsTrigger>
        </TabsList>

        {/* My QR Tab */}
        <TabsContent value="my-qr">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                El Meu Codi QR Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User info */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              {/* QR Code Display */}
              <div className="text-center space-y-4">
                {qrDataUrl ? (
                  <div className="inline-block p-4 bg-white rounded-lg border-2 border-dashed border-primary">
                    <img 
                      src={qrDataUrl} 
                      alt="QR Code"
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <p className="text-gray-500">Generant QR...</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Codi QR vàlid per avui: {new Date().toLocaleDateString('ca-ES')}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Renova automàticament cada dia
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={copyQRData}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Codi
                </Button>
                
                <Button
                  onClick={downloadQR}
                  disabled={!qrCanvas}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descarregar PNG
                </Button>
                
                <Button
                  onClick={printQR}
                  disabled={!qrCanvas}
                  variant="outline"
                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>

              {/* Quick scan button */}
              <div className="pt-4 border-t">
                <p className="text-center text-sm text-muted-foreground mb-3">
                  Ja tens el QR? Escaneja'l directament:
                </p>
                <Button
                  onClick={() => {
                    const qrData = generateMyQR();
                    processQRMutation.mutate(qrData);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                  disabled={processQRMutation.isPending}
                >
                  <UserCheck className="mr-2 h-5 w-5" />
                  {processQRMutation.isPending ? "Processant..." : "Fitxar Ara amb el Meu QR"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scanner Tab */}
        <TabsContent value="scanner">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Escanejar Codi QR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Scanner */}
              {!isScanning ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                    <p className="text-sm text-blue-800 mb-2">
                      📱 <strong>Per iPhone/iPad:</strong>
                    </p>
                    <p className="text-xs text-blue-700">
                      • Assegura't que Safari té permisos de càmera<br/>
                      • Ves a Configuració &gt; Safari &gt; Càmera &gt; Permet<br/>
                      • Recarrega la pàgina si cal
                    </p>
                  </div>
                  <Button 
                    onClick={startScanning}
                    className="w-full h-12 bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    Obrir Càmera
                  </Button>
                  
                  <Button 
                    onClick={() => setShowManualInput(!showManualInput)}
                    variant="outline"
                    className="w-full"
                  >
                    {showManualInput ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {showManualInput ? "Amagar" : "Entrada Manual"}
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
                      webkit-playsinline="true"
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
                    <div className="absolute bottom-2 left-2 bg-green-600/80 text-white px-2 py-1 rounded text-xs">
                      🟢 Càmera activa
                    </div>
                  </div>
                  
                  <Button 
                    onClick={stopScanning}
                    variant="outline"
                    className="w-full"
                  >
                    Aturar Càmera
                  </Button>
                </div>
              )}

              {/* Manual Input */}
              {showManualInput && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold">Entrada Manual</h4>
                  <Input
                    placeholder="Introdueix el codi QR..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        processManualInput();
                      }
                    }}
                  />
                  <Button 
                    onClick={processManualInput}
                    disabled={!manualInput.trim() || processQRMutation.isPending}
                    className="w-full"
                  >
                    {processQRMutation.isPending ? "Processant..." : "Processar Codi"}
                  </Button>
                </div>
              )}

              {/* Last result */}
              {lastResult && (
                <Alert className="border-green-200 bg-green-50">
                  <UserCheck className="h-4 w-4" />
                  <AlertDescription className="text-green-800">
                    <strong>Últim fitxatge:</strong> {lastResult.type === 'check_in' ? 'Entrada' : 'Sortida'} registrada a les {formatTime(new Date(lastResult.timestamp))}
                  </AlertDescription>
                </Alert>
              )}

              {/* Instructions */}
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-orange-800">
                  <strong>Important:</strong> Només pots utilitzar el teu propi codi QR personal. Els codis caduquen diàriament per complir la normativa vigent.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}