import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Calendar,
  AlertTriangle,
  FileText,
  Settings,
  Cog,
  Building2,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Clock,
  Upload,
  UserCheck,
  MessageSquare,
  CalendarDays,
  Menu,
  X,
  Activity,
  Shield,
  Bell,
  BarChart3,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export default function Sidebar(props: SidebarProps = {}) {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = props;
  const [location] = useLocation();
  const { user } = useAuth();
  const permissions = usePermissions();
  const { language } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Use props if provided, otherwise use internal state
  const mobileMenuOpen = isMobileMenuOpen !== undefined ? isMobileMenuOpen : internalMobileMenuOpen;
  const setMobileMenuOpen = setIsMobileMenuOpen ?? setInternalMobileMenuOpen;

  // Get alert count for badge
  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/alerts", user?.institutionId],
    enabled: !!user?.institutionId && permissions.canViewAlerts,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Detect mobile and handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
        setMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [location, isMobile]);

  // Organized navigation structure by category
  const navigationSections = [
    {
      title: language === "ca" ? "Principal" : "Principal",
      items: [
        {
          name: t("dashboard", language),
          href: "/dashboard",
          icon: Home,
          show: true,
          badge: null,
        },
        {
          name: t("attendance", language),
          href: "/attendance",
          icon: Clock,
          show: permissions.canViewOwnAttendance || permissions.canViewAllAttendance,
          badge: null,
        },
        {
          name: language === "ca" ? "Horari Personal" : "Horario Personal",
          href: "/weekly-schedule",
          icon: CalendarDays,
          show: permissions.canViewOwnAttendance,
          badge: null,
        },
      ]
    },
    {
      title: language === "ca" ? "Gestió" : "Gestión",
      items: [
        {
          name: t("employee_management", language),
          href: "/employees",
          icon: Users,
          show: permissions.canViewEmployees,
          badge: null,
        },
        {
          name: language === "ca" ? "Horaris Personal (Admin)" : "Horarios Personal (Admin)",
          href: "/admin/weekly-schedule",
          icon: Calendar,
          show: (user?.role === 'admin' || user?.role === 'superadmin'),
          badge: null,
        },
        {
          name: language === "ca" ? "Importar Horaris" : "Importar Horarios",
          href: "/schedule-import",
          icon: Upload,
          show: permissions.canEditSchedules,
          badge: null,
        },
      ]
    },
    {
      title: language === "ca" ? "Monitoratge" : "Monitoreo",
      items: [
        {
          name: t("alerts", language),
          href: "/alerts",
          icon: AlertTriangle,
          show: permissions.canViewAlerts,
          badge: Array.isArray(alerts) && alerts.filter((alert: any) => alert.status === 'active').length > 0 ? alerts.filter((alert: any) => alert.status === 'active').length.toString() : null,
        },

        {
          name: t("reports", language),
          href: "/reports",
          icon: BarChart3,
          show: permissions.canGeneratePersonalReports || permissions.canGenerateInstitutionReports,
          badge: null,
        },
        {
          name: language === "ca" ? "Comunicacions" : "Comunicaciones",
          href: "/communications",
          icon: MessageSquare,
          show: true,
          badge: null,
        },
      ]
    },
    {
      title: language === "ca" ? "Administració" : "Administración",
      items: [
        {
          name: language === "ca" ? "Gestió d'Institucions" : "Gestión de Instituciones",
          href: "/institutions",
          icon: Building2,
          show: permissions.canViewInstitutions,
          badge: null,
        },
        {
          name: language === "ca" ? "Cursos Acadèmics" : "Cursos Académicos",
          href: "/academic-years",
          icon: GraduationCap,
          show: permissions.canCreateAcademicYear || permissions.canEditAcademicYear,
          badge: null,
        },
        {
          name: language === "ca" ? "Administració" : "Administración",
          href: "/admin",
          icon: Shield,
          show: user?.role === 'admin' || user?.role === 'superadmin',
          badge: null,
        },
        {
          name: language === "ca" ? "Configuració d'Alertes" : "Configuración de Alertas",
          href: "/alert-config",
          icon: Settings,
          show: permissions.canManageUsers,
          badge: null,
        },
        {
          name: t("settings", language),
          href: "/settings",
          icon: Settings,
          show: permissions.canEditSettings || permissions.canManageUsers,
          badge: null,
        },
      ]
    },
    {
      title: language === "ca" ? "Legal" : "Legal",
      items: [
        {
          name: language === "ca" ? "Política de Privacitat" : "Política de Privacidad",
          href: "/privacy",
          icon: FileText,
          show: true,
          badge: null,
        },
        {
          name: language === "ca" ? "Els meus Drets" : "Mis Derechos",
          href: "/data-rights",
          icon: UserCheck,
          show: true,
          badge: null,
        },
      ]
    }
  ].map(section => ({
    ...section,
    items: section.items.filter(item => item.show)
  })).filter(section => section.items.length > 0);

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const userInitials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'U';

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-[50] md:hidden pointer-events-auto top-14" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      


      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full bg-gradient-to-b from-white via-rose-50/95 to-pink-50/95 dark:from-gray-950 dark:via-slate-900/98 dark:to-slate-800/98 backdrop-blur-md border-r border-rose-100 dark:border-slate-600 z-[55] transition-all duration-300 flex flex-col shadow-2xl pointer-events-auto",
        // Desktop behavior
        !isMobile && (isCollapsed ? "w-16" : "w-60"),
        // Mobile behavior  
        isMobile && (mobileMenuOpen ? "w-72 top-14" : "w-0 -translate-x-full top-14"),
        isMobile && mobileMenuOpen && "translate-x-0 shadow-2xl"
      )}>
        
        {/* Header Section */}
        <div className="flex-shrink-0 px-4 py-5 border-b border-rose-100 dark:border-slate-600 bg-gradient-to-r from-rose-100/80 to-pink-100/80 dark:from-slate-800/50 dark:to-slate-700/50">
          <div className="flex items-center justify-between">
            {(!isCollapsed || isMobile) && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-400 via-pink-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    EduPresència
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">Sistema de Presència</p>
                </div>
              </div>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="ml-auto hover:bg-primary/10"
                data-testid="toggle-sidebar"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        {(!isCollapsed || isMobile) && user && (
          <div className="flex-shrink-0 p-4 border-b border-border">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-rose-50/70 to-pink-50/70 dark:from-slate-700/50 dark:to-slate-600/50 border border-rose-200 dark:border-slate-500/50">
              <Avatar className="w-12 h-12 ring-2 ring-rose-200 dark:ring-slate-500">
                <AvatarFallback className="bg-gradient-to-br from-rose-400 via-pink-400 to-purple-500 text-white font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {user.role === 'superadmin' ? 'Super Admin' : 
                   user.role === 'admin' ? 'Administrador' : 'Empleat'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent overscroll-contain">
          <div className="space-y-6">
            {navigationSections.map((section, sectionIndex) => (
              <div key={section.title} className="space-y-2">
                {(!isCollapsed || isMobile) && (
                  <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h3>
                )}
                {isCollapsed && !isMobile && sectionIndex > 0 && (
                  <Separator className="my-2" />
                )}
                
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href || location.startsWith(item.href + '/');
                    
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={cn(
                            "nav-link",
                            isActive && "active",
                            isCollapsed && !isMobile ? "justify-center px-3" : "justify-start",
                            isMobile && "pointer-events-auto"
                          )}
                          data-testid={`nav-${item.href.replace('/', '').replace('/', '-')}-link`}
                          onClick={isMobile ? () => setMobileMenuOpen(false) : undefined}
                        >
                          <Icon className={cn(
                            "flex-shrink-0 transition-all duration-200",
                            isActive ? "w-5 h-5 text-primary-foreground" : "w-4 h-4 group-hover:scale-110 group-hover:text-accent-foreground"
                          )} />
                          
                          {(!isCollapsed || isMobile) && (
                            <>
                              <span className="ml-3 truncate">{item.name}</span>
                              {item.badge && (
                                <Badge 
                                  variant={isActive ? "secondary" : "outline"} 
                                  className="ml-auto text-xs"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                          
                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-sm opacity-80" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer Section */}
        <div className="flex-shrink-0 p-4 border-t border-border bg-muted/30">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full group hover:bg-destructive/10 hover:text-destructive transition-all duration-200",
              isCollapsed && !isMobile ? "justify-center px-3" : "justify-start"
            )}
            onClick={() => {
              if (isMobile) setMobileMenuOpen(false);
              handleLogout();
            }}
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
            {(!isCollapsed || isMobile) && (
              <span className="ml-3 font-medium">{t("logout", language)}</span>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}