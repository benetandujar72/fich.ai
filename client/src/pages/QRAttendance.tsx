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
    onSuccess: (data: any) => {
      toast({
        title: t("success", language),
        description: `${data.type === 'check_in' ? 'Entrada' : 'Sortida'} registrada per QR`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setManualQRCode('');
    },
    onError: (error: any) => {
      toast({
        title: t("error", language),
        description: error.message || 'Error al registrar l\'assistència',
        variant: "destructive",
      });
    },
  });

  // Process manual QR code
  const processManualQR = async () => {
    if (!manualQRCode.trim()) {
      toast({
        title: t("error", language),
        description: 'Si us plau introdueix un codi QR vàlid',
        variant: "destructive",
      });
      return;
    }

    try {
      const qrData = JSON.parse(manualQRCode);
      
      // Validate QR code structure
      if (!qrData.employeeId || !qrData.institutionId) {
        throw new Error('Codi QR invàlid');
      }

      // Check if QR is not too old (5 minutes max)
      const qrAge = Date.now() - qrData.timestamp;
      if (qrAge > 5 * 60 * 1000) {
        throw new Error('Codi QR expirat (màxim 5 minuts)');
      }

      // Verify institution matches
      if (user?.institutionId && qrData.institutionId !== user.institutionId) {
        throw new Error('Codi QR d\'una altra institució');
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
        description: error.message || 'Error al processar el codi QR',
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Fitxatge amb Codi QR Personal</h1>
        <p className="text-muted-foreground">Sistema ràpid i eficient de control d'assistència - Només per a ús personal</p>
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
            Sistema de Fitxatge QR Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                El Meu Codi QR Personal
              </TabsTrigger>
            </TabsList>
            
            {/* Generate QR Tab */}
            <TabsContent value="generate" className="space-y-6">
              <div className="text-center space-y-4">
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-orange-800">
                    <strong>Important:</strong> Aquest codi QR és personal i únic per a tu. Només pots utilitzar-lo per al teu propi fitxatge segons la normativa vigent.
                  </AlertDescription>
                </Alert>
                
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
                    {showQRCode ? "Amagar QR" : "Generar el Meu QR"}
                  </Button>
                  
                  {showQRCode && (
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">
                        <Timer className="h-3 w-3 mr-1" />
                        Vàlid per 5 minuts
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                        <User className="h-4 w-4" />
                        {user?.firstName} {user?.lastName}
                      </div>
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription className="text-green-800">
                          <strong>Codi generat!</strong> Utilitza aquest QR per fitxar des d'altres dispositius amb la mateixa sessió.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>


          </Tabs>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Instruccions d'Ús</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-primary">Per generar el teu QR personal:</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <div>
                  <p className="text-sm">Fes clic a "Generar el Meu QR"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <div>
                  <p className="text-sm">Utilitza el codi QR generat només per al teu propi fitxatge</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <div>
                  <p className="text-sm">El codi és vàlid per 5 minuts per seguretat</p>
                </div>
              </div>
            </div>
          </div>
          
          <Alert className="mt-4 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-orange-800">
              <strong>Important:</strong> Els codis QR són vàlids per 5 minuts per seguretat i només per al propi fitxatge.
              El sistema detecta automàticament si és entrada o sortida segons l'últim registre personal.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}