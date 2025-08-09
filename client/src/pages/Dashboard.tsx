import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, useRoleDisplay } from "@/hooks/usePermissions";
import { t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Clock, 
  UserPlus,
  FolderInput,
  Download,
  AlertTriangle,
  Info,
  BarChart3,
  MessageSquare,
  Send,
  Inbox,
  LogIn,
  LogOut,
  Calendar,
  TrendingUp,
  Filter,
  Eye
} from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const permissions = usePermissions();
  const { getRoleDisplayName } = useRoleDisplay();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [, setLocation] = useLocation();

  // Get institution ID from authenticated user
  const institutionId = user?.institutionId;

  const { data: stats, isLoading } = useQuery<{
    totalEmployees: number;
    presentEmployees: number;
    activeAlerts: number;
  }>({
    queryKey: ["/api/dashboard/stats", institutionId],
    enabled: !!institutionId,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery<any[]>({
    queryKey: ["/api/dashboard/recent-activity", institutionId],
    enabled: !!institutionId,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: weeklyStats, isLoading: weeklyLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/weekly-stats", institutionId],
    enabled: !!institutionId,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ara mateix";
    if (diffMins < 60) return `Fa ${diffMins} min`;
    if (diffHours < 24) return `Fa ${diffHours}h`;
    if (diffDays < 7) return `Fa ${diffDays} dies`;
    return date.toLocaleDateString("ca-ES");
  };

  const getActivityIcon = (type: string, action: string) => {
    if (type === 'communication') {
      return action === 'sent' ? <Send className="h-4 w-4" /> : <Inbox className="h-4 w-4" />;
    }
    if (type === 'attendance') {
      return action === 'check-in' ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />;
    }
    return <Info className="h-4 w-4" />;
  };

  const getActivityColor = (type: string, action: string, priority?: string) => {
    if (type === 'communication') {
      if (priority === 'urgent') return "text-red-600 bg-red-50";
      if (priority === 'high') return "text-orange-600 bg-orange-50";
      return action === 'sent' ? "text-blue-600 bg-blue-50" : "text-green-600 bg-green-50";
    }
    if (type === 'attendance') {
      return action === 'check-in' ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50";
    }
    return "text-gray-600 bg-gray-50";
  };

  const handleActivityClick = (activity: any) => {
    if (activity.type === 'communication') {
      setLocation('/communications');
    } else if (activity.type === 'attendance') {
      setLocation('/attendance');
    }
  };

  const getCurrentWeekDates = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysFromMonday);
    
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    
    return {
      start: monday.toLocaleDateString("ca-ES", { day: 'numeric', month: 'short' }),
      end: friday.toLocaleDateString("ca-ES", { day: 'numeric', month: 'short' })
    };
  };

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
      value: (stats?.totalEmployees && stats?.totalEmployees > 0) ? Math.round(((stats?.presentEmployees || 0) / stats.totalEmployees) * 100) : 0,
      suffix: "%",
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10",
      testId: "stat-attendance-rate"
    },
  ];

  return (
    <main className="p-6">
      {/* Header with current time and user info */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Tauler de Control
          </h1>
          <p className="text-muted-foreground">
            {getRoleDisplayName(user?.role || '', language)} • {new Date().toLocaleDateString("ca-ES")}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{timeString}</div>
          <div className="text-sm text-muted-foreground">Hora actual</div>
        </div>
      </div>

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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {permissions.canViewEmployees && (
          <Button
            variant="outline"
            className="h-16 flex flex-col gap-2"
            onClick={() => setLocation("/employees")}
            data-testid="button-employees"
          >
            <Users className="h-5 w-5" />
            <span className="text-sm">{t("manage_employees", language)}</span>
          </Button>
        )}

        {permissions.canViewOwnAttendance && (
          <Button
            variant="outline"
            className="h-16 flex flex-col gap-2"
            onClick={() => setLocation("/attendance")}
            data-testid="button-attendance"
          >
            <Clock className="h-5 w-5" />
            <span className="text-sm">{t("attendance", language)}</span>
          </Button>
        )}

        <Button
          variant="outline"
          className="h-16 flex flex-col gap-2"
          onClick={() => setLocation("/communications")}
          data-testid="button-communications"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-sm">Comunicacions</span>
        </Button>

        <Button
          variant="outline"
          className="h-16 flex flex-col gap-2"
          onClick={() => setLocation("/reports")}
          data-testid="button-reports"
        >
          <Download className="h-5 w-5" />
          <span className="text-sm">{t("reports", language)}</span>
        </Button>
      </div>

      {/* Main Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Activitat Recent
              {user?.role !== 'employee' && (
                <Badge variant="secondary" className="ml-2">
                  {user?.role === 'admin' ? 'Vista Centre' : 'Vista Global'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hi ha activitat recent</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={`${activity.type}-${activity.id}-${index}`}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleActivityClick(activity)}
                      data-testid={`activity-${activity.type}-${index}`}
                    >
                      <div className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type, activity.action, activity.priority)}`}>
                        {getActivityIcon(activity.type, activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground line-clamp-1">
                              {activity.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {activity.description}
                            </p>
                            {user?.role !== 'employee' && activity.relatedUserName && (
                              <p className="text-xs text-blue-600 mt-1">
                                {activity.relatedUserName}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(activity.timestamp)}
                            </span>
                            {activity.priority && activity.priority !== 'medium' && (
                              <Badge 
                                variant={activity.priority === 'urgent' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {activity.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Weekly Attendance Stats */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Assistència Setmanal
              <Badge variant="outline" className="ml-2">
                {getCurrentWeekDates().start} - {getCurrentWeekDates().end}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : !weeklyStats ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hi ha dades d'assistència aquesta setmana</p>
              </div>
            ) : (
              <div className="space-y-4">
                {user?.role === 'employee' ? (
                  // Personal stats view
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {weeklyStats.daysPresent || 0}
                        </div>
                        <div className="text-xs text-green-600">Dies Assistència</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round((weeklyStats.totalHours || 0) * 10) / 10}h
                        </div>
                        <div className="text-xs text-blue-600">Total Hores</div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {Math.round((weeklyStats.averageHoursPerDay || 0) * 10) / 10}h
                        </div>
                        <div className="text-xs text-orange-600">Mitjana Diària</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Detall Diari</h4>
                      <ScrollArea className="h-[200px]">
                        {weeklyStats.personalStats?.length > 0 ? (
                          weeklyStats.personalStats.map((day: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded border-l-4 border-l-green-400 bg-green-50/50 mb-2">
                              <div>
                                <p className="font-medium text-sm">
                                  {new Date(day.day).toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {day.check_ins > 0 ? `${day.check_ins} entrades, ${day.check_outs} sortides` : 'Sense registres'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm">
                                  {day.hours_worked ? `${Math.round(day.hours_worked * 10) / 10}h` : '0h'}
                                </p>
                                {day.first_check_in && (
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(day.first_check_in).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-4">No hi ha registres aquesta setmana</p>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  // Admin/Director view
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {weeklyStats.summary?.total_employees || 0}
                        </div>
                        <div className="text-xs text-blue-600">Total Empleats</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {weeklyStats.summary?.employees_with_records || 0}
                        </div>
                        <div className="text-xs text-green-600">Amb Registres</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Empleats aquesta setmana</h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setLocation('/attendance')}
                          className="text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Veure tot
                        </Button>
                      </div>
                      <ScrollArea className="h-[200px]">
                        {weeklyStats.employeeStats && weeklyStats.employeeStats.length > 0 ? (
                          weeklyStats.employeeStats
                            .filter((emp: any) => emp.day) // Only show employees with records
                            .slice(0, 20) // Limit to prevent performance issues
                            .map((emp: any, index: number) => (
                            <div key={`${emp.user_id}-${emp.day}-${index}`} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 mb-1">
                              <div>
                                <p className="font-medium text-sm">{emp.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(emp.day).toLocaleDateString('ca-ES', { weekday: 'short', day: 'numeric' })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm">
                                  {emp.hours_worked ? `${Math.round(emp.hours_worked * 10) / 10}h` : '0h'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {emp.check_ins || 0}E/{emp.check_outs || 0}S
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-4">No hi ha registres d'empleats aquesta setmana</p>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}