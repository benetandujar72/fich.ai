import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  UserX, 
  AlertTriangle, 
  Mail, 
  Settings, 
  Plus,
  Trash2,
  Edit,
  Bell,
  CheckCircle
} from "lucide-react";

interface AlertRule {
  id: string;
  name: string;
  type: 'late_arrival' | 'absence' | 'early_departure' | 'custom';
  enabled: boolean;
  condition: {
    threshold: number;
    unit: 'minutes' | 'hours' | 'days';
    comparison: 'greater_than' | 'less_than' | 'equals';
  };
  notification: {
    email: boolean;
    internal: boolean;
    emailTemplate: string;
    recipients: string[];
  };
  schedule: {
    immediate: boolean;
    delay: number; // minutes
    repeat: boolean;
    repeatInterval: number; // minutes
  };
}

export default function AlertConfig() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch alert rules
  const { data: alertRules = [], isLoading } = useQuery({
    queryKey: ["/api/admin/alert-rules", user?.institutionId],
    queryFn: async () => {
      if (!user?.institutionId) return [];
      const response = await fetch(`/api/admin/alert-rules/${user.institutionId}`);
      if (!response.ok) throw new Error('Failed to fetch alert rules');
      return response.json();
    },
    enabled: !!user?.institutionId,
  });

  // Create/Update alert rule
  const saveRuleMutation = useMutation({
    mutationFn: async (rule: Partial<AlertRule>) => {
      const url = rule.id 
        ? `/api/admin/alert-rules/${rule.id}` 
        : `/api/admin/alert-rules`;
      const method = rule.id ? 'PUT' : 'POST';
      
      return apiRequest(method, url, { ...rule, institutionId: user?.institutionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/alert-rules"] });
      toast({
        title: language === "ca" ? "Regla guardada" : "Regla guardada",
        description: language === "ca" ? 
          "La regla d'alerta s'ha configurat correctament" : 
          "La regla de alerta se ha configurado correctamente"
      });
      setSelectedRule(null);
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: language === "ca" ? 
          "No s'ha pogut guardar la regla" : 
          "No se pudo guardar la regla",
        variant: "destructive"
      });
    }
  });

  // Delete alert rule
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return apiRequest('DELETE', `/api/admin/alert-rules/${ruleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/alert-rules"] });
      toast({
        title: language === "ca" ? "Regla eliminada" : "Regla eliminada",
        description: language === "ca" ? 
          "La regla d'alerta s'ha eliminat correctament" : 
          "La regla de alerta se ha eliminado correctamente"
      });
    }
  });

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'late_arrival':
        return <Clock className="h-4 w-4" />;
      case 'absence':
        return <UserX className="h-4 w-4" />;
      case 'early_departure':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getAlertTypeName = (type: string) => {
    switch (type) {
      case 'late_arrival':
        return language === "ca" ? "Arribada tardana" : "Llegada tardía";
      case 'absence':
        return language === "ca" ? "Absència" : "Ausencia";
      case 'early_departure':
        return language === "ca" ? "Sortida anticipada" : "Salida anticipada";
      default:
        return language === "ca" ? "Personalitzada" : "Personalizada";
    }
  };

  const createNewRule = () => {
    const newRule: AlertRule = {
      id: '',
      name: '',
      type: 'late_arrival',
      enabled: true,
      condition: {
        threshold: 15,
        unit: 'minutes',
        comparison: 'greater_than'
      },
      notification: {
        email: true,
        internal: true,
        emailTemplate: '',
        recipients: []
      },
      schedule: {
        immediate: true,
        delay: 0,
        repeat: false,
        repeatInterval: 60
      }
    };
    setSelectedRule(newRule);
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
            {language === "ca" ? "Configuració d'Alertes Automàtiques" : "Configuración de Alertas Automáticas"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "ca" ? 
              "Configura regles d'alertes per notificar automàticament als usuaris sobre esdeveniments importants" :
              "Configura reglas de alertas para notificar automáticamente a los usuarios sobre eventos importantes"
            }
          </p>
        </div>
        <Button onClick={createNewRule} className="bg-gradient-to-r from-rose-400 to-pink-500">
          <Plus className="h-4 w-4 mr-2" />
          {language === "ca" ? "Nova Regla" : "Nueva Regla"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Rules List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === "ca" ? "Regles d'Alerta" : "Reglas de Alerta"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alertRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{language === "ca" ? "No hi ha regles configurades" : "No hay reglas configuradas"}</p>
              </div>
            ) : (
              alertRules.map((rule: AlertRule) => (
                <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getAlertTypeIcon(rule.type)}
                      <span className="font-medium">{rule.name}</span>
                      <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                        {rule.enabled ? 
                          (language === "ca" ? "Activa" : "Activa") : 
                          (language === "ca" ? "Desactivada" : "Desactivada")
                        }
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedRule(rule);
                          setIsEditing(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteRuleMutation.mutate(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>{getAlertTypeName(rule.type)}</p>
                    <p>
                      {language === "ca" ? "Llindar:" : "Umbral:"} {rule.condition.threshold} {rule.condition.unit}
                    </p>
                    <p>
                      {language === "ca" ? "Notificacions:" : "Notificaciones:"}{' '}
                      {rule.notification.email && <Mail className="inline h-3 w-3 mr-1" />}
                      {rule.notification.internal && <Bell className="inline h-3 w-3" />}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Rule Editor */}
        {isEditing && selectedRule && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedRule.id ? 
                  (language === "ca" ? "Editar Regla" : "Editar Regla") :
                  (language === "ca" ? "Nova Regla" : "Nueva Regla")
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{language === "ca" ? "Nom de la regla" : "Nombre de la regla"}</Label>
                <Input
                  value={selectedRule.name}
                  onChange={(e) => setSelectedRule({
                    ...selectedRule,
                    name: e.target.value
                  })}
                  placeholder={language === "ca" ? "Nom descriptiu" : "Nombre descriptivo"}
                />
              </div>

              <div>
                <Label>{language === "ca" ? "Tipus d'alerta" : "Tipo de alerta"}</Label>
                <Select
                  value={selectedRule.type}
                  onValueChange={(value) => setSelectedRule({
                    ...selectedRule,
                    type: value as AlertRule['type']
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="late_arrival">
                      {language === "ca" ? "Arribada tardana" : "Llegada tardía"}
                    </SelectItem>
                    <SelectItem value="absence">
                      {language === "ca" ? "Absència" : "Ausencia"}
                    </SelectItem>
                    <SelectItem value="early_departure">
                      {language === "ca" ? "Sortida anticipada" : "Salida anticipada"}
                    </SelectItem>
                    <SelectItem value="custom">
                      {language === "ca" ? "Personalitzada" : "Personalizada"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === "ca" ? "Llindar" : "Umbral"}</Label>
                  <Input
                    type="number"
                    value={selectedRule.condition.threshold}
                    onChange={(e) => setSelectedRule({
                      ...selectedRule,
                      condition: {
                        ...selectedRule.condition,
                        threshold: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div>
                  <Label>{language === "ca" ? "Unitat" : "Unidad"}</Label>
                  <Select
                    value={selectedRule.condition.unit}
                    onValueChange={(value) => setSelectedRule({
                      ...selectedRule,
                      condition: {
                        ...selectedRule.condition,
                        unit: value as 'minutes' | 'hours' | 'days'
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">
                        {language === "ca" ? "Minuts" : "Minutos"}
                      </SelectItem>
                      <SelectItem value="hours">
                        {language === "ca" ? "Hores" : "Horas"}
                      </SelectItem>
                      <SelectItem value="days">
                        {language === "ca" ? "Dies" : "Días"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>{language === "ca" ? "Notificacions" : "Notificaciones"}</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {language === "ca" ? "Notificació interna" : "Notificación interna"}
                  </span>
                  <Switch
                    checked={selectedRule.notification.internal}
                    onCheckedChange={(checked) => setSelectedRule({
                      ...selectedRule,
                      notification: {
                        ...selectedRule.notification,
                        internal: checked
                      }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {language === "ca" ? "Notificació per email" : "Notificación por email"}
                  </span>
                  <Switch
                    checked={selectedRule.notification.email}
                    onCheckedChange={(checked) => setSelectedRule({
                      ...selectedRule,
                      notification: {
                        ...selectedRule.notification,
                        email: checked
                      }
                    })}
                  />
                </div>
              </div>

              {selectedRule.notification.email && (
                <div>
                  <Label>{language === "ca" ? "Plantilla d'email" : "Plantilla de email"}</Label>
                  <Textarea
                    value={selectedRule.notification.emailTemplate}
                    onChange={(e) => setSelectedRule({
                      ...selectedRule,
                      notification: {
                        ...selectedRule.notification,
                        emailTemplate: e.target.value
                      }
                    })}
                    placeholder={language === "ca" ? 
                      "Plantilla del missatge d'email..." : 
                      "Plantilla del mensaje de email..."
                    }
                  />
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <Label>{language === "ca" ? "Programació" : "Programación"}</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {language === "ca" ? "Notificar immediatament" : "Notificar inmediatamente"}
                  </span>
                  <Switch
                    checked={selectedRule.schedule.immediate}
                    onCheckedChange={(checked) => setSelectedRule({
                      ...selectedRule,
                      schedule: {
                        ...selectedRule.schedule,
                        immediate: checked
                      }
                    })}
                  />
                </div>

                {!selectedRule.schedule.immediate && (
                  <div>
                    <Label>
                      {language === "ca" ? "Retard (minuts)" : "Retraso (minutos)"}
                    </Label>
                    <Input
                      type="number"
                      value={selectedRule.schedule.delay}
                      onChange={(e) => setSelectedRule({
                        ...selectedRule,
                        schedule: {
                          ...selectedRule.schedule,
                          delay: Number(e.target.value)
                        }
                      })}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => saveRuleMutation.mutate(selectedRule)}
                  disabled={saveRuleMutation.isPending}
                  className="bg-gradient-to-r from-rose-400 to-pink-500"
                >
                  {language === "ca" ? "Guardar" : "Guardar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRule(null);
                    setIsEditing(false);
                  }}
                >
                  {language === "ca" ? "Cancel·lar" : "Cancelar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}