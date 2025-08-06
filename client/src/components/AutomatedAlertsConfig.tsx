import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  AlertTriangle, 
  Clock, 
  Mail, 
  Calendar,
  Settings,
  Info,
  CheckCircle
} from "lucide-react";

interface AutomatedAlertsConfigProps {
  institutionId: string | null | undefined;
  language: string;
}

interface AlertSettings {
  enabled: boolean;
  delayThresholdMinutes: number;
  absenceThresholdDays: number;
  reportFrequency: 'daily' | 'weekly' | 'monthly';
  reportTime: string;
  recipientEmails: string[];
  emailSubjectTemplate: string;
  emailBodyTemplate: string;
  legalComplianceMode: boolean;
}

export default function AutomatedAlertsConfig({ institutionId, language }: AutomatedAlertsConfigProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    enabled: false,
    delayThresholdMinutes: 15,
    absenceThresholdDays: 3,
    reportFrequency: 'weekly',
    reportTime: '09:00',
    recipientEmails: [],
    emailSubjectTemplate: '',
    emailBodyTemplate: '',
    legalComplianceMode: true,
  });

  const [newRecipientEmail, setNewRecipientEmail] = useState('');

  // Fetch current alert settings
  const { data: settings, isLoading } = useQuery<any>({
    queryKey: ["/api/automated-alerts-settings", institutionId || "null"],
    enabled: institutionId !== undefined,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: AlertSettings) => {
      const finalInstitutionId = institutionId || "null";
      return await apiRequest("PUT", `/api/automated-alerts-settings/${finalInstitutionId}`, settings);
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Configuració guardada" : "Configuración guardada",
        description: language === "ca" 
          ? "Les alertes automàtiques s'han configurat correctament" 
          : "Las alertas automáticas se han configurado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/automated-alerts-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: error.message || (language === "ca" 
          ? "Error guardant la configuració" 
          : "Error guardando la configuración"),
        variant: "destructive",
      });
    },
  });

  // Test alert mutation
  const testAlertMutation = useMutation({
    mutationFn: async () => {
      const finalInstitutionId = institutionId || "null";
      return await apiRequest("POST", `/api/automated-alerts-settings/${finalInstitutionId}/test`);
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Alerta de prova enviada" : "Alerta de prueba enviada",
        description: language === "ca" 
          ? "Revisa la teva bústia per confirmar la configuració" 
          : "Revisa tu bandeja para confirmar la configuración",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: error.message || (language === "ca" 
          ? "Error enviant l'alerta de prova" 
          : "Error enviando la alerta de prueba"),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (settings && typeof settings === 'object') {
      setAlertSettings({
        enabled: (settings as any).enabled || false,
        delayThresholdMinutes: (settings as any).delayThresholdMinutes || 15,
        absenceThresholdDays: (settings as any).absenceThresholdDays || 3,
        reportFrequency: (settings as any).reportFrequency || 'weekly',
        reportTime: (settings as any).reportTime || '09:00',
        recipientEmails: (settings as any).recipientEmails || [],
        emailSubjectTemplate: (settings as any).emailSubjectTemplate || getDefaultSubjectTemplate(),
        emailBodyTemplate: (settings as any).emailBodyTemplate || getDefaultBodyTemplate(),
        legalComplianceMode: (settings as any).legalComplianceMode !== false,
      });
    } else {
      // Set default templates
      setAlertSettings(prev => ({
        ...prev,
        emailSubjectTemplate: getDefaultSubjectTemplate(),
        emailBodyTemplate: getDefaultBodyTemplate(),
      }));
    }
  }, [settings, language]);

  const getDefaultSubjectTemplate = () => {
    return language === "ca" 
      ? "Informe d'Assistència - {centerName} - {date}"
      : "Informe de Asistencia - {centerName} - {date}";
  };

  const getDefaultBodyTemplate = () => {
    return language === "ca" 
      ? `Estimat/da administrador/a,

Adjuntem l'informe d'assistència corresponent al període {period}.

RESUM:
- Total empleats: {totalEmployees}
- Empleats amb retards: {delayedEmployees}
- Empleats amb absències: {absentEmployees}
- Minuts acumulats de retard: {totalDelayMinutes}

COMPLIMENT LEGAL:
Aquest informe es genera automàticament per garantir el compliment de la normativa laboral vigent sobre control horari (Article 34.9 de l'Estatut dels Treballadors).

Salutacions cordials,
Sistema de Control d'Assistència`
      : `Estimado/a administrador/a,

Adjuntamos el informe de asistencia correspondiente al período {period}.

RESUMEN:
- Total empleados: {totalEmployees}
- Empleados con retrasos: {delayedEmployees}
- Empleados con ausencias: {absentEmployees}
- Minutos acumulados de retraso: {totalDelayMinutes}

CUMPLIMIENTO LEGAL:
Este informe se genera automáticamente para garantizar el cumplimiento de la normativa laboral vigente sobre control horario (Artículo 34.9 del Estatuto de los Trabajadores).

Saludos cordiales,
Sistema de Control de Asistencia`;
  };

  const handleInputChange = (field: keyof AlertSettings, value: any) => {
    setAlertSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleAddRecipient = () => {
    if (newRecipientEmail && newRecipientEmail.includes('@')) {
      setAlertSettings(prev => ({
        ...prev,
        recipientEmails: [...prev.recipientEmails, newRecipientEmail]
      }));
      setNewRecipientEmail('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setAlertSettings(prev => ({
      ...prev,
      recipientEmails: prev.recipientEmails.filter(e => e !== email)
    }));
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(alertSettings);
  };

  const handleTestAlert = () => {
    testAlertMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card data-testid="automated-alerts-loading">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            {language === "ca" ? "Alertes Automàtiques" : "Alertas Automáticas"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="automated-alerts-config">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            {language === "ca" ? "Alertes Automàtiques" : "Alertas Automáticas"}
          </div>
          <Switch
            checked={alertSettings.enabled}
            onCheckedChange={(enabled) => handleInputChange('enabled', enabled)}
            data-testid="alerts-enabled-switch"
          />
        </CardTitle>
        <p className="text-sm text-gray-600">
          {language === "ca" 
            ? "Configura les notificacions automàtiques per garantir el compliment legal del control horari"
            : "Configura las notificaciones automáticas para garantizar el cumplimiento legal del control horario"}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Legal Compliance Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="text-blue-600 mr-3 h-5 w-5 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">
                {language === "ca" ? "Compliment Legal Obligatori" : "Cumplimiento Legal Obligatorio"}
              </p>
              <p className="text-sm text-blue-700">
                {language === "ca" 
                  ? "L'Article 34.9 de l'Estatut dels Treballadors obliga a les empreses a portar un registre diari de jornada. Aquestes alertes garanteixen el seguiment adequat."
                  : "El Artículo 34.9 del Estatuto de los Trabajadores obliga a las empresas a llevar un registro diario de jornada. Estas alertas garantizan el seguimiento adecuado."}
              </p>
            </div>
          </div>
        </div>

        {alertSettings.enabled && (
          <>
            {/* Threshold Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="delay-threshold">
                  {language === "ca" ? "Llindar de retard (minuts)" : "Umbral de retraso (minutos)"}
                </Label>
                <Input
                  id="delay-threshold"
                  type="number"
                  min="1"
                  max="120"
                  value={alertSettings.delayThresholdMinutes}
                  onChange={(e) => handleInputChange('delayThresholdMinutes', parseInt(e.target.value) || 15)}
                  data-testid="delay-threshold-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {language === "ca" 
                    ? "Retards superiors a aquests minuts es consideraran significatius"
                    : "Retrasos superiores a estos minutos se considerarán significativos"}
                </p>
              </div>

              <div>
                <Label htmlFor="absence-threshold">
                  {language === "ca" ? "Llindar d'absència (dies)" : "Umbral de ausencia (días)"}
                </Label>
                <Input
                  id="absence-threshold"
                  type="number"
                  min="1"
                  max="30"
                  value={alertSettings.absenceThresholdDays}
                  onChange={(e) => handleInputChange('absenceThresholdDays', parseInt(e.target.value) || 3)}
                  data-testid="absence-threshold-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {language === "ca" 
                    ? "Absències consecutives que triggeraran alertes"
                    : "Ausencias consecutivas que activarán alertas"}
                </p>
              </div>
            </div>

            {/* Report Frequency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="report-frequency">
                  {language === "ca" ? "Freqüència d'informes" : "Frecuencia de informes"}
                </Label>
                <Select
                  value={alertSettings.reportFrequency}
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                    handleInputChange('reportFrequency', value)}
                >
                  <SelectTrigger id="report-frequency" data-testid="report-frequency-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">
                      {language === "ca" ? "Diari" : "Diario"}
                    </SelectItem>
                    <SelectItem value="weekly">
                      {language === "ca" ? "Setmanal" : "Semanal"}
                    </SelectItem>
                    <SelectItem value="monthly">
                      {language === "ca" ? "Mensual" : "Mensual"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="report-time">
                  {language === "ca" ? "Hora d'enviament" : "Hora de envío"}
                </Label>
                <Input
                  id="report-time"
                  type="time"
                  value={alertSettings.reportTime}
                  onChange={(e) => handleInputChange('reportTime', e.target.value)}
                  data-testid="report-time-input"
                />
              </div>
            </div>

            {/* Recipients */}
            <div>
              <Label>
                {language === "ca" ? "Destinataris" : "Destinatarios"}
              </Label>
              <div className="flex space-x-2 mt-2 mb-3">
                <Input
                  type="email"
                  placeholder={language === "ca" ? "afegir@email.com" : "agregar@email.com"}
                  value={newRecipientEmail}
                  onChange={(e) => setNewRecipientEmail(e.target.value)}
                  data-testid="new-recipient-input"
                />
                <Button
                  onClick={handleAddRecipient}
                  disabled={!newRecipientEmail || !newRecipientEmail.includes('@')}
                  data-testid="add-recipient-button"
                >
                  {language === "ca" ? "Afegir" : "Agregar"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {alertSettings.recipientEmails.map((email, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveRecipient(email)}
                    data-testid={`recipient-${index}`}
                  >
                    {email} ✕
                  </Badge>
                ))}
              </div>
            </div>

            {/* Email Templates */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-subject">
                  {language === "ca" ? "Plantilla d'assumpte" : "Plantilla de asunto"}
                </Label>
                <Input
                  id="email-subject"
                  value={alertSettings.emailSubjectTemplate}
                  onChange={(e) => handleInputChange('emailSubjectTemplate', e.target.value)}
                  placeholder={getDefaultSubjectTemplate()}
                  data-testid="email-subject-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {language === "ca" 
                    ? "Variables disponibles: {centerName}, {date}, {period}"
                    : "Variables disponibles: {centerName}, {date}, {period}"}
                </p>
              </div>

              <div>
                <Label htmlFor="email-body">
                  {language === "ca" ? "Plantilla del cos" : "Plantilla del cuerpo"}
                </Label>
                <Textarea
                  id="email-body"
                  rows={8}
                  value={alertSettings.emailBodyTemplate}
                  onChange={(e) => handleInputChange('emailBodyTemplate', e.target.value)}
                  placeholder={getDefaultBodyTemplate()}
                  data-testid="email-body-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {language === "ca" 
                    ? "Variables: {centerName}, {period}, {totalEmployees}, {delayedEmployees}, {absentEmployees}, {totalDelayMinutes}"
                    : "Variables: {centerName}, {period}, {totalEmployees}, {delayedEmployees}, {absentEmployees}, {totalDelayMinutes}"}
                </p>
              </div>
            </div>

            {/* Legal Compliance Mode */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">
                  {language === "ca" ? "Mode de compliment legal" : "Modo de cumplimiento legal"}
                </p>
                <p className="text-sm text-gray-600">
                  {language === "ca" 
                    ? "Inclou referències legals obligatòries als informes"
                    : "Incluye referencias legales obligatorias en los informes"}
                </p>
              </div>
              <Switch
                checked={alertSettings.legalComplianceMode}
                onCheckedChange={(enabled) => handleInputChange('legalComplianceMode', enabled)}
                data-testid="legal-compliance-switch"
              />
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <Button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending}
            className="flex-1"
            data-testid="save-alerts-button"
          >
            {updateSettingsMutation.isPending
              ? (language === "ca" ? "Guardant..." : "Guardando...")
              : (language === "ca" ? "Guardar Configuració" : "Guardar Configuración")}
          </Button>
          
          {alertSettings.enabled && alertSettings.recipientEmails.length > 0 && (
            <Button
              onClick={handleTestAlert}
              disabled={testAlertMutation.isPending}
              variant="outline"
              data-testid="test-alert-button"
            >
              {testAlertMutation.isPending
                ? (language === "ca" ? "Enviant..." : "Enviando...")
                : (language === "ca" ? "Prova d'Alerta" : "Prueba de Alerta")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}