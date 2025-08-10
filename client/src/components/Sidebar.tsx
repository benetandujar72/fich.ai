import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Calendar,
  AlertTriangle,
  FileText,
  Settings,
  Building2,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Clock,
  Upload,
  UserCheck,
  MessageSquare,
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const permissions = usePermissions();
  const { language } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      name: t("dashboard", language),
      href: "/dashboard",
      icon: Home,
      show: true,
    },
    {
      name: t("employee_management", language),
      href: "/employees",
      icon: Users,
      show: permissions.canViewEmployees,
    },
    {
      name: t("attendance", language),
      href: "/attendance",
      icon: Clock,
      show: permissions.canViewOwnAttendance || permissions.canViewAllAttendance,
    },
    {
      name: t("alerts", language),
      href: "/alerts",
      icon: AlertTriangle,
      show: permissions.canViewAlerts,
    },
    {
      name: t("reports", language),
      href: "/reports",
      icon: FileText,
      show: permissions.canGeneratePersonalReports || permissions.canGenerateInstitutionReports,
    },
    {
      name: language === "ca" ? "Importar Horaris" : "Importar Horarios",
      href: "/schedule-import",
      icon: Upload,
      show: permissions.canEditSchedules,
    },
    {
      name: language === "ca" ? "Gestió d'Institucions" : "Gestión de Instituciones",
      href: "/institutions",
      icon: Building2,
      show: permissions.canViewInstitutions,
    },
    {
      name: language === "ca" ? "Cursos Acadèmics" : "Cursos Académicos",
      href: "/academic-years",
      icon: GraduationCap,
      show: permissions.canCreateAcademicYear || permissions.canEditAcademicYear,
    },
    {
      name: language === "ca" ? "Horari Personal" : "Horario Personal",
      href: "/weekly-schedule",
      icon: CalendarDays,
      show: permissions.canViewOwnAttendance,
    },
    {
      name: language === "ca" ? "Horaris Personal (Admin)" : "Horarios Personal (Admin)",
      href: "/admin/weekly-schedule",
      icon: Calendar,
      show: (user?.role === 'admin' || user?.role === 'superadmin'),
    },
    {
      name: language === "ca" ? "Comunicacions" : "Comunicaciones",
      href: "/communications",
      icon: MessageSquare,
      show: true, // All users can use communications
    },
    {
      name: t("settings", language),
      href: "/settings",
      icon: Settings,
      show: permissions.canEditSettings || permissions.canManageUsers,
    },
    {
      name: language === "ca" ? "Política de Privacitat" : "Política de Privacidad",
      href: "/privacy",
      icon: FileText,
      show: true,
    },
    {
      name: language === "ca" ? "Els meus Drets" : "Mis Derechos",
      href: "/data-rights",
      icon: UserCheck,
      show: true,
    },
    {
      name: language === "ca" ? "Administració" : "Administración",
      href: "/admin",
      icon: Settings,
      show: user?.role === 'admin' || user?.role === 'superadmin',
    },
  ].filter(item => item.show);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Force reload to clear all client state
        window.location.href = '/';
      } else {
        console.error('Logout failed');
        // Fallback to GET request
        window.location.href = '/api/logout';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback to GET request
      window.location.href = '/api/logout';
    }
  };

  return (
    <div className={cn(
      "fixed top-0 left-0 h-full bg-card border-r border-border z-50 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-primary">EduPresència</h1>
                <p className="text-xs text-muted-foreground">
                  {language === "ca" ? "Control de presència" : "Control de presencia"}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ml-auto"
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || 
              (item.href === "/dashboard" && location === "/");
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  data-testid={`nav-${item.href.slice(1)}`}
                >
                  <item.icon size={20} className={cn("flex-shrink-0", !isCollapsed && "mr-3")} />
                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User info and logout */}
        <div className="p-4 border-t border-border">
          {!isCollapsed && user && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <p className="text-xs text-primary">
                {user.role === 'superadmin' && (language === "ca" ? "Superadministrador" : "Superadministrador")}
                {user.role === 'admin' && (language === "ca" ? "Administrador" : "Administrador")}
                {user.role === 'employee' && (language === "ca" ? "Professor/a" : "Profesor/a")}
              </p>
            </div>
          )}
          
          <Button
            variant="ghost"
            size={isCollapsed ? "sm" : "default"}
            onClick={handleLogout}
            className={cn(
              "w-full justify-start text-muted-foreground hover:text-foreground",
              isCollapsed && "px-2"
            )}
            data-testid="logout-button"
          >
            <LogOut size={20} className={cn("flex-shrink-0", !isCollapsed && "mr-3")} />
            {!isCollapsed && (
              <span>{language === "ca" ? "Tancar sessió" : "Cerrar sesión"}</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}