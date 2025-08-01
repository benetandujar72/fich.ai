import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { GraduationCap, Eye, EyeOff, Clock, QrCode, CreditCard, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      // First authenticate to get user info
      const authResponse = await apiRequest("POST", "/api/quick-auth", data);
      
      if ((authResponse as any).user) {
        // Now register attendance
        const attendanceResponse = await apiRequest("POST", "/api/quick-attendance", {
          userId: (authResponse as any).user.id,
          type: (authResponse as any).nextAction // "check-in" or "check-out"
        });

        const actionText = (authResponse as any).nextAction === "check-in" 
          ? (language === "ca" ? "Entrada registrada" : "Entrada registrada")
          : (language === "ca" ? "Sortida registrada" : "Salida registrada");

        toast({
          title: t("success", language),
          description: `${actionText} - ${(attendanceResponse as any).time}`,
        });

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

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {language === "ca" ? "Iniciar Sessió" : "Iniciar Sesión"}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>
            {language === "ca" 
              ? "Sistema de gestió de presència per centres educatius"
              : "Sistema de gestión de presencia para centros educativos"}
          </p>
        </div>
      </div>
    </div>
  );
}