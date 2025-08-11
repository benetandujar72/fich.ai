import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWeekend, startOfMonth, endOfMonth, getDay } from "date-fns";
import { ca, es } from "date-fns/locale";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
// Define the employee type expected from the admin employees endpoint
interface AdminEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  lastAttendance: string | null;
  totalHours: string;
}

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: AdminEmployee | null;
  institutionId: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  scheduledStart?: string;
  scheduledEnd?: string;
  scheduledPeriods?: number;
  totalHours: number;
  status: 'present' | 'late' | 'absent' | 'partial';
  lateMinutes?: number;
}

export default function EmployeeDetailModal({ 
  isOpen, 
  onClose, 
  employee, 
  institutionId 
}: EmployeeDetailModalProps) {
  const { language } = useLanguage();
  const locale = language === "ca" ? ca : es;
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: attendanceHistory = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance-history", employee?.id, format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      if (!employee?.id) return [];
      
      const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      
      console.log('ATTENDANCE_HISTORY: Fetching for employee:', employee.id, 'period:', startDate, 'to', endDate);
      
      const response = await fetch(
        `/api/attendance-history/${employee.id}?startDate=${startDate}&endDate=${endDate}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance history');
      }
      
      const data = await response.json();
      console.log('ATTENDANCE_HISTORY: Received data:', data);
      return data;
    },
    enabled: !!employee?.id && isOpen,
  });

  const getDayColor = (record: AttendanceRecord | null, isWorkDay: boolean) => {
    if (!record) {
      return "bg-red-100 text-red-700 border-red-200"; // No record = absent
    }
    
    // Check late minutes for color coding
    const lateMinutes = parseFloat(record.lateMinutes?.toString() || '0');
    
    if (lateMinutes <= 0) {
      return "bg-green-100 text-green-700 border-green-200"; // On time
    } else if (lateMinutes <= 15) {
      return "bg-yellow-100 text-yellow-700 border-yellow-200"; // Slightly late
    } else if (lateMinutes <= 30) {
      return "bg-orange-100 text-orange-700 border-orange-200"; // Late
    } else {
      return "bg-red-100 text-red-700 border-red-200"; // Very late
    }
  };

  const getStatusIcon = (record: AttendanceRecord | null, isWorkDay: boolean) => {
    if (!record) {
      return <XCircle className="h-3 w-3" />;
    }
    
    const lateMinutes = parseFloat(record.lateMinutes?.toString() || '0');
    
    if (lateMinutes <= 0) {
      return <CheckCircle className="h-3 w-3" />; // On time
    } else if (lateMinutes <= 30) {
      return <AlertCircle className="h-3 w-3" />; // Late but present
    } else {
      return <XCircle className="h-3 w-3" />; // Very late
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--:--';
    return format(new Date(timeString), 'HH:mm');
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  // Generate ONLY weekdays (Monday-Friday) for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const calendarDays = allDays.filter(day => {
    const dayOfWeek = getDay(day);
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Only Monday (1) to Friday (5)
  });

  // Create attendance record map for quick lookup
  const attendanceMap = new Map<string, AttendanceRecord>();
  attendanceHistory.forEach(record => {
    attendanceMap.set(record.date, record);
  });

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto modal-content-solid">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("employee_details", language)}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("personal_information", language)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("email", language)}</p>
                  <p className="text-sm text-muted-foreground">{employee.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("role", language)}</p>
                  <Badge variant="secondary">{employee.role}</Badge>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t("monthly_summary", language)}
                </h4>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>{t("actual_hours", language)}:</span>
                    <span className="font-mono">
                      {attendanceHistory.reduce((total, record) => total + (parseFloat(record.totalHours.toString()) || 0), 0).toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("work_days", language)}:</span>
                    <span className="font-mono">
                      {attendanceHistory.filter(r => r.checkIn).length}/{calendarDays.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("punctuality", language)}:</span>
                    <span className="font-mono">
                      {attendanceHistory.length > 0 
                        ? Math.round((attendanceHistory.filter(r => r.checkIn && (!r.lateMinutes || parseFloat(r.lateMinutes.toString()) <= 0)).length / Math.max(attendanceHistory.filter(r => r.checkIn).length, 1)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      {t("hours_difference", language)}:
                    </span>
                    <span className={`font-mono ${(() => {
                      const actualHours = attendanceHistory.reduce((total, record) => total + (parseFloat(record.totalHours) || 0), 0);
                      const expectedHours = calendarDays.length * 8; // Assuming 8h per day standard
                      const diff = actualHours - expectedHours;
                      return diff >= 0 ? 'text-green-600' : diff >= -5 ? 'text-orange-600' : 'text-red-600';
                    })()}`}>
                      {(() => {
                        const actualHours = attendanceHistory.reduce((total, record) => total + (parseFloat(record.totalHours.toString()) || 0), 0);
                        const expectedHours = calendarDays.length * 8; // Standard 8h workday
                        const diff = actualHours - expectedHours;
                        return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}h`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("attendance_history", language)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                    data-testid="prev-month-btn"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[120px] text-center">
                    {format(currentMonth, "MMMM yyyy", { locale })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                    data-testid="next-month-btn"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
                  <span>{t("on_time", language)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div>
                  <span>{t("slightly_late", language)} (&lt;15min)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></div>
                  <span>{t("late", language)} (&lt;30min)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
                  <span>{t("very_late_absent", language)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Day headers - Only weekdays */}
                  <div className="grid grid-cols-5 gap-1 mb-2">
                    {['L', 'M', 'X', 'J', 'V'].map(day => (
                      <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar days - Only weekdays */}
                  <div className="grid grid-cols-5 gap-1">
                    {calendarDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const record = attendanceMap.get(dateStr) || null;
                    const isWorkDay = !isWeekend(day);
                    const dayColor = getDayColor(record, isWorkDay);
                    const statusIcon = getStatusIcon(record, isWorkDay);
                    
                    return (
                      <div
                        key={dateStr}
                        className={`
                          p-2 text-xs rounded border cursor-pointer hover:opacity-80 transition-opacity
                          ${dayColor}
                        `}
                        title={
                          record 
                            ? `${format(day, 'dd/MM/yyyy', { locale })}
━━━━━━━━━━━━━━━━━━━━━━━━
📅 HORARI UNTIS PERSONALITZAT:
   Entrada: ${record.scheduledStart || 'Sense horari'} (programat)
   Sortida: ${record.scheduledEnd || 'Sense horari'} (programat)
   Períodes lectius: ${record.scheduledPeriods || '0'}

⏰ MARCATGE REAL:
   Entrada: ${formatTime(record.checkIn)}
   Sortida: ${formatTime(record.checkOut)}

📊 ANÀLISI DEL DIA:
   Retard entrada: ${Math.round(parseFloat(record.lateMinutes?.toString() || '0'))} min
   Hores treballades: ${parseFloat(record.totalHours?.toString() || '0').toFixed(1)}h
   ${(() => {
     const scheduled = record.scheduledPeriods ? record.scheduledPeriods * 0.9 : 0;
     const worked = parseFloat(record.totalHours?.toString() || '0');
     const overtime = worked - scheduled;
     return overtime > 1 ? `⚠️ Hores extres: +${overtime.toFixed(1)}h` : 'Jornada normal';
   })()}
   Estat: ${(() => {
     const late = parseFloat(record.lateMinutes?.toString() || '0');
     if (late <= 0) return 'Puntual ✅';
     if (late <= 15) return 'Lleuger retard ⚠️';
     if (late <= 30) return 'Retard moderat 🟠';
     return 'Retard greu ❌';
   })()}`
                            : `${format(day, 'dd/MM/yyyy', { locale })}
━━━━━━━━━━━━━━━━━━━━━━━━
📅 HORARI UNTIS PERSONALITZAT:
   ${isWorkDay ? 'Horari segons sessions importades d\'Untis' : 'Cap sessió programada'}

❌ SENSE ASSISTÈNCIA
${isWorkDay ? 'No s\'ha registrat cap marcatge aquest dia' : 'Dia no lectiu (cap sessió a Untis)'}`
                        }
                        data-testid={`day-${dateStr}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono">
                            {format(day, 'd')}
                          </span>
                          {statusIcon}
                        </div>
                        {record && (
                          <div className="mt-1 space-y-0.5 text-[10px]">
                            <div>{formatTime(record.checkIn)}</div>
                            <div>{formatTime(record.checkOut)}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}