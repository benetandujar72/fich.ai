import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'wouter';
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
  AlertTriangle,
  LogIn,
  LogOut
} from 'lucide-react';

export default function PublicQRAttendance() {
  const { toast } = useToast();
  
  const [qrInput, setQrInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastResult, setLastResult] = useState<any>(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // QR Processing mutation
  const processQRMutation = useMutation({
    mutationFn: async (qrData: string) => {
      return await apiRequest("POST", "/api/attendance/qr-process", {
        qrData: qrData.trim(),
        timestamp: new Date().toISOString(),
        location: window.location.origin
      });
    },
    onSuccess: (data) => {
      setLastResult(data);
      toast({
        title: "Fitxatge registrat",
        description: `${data.type === 'check_in' ? 'Entrada' : 'Sortida'} registrada correctament per ${data.employeeName}`,
      });
      setQrInput('');
      setProcessing(false);
    },
    onError: (error: any) => {
      setLastResult({ error: true, message: error.message });
      toast({
        title: "Error",
        description: error.message || 'Error al processar el codi QR',
        variant: "destructive",
      });
      setProcessing(false);
    },
  });

  const handleQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      toast({
        title: "Error",
        description: "Introdueix un codi QR vàlid",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    processQRMutation.mutate(qrInput);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ca-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ca-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">fich.ai</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-1">Fitxatge per Codi QR</h2>
          <p className="text-sm text-gray-600">Sistema de control d'assistència</p>
        </div>

        {/* Current Time Display */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-200">
          <CardContent className="text-center p-6">
            <Clock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <div className="text-2xl font-mono font-bold text-blue-800 mb-1">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-blue-600">
              {formatDate(currentTime)}
            </div>
          </CardContent>
        </Card>

        {/* QR Scanner */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scan className="h-5 w-5 text-blue-600" />
              Escanejar Codi QR Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleQRSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr-input" className="text-sm font-medium">
                  Introdueix el teu codi QR personal:
                </Label>
                <Input
                  id="qr-input"
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="Escaneja o introdueix el codi..."
                  className="text-center font-mono"
                  disabled={processing}
                  autoFocus
                />
              </div>
              
              <Button 
                type="submit"
                disabled={!qrInput.trim() || processing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                size="lg"
              >
                {processing ? (
                  <>
                    <Timer className="h-5 w-5 mr-2 animate-spin" />
                    Processant...
                  </>
                ) : (
                  <>
                    <QrCode className="h-5 w-5 mr-2" />
                    Processar Fitxatge
                  </>
                )}
              </Button>
            </form>

            {/* Instructions */}
            <Alert className="border-blue-200 bg-blue-50">
              <Smartphone className="h-4 w-4" />
              <AlertDescription className="text-blue-800">
                <strong>Com utilitzar:</strong> Escaneja o introdueix el teu codi QR personal únic. El sistema detectarà automàticament si és entrada o sortida. 
                El sistema detectarà automàticament si és entrada o sortida.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Last Result */}
        {lastResult && (
          <Card className={`bg-white/80 backdrop-blur-sm border-2 ${
            lastResult.error ? 'border-red-200' : 'border-green-200'
          }`}>
            <CardContent className="p-4">
              {lastResult.error ? (
                <div className="flex items-center gap-3 text-red-700">
                  <XCircle className="h-6 w-6 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Error de fitxatge</p>
                    <p className="text-sm">{lastResult.message}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle className="h-6 w-6 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      {lastResult.type === 'check_in' ? '✓ Entrada registrada' : '✓ Sortida registrada'}
                    </p>
                    <p className="text-sm">
                      {lastResult.employeeName} - {new Date(lastResult.timestamp).toLocaleTimeString('ca-ES')}
                    </p>
                    {lastResult.isLate && (
                      <p className="text-sm text-orange-600">
                        ⚠️ Arribada amb retard ({lastResult.lateMinutes} min)
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Instruccions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <div>
                <p className="font-medium">Codi QR personal</p>
                <p className="text-gray-600">Cada treballador té un codi QR únic i personal</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <div>
                <p className="font-medium">Fitxatge automàtic</p>
                <p className="text-gray-600">El sistema detecta automàticament entrada o sortida</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <div>
                <p className="font-medium">Unipersonal</p>
                <p className="text-gray-600">Cada persona només pot fitxar per si mateixa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation back to login */}
        <div className="text-center">
          <Link to="/">
            <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
              ← Tornar a la pàgina principal
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>Sistema de Control d'Assistència fich.ai</p>
          <p>Compleix la normativa de protecció de dades</p>
        </div>
      </div>
    </div>
  );
}