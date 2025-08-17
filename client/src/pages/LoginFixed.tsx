import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff, QrCode, Clock, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Email no vàlid"),
  password: z.string().min(6, "La contrasenya ha de tenir almenys 6 caràcters"),
});

const quickAttendanceSchema = z.object({
  email: z.string().email("Email no vàlid"),
  password: z.string().min(6, "La contrasenya ha de tenir almenys 6 caràcters"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type QuickAttendanceData = z.infer<typeof quickAttendanceSchema>;

export default function LoginFixed() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickAttendanceLoading, setIsQuickAttendanceLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showQuickPassword, setShowQuickPassword] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState<any>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [activeTab, setActiveTab] = useState("attendance");

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
      console.log("Login successful", response);
      
      toast({
        title: language === "ca" ? "Sessió iniciada" : "Sesión iniciada",
        description: language === "ca" ? "Redirigint al sistema..." : "Redirigiendo al sistema...",
        variant: "default",
      });
      
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
      const authResponse = await apiRequest("POST", "/api/quick-auth", data);
      const authData = authResponse instanceof Response ? await authResponse.json() : authResponse;
      
      if (authData.user && authData.employee) {
        const attendanceData = {
          employeeId: authData.employee.id,
          type: authData.nextAction
        };
        
        const attendanceResponse = await apiRequest("POST", "/api/quick-attendance", attendanceData);
        const attendanceResult = attendanceResponse instanceof Response ? await attendanceResponse.json() : attendanceResponse;

        setAttendanceResult(attendanceResult);
        setShowAttendanceModal(true);
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
              ? "Sistema de fitxatge i control horari" 
              : "Sistema de fichaje y control horario"}
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="attendance">
                  {language === "ca" ? "Marcatge Ràpid" : "Marcaje Rápido"}
                </TabsTrigger>
                <TabsTrigger value="login">
                  {language === "ca" ? "Accés Complet" : "Acceso Completo"}
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="attendance" className="space-y-4 m-0">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">
                      {language === "ca" ? "Marcatge Ràpid" : "Marcaje Rápido"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === "ca" ? "Fitxa directament amb les teves credencials" : "Ficha directamente con tus credenciales"}
                    </p>
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
                </TabsContent>

                <TabsContent value="login" className="space-y-4 m-0">
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
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="text-center space-y-3">
          <Link href="/public-qr">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg" data-testid="qr-attendance-button">
              <QrCode className="mr-2 h-5 w-5" />
              {language === "ca" ? "🔷 Fitxatge amb Codi QR Personal" : "🔷 Fichaje con Código QR Personal"}
            </Button>
          </Link>
          <div className="text-xs text-blue-600 font-medium">
            {language === "ca" ? "Accés directe sense iniciar sessió" : "Acceso directo sin iniciar sesión"}
          </div>
          
          <p className="text-sm text-gray-600">
            {language === "ca" ? "No tens compte? " : "¿No tienes cuenta? "}
            <Link href="/register">
              <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800">
                {language === "ca" ? "Registra't" : "Regístrate"}
              </Button>
            </Link>
          </p>
        </div>
      </div>
      
      <Dialog open={showAttendanceModal} onOpenChange={setShowAttendanceModal}>
        <DialogContent className="modal-content-solid"
          style={{
            background: 'hsl(0 0% 100%)',
            border: '2px solid hsl(214.3 31.8% 85%)',
            boxShadow: '0 25px 50px -12px hsl(0 0% 0% / 0.4)'
          }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {language === "ca" ? "Fitxatge Registrat" : "Fichaje Registrado"}
            </DialogTitle>
          </DialogHeader>
          
          {attendanceResult && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {attendanceResult.message}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {new Date(attendanceResult.timestamp || attendanceResult.created_at).toLocaleString("ca-ES", {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>
              
              {attendanceResult.isLate && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-sm text-yellow-800">
                    <strong>{language === "ca" ? "Arribada tardana:" : "Llegada tardía:"}</strong> {attendanceResult.lateMinutes} {language === "ca" ? "minuts" : "minutos"}
                  </div>
                </div>
              )}
              
              <div className="flex justify-center">
                <Button onClick={() => setShowAttendanceModal(false)} data-testid="close-modal">
                  {language === "ca" ? "Tancar" : "Cerrar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}