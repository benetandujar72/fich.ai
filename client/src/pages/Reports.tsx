import React, { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  FileText, 
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  LoaderIcon,
  FileDown,
  Calendar,
  CheckCircle,
  XCircle,
  MinusCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

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
  const [detailedAttendance, setDetailedAttendance] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);

  // Debug effect to track state changes
  useEffect(() => {
    console.log("🔄 State changed - detailedAttendance:", detailedAttendance.length, "items");
    console.log("🔄 State changed - monthlyTrends:", monthlyTrends.length, "items");
  }, [detailedAttendance, monthlyTrends]);

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
    
    setSelectedReportTypes(prevTypes => {
      const isCurrentlySelected = prevTypes.includes(reportType);
      
      if (isCurrentlySelected) {
        // Solo permitir deseleccionar si hay más de un tipo seleccionado
        if (prevTypes.length > 1) {
          return prevTypes.filter(type => type !== reportType);
        } else {
          // Mantener al menos un tipo seleccionado
          console.log("⚠️ Keeping at least one type selected");
          return prevTypes;
        }
      } else {
        return [...prevTypes, reportType];
      }
    });
  };

  // Generar informe completo con datos detallados
  const handleGenerateReport = async () => {
    console.log("🚀 Starting comprehensive report generation");

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
      const params = new URLSearchParams({
        startDate,
        endDate
      });
      
      // Fetch overview data
      const overviewResponse = await fetch(`/api/reports/overview/${user.institutionId}?${params.toString()}`, { 
        credentials: 'include' 
      });
      
      // Fetch detailed attendance data
      const detailedResponse = await fetch(`/api/reports/detailed-attendance/${user.institutionId}?${params.toString()}`, { 
        credentials: 'include' 
      });
      
      // Fetch monthly trends
      const trendsResponse = await fetch(`/api/reports/monthly-trends/${user.institutionId}?months=6`, { 
        credentials: 'include' 
      });
      
      if (overviewResponse.ok && detailedResponse.ok && trendsResponse.ok) {
        const overviewData = await overviewResponse.json();
        const detailedData = await detailedResponse.json();
        const trendsData = await trendsResponse.json();
        
        console.log("✅ Overview data received:", overviewData);
        console.log("✅ Detailed attendance received:", detailedData.length, "records");
        console.log("✅ Monthly trends received:", trendsData.length, "months");
        console.log("📊 Setting states - detailed:", detailedData);
        console.log("📈 Setting states - trends:", trendsData);
        
        setReportData(overviewData);
        setDetailedAttendance(detailedData);
        setMonthlyTrends(trendsData);
        
        toast({
          title: language === "ca" ? "Informe generat" : "Informe generado",
          description: language === "ca" ? "Dades completes carregades amb èxit" : "Datos completos cargados con éxito",
        });
      } else {
        throw new Error("Failed to fetch some report data");
      }

    } catch (error) {
      console.error('❌ Error generating report:', error);
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: language === "ca" ? "No s'ha pogut generar l'informe" : "No se pudo generar el informe",
        variant: "destructive",
      });
      setReportData(null);
      setDetailedAttendance([]);
      setMonthlyTrends([]);
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
      const reportType = selectedReportTypes[0];
      const params = new URLSearchParams({
        reportType,
        startDate,
        endDate
      });
      
      const url = `/api/reports/export/csv/${user.institutionId}?${params.toString()}`;
      const response = await fetch(url, { credentials: 'include' });
      
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
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
              {reportTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-3 p-2 hover:bg-white rounded border-l-4 border-transparent hover:border-blue-400 transition-all">
                  <Checkbox
                    id={type.value}
                    checked={selectedReportTypes.includes(type.value)}
                    onCheckedChange={() => handleReportTypeToggle(type.value)}
                    data-testid={`checkbox-${type.value}`}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label 
                    htmlFor={type.value}
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {type.label}
                  </Label>
                  {selectedReportTypes.includes(type.value) && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {language === "ca" ? "Seleccionat" : "Seleccionado"}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {language === "ca" 
                ? `${selectedReportTypes.length} tipus seleccionats` 
                : `${selectedReportTypes.length} tipos seleccionados`
              }
            </p>
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
                onChange={(e) => {
                  console.log("📅 Start date changing to:", e.target.value);
                  setStartDate(e.target.value);
                }}
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
                onChange={(e) => {
                  console.log("📅 End date changing to:", e.target.value);
                  setEndDate(e.target.value);
                }}
                data-testid="end-date-input"
              />
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <Button 
              onClick={handleGenerateReport}
              className="bg-blue-600 text-white hover:bg-blue-700 relative"
              data-testid="generate-report-button"
              disabled={isLoading || !user?.institutionId || !startDate || !endDate || selectedReportTypes.length === 0}
              size="lg"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  {language === "ca" ? "Generant..." : "Generando..."}
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {language === "ca" ? "Generar informe" : "Generar informe"}
                </>
              )}
              {selectedReportTypes.length > 0 && !isLoading && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {selectedReportTypes.length}
                </span>
              )}
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

      {/* Loading State */}
      {isLoading && (
        <Card data-testid="loading-state-card">
          <CardContent className="p-12 text-center">
            <LoaderIcon className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === "ca" ? "Generant informe..." : "Generando informe..."}
            </h3>
            <p className="text-gray-600">
              {language === "ca" 
                ? "Processant les dades d'assistència. Això pot trigar uns segons."
                : "Procesando los datos de asistencia. Esto puede tardar unos segundos."
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Report Results */}
      {reportData && !isLoading && (
        <Card data-testid="report-results-card" className="border-green-200 bg-green-50/30">
          <CardHeader className="border-b border-green-200">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <TrendingUp className="h-5 w-5" />
              {language === "ca" ? "Resultats de l'informe" : "Resultados del informe"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <TrendingUp className="text-green-600 h-6 w-6" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {reportData.attendanceRate ? `${reportData.attendanceRate.toFixed(1)}%` : "0.0%"}
                </p>
                <p className="text-sm text-gray-600">
                  {language === "ca" ? "Taxa d'assistència" : "Tasa de asistencia"}
                </p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <Clock className="text-blue-600 h-6 w-6" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {reportData.averageHoursPerDay ? `${reportData.averageHoursPerDay.toFixed(1)}h` : "0.0h"}
                </p>
                <p className="text-sm text-gray-600">
                  {language === "ca" ? "Mitjana hores/dia" : "Media horas/día"}
                </p>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <AlertTriangle className="text-orange-600 h-6 w-6" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {reportData.totalLatesThisMonth || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {language === "ca" ? "Retards aquest mes" : "Retrasos este mes"}
                </p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-3">
                  <Users className="text-purple-600 h-6 w-6" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {reportData.totalEmployees || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {language === "ca" ? "Total empleats" : "Total empleados"}
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {language === "ca" ? "Informació del període" : "Información del período"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">
                    {language === "ca" ? "Període:" : "Período:"}
                  </span>
                  <br />
                  <span className="text-gray-600">{startDate} → {endDate}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    {language === "ca" ? "Tipus seleccionats:" : "Tipos seleccionados:"}
                  </span>
                  <br />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedReportTypes.map(type => {
                      const typeLabel = reportTypes.find(rt => rt.value === type)?.label || type;
                      return (
                        <span key={type} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {typeLabel}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {language === "ca" 
                  ? "Informe generat amb èxit. Pots exportar les dades utilitzant els botons d'exportació de dalt."
                  : "Informe generado con éxito. Puedes exportar los datos usando los botones de exportación de arriba."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Attendance Table */}
      {detailedAttendance.length > 0 && (
        <Card data-testid="detailed-attendance-card" className="border-blue-200">
          <CardHeader className="border-b border-blue-200 bg-blue-50/30">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Calendar className="h-5 w-5" />
              {language === "ca" ? "Registres detallats d'assistència" : "Registros detallados de asistencia"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ca" ? "Data" : "Fecha"}</TableHead>
                    <TableHead>{language === "ca" ? "Entrada" : "Entrada"}</TableHead>
                    <TableHead>{language === "ca" ? "Sortida" : "Salida"}</TableHead>
                    <TableHead>{language === "ca" ? "Hores" : "Horas"}</TableHead>
                    <TableHead>{language === "ca" ? "Estat" : "Estado"}</TableHead>
                    <TableHead>{language === "ca" ? "Retard" : "Retraso"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailedAttendance.map((record, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {new Date(record.date).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>{record.checkIn || '-'}</TableCell>
                      <TableCell>{record.checkOut || '-'}</TableCell>
                      <TableCell>{record.hoursWorked ? `${record.hoursWorked}h` : '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            record.status === 'on_time' ? 'default' :
                            record.status === 'late' ? 'destructive' :
                            record.status === 'incomplete' ? 'secondary' : 'outline'
                          }
                          className={
                            record.status === 'on_time' ? 'bg-green-100 text-green-800 border-green-200' :
                            record.status === 'late' ? 'bg-red-100 text-red-800 border-red-200' :
                            record.status === 'incomplete' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }
                        >
                          {record.status === 'on_time' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {record.status === 'late' && <XCircle className="w-3 h-3 mr-1" />}
                          {record.status === 'incomplete' && <MinusCircle className="w-3 h-3 mr-1" />}
                          {record.status === 'absent' && <XCircle className="w-3 h-3 mr-1" />}
                          {
                            record.status === 'on_time' ? (language === "ca" ? "A temps" : "A tiempo") :
                            record.status === 'late' ? (language === "ca" ? "Tardança" : "Retraso") :
                            record.status === 'incomplete' ? (language === "ca" ? "Incomplet" : "Incompleto") :
                            (language === "ca" ? "Absent" : "Ausente")
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.lateMinutes > 0 ? `${record.lateMinutes} min` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trends Chart */}
      {monthlyTrends.length > 0 && (
        <Card data-testid="monthly-trends-card" className="border-purple-200">
          <CardHeader className="border-b border-purple-200 bg-purple-50/30">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <TrendingUp className="h-5 w-5" />
              {language === "ca" ? "Tendències mensuals" : "Tendencias mensuales"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Rate Trend */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {language === "ca" ? "Taxa d'assistència" : "Tasa de asistencia"}
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="attendanceRate" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name={language === "ca" ? "Taxa %" : "Tasa %"}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Late Count Trend */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {language === "ca" ? "Retards mensuals" : "Retrasos mensuales"}
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="lateCount" 
                      fill="#f59e0b" 
                      name={language === "ca" ? "Retards" : "Retrasos"}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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