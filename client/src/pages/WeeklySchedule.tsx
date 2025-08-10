import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Calendar, Clock, BookOpen, Users, ChevronLeft, ChevronRight, Timer } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { ca, es } from "date-fns/locale";
import { calculateExpectedTimes, getTodayDayOfWeek, type ScheduleSession } from "@/lib/scheduleUtils";

// ScheduleSession interface moved to scheduleUtils.ts

export default function WeeklySchedule() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const locale = language === "ca" ? ca : es;

  // Memoize calculations to prevent re-renders
  const weekStart = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 1 }), [currentWeek]);
  const weekStartString = useMemo(() => format(weekStart, 'yyyy-MM-dd'), [weekStart]);
  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const hourPeriods = useMemo(() => Array.from({ length: 8 }, (_, i) => i + 1), []); // Hours 1-8

  // Get weekly schedule data
  const { data: scheduleData, isLoading, error } = useQuery({
    queryKey: ['/api/schedule/weekly', user?.id, weekStartString],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/schedule/weekly/${user.id}/${weekStartString}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const getSessionForSlot = (day: number, hour: number): ScheduleSession | null => {
    if (!scheduleData || !Array.isArray(scheduleData)) return null;
    return scheduleData.find(
      (session: ScheduleSession) => session.dayOfWeek === day && session.hourPeriod === hour
    ) || null;
  };

  const getTimeForHour = (hour: number): string => {
    // Institut Bitàcola schedule according to specifications
    const times = [
      "08:00-09:00", // 1a hora
      "09:00-10:00", // 2a hora  
      "10:00-11:00", // 3a hora
      "11:30-12:30", // 4a hora (després del pati 11:00-11:30)
      "12:30-13:30", // 5a hora
      "13:30-14:30", // 6a hora
      "15:30-16:30", // 7a hora (després del dinar 14:30-15:30)
      "16:30-17:30"  // 8a hora
    ];
    return times[hour - 1] || `${7 + hour}:00-${8 + hour}:00`;
  };

  const isBreakTime = (hour: number): boolean => {
    return false; // No break time rows, just time gaps
  };

  // Memoize calculations to prevent re-renders
  const totalHours = useMemo(() => {
    if (!scheduleData || !Array.isArray(scheduleData)) return { lective: 0, nonLective: 0 };
    
    const lective = scheduleData.filter((s: ScheduleSession) => s.isLectiveHour).length;
    const nonLective = scheduleData.filter((s: ScheduleSession) => !s.isLectiveHour).length;
    
    return { lective, nonLective };
  }, [scheduleData]);

  const { lective, nonLective } = totalHours;

  // Calculate expected times for today - memoized
  const todayDayOfWeek = useMemo(() => getTodayDayOfWeek(), []);
  const todayExpectedTimes = useMemo(() => 
    calculateExpectedTimes(scheduleData || [], todayDayOfWeek), 
    [scheduleData, todayDayOfWeek]
  );
  const isToday = useMemo(() => isSameDay(new Date(), new Date()), []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              {language === "ca" ? "El meu horari personal" : "Mi horario personal"}
            </h1>
            <p className="text-muted-foreground">
              {language === "ca" 
                ? "Visualitza el teu horari de classes personal" 
                : "Visualiza tu horario de clases personal"}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              data-testid="button-previous-week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium px-3">
              {format(weekStart, 'dd MMM', { locale })} - {format(addDays(weekStart, 4), 'dd MMM yyyy', { locale })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              data-testid="button-next-week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Today's Expected Times */}
        {isToday && todayExpectedTimes.hasScheduleToday && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <Timer className="h-5 w-5" />
                {language === "ca" ? "Horaris previstos d'avui" : "Horarios previstos de hoy"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border">
                  <div className="text-lg font-bold text-green-700 dark:text-green-400">
                    {todayExpectedTimes.expectedEntry || "--:--"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === "ca" ? "Entrada prevista" : "Entrada prevista"}
                  </div>
                </div>
                <div className="text-center p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border">
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    {todayExpectedTimes.expectedExit || "--:--"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === "ca" ? "Sortida prevista" : "Salida prevista"}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {language === "ca" 
                    ? "Horaris calculats segons la primera i última classe del dia" 
                    : "Horarios calculados según la primera y última clase del día"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hours summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{lective}</div>
                <div className="text-sm text-muted-foreground">
                  {language === "ca" ? "Hores lectives" : "Horas lectivas"}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{nonLective}</div>
                <div className="text-sm text-muted-foreground">
                  {language === "ca" ? "Hores no lectives" : "Horas no lectivas"}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{lective + nonLective}</div>
                <div className="text-sm text-muted-foreground">
                  {language === "ca" ? "Total hores" : "Total horas"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {language === "ca" ? "Horari setmanal" : "Horario semanal"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-muted text-left w-24">
                    {language === "ca" ? "Hora" : "Hora"}
                  </th>
                  {weekDays.map((day, index) => (
                    <th key={index} className="border p-2 bg-muted text-center min-w-[200px]">
                      <div className="font-medium">
                        {format(day, 'EEEE', { locale })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(day, 'dd/MM', { locale })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hourPeriods.map((hour) => {
                  // Add visual separator after 3rd hour (pati) and 6th hour (dinar)
                  const showSeparator = hour === 3 || hour === 6;
                  
                  return (
                    <React.Fragment key={`hour-${hour}`}>
                      <tr>
                        <td className="border p-2 text-sm font-medium">
                          <div>{hour}ª</div>
                          <div className="text-xs text-muted-foreground">
                            {getTimeForHour(hour)}
                          </div>
                        </td>
                        {weekDays.map((day, dayIndex) => {
                          const dayOfWeek = dayIndex + 1; // Monday = 1
                          const session = getSessionForSlot(dayOfWeek, hour);
                          
                          if (!session) {
                            return (
                              <td key={dayIndex} className="border p-2 text-center text-muted-foreground">
                                -
                              </td>
                            );
                          }
                          
                          return (
                            <td key={dayIndex} className="border p-2">
                              <div className={`p-2 rounded text-sm ${
                                session.isLectiveHour 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-l-blue-500'
                                  : 'bg-orange-100 dark:bg-orange-900/30 border-l-4 border-l-orange-500'
                              }`}>
                                <div className="font-medium flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {session.subjectName || session.subjectCode}
                                </div>
                                {session.groupCode && (
                                  <div className="text-xs flex items-center gap-1 mt-1">
                                    <Users className="h-3 w-3" />
                                    {session.groupCode}
                                  </div>
                                )}
                                {session.classroomCode && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {session.classroomCode}
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      {showSeparator && (
                        <tr className="bg-yellow-50 dark:bg-yellow-900/10">
                          <td className="border p-1 text-xs text-center text-muted-foreground">
                            {hour === 3 ? (language === "ca" ? "Pati" : "Recreo") : (language === "ca" ? "Dinar" : "Comida")}
                          </td>
                          {weekDays.map((_, dayIndex) => (
                            <td key={dayIndex} className="border p-1 text-xs text-center text-muted-foreground">
                              {hour === 3 ? "11:00-11:30" : "14:30-15:30"}
                            </td>
                          ))}
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 border-l-4 border-l-blue-500 rounded"></div>
              <span>{language === "ca" ? "Hores lectives" : "Horas lectivas"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 dark:bg-orange-900/30 border-l-4 border-l-orange-500 rounded"></div>
              <span>{language === "ca" ? "Hores no lectives" : "Horas no lectivas"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}