import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { t } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Building } from "lucide-react";
import type { Institution, InsertInstitution } from "@shared/schema";

export default function InstitutionManagement() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [formData, setFormData] = useState<Partial<InsertInstitution>>({
    name: "",
    address: "",
    timezone: "Europe/Barcelona",
    defaultLanguage: "ca"
  });

  const { data: institutions = [], isLoading } = useQuery<Institution[]>({
    queryKey: ["/api/institutions"],
    enabled: user?.role === "superadmin",
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertInstitution) => {
      return await apiRequest("POST", "/api/institutions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/institutions"] });
      toast({
        title: t("success", language),
        description: language === "ca" ? "Institució creada correctament" : "Institución creada correctamente",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: t("error", language),
        description: language === "ca" ? "Error creant la institució" : "Error creando la institución",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      timezone: "Europe/Barcelona",
      defaultLanguage: "ca"
    });
    setEditingInstitution(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      createMutation.mutate(formData as InsertInstitution);
    }
  };

  // Check if user has superadmin access
  if (user?.role !== "superadmin") {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Building className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {language === "ca" ? "Accés restringit" : "Acceso restringido"}
              </h3>
              <p className="text-gray-600">
                {language === "ca" 
                  ? "Només els superadministradors poden gestionar institucions" 
                  : "Solo los superadministradores pueden gestionar instituciones"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text">
          {language === "ca" ? "Gestió d'Institucions" : "Gestión de Instituciones"}
        </h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-institution-button">
              <Plus className="mr-2 h-4 w-4" />
              {language === "ca" ? "Nova Institució" : "Nueva Institución"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === "ca" ? "Crear Nova Institució" : "Crear Nueva Institución"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">
                  {language === "ca" ? "Nom de la Institució" : "Nombre de la Institución"}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Institut Bitàcola"
                  required
                  data-testid="institution-name-input"
                />
              </div>
              <div>
                <Label htmlFor="address">
                  {language === "ca" ? "Adreça" : "Dirección"}
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Carrer de l'Educació, 123, 08080 Barcelona"
                  data-testid="institution-address-input"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="timezone">
                    {language === "ca" ? "Zona Horària" : "Zona Horaria"}
                  </Label>
                  <Input
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    data-testid="institution-timezone-input"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="defaultLanguage">
                    {language === "ca" ? "Idioma per Defecte" : "Idioma por Defecto"}
                  </Label>
                  <select
                    id="defaultLanguage"
                    value={formData.defaultLanguage}
                    onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md"
                    data-testid="institution-language-select"
                  >
                    <option value="ca">Català</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending} data-testid="submit-institution-button">
                  {createMutation.isPending ? 
                    (language === "ca" ? "Creant..." : "Creando...") :
                    (language === "ca" ? "Crear Institució" : "Crear Institución")
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="cancel-institution-button"
                >
                  {t("cancel", language)}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card data-testid="institutions-table-card">
        <CardHeader>
          <CardTitle>
            {language === "ca" ? "Institucions Registrades" : "Instituciones Registradas"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ca" ? "Nom" : "Nombre"}</TableHead>
                  <TableHead>{language === "ca" ? "Adreça" : "Dirección"}</TableHead>
                  <TableHead>{language === "ca" ? "Zona Horària" : "Zona Horaria"}</TableHead>
                  <TableHead>{language === "ca" ? "Idioma" : "Idioma"}</TableHead>
                  <TableHead>{language === "ca" ? "Data de Creació" : "Fecha de Creación"}</TableHead>
                  <TableHead>{t("actions", language)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institutions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-gray-500">
                        {language === "ca" 
                          ? "No s'han trobat institucions"
                          : "No se han encontrado instituciones"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  institutions.map((institution: Institution) => (
                    <TableRow key={institution.id} data-testid={`institution-row-${institution.id}`}>
                      <TableCell className="font-medium" data-testid={`institution-name-${institution.id}`}>
                        {institution.name}
                      </TableCell>
                      <TableCell data-testid={`institution-address-${institution.id}`}>
                        {institution.address || "-"}
                      </TableCell>
                      <TableCell data-testid={`institution-timezone-${institution.id}`}>
                        {institution.timezone}
                      </TableCell>
                      <TableCell data-testid={`institution-language-${institution.id}`}>
                        {institution.defaultLanguage === "ca" ? "Català" : "Español"}
                      </TableCell>
                      <TableCell data-testid={`institution-created-${institution.id}`}>
                        {institution.createdAt ? new Date(institution.createdAt).toLocaleDateString("ca-ES") : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingInstitution(institution)}
                            data-testid={`edit-institution-${institution.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            data-testid={`delete-institution-${institution.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
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
    </div>
  );
}