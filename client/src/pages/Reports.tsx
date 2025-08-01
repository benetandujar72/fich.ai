import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { t } from "@/lib/i18n";
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
  Shield
} from "lucide-react";

export default function Reports() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const permissions = usePermissions();
  
  const [reportType, setReportType] = useState("general_attendance");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const handleGenerateReport = () => {
    // This would integrate with the backend to generate reports
    console.log("Generating report:", { reportType, startDate, endDate });
  };

  const handleExportCSV = () => {
    // This would export data as CSV
    console.log("Exporting CSV");
  };

  const handleExportPDF = () => {
    // This would export data as PDF
    console.log("Exporting PDF");
  };

  const keyMetrics = [
    {
      title: language === "ca" ? "Taxa d'assistència" : "Tasa de asistencia",
      value: "94.2%",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
      testId: "metric-attendance-rate"
    },
    {
      title: language === "ca" ? "Mitjana hores/dia" : "Media horas/día",
      value: "8.3",
      icon: Clock,
      color: "text-accent",
      bgColor: "bg-accent/10",
      testId: "metric-average-hours"
    },
    {
      title: language === "ca" ? "Retards aquest mes" : "Retrasos este mes",
      value: "12",
      icon: AlertTriangle,
      color: "text-error",
      bgColor: "bg-error/10",
      testId: "metric-monthly-lates"
    },
    {
      title: language === "ca" ? "Guàrdies cobertes" : "Guardias cubiertas",
      value: "45",
      icon: Shield,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      testId: "metric-covered-duties"
    },
  ];

  return (
    <main className="p-6 space-y-6">
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
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {language === "ca" ? "Generar informe" : "Generar informe"}
            </Button>
            
            <Button 
              onClick={handleExportCSV}
              className="bg-secondary text-white hover:bg-green-700"
              data-testid="export-csv-button"
            >
              <FileText className="mr-2 h-4 w-4" />
              {language === "ca" ? "Exportar CSV" : "Exportar CSV"}
            </Button>
            
            <Button 
              onClick={handleExportPDF}
              className="bg-error text-white hover:bg-red-700"
              data-testid="export-pdf-button"
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
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {language === "ca" ? "Gràfic d'assistència mensual" : "Gráfico de asistencia mensual"}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {language === "ca" ? "(Implementar amb Chart.js)" : "(Implementar con Chart.js)"}
                </p>
              </div>
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
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {language === "ca" ? "Gràfic comparatiu departaments" : "Gráfico comparativo departamentos"}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {language === "ca" ? "(Implementar amb Chart.js)" : "(Implementar con Chart.js)"}
                </p>
              </div>
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
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {language === "ca" ? "Gràfic de tendències mensuals" : "Gráfico de tendencias mensuales"}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {language === "ca" ? "(Implementar amb Chart.js)" : "(Implementar con Chart.js)"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
