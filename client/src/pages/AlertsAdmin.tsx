import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Settings, 
  Bell, 
  Users,
  FileText,
  Calendar,
  Filter,
  Plus
} from "lucide-react";

// Import existing components
import AutomatedAlertsConfig from "@/components/AutomatedAlertsConfig";
import AbsenceJustificationReview from "@/components/AbsenceJustificationReview";
import { AlertsManagement } from "@/components/admin/AlertsManagement";
import AlertConfigModal from "@/components/modals/AlertConfigModal";

export default function AlertsAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const permissions = usePermissions();
  
  const [showAlertConfigModal, setShowAlertConfigModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Get institution ID from authenticated user
  const institutionId = user?.institutionId;

  // Fetch alert statistics for overview
  const { data: alertStats } = useQuery({
    queryKey: ["/api/alerts", institutionId],
    enabled: !!institutionId,
  });

  const { data: justifications = [] } = useQuery({
    queryKey: ["/api/absence-justifications/admin", institutionId],
    enabled: !!institutionId,
  });

  if (!permissions.canManageAlerts) {
    return (
      <main className="p-6">
        <div className="text-center py-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {language === "ca" ? "Accés denegat" : "Acceso denegado"}
          </h1>
          <p className="text-gray-600">
            {language === "ca" 
              ? "No tens permisos per gestionar alertes"
              : "No tienes permisos para gestionar alertas"}
          </p>
        </div>
      </main>
    );
  }

  // Calculate statistics
  const activeAlerts = Array.isArray(alertStats) ? alertStats.filter((alert: any) => alert.status === 'active').length : 0;
  const totalAlerts = Array.isArray(alertStats) ? alertStats.length : 0;
  const pendingJustifications = Array.isArray(justifications) ? justifications.filter((j: any) => j.status === 'pending').length : 0;

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {language === "ca" ? "Administració d'Alertes" : "Administración de Alertas"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ca" 
              ? "Gestiona alertes automàtiques, justificacions i configuracions del sistema"
              : "Gestiona alertas automáticas, justificaciones y configuraciones del sistema"}
          </p>
        </div>
        
        <Button 
          onClick={() => setShowAlertConfigModal(true)}
          data-testid="create-alert-rule-button"
        >
          <Plus className="mr-2 h-4 w-4" />
          {language === "ca" ? "Nova Regla d'Alerta" : "Nueva Regla de Alerta"}
        </Button>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "ca" ? "Alertes Actives" : "Alertas Activas"}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {language === "ca" ? `de ${totalAlerts} alertes totals` : `de ${totalAlerts} alertas totales`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "ca" ? "Justificacions Pendents" : "Justificaciones Pendientes"}
            </CardTitle>
            <FileText className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingJustifications}</div>
            <p className="text-xs text-muted-foreground">
              {language === "ca" ? "per revisar" : "por revisar"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "ca" ? "Sistema d'Alertes" : "Sistema de Alertas"}
            </CardTitle>
            <Settings className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {language === "ca" ? "Actiu" : "Activo"}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === "ca" ? "funcionant correctament" : "funcionando correctamente"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {language === "ca" ? "Vista General" : "Vista General"}
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {language === "ca" ? "Gestió" : "Gestión"}
          </TabsTrigger>
          <TabsTrigger value="justifications" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {language === "ca" ? "Justificacions" : "Justificaciones"}
            {pendingJustifications > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingJustifications}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {language === "ca" ? "Configuració" : "Configuración"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {language === "ca" ? "Resum d'Activitat" : "Resumen de Actividad"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">
                      {language === "ca" ? "Alertes per Retards" : "Alertas por Retrasos"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {language === "ca" ? "Empleats que han arribat tard" : "Empleados que han llegado tarde"}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {Array.isArray(alertStats) ? alertStats.filter((a: any) => a.type === 'late_arrival' && a.status === 'active').length : 0}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">
                      {language === "ca" ? "Alertes per Absències" : "Alertas por Ausencias"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {language === "ca" ? "Absències sense justificar" : "Ausencias sin justificar"}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {Array.isArray(alertStats) ? alertStats.filter((a: any) => a.type === 'absence' && a.status === 'active').length : 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <AlertsManagement />
        </TabsContent>

        <TabsContent value="justifications" className="space-y-6">
          <AbsenceJustificationReview 
            institutionId={institutionId || null}
            language={language}
          />
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <AutomatedAlertsConfig 
            institutionId={institutionId || null}
            language={language}
          />
        </TabsContent>
      </Tabs>

      {/* Alert Configuration Modal */}
      <AlertConfigModal
        isOpen={showAlertConfigModal}
        onClose={() => setShowAlertConfigModal(false)}
        institutionId={institutionId}
        language={language}
      />
    </main>
  );
}