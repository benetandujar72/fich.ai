import { useState, useRef, useEffect } from 'react';
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
  console.log("🚀 PublicQRAttendance component mounted/re-rendered at:", new Date().toISOString());
  
  const { toast } = useToast();
  
  const [qrInput, setQrInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [displayTime, setDisplayTime] = useState(new Date());
  
  // Add a timer like in App.tsx for the clock
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    console.log("🕐 CLOCK EFFECT: Setting up timer");
    // Start the clock timer
    timerRef.current = setInterval(() => {
      const newTime = new Date();
      // TEMPORALLY DISABLE CLOCK LOGS TO REDUCE CONSOLE SPAM
      // console.log("⏰ CLOCK UPDATE:", newTime.toLocaleTimeString());
      setDisplayTime(newTime);
    }, 1000);
    
    return () => {
      console.log("🕐 CLOCK EFFECT: Cleaning up timer");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // QR Processing mutation
  const processQRMutation = useMutation({
    mutationFn: async (qrData: string) => {
      const currentTimestamp = new Date();
      console.log("🕐 FRONTEND QR TIMESTAMP DEBUG:");
      console.log("  Frontend current time:", currentTimestamp.toISOString());
      console.log("  Frontend local time:", currentTimestamp.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }));
      console.log("  QR Data:", qrData.trim());
      
      const response = await apiRequest("POST", "/api/attendance/qr-process", {
        qrData: qrData.trim(),
        timestamp: currentTimestamp.toISOString(),
        location: window.location.origin
      });
      
      // Parse JSON if it's a Response object
      const data = response instanceof Response ? await response.json() : response;
      console.log("✅ QR RESPONSE PARSED:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("🎉 QR SUCCESS DATA:", JSON.stringify(data, null, 2));
      setLastResult(data);
      setShowResult(true);
      
      // DEBUG LOGS FOR MODAL ISSUE
      console.log("🔍 TOAST DEBUG - Success toast about to show");
      console.log("🔍 TOAST DEBUG - data.type:", data.type);
      console.log("🔍 TOAST DEBUG - data.employeeName:", data.employeeName);
      
      toast({
        title: "Fitxatge registrat",
        description: `${data.type === 'check_in' ? 'Entrada' : 'Sortida'} registrada correctament per ${data.employeeName}`,
      });
      
      console.log("🔍 TOAST DEBUG - Toast called, clearing form");
      setQrInput('');
      setProcessing(false);
      
      // Hide result after 5 seconds
      setTimeout(() => {
        console.log("🔍 TIMEOUT DEBUG - Hiding result after 5 seconds");
        setShowResult(false);
      }, 5000);
    },
    onError: (error: any) => {
      console.log("❌ QR ERROR:", error);
      console.log("❌ Error details:", JSON.stringify(error, null, 2));
      
      // DEBUG LOGS FOR MODAL ISSUE  
      console.log("🔍 TOAST DEBUG - Error toast about to show");
      console.log("🔍 TOAST DEBUG - error.message:", error.message);
      
      setLastResult({ error: true, message: error.message });
      setShowResult(true);
      toast({
        title: "Error",
        description: error.message || 'Error al processar el codi QR',
        variant: "destructive",
      });
      setProcessing(false);
      
      // Hide error after 5 seconds
      setTimeout(() => {
        console.log("🔍 TIMEOUT DEBUG - Hiding error after 5 seconds");
        setShowResult(false);
      }, 5000);
    },
  });

  const handleQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🎯 QR FORM SUBMITTED!");
    console.log("🎯 QR Input:", qrInput);
    
    if (!qrInput.trim()) {
      console.log("🎯 Empty QR input!");
      toast({
        title: "Error",
        description: "Introdueix un codi QR vàlid",
        variant: "destructive",
      });
      return;
    }

    console.log("🎯 Starting QR processing...");
    setProcessing(true);
    // Update display time when processing starts
    setDisplayTime(new Date());
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

        {/* Current Time Display - FIXED */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-200">
          <CardContent className="text-center p-6">
            <Clock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <div className="text-2xl font-mono font-bold text-blue-800 mb-1">
              {formatTime(displayTime)}
            </div>
            <div className="text-sm text-blue-600">
              {formatDate(displayTime)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Últma actualització: {displayTime.toISOString()}
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
                  Introdueix el teu codi QR personal únic:
                </Label>
                <div className="text-xs text-orange-600 mb-2 font-medium">
                  ⚠️ Només pots introduir el teu propi codi QR personal. El fitxatge és únic i intransferible.
                </div>
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
            <Alert className="border-orange-200 bg-orange-50">
              <Smartphone className="h-4 w-4" />
              <AlertDescription className="text-orange-800">
                <strong>Important:</strong> Només pots utilitzar el teu propi codi QR personal. El fitxatge és únic i intransferible per empleat segons la normativa vigent.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Last Result - Only show when showResult is true */}
        {showResult && lastResult && (
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