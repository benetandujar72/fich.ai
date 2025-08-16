import { useState, useEffect, useRef } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
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
  const quickEmailRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("attendance");

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

  // Get users for quick select
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    enabled: activeTab === "attendance",
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", data);
      console.log("Login successful", response);
      
      // Show success message
      toast({
        title: language === "ca" ? "Sessió iniciada" : "Sesión iniciada",
        description: language === "ca" ? "Redirigint al sistema..." : "Redirigiendo al sistema...",
        variant: "default",
      });
      
      // Force reload to ensure proper session handling
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error: any) {
      toast({
        title: t("error", language),
        description: error.message || t("invalid_credentials", language),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onQuickAttendance = async (data: QuickAttendanceData) => {
    setIsQuickAttendanceLoading(true);
    
    try {
      // First authenticate
      const authResponse = await apiRequest("POST", "/api/quick-auth", data);
      
      if ((authResponse as any).user && (authResponse as any).employee) {
        // Now register attendance
        const attendanceResponse = await apiRequest("POST", "/api/quick-attendance", {
          employeeId: (authResponse as any).employee.id,
          type: (authResponse as any).nextAction // "check-in" or "check-out"
        });

        // Use the response directly from the server which already has all the formatted data
        console.log("Attendance response:", attendanceResponse);
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
        {/* Login button in top right - only show when on attendance tab */}
        {activeTab === "attendance" && (
          <div className="absolute top-4 right-4">
            <Button 
              onClick={() => setActiveTab("login")}
              size="sm"
              className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-600 shadow-lg hover:shadow-blue-400/25 text-white"
              data-testid="login-access-button"
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              {language === "ca" ? "Accés Complet" : "Acceso Completo"}
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-white">F</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            fich.ai
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {language === "ca" 
              ? "Inicia sessió al teu compte" 
              : "Inicia sesión en tu cuenta"}
          </p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="p-6">
            {/* Show quick attendance if active, otherwise regular login */}
            {activeTab === "attendance" ? (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">
                    {language === "ca" ? "Marcatge Ràpid" : "Marcaje Rápido"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "ca" ? "Fitxa directament amb les teves credencials" : "Ficha directamente con tus credenciales"}
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
                              id="quick-email"
                              type="email"
                              placeholder="nom@exemple.com"
                              autoComplete="email"
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
                                id="quick-password"
                                type={showQuickPassword ? "text" : "password"}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                data-testid="quick-password-input"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowQuickPassword(!showQuickPassword)}
                                data-testid="quick-password-toggle"
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
                      disabled={isQuickAttendanceLoading}
                      className="w-full"
                      data-testid="quick-attendance-submit"
                    >
                      {isQuickAttendanceLoading ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          {language === "ca" ? "Processant..." : "Procesando..."}
                        </>
                      ) : (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          {language === "ca" ? "Fitxar Ara" : "Fichar Ahora"}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
                
                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab("login")}
                    className="text-sm text-muted-foreground"
                  >
                    {language === "ca" ? "Accés complet al sistema" : "Acceso completo al sistema"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
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
                              id="login-email"
                              type="email"
                              placeholder="nom@exemple.com"
                              autoComplete="email"
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
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                autoComplete="current-password"
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

                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab("attendance")}
                    className="text-sm text-muted-foreground"
                  >
                    {language === "ca" ? "Marcatge ràpid" : "Marcaje rápido"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* QR and Register Links */}
        <div className="text-center space-y-2">
          <Link href="/public-qr">
            <Button variant="outline" size="sm" className="text-sm">
              <QrCode className="mr-2 h-4 w-4" />
              {language === "ca" ? "Fitxatge amb Codi QR" : "Fichaje con Código QR"}
            </Button>
          </Link>
          
          {activeTab === "login" && (
            <p className="text-sm text-gray-600">
              {language === "ca" ? "No tens compte? " : "¿No tienes cuenta? "}
              <Link href="/register">
                <Button variant="link" className="p-0 text-sm" data-testid="register-link">
                  {language === "ca" ? "Registra't aquí" : "Regístrate aquí"}
                </Button>
              </Link>
            </p>
          )}
        </div>
        
        {/* Attendance Result Modal */}
        <Dialog open={showAttendanceModal} onOpenChange={setShowAttendanceModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                {language === "ca" ? "Fitxatge Realitzat" : "Fichaje Realizado"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {attendanceResult && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {attendanceResult.type === "check_in" 
                        ? (language === "ca" ? "ENTRADA" : "ENTRADA")
                        : (language === "ca" ? "SORTIDA" : "SALIDA")
                      }
                    </div>
                    <div className="text-lg text-muted-foreground">
                      {attendanceResult.employeeName}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>{language === "ca" ? "Hora:" : "Hora:"}</strong>
                      <br />
                      {new Date(attendanceResult.timestamp).toLocaleString("ca-ES")}
                    </div>
                    <div>
                      <strong>{language === "ca" ? "Mètode:" : "Método:"}</strong>
                      <br />
                      {language === "ca" ? "Marcatge Ràpid" : "Marcaje Rápido"}
                    </div>
                  </div>
                  
                  {attendanceResult.isLate && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="text-sm text-orange-800">
                        ⚠️ {language === "ca" ? "Arribada tardana" : "Llegada tardía"}: {attendanceResult.lateMinutes} {language === "ca" ? "minuts" : "minutos"}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => setShowAttendanceModal(false)}
                    className="w-full"
                  >
                    {language === "ca" ? "Tancar" : "Cerrar"}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}