import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { language } = useLanguage();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "No autoritzat",
        description: t("login_required", language),
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, language]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">{t("loading", language)}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
