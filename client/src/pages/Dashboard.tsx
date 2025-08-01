import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Clock, 
  UserX, 
  Shield,
  UserPlus,
  FolderInput,
  Download,
  Check,
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
      title: t("delays_today", language),
      value: 3,
      change: "-2 respecte ahir",
      icon: Clock,
      color: "text-accent",
      bgColor: "bg-accent/10",
      testId: "stat-delays"
    },
    {
      title: t("absences", language),
      value: 6,
      change: "+1 respecte ahir",
      icon: UserX,
      color: "text-error",
      bgColor: "bg-error/10",
      testId: "stat-absences"
    },
    {
      title: t("active_guards", language),
      value: stats?.activeAlerts || 0,
      subtitle: "2 automàtiques",
      icon: Shield,
      color: "text-primary",
      bgColor: "bg-primary/10",
      testId: "stat-active-guards"
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

  const recentActivity = [
    {
      icon: Check,
      color: "text-secondary bg-secondary/10",
      title: "Maria García ha fitxat l'entrada",
      subtitle: "08:15 - Educació Primària",
      time: "fa 5 min",
      testId: "activity-maria-checkin"
    },
    {
      icon: Clock,
      color: "text-accent bg-accent/10",
      title: "Retard detectat: Pere Martínez",
      subtitle: "08:25 - Educació Secundària",
      time: "fa 10 min",
      testId: "activity-pere-late"
    },
    {
      icon: Shield,
      color: "text-primary bg-primary/10",
      title: "Guàrdia assignada automàticament",
      subtitle: "Anna López - Aula 203",
      time: "fa 15 min",
      testId: "activity-guard-assigned"
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
                  <p className="text-3xl font-bold text-text">
                    {stat.value}
                    {stat.total && <span className="text-lg text-gray-500"> / {stat.total}</span>}
                  </p>
                  {stat.change && (
                    <p className="text-sm text-gray-500">{stat.change}</p>
                  )}
                  {stat.subtitle && (
                    <p className="text-sm text-gray-500">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <stat.icon className={`${stat.color} text-xl h-6 w-6`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <Card data-testid="quick-actions-card">
          <CardHeader>
            <CardTitle>{t("quick_actions", language)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                className={`w-full justify-start ${action.color} text-white`}
                data-testid={action.testId}
              >
                <action.icon className="mr-3 h-4 w-4" />
                {action.title}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card data-testid="recent-activity-card">
            <CardHeader>
              <CardTitle>{t("recent_activity", language)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center" data-testid={activity.testId}>
                  <div className={`${activity.color} p-2 rounded-full mr-4`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">{activity.title}</p>
                    <p className="text-xs text-gray-600">{activity.subtitle}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance Chart Placeholder */}
      <Card data-testid="attendance-chart-card">
        <CardHeader>
          <CardTitle>{t("weekly_attendance", language)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t("weekly_attendance", language)}</p>
              <p className="text-sm text-gray-500">
                {language === "ca" ? "(Implementar amb Chart.js)" : "(Implementar con Chart.js)"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
