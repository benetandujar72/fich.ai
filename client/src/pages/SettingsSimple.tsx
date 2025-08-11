import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { t } from "@/lib/i18n";

interface CenterSettings {
  centerName: string;
  academicYear: string;
  timezone: string;
  defaultLanguage: string;
}

export default function SettingsSimple() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const institutionId = user?.institutionId || null;

  const [centerSettings, setCenterSettings] = useState<CenterSettings>({
    centerName: "",
    academicYear: "2025-2026",
    timezone: "Europe/Barcelona",
    defaultLanguage: "ca",
  });

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings", institutionId],
    enabled: !!institutionId,
  });

  // Load settings into state
  useEffect(() => {
    if (settings && Array.isArray(settings) && settings.length > 0) {
      const settingsObj = settings.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
      
      setCenterSettings({
        centerName: settingsObj.centerName || "",
        academicYear: settingsObj.academicYear || "2025-2026",
        timezone: settingsObj.timezone || "Europe/Barcelona",
        defaultLanguage: settingsObj.defaultLanguage || "ca",
      });
    }
  }, [settings]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: CenterSettings) => {
      return await apiRequest("PUT", `/api/settings/${institutionId}`, { 
        settings: settingsData 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings", institutionId] });
      toast({
        title: "Éxito",
        description: "Configuración guardada correctamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error guardando la configuración",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof CenterSettings, value: string) => {
    setCenterSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(centerSettings);
  };

  if (!institutionId) {
    return (
      <div className="p-6">
        <p>Cargando información del centro...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      {/* Center Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Configuración del Centro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="center-name">
                Nombre del Centro
              </Label>
              <Input
                id="center-name"
                value={centerSettings.centerName}
                onChange={(e) => handleInputChange("centerName", e.target.value)}
                placeholder="Introduce el nombre del centro"
              />
            </div>
            
            <div>
              <Label htmlFor="academic-year">
                Año Académico
              </Label>
              <Select 
                value={centerSettings.academicYear} 
                onValueChange={(value) => handleInputChange("academicYear", value)}
              >
                <SelectTrigger id="academic-year">
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
                Zona Horaria
              </Label>
              <Select 
                value={centerSettings.timezone} 
                onValueChange={(value) => handleInputChange("timezone", value)}
              >
                <SelectTrigger id="timezone">
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
                Idioma por Defecto
              </Label>
              <Select 
                value={centerSettings.defaultLanguage} 
                onValueChange={(value) => handleInputChange("defaultLanguage", value)}
              >
                <SelectTrigger id="default-language">
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
          >
            <Save className="mr-2 h-4 w-4" />
            {updateSettingsMutation.isPending ? "Guardando..." : "Guardar Configuración"}
          </Button>

          <div className="mt-4 p-3 bg-gray-100 rounded border">
            <h4 className="font-semibold mb-2">Debug Info:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify({ 
                centerSettings, 
                isLoading, 
                settingsCount: Array.isArray(settings) ? settings.length : 0 
              }, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}