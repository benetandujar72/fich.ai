import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Server, User, Lock, Eye, EyeOff } from "lucide-react";

interface EmailSettingsFormProps {
  institutionId: string | null | undefined;
  language: string;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  senderEmail: string;
  senderName: string;
}

export default function EmailSettingsForm({ institutionId, language }: EmailSettingsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    senderEmail: "",
    senderName: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const { data: settings, isLoading } = useQuery<EmailSettings>({
    queryKey: ["/api/admin/smtp-config", institutionId || "null"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/smtp-config/${institutionId || "null"}`);
      if (!response.ok) {
        throw new Error('Failed to fetch SMTP settings');
      }
      const data = await response.json();
      if (!data) return null;
      
      // Transform the SMTP response to EmailSettings format
      return {
        smtpHost: data.host || "",
        smtpPort: data.port || 587,
        smtpUser: data.username || "",
        smtpPassword: "", // Don't return password for security
        senderEmail: data.fromEmail || "",
        senderName: data.fromName || "",
      };
    },
  });

  useEffect(() => {
    if (settings) {
      setEmailSettings({
        smtpHost: settings.smtpHost || "",
        smtpPort: settings.smtpPort || 587,
        smtpUser: settings.smtpUser || "",
        smtpPassword: settings.smtpPassword || "",
        senderEmail: settings.senderEmail || "",
        senderName: settings.senderName || "",
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: EmailSettings) => {
      // Transform EmailSettings to SMTP format
      const smtpData = {
        host: data.smtpHost,
        port: data.smtpPort,
        username: data.smtpUser,
        password: data.smtpPassword,
        isSecure: true, // Default to secure connection
        fromEmail: data.senderEmail,
        fromName: data.senderName,
        isActive: true
      };
      return await apiRequest("POST", "/api/admin/smtp-config", smtpData);
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Èxit" : "Éxito",
        description: language === "ca" ? "Configuració SMTP guardada" : "Configuración SMTP guardada",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/smtp-config", institutionId || "null"] });
    },
    onError: (error: any) => {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: error.message || (language === "ca" ? "Error guardant la configuració" : "Error guardando la configuración"),
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/email-settings/${institutionId || "null"}/test`, emailSettings);
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Email de prova enviat" : "Email de prueba enviado",
        description: language === "ca" ? "Comprova la safata d'entrada" : "Comprueba la bandeja de entrada",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: error.message || (language === "ca" ? "Error enviant email de prova" : "Error enviando email de prueba"),
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof EmailSettings, value: string | number) => {
    setEmailSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(emailSettings);
  };

  const handleTestEmail = () => {
    testEmailMutation.mutate();
  };

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded"></div>;
  }

  return (
    <div className="space-y-6">
      {/* SMTP Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>
              {language === "ca" ? "Configuració del Servidor SMTP" : "Configuración del Servidor SMTP"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtp-host">
                {language === "ca" ? "Servidor SMTP" : "Servidor SMTP"}
              </Label>
              <Input
                id="smtp-host"
                placeholder="smtp.gmail.com"
                value={emailSettings.smtpHost}
                onChange={(e) => handleInputChange("smtpHost", e.target.value)}
                data-testid="smtp-host-input"
              />
            </div>
            <div>
              <Label htmlFor="smtp-port">
                {language === "ca" ? "Port" : "Puerto"}
              </Label>
              <Input
                id="smtp-port"
                type="number"
                placeholder="587"
                value={emailSettings.smtpPort}
                onChange={(e) => handleInputChange("smtpPort", parseInt(e.target.value) || 587)}
                data-testid="smtp-port-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtp-user">
                {language === "ca" ? "Usuari SMTP" : "Usuario SMTP"}
              </Label>
              <Input
                id="smtp-user"
                placeholder="example@gmail.com"
                value={emailSettings.smtpUser}
                onChange={(e) => handleInputChange("smtpUser", e.target.value)}
                data-testid="smtp-user-input"
              />
            </div>
            <div>
              <Label htmlFor="smtp-password">
                {language === "ca" ? "Contrasenya SMTP" : "Contraseña SMTP"}
              </Label>
              <div className="relative">
                <Input
                  id="smtp-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={emailSettings.smtpPassword}
                  onChange={(e) => handleInputChange("smtpPassword", e.target.value)}
                  data-testid="smtp-password-input"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sender Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>
              {language === "ca" ? "Configuració del Remitent" : "Configuración del Remitente"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sender-email">
                {language === "ca" ? "Email del remitent" : "Email del remitente"}
              </Label>
              <Input
                id="sender-email"
                type="email"
                placeholder="noreply@centre.edu"
                value={emailSettings.senderEmail}
                onChange={(e) => handleInputChange("senderEmail", e.target.value)}
                data-testid="sender-email-input"
              />
            </div>
            <div>
              <Label htmlFor="sender-name">
                {language === "ca" ? "Nom del remitent" : "Nombre del remitente"}
              </Label>
              <Input
                id="sender-name"
                placeholder="Centre Educatiu"
                value={emailSettings.senderName}
                onChange={(e) => handleInputChange("senderName", e.target.value)}
                data-testid="sender-name-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">
          {language === "ca" ? "Configuració recomanada per Gmail:" : "Configuración recomendada para Gmail:"}
        </h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <strong>Servidor:</strong> smtp.gmail.com</li>
          <li>• <strong>Port:</strong> 587</li>
          <li>• <strong>{language === "ca" ? "Contrasenya d'aplicació" : "Contraseña de aplicación"}:</strong> {language === "ca" ? "Utilitzar contrasenya d'aplicació, no la contrasenya normal" : "Usar contraseña de aplicación, no la contraseña normal"}</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="save-email-settings-button"
        >
          {updateMutation.isPending
            ? (language === "ca" ? "Guardant..." : "Guardando...")
            : (language === "ca" ? "Guardar Configuració" : "Guardar Configuración")}
        </Button>
        
        <Button
          onClick={handleTestEmail}
          disabled={testEmailMutation.isPending || !emailSettings.senderEmail}
          variant="outline"
          className="flex items-center space-x-2"
          data-testid="test-email-button"
        >
          <Mail className="h-4 w-4" />
          <span>
            {testEmailMutation.isPending
              ? (language === "ca" ? "Enviant..." : "Enviando...")
              : (language === "ca" ? "Provar Email" : "Probar Email")}
          </span>
        </Button>
      </div>
    </div>
  );
}