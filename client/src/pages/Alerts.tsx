import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { t } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertTriangle, 
  Clock, 
  Info, 
  X,
  CheckCircle,
  UserX,
  Shield
} from "lucide-react";
import type { Alert } from "@shared/schema";

export default function Alerts() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [lateToleranceMinutes, setLateToleranceMinutes] = useState(5);
  const [maxLatesPerMonth, setMaxLatesPerMonth] = useState(3);

  // Get institution ID from authenticated user
  const institutionId = user?.institutionId;

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["/api/alerts", institutionId],
    enabled: !!institutionId,
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return await apiRequest("PUT", `/api/alerts/${alertId}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: t("success", language),
        description: language === "ca" ? "Alerta resolta correctament" : "Alerta resuelta correctamente",
      });
    },
    onError: () => {
      toast({
        title: t("error", language),
        description: language === "ca" ? "Error resolent l'alerta" : "Error resolviendo la alerta",
        variant: "destructive",
      });
    },
  });



  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        apiRequest("PUT", `/api/settings/${institutionId}/late_tolerance_minutes`, { 
          value: lateToleranceMinutes 
        }),
        apiRequest("PUT", `/api/settings/${institutionId}/max_lates_per_month`, { 
          value: maxLatesPerMonth 
        }),
      ]);
    },
    onSuccess: () => {
      toast({
        title: t("success", language),
        description: language === "ca" ? "Configuració guardada" : "Configuración guardada",
      });
    },
    onError: () => {
      toast({
        title: t("error", language),
        description: language === "ca" ? "Error guardant la configuració" : "Error guardando la configuración",
        variant: "destructive",
      });
    },
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "late_arrival":
        return <Clock className="h-5 w-5" />;
      case "absence":
        return <UserX className="h-5 w-5" />;
      case "substitute_needed":
        return <Info className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "late_arrival":
        return "border-accent bg-accent/5 text-accent";
      case "absence":
        return "border-error bg-error/5 text-error";
      case "substitute_needed":
        return "border-primary bg-primary/5 text-primary";
      default:
        return "border-error bg-error/5 text-error";
    }
  };

  const getAlertTitle = (type: string) => {
    switch (type) {
      case "late_arrival":
        return language === "ca" ? "Retard detectat" : "Retraso detectado";
      case "absence":
        return language === "ca" ? "Absència sense justificar" : "Ausencia sin justificar";
      case "substitute_needed":
        return language === "ca" ? "Guàrdia assignada automàticament" : "Guardia asignada automáticamente";
      default:
        return language === "ca" ? "Alerta" : "Alerta";
    }
  };



  // Real alert history will be loaded from database

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      {/* Alert Configuration */}
      <Card data-testid="alert-config-card">
        <CardHeader>
          <CardTitle>
            {language === "ca" ? "Configuració d'alertes" : "Configuración de alertas"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="late-tolerance">
                {language === "ca" ? "Tolerància de retard (minuts)" : "Tolerancia de retraso (minutos)"}
              </Label>
              <Input
                id="late-tolerance"
                type="number"
                value={lateToleranceMinutes}
                onChange={(e) => setLateToleranceMinutes(Number(e.target.value))}
                data-testid="late-tolerance-input"
              />
            </div>
            <div>
              <Label htmlFor="max-lates">
                {language === "ca" ? "Retards màxims per mes" : "Retrasos máximos por mes"}
              </Label>
              <Input
                id="max-lates"
                type="number"
                value={maxLatesPerMonth}
                onChange={(e) => setMaxLatesPerMonth(Number(e.target.value))}
                data-testid="max-lates-input"
              />
            </div>
          </div>
          
          <Button 
            onClick={() => saveConfigMutation.mutate()}
            disabled={saveConfigMutation.isPending}
            className="mt-4"
            data-testid="save-config-button"
          >
            {language === "ca" ? "Guardar configuració" : "Guardar configuración"}
          </Button>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card data-testid="active-alerts-card">
        <CardHeader>
          <CardTitle>
            {language === "ca" ? "Alertes actives" : "Alertas activas"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(alerts as any[]).length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-secondary mb-4" />
              <p className="text-gray-600">
                {language === "ca" ? "No hi ha alertes actives" : "No hay alertas activas"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse border-l-4 border-gray-200 p-4 rounded-r-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-200 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (alerts as any[]).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{language === "ca" ? "No hi ha alertes actives" : "No hay alertas activas"}</p>
                </div>
              ) : (
                (alerts as any[]).map((alert: any) => (
                  <div 
                    key={alert.id}
                    className={`border-l-4 p-4 rounded-r-lg ${getAlertColor(alert.type)}`}
                    data-testid={`alert-${alert.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div>
                          <p className="font-medium text-text">{alert.title}</p>
                          <p className="text-sm text-gray-600">{alert.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(alert.createdAt).toLocaleString(language === "ca" ? "ca-ES" : "es-ES")}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveAlertMutation.mutate(alert.id)}
                          data-testid={`dismiss-alert-${alert.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card data-testid="alert-history-card">
        <CardHeader>
          <CardTitle>
            {language === "ca" ? "Historial d'alertes" : "Historial de alertas"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {language === "ca" ? "Data/Hora" : "Fecha/Hora"}
                  </TableHead>
                  <TableHead>
                    {language === "ca" ? "Empleat" : "Empleado"}
                  </TableHead>
                  <TableHead>
                    {language === "ca" ? "Tipus" : "Tipo"}
                  </TableHead>
                  <TableHead>
                    {t("status", language)}
                  </TableHead>
                  <TableHead>
                    {t("actions", language)}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {language === "ca" ? "Historial d'alertes es carregarà des de la base de dades" : "Historial de alertas se cargará desde la base de datos"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
