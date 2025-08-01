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
import { Badge } from "@/components/ui/badge";
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
import { Plus, Edit, Trash2, Calendar, BookOpen } from "lucide-react";
import type { AcademicYear, InsertAcademicYear } from "@shared/schema";

export default function AcademicYearManagement() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState<Partial<InsertAcademicYear>>({
    name: "",
    startDate: "",
    endDate: "",
    isActive: false
  });

  const institutionId = user?.institutionId;

  const { data: academicYears = [], isLoading } = useQuery<AcademicYear[]>({
    queryKey: ["/api/academic-years", institutionId],
    enabled: !!institutionId && (user?.role === "admin" || user?.role === "superadmin"),
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAcademicYear) => {
      return await apiRequest("POST", "/api/academic-years", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academic-years"] });
      toast({
        title: t("success", language),
        description: language === "ca" ? "Curs acadèmic creat correctament" : "Curso académico creado correctamente",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: t("error", language),
        description: language === "ca" ? "Error creant el curs acadèmic" : "Error creando el curso académico",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      startDate: "",
      endDate: "",
      isActive: false
    });
    setEditingYear(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.startDate && formData.endDate && institutionId) {
      createMutation.mutate({
        ...formData,
        institutionId
      } as InsertAcademicYear);
    }
  };

  // Generate academic year suggestions
  const generateYearSuggestions = () => {
    const currentYear = new Date().getFullYear();
    return [
      {
        name: `${currentYear}-${currentYear + 1}`,
        startDate: `${currentYear}-09-15`,
        endDate: `${currentYear + 1}-06-22`
      },
      {
        name: `${currentYear + 1}-${currentYear + 2}`,
        startDate: `${currentYear + 1}-09-15`,
        endDate: `${currentYear + 2}-06-22`
      }
    ];
  };

  // Check if user has admin access
  if (!institutionId || (user?.role !== "admin" && user?.role !== "superadmin")) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {language === "ca" ? "Accés restringit" : "Acceso restringido"}
              </h3>
              <p className="text-gray-600">
                {language === "ca" 
                  ? "Només els administradors poden gestionar cursos acadèmics" 
                  : "Solo los administradores pueden gestionar cursos académicos"}
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

  const yearSuggestions = generateYearSuggestions();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text">
          {language === "ca" ? "Gestió de Cursos Acadèmics" : "Gestión de Cursos Académicos"}
        </h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-academic-year-button">
              <Plus className="mr-2 h-4 w-4" />
              {language === "ca" ? "Nou Curs Acadèmic" : "Nuevo Curso Académico"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {language === "ca" ? "Crear Nou Curs Acadèmic" : "Crear Nuevo Curso Académico"}
              </DialogTitle>
            </DialogHeader>
            
            {/* Quick suggestions */}
            <div className="mb-4">
              <Label className="text-sm text-gray-600">
                {language === "ca" ? "Suggeriments ràpids:" : "Sugerencias rápidas:"}
              </Label>
              <div className="flex gap-2 mt-2">
                {yearSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({
                      ...formData,
                      name: suggestion.name,
                      startDate: suggestion.startDate,
                      endDate: suggestion.endDate
                    })}
                    data-testid={`year-suggestion-${index}`}
                  >
                    {suggestion.name}
                  </Button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">
                  {language === "ca" ? "Nom del Curs" : "Nombre del Curso"}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="2025-2026"
                  required
                  data-testid="academic-year-name-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">
                    {language === "ca" ? "Data d'Inici" : "Fecha de Inicio"}
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    data-testid="academic-year-start-date-input"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">
                    {language === "ca" ? "Data de Fi" : "Fecha de Fin"}
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    data-testid="academic-year-end-date-input"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  data-testid="academic-year-active-checkbox"
                />
                <Label htmlFor="isActive">
                  {language === "ca" ? "Marcar com a curs actiu" : "Marcar como curso activo"}
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending} data-testid="submit-academic-year-button">
                  {createMutation.isPending ? 
                    (language === "ca" ? "Creant..." : "Creando...") :
                    (language === "ca" ? "Crear Curs" : "Crear Curso")
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="cancel-academic-year-button"
                >
                  {t("cancel", language)}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card data-testid="academic-years-table-card">
        <CardHeader>
          <CardTitle>
            {language === "ca" ? "Cursos Acadèmics" : "Cursos Académicos"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ca" ? "Curs" : "Curso"}</TableHead>
                  <TableHead>{language === "ca" ? "Data d'Inici" : "Fecha de Inicio"}</TableHead>
                  <TableHead>{language === "ca" ? "Data de Fi" : "Fecha de Fin"}</TableHead>
                  <TableHead>{language === "ca" ? "Estat" : "Estado"}</TableHead>
                  <TableHead>{language === "ca" ? "Durada" : "Duración"}</TableHead>
                  <TableHead>{t("actions", language)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {academicYears.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-gray-500">
                        {language === "ca" 
                          ? "No s'han trobat cursos acadèmics"
                          : "No se han encontrado cursos académicos"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  academicYears.map((year: AcademicYear) => {
                    const startDate = new Date(year.startDate);
                    const endDate = new Date(year.endDate);
                    const today = new Date();
                    const isCurrentYear = today >= startDate && today <= endDate;
                    const isFutureYear = today < startDate;
                    
                    return (
                      <TableRow key={year.id} data-testid={`academic-year-row-${year.id}`}>
                        <TableCell className="font-medium" data-testid={`academic-year-name-${year.id}`}>
                          {year.name}
                        </TableCell>
                        <TableCell data-testid={`academic-year-start-${year.id}`}>
                          {startDate.toLocaleDateString("ca-ES")}
                        </TableCell>
                        <TableCell data-testid={`academic-year-end-${year.id}`}>
                          {endDate.toLocaleDateString("ca-ES")}
                        </TableCell>
                        <TableCell data-testid={`academic-year-status-${year.id}`}>
                          <Badge variant={year.isActive ? "default" : isCurrentYear ? "secondary" : isFutureYear ? "outline" : "destructive"}>
                            {year.isActive ? 
                              (language === "ca" ? "Actiu" : "Activo") :
                              isCurrentYear ? 
                                (language === "ca" ? "En curs" : "En curso") :
                                isFutureYear ?
                                  (language === "ca" ? "Futur" : "Futuro") :
                                  (language === "ca" ? "Finalitzat" : "Finalizado")
                            }
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`academic-year-duration-${year.id}`}>
                          {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} {language === "ca" ? "dies" : "días"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingYear(year)}
                              data-testid={`edit-academic-year-${year.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              data-testid={`delete-academic-year-${year.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}