import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  QrCode, 
  Camera, 
  Scan, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Timer,
  User,
  MapPin,
  Wifi,
  AlertTriangle,
  Settings
} from 'lucide-react';
import QrScanner from 'qr-scanner';

interface QRAttendanceProps {
  onAttendanceSuccess?: () => void;
}

interface QRData {
  employeeId: string;
  institutionId: string;
  timestamp: number;
  location?: string;
  signature?: string;
}

export default function QRAttendance({ onAttendanceSuccess }: QRAttendanceProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check camera availability
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasCamera(videoDevices.length > 0);
      } catch (error) {
        console.error('Error checking camera:', error);
        setHasCamera(false);
        setCameraError('No se puede acceder a la cámara');
      }
    };
    checkCamera();
  }, []);

  // Generate QR code for current user
  useEffect(() => {
    if (user && showQRCode) {
      const qrData: QRData = {
        employeeId: user.id,
        institutionId: user.institutionId || '',
        timestamp: Date.now(),
        location: window.location.origin,
        signature: btoa(`${user.id}-${Date.now()}`)
      };
      setQrCodeData(JSON.stringify(qrData));
    }
  }, [user, showQRCode]);

  // Initialize QR Scanner
  const initializeScanner = async () => {
    if (!videoRef.current || !hasCamera) return;

    try {
      setIsScanning(true);
      setCameraError(null);

      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          setScanResult(result.data);
          processQRCode(result.data);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment' // Use back camera on mobile
        }
      );

      await qrScannerRef.current.start();
    } catch (error: any) {
      console.error('Error starting scanner:', error);
      setCameraError(error.message || 'Error al acceder a la cámara');
      setIsScanning(false);
    }
  };

  // Stop scanner
  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    setScanResult(null);
  };

  // Process scanned QR code
  const processQRCode = async (qrData: string) => {
    try {
      const data: QRData = JSON.parse(qrData);
      
      // Validate QR code structure
      if (!data.employeeId || !data.institutionId) {
        throw new Error('Código QR inválido');
      }

      // Check if QR is not too old (5 minutes max)
      const qrAge = Date.now() - data.timestamp;
      if (qrAge > 5 * 60 * 1000) {
        throw new Error('Código QR expirado');
      }

      // Verify institution matches
      if (user?.institutionId && data.institutionId !== user.institutionId) {
        throw new Error('Código QR de otra institución');
      }

      // Process attendance
      await processAttendance(data);
      
    } catch (error: any) {
      console.error('Error processing QR:', error);
      toast({
        title: t("error", language),
        description: error.message || 'Error al procesar el código QR',
        variant: "destructive",
      });
      stopScanner();
    }
  };

  // Attendance mutation
  const attendanceMutation = useMutation({
    mutationFn: async (data: {
      employeeId: string;
      type: "check_in" | "check_out";
      timestamp: Date;
      method: "qr";
      location?: string;
    }) => {
      return await apiRequest("POST", "/api/attendance", data);
    },
    onSuccess: (data) => {
      toast({
        title: t("success", language),
        description: `${data.type === 'check_in' ? 'Entrada' : 'Salida'} registrada correctamente`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      stopScanner();
      onAttendanceSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: t("error", language),
        description: error.message || 'Error al registrar la asistencia',
        variant: "destructive",
      });
      stopScanner();
    },
  });

  // Process attendance based on current state
  const processAttendance = async (qrData: QRData) => {
    try {
      // Get last attendance to determine if this is check-in or check-out
      const attendanceRecords = await apiRequest("GET", `/api/attendance/${qrData.employeeId}`);
      
      const today = new Date().toDateString();
      const todayRecords = Array.isArray(attendanceRecords) 
        ? attendanceRecords.filter((record: any) => 
            new Date(record.timestamp).toDateString() === today
          )
        : [];
      
      const lastRecord = todayRecords.length > 0 
        ? todayRecords.sort((a: any, b: any) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0]
        : null;

      // Determine attendance type
      const attendanceType: "check_in" | "check_out" = (!lastRecord || lastRecord.type === 'check_out') 
        ? 'check_in' 
        : 'check_out';

      // Submit attendance
      await attendanceMutation.mutateAsync({
        employeeId: qrData.employeeId,
        type: attendanceType,
        timestamp: new Date(),
        method: "qr",
        location: qrData.location || window.location.origin
      });

    } catch (error: any) {
      throw new Error(error.message || 'Error al procesar la asistencia');
    }
  };

  // Generate QR code for display
  const generateQRCode = async () => {
    if (!qrCodeData) return;
    
    try {
      const QRCode = await import('qrcode');
      const canvas = canvasRef.current;
      if (canvas) {
        await QRCode.toCanvas(canvas, qrCodeData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  useEffect(() => {
    if (showQRCode && qrCodeData) {
      generateQRCode();
    }
  }, [showQRCode, qrCodeData]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ca-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Current Time Display */}
      <Card>
        <CardContent className="text-center p-6">
          <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
          <div className="text-3xl font-mono font-bold text-primary mb-2">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-muted-foreground">
            {currentTime.toLocaleDateString(language === 'ca' ? 'ca-ES' : 'es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {t("qr_code", language)} - Fichaje Rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scan" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scan" className="flex items-center gap-2">
                <Scan className="h-4 w-4" />
                Escanear QR
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Mi QR
              </TabsTrigger>
            </TabsList>
            
            {/* Scanner Tab */}
            <TabsContent value="scan" className="space-y-4">
              {!hasCamera && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No se detectó cámara. Asegúrate de dar permisos de cámara.
                  </AlertDescription>
                </Alert>
              )}
              
              {cameraError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden aspect-square max-w-sm mx-auto">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center text-white">
                        <Camera className="h-12 w-12 mx-auto mb-2" />
                        <p>Pulsa para activar la cámara</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-center">
                  {!isScanning ? (
                    <Button 
                      onClick={initializeScanner}
                      disabled={!hasCamera || attendanceMutation.isPending}
                      className="flex items-center gap-2"
                      size="lg"
                    >
                      <Scan className="h-5 w-5" />
                      Iniciar Escáner
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopScanner}
                      variant="outline"
                      className="flex items-center gap-2"
                      size="lg"
                    >
                      <XCircle className="h-5 w-5" />
                      Detener
                    </Button>
                  )}
                </div>

                {attendanceMutation.isPending && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Procesando fichaje...</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* QR Generator Tab */}
            <TabsContent value="generate" className="space-y-4">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Genera tu código QR personal para fichar desde otros dispositivos
                </p>
                
                <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 max-w-xs mx-auto">
                  <canvas 
                    ref={canvasRef}
                    className="w-full h-auto"
                  />
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={() => {
                      setShowQRCode(true);
                      generateQRCode();
                    }}
                    disabled={!user}
                    className="flex items-center gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    Generar QR
                  </Button>
                  
                  {showQRCode && (
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">
                        <Timer className="h-3 w-3 mr-1" />
                        Válido por 5 minutos
                      </Badge>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {window.location.origin}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div>
              <h4 className="font-medium">Escanear QR de otro usuario</h4>
              <p className="text-sm text-muted-foreground">Usa la pestaña "Escanear QR" para leer el código de un compañero</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <div>
              <h4 className="font-medium">Generar tu QR personal</h4>
              <p className="text-sm text-muted-foreground">Usa "Mi QR" para crear tu código personal y que otros te fichen</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <div>
              <h4 className="font-medium">Sistema automático</h4>
              <p className="text-sm text-muted-foreground">El sistema detecta automáticamente si es entrada o salida</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}