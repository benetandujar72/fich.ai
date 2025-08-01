import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileText, 
  Calendar, 
  Users, 
  Book, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Copy
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UntisStats } from "@/components/UntisStats";

export default function ScheduleImport() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [importResults, setImportResults] = useState<any>(null);

  // Get academic years for current institution
  const { data: academicYears = [] } = useQuery({
    queryKey: ["/api/academic-years", user?.institutionId],
    enabled: !!user?.institutionId,
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.xml') || file.name.endsWith('.gpu') || file.name.endsWith('.txt')) {
        setSelectedFile(file);
        setPreviewData(null);
        setImportResults(null);
      } else {
        toast({
          title: language === "ca" ? "Format no vàlid" : "Formato no válido",
          description: language === "ca" 
            ? "Si us plau, selecciona un arxiu XML, GPU o TXT de GP Untis"
            : "Por favor, selecciona un archivo XML, GPU o TXT de GP Untis",
          variant: "destructive",
        });
      }
    }
  };

  const previewImport = async () => {
    if (!selectedFile || !selectedAcademicYear) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('academicYearId', selectedAcademicYear);
    formData.append('preview', 'true');

    try {
      const response = await fetch('/api/schedule-import/preview', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setPreviewData(result);
    } catch (error) {
      toast({
        title: language === "ca" ? "Error de previsualització" : "Error de previsualización",
        description: language === "ca" 
          ? "No s'ha pogut processar l'arxiu"
          : "No se pudo procesar el archivo",
        variant: "destructive",
      });
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !selectedAcademicYear) throw new Error("Missing data");

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('academicYearId', selectedAcademicYear);

      setIsImporting(true);
      setImportProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch('/api/schedule-import/execute', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      const result = await response.json();
      setImportResults(result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Importació completada" : "Importación completada",
        description: language === "ca" 
          ? "Els horaris s'han importat correctament"
          : "Los horarios se han importado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
    },
    onError: (error: any) => {
      toast({
        title: language === "ca" ? "Error d'importació" : "Error de importación",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsImporting(false);
    }
  });

  // Test with real uploaded file function
  const handleTestRealFile = async () => {
    setIsImporting(true);
    setImportResults(null);

    try {
      const response = await apiRequest('/api/schedule-import/test-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setImportResults(response);
      
      // Refresh statistics
      queryClient.invalidateQueries({ 
        queryKey: ['/api/schedule-import/statistics', user?.institutionId, selectedAcademicYear] 
      });
      
      toast({
        title: language === "ca" ? "Prova completada" : "Prueba completada",
        description: `${response.sessionsImported} sessions del fitxer real importades correctament`,
      });
    } catch (error) {
      console.error('Test import error:', error);
      toast({
        title: language === "ca" ? "Error de prova" : "Error de prueba",
        description: error instanceof Error ? error.message : "Error desconegut",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['superadmin', 'admin']}>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {language === "ca" ? "Importació d'Horaris GP Untis" : "Importación de Horarios GP Untis"}
            </h1>
            <p className="text-muted-foreground">
              {language === "ca" 
                ? "Importa horaris, professorat i matèries des de GP Untis"
                : "Importa horarios, profesorado y materias desde GP Untis"}
            </p>
          </div>
        </div>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {language === "ca" ? "Importar" : "Importar"}
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {language === "ca" ? "Estadístiques" : "Estadísticas"}
            </TabsTrigger>
            <TabsTrigger value="copy" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              {language === "ca" ? "Copiar Dades" : "Copiar Datos"}
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {language === "ca" ? "Plantilles" : "Plantillas"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  {language === "ca" ? "Importar des de GP Untis" : "Importar desde GP Untis"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Test with real file section */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      {language === "ca" ? "Prova amb fitxer real GP Untis" : "Prueba con archivo real GP Untis"}
                    </h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300 mb-3">
                      {language === "ca" 
                        ? "Prova la importació amb l'arxiu HORARIS_1754043300200.TXT que has pujat"
                        : "Prueba la importación con el archivo HORARIS_1754043300200.TXT que has subido"}
                    </p>
                    <Button
                      onClick={handleTestRealFile}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-300 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/40"
                      disabled={isImporting}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {language === "ca" ? "Provar fitxer real TXT" : "Probar archivo real TXT"}
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="academic-year">
                      {language === "ca" ? "Curs acadèmic" : "Curso académico"}
                    </Label>
                    <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "ca" ? "Selecciona curs" : "Selecciona curso"} />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map((year: any) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="file-upload">
                      {language === "ca" ? "Arxiu GP Untis" : "Archivo GP Untis"}
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".xml,.gpu,.txt"
                      onChange={handleFileSelect}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === "ca" 
                        ? "Formats acceptats: XML, GPU, TXT"
                        : "Formatos aceptados: XML, GPU, TXT"}
                    </p>
                  </div>

                  {selectedFile && selectedAcademicYear && (
                    <div className="flex gap-2">
                      <Button onClick={previewImport} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        {language === "ca" ? "Previsualitzar" : "Previsualizar"}
                      </Button>
                      <Button 
                        onClick={() => importMutation.mutate()} 
                        disabled={isImporting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isImporting 
                          ? (language === "ca" ? "Important..." : "Importando...")
                          : (language === "ca" ? "Importar" : "Importar")
                        }
                      </Button>
                    </div>
                  )}

                  {isImporting && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{language === "ca" ? "Progrés d'importació" : "Progreso de importación"}</span>
                        <span>{importProgress}%</span>
                      </div>
                      <Progress value={importProgress} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {previewData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {language === "ca" ? "Previsualització de dades" : "Previsualización de datos"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{previewData.teachers?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">
                        {language === "ca" ? "Professors" : "Profesores"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{previewData.subjects?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">
                        {language === "ca" ? "Matèries" : "Materias"}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{previewData.schedules?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">
                        {language === "ca" ? "Horaris" : "Horarios"}
                      </div>
                    </div>
                  </div>

                  {previewData.conflicts?.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">
                          {language === "ca" ? "Conflictes detectats" : "Conflictos detectados"}
                        </span>
                      </div>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {previewData.conflicts.map((conflict: string, index: number) => (
                          <li key={index}>• {conflict}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {importResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    {language === "ca" ? "Resultats de la importació" : "Resultados de la importación"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">{language === "ca" ? "Creats" : "Creados"}</h4>
                      <ul className="text-sm space-y-1">
                        <li>• {importResults.created?.teachers || 0} {language === "ca" ? "professors" : "profesores"}</li>
                        <li>• {importResults.created?.subjects || 0} {language === "ca" ? "matèries" : "materias"}</li>
                        <li>• {importResults.created?.schedules || 0} {language === "ca" ? "horaris" : "horarios"}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">{language === "ca" ? "Actualitzats" : "Actualizados"}</h4>
                      <ul className="text-sm space-y-1">
                        <li>• {importResults.updated?.teachers || 0} {language === "ca" ? "professors" : "profesores"}</li>
                        <li>• {importResults.updated?.subjects || 0} {language === "ca" ? "matèries" : "materias"}</li>
                        <li>• {importResults.updated?.schedules || 0} {language === "ca" ? "horaris" : "horarios"}</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            {user?.institutionId && selectedAcademicYear && (
              <UntisStats institutionId={user.institutionId} academicYearId={selectedAcademicYear} />
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            {user?.institutionId && selectedAcademicYear ? (
              <UntisStats institutionId={user.institutionId} academicYearId={selectedAcademicYear} />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>
                      {language === "ca" 
                        ? "Selecciona un curs acadèmic per veure les estadístiques"
                        : "Selecciona un curso académico para ver las estadísticas"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="copy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copy className="h-5 w-5" />
                  {language === "ca" ? "Copiar dades entre cursos" : "Copiar datos entre cursos"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {language === "ca" 
                    ? "Copia professors i matèries d'un curs acadèmic a un altre"
                    : "Copia profesores y materias de un curso académico a otro"}
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{language === "ca" ? "Curs d'origen" : "Curso de origen"}</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder={language === "ca" ? "Selecciona..." : "Selecciona..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.map((year: any) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{language === "ca" ? "Curs de destí" : "Curso de destino"}</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder={language === "ca" ? "Selecciona..." : "Selecciona..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.map((year: any) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    {language === "ca" ? "Copiar dades" : "Copiar datos"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  {language === "ca" ? "Plantilles d'importació" : "Plantillas de importación"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <FileText className="h-6 w-6 mb-2" />
                      <span className="text-sm">
                        {language === "ca" ? "Plantilla XML" : "Plantilla XML"}
                      </span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <FileText className="h-6 w-6 mb-2" />
                      <span className="text-sm">
                        {language === "ca" ? "Plantilla CSV" : "Plantilla CSV"}
                      </span>
                    </Button>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">
                      {language === "ca" ? "Instruccions" : "Instrucciones"}
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>{language === "ca" ? "Exporta les dades des de GP Untis" : "Exporta los datos desde GP Untis"}</li>
                      <li>{language === "ca" ? "Selecciona el format XML o GPU" : "Selecciona el formato XML o GPU"}</li>
                      <li>{language === "ca" ? "Puja l'arxiu utilitzant el formulari" : "Sube el archivo usando el formulario"}</li>
                      <li>{language === "ca" ? "Revisa la previsualització abans d'importar" : "Revisa la previsualización antes de importar"}</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}