import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MobileHeader from "@/components/MobileHeader";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Attendance from "@/pages/Attendance";
import Alerts from "@/pages/Alerts";
import AlertsAdmin from "@/pages/AlertsAdmin";
import AlertConfig from "@/pages/AlertConfig";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import SettingsSimple from "@/pages/SettingsSimple";
import SettingsTest from "@/pages/SettingsTest";
import ScheduleImport from "@/pages/ScheduleImport";
import Privacy from "@/pages/Privacy";
import DataSubjectRights from "@/pages/DataSubjectRights";
import AdminManagement from "@/pages/AdminManagement";
import InstitutionManagement from "@/pages/InstitutionManagement";
import AcademicYearManagement from "@/pages/AcademicYearManagement";
import WeeklySchedule from "@/pages/WeeklySchedule";
import WeeklyScheduleAdmin from "@/pages/WeeklyScheduleAdmin";
import Communications from "@/pages/Communications";
import QRAttendancePage from "@/pages/QRAttendance";
import AcademicDataMigration from "@/pages/AcademicDataMigration";
import NotFound from "@/pages/not-found";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import QuickAttendanceModal from "@/components/modals/QuickAttendanceModal";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isQuickAttendanceOpen, setIsQuickAttendanceOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Update time every second - TEMPORALMENTE DESACTIVADO PARA EVITAR RE-RENDERS
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCurrentTime(new Date());
  //   }, 1000);
  //   return () => clearInterval(timer);
  // }, []);

  // Get last attendance record to determine button states (memoized to prevent re-renders)
  const { data: attendanceRecords } = useQuery({
    queryKey: ["/api/attendance", user?.id],
    enabled: !!user?.id && isAuthenticated,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes - longer cache
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
  });

  const lastAttendanceRecord = Array.isArray(attendanceRecords) && attendanceRecords.length > 0 
    ? attendanceRecords[attendanceRecords.length - 1] 
    : null;

  // Quick attendance mutation
  const quickAttendanceMutation = useMutation({
    mutationFn: async (data: { type: "check_in" | "check_out"; timestamp: Date }) => {
      return await apiRequest("POST", "/api/attendance", {
        ...data,
        method: "web",
        location: "quick_attendance_modal"
      });
    },
    onSuccess: (data, variables) => {
      // Force refetch of attendance data to update button states
      queryClient.invalidateQueries({ queryKey: ["/api/attendance", user?.id] });
      // Update all weekly calendar components with user ID for immediate updates
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/weekly", user?.id] });
      // Also invalidate schedule queries for attendance validation
      queryClient.invalidateQueries({ queryKey: ["/api/schedule/weekly", user?.id] });
      toast({
        title: "Éxito",
        description: variables.type === "check_in" 
          ? (language === "ca" ? "Entrada registrada correctament" : "Entrada registrada correctamente")
          : (language === "ca" ? "Sortida registrada correctament" : "Salida registrada correctamente"),
      });
      setIsQuickAttendanceOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (language === "ca" ? "Error registrant el fitxatge" : "Error registrando el fichaje"),
        variant: "destructive",
      });
    },
  });

  // Button state logic (memoized to prevent recalculations)
  const shouldDisableCheckIn = useCallback(() => {
    if (!lastAttendanceRecord) return false;
    const today = new Date().toDateString();
    const lastDate = new Date(lastAttendanceRecord.timestamp).toDateString();
    if (today !== lastDate) return false;
    return lastAttendanceRecord.type === 'check_in';
  }, [lastAttendanceRecord]);
  
  const shouldDisableCheckOut = useCallback(() => {
    if (!lastAttendanceRecord) return true;
    const today = new Date().toDateString();
    const lastDate = new Date(lastAttendanceRecord.timestamp).toDateString();
    if (today !== lastDate) return true;
    return lastAttendanceRecord.type === 'check_out';
  }, [lastAttendanceRecord]);

  // Memoize button states based on attendance records (force recalculation when records change)
  const checkInDisabled = useMemo(() => {
    if (!lastAttendanceRecord) return false;
    const today = new Date().toDateString();
    const lastDate = new Date(lastAttendanceRecord.timestamp).toDateString();
    if (today !== lastDate) return false;
    return lastAttendanceRecord.type === 'check_in';
  }, [lastAttendanceRecord]);
  
  const checkOutDisabled = useMemo(() => {
    if (!lastAttendanceRecord) return true;
    const today = new Date().toDateString();
    const lastDate = new Date(lastAttendanceRecord.timestamp).toDateString();
    if (today !== lastDate) return true;
    return lastAttendanceRecord.type === 'check_out';
  }, [lastAttendanceRecord]);

  const handleQuickCheckIn = useCallback(() => {
    if (!checkInDisabled) {
      quickAttendanceMutation.mutate({
        type: "check_in",
        timestamp: new Date()
      });
    }
  }, [checkInDisabled, quickAttendanceMutation]);

  const handleQuickCheckOut = useCallback(() => {
    if (!checkOutDisabled) {
      quickAttendanceMutation.mutate({
        type: "check_out",
        timestamp: new Date()
      });
    }
  }, [checkOutDisabled, quickAttendanceMutation]);

  const getPageTitle = (path: string) => {
    const titles = {
      "/dashboard": t("dashboard", language),
      "/employees": t("employee_management", language),
      "/attendance": t("attendance", language),
      "/alerts": t("alerts", language),
      "/reports": t("reports", language),
      "/settings": t("settings", language),
    };
    return titles[path as keyof typeof titles] || t("dashboard", language);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">{t("loading", language)}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Switch>
          <Route path="/register" component={Register} />
          <Route component={Login} />
        </Switch>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-rose-50/40 via-pink-50/30 to-purple-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      
      {/* Mobile Header */}
      <MobileHeader 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onLogout={async () => {
          try {
            const response = await fetch('/api/logout', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) {
              window.location.href = '/';
            } else {
              window.location.href = '/api/logout';
            }
          } catch (error) {
            window.location.href = '/api/logout';
          }
        }}
      />
      
      <div className="flex-1 flex flex-col ml-0 md:ml-16 lg:ml-60 transition-all duration-300 min-h-0 pt-14 md:pt-0">
        <Switch>
          <Route path="/" component={() => 
            <ProtectedRoute>
              <Header 
                title={t("dashboard", language)}
                onQuickAttendance={() => setIsQuickAttendanceOpen(true)}
              />
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" component={() => 
            <ProtectedRoute>
              <Header 
                title={t("dashboard", language)}
                onQuickAttendance={() => setIsQuickAttendanceOpen(true)}
              />
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/employees" component={() => 
            <ProtectedRoute requiredRoles={['superadmin', 'admin']}>
              <Header 
                title={t("employee_management", language)}
                onQuickAttendance={() => setIsQuickAttendanceOpen(true)}
              />
              <Employees />
            </ProtectedRoute>
          } />
          
          <Route path="/attendance" component={() => 
            <ProtectedRoute>
              <Header 
                title={t("attendance", language)}
                onQuickAttendance={() => setIsQuickAttendanceOpen(true)}
              />
              <Attendance />
            </ProtectedRoute>
          } />
          
          <Route path="/alerts" component={() => 
            <ProtectedRoute requiredRoles={['superadmin', 'admin']}>
              <Header 
                title={t("alerts", language)}
                onQuickAttendance={() => setIsQuickAttendanceOpen(true)}
              />
              <AlertsAdmin />
            </ProtectedRoute>
          } />

          <Route path="/alert-config" component={() => 
            <ProtectedRoute requiredRoles={['superadmin', 'admin']}>
              <Header 
                title={language === "ca" ? "Configuració d'Alertes" : "Configuración de Alertas"}
                onQuickAttendance={() => setIsQuickAttendanceOpen(true)}
              />
              <AlertConfig />
            </ProtectedRoute>
          } />
          
          <Route path="/reports" component={() => 
            <ProtectedRoute>
              <Header 
                title={t("reports", language)}
                onQuickAttendance={() => setIsQuickAttendanceOpen(true)}
              />
              <Reports />
            </ProtectedRoute>
          } />
          
          <Route path="/schedule-import" component={() => 
            <ProtectedRoute requiredRoles={['superadmin', 'admin']}>
              <Header 
                title={language === "ca" ? "Importació d'Horaris" : "Importación de Horarios"}
                onQuickAttendance={() => setIsQuickAttendanceOpen(true)}
              />
              <ScheduleImport />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" component={() => 
            <ProtectedRoute requiredRoles={['superadmin', 'admin']}>
              <Header 
                title={t("settings", language)}
              />
              <Settings />
            </ProtectedRoute>
          } />
          
          <Route path="/settings-test" component={() => 
            <ProtectedRoute requiredRoles={['superadmin', 'admin']}>
              <Header 
                title="Test de Configuración"
              />
              <SettingsTest />
            </ProtectedRoute>
          } />

          {/* Rutes en català per compatibilitat */}
          <Route path="/configuracio" component={() => 
            <ProtectedRoute requiredRoles={['superadmin', 'admin']}>
              <Header 
                title={t("settings", language)}
              />
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="/configuracio-alertes" component={() => 
            <ProtectedRoute requiredRoles={['superadmin', 'admin']}>
              <Header 
                title={language === "ca" ? "Configuració d'Alertes" : "Configuración de Alertas"}
                onQuickAttendance={() => setIsQuickAttendanceOpen(true)}
              />
              <AlertConfig />
            </ProtectedRoute>
          } />

          <Route path="/privacy" component={() => 
            <ProtectedRoute>
              <Header 
                title={language === "ca" ? "Política de Privacitat" : "Política de Privacidad"}
              />
              <Privacy />
            </ProtectedRoute>
          } />

          <Route path="/data-rights" component={() => 
            <ProtectedRoute>
              <Header 
                title={language === "ca" ? "Exercici de Drets" : "Ejercicio de Derechos"}
              />
              <DataSubjectRights />
            </ProtectedRoute>
          } />

          <Route path="/institutions" component={() => 
            <ProtectedRoute requiredRoles={['superadmin']}>
              <Header 
                title={language === "ca" ? "Gestió d'Institucions" : "Gestión de Instituciones"}
              />
              <InstitutionManagement />
            </ProtectedRoute>
          } />

          <Route path="/academic-years" component={() => 
            <ProtectedRoute requiredRoles={['superadmin', 'admin']}>
              <Header 
                title={language === "ca" ? "Gestió de Cursos Acadèmics" : "Gestión de Cursos Académicos"}
              />
              <AcademicYearManagement />
            </ProtectedRoute>
          } />

          <Route path="/academic-migration" component={() => 
            <ProtectedRoute requiredRoles={['superadmin', 'admin']}>
              <Header 
                title="Migración de Datos Académicos"
                onQuickAttendance={() => setIsQuickAttendanceOpen(true)}
              />
              <AcademicDataMigration />
            </ProtectedRoute>
          } />

          <Route path="/weekly-schedule" component={() => 
            <ProtectedRoute>
              <Header 
                title={language === "ca" ? "Horari Personal" : "Horario Personal"}
              />
              <WeeklySchedule />
            </ProtectedRoute>
          } />

          <Route path="/admin/weekly-schedule" component={() => 
            <ProtectedRoute requiredRoles={['superadmin', 'admin']}>
              <Header 
                title="Horaris Personal - Administració"
                onQuickAttendance={() => setIsQuickAttendanceOpen(true)}
              />
              <WeeklyScheduleAdmin />
            </ProtectedRoute>
          } />

          <Route path="/communications" component={() => 
            <ProtectedRoute>
              <Header 
                title={language === "ca" ? "Comunicacions" : "Comunicaciones"}
              />
              <Communications />
            </ProtectedRoute>
          } />

          <Route path="/qr-attendance" component={() => 
            <ProtectedRoute>
              <Header 
                title="Fichaje QR"
                onQuickAttendance={() => setIsQuickAttendanceOpen(true)}
              />
              <QRAttendancePage />
            </ProtectedRoute>
          } />

          <Route path="/admin" component={() => 
            <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
              <Header 
                title="Gestió Administrativa"
                onQuickAttendance={() => setIsQuickAttendanceOpen(true)}
              />
              <AdminManagement />
            </ProtectedRoute>
          } />
          
          <Route component={NotFound} />
        </Switch>
      </div>

      <QuickAttendanceModal 
        isOpen={isQuickAttendanceOpen}
        onClose={() => setIsQuickAttendanceOpen(false)}
        onCheckIn={handleQuickCheckIn}
        onCheckOut={handleQuickCheckOut}
        currentTime={currentTime.toLocaleTimeString("ca-ES", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })}
        shouldDisableCheckIn={checkInDisabled}
        shouldDisableCheckOut={checkOutDisabled}
        isLoading={quickAttendanceMutation.isPending}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
