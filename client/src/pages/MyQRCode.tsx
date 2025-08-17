import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  QrCode, 
  Download, 
  Printer, 
  User,
  Building2,
  Info,
  Copy,
  ExternalLink,
  Clock
} from 'lucide-react';

export default function MyQRCode() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [qrCanvas, setQrCanvas] = useState<HTMLCanvasElement | null>(null);
  const [qrSize] = useState<number>(256);
  const [currentTime, setCurrentTime] = useState(new Date());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateMyQR = async () => {
    if (!user?.id) return;
    
    try {
      const QRCode = await import('qrcode');
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // QR data contains only user ID (which is the same as employeeId)
      const qrData = user.id;
      
      await QRCode.toCanvas(canvas, qrData, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCanvas(canvas);
      
      // Comentem el toast "Èxit" que causa problemes de modal
      // toast({
      //   title: language === "ca" ? "Èxit" : "Éxito",
      //   description: language === "ca" ? 
      //     "El teu codi QR s'ha generat correctament" : 
      //     "Tu código QR se ha generado correctamente",
      // });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: language === "ca" ? 
          "Error generant el codi QR" : 
          "Error generando el código QR",
        variant: "destructive",
      });
    }
  };

  const downloadQR = () => {
    if (!qrCanvas || !user) return;
    
    const link = document.createElement('a');
    link.download = `QR_${user.firstName}_${user.lastName}.png`;
    link.href = qrCanvas.toDataURL();
    link.click();
  };

  const printQR = () => {
    if (!qrCanvas || !user) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const imgData = qrCanvas.toDataURL();
    printWindow.document.write(`
      <html>
        <head>
          <title>Codi QR - ${user.firstName} ${user.lastName}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .qr-container { margin: 20px auto; }
            .employee-info { margin-bottom: 20px; }
            h1 { color: #1f2937; }
            p { margin: 5px 0; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Codi QR Personal</h1>
          <div class="employee-info">
            <p><strong>Nom:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>ID:</strong> ${user.id}</p>
          </div>
          <div class="qr-container">
            <img src="${imgData}" alt="Codi QR Personal" />
          </div>
          <p><small>Sistema fich.ai - Control d'Assistència</small></p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const copyMyId = () => {
    if (!user?.id) return;
    
    navigator.clipboard.writeText(user.id).then(() => {
      toast({
        title: language === "ca" ? "Copiat" : "Copiado",
        description: language === "ca" ? 
          "El teu ID s'ha copiat al portapapers" : 
          "Tu ID se ha copiado al portapapeles",
      });
    });
  };

  useEffect(() => {
    if (user?.id) {
      generateMyQR();
    }
  }, [user?.id]);

  // Clock timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Alert className="border-orange-200 bg-orange-50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-orange-800">
              Has d'estar autenticat per veure el teu codi QR personal.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === "ca" ? "El Meu Codi QR" : "Mi Código QR"}
          </h1>
          <p className="text-gray-600">
            {language === "ca" 
              ? "El teu codi QR personal per al fitxatge d'assistència"
              : "Tu código QR personal para el fichaje de asistencia"}
          </p>
        </div>

        {/* Current Time Display */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="text-center p-6">
            <Clock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <div className="text-2xl font-mono font-bold text-blue-800 mb-1">
              {currentTime.toLocaleTimeString('ca-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
            <div className="text-sm text-blue-600">
              {currentTime.toLocaleDateString('ca-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </CardContent>
        </Card>

        {/* Employee Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5 text-blue-600" />
              {language === "ca" ? "Informació Personal" : "Información Personal"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nom complet</p>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rol</p>
                <Badge variant="secondary">{user.role}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">ID Personal</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{user.id}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyMyId}
                    className="p-1 h-6 w-6"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Display */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="mr-2 h-5 w-5 text-green-600" />
              {language === "ca" ? "Codi QR Personal" : "Código QR Personal"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="inline-block p-4 bg-white rounded-lg border-2 border-dashed border-gray-300 mb-4">
                <canvas 
                  ref={canvasRef}
                  className="mx-auto"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={downloadQR}
                  disabled={!qrCanvas}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {language === "ca" ? "Descarregar PNG" : "Descargar PNG"}
                </Button>
                
                <Button
                  onClick={printQR}
                  disabled={!qrCanvas}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {language === "ca" ? "Imprimir" : "Imprimir"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to Use */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {language === "ca" ? "Com utilitzar-lo" : "Cómo utilizarlo"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <div>
                <p className="font-medium">Descarrega o imprimeix</p>
                <p className="text-sm text-gray-600">
                  Pots descarregar el QR com a imatge o imprimir-lo per tenir-lo sempre a mà
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <div>
                <p className="font-medium">Accedeix al fitxatge públic</p>
                <p className="text-sm text-gray-600">
                  Ves a la pàgina de fitxatge QR pública (no cal login)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <div>
                <p className="font-medium">Escaneja o introdueix</p>
                <p className="text-sm text-gray-600">
                  Escaneja el QR amb el mòbil o introdueix manualment el teu ID personal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">Accés ràpid al fitxatge</p>
                <p className="text-sm text-green-700">Vés directament a la pàgina de fitxatge QR</p>
              </div>
              <Button
                asChild
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <a href="/public-qr" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Obrir fitxatge
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}