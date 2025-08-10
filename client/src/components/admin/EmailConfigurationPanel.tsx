import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Settings, FileText, Send, TestTube, Check, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const smtpConfigSchema = z.object({
  host: z.string().min(1, "Host es requerido"),
  port: z.number().min(1).max(65535),
  username: z.string().min(1, "Usuario es requerido"),
  password: z.string().min(1, "Contraseña es requerida"),
  isSecure: z.boolean(),
  fromEmail: z.string().email("Email inválido"),
  fromName: z.string().min(1, "Nombre es requerido"),
  isActive: z.boolean(),
});

const emailTemplateSchema = z.object({
  name: z.string().min(1, "Nombre es requerido"),
  subject: z.string().min(1, "Asunto es requerido"),
  content: z.string().min(1, "Contenido es requerido"),
  templateType: z.enum(['alert', 'notification', 'reminder']),
  isActive: z.boolean(),
});

interface SMTPConfig {
  id?: string;
  host: string;
  port: number;
  username: string;
  password: string;
  isSecure: boolean;
  fromEmail: string;
  fromName: string;
  isActive: boolean;
}

interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  content: string;
  templateType: 'alert' | 'notification' | 'reminder';
  isActive: boolean;
}

export default function EmailConfigurationPanel() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testEmail, setTestEmail] = useState("");
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  // Fetch SMTP configuration
  const { data: smtpConfig, isLoading: smtpLoading } = useQuery<SMTPConfig>({
    queryKey: ['/api/admin/smtp-config', user?.institutionId],
    enabled: !!user?.institutionId,
  });

  // SMTP Configuration form
  const smtpForm = useForm<SMTPConfig>({
    resolver: zodResolver(smtpConfigSchema),
    defaultValues: {
      host: "",
      port: 587,
      username: "",
      password: "",
      isSecure: true,
      fromEmail: "",
      fromName: "",
      isActive: true,
    },
  });

  // Email Template form
  const templateForm = useForm<EmailTemplate>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: "",
      subject: "",
      content: "",
      templateType: "alert",
      isActive: true,
    },
  });

  // Fetch email templates
  const { data: emailTemplates, isLoading: loadingTemplates } = useQuery({
    queryKey: ['/api/admin/email-templates', user?.institutionId],
    enabled: !!user?.institutionId,
  });

  // Save SMTP configuration mutation
  const saveSMTPMutation = useMutation({
    mutationFn: async (data: SMTPConfig) => {
      return await apiRequest("POST", "/api/admin/smtp-config", data);
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Configuració guardada" : "Configuración guardada",
        description: language === "ca" ? "La configuració SMTP s'ha guardat correctament" : "La configuración SMTP se ha guardado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/smtp-config', user?.institutionId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (language === "ca" ? "Error guardant la configuració" : "Error guardando la configuración"),
        variant: "destructive",
      });
    },
  });

  // Save email template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: EmailTemplate) => {
      const endpoint = selectedTemplate 
        ? `/api/admin/email-templates/${selectedTemplate.id}`
        : "/api/admin/email-templates";
      const method = selectedTemplate ? "PUT" : "POST";
      return await apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Plantilla guardada" : "Plantilla guardada",
        description: language === "ca" ? "La plantilla s'ha guardat correctament" : "La plantilla se ha guardado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-templates', user?.institutionId] });
      setIsTemplateDialogOpen(false);
      setSelectedTemplate(null);
      templateForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (language === "ca" ? "Error guardant la plantilla" : "Error guardando la plantilla"),
        variant: "destructive",
      });
    },
  });

  // Effect to update form when SMTP config is loaded
  React.useEffect(() => {
    if (smtpConfig && !smtpLoading) {
      smtpForm.reset({
        host: smtpConfig.host || "",
        port: smtpConfig.port || 587,
        username: smtpConfig.username || "",
        password: "", // Don't populate password for security
        isSecure: smtpConfig.isSecure ?? true,
        fromEmail: smtpConfig.fromEmail || "",
        fromName: smtpConfig.fromName || "",
        isActive: smtpConfig.isActive ?? true,
      });
    }
  }, [smtpConfig, smtpLoading, smtpForm]);

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/admin/test-email", { email });
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Email de prova enviat" : "Email de prueba enviado",
        description: language === "ca" ? "Revisa la teva bústia d'entrada" : "Revisa tu bandeja de entrada",
      });
      setIsTestDialogOpen(false);
      setTestEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (language === "ca" ? "Error enviant email de prova" : "Error enviando email de prueba"),
        variant: "destructive",
      });
    },
  });

  const onSaveSMTP = (data: SMTPConfig) => {
    // If password is empty and we have existing config, keep the existing password
    const submitData = {
      ...data,
      password: data.password || (smtpConfig?.password ? "***KEEP_EXISTING***" : "")
    };
    saveSMTPMutation.mutate(submitData);
  };

  const onSaveTemplate = (data: EmailTemplate) => {
    saveTemplateMutation.mutate(data);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    templateForm.reset(template);
    setIsTemplateDialogOpen(true);
  };

  const getTemplateTypeText = (type: string) => {
    const types = {
      ca: { alert: 'Alerta', notification: 'Notificació', reminder: 'Recordatori' },
      es: { alert: 'Alerta', notification: 'Notificación', reminder: 'Recordatorio' }
    };
    return types[language as 'ca' | 'es']?.[type as keyof typeof types.ca] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {language === "ca" ? "Configuració d'Email" : "Configuración de Email"}
          </h2>
          <p className="text-muted-foreground">
            {language === "ca" 
              ? "Gestiona la configuració SMTP i plantilles d'email del sistema" 
              : "Gestiona la configuración SMTP y plantillas de email del sistema"}
          </p>
        </div>
        <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <TestTube className="h-4 w-4 mr-2" />
              {language === "ca" ? "Provar Email" : "Probar Email"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === "ca" ? "Enviar Email de Prova" : "Enviar Email de Prueba"}
              </DialogTitle>
              <DialogDescription>
                {language === "ca" 
                  ? "Envia un email de prova per verificar la configuració SMTP" 
                  : "Envía un email de prueba para verificar la configuración SMTP"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder={language === "ca" ? "Adreça de correu" : "Dirección de correo"}
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                type="email"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
                  {language === "ca" ? "Cancel·lar" : "Cancelar"}
                </Button>
                <Button 
                  onClick={() => testEmailMutation.mutate(testEmail)}
                  disabled={testEmailMutation.isPending || !testEmail}
                >
                  {testEmailMutation.isPending ? (
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

      <Tabs defaultValue="smtp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="smtp">
            <Settings className="h-4 w-4 mr-2" />
            {language === "ca" ? "Configuració SMTP" : "Configuración SMTP"}
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            {language === "ca" ? "Plantilles" : "Plantillas"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {language === "ca" ? "Configuració del Servidor SMTP" : "Configuración del Servidor SMTP"}
              </CardTitle>
              <CardDescription>
                {language === "ca" 
                  ? "Configura el servidor d'email per enviar notificacions automàtiques" 
                  : "Configura el servidor de email para enviar notificaciones automáticas"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...smtpForm}>
                <form onSubmit={smtpForm.handleSubmit(onSaveSMTP)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={smtpForm.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host SMTP</FormLabel>
                          <FormControl>
                            <Input placeholder="smtp.gmail.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpForm.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="587" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={smtpForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === "ca" ? "Usuari" : "Usuario"}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="admin@centre.edu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === "ca" ? "Contrasenya" : "Contraseña"}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder={smtpConfig ? "Deixa buit per mantenir l'actual" : "Contrasenya SMTP"} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={smtpForm.control}
                      name="fromEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email remitent</FormLabel>
                          <FormControl>
                            <Input placeholder="noreply@centre.edu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpForm.control}
                      name="fromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom remitent</FormLabel>
                          <FormControl>
                            <Input placeholder="Sistema EduPresència" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <FormField
                      control={smtpForm.control}
                      name="isSecure"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel>
                            {language === "ca" ? "Connexió segura (TLS)" : "Conexión segura (TLS)"}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel>
                            {language === "ca" ? "Configuració activa" : "Configuración activa"}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={saveSMTPMutation.isPending}>
                    {saveSMTPMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {language === "ca" ? "Guardar Configuració" : "Guardar Configuración"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {language === "ca" ? "Plantilles d'Email" : "Plantillas de Email"}
                </div>
                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setSelectedTemplate(null); templateForm.reset(); }}>
                      {language === "ca" ? "Nova Plantilla" : "Nueva Plantilla"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedTemplate 
                          ? (language === "ca" ? "Editar Plantilla" : "Editar Plantilla")
                          : (language === "ca" ? "Nova Plantilla" : "Nueva Plantilla")
                        }
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...templateForm}>
                      <form onSubmit={templateForm.handleSubmit(onSaveTemplate)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={templateForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nom de la plantilla" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={templateForm.control}
                            name="templateType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tipus</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="alert">
                                      {getTemplateTypeText("alert")}
                                    </SelectItem>
                                    <SelectItem value="notification">
                                      {getTemplateTypeText("notification")}
                                    </SelectItem>
                                    <SelectItem value="reminder">
                                      {getTemplateTypeText("reminder")}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={templateForm.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assumpte</FormLabel>
                              <FormControl>
                                <Input placeholder="Assumpte de l'email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={templateForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contingut</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Contingut de l'email..." 
                                  rows={8} 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                {language === "ca" 
                                  ? "Pots usar {{name}}, {{email}}, {{date}} com a variables" 
                                  : "Puedes usar {{name}}, {{email}}, {{date}} como variables"}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={templateForm.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel>
                                {language === "ca" ? "Plantilla activa" : "Plantilla activa"}
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                            {language === "ca" ? "Cancel·lar" : "Cancelar"}
                          </Button>
                          <Button type="submit" disabled={saveTemplateMutation.isPending}>
                            {saveTemplateMutation.isPending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            {language === "ca" ? "Guardar" : "Guardar"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(emailTemplates) && emailTemplates.map((template: EmailTemplate) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.subject}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {getTemplateTypeText(template.templateType)}
                        </Badge>
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive 
                            ? (language === "ca" ? "Activa" : "Activa")
                            : (language === "ca" ? "Inactiva" : "Inactiva")
                          }
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => handleEditTemplate(template)}>
                      {language === "ca" ? "Editar" : "Editar"}
                    </Button>
                  </div>
                ))}
                
                {Array.isArray(emailTemplates) && emailTemplates.length === 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {language === "ca" 
                        ? "No hi ha plantilles configurades. Crea la primera plantilla per començar." 
                        : "No hay plantillas configuradas. Crea la primera plantilla para comenzar."}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}