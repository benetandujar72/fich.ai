import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Send, User, Clock, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RiskAssessment {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  delayMinutes: number;
  absenceDays: number;
  lastCalculated: string;
  notes?: string;
}

export default function RiskAssessmentDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<RiskAssessment | null>(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Fetch risk assessments
  const { data: riskAssessments, isLoading } = useQuery({
    queryKey: [`/api/admin/risk-assessments/${user?.institutionId}`],
    enabled: !!user?.institutionId,
  });

  // Send manual notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { employeeId: string; message: string }) => {
      return await apiRequest("POST", "/api/admin/send-notification", data);
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Notificació enviada" : "Notificación enviada",
        description: language === "ca" ? "La notificació s'ha enviat correctament" : "La notificación se ha enviado correctamente",
      });
      setIsNotificationOpen(false);
      setNotificationMessage("");
      setSelectedEmployee(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (language === "ca" ? "Error enviant la notificació" : "Error enviando la notificación"),
        variant: "destructive",
      });
    },
  });

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelText = (level: string) => {
    const texts = {
      ca: { low: 'Baix', medium: 'Mitjà', high: 'Alt', critical: 'Crític' },
      es: { low: 'Bajo', medium: 'Medio', high: 'Alto', critical: 'Crítico' }
    };
    return texts[language as 'ca' | 'es'][level as keyof typeof texts.ca] || level;
  };

  const getEmpatheticTemplate = (level: string) => {
    const templates = {
      ca: {
        medium: `Hola {{name}},\n\nHem notat que últimament has tingut alguns retards o absències. Volem recordar-te la importància de la puntualitat per al bon funcionament del centre.\n\nSi tens alguna dificultat o necessites suport, no dubtis a contactar amb nosaltres. Estem aquí per ajudar-te.\n\nGràcies per la teva comprensió.`,
        high: `Estimat/da {{name}},\n\nEns hem adonat que els teus registres d'assistència mostren algunes irregularitats que ens preocupen. Volem treballar amb tu per trobar una solució.\n\nT'agraïríem que ens expliquis si hi ha alguna circumstància que estigui afectant la teva assistència. El nostre objectiu és donar-te el suport que necessitis.\n\nEsperem la teva resposta per poder ajudar-te.`,
        critical: `{{name}},\n\nLes dades d'assistència mostren una situació que requereix la nostra atenció immediata. És important que ens reunim per parlar sobre aquesta qüestió.\n\nContacta amb direcció el més aviat possible per concertar una reunió. Volem entendre la situació i trobar la millor manera d'avançar junts.\n\nGràcies per la teva col·laboració.`
      },
      es: {
        medium: `Hola {{name}},\n\nHemos notado que últimamente has tenido algunos retrasos o ausencias. Queremos recordarte la importancia de la puntualidad para el buen funcionamiento del centro.\n\nSi tienes alguna dificultad o necesitas apoyo, no dudes en contactar con nosotros. Estamos aquí para ayudarte.\n\nGracias por tu comprensión.`,
        high: `Estimado/a {{name}},\n\nNos hemos dado cuenta de que tus registros de asistencia muestran algunas irregularidades que nos preocupan. Queremos trabajar contigo para encontrar una solución.\n\nTe agradeceríamos que nos expliques si hay alguna circunstancia que esté afectando tu asistencia. Nuestro objetivo es darte el apoyo que necesites.\n\nEsperamos tu respuesta para poder ayudarte.`,
        critical: `{{name}},\n\nLos datos de asistencia muestran una situación que requiere nuestra atención inmediata. Es importante que nos reunamos para hablar sobre esta cuestión.\n\nContacta con dirección lo antes posible para concertar una reunión. Queremos entender la situación y encontrar la mejor manera de avanzar juntos.\n\nGracias por tu colaboración.`
      }
    };
    
    const template = templates[language as 'ca' | 'es'][level as keyof typeof templates.ca];
    return template || '';
  };

  const handleSendNotification = () => {
    if (!selectedEmployee || !notificationMessage.trim()) return;
    
    sendNotificationMutation.mutate({
      employeeId: selectedEmployee.employeeId,
      message: notificationMessage
    });
  };

  const handleUseTemplate = (employee: RiskAssessment) => {
    const template = getEmpatheticTemplate(employee.riskLevel);
    const personalizedMessage = template.replace(/\{\{name\}\}/g, employee.employeeName.split(' ')[0]);
    setNotificationMessage(personalizedMessage);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {language === "ca" ? "Avaluació de Riscos" : "Evaluación de Riesgos"}
          </h2>
          <p className="text-muted-foreground">
            {language === "ca" 
              ? "Monitoratge proactiu del personal amb nivells de risc d'assistència" 
              : "Monitoreo proactivo del personal con niveles de riesgo de asistencia"}
          </p>
        </div>
      </div>

      {/* Risk Level Summary */}
      <div className="grid grid-cols-4 gap-4">
        {['low', 'medium', 'high', 'critical'].map(level => {
          const count = Array.isArray(riskAssessments) ? riskAssessments.filter((r: RiskAssessment) => r.riskLevel === level).length : 0;
          return (
            <Card key={level}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Badge className={getRiskLevelColor(level)}>
                    {getRiskLevelText(level)}
                  </Badge>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Risk Assessment List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {language === "ca" ? "Personal per Nivell de Risc" : "Personal por Nivel de Riesgo"}
          </CardTitle>
          <CardDescription>
            {language === "ca" 
              ? "Llista ordenada per nivell de risc d'assistència" 
              : "Lista ordenada por nivel de riesgo de asistencia"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.isArray(riskAssessments) && riskAssessments.map((assessment: RiskAssessment) => (
              <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge className={getRiskLevelColor(assessment.riskLevel)}>
                    {getRiskLevelText(assessment.riskLevel)}
                  </Badge>
                  <div>
                    <h3 className="font-medium">{assessment.employeeName}</h3>
                    <p className="text-sm text-muted-foreground">{assessment.employeeEmail}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="flex items-center gap-1 text-orange-600">
                      <Clock className="h-4 w-4" />
                      {assessment.delayMinutes} min {language === "ca" ? "retard" : "retraso"}
                    </div>
                    <div className="flex items-center gap-1 text-red-600">
                      <Calendar className="h-4 w-4" />
                      {assessment.absenceDays} {language === "ca" ? "dies absència" : "días ausencia"}
                    </div>
                  </div>
                  
                  <Dialog open={isNotificationOpen && selectedEmployee?.id === assessment.id} 
                          onOpenChange={(open) => {
                            setIsNotificationOpen(open);
                            if (open) {
                              setSelectedEmployee(assessment);
                              handleUseTemplate(assessment);
                            } else {
                              setSelectedEmployee(null);
                              setNotificationMessage("");
                            }
                          }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        {language === "ca" ? "Notificar" : "Notificar"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {language === "ca" ? "Enviar Notificació" : "Enviar Notificación"}
                        </DialogTitle>
                        <DialogDescription>
                          {language === "ca" 
                            ? `Enviant notificació a ${assessment.employeeName}` 
                            : `Enviando notificación a ${assessment.employeeName}`}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            {language === "ca" 
                              ? "Plantilla empàtica precarregada basada en el nivell de risc" 
                              : "Plantilla empática precargada basada en el nivel de riesgo"}
                          </AlertDescription>
                        </Alert>
                        
                        <Textarea
                          placeholder={language === "ca" ? "Missatge personalitzat..." : "Mensaje personalizado..."}
                          value={notificationMessage}
                          onChange={(e) => setNotificationMessage(e.target.value)}
                          rows={8}
                        />
                        
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsNotificationOpen(false)}>
                            {language === "ca" ? "Cancel·lar" : "Cancelar"}
                          </Button>
                          <Button 
                            onClick={handleSendNotification}
                            disabled={sendNotificationMutation.isPending || !notificationMessage.trim()}
                          >
                            {sendNotificationMutation.isPending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            {language === "ca" ? "Enviar" : "Enviar"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}