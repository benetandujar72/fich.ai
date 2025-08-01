import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { t } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Info, 
  Shield, 
  UserPlus,
  Edit,
  Trash2,
  Save,
  Users,
  Mail
} from "lucide-react";
import NetworkSettingsForm from "@/components/NetworkSettingsForm";
import EmailSettingsForm from "@/components/EmailSettingsForm";
import PasswordChangeModal from "@/components/PasswordChangeModal";
import AbsenceJustificationReview from "@/components/AbsenceJustificationReview";
import AutomatedAlertsConfig from "@/components/AutomatedAlertsConfig";

interface CenterSettings {
  centerName: string;
  academicYear: string;
  timezone: string;
  defaultLanguage: string;
}

export default function Settings() {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { canManageEmployees } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get institution ID from authenticated user
  const institutionId = user?.institutionId;

  const [centerSettings, setCenterSettings] = useState<CenterSettings>({
    centerName: "Centre Educatiu Exemple",
    academicYear: "2024-2025",
    timezone: "Europe/Barcelona",
    defaultLanguage: "ca",
  });

  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(true);
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [passwordChangeUser, setPasswordChangeUser] = useState<{ id: string; email: string } | null>(null);
  const [newAdminData, setNewAdminData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "admin",
    password: "prof123"
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["/api/settings", institutionId],
    enabled: !!institutionId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: CenterSettings) => {
      const promises = Object.entries(settingsData).map(([key, value]) =>
        apiRequest("PUT", `/api/settings/${institutionId}/${key}`, { value })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: t("success", language),
        description: language === "ca" ? "Configuració guardada correctament" : "Configuración guardada correctamente",
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

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(centerSettings);
  };

  const handleInputChange = (field: keyof CenterSettings, value: string) => {
    setCenterSettings(prev => ({ ...prev, [field]: value }));
  };

  // Fetch real admin users from database
  const { data: adminUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users/admins", institutionId],
    enabled: !!institutionId,
  });

  const createAdminMutation = useMutation({
    mutationFn: async (adminData: typeof newAdminData) => {
      return await apiRequest("POST", `/api/users/admins`, {
        ...adminData,
        institutionId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/admins"] });
      toast({
        title: t("success", language),
        description: language === "ca" ? "Administrador creat correctament" : "Administrador creado correctamente",
      });
      setShowAddAdminForm(false);
      setNewAdminData({
        email: "",
        firstName: "",
        lastName: "",
        role: "admin",
        password: "prof123"
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error", language),
        description: error.message || (language === "ca" ? "Error creant l'administrador" : "Error creando el administrador"),
        variant: "destructive",
      });
    },
  });

  const getRoleBadge = (role: string) => {
    const roleMap = {
      superadmin: {
        label: language === "ca" ? "Superadministrador" : "Superadministrador",
        className: "bg-primary/10 text-primary"
      },
      admin: {
        label: language === "ca" ? "Administrador" : "Administrador", 
        className: "bg-secondary/10 text-secondary"
      },
      employee: {
        label: language === "ca" ? "Empleat" : "Empleado",
        className: "bg-gray-100 text-gray-600"
      }
    };
    
    const roleInfo = roleMap[role as keyof typeof roleMap] || roleMap.employee;
    
    return (
      <Badge className={roleInfo.className}>
        {roleInfo.label}
      </Badge>
    );
  };

  return (
    <main className="p-6 space-y-6">
      {/* Center Configuration */}
      <Card data-testid="center-config-card">
        <CardHeader>
          <CardTitle>
            {t("center_configuration", language)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="center-name">
                {t("center_name", language)}
              </Label>
              <Input
                id="center-name"
                value={centerSettings.centerName}
                onChange={(e) => handleInputChange("centerName", e.target.value)}
                data-testid="center-name-input"
              />
            </div>
            
            <div>
              <Label htmlFor="academic-year">
                {t("academic_year", language)}
              </Label>
              <Select 
                value={centerSettings.academicYear} 
                onValueChange={(value) => handleInputChange("academicYear", value)}
              >
                <SelectTrigger id="academic-year" data-testid="academic-year-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="timezone">
                {t("timezone", language)}
              </Label>
              <Select 
                value={centerSettings.timezone} 
                onValueChange={(value) => handleInputChange("timezone", value)}
              >
                <SelectTrigger id="timezone" data-testid="timezone-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Barcelona">Europe/Barcelona</SelectItem>
                  <SelectItem value="Europe/Madrid">Europe/Madrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="default-language">
                {t("default_language", language)}
              </Label>
              <Select 
                value={centerSettings.defaultLanguage} 
                onValueChange={(value) => handleInputChange("defaultLanguage", value)}
              >
                <SelectTrigger id="default-language" data-testid="default-language-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ca">Català</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
            className="mt-6"
            data-testid="save-settings-button"
          >
            <Save className="mr-2 h-4 w-4" />
            {t("save", language)}
          </Button>
        </CardContent>
      </Card>

      {/* Data Retention Policy */}
      <Card data-testid="data-retention-card">
        <CardHeader>
          <CardTitle>
            {t("data_retention", language)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Info className="text-blue-600 mr-3 h-5 w-5 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">
                  {language === "ca" ? "Compliment RGPD" : "Cumplimiento RGPD"}
                </p>
                <p className="text-sm text-blue-700">
                  {language === "ca" 
                    ? "Les dades es conservaran durant 4 anys segons la normativa vigent. Aquest sistema compleix amb el Reglament General de Protecció de Dades (RGPD)."
                    : "Los datos se conservarán durante 4 años según la normativa vigente. Este sistema cumple con el Reglamento General de Protección de Datos (RGPD)."}
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-text">
                  {language === "ca" ? "Eliminació automàtica" : "Eliminación automática"}
                </p>
                <p className="text-sm text-gray-600">
                  {language === "ca" 
                    ? "Eliminar dades automàticament després de 4 anys"
                    : "Eliminar datos automáticamente después de 4 años"}
                </p>
              </div>
              <Switch
                checked={autoDeleteEnabled}
                onCheckedChange={setAutoDeleteEnabled}
                data-testid="auto-delete-switch"
              />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-text mb-2">
                {language === "ca" ? "Drets dels treballadors" : "Derechos de los trabajadores"}
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {language === "ca" ? "Accés a les seves dades" : "Acceso a sus datos"}</li>
                <li>• {language === "ca" ? "Rectificació de dades incorrectes" : "Rectificación de datos incorrectos"}</li>
                <li>• {language === "ca" ? "Limitació del tractament" : "Limitación del tratamiento"}</li>
                <li>• {language === "ca" ? "Portabilitat de les dades" : "Portabilidad de los datos"}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            {language === "ca" ? "Configuració d'Email" : "Configuración de Email"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Info className="text-green-600 mr-3 h-5 w-5 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">
                  {language === "ca" ? "Notificacions automàtiques" : "Notificaciones automáticas"}
                </p>
                <p className="text-sm text-green-700">
                  {language === "ca" 
                    ? "Configura el servidor d'email per enviar alertes automàtiques de retards, absències i notificacions legals."
                    : "Configura el servidor de email para enviar alertas automáticas de retrasos, ausencias y notificaciones legales."}
                </p>
              </div>
            </div>
          </div>
          
          <EmailSettingsForm institutionId={institutionId} language={language} />
        </CardContent>
      </Card>

      {/* Network Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            {language === "ca" ? "Configuració de Xarxa per Fitxatge" : "Configuración de Red para Fichaje"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Info className="text-blue-600 mr-3 h-5 w-5 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">
                  {language === "ca" ? "Control d'accés per xarxa" : "Control de acceso por red"}
                </p>
                <p className="text-sm text-blue-700">
                  {language === "ca" 
                    ? "Configura les adreces IP des d'on es permet fer fitxatge. La gestió del sistema és accessible des de qualsevol lloc, però el fitxatge només des de la xarxa local del centre."
                    : "Configura las direcciones IP desde donde se permite hacer fichaje. La gestión del sistema es accesible desde cualquier lugar, pero el fichaje solo desde la red local del centro."}
                </p>
              </div>
            </div>
          </div>
          
          <NetworkSettingsForm institutionId={institutionId} language={language} />
        </CardContent>
      </Card>

      {/* Absence Justification Review - Only for Admins */}
      {canManageEmployees && (
        <AbsenceJustificationReview 
          institutionId={institutionId || ""} 
          language={language} 
        />
      )}

      {/* Automated Alerts Configuration - Only for Admins */}
      {canManageEmployees && (
        <AutomatedAlertsConfig 
          institutionId={institutionId || ""} 
          language={language} 
        />
      )}

      {/* User Management */}
      <Card data-testid="user-management-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {t("user_management", language)}
            </CardTitle>
            <Button 
              onClick={() => setShowAddAdminForm(true)}
              data-testid="add-admin-button"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {language === "ca" ? "Afegir administrador" : "Añadir administrador"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {language === "ca" ? "Usuari" : "Usuario"}
                  </TableHead>
                  <TableHead>
                    {language === "ca" ? "Rol" : "Rol"}
                  </TableHead>
                  <TableHead>
                    {language === "ca" ? "Últim accés" : "Último acceso"}
                  </TableHead>
                  <TableHead>
                    {t("actions", language)}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (adminUsers as any[]).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {language === "ca" ? "No hi ha usuaris administradors" : "No hay usuarios administradores"}
                    </TableCell>
                  </TableRow>
                ) : (
                  (adminUsers as any[]).map((admin: any) => (
                    <TableRow key={admin.id} data-testid={`admin-${admin.id}`}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text">
                              {admin.firstName} {admin.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {admin.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(admin.role)}
                      </TableCell>
                      <TableCell className="text-sm text-text">
                        {new Date(admin.createdAt).toLocaleDateString(language === "ca" ? "ca-ES" : "es-ES")}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setPasswordChangeUser({ id: admin.id, email: admin.email })}
                            data-testid={`change-password-${admin.id}`}
                            title={language === "ca" ? "Canviar contrasenya" : "Cambiar contraseña"}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`edit-admin-${admin.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card data-testid="security-settings-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            {language === "ca" ? "Configuració de seguretat" : "Configuración de seguridad"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <Shield className="text-green-600 mr-3 h-5 w-5 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800 mb-1">
                    {language === "ca" ? "Seguretat habilitada" : "Seguridad habilitada"}
                  </p>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• {language === "ca" ? "Xifratge de dades en repòs i en trànsit" : "Cifrado de datos en reposo y en tránsito"}</li>
                    <li>• {language === "ca" ? "Autenticació robusta amb Replit Auth" : "Autenticación robusta con Replit Auth"}</li>
                    <li>• {language === "ca" ? "Control d'accés basat en rols" : "Control de acceso basado en roles"}</li>
                    <li>• {language === "ca" ? "Registres d'accés i auditoria" : "Registros de acceso y auditoría"}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Admin Dialog */}
      {showAddAdminForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {language === "ca" ? "Afegir administrador" : "Añadir administrador"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddAdminForm(false)}
                data-testid="close-admin-form"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={newAdminData.email}
                  onChange={(e) => setNewAdminData({...newAdminData, email: e.target.value})}
                  placeholder="administrador@centre.edu"
                  data-testid="admin-email-input"
                />
              </div>
              
              <div>
                <Label htmlFor="admin-firstname">
                  {language === "ca" ? "Nom" : "Nombre"}
                </Label>
                <Input
                  id="admin-firstname"
                  value={newAdminData.firstName}
                  onChange={(e) => setNewAdminData({...newAdminData, firstName: e.target.value})}
                  data-testid="admin-firstname-input"
                />
              </div>
              
              <div>
                <Label htmlFor="admin-lastname">
                  {language === "ca" ? "Cognoms" : "Apellidos"}
                </Label>
                <Input
                  id="admin-lastname"
                  value={newAdminData.lastName}
                  onChange={(e) => setNewAdminData({...newAdminData, lastName: e.target.value})}
                  data-testid="admin-lastname-input"
                />
              </div>
              
              <div>
                <Label htmlFor="admin-role">
                  {language === "ca" ? "Rol" : "Rol"}
                </Label>
                <Select 
                  value={newAdminData.role}
                  onValueChange={(value) => setNewAdminData({...newAdminData, role: value})}
                >
                  <SelectTrigger id="admin-role" data-testid="admin-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      {language === "ca" ? "Administrador" : "Administrador"}
                    </SelectItem>
                    <SelectItem value="superadmin">
                      {language === "ca" ? "Superadministrador" : "Superadministrador"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  {language === "ca" 
                    ? "Contrasenya per defecte: prof123"
                    : "Contraseña por defecto: prof123"}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddAdminForm(false)}
                data-testid="cancel-admin-button"
              >
                {language === "ca" ? "Cancel·lar" : "Cancelar"}
              </Button>
              <Button
                onClick={() => createAdminMutation.mutate(newAdminData)}
                disabled={createAdminMutation.isPending || !newAdminData.email || !newAdminData.firstName}
                data-testid="save-admin-button"
              >
                {createAdminMutation.isPending ? (
                  language === "ca" ? "Creant..." : "Creando..."
                ) : (
                  language === "ca" ? "Crear" : "Crear"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {passwordChangeUser && (
        <PasswordChangeModal
          isOpen={!!passwordChangeUser}
          onClose={() => setPasswordChangeUser(null)}
          userId={passwordChangeUser.id}
          userEmail={passwordChangeUser.email}
          language={language}
        />
      )}
    </main>
  );
}
