import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Attendance from "@/pages/Attendance";
import Alerts from "@/pages/Alerts";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import ScheduleImport from "@/pages/ScheduleImport";
import Privacy from "@/pages/Privacy";
import DataSubjectRights from "@/pages/DataSubjectRights";
import InstitutionManagement from "@/pages/InstitutionManagement";
import AcademicYearManagement from "@/pages/AcademicYearManagement";
import WeeklySchedule from "@/pages/WeeklySchedule";
import Communications from "@/pages/Communications";
import NotFound from "@/pages/not-found";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { useState } from "react";
import QuickAttendanceModal from "@/components/modals/QuickAttendanceModal";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { language } = useLanguage();
  const [isQuickAttendanceOpen, setIsQuickAttendanceOpen] = useState(false);

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
        <LanguageSwitcher />
        <Switch>
          <Route path="/register" component={Register} />
          <Route component={Login} />
        </Switch>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LanguageSwitcher />
      <Sidebar />
      
      <div className="ml-64 transition-all duration-300">
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
              <Alerts />
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

          <Route path="/weekly-schedule" component={() => 
            <ProtectedRoute>
              <Header 
                title={language === "ca" ? "Horari Setmanal" : "Horario Semanal"}
              />
              <WeeklySchedule />
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
          
          <Route component={NotFound} />
        </Switch>
      </div>

      <QuickAttendanceModal 
        isOpen={isQuickAttendanceOpen}
        onClose={() => setIsQuickAttendanceOpen(false)}
        onCheckIn={() => {
          // This would be handled by the individual page components
          setIsQuickAttendanceOpen(false);
        }}
        onCheckOut={() => {
          // This would be handled by the individual page components
          setIsQuickAttendanceOpen(false);
        }}
        currentTime={new Date().toLocaleTimeString("ca-ES", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })}
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
