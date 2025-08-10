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
import { WeeklyScheduleModal } from "./WeeklyScheduleModal";

export function ReportsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState("attendance");
  const [showWeeklyDetailModal, setShowWeeklyDetailModal] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<string | null>(null);

  // Fetch weekly attendance data for all employees
  const { data: weeklyData = [], isLoading: weeklyLoading } = useQuery({
    queryKey: ['/api/admin/weekly-attendance', user?.institutionId],
    enabled: !!user?.institutionId && showWeeklyDetailModal,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch employees for selection
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/admin/employees', user?.institutionId],
    enabled: !!user?.institutionId,
  });

  interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }

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
      name: 'Informe Setmanal',
      description: 'Llista d\'usuaris amb fitxatges reals vs horaris previstos',
      type: 'weekly_detailed'
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
              <Card key={report.id} className="hover:shadow-md transition-shadow">
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
                      if (report.id === 'weekly_summary') {
                        setShowWeeklyDetailModal(true);
                      } else {
                        setReportType(report.type);
                        generateReport();
                      }
                    }}
                    data-testid={`button-generate-${report.id}`}
                  >
                    {report.id === 'weekly_summary' ? (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Veure Llista Usuaris
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generar
                      </>
                    )}
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
                  onClick={() => setSelectedEmployees((employees as Employee[]).map((e: Employee) => e.id))}
                  data-testid="button-select-all-employees"
                >
                  Tots ({(employees as Employee[]).length})
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
              {(employees as Employee[]).map((employee: Employee) => (
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
              data-testid="button-generate-report"
            >
              <Download className="h-4 w-4 mr-2" />
              Generar Informe ({selectedEmployees.length} seleccionats)
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

      {/* Weekly Detailed Report Modal */}
      <Dialog open={showWeeklyDetailModal} onOpenChange={setShowWeeklyDetailModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informe Setmanal Detallat
            </DialogTitle>
            <DialogDescription>
              Llista d'usuaris amb comparació entre fitxatges reals i horaris previstos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {weeklyLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Carregant dades dels empleats...</p>
              </div>
            )}
            
            {/* Employee List */}
            <div className="grid gap-4">
              {(weeklyData as any[]).map((employee: any) => (
                <Card 
                  key={employee.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedUserForDetail(employee.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{employee.firstName} {employee.lastName}</h3>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={employee.totalAttendance > 0 ? "default" : "secondary"}>
                          {employee.totalAttendance || 0} fitxatges
                        </Badge>
                        <Badge variant={employee.scheduledHours > 0 ? "outline" : "secondary"}>
                          {employee.scheduledHours || 0}h previstes
                        </Badge>
                        {employee.complianceRate !== undefined && (
                          <Badge 
                            variant={employee.complianceRate >= 80 ? "default" : 
                                   employee.complianceRate >= 60 ? "secondary" : "destructive"}
                          >
                            {employee.complianceRate}% compliment
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      {['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'].map((day, index) => {
                        const dayData = employee.weeklyDetails?.[index];
                        return (
                          <div key={day} className="text-center">
                            <div className="font-medium">{day}</div>
                            <div className={`mt-1 p-1 rounded text-xs ${
                              dayData?.status === 'present' ? 'bg-green-100 text-green-800' :
                              dayData?.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                              dayData?.status === 'absent' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {dayData?.status === 'present' ? 'Present' :
                               dayData?.status === 'late' ? 'Retard' :
                               dayData?.status === 'absent' ? 'Absent' : 'Sense dades'}
                            </div>
                            {dayData?.actualHours && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {dayData.actualHours}h / {dayData.scheduledHours || 0}h
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {!weeklyLoading && weeklyData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hi ha dades d'empleats disponibles</p>
                <p className="text-sm">Verifiqueu que hi hagi empleats registrats al sistema</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* User Detail Modal */}
      {selectedUserForDetail && (
        <WeeklyScheduleModal 
          userId={selectedUserForDetail} 
          onClose={() => setSelectedUserForDetail(null)} 
        />
      )}
    </div>
  );
}

export default ReportsManagement;