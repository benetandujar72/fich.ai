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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff, QrCode } from "lucide-react";
import { Link } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Email no vàlid"),
  password: z.string().min(6, "La contrasenya ha de tenir almenys 6 caràcters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginSimple() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
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
              ? "Sistema de fitxatge i control horari" 
              : "Sistema de fichaje y control horario"}
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
          </CardContent>
        </Card>
        
        {/* QR Link */}
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
    </div>
  );
}