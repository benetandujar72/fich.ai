import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  TrendingUp,
  Filter
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function ReportsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState("attendance");

  // Fetch employees for selection
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/admin/employees', user?.institutionId],
    enabled: !!user?.institutionId,
  });

  const handleEmployeeSelection = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    } else {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    }
  };

  const generateReport = () => {
    const params = new URLSearchParams({
      institutionId: user?.institutionId || '',
      employees: selectedEmployees.join(','),
      startDate: dateRange.start,
      endDate: dateRange.end,
      type: reportType
    });

    // Download report
    window.open(`/api/admin/reports/generate?${params}`, '_blank');
  };

  const presetReports = [
    {
      id: 'monthly_attendance',
      name: 'Informe Mensual d\'Assistència',
      description: 'Resum d\'assistència de tots els empleats del mes actual',
      type: 'attendance'
    },
    {
      id: 'weekly_summary',
      name: 'Resum Setmanal',
      description: 'Estadístiques d\'assistència de la setmana actual',
      type: 'summary'
    },
    {
      id: 'employee_performance',
      name: 'Rendiment per Empleat',
      description: 'Anàlisi detallada del rendiment individual',
      type: 'performance'
    },
    {
      id: 'delay_analysis',
      name: 'Anàlisi de Retards',
      description: 'Informe de retards i absències injustificades',
      type: 'delays'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestió d'Informes</h2>
          <p className="text-muted-foreground">
            Genera informes personalitzats i estadístiques del centre
          </p>
        </div>
      </div>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Informes Predefinits
          </CardTitle>
          <CardDescription>
            Genera ràpidament informes amb configuracions predeterminades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presetReports.map((report) => (
              <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <Badge variant="outline">{report.type}</Badge>
                  </div>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setReportType(report.type);
                      generateReport();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generador d'Informes Personalitzats
          </CardTitle>
          <CardDescription>
            Selecciona empleats específics i personalitza el període de l'informe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Data Inici</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipus d'Informe</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Assistència</SelectItem>
                  <SelectItem value="summary">Resum</SelectItem>
                  <SelectItem value="performance">Rendiment</SelectItem>
                  <SelectItem value="delays">Retards</SelectItem>
                  <SelectItem value="detailed">Detallat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Employee Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium">
                Seleccionar Empleats ({selectedEmployees.length} seleccionats)
              </label>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEmployees(employees.map((e: any) => e.id))}
                >
                  Seleccionar Tots
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEmployees([])}
                >
                  Deseleccionar Tots
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded p-4">
              {employees.map((employee: any) => (
                <div key={employee.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={employee.id}
                    checked={selectedEmployees.includes(employee.id)}
                    onCheckedChange={(checked) => 
                      handleEmployeeSelection(employee.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={employee.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {employee.firstName} {employee.lastName}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <Button
              onClick={generateReport}
              disabled={selectedEmployees.length === 0}
              className="min-w-32"
            >
              <Download className="h-4 w-4 mr-2" />
              Generar Informe
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informes Recents
          </CardTitle>
          <CardDescription>
            Descarrega informes generats anteriorment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Els informes generats apareixeran aquí</p>
            <p className="text-sm">Genera el teu primer informe per començar</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReportsManagement;