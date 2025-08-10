import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  id?: string;
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
    emailTemplate?: string;
    recipients: string[];
  };
  schedule: {
    immediate: boolean;
    delay: number;
    repeat: boolean;
    repeatInterval: number;
  };
}

interface AlertConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutionId: string | null;
  language: string;
}

export default function AlertConfigModal({ isOpen, onClose, institutionId, language }: AlertConfigModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [formData, setFormData] = useState<AlertRule>({
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
  });

  const { data: alertRules = [], isLoading } = useQuery({
    queryKey: ['/api/admin/alert-rules', institutionId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/alert-rules/${institutionId}`);
      if (!response.ok) throw new Error('Failed to fetch alert rules');
      return response.json();
    },
    enabled: isOpen && !!institutionId
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: AlertRule) => {
      return await apiRequest('POST', '/api/admin/alert-rules', {
        ...data,
        institutionId
      });
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Regla creada" : "Regla creada",
        description: language === "ca" ? "La regla d'alerta s'ha creat correctament" : "La regla de alerta se ha creado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/alert-rules', institutionId] });
      setIsCreating(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (language === "ca" ? "Error creant la regla" : "Error creando la regla"),
        variant: "destructive",
      });
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: async (data: AlertRule) => {
      return await apiRequest('PUT', `/api/admin/alert-rules/${data.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Regla actualitzada" : "Regla actualizada",
        description: language === "ca" ? "La regla d'alerta s'ha actualitzat correctament" : "La regla de alerta se ha actualizado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/alert-rules', institutionId] });
      setEditingRule(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (language === "ca" ? "Error actualitzant la regla" : "Error actualizando la regla"),
        variant: "destructive",
      });
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return await apiRequest('DELETE', `/api/admin/alert-rules/${ruleId}`);
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Regla eliminada" : "Regla eliminada",
        description: language === "ca" ? "La regla d'alerta s'ha eliminat correctament" : "La regla de alerta se ha eliminado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/alert-rules', institutionId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (language === "ca" ? "Error eliminant la regla" : "Error eliminando la regla"),
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
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
    });
  };

  const handleSubmit = () => {
    if (editingRule) {
      updateRuleMutation.mutate({ ...formData, id: editingRule.id });
    } else {
      createRuleMutation.mutate(formData);
    }
  };

  const handleEdit = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormData(rule);
    setIsCreating(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'late_arrival': return <Clock className="h-4 w-4" />;
      case 'absence': return <UserX className="h-4 w-4" />;
      case 'early_departure': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      ca: {
        late_arrival: 'Retard',
        absence: 'Absència',
        early_departure: 'Sortida anticipada',
        custom: 'Personalitzat'
      },
      es: {
        late_arrival: 'Retraso',
        absence: 'Ausencia',
        early_departure: 'Salida anticipada',
        custom: 'Personalizado'
      }
    };
    return labels[language as keyof typeof labels]?.[type as keyof typeof labels.ca] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950">
        <DialogHeader>
          <DialogTitle>
            {language === "ca" ? "Configuració d'Alertes Automàtiques" : "Configuración de Alertas Automáticas"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Rules */}
          {!isCreating && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    {language === "ca" ? "Regles Actives" : "Reglas Activas"}
                  </CardTitle>
                  <Button onClick={() => setIsCreating(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    {language === "ca" ? "Afegir Regla" : "Añadir Regla"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : alertRules.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {language === "ca" ? "No hi ha regles configurades" : "No hay reglas configuradas"}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {alertRules.map((rule: AlertRule) => (
                      <div key={rule.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getTypeIcon(rule.type)}
                            <div>
                              <h4 className="font-medium">{rule.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {getTypeLabel(rule.type)} - {rule.condition.threshold} {rule.condition.unit}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={rule.enabled ? "default" : "secondary"}>
                              {rule.enabled ? (language === "ca" ? "Activa" : "Activa") : (language === "ca" ? "Inactiva" : "Inactiva")}
                            </Badge>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => rule.id && deleteRuleMutation.mutate(rule.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Create/Edit Form */}
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingRule ? 
                    (language === "ca" ? "Editar Regla" : "Editar Regla") : 
                    (language === "ca" ? "Nova Regla d'Alerta" : "Nueva Regla de Alerta")
                  }
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule-name">
                      {language === "ca" ? "Nom de la regla" : "Nombre de la regla"}
                    </Label>
                    <Input
                      id="rule-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={language === "ca" ? "Retard superior a 15 minuts" : "Retraso superior a 15 minutos"}
                    />
                  </div>

                  <div>
                    <Label htmlFor="rule-type">
                      {language === "ca" ? "Tipus" : "Tipo"}
                    </Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="late_arrival">{getTypeLabel('late_arrival')}</SelectItem>
                        <SelectItem value="absence">{getTypeLabel('absence')}</SelectItem>
                        <SelectItem value="early_departure">{getTypeLabel('early_departure')}</SelectItem>
                        <SelectItem value="custom">{getTypeLabel('custom')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="threshold">
                      {language === "ca" ? "Llindar" : "Umbral"}
                    </Label>
                    <Input
                      id="threshold"
                      type="number"
                      value={formData.condition.threshold}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        condition: { 
                          ...formData.condition, 
                          threshold: parseInt(e.target.value) || 0 
                        } 
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit">
                      {language === "ca" ? "Unitat" : "Unidad"}
                    </Label>
                    <Select 
                      value={formData.condition.unit} 
                      onValueChange={(value: any) => setFormData({ 
                        ...formData, 
                        condition: { 
                          ...formData.condition, 
                          unit: value 
                        } 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">{language === "ca" ? "Minuts" : "Minutos"}</SelectItem>
                        <SelectItem value="hours">{language === "ca" ? "Hores" : "Horas"}</SelectItem>
                        <SelectItem value="days">{language === "ca" ? "Dies" : "Días"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="comparison">
                      {language === "ca" ? "Comparació" : "Comparación"}
                    </Label>
                    <Select 
                      value={formData.condition.comparison} 
                      onValueChange={(value: any) => setFormData({ 
                        ...formData, 
                        condition: { 
                          ...formData.condition, 
                          comparison: value 
                        } 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="greater_than">{language === "ca" ? "Superior a" : "Superior a"}</SelectItem>
                        <SelectItem value="less_than">{language === "ca" ? "Inferior a" : "Inferior a"}</SelectItem>
                        <SelectItem value="equals">{language === "ca" ? "Igual a" : "Igual a"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="email-template">
                    {language === "ca" ? "Plantilla d'email" : "Plantilla de email"}
                  </Label>
                  <Textarea
                    id="email-template"
                    value={formData.notification.emailTemplate}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      notification: { 
                        ...formData.notification, 
                        emailTemplate: e.target.value 
                      } 
                    })}
                    placeholder={language === "ca" ? 
                      "Estimat/da {employeeName}, has arribat {delayMinutes} minuts tard avui..." : 
                      "Estimado/a {employeeName}, has llegado {delayMinutes} minutos tarde hoy..."
                    }
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.enabled}
                      onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
                    />
                    <Label>{language === "ca" ? "Activa" : "Activa"}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.notification.email}
                      onCheckedChange={(email) => setFormData({ 
                        ...formData, 
                        notification: { 
                          ...formData.notification, 
                          email 
                        } 
                      })}
                    />
                    <Label>{language === "ca" ? "Enviar email" : "Enviar email"}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.schedule.immediate}
                      onCheckedChange={(immediate) => setFormData({ 
                        ...formData, 
                        schedule: { 
                          ...formData.schedule, 
                          immediate 
                        } 
                      })}
                    />
                    <Label>{language === "ca" ? "Immediat" : "Inmediato"}</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreating(false);
                      setEditingRule(null);
                      resetForm();
                    }}
                  >
                    {language === "ca" ? "Cancel·lar" : "Cancelar"}
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                  >
                    {editingRule ? 
                      (language === "ca" ? "Actualitzar" : "Actualizar") : 
                      (language === "ca" ? "Crear" : "Crear")
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}