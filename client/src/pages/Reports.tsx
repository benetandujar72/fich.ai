import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { apiRequest } from "@/lib/queryClient";
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
  Calendar,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  Shield,
  LoaderIcon
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();
  
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

  // Get institution ID from authenticated user
  const institutionId = user?.institutionId;

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
    { 
      value: "substitute_duties", 
      label: language === "ca" ? "Guàrdies realitzades" : "Guardias realizadas" 
    },
  ];

  // Fetch reports data
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/reports/overview', institutionId, startDate, endDate],
    enabled: !!institutionId && !!startDate && !!endDate,
  });

  const { data: departmentData, isLoading: departmentLoading } = useQuery({
    queryKey: ['/api/reports/department-comparison', institutionId, startDate, endDate],
    enabled: !!institutionId && !!startDate && !!endDate,
  });

  const { data: monthlyTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/reports/monthly-trends', institutionId],
    enabled: !!institutionId,
  });

  const { data: attendanceRates, isLoading: ratesLoading } = useQuery({
    queryKey: ['/api/reports/attendance-rates', institutionId, startDate, endDate],
    enabled: !!institutionId && !!startDate && !!endDate,
  });

  // CSV Export mutation
  const csvExportMutation = useMutation({
    mutationFn: async () => {
      if (!institutionId || !startDate || !endDate) {
        throw new Error('Missing required parameters');
      }
      const url = `/api/reports/export/csv/${institutionId}?reportType=${reportType}&startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `report_${reportType}_${startDate}_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Exportació completada" : "Exportación completada",
        description: language === "ca" ? "L'informe CSV s'ha descarregat correctament" : "El informe CSV se ha descargado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: language === "ca" ? "Error d'exportació" : "Error de exportación",
        description: language === "ca" ? "No s'ha pogut descarregar l'informe" : "No se pudo descargar el informe",
        variant: "destructive",
      });
    },
  });

  const handleGenerateReport = () => {
    // Refresh all data by refetching
    window.location.reload();
  };

  const handleExportCSV = () => {
    csvExportMutation.mutate();
  };

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
        description: language === "ca" ? "L'informe PDF s'ha descarregat correctament" : "El informe PDF se ha descargado correctamente",
      });
    } catch (error) {
      toast({
        title: language === "ca" ? "Error de PDF" : "Error de PDF",
        description: language === "ca" ? "No s'ha pogut generar el PDF" : "No se pudo generar el PDF",
        variant: "destructive",
      });
    }
  };

  // Calculate key metrics from real data
  const keyMetrics = [
    {
      title: language === "ca" ? "Taxa d'assistència" : "Tasa de asistencia",
      value: overviewLoading ? "--" : `${overviewData?.attendanceRate?.toFixed(1) || 0}%`,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
      testId: "metric-attendance-rate"
    },
    {
      title: language === "ca" ? "Mitjana hores/dia" : "Media horas/día",
      value: overviewLoading ? "--" : `${overviewData?.averageHoursPerDay?.toFixed(1) || 0}`,
      icon: Clock,
      color: "text-accent",
      bgColor: "bg-accent/10",
      testId: "metric-average-hours"
    },
    {
      title: language === "ca" ? "Retards aquest mes" : "Retrasos este mes",
      value: overviewLoading ? "--" : `${overviewData?.totalLatesThisMonth || 0}`,
      icon: AlertTriangle,
      color: "text-error",
      bgColor: "bg-error/10",
      testId: "metric-monthly-lates"
    },
    {
      title: language === "ca" ? "Total empleats" : "Total empleados",
      value: overviewLoading ? "--" : `${overviewData?.totalEmployees || 0}`,
      icon: Users,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      testId: "metric-total-employees"
    },
  ];

  // Show loading state
  if (overviewLoading && departmentLoading && trendsLoading) {
    return (
      <main className="p-6 space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <LoaderIcon className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">
              {language === "ca" ? "Carregant informes..." : "Cargando informes..."}
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              className="bg-primary text-white hover:bg-blue-700"
              data-testid="generate-report-button"
              disabled={!institutionId || !startDate || !endDate}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {language === "ca" ? "Actualitzar dades" : "Actualizar datos"}
            </Button>
            
            <Button 
              onClick={handleExportCSV}
              className="bg-secondary text-white hover:bg-green-700"
              data-testid="export-csv-button"
              disabled={csvExportMutation.isPending || !institutionId || !startDate || !endDate}
            >
              {csvExportMutation.isPending ? (
                <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              {language === "ca" ? "Exportar CSV" : "Exportar CSV"}
            </Button>
            
            <Button 
              onClick={handleExportPDF}
              className="bg-error text-white hover:bg-red-700"
              data-testid="export-pdf-button"
              disabled={!institutionId || !startDate || !endDate}
            >
              <Download className="mr-2 h-4 w-4" />
              {language === "ca" ? "Exportar PDF" : "Exportar PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Dashboard */}
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
              {ratesLoading ? (
                <div className="h-full flex items-center justify-center">
                  <LoaderIcon className="h-8 w-8 animate-spin" />
                </div>
              ) : attendanceRates && attendanceRates.length > 0 ? (
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
                    <PieChart className="h-12 w-12 mx-auto mb-2" />
                    <p>{language === "ca" ? "No hi ha dades disponibles" : "No hay datos disponibles"}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Department Comparison */}
        <Card data-testid="department-comparison-card">
          <CardHeader>
            <CardTitle>
              {language === "ca" ? "Comparativa per departaments" : "Comparativa por departamentos"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {departmentLoading ? (
                <div className="h-full flex items-center justify-center">
                  <LoaderIcon className="h-8 w-8 animate-spin" />
                </div>
              ) : departmentData && departmentData.length > 0 ? (
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric) => (
          <Card key={metric.title} className="text-center" data-testid={metric.testId}>
            <CardContent className="p-6">
              <div className={`${metric.bgColor} p-3 rounded-full w-fit mx-auto mb-3`}>
                <metric.icon className={`${metric.color} h-8 w-8`} />
              </div>
              <p className="text-2xl font-bold text-text mb-1">{metric.value}</p>
              <p className="text-sm text-gray-600">{metric.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report History */}
      <Card data-testid="report-history-card">
        <CardHeader>
          <CardTitle>
            {language === "ca" ? "Historial d'informes" : "Historial de informes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Empty state */}
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                {language === "ca" ? "No s'han generat informes encara" : "No se han generado informes aún"}
              </p>
              <p className="text-sm text-gray-500">
                {language === "ca" 
                  ? "Els informes generats apareixeran aquí per a la seva descàrrega"
                  : "Los informes generados aparecerán aquí para su descarga"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card data-testid="monthly-trends-card">
        <CardHeader>
          <CardTitle>
            {language === "ca" ? "Tendències mensuals" : "Tendencias mensuales"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {trendsLoading ? (
              <div className="h-full flex items-center justify-center">
                <LoaderIcon className="h-8 w-8 animate-spin" />
              </div>
            ) : monthlyTrends && monthlyTrends.length > 0 ? (
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
    </main>
  );
}