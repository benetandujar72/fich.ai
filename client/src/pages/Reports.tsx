import { useState } from "react";
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
  PieChart, 
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

interface ReportData {
  overview: {
    totalEmployees: number;
    attendanceRate: number;
    averageHoursPerDay: number;
    totalLatesThisMonth: number;
    totalAbsencesThisMonth: number;
  } | null;
  departmentData: Array<{
    departmentName: string;
    attendanceRate: number;
    employeeCount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    attendanceRate: number;
    lateCount: number;
  }>;
  attendanceRates: Array<{
    date: string;
    present: number;
    late: number;
    absent: number;
  }>;
}

export default function Reports() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();
  
  // Form state
  const [reportType, setReportType] = useState("general_attendance");
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.toISOString().split('T')[0];
  });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  // Data state
  const [reportData, setReportData] = useState<ReportData>({
    overview: null,
    departmentData: [],
    monthlyTrends: [],
    attendanceRates: []
  });
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [employeesLoaded, setEmployeesLoaded] = useState(false);

  // Determine if user can see all employees (admin/superadmin)
  const canViewAllEmployees = permissions.canViewEmployees || permissions.canGenerateInstitutionReports;

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

  // Load employees list for admin users (only when needed)
  const loadEmployees = async () => {
    if (!canViewAllEmployees || !user?.institutionId || employeesLoaded) return;
    
    try {
      const response = await fetch(`/api/employees?institutionId=${user.institutionId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
      setEmployeesLoaded(true);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  // Generate report - ONLY MANUAL TRIGGER
  const generateReport = async () => {
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
      // Load employees if needed and not loaded
      if (canViewAllEmployees && !employeesLoaded) {
        await loadEmployees();
      }

      // Determine target employee
      const targetEmployeeId = canViewAllEmployees && selectedEmployeeId ? selectedEmployeeId : user.id;
      const employeeParam = targetEmployeeId ? `?employeeId=${targetEmployeeId}` : '';

      // Fetch overview data
      const overviewUrl = `/api/reports/overview/${user.institutionId}/${startDate}/${endDate}${employeeParam}`;
      const overviewResponse = await fetch(overviewUrl, { credentials: 'include' });
      const overview = overviewResponse.ok ? await overviewResponse.json() : null;

      // Fetch department data (only for admins)
      let departmentData = [];
      if (canViewAllEmployees) {
        const deptUrl = `/api/reports/department-comparison/${user.institutionId}/${startDate}/${endDate}`;
        const deptResponse = await fetch(deptUrl, { credentials: 'include' });
        departmentData = deptResponse.ok ? await deptResponse.json() : [];
      }

      // Fetch monthly trends
      const trendsUrl = `/api/reports/monthly-trends/${user.institutionId}${employeeParam}`;
      const trendsResponse = await fetch(trendsUrl, { credentials: 'include' });
      const monthlyTrends = trendsResponse.ok ? await trendsResponse.json() : [];

      // Fetch attendance rates
      const ratesUrl = `/api/reports/attendance-rates/${user.institutionId}/${startDate}/${endDate}${employeeParam}`;
      const ratesResponse = await fetch(ratesUrl, { credentials: 'include' });
      const attendanceRates = ratesResponse.ok ? await ratesResponse.json() : [];

      // Update state with fetched data
      setReportData({
        overview,
        departmentData: Array.isArray(departmentData) ? departmentData : [],
        monthlyTrends: Array.isArray(monthlyTrends) ? monthlyTrends : [],
        attendanceRates: Array.isArray(attendanceRates) ? attendanceRates : []
      });

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
      // Reset data on error
      setReportData({
        overview: null,
        departmentData: [],
        monthlyTrends: [],
        attendanceRates: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    if (!user?.institutionId || !startDate || !endDate) return;
    
    setIsExporting(true);
    try {
      const targetEmployeeId = canViewAllEmployees && selectedEmployeeId ? selectedEmployeeId : user.id;
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

  // Export PDF
  const handleExportPDF = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      
      const element = document.querySelector('[data-testid="reports-container"]');
      if (!element) return;
      
      const canvas = await html2canvas(element as HTMLElement);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`report_${reportType}_${startDate}_${endDate}.pdf`);
      
      toast({
        title: language === "ca" ? "PDF generat" : "PDF generado",
        description: language === "ca" ? "L'informe PDF s'ha descarregat" : "El informe PDF se ha descargado",
      });
    } catch (error) {
      toast({
        title: language === "ca" ? "Error de PDF" : "Error de PDF",
        description: language === "ca" ? "No s'ha pogut generar el PDF" : "No se pudo generar el PDF",
        variant: "destructive",
      });
    }
  };

  // Key metrics
  const keyMetrics = [
    {
      title: language === "ca" ? "Taxa d'assistència" : "Tasa de asistencia",
      value: reportData.overview ? `${reportData.overview.attendanceRate.toFixed(1)}%` : "--",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
      testId: "metric-attendance-rate"
    },
    {
      title: language === "ca" ? "Mitjana hores/dia" : "Media horas/día",
      value: reportData.overview ? `${reportData.overview.averageHoursPerDay.toFixed(1)}` : "--",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      testId: "metric-average-hours"
    },
    {
      title: language === "ca" ? "Retards aquest mes" : "Retrasos este mes",
      value: reportData.overview ? `${reportData.overview.totalLatesThisMonth}` : "--",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      testId: "metric-monthly-lates"
    },
    {
      title: language === "ca" ? "Total empleats" : "Total empleados",
      value: reportData.overview ? `${reportData.overview.totalEmployees}` : "--",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      testId: "metric-total-employees"
    },
  ];

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

            {/* Employee selector - only for users who can view all employees */}
            {canViewAllEmployees && (
              <div>
                <Label htmlFor="employee-select">
                  {language === "ca" ? "Empleat (opcional)" : "Empleado (opcional)"}
                </Label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger id="employee-select" data-testid="employee-select" onClick={loadEmployees}>
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
              onClick={generateReport}
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
              disabled={isExporting || !reportData.overview}
            >
              {isExporting ? (
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              {language === "ca" ? "Exportar CSV" : "Exportar CSV"}
            </Button>
            
            <Button 
              onClick={handleExportPDF}
              variant="outline"
              data-testid="export-pdf-button"
              disabled={!reportData.overview}
            >
              <Download className="mr-2 h-4 w-4" />
              {language === "ca" ? "Exportar PDF" : "Exportar PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics - only show when data is loaded */}
      {reportData.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {keyMetrics.map((metric) => (
            <Card key={metric.title} className="text-center" data-testid={metric.testId}>
              <CardContent className="p-6">
                <div className={`${metric.bgColor} p-3 rounded-full w-fit mx-auto mb-3`}>
                  <metric.icon className={`${metric.color} h-8 w-8`} />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
                <p className="text-sm text-gray-600">{metric.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts - only show when data is loaded */}
      {reportData.overview && (
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
                {reportData.attendanceRates.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.attendanceRates}>
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
                      <PieChart className="h-12 w-12 mx-auto mb-2" />
                      <p>{language === "ca" ? "No hi ha dades d'assistència" : "No hay datos de asistencia"}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Department Comparison - only for users who can view all employees */}
          {canViewAllEmployees && (
            <Card data-testid="department-comparison-card">
              <CardHeader>
                <CardTitle>
                  {language === "ca" ? "Comparativa per departaments" : "Comparativa por departamentos"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {reportData.departmentData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.departmentData}>
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
          <Card data-testid="monthly-trends-card" className={canViewAllEmployees ? "" : "lg:col-span-2"}>
            <CardHeader>
              <CardTitle>
                {language === "ca" ? "Tendències mensuals" : "Tendencias mensuales"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {reportData.monthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.monthlyTrends}>
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
      {!reportData.overview && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {language === "ca" ? "No s'han carregat informes" : "No se han cargado informes"}
            </h3>
            <p className="text-gray-600 mb-6">
              {language === "ca" 
                ? "Selecciona les dates i fes clic a 'Generar informe' per veure les dades"
                : "Selecciona las fechas y haz clic en 'Generar informe' para ver los datos"}
            </p>
            <Button onClick={generateReport} disabled={!user?.institutionId || !startDate || !endDate}>
              <BarChart3 className="mr-2 h-4 w-4" />
              {language === "ca" ? "Generar primer informe" : "Generar primer informe"}
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}