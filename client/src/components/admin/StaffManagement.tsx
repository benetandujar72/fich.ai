import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Download, 
  Upload, 
  Search, 
  Edit, 
  Eye, 
  Calendar,
  Plus,
  FileSpreadsheet 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { WeeklyScheduleModal } from "./WeeklyScheduleModal";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  lastAttendance?: string;
  totalHours?: number;
}

export function StaffManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [scheduleModalUserId, setScheduleModalUserId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Fetch all employees for the institution
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['/api/admin/employees', user?.institutionId],
    enabled: !!user?.institutionId,
  });

  // Filtered employees based on search and role filter
  const filteredEmployees = (employees as Employee[]).filter((employee: Employee) => {
    const matchesSearch = 
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || employee.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Download import template
  const downloadTemplate = () => {
    const csvContent = [
      "firstName,lastName,email,role,department,startDate",
      "Joan,García,joan.garcia@centre.edu,employee,Matemàtiques,2024-09-01",
      "Maria,López,maria.lopez@centre.edu,employee,Història,2024-09-01",
      "Pere,Martín,pere.martin@centre.edu,admin,Direcció,2024-09-01"
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "plantilla_personal.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import employees from file
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('institutionId', user?.institutionId || '');
      
      const response = await fetch('/api/admin/employees/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error importing employees');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Importació completada",
        description: `${data.successful} empleats importats correctament, ${data.failed} errors.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      setImportDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error en la importació",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestió de Personal</h2>
          <p className="text-muted-foreground">
            Administra els empleats del centre educatiu
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={downloadTemplate}
            data-testid="button-download-template"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Descarregar Plantilla
          </Button>
          
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-import-employees">
                <Upload className="h-4 w-4 mr-2" />
                Importar Personal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Personal</DialogTitle>
                <DialogDescription>
                  Selecciona un fitxer CSV amb les dades del personal a importar.
                  Assegura't que segueix el format de la plantilla.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      importMutation.mutate(file);
                    }
                  }}
                  data-testid="input-import-file"
                />
                <div className="text-sm text-muted-foreground">
                  Formats acceptats: CSV. Mida màxima: 10MB
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button size="sm" data-testid="button-add-employee">
            <Plus className="h-4 w-4 mr-2" />
            Afegir Personal
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cercar per nom, cognoms o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-employees"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar per rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tots els rols</SelectItem>
                <SelectItem value="employee">Empleats</SelectItem>
                <SelectItem value="admin">Administradors</SelectItem>
                <SelectItem value="superadmin">Superadministradors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Llistat de Personal ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom Complet</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Data Creació</TableHead>
                  <TableHead>Última Assistència</TableHead>
                  <TableHead>Hores Setmana</TableHead>
                  <TableHead>Accions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee: Employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(employee.role)}>
                        {employee.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(employee.createdAt).toLocaleDateString('ca-ES')}
                    </TableCell>
                    <TableCell>
                      {employee.lastAttendance 
                        ? new Date(employee.lastAttendance).toLocaleDateString('ca-ES')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {typeof employee.totalHours === 'number' ? employee.totalHours.toFixed(1) : parseFloat(employee.totalHours?.toString() || '0').toFixed(1)}h
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setScheduleModalUserId(employee.id)}
                          data-testid={`button-schedule-${employee.id}`}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-${employee.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-view-${employee.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No s'han trobat empleats amb els filtres aplicats
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Weekly Schedule Modal */}
      {scheduleModalUserId && (
        <WeeklyScheduleModal
          userId={scheduleModalUserId}
          onClose={() => setScheduleModalUserId(null)}
        />
      )}
    </div>
  );
}

export default StaffManagement;