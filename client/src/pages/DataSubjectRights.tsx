import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserCheck, Download, Edit, Trash2, ShieldOff, RefreshCw, Mail } from "lucide-react";

export default function DataSubjectRights() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [requestType, setRequestType] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email || "");

  const submitRequestMutation = useMutation({
    mutationFn: async (requestData: any) => {
      return await apiRequest("POST", "/api/data-subject-rights", requestData);
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Èxit" : "Éxito",
        description: language === "ca" 
          ? "Sol·licitud enviada correctament. Rebràs una resposta en un màxim de 30 dies."
          : "Solicitud enviada correctamente. Recibirás una respuesta en un máximo de 30 días.",
      });
      setRequestType("");
      setDescription("");
    },
    onError: (error: any) => {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: error.message || (language === "ca" ? "Error enviant la sol·licitud" : "Error enviando la solicitud"),
        variant: "destructive",
      });
    },
  });

  const downloadMyDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("GET", "/api/data-subject-rights/my-data");
    },
    onSuccess: (data) => {
      // Create and download JSON file
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: language === "ca" ? "Èxit" : "Éxito",
        description: language === "ca" ? "Dades descarregades correctament" : "Datos descargados correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: error.message || (language === "ca" ? "Error descarregant les dades" : "Error descargando los datos"),
        variant: "destructive",
      });
    },
  });

  const handleSubmitRequest = () => {
    if (!requestType || !description) {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: language === "ca" ? "Completa tots els camps obligatoris" : "Completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    submitRequestMutation.mutate({
      type: requestType,
      description,
      contactEmail,
      userId: user?.id,
    });
  };

  const rightOptions = [
    {
      value: "access",
      label: language === "ca" ? "Accés a les meves dades" : "Acceso a mis datos",
      icon: UserCheck,
      description: language === "ca" 
        ? "Sol·licitar informació sobre les dades que es tracten"
        : "Solicitar información sobre los datos que se tratan"
    },
    {
      value: "rectification",
      label: language === "ca" ? "Rectificació de dades" : "Rectificación de datos",
      icon: Edit,
      description: language === "ca" 
        ? "Corregir dades incorrectes o incompletes"
        : "Corregir datos incorrectos o incompletos"
    },
    {
      value: "erasure",
      label: language === "ca" ? "Supressió de dades" : "Supresión de datos", 
      icon: Trash2,
      description: language === "ca" 
        ? "Sol·licitar l'eliminació de les meves dades"
        : "Solicitar la eliminación de mis datos"
    },
    {
      value: "restriction",
      label: language === "ca" ? "Limitació del tractament" : "Limitación del tratamiento",
      icon: ShieldOff,
      description: language === "ca" 
        ? "Limitar l'ús de les meves dades"
        : "Limitar el uso de mis datos"
    },
    {
      value: "portability",
      label: language === "ca" ? "Portabilitat de dades" : "Portabilidad de datos",
      icon: RefreshCw,
      description: language === "ca" 
        ? "Rebre les dades en format estructurat"
        : "Recibir los datos en formato estructurado"
    },
    {
      value: "objection",
      label: language === "ca" ? "Oposició al tractament" : "Oposición al tratamiento",
      icon: ShieldOff,
      description: language === "ca" 
        ? "Oposar-se al tractament de les meves dades"
        : "Oponerse al tratamiento de mis datos"
    }
  ];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">
            {language === "ca" ? "Exercici de Drets RGPD" : "Ejercicio de Derechos RGPD"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ca" 
              ? "Exerceix els teus drets sobre les teves dades personals"
              : "Ejerce tus derechos sobre tus datos personales"}
          </p>
        </div>

        {/* Descàrrega ràpida de dades */}
        <Card className="mb-6" data-testid="quick-download-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="mr-2 h-5 w-5 text-blue-600" />
              {language === "ca" ? "Descàrrega ràpida de dades" : "Descarga rápida de datos"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="font-medium text-blue-800">
                  {language === "ca" ? "Descarrega totes les teves dades" : "Descarga todos tus datos"}
                </p>
                <p className="text-sm text-blue-700">
                  {language === "ca" 
                    ? "Obté una còpia de totes les dades que tenim sobre tu en format JSON"
                    : "Obtén una copia de todos los datos que tenemos sobre ti en formato JSON"}
                </p>
              </div>
              <Button
                onClick={() => downloadMyDataMutation.mutate()}
                disabled={downloadMyDataMutation.isPending}
                data-testid="download-my-data-button"
              >
                <Download className="mr-2 h-4 w-4" />
                {downloadMyDataMutation.isPending 
                  ? (language === "ca" ? "Descarregant..." : "Descargando...")
                  : (language === "ca" ? "Descarregar" : "Descargar")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Formulari de sol·licitud de drets */}
        <Card data-testid="rights-request-form">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5 text-green-600" />
              {language === "ca" ? "Sol·licitud formal de drets" : "Solicitud formal de derechos"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label htmlFor="request-type">
                  {language === "ca" ? "Tipus de dret que vols exercir" : "Tipo de derecho que quieres ejercer"}
                </Label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger id="request-type" data-testid="request-type-select">
                    <SelectValue placeholder={language === "ca" ? "Selecciona un dret" : "Selecciona un derecho"} />
                  </SelectTrigger>
                  <SelectContent>
                    {rightOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {requestType && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  {(() => {
                    const selectedOption = rightOptions.find(opt => opt.value === requestType);
                    const IconComponent = selectedOption?.icon || UserCheck;
                    return (
                      <div className="flex items-start">
                        <IconComponent className="mr-3 h-5 w-5 text-gray-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-800 mb-1">{selectedOption?.label}</p>
                          <p className="text-sm text-gray-600">{selectedOption?.description}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <Label htmlFor="contact-email">
                  {language === "ca" ? "Correu electrònic de contacte" : "Correo electrónico de contacto"}
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  data-testid="contact-email-input"
                />
              </div>

              <div>
                <Label htmlFor="description">
                  {language === "ca" ? "Descripció detallada" : "Descripción detallada"}
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === "ca" 
                    ? "Explica en detall la teva sol·licitud..."
                    : "Explica en detalle tu solicitud..."}
                  rows={4}
                  data-testid="description-textarea"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>{language === "ca" ? "Temps de resposta:" : "Tiempo de respuesta:"}</strong>
                  {" "}
                  {language === "ca" 
                    ? "Respondrem a la teva sol·licitud en un màxim de 30 dies naturals."
                    : "Responderemos a tu solicitud en un máximo de 30 días naturales."}
                </p>
              </div>

              <Button
                onClick={handleSubmitRequest}
                disabled={submitRequestMutation.isPending || !requestType || !description}
                className="w-full"
                data-testid="submit-request-button"
              >
                <Mail className="mr-2 h-4 w-4" />
                {submitRequestMutation.isPending 
                  ? (language === "ca" ? "Enviant..." : "Enviando...")
                  : (language === "ca" ? "Enviar sol·licitud" : "Enviar solicitud")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informació legal */}
        <Card className="mt-6" data-testid="legal-info-card">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>{language === "ca" ? "Base legal:" : "Base legal:"}</strong>
                {" "}
                {language === "ca" 
                  ? "Aquesta sol·licitud es processa segons els articles 12-22 del RGPD."
                  : "Esta solicitud se procesa según los artículos 12-22 del RGPD."}
              </p>
              <p>
                <strong>{language === "ca" ? "Autoritats de control:" : "Autoridades de control:"}</strong>
                {" "}
                {language === "ca" 
                  ? "Pots presentar una reclamació davant l'APDCAT o l'AEPD."
                  : "Puedes presentar una reclamación ante la APDCAT o la AEPD."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}