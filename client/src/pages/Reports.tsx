import React, { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  FileText, 
  Download, 
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  LoaderIcon
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();
  
  // Estado simple sin cálculos complejos
  const [reportType, setReportType] = useState("general_attendance");
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-01-31");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);

  // Estados de datos
  const [overviewData, setOverviewData] = useState<any>(null);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [attendanceRates, setAttendanceRates] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Verificar si es admin
  const isAdmin = permissions.canViewEmployees || permissions.canGenerateInstitutionReports;

  const reportTypes = [
    { 
      value: "general_attendance", 
      label: language === "ca" ? "Assistència general" : "Asistencia general" 
    },
    { 
      value: "late_absences", 
      label: language === "ca" ? "Retards i absències" : "Retrasos y ausencias" 
    },
    { 
      value: "worked_hours", 
      label: language === "ca" ? "Hores treballades" : "Horas trabajadas" 
    },
  ];

  // Cargar empleados
  const handleLoadEmployees = async () => {
    if (!isAdmin || !user?.institutionId || employeesLoaded) return;
    
    try {
      const response = await fetch(`/api/employees?institutionId=${user.institutionId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : [] as any[]);
        setEmployeesLoaded(true);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  // Generar informe
  const handleGenerateReport = async () => {
    if (!user?.institutionId || !startDate || !endDate) {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: language === "ca" ? "Falten dades necessàries" : "Faltan datos necesarios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (isAdmin && !employeesLoaded) {
        await handleLoadEmployees();
      }

      const targetEmployeeId = isAdmin && selectedEmployeeId ? selectedEmployeeId : user.id;

      // 1. Cargar datos de resumen
      try {
        const overviewParams = new URLSearchParams({
          startDate,
          endDate,
          ...(targetEmployeeId && { employeeId: targetEmployeeId })
        });
        const overviewUrl = `/api/reports/overview/${user.institutionId}?${overviewParams.toString()}`;
        const overviewResponse = await fetch(overviewUrl, { credentials: 'include' });
        const overviewResult = overviewResponse.ok ? await overviewResponse.json() : null;
        setOverviewData(overviewResult);
      } catch (error) {
        console.error('Error loading overview:', error);
        setOverviewData(null);
      }

      // 2. Cargar datos de departamentos (solo para admins)
      if (isAdmin) {
        try {
          const deptParams = new URLSearchParams({ startDate, endDate });
          const deptUrl = `/api/reports/department-comparison/${user.institutionId}?${deptParams.toString()}`;
          const deptResponse = await fetch(deptUrl, { credentials: 'include' });
          const deptResult = deptResponse.ok ? await deptResponse.json() : [];
          setDepartmentData(Array.isArray(deptResult) ? deptResult : [] as any[]);
        } catch (error) {
          console.error('Error loading departments:', error);
          setDepartmentData([] as any[]);
        }
      } else {
        setDepartmentData([]);
      }

      // 3. Cargar tendencias mensuales
      try {
        const trendsParams = new URLSearchParams({
          ...(targetEmployeeId && { employeeId: targetEmployeeId })
        });
        const trendsUrl = `/api/reports/monthly-trends/${user.institutionId}${trendsParams.toString() ? '?' + trendsParams.toString() : ''}`;
        const trendsResponse = await fetch(trendsUrl, { credentials: 'include' });
        const trendsResult = trendsResponse.ok ? await trendsResponse.json() : [];
        setMonthlyTrends(Array.isArray(trendsResult) ? trendsResult : [] as any[]);
      } catch (error) {
        console.error('Error loading trends:', error);
        setMonthlyTrends([] as any[]);
      }

      // 4. Cargar tasas de asistencia
      try {
        const ratesParams = new URLSearchParams({
          startDate,
          endDate,
          ...(targetEmployeeId && { employeeId: targetEmployeeId })
        });
        const ratesUrl = `/api/reports/attendance-rates/${user.institutionId}?${ratesParams.toString()}`;
        const ratesResponse = await fetch(ratesUrl, { credentials: 'include' });
        const ratesResult = ratesResponse.ok ? await ratesResponse.json() : [];
        setAttendanceRates(Array.isArray(ratesResult) ? ratesResult : [] as any[]);
      } catch (error) {
        console.error('Error loading attendance rates:', error);
        setAttendanceRates([] as any[]);
      }

      toast({
        title: language === "ca" ? "Informe generat" : "Informe generado",
        description: language === "ca" ? "Les dades s'han carregat correctament" : "Los datos se han cargado correctamente",
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: language === "ca" ? "No s'ha pogut generar l'informe" : "No se pudo generar el informe",
        variant: "destructive",
      });
      
      setOverviewData(null);
      setDepartmentData([] as any[]);
      setMonthlyTrends([] as any[]);
      setAttendanceRates([] as any[]);
    } finally {
      setIsLoading(false);
    }
  };

  // Exportar CSV
  const handleExportCSV = async () => {
    if (!user?.institutionId || !startDate || !endDate) return;
    
    setIsExporting(true);
    try {
      const targetEmployeeId = isAdmin && selectedEmployeeId ? selectedEmployeeId : user.id;
      const params = new URLSearchParams({
        reportType,
        startDate,
        endDate,
        ...(targetEmployeeId && { employeeId: targetEmployeeId })
      });
      
      const url = `/api/reports/export/csv/${user.institutionId}?${params.toString()}`;
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `report_${reportType}_${startDate}_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: language === "ca" ? "CSV exportat" : "CSV exportado",
        description: language === "ca" ? "L'informe s'ha descarregat correctament" : "El informe se ha descargado correctamente",
      });
    } catch (error) {
      toast({
        title: language === "ca" ? "Error d'exportació" : "Error de exportación",
        description: language === "ca" ? "No s'ha pogut exportar l'informe" : "No se pudo exportar el informe",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="p-6 space-y-6" data-testid="reports-container">
      {/* Report Generator */}
      <Card data-testid="report-generator-card">
        <CardHeader>
          <CardTitle>
            {language === "ca" ? "Generador d'informes" : "Generador de informes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <Label htmlFor="report-type">
                {language === "ca" ? "Tipus d'informe" : "Tipo de informe"}
              </Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type" data-testid="report-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee selector - only for admins */}
            {isAdmin && (
              <div>
                <Label htmlFor="employee-select">
                  {language === "ca" ? "Empleat (opcional)" : "Empleado (opcional)"}
                </Label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger 
                    id="employee-select" 
                    data-testid="employee-select"
                    onClick={handleLoadEmployees}
                  >
                    <SelectValue placeholder={language === "ca" ? "Tots els empleats" : "Todos los empleados"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{language === "ca" ? "Tots els empleats" : "Todos los empleados"}</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="start-date">
                {language === "ca" ? "Data inici" : "Fecha inicio"}
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="start-date-input"
              />
            </div>
            
            <div>
              <Label htmlFor="end-date">
                {language === "ca" ? "Data fi" : "Fecha fin"}
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="end-date-input"
              />
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <Button 
              onClick={handleGenerateReport}
              className="bg-blue-600 text-white hover:bg-blue-700"
              data-testid="generate-report-button"
              disabled={isLoading || !user?.institutionId || !startDate || !endDate}
            >
              {isLoading ? (
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="mr-2 h-4 w-4" />
              )}
              {language === "ca" ? "Generar informe" : "Generar informe"}
            </Button>
            
            <Button 
              onClick={handleExportCSV}
              variant="outline"
              data-testid="export-csv-button"
              disabled={isExporting || !overviewData}
            >
              {isExporting ? (
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              {language === "ca" ? "Exportar CSV" : "Exportar CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics - only show when data is loaded */}
      {overviewData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center" data-testid="metric-attendance-rate">
            <CardContent className="p-6">
              <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
                <TrendingUp className="text-green-600 h-8 w-8" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {overviewData.attendanceRate ? `${overviewData.attendanceRate.toFixed(1)}%` : "--"}
              </p>
              <p className="text-sm text-gray-600">
                {language === "ca" ? "Taxa d'assistència" : "Tasa de asistencia"}
              </p>
            </CardContent>
          </Card>

          <Card className="text-center" data-testid="metric-average-hours">
            <CardContent className="p-6">
              <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-3">
                <Clock className="text-blue-600 h-8 w-8" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {overviewData.averageHoursPerDay ? `${overviewData.averageHoursPerDay.toFixed(1)}` : "--"}
              </p>
              <p className="text-sm text-gray-600">
                {language === "ca" ? "Mitjana hores/dia" : "Media horas/día"}
              </p>
            </CardContent>
          </Card>

          <Card className="text-center" data-testid="metric-monthly-lates">
            <CardContent className="p-6">
              <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-3">
                <AlertTriangle className="text-orange-600 h-8 w-8" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {overviewData.totalLatesThisMonth || 0}
              </p>
              <p className="text-sm text-gray-600">
                {language === "ca" ? "Retards aquest mes" : "Retrasos este mes"}
              </p>
            </CardContent>
          </Card>

          <Card className="text-center" data-testid="metric-total-employees">
            <CardContent className="p-6">
              <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-3">
                <Users className="text-purple-600 h-8 w-8" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {overviewData.totalEmployees || 0}
              </p>
              <p className="text-sm text-gray-600">
                {language === "ca" ? "Total empleats" : "Total empleados"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts - only show when data is loaded */}
      {overviewData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Overview */}
          <Card data-testid="attendance-overview-card">
            <CardHeader>
              <CardTitle>
                {language === "ca" ? "Resum d'assistència" : "Resumen de asistencia"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {attendanceRates.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceRates}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#22c55e" name={language === "ca" ? "Presents" : "Presentes"} />
                      <Bar dataKey="late" fill="#f59e0b" name={language === "ca" ? "Retards" : "Retrasos"} />
                      <Bar dataKey="absent" fill="#ef4444" name={language === "ca" ? "Absents" : "Ausentes"} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <p>{language === "ca" ? "No hi ha dades d'assistència" : "No hay datos de asistencia"}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Department Comparison - only for admins */}
          {isAdmin && (
            <Card data-testid="department-comparison-card">
              <CardHeader>
                <CardTitle>
                  {language === "ca" ? "Comparativa per departaments" : "Comparativa por departamentos"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {departmentData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="departmentName" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="attendanceRate" fill="#3b82f6" name={language === "ca" ? "Taxa assistència (%)" : "Tasa asistencia (%)"} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                        <p>{language === "ca" ? "No hi ha dades de departaments" : "No hay datos de departamentos"}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Trends */}
          <Card data-testid="monthly-trends-card" className={isAdmin ? "" : "lg:col-span-2"}>
            <CardHeader>
              <CardTitle>
                {language === "ca" ? "Tendències mensuals" : "Tendencias mensuales"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {monthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="attendanceRate" stroke="#3b82f6" name={language === "ca" ? "Taxa assistència (%)" : "Tasa asistencia (%)"} />
                      <Line type="monotone" dataKey="lateCount" stroke="#f59e0b" name={language === "ca" ? "Retards" : "Retrasos"} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                      <p>{language === "ca" ? "No hi ha dades de tendències" : "No hay datos de tendencias"}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state when no data loaded */}
      {!overviewData && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {language === "ca" ? "No s'han carregat informes" : "No se han cargado informes"}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === "ca" ? "Selecciona les dades i fes clic a 'Generar informe'" : "Selecciona los datos y haz clic en 'Generar informe'"}
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}