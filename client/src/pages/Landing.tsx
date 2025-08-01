import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Shield, Clock, BarChart3 } from "lucide-react";

export default function Landing() {
  const { language } = useLanguage();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const features = [
    {
      icon: Shield,
      title: language === "ca" ? "Compliment RGPD" : "Cumplimiento RGPD",
      description: language === "ca" ? "Protecció de dades garantida" : "Protección de datos garantizada"
    },
    {
      icon: Clock,
      title: language === "ca" ? "Control horari intel·ligent" : "Control horario inteligente", 
      description: language === "ca" ? "Gestió automatizada d'absències" : "Gestión automatizada de ausencias"
    },
    {
      icon: BarChart3,
      title: language === "ca" ? "Informes detallats" : "Informes detallados",
      description: language === "ca" ? "Estadístiques i anàlisis avançades" : "Estadísticas y análisis avanzados"
    }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-blue-600 text-white p-12 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <GraduationCap className="text-6xl mb-4 h-16 w-16" />
            <h1 className="text-4xl font-bold mb-4">EduPresència</h1>
            <p className="text-xl text-blue-100">
              {language === "ca" 
                ? "Sistema integral de control de presència per a centres educatius"
                : "Sistema integral de control de presencia para centros educativos"}
            </p>
          </div>
          
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center">
                <feature.icon className="text-2xl mr-4 h-8 w-8" />
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-blue-100 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-text mb-2">
              {language === "ca" ? "Accés al sistema" : "Acceso al sistema"}
            </h2>
            <p className="text-gray-600">
              {language === "ca" 
                ? "Inicia sessió amb el teu compte institucional"
                : "Inicia sesión con tu cuenta institucional"}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleLogin}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                data-testid="login-button"
              >
                {language === "ca" ? "Iniciar sessió" : "Iniciar sesión"}
              </Button>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  {language === "ca" 
                    ? "Necessites ajuda? Contacta amb l'administrador del centre"
                    : "¿Necesitas ayuda? Contacta con el administrador del centro"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
