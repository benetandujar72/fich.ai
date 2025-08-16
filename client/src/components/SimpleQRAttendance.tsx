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
  Smartphone,
  AlertTriangle
} from 'lucide-react';

export default function SimpleQRAttendance() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
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
        width: 200,
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
    },
    onError: (error: any) => {
      toast({
        title: t("error", language),
        description: error.message || 'Error al registrar la asistencia',
        variant: "destructive",
      });
    },
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ca-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Current Time Display */}
      <Card>
        <CardContent className="text-center p-6">
          <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
          <div className="text-3xl font-mono font-bold text-primary mb-2">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-muted-foreground">
            Fichaje por Código QR
          </div>
        </CardContent>
      </Card>

      {/* QR Code Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Mi Código QR Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Genera tu código QR personal para que otros usuarios puedan ficharte
            </p>
            
            {showQRCode && (
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 max-w-xs mx-auto">
                <canvas 
                  ref={canvasRef}
                  className="w-full h-auto"
                />
              </div>
            )}

            <div className="space-y-2">
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
              >
                <QrCode className="h-4 w-4" />
                {showQRCode ? "Ocultar QR" : "Generar QR"}
              </Button>
              
              {showQRCode && (
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    <Timer className="h-3 w-3 mr-1" />
                    Válido por 5 minutos
                  </Badge>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                    <User className="h-3 w-3" />
                    {user?.firstName} {user?.lastName}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanner Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Escanear Código QR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              <strong>Próximamente:</strong> Funcionalidad de escáner QR para fichar a otros usuarios.
              Por ahora, utiliza el botón manual de fichaje.
            </AlertDescription>
          </Alert>
          
          <div className="text-center space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 border-2 border-dashed border-gray-300">
              <Camera className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-sm">Área del escáner QR</p>
              <p className="text-xs text-gray-400 mt-2">
                Se activará en una próxima actualización
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Instrucciones de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div>
              <h4 className="font-medium">Generar tu QR</h4>
              <p className="text-sm text-muted-foreground">Pulsa "Generar QR" para crear tu código personal</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <div>
              <h4 className="font-medium">Mostrar a otros</h4>
              <p className="text-sm text-muted-foreground">Enseña tu código QR a un compañero para que te fiche</p>
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