import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Wifi, Shield, Network } from "lucide-react";

interface NetworkSettings {
  allowedNetworks: string[];
  requireNetworkValidation: boolean;
  description: string;
}

interface NetworkSettingsFormProps {
  institutionId: string | null | undefined;
  language: string;
}

export default function NetworkSettingsForm({ institutionId, language }: NetworkSettingsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [allowedNetworks, setAllowedNetworks] = useState<string[]>([]);
  const [requireValidation, setRequireValidation] = useState(false);
  const [description, setDescription] = useState("");
  const [newNetwork, setNewNetwork] = useState("");

  const { data: networkSettings, isLoading } = useQuery<NetworkSettings>({
    queryKey: ["/api/attendance-network-settings", institutionId || "null"],
    queryFn: async () => {
      const response = await fetch(`/api/attendance-network-settings/${institutionId || "null"}`);
      if (!response.ok) {
        throw new Error('Failed to fetch network settings');
      }
      return response.json();
    },
  });

  // Load existing data when received from server
  useEffect(() => {
    if (networkSettings) {
      setAllowedNetworks(networkSettings.allowedNetworks || []);
      setRequireValidation(networkSettings.requireNetworkValidation || false);
      setDescription(networkSettings.description || "");
    }
  }, [networkSettings]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/attendance-network-settings/${institutionId || "null"}`, data);
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Èxit" : "Éxito",
        description: language === "ca" ? "Configuració de xarxa guardada" : "Configuración de red guardada",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-network-settings", institutionId || "null"] });
    },
    onError: (error: any) => {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: error.message || (language === "ca" ? "Error guardant la configuració" : "Error guardando la configuración"),
        variant: "destructive",
      });
    },
  });

  const addNetwork = () => {
    if (newNetwork.trim() && !allowedNetworks.includes(newNetwork.trim())) {
      setAllowedNetworks([...allowedNetworks, newNetwork.trim()]);
      setNewNetwork("");
    }
  };

  const removeNetwork = (index: number) => {
    setAllowedNetworks(allowedNetworks.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    updateMutation.mutate({
      allowedNetworks,
      requireNetworkValidation: requireValidation,
      description,
    });
  };

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded"></div>;
  }

  return (
    <div className="space-y-6">
      {/* Network Validation Toggle */}
      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <Shield className="h-5 w-5 text-blue-600" />
          <div>
            <Label className="text-blue-800 font-medium">
              {language === "ca" ? "Restringir fitxatge per xarxa" : "Restringir fichaje por red"}
            </Label>
            <p className="text-sm text-blue-600">
              {language === "ca" 
                ? "Només permet fitxatge des de les IPs especificades"
                : "Solo permite fichaje desde las IPs especificadas"}
            </p>
          </div>
        </div>
        <Switch
          checked={requireValidation}
          onCheckedChange={setRequireValidation}
          data-testid="require-validation-switch"
        />
      </div>

      {/* Allowed Networks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5" />
            <span>
              {language === "ca" ? "Xarxes Autoritzades" : "Redes Autorizadas"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Network */}
          <div className="flex space-x-2">
            <Input
              placeholder={language === "ca" ? "192.168.1.0/24 o 192.168.1.100" : "192.168.1.0/24 o 192.168.1.100"}
              value={newNetwork}
              onChange={(e) => setNewNetwork(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addNetwork()}
              data-testid="new-network-input"
            />
            <Button onClick={addNetwork} size="sm" data-testid="add-network-button">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Network List */}
          <div className="space-y-2">
            {allowedNetworks.map((network, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="font-mono text-sm">{network}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeNetwork(index)}
                  className="text-red-600 hover:text-red-700"
                  data-testid={`remove-network-${index}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {allowedNetworks.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                {language === "ca" 
                  ? "No hi ha xarxes configurades. Afegeix una IP o rang CIDR."
                  : "No hay redes configuradas. Añade una IP o rango CIDR."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <div>
        <Label htmlFor="network-description">
          {language === "ca" ? "Descripció" : "Descripción"}
        </Label>
        <Textarea
          id="network-description"
          placeholder={language === "ca" 
            ? "Descripció opcional de la configuració de xarxa"
            : "Descripción opcional de la configuración de red"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          data-testid="network-description"
        />
      </div>

      {/* Help Text */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">
          {language === "ca" ? "Exemples de configuració:" : "Ejemplos de configuración:"}
        </h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <code>192.168.1.0/24</code> - {language === "ca" ? "Tota la xarxa local" : "Toda la red local"}</li>
          <li>• <code>192.168.1.100</code> - {language === "ca" ? "IP específica" : "IP específica"}</li>
          <li>• <code>10.0.0.0/8</code> - {language === "ca" ? "Xarxa privada gran" : "Red privada grande"}</li>
        </ul>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        data-testid="save-network-settings-button"
      >
        {updateMutation.isPending
          ? (language === "ca" ? "Guardant..." : "Guardando...")
          : (language === "ca" ? "Guardar Configuració de Xarxa" : "Guardar Configuración de Red")}
      </Button>
    </div>
  );
}