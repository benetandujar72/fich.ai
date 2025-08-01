import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { t } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  FolderInput, 
  Plus, 
  Search, 
  Edit, 
  Clock, 
  Trash2
} from "lucide-react";
import EmployeeModal from "@/components/modals/EmployeeModal";
import type { Employee } from "@shared/schema";

export default function Employees() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Mock institution ID - in real app, this would come from user context
  const institutionId = user?.institutionId || "mock-institution-id";

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees", institutionId, searchQuery],
    enabled: !!institutionId,
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      await apiRequest("DELETE", `/api/employees/${employeeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: t("success", language),
        description: language === "ca" ? "Empleat eliminat correctament" : "Empleado eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: t("error", language),
        description: language === "ca" ? "Error eliminant l'empleat" : "Error eliminando el empleado",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    if (confirm(language === "ca" ? 
      `Estàs segur que vols eliminar ${employee.fullName}?` : 
      `¿Estás seguro que quieres eliminar ${employee.fullName}?`)) {
      deleteEmployeeMutation.mutate(employee.id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { 
        label: t("active", language), 
        variant: "default" as const,
        className: "bg-secondary/10 text-secondary"
      },
      inactive: { 
        label: t("inactive", language), 
        variant: "secondary" as const,
        className: "bg-gray-100 text-gray-600"
      },
      temporary_leave: { 
        label: t("temporary_leave", language), 
        variant: "outline" as const,
        className: "bg-accent/10 text-accent"
      },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.active;
    
    return (
      <Badge variant={statusInfo.variant} className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getContractTypeLabel = (type: string) => {
    const typeMap = {
      full_time: t("full_time", language),
      part_time: t("part_time", language),
      substitute: t("substitute", language),
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-text mb-2">
            {t("employee_management", language)}
          </h2>
          <p className="text-gray-600">
            {language === "ca" 
              ? "Administra els empleats del centre educatiu"
              : "Administra los empleados del centro educativo"}
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Button 
            variant="outline"
            className="bg-secondary text-white hover:bg-green-700"
            data-testid="import-button"
          >
            <FolderInput className="mr-2 h-4 w-4" />
            {language === "ca" ? "Importar" : "Importar"}
          </Button>
          <Button 
            onClick={() => setIsModalOpen(true)}
            data-testid="add-employee-button"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("add_employee", language)}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6" data-testid="filters-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">{t("search", language)}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nom, DNI, correu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
            </div>
            <div>
              <Label>{t("department", language)}</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger data-testid="department-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === "ca" ? "Tots" : "Todos"}
                  </SelectItem>
                  <SelectItem value="primary">
                    {t("primary_education", language)}
                  </SelectItem>
                  <SelectItem value="secondary">
                    {t("secondary_education", language)}
                  </SelectItem>
                  <SelectItem value="administration">
                    {t("administration", language)}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("status", language)}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === "ca" ? "Tots" : "Todos"}
                  </SelectItem>
                  <SelectItem value="active">{t("active", language)}</SelectItem>
                  <SelectItem value="inactive">{t("inactive", language)}</SelectItem>
                  <SelectItem value="temporary_leave">{t("temporary_leave", language)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" data-testid="filter-button">
                <Search className="mr-2 h-4 w-4" />
                {t("filter", language)}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card data-testid="employees-table-card">
        <CardHeader>
          <CardTitle>{t("employee_list", language)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("employee", language)}</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>{t("department", language)}</TableHead>
                  <TableHead>{t("schedule", language)}</TableHead>
                  <TableHead>{t("status", language)}</TableHead>
                  <TableHead>{t("actions", language)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-gray-500">
                        {language === "ca" 
                          ? "No s'han trobat empleats"
                          : "No se han encontrado empleados"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee: Employee) => (
                    <TableRow key={employee.id} data-testid={`employee-row-${employee.id}`}>
                      <TableCell>
                        <div className="flex items-center">
                          <img 
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face"
                            alt={employee.fullName}
                            className="w-10 h-10 rounded-full object-cover mr-4"
                          />
                          <div>
                            <div className="font-medium text-text" data-testid={`employee-name-${employee.id}`}>
                              {employee.fullName}
                            </div>
                            <div className="text-sm text-gray-500" data-testid={`employee-email-${employee.id}`}>
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`employee-dni-${employee.id}`}>
                        {employee.dni}
                      </TableCell>
                      <TableCell data-testid={`employee-department-${employee.id}`}>
                        {employee.departmentId || t("administration", language)}
                      </TableCell>
                      <TableCell data-testid={`employee-schedule-${employee.id}`}>
                        {getContractTypeLabel(employee.contractType)}
                      </TableCell>
                      <TableCell data-testid={`employee-status-${employee.id}`}>
                        {getStatusBadge(employee.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                            data-testid={`edit-employee-${employee.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`schedule-employee-${employee.id}`}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(employee)}
                            className="text-error hover:text-red-700"
                            data-testid={`delete-employee-${employee.id}`}
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

      {/* Employee Modal */}
      <EmployeeModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        employee={editingEmployee}
        institutionId={institutionId}
      />
    </main>
  );
}
