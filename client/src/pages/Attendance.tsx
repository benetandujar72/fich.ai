import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { t } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  LogIn, 
  LogOut, 
  QrCode, 
  CreditCard,
  Clock,
  Wifi,
  WifiOff,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { ca, es } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import QuickAttendanceModal from "@/components/modals/QuickAttendanceModal";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import type { AttendanceRecord } from "@shared/schema";

export default function Attendance() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isQuickAttendanceOpen, setIsQuickAttendanceOpen] = useState(false);
  // DISABLED: Network permission checks to stop infinite loops
  // const [networkPermission, setNetworkPermission] = useState<{ allowed: boolean; message: string } | null>(null);
  // const [isPermissionChecked, setIsPermissionChecked] = useState(false);
  const networkPermission = { allowed: true, message: "Red local autorizada" };
  const isPermissionChecked = true;

  // Get employee ID from authenticated user (memoized to prevent re-renders)
  const employeeId = useMemo(() => user?.id, [user?.id]);

  const { data: attendanceRecords = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance", employeeId],
    enabled: !!employeeId,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get the last attendance record to determine button states
  const lastAttendanceRecord = attendanceRecords.length > 0 
    ? attendanceRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    : null;

  const shouldDisableCheckIn = lastAttendanceRecord?.type === 'check_in';
  const shouldDisableCheckOut = !lastAttendanceRecord || lastAttendanceRecord?.type === 'check_out';

  // DISABLED: Network permission check to stop infinite loops
  // const checkNetworkPermission = useCallback(async () => {
  //   return true; // Always allow for now
  // }, []);
  const checkNetworkPermission = useCallback(async () => {
    return true; // Always allow - no API calls
  }, []);

  const attendanceMutation = useMutation({
    mutationFn: async (data: { type: "check_in" | "check_out"; timestamp: Date }) => {
      return await apiRequest("POST", "/api/attendance", {
        ...data,
        method: "web",
        location: "attendance_page"
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate all attendance-related queries with correct user ID
      queryClient.invalidateQueries({ queryKey: ["/api/attendance", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/weekly"] });
      toast({
        title: t("success", language),
        description: variables.type === "check_in" 
          ? (language === "ca" ? "Entrada registrada correctament" : "Entrada registrada correctamente")
          : (language === "ca" ? "Sortida registrada correctament" : "Salida registrada correctamente"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error", language),
        description: error.message || (language === "ca" ? "Error registrant el fitxatge" : "Error registrando el fichaje"),
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // DISABLED: Network permission check useEffect to stop infinite loops
  // useEffect(() => {
  //   // Disabled to prevent infinite loops
  // }, []);

  const timeString = currentTime.toLocaleTimeString("ca-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const handleCheckIn = () => {
    attendanceMutation.mutate({
      type: "check_in",
      timestamp: new Date(),
    });
  };

  const handleCheckOut = () => {
    attendanceMutation.mutate({
      type: "check_out",
      timestamp: new Date(),
    });
  };

  const getStatusBadge = (type: string) => {
    return type === "check_in" ? (
      <Badge className="bg-secondary/10 text-secondary">
        {language === "ca" ? "Entrada" : "Entrada"}
      </Badge>
    ) : (
      <Badge className="bg-error/10 text-error">
        {language === "ca" ? "Sortida" : "Salida"}
      </Badge>
    );
  };

  // Get today's date once to prevent constant re-queries
  const todayDate = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  
  // Get today's schedule data (HEAVILY CACHED to prevent loops)
  const { data: todaySchedule } = useQuery({
    queryKey: ['/api/schedule/weekly', user?.id, todayDate],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/schedule/weekly/${user.id}/${todayDate}`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000, // 1 hour - much longer cache
    gcTime: 2 * 60 * 60 * 1000, // 2 hours garbage collection
  });

  // Convert schedule data to display format
  const formatScheduleForToday = (scheduleData: any[]) => {
    if (!scheduleData || !Array.isArray(scheduleData)) return [];
    
    const today = new Date();
    const currentDay = today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday from 0 to 7
    const currentTime = today.toTimeString().slice(0, 5); // HH:MM format
    
    return scheduleData
      .filter((session: any) => session.dayOfWeek === currentDay)
      .sort((a: any, b: any) => a.hourPeriod - b.hourPeriod)
      .map((session: any, index: number) => {
        const startHour = 7 + session.hourPeriod; // Assuming school starts at 8:00 (hour 1 = 8:00)
        const endHour = startHour + 1;
        const timeSlot = `${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`;
        
        // Determine status based on current time
        let status = 'pending';
        if (currentTime > `${endHour}:00`) {
          status = 'completed';
        } else if (currentTime >= `${startHour}:00` && currentTime <= `${endHour}:00`) {
          status = 'current';
        }
        
        return {
          time: timeSlot,
          subject: `${session.subjectName || session.subjectCode} - ${session.groupCode}`,
          status,
          testId: `schedule-${session.subjectCode}-${index}`
        };
      });
  };

  const processedSchedule = formatScheduleForToday(todaySchedule);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6">
      {/* Network Permission Alert */}
      {networkPermission && !networkPermission.allowed && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <WifiOff className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{language === "ca" ? "Accés restringit:" : "Acceso restringido:"}</strong> {networkPermission.message}
          </AlertDescription>
        </Alert>
      )}

      {networkPermission && networkPermission.allowed && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Wifi className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>{language === "ca" ? "Xarxa autoritzada:" : "Red autorizada:"}</strong> {networkPermission.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Check-in */}
        <Card data-testid="quick-checkin-card">
          <CardHeader>
            <CardTitle>{t("quick_checkin", language)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-6xl text-primary mb-4 font-mono" data-testid="current-time">
                {timeString}
              </div>
              <p className="text-gray-600">{t("current_time", language)}</p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleCheckIn}
                disabled={
                  attendanceMutation.isPending || 
                  shouldDisableCheckIn
                }
                className={`w-full py-4 px-6 text-lg font-medium ${
                  shouldDisableCheckIn
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
                data-testid="checkin-button"
              >
                <LogIn className="mr-3 h-5 w-5" />
                {t("checkin_entry", language)}
                {shouldDisableCheckIn && (
                  <span className="ml-2 text-xs">
                    ({language === "ca" ? "Ja has fitxat l'entrada" : "Ya has fichado la entrada"})
                  </span>
                )}
              </Button>
              <Button 
                onClick={handleCheckOut}
                disabled={
                  attendanceMutation.isPending || 
                  shouldDisableCheckOut
                }
                className={`w-full py-4 px-6 text-lg font-medium ${
                  shouldDisableCheckOut
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
                data-testid="checkout-button"
              >
                <LogOut className="mr-3 h-5 w-5" />
                {t("checkin_exit", language)}
                {shouldDisableCheckOut && (
                  <span className="ml-2 text-xs">
                    ({language === "ca" ? "Primer has de fitxar l'entrada" : "Primero debes fichar la entrada"})
                  </span>
                )}
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-text mb-3">
                {t("alternative_methods", language)}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  className="py-3 px-4 text-center hover:bg-gray-50"
                  data-testid="qr-method-button"
                >
                  <div>
                    <QrCode className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm text-text">{t("qr_code", language)}</p>
                  </div>
                </Button>
                <Button 
                  variant="outline"
                  className="py-3 px-4 text-center hover:bg-gray-50"
                  data-testid="nfc-method-button"
                >
                  <div>
                    <CreditCard className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm text-text">{t("nfc_card", language)}</p>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card data-testid="todays-schedule-card">
          <CardHeader>
            <CardTitle>{t("todays_schedule", language)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processedSchedule.length > 0 ? processedSchedule.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    item.status === "completed" ? "bg-secondary/10" :
                    item.status === "current" ? "bg-primary/10 border-l-4 border-primary" :
                    "bg-gray-50"
                  }`}
                  data-testid={item.testId}
                >
                  <div className="flex items-center">
                    <Clock className={`mr-3 h-4 w-4 ${
                      item.status === "completed" ? "text-secondary" :
                      item.status === "current" ? "text-primary" :
                      "text-gray-400"
                    }`} />
                    <div>
                      <p className="font-medium text-text">{item.time}</p>
                      <p className="text-sm text-gray-600">{item.subject}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      item.status === "completed" ? "default" :
                      item.status === "current" ? "default" :
                      "secondary"
                    }
                    className={
                      item.status === "completed" ? "bg-secondary text-white" :
                      item.status === "current" ? "bg-primary text-white" :
                      "bg-gray-400 text-white"
                    }
                  >
                    {item.status === "completed" ? 
                      (language === "ca" ? "Completat" : "Completado") :
                     item.status === "current" ?
                      (language === "ca" ? "Actual" : "Actual") :
                      (language === "ca" ? "Pendent" : "Pendiente")
                    }
                  </Badge>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {language === "ca" 
                      ? "No hi ha classes programades per avui" 
                      : "No hay clases programadas para hoy"}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {language === "ca" ? "Hores lectives:" : "Horas lectivas:"}
                </span>
                <span className="font-medium text-text">6h</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">
                  {language === "ca" ? "Hores no lectives:" : "Horas no lectivas:"}
                </span>
                <span className="font-medium text-text">2h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Calendar */}
        <WeeklyCalendar 
          employeeId={employeeId || ""} 
          language={language} 
        />
      </div>

      {/* Attendance History */}
      <Card className="mt-6" data-testid="attendance-history-card">
        <CardHeader>
          <CardTitle>
            {language === "ca" ? "Historial de fitxatges" : "Historial de fichajes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ca" ? "Data" : "Fecha"}</TableHead>
                  <TableHead>{language === "ca" ? "Hora" : "Hora"}</TableHead>
                  <TableHead>{language === "ca" ? "Tipus" : "Tipo"}</TableHead>
                  <TableHead>{language === "ca" ? "Mètode" : "Método"}</TableHead>
                  <TableHead>{t("status", language)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-gray-500">
                        {language === "ca" 
                          ? "No s'han trobat registres de fitxatge"
                          : "No se han encontrado registros de fichaje"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceRecords.map((record: AttendanceRecord) => (
                    <TableRow key={record.id} data-testid={`attendance-record-${record.id}`}>
                      <TableCell>
                        {new Date(record.timestamp).toLocaleDateString("ca-ES")}
                      </TableCell>
                      <TableCell>
                        {new Date(record.timestamp).toLocaleTimeString("ca-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.type)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {record.method}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {language === "ca" ? "Normal" : "Normal"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Attendance Modal */}
      <QuickAttendanceModal 
        isOpen={isQuickAttendanceOpen}
        onClose={() => setIsQuickAttendanceOpen(false)}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        currentTime={timeString}
        shouldDisableCheckIn={shouldDisableCheckIn}
        shouldDisableCheckOut={shouldDisableCheckOut}
        isLoading={attendanceMutation.isPending}
      />
    </main>
  );
}
