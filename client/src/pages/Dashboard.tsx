import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Clock, 
  UserPlus,
  FolderInput,
  Download,
  AlertTriangle,
  Info,
  BarChart3
} from "lucide-react";

export default function Dashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get institution ID from authenticated user
  const institutionId = user?.institutionId;

  const { data: stats, isLoading } = useQuery<{
    totalEmployees: number;
    presentEmployees: number;
    activeAlerts: number;
  }>({
    queryKey: ["/api/dashboard/stats", institutionId],
    enabled: !!institutionId,
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-activity", institutionId],
    enabled: !!institutionId,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString("ca-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: t("present_staff", language),
      value: stats?.presentEmployees || 0,
      total: stats?.totalEmployees || 0,
      icon: Users,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      testId: "stat-present-staff"
    },
    {
      title: t("total_employees", language),
      value: stats?.totalEmployees || 0,
      icon: UserPlus,
      color: "text-info",
      bgColor: "bg-info/10",
      testId: "stat-total-employees"
    },
    {
      title: t("active_alerts", language),
      value: stats?.activeAlerts || 0,
      icon: AlertTriangle,
      color: "text-error",
      bgColor: "bg-error/10",
      testId: "stat-active-alerts"
    },
    {
      title: t("attendance_rate", language),
      value: stats?.totalEmployees > 0 ? Math.round((stats?.presentEmployees / stats?.totalEmployees) * 100) : 0,
      suffix: "%",
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10",
      testId: "stat-attendance-rate"
    },
  ];

  const quickActions = [
    {
      title: language === "ca" ? "Afegir nou empleat" : "Añadir nuevo empleado",
      icon: UserPlus,
      color: "bg-primary hover:bg-blue-700",
      testId: "action-add-employee"
    },
    {
      title: language === "ca" ? "Importar horaris" : "Importar horarios",
      icon: FolderInput,
      color: "bg-secondary hover:bg-green-700",
      testId: "action-import-schedules"
    },
    {
      title: language === "ca" ? "Generar informe" : "Generar informe",
      icon: Download,
      color: "bg-accent hover:bg-orange-600",
      testId: "action-generate-report"
    },
  ];

  return (
    <main className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => (
          <Card key={stat.title} data-testid={stat.testId}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.total ? `${stat.value}/${stat.total}` : `${stat.value}${stat.suffix || ''}`}
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card data-testid="quick-actions-card">
            <CardHeader>
              <CardTitle>
                {language === "ca" ? "Accions ràpides" : "Acciones rápidas"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action) => (
                  <Button
                    key={action.title}
                    variant="outline"
                    className={`h-24 ${action.color} text-white border-none`}
                    data-testid={action.testId}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <action.icon className="w-6 h-6" />
                      <span className="text-sm font-medium text-center">
                        {action.title}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card data-testid="recent-activity-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {language === "ca" ? "Activitat recent" : "Actividad reciente"}
                </CardTitle>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date().toLocaleDateString("ca-ES")}
                  </p>
                  <p className="text-lg font-bold text-primary">{timeString}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>{language === "ca" ? "No hi ha activitat recent" : "No hay actividad reciente"}</p>
                </div>
              ) : (
                recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-3 mb-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString(language === "ca" ? "ca-ES" : "es-ES")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance Chart Placeholder */}
      <Card data-testid="attendance-chart-card" className="mt-8">
        <CardHeader>
          <CardTitle>{t("weekly_attendance", language)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t("weekly_attendance", language)}</p>
              <p className="text-sm text-gray-500">
                {language === "ca" ? "Les dades es carregaran des de la base de dades" : "Los datos se cargarán desde la base de datos"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}