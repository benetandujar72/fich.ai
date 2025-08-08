import React, { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  BarChart3, 
  FileText, 
  Download, 
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  LoaderIcon,
  FileDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();
  
  // Estados simplificados
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>(["general_attendance"]);
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-01-31");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

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

  // Manejar selección de tipos de informe (checkboxes)
  const handleReportTypeToggle = (reportType: string) => {
    console.log("🔄 Toggling report type:", reportType);
    setSelectedReportTypes(prev => {
      const newTypes = prev.includes(reportType) 
        ? prev.filter(type => type !== reportType)
        : [...prev, reportType];
      console.log("📊 Selected report types:", newTypes);
      return newTypes;
    });
  };

  // Generar informe simplificado
  const handleGenerateReport = async () => {
    console.log("🚀 Starting report generation");
    console.log("📋 User:", user?.id, "Institution:", user?.institutionId);
    console.log("📅 Date range:", startDate, "to", endDate);
    console.log("📊 Selected types:", selectedReportTypes);

    if (!user?.institutionId || !startDate || !endDate || selectedReportTypes.length === 0) {
      console.error("❌ Missing required data");
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: language === "ca" ? "Falten dades necessàries" : "Faltan datos necesarios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("🔄 Fetching overview data...");
      const params = new URLSearchParams({
        startDate,
        endDate
      });
      
      const url = `/api/reports/overview/${user.institutionId}?${params.toString()}`;
      console.log("🌐 Request URL:", url);
      
      const response = await fetch(url, { credentials: 'include' });
      console.log("📡 Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Report data received:", data);
        setReportData(data);
        
        toast({
          title: language === "ca" ? "Informe generat" : "Informe generado",
          description: language === "ca" ? "Les dades s'han carregat correctament" : "Los datos se han cargado correctamente",
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }

    } catch (error) {
      console.error('❌ Error generating report:', error);
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: language === "ca" ? "No s'ha pogut generar l'informe" : "No se pudo generar el informe",
        variant: "destructive",
      });
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Exportar CSV simplificado
  const handleExportCSV = async () => {
    console.log("📄 Starting CSV export");
    
    if (!user?.institutionId || !startDate || !endDate || selectedReportTypes.length === 0) {
      console.error("❌ Missing data for CSV export");
      return;
    }
    
    setIsExporting(true);
    try {
      // Exportar solo el primer tipo seleccionado por simplicidad
      const reportType = selectedReportTypes[0];
      console.log("📊 Exporting type:", reportType);
      
      const params = new URLSearchParams({
        reportType,
        startDate,
        endDate
      });
      
      const url = `/api/reports/export/csv/${user.institutionId}?${params.toString()}`;
      console.log("🌐 CSV URL:", url);
      
      const response = await fetch(url, { credentials: 'include' });
      console.log("📡 CSV Response:", response.status);
      
      if (!response.ok) throw new Error(`Export failed: ${response.status}`);
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `report_${reportType}_${startDate}_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log("✅ CSV downloaded successfully");
      toast({
        title: language === "ca" ? "CSV exportat" : "CSV exportado",
        description: language === "ca" ? "L'informe s'ha descarregat" : "El informe se ha descargado",
      });
    } catch (error) {
      console.error("❌ CSV export error:", error);
      toast({
        title: language === "ca" ? "Error CSV" : "Error CSV",
        description: language === "ca" ? "No s'ha pogut exportar" : "No se pudo exportar",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar PDF simplificado (próximamente)
  const handleExportPDF = () => {
    console.log("📄 PDF export requested");
    toast({
      title: language === "ca" ? "PDF" : "PDF",
      description: language === "ca" ? "Funcionalitat disponible aviat" : "Funcionalidad disponible pronto",
    });
  };

  return (
    <main className="p-6 space-y-6" data-testid="reports-container">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language === "ca" ? "Informes i Anàlisis" : "Informes y Análisis"}
        </h1>
        <p className="text-gray-600">
          {language === "ca" 
            ? "Genera informes detallats de l'assistència i exporta-los en diferents formats"
            : "Genera informes detallados de asistencia y expórtalos en diferentes formatos"
          }
        </p>
      </header>

      {/* Configuration Card */}
      <Card data-testid="report-config-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {language === "ca" ? "Configuració de l'informe" : "Configuración del informe"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Selection with Checkboxes */}
          <div>
            <Label className="text-base font-medium mb-3 block">
              {language === "ca" ? "Tipus d'informes" : "Tipos de informes"}
            </Label>
            <div className="space-y-3">
              {reportTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.value}
                    checked={selectedReportTypes.includes(type.value)}
                    onCheckedChange={() => handleReportTypeToggle(type.value)}
                    data-testid={`checkbox-${type.value}`}
                  />
                  <Label 
                    htmlFor={type.value}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              disabled={isLoading || !user?.institutionId || !startDate || !endDate || selectedReportTypes.length === 0}
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
              disabled={isExporting || !reportData || selectedReportTypes.length === 0}
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
              className="border-red-200 text-red-600 hover:bg-red-50"
              data-testid="export-pdf-button"
              disabled={!reportData}
            >
              <FileDown className="mr-2 h-4 w-4" />
              {language === "ca" ? "Exportar PDF" : "Exportar PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <Card data-testid="report-results-card">
          <CardHeader>
            <CardTitle>
              {language === "ca" ? "Resultats de l'informe" : "Resultados del informe"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <TrendingUp className="text-green-600 h-6 w-6" />
                </div>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {reportData.attendanceRate ? `${reportData.attendanceRate.toFixed(1)}%` : "--"}
                </p>
                <p className="text-sm text-gray-600">
                  {language === "ca" ? "Taxa d'assistència" : "Tasa de asistencia"}
                </p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <Clock className="text-blue-600 h-6 w-6" />
                </div>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {reportData.averageHoursPerDay ? `${reportData.averageHoursPerDay.toFixed(1)}` : "--"}
                </p>
                <p className="text-sm text-gray-600">
                  {language === "ca" ? "Mitjana hores/dia" : "Media horas/día"}
                </p>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <AlertTriangle className="text-orange-600 h-6 w-6" />
                </div>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {reportData.totalLatesThisMonth || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {language === "ca" ? "Retards aquest mes" : "Retrasos este mes"}
                </p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <Users className="text-purple-600 h-6 w-6" />
                </div>
                <p className="text-xl font-bold text-gray-900 mb-1">
                  {reportData.totalEmployees || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {language === "ca" ? "Total empleats" : "Total empleados"}
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">
                {language === "ca" ? "Informació del període" : "Información del período"}
              </h3>
              <p className="text-sm text-gray-600">
                {language === "ca" ? "Període:" : "Período:"} {startDate} - {endDate}
              </p>
              <p className="text-sm text-gray-600">
                {language === "ca" ? "Tipus seleccionats:" : "Tipos seleccionados:"} {selectedReportTypes.map(type => 
                  reportTypes.find(rt => rt.value === type)?.label || type
                ).join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!reportData && !isLoading && (
        <Card className="text-center p-12" data-testid="empty-state-card">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === "ca" ? "Cap informe generat" : "Ningún informe generado"}
          </h3>
          <p className="text-gray-600">
            {language === "ca" 
              ? "Selecciona els tipus d'informes i fes clic a 'Generar informe' per començar"
              : "Selecciona los tipos de informes y haz clic en 'Generar informe' para comenzar"
            }
          </p>
        </Card>
      )}
    </main>
  );
}