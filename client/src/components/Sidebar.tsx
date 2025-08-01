import { Link, useLocation } from "wouter";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Bell, 
  BarChart3, 
  Settings,
  GraduationCap,
  LogOut,
  Building,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();

  // Base navigation items available to all users
  const baseNavigation = [
    { 
      name: t("dashboard", language), 
      href: "/dashboard", 
      icon: LayoutDashboard,
      testId: "nav-dashboard"
    },
    { 
      name: t("employees", language), 
      href: "/employees", 
      icon: Users,
      testId: "nav-employees"
    },
    { 
      name: t("attendance", language), 
      href: "/attendance", 
      icon: Clock,
      testId: "nav-attendance"
    },
    { 
      name: t("alerts", language), 
      href: "/alerts", 
      icon: Bell,
      testId: "nav-alerts"
    },
    { 
      name: t("reports", language), 
      href: "/reports", 
      icon: BarChart3,
      testId: "nav-reports"
    },
    { 
      name: t("settings", language), 
      href: "/settings", 
      icon: Settings,
      testId: "nav-settings"
    },
  ];

  // Additional management items for admins and superadmins
  const managementNavigation = [
    ...(user?.role === "superadmin" ? [{
      name: language === "ca" ? "Institucions" : "Instituciones", 
      href: "/institutions", 
      icon: Building,
      testId: "nav-institutions"
    }] : []),
    ...(user?.role === "admin" || user?.role === "superadmin" ? [{
      name: language === "ca" ? "Cursos Acadèmics" : "Cursos Académicos", 
      href: "/academic-years", 
      icon: BookOpen,
      testId: "nav-academic-years"
    }] : []),
  ];

  const navigation = [...baseNavigation, ...managementNavigation];

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/login";
    }
  };

  return (
    <nav className={cn("fixed top-0 left-0 h-full w-64 bg-surface shadow-lg z-40", className)}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <GraduationCap className="text-2xl text-primary mr-3 h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold text-text">EduPresència</h1>
            <p className="text-sm text-gray-600">Centre Educatiu</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive && "bg-primary text-white"
                    )}
                    data-testid={item.testId}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {user && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <img 
              src={user.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face"} 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover mr-3"
              data-testid="user-avatar"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-text" data-testid="user-name">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-600" data-testid="user-role">
                {user.role === "superadmin" ? "Superadministrador" : 
                 user.role === "admin" ? "Administrador" : "Empleat"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-error"
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
