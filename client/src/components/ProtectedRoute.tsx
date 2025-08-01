import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: Array<'superadmin' | 'admin' | 'employee'>;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  fallback 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && isAuthenticated && requiredRoles.length > 0) {
      const userRole = user?.role;
      const hasPermission = requiredRoles.includes(userRole as any);
      
      if (!hasPermission) {
        toast({
          title: language === "ca" ? "Accés denegat" : "Acceso denegado",
          description: language === "ca" 
            ? "No tens permisos per accedir a aquesta pàgina"
            : "No tienes permisos para acceder a esta página",
          variant: "destructive",
        });
      }
    }
  }, [isLoading, isAuthenticated, user?.role, requiredRoles, language, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {language === "ca" ? "Accés requerit" : "Acceso requerido"}
          </h2>
          <p className="text-muted-foreground">
            {language === "ca" 
              ? "Has d'iniciar sessió per accedir a aquesta pàgina"
              : "Debes iniciar sesión para acceder a esta página"}
          </p>
        </div>
      </div>
    );
  }

  if (requiredRoles.length > 0) {
    const userRole = user?.role;
    const hasPermission = requiredRoles.includes(userRole as any);
    
    if (!hasPermission) {
      return fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              {language === "ca" ? "Accés denegat" : "Acceso denegado"}
            </h2>
            <p className="text-muted-foreground">
              {language === "ca" 
                ? "No tens permisos per accedir a aquesta pàgina"
                : "No tienes permisos para acceder a esta página"}
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}