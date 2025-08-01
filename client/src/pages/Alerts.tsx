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
  UserX
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

  const mockActiveAlerts = [
    {
      id: "alert-1",
      type: "absence",
      title: language === "ca" ? "Absència sense justificar" : "Ausencia sin justificar",
      description: "Pere Martínez - No ha fitxat l'entrada",
      time: "fa 25 minuts",
      testId: "alert-absence-pere"
    },
    {
      id: "alert-2", 
      type: "late_arrival",
      title: language === "ca" ? "Retard detectat" : "Retraso detectado",
      description: "Maria López - 15 minuts de retard",
      time: "fa 10 minuts",
      testId: "alert-late-maria"
    },
    {
      id: "alert-3",
      type: "substitute_needed",
      title: language === "ca" ? "Guàrdia assignada automàticament" : "Guardia asignada automáticamente", 
      description: "Anna Garcia - Aula 205 (substitució Pere Martínez)",
      time: "fa 5 minuts",
      testId: "alert-substitute-anna"
    },
  ];

  const mockAlertHistory = [
    {
      id: "history-1",
      date: "15/01/2025 08:25",
      employee: "Pere Martínez",
      type: language === "ca" ? "Absència" : "Ausencia",
      status: "active",
      testId: "history-pere-absence"
    },
    {
      id: "history-2",
      date: "14/01/2025 08:20",
      employee: "Maria López",
      type: language === "ca" ? "Retard" : "Retraso",
      status: "resolved",
      testId: "history-maria-late"
    },
  ];

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
          {mockActiveAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-secondary mb-4" />
              <p className="text-gray-600">
                {language === "ca" ? "No hi ha alertes actives" : "No hay alertas activas"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mockActiveAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`border-l-4 p-4 rounded-r-lg ${getAlertColor(alert.type)}`}
                  data-testid={alert.testId}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <p className="font-medium text-text">{alert.title}</p>
                        <p className="text-sm text-gray-600">{alert.description}</p>
                        <p className="text-xs text-gray-500">{alert.time}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {alert.type === "absence" && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`assign-substitute-${alert.id}`}
                        >
                          {language === "ca" ? "Assignar guàrdia" : "Asignar guardia"}
                        </Button>
                      )}
                      {alert.type === "late_arrival" && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`justify-late-${alert.id}`}
                        >
                          {language === "ca" ? "Justificar" : "Justificar"}
                        </Button>
                      )}
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
              ))}
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
                {mockAlertHistory.map((alert) => (
                  <TableRow key={alert.id} data-testid={alert.testId}>
                    <TableCell>{alert.date}</TableCell>
                    <TableCell>{alert.employee}</TableCell>
                    <TableCell>{alert.type}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={alert.status === "active" ? "destructive" : "default"}
                        className={alert.status === "active" ? 
                          "bg-error/10 text-error" : 
                          "bg-secondary/10 text-secondary"
                        }
                      >
                        {alert.status === "active" ? 
                          (language === "ca" ? "Activa" : "Activa") :
                          (language === "ca" ? "Resolta" : "Resuelta")
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`manage-alert-${alert.id}`}
                      >
                        {alert.status === "active" ? 
                          (language === "ca" ? "Gestionar" : "Gestionar") :
                          (language === "ca" ? "Veure detalls" : "Ver detalles")
                        }
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
