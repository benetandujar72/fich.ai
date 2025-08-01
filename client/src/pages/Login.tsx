import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { GraduationCap, Eye, EyeOff, Clock, QrCode, CreditCard, CheckCircle, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Email no vàlid"),
  password: z.string().min(6, "La contrasenya ha de tenir almenys 6 caràcters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Quick attendance schema
const quickAttendanceSchema = z.object({
  email: z.string().email("Email no vàlid"),
  password: z.string().min(6, "La contrasenya ha de tenir almenys 6 caràcters"),
});

type QuickAttendanceData = z.infer<typeof quickAttendanceSchema>;

export default function Login() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickAttendanceLoading, setIsQuickAttendanceLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showQuickPassword, setShowQuickPassword] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState<any>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const quickForm = useForm<QuickAttendanceData>({
    resolver: zodResolver(quickAttendanceSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/login", data);
      
      toast({
        title: t("success", language),
        description: language === "ca" ? "Sessió iniciada correctament" : "Sesión iniciada correctamente",
      });

      // Reload to trigger auth state update
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: t("error", language),
        description: error.message || (language === "ca" ? "Error en l'inici de sessió" : "Error en el inicio de sesión"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onQuickAttendance = async (data: QuickAttendanceData) => {
    setIsQuickAttendanceLoading(true);
    try {
      // First authenticate the user quickly
      const authResponse = await apiRequest("POST", "/api/quick-auth", data);
      
      if ((authResponse as any).user && (authResponse as any).employee) {
        // Now register attendance
        const attendanceResponse = await apiRequest("POST", "/api/quick-attendance", {
          employeeId: (authResponse as any).employee.id,
          type: (authResponse as any).nextAction // "check-in" or "check-out"
        });

        // Store attendance result and show modal
        setAttendanceResult(attendanceResponse);
        setShowAttendanceModal(true);

        // Clear form
        quickForm.reset();
      }
    } catch (error: any) {
      toast({
        title: t("error", language),
        description: error.message || (language === "ca" ? "Error en el marcatge" : "Error en el marcaje"),
        variant: "destructive",
      });
    } finally {
      setIsQuickAttendanceLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <GraduationCap className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            EduPresència
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {language === "ca" 
              ? "Inicia sessió al teu compte" 
              : "Inicia sesión en tu cuenta"}
          </p>
        </div>

        {/* Login and Quick Attendance Tabs */}
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="login-tab">
                  {language === "ca" ? "Entrar" : "Entrar"}
                </TabsTrigger>
                <TabsTrigger value="attendance" data-testid="attendance-tab">
                  {language === "ca" ? "Marcatge" : "Marcaje"}
                </TabsTrigger>
              </TabsList>
              
              {/* Regular Login Tab */}
              <TabsContent value="login" className="p-6 space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {language === "ca" ? "Iniciar Sessió" : "Iniciar Sesión"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "ca" ? "Accedeix al sistema complet" : "Accede al sistema completo"}
                  </p>
                </div>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === "ca" ? "Correu electrònic" : "Correo electrónico"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="nom@exemple.com"
                              data-testid="email-input"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === "ca" ? "Contrasenya" : "Contraseña"}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                data-testid="password-input"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                data-testid="toggle-password-visibility"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                      data-testid="login-button"
                    >
                      {isLoading 
                        ? (language === "ca" ? "Iniciant sessió..." : "Iniciando sesión...")
                        : (language === "ca" ? "Iniciar Sessió" : "Iniciar Sesión")
                      }
                    </Button>
                  </form>
                </Form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    {language === "ca" ? "No tens compte? " : "¿No tienes cuenta? "}
                    <Link href="/register">
                      <Button variant="link" className="p-0" data-testid="register-link">
                        {language === "ca" ? "Registra't aquí" : "Regístrate aquí"}
                      </Button>
                    </Link>
                  </p>
                </div>
              </TabsContent>

              {/* Quick Attendance Tab */}
              <TabsContent value="attendance" className="p-6 space-y-4">
                <div className="text-center mb-4">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">
                    {language === "ca" ? "Marcatge Ràpid" : "Marcaje Rápido"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "ca" ? "Registra l'entrada o sortida sense entrar al sistema" : "Registra entrada o salida sin entrar al sistema"}
                  </p>
                  
                  {/* Digital Clock */}
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div className="text-3xl font-mono font-bold text-primary">
                      {currentTime.toLocaleTimeString("ca-ES", {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {currentTime.toLocaleDateString("ca-ES", {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                <Form {...quickForm}>
                  <form onSubmit={quickForm.handleSubmit(onQuickAttendance)} className="space-y-4">
                    <FormField
                      control={quickForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === "ca" ? "Correu electrònic" : "Correo electrónico"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="nom@exemple.com"
                              data-testid="quick-email-input"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={quickForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === "ca" ? "Contrasenya" : "Contraseña"}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showQuickPassword ? "text" : "password"}
                                placeholder="••••••••"
                                data-testid="quick-password-input"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowQuickPassword(!showQuickPassword)}
                                data-testid="toggle-quick-password-visibility"
                              >
                                {showQuickPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isQuickAttendanceLoading}
                      data-testid="quick-attendance-button"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isQuickAttendanceLoading 
                        ? (language === "ca" ? "Processant..." : "Procesando...")
                        : (language === "ca" ? "Marcar Assistència" : "Marcar Asistencia")
                      }
                    </Button>
                  </form>
                </Form>

                {/* Alternative methods - for future implementation */}
                <div className="mt-6 space-y-3">
                  <div className="text-center text-sm text-muted-foreground">
                    {language === "ca" ? "Altres mètodes de marcatge:" : "Otros métodos de marcaje:"}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      disabled
                      data-testid="qr-attendance-button"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      {language === "ca" ? "Codi QR" : "Código QR"}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      disabled
                      data-testid="nfc-attendance-button"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      NFC
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    {language === "ca" ? "Pròximament disponibles" : "Próximamente disponibles"}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>EduPresència v1.0.0</p>
          <p>{language === "ca" ? "Sistema de control de presència" : "Sistema de control de presencia"}</p>
        </div>
      </div>

      {/* Attendance Result Modal */}
      <Dialog open={showAttendanceModal} onOpenChange={setShowAttendanceModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {language === "ca" ? "Marcatge Registrat" : "Marcaje Registrado"}
            </DialogTitle>
          </DialogHeader>
          {attendanceResult && (
            <div className="space-y-4 p-4">
              {/* Status with color coding */}
              <div className={`text-center p-4 rounded-lg ${
                attendanceResult.status === 'late' ? 'bg-red-100 border-red-300' :
                attendanceResult.status === 'early' ? 'bg-blue-100 border-blue-300' :
                'bg-green-100 border-green-300'
              }`}>
                <div className={`text-2xl font-bold ${
                  attendanceResult.status === 'late' ? 'text-red-700' :
                  attendanceResult.status === 'early' ? 'text-blue-700' :
                  'text-green-700'
                }`}>
                  {attendanceResult.type === 'check_in' 
                    ? (language === "ca" ? "ENTRADA" : "ENTRADA")
                    : (language === "ca" ? "SORTIDA" : "SALIDA")
                  }
                </div>
                <div className={`text-sm ${
                  attendanceResult.status === 'late' ? 'text-red-600' :
                  attendanceResult.status === 'early' ? 'text-blue-600' :
                  'text-green-600'
                }`}>
                  {attendanceResult.statusMessage}
                </div>
              </div>

              {/* Time and date info */}
              <div className="text-center space-y-2">
                <div className="text-3xl font-mono font-bold text-gray-800">
                  {attendanceResult.time}
                </div>
                <div className="text-sm text-gray-600">
                  {attendanceResult.date}
                </div>
                <div className="text-sm text-gray-700">
                  {attendanceResult.employeeName}
                </div>
              </div>

              {/* Close button */}
              <Button 
                onClick={() => setShowAttendanceModal(false)}
                className="w-full"
                variant="outline"
              >
                {language === "ca" ? "Tancar" : "Cerrar"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}