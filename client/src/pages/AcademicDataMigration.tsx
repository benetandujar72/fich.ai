import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Database, 
  ArrowRight, 
  Copy, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Download,
  Upload,
  FileText,
  Users,
  Calendar,
  Building2,
  Clock,
  BookOpen,
  Settings,
  Trash2,
  Eye
} from 'lucide-react';

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: string;
}

interface MigrationJob {
  id: string;
  sourceYearId: string;
  targetYearId: string;
  migrationType: string;
  status: string;
  totalRecords: number;
  migratedRecords: number;
  failedRecords: number;
  errors: any[];
  createdAt: string;
  completedAt?: string;
}

export default function AcademicDataMigration() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [sourceYearId, setSourceYearId] = useState<string>('');
  const [targetYearId, setTargetYearId] = useState<string>('');
  const [migrationType, setMigrationType] = useState<string>('employees');
  const [selectedMigrationTypes, setSelectedMigrationTypes] = useState<string[]>(['employees']);
  const [migrationDescription, setMigrationDescription] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const institutionId = user?.institutionId;

  // Fetch academic years
  const { data: academicYears = [], isLoading: loadingYears } = useQuery<AcademicYear[]>({
    queryKey: ["/api/academic-years", institutionId],
    enabled: !!institutionId && (user?.role === "admin" || user?.role === "superadmin"),
  });

  // Fetch migration history
  const { data: migrationHistory = [], isLoading: loadingHistory } = useQuery<MigrationJob[]>({
    queryKey: ["/api/academic-years/migrations", institutionId],
    enabled: !!institutionId && (user?.role === "admin" || user?.role === "superadmin"),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Migration mutation
  const migrationMutation = useMutation({
    mutationFn: async (data: {
      sourceYearId: string;
      targetYearId: string;
      migrationTypes: string[];
      description?: string;
    }) => {
      return await apiRequest("POST", "/api/academic-years/migrate", data);
    },
    onSuccess: (data) => {
      toast({
        title: t("success", language),
        description: language === "ca" ? "Migració iniciada correctament" : "Migración iniciada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/academic-years/migrations"] });
      setShowConfirmDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t("error", language),
        description: error.message || (language === "ca" ? 'Error a l\'iniciar la migració' : 'Error al iniciar la migración'),
        variant: "destructive",
      });
    },
  });

  // Delete migration mutation
  const deleteMigrationMutation = useMutation({
    mutationFn: async (migrationId: string) => {
      return await apiRequest("DELETE", `/api/academic-years/migrations/${migrationId}`);
    },
    onSuccess: () => {
      toast({
        title: t("success", language),
        description: language === "ca" ? "Registre de migració eliminat" : "Registro de migración eliminado",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/academic-years/migrations"] });
    },
    onError: (error: any) => {
      toast({
        title: t("error", language),
        description: error.message || (language === "ca" ? 'Error a l\'eliminar el registre' : 'Error al eliminar el registro'),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSourceYearId('');
    setTargetYearId('');
    setSelectedMigrationTypes(['employees']);
    setMigrationDescription('');
  };

  const handleMigrationTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedMigrationTypes(prev => [...prev, type]);
    } else {
      setSelectedMigrationTypes(prev => prev.filter(t => t !== type));
    }
  };

  const startMigration = () => {
    if (!sourceYearId || !targetYearId || selectedMigrationTypes.length === 0) {
      toast({
        title: t("error", language),
        description: language === "ca" ? "Si us plau completa tots els camps requerits" : "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    if (sourceYearId === targetYearId) {
      toast({
        title: t("error", language),
        description: language === "ca" ? "Els cursos acadèmics d'origen i destí han de ser diferents" : "Los cursos académicos de origen y destino deben ser diferentes",
        variant: "destructive",
      });
      return;
    }

    migrationMutation.mutate({
      sourceYearId,
      targetYearId,
      migrationTypes: selectedMigrationTypes,
      description: migrationDescription
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const migrationTypeOptions = [
    { 
      id: 'employees', 
      label: language === "ca" ? 'Personal/Empleats' : 'Personal/Empleados', 
      icon: Users, 
      description: language === "ca" ? 'Migrar dades d\'empleats i contractes' : 'Migrar datos de empleados y contratos' 
    },
    { 
      id: 'departments', 
      label: language === "ca" ? 'Departaments' : 'Departamentos', 
      icon: Building2, 
      description: language === "ca" ? 'Migrar estructura de departaments' : 'Migrar estructura de departamentos' 
    },
    { 
      id: 'schedules', 
      label: language === "ca" ? 'Horaris' : 'Horarios', 
      icon: Calendar, 
      description: language === "ca" ? 'Migrar horaris i programacions' : 'Migrar horarios y programaciones' 
    },
    { 
      id: 'subjects', 
      label: language === "ca" ? 'Assignatures' : 'Asignaturas', 
      icon: BookOpen, 
      description: language === "ca" ? 'Migrar matèries i programes' : 'Migrar materias y programas' 
    },
    { 
      id: 'groups', 
      label: language === "ca" ? 'Grups/Classes' : 'Grupos/Clases', 
      icon: Users, 
      description: language === "ca" ? 'Migrar grups d\'estudiants' : 'Migrar grupos de estudiantes' 
    },
    { 
      id: 'attendance', 
      label: language === "ca" ? 'Registres d\'Assistència' : 'Registros de Asistencia', 
      icon: Clock, 
      description: language === "ca" ? 'Migrar dades històriques d\'assistència' : 'Migrar datos históricos de asistencia' 
    },
  ];

  if (loadingYears) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {language === "ca" ? "Migració de Dades Acadèmiques" : "Migración de Datos Académicos"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ca" ? "Transfereix dades entre cursos acadèmics de forma segura i controlada" : "Transfiere datos entre cursos académicos de forma segura y controlada"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="migrate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="migrate">{language === "ca" ? "Nova Migració" : "Nueva Migración"}</TabsTrigger>
          <TabsTrigger value="history">{language === "ca" ? "Historial" : "Historial"}</TabsTrigger>
        </TabsList>

        {/* New Migration Tab */}
        <TabsContent value="migrate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Configurar Migración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Source and Target Year Selection */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="source-year">Curso Académico de Origen</Label>
                  <Select value={sourceYearId} onValueChange={setSourceYearId}>
                    <SelectTrigger id="source-year">
                      <SelectValue placeholder="Selecciona curso origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          <div className="flex items-center gap-2">
                            {year.name}
                            {year.isActive && <Badge variant="default" className="text-xs">Activo</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-year">Curso Académico de Destino</Label>
                  <Select value={targetYearId} onValueChange={setTargetYearId}>
                    <SelectTrigger id="target-year">
                      <SelectValue placeholder="Selecciona curso destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          <div className="flex items-center gap-2">
                            {year.name}
                            {year.isActive && <Badge variant="default" className="text-xs">Activo</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Migration Arrow */}
              {sourceYearId && targetYearId && (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="text-center">
                      <div className="font-semibold text-blue-900">
                        {academicYears.find(y => y.id === sourceYearId)?.name}
                      </div>
                      <div className="text-xs text-blue-600">Origen</div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-blue-600" />
                    <div className="text-center">
                      <div className="font-semibold text-blue-900">
                        {academicYears.find(y => y.id === targetYearId)?.name}
                      </div>
                      <div className="text-xs text-blue-600">Destino</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Migration Type Selection */}
              <div className="space-y-4">
                <Label>Tipos de Datos a Migrar</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  {migrationTypeOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <div key={option.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                        <Checkbox
                          id={option.id}
                          checked={selectedMigrationTypes.includes(option.id)}
                          onCheckedChange={(checked) => handleMigrationTypeChange(option.id, !!checked)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-gray-600" />
                            <Label htmlFor={option.id} className="font-medium cursor-pointer">
                              {option.label}
                            </Label>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción de la Migración (Opcional)</Label>
                <Textarea
                  id="description"
                  value={migrationDescription}
                  onChange={(e) => setMigrationDescription(e.target.value)}
                  placeholder="Describe el propósito de esta migración..."
                  rows={3}
                />
              </div>

              {/* Warning Alert */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> La migración copiará los datos seleccionados del curso origen al curso destino.
                  Los datos existentes en el curso destino no se eliminarán. Asegúrate de revisar los datos antes de confirmar.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      disabled={!sourceYearId || !targetYearId || selectedMigrationTypes.length === 0}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Iniciar Migración
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Confirmar Migración</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        ¿Estás seguro de que quieres migrar los siguientes datos?
                      </p>
                      
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Origen:</span>
                          <span>{academicYears.find(y => y.id === sourceYearId)?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Destino:</span>
                          <span>{academicYears.find(y => y.id === targetYearId)?.name}</span>
                        </div>
                        <div className="mt-2">
                          <span className="font-medium">Datos:</span>
                          <ul className="text-sm text-gray-600 mt-1">
                            {selectedMigrationTypes.map(type => (
                              <li key={type}>• {migrationTypeOptions.find(opt => opt.id === type)?.label}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={startMigration}
                          disabled={migrationMutation.isPending}
                          className="flex-1"
                        >
                          {migrationMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Iniciando...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Confirmar
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowConfirmDialog(false)}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" onClick={resetForm}>
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Migration History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Historial de Migraciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : migrationHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No hay migraciones registradas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {migrationHistory.map((migration) => {
                    const sourceYear = academicYears.find(y => y.id === migration.sourceYearId);
                    const targetYear = academicYears.find(y => y.id === migration.targetYearId);
                    const progressPercentage = migration.totalRecords > 0 
                      ? (migration.migratedRecords / migration.totalRecords) * 100 
                      : 0;

                    return (
                      <div key={migration.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {sourceYear?.name} → {targetYear?.name}
                              </span>
                              <Badge className={getStatusColor(migration.status)}>
                                {migration.status === 'completed' && 'Completada'}
                                {migration.status === 'in_progress' && 'En Progreso'}
                                {migration.status === 'failed' && 'Fallida'}
                                {migration.status === 'pending' && 'Pendiente'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              Tipo: {migrationTypeOptions.find(opt => opt.id === migration.migrationType)?.label || migration.migrationType}
                            </p>
                            <p className="text-xs text-gray-500">
                              Iniciada: {new Date(migration.createdAt).toLocaleString('es-ES')}
                              {migration.completedAt && (
                                <> • Completada: {new Date(migration.completedAt).toLocaleString('es-ES')}</>
                              )}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteMigrationMutation.mutate(migration.id)}
                              disabled={migration.status === 'in_progress' || deleteMigrationMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {migration.status === 'in_progress' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progreso</span>
                              <span>{migration.migratedRecords}/{migration.totalRecords} registros</span>
                            </div>
                            <Progress value={progressPercentage} className="w-full" />
                          </div>
                        )}

                        {migration.status === 'completed' && (
                          <div className="text-sm text-green-600">
                            ✓ {migration.migratedRecords} registros migrados exitosamente
                          </div>
                        )}

                        {migration.status === 'failed' && migration.errors && migration.errors.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded p-3">
                            <p className="text-sm font-medium text-red-800 mb-2">Errores:</p>
                            <ul className="text-sm text-red-700 space-y-1">
                              {migration.errors.slice(0, 3).map((error, idx) => (
                                <li key={idx}>• {error.message || error}</li>
                              ))}
                              {migration.errors.length > 3 && (
                                <li>• Y {migration.errors.length - 3} errores más...</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}