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
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";

const registerSchema = z.object({
  firstName: z.string().min(2, "El nom ha de tenir almenys 2 caràcters"),
  lastName: z.string().min(2, "El cognom ha de tenir almenys 2 caràcters"),
  email: z.string().email("Email no vàlid"),
  password: z.string().min(6, "La contrasenya ha de tenir almenys 6 caràcters"),
  confirmPassword: z.string().min(6, "Confirma la contrasenya"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les contrasenyes no coincideixen",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      const response = await apiRequest("POST", "/api/register", registerData);
      
      toast({
        title: t("success", language),
        description: language === "ca" ? "Compte creat correctament" : "Cuenta creada correctamente",
      });

      // Reload to trigger auth state update
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: t("error", language),
        description: error.message || (language === "ca" ? "Error en el registre" : "Error en el registro"),
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
            <GraduationCap className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            EduPresència
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {language === "ca" 
              ? "Crea el teu compte" 
              : "Crea tu cuenta"}
          </p>
        </div>

        {/* Register Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {language === "ca" ? "Registrar-se" : "Registrarse"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "ca" ? "Nom" : "Nombre"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Joan"
                            data-testid="first-name-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {language === "ca" ? "Cognoms" : "Apellidos"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Garcia"
                            data-testid="last-name-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          placeholder="joan.garcia@exemple.com"
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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === "ca" ? "Confirmar contrasenya" : "Confirmar contraseña"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            data-testid="confirm-password-input"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            data-testid="toggle-confirm-password-visibility"
                          >
                            {showConfirmPassword ? (
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
                  data-testid="register-button"
                >
                  {isLoading 
                    ? (language === "ca" ? "Creant compte..." : "Creando cuenta...")
                    : (language === "ca" ? "Crear Compte" : "Crear Cuenta")
                  }
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {language === "ca" ? "Ja tens compte? " : "¿Ya tienes cuenta? "}
                <Link href="/login">
                  <Button variant="link" className="p-0" data-testid="login-link">
                    {language === "ca" ? "Inicia sessió aquí" : "Inicia sesión aquí"}
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