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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  QrCode, 
  Camera, 
  Scan, 
  Clock, 
  CheckCircle, 
  Timer,
  User,
  Smartphone,
  AlertTriangle,
  LogIn,
  LogOut,
  RefreshCw
} from 'lucide-react';

export default function QRAttendancePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [manualQRCode, setManualQRCode] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate QR code data
  useEffect(() => {
    if (user && showQRCode) {
      const qrData = {
        employeeId: user.id,
        institutionId: user.institutionId || '',
        timestamp: Date.now(),
        location: window.location.origin
      };
      setQrCodeData(JSON.stringify(qrData));
    }
  }, [user, showQRCode]);

  // Generate QR code for display
  const generateQRCode = async () => {
    if (!qrCodeData || !canvasRef.current) return;
    
    try {
      const QRCode = await import('qrcode');
      await QRCode.toCanvas(canvasRef.current, qrCodeData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  useEffect(() => {
    if (showQRCode && qrCodeData) {
      generateQRCode();
    }
  }, [showQRCode, qrCodeData]);

  // Attendance mutation
  const attendanceMutation = useMutation({
    mutationFn: async (data: {
      employeeId: string;
      type: "check_in" | "check_out";
      timestamp: Date;
      method: "qr";
    }) => {
      return await apiRequest("POST", "/api/attendance", {
        ...data,
        location: window.location.origin
      });
    },
    onSuccess: (data) => {
      toast({
        title: t("success", language),
        description: `${data.type === 'check_in' ? 'Entrada' : 'Salida'} registrada por QR`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setManualQRCode('');
    },
    onError: (error: any) => {
      toast({
        title: t("error", language),
        description: error.message || 'Error al registrar la asistencia',
        variant: "destructive",
      });
    },
  });

  // Process manual QR code
  const processManualQR = async () => {
    if (!manualQRCode.trim()) {
      toast({
        title: t("error", language),
        description: 'Por favor introduce un código QR válido',
        variant: "destructive",
      });
      return;
    }

    try {
      const qrData = JSON.parse(manualQRCode);
      
      // Validate QR code structure
      if (!qrData.employeeId || !qrData.institutionId) {
        throw new Error('Código QR inválido');
      }

      // Check if QR is not too old (5 minutes max)
      const qrAge = Date.now() - qrData.timestamp;
      if (qrAge > 5 * 60 * 1000) {
        throw new Error('Código QR expirado (máximo 5 minutos)');
      }

      // Verify institution matches
      if (user?.institutionId && qrData.institutionId !== user.institutionId) {
        throw new Error('Código QR de otra institución');
      }

      // Get last attendance to determine type
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
        method: "qr"
      });

    } catch (error: any) {
      console.error('Error processing QR:', error);
      toast({
        title: t("error", language),
        description: error.message || 'Error al procesar el código QR',
        variant: "destructive",
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ca-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Fichaje por Código QR</h1>
        <p className="text-muted-foreground">Sistema rápido y eficiente de control de asistencia</p>
      </div>

      {/* Current Time Display */}
      <Card className="mb-6">
        <CardContent className="text-center p-6">
          <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
          <div className="text-4xl font-mono font-bold text-primary mb-2">
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
            Sistema de Fichaje QR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Mi Código QR
              </TabsTrigger>
              <TabsTrigger value="scan" className="flex items-center gap-2">
                <Scan className="h-4 w-4" />
                Fichar Otro Usuario
              </TabsTrigger>
            </TabsList>
            
            {/* Generate QR Tab */}
            <TabsContent value="generate" className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Genera tu código QR personal para que otros usuarios puedan ficharte
                </p>
                
                {showQRCode && (
                  <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 max-w-xs mx-auto">
                    <canvas 
                      ref={canvasRef}
                      className="w-full h-auto"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <Button 
                    onClick={() => {
                      setShowQRCode(!showQRCode);
                      if (!showQRCode) {
                        generateQRCode();
                      }
                    }}
                    disabled={!user}
                    className="flex items-center gap-2"
                    variant={showQRCode ? "outline" : "default"}
                    size="lg"
                  >
                    <QrCode className="h-5 w-5" />
                    {showQRCode ? "Ocultar QR" : "Generar Mi QR"}
                  </Button>
                  
                  {showQRCode && (
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">
                        <Timer className="h-3 w-3 mr-1" />
                        Válido por 5 minutos
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                        <User className="h-4 w-4" />
                        {user?.firstName} {user?.lastName}
                      </div>
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>¡Código generado!</strong> Muestra este QR a un compañero para que te fiche.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Scan QR Tab */}
            <TabsContent value="scan" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="qr-input" className="text-base font-medium">
                    Introduce el código QR de otro usuario
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Copia y pega el contenido del código QR que quieres procesar
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Input
                    id="qr-input"
                    placeholder='{"employeeId":"...","institutionId":"...","timestamp":...}'
                    value={manualQRCode}
                    onChange={(e) => setManualQRCode(e.target.value)}
                    className="min-h-[80px] p-4 text-sm font-mono"
                    disabled={attendanceMutation.isPending}
                  />
                  
                  <Button 
                    onClick={processManualQR}
                    disabled={!manualQRCode.trim() || attendanceMutation.isPending}
                    className="w-full flex items-center gap-2"
                    size="lg"
                  >
                    {attendanceMutation.isPending ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5" />
                        Procesar Fichaje
                      </>
                    )}
                  </Button>
                </div>

                <Alert>
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription>
                    <strong>¿Cómo usar?</strong> Pide a un compañero que genere su QR y copia el contenido en el campo de arriba.
                    El sistema detectará automáticamente si es entrada o salida.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Instrucciones de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Para generar tu QR:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="text-sm">Ve a la pestaña "Mi Código QR"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="text-sm">Pulsa "Generar Mi QR"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="text-sm">Muestra el QR a un compañero</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Para fichar a otro usuario:</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="text-sm">Ve a "Fichar Otro Usuario"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="text-sm">Pega el código QR del compañero</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="text-sm">Pulsa "Procesar Fichaje"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Los códigos QR son válidos por 5 minutos por seguridad.
              El sistema detecta automáticamente si es entrada o salida según el último registro del usuario.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}