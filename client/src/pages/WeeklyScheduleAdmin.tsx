import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { ca, es } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, Users } from 'lucide-react';

interface EmployeeSchedule {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  totalSessions: number;
  weeklyHours: number;
}

interface PersonalScheduleSession {
  dayOfWeek: number;
  hourPeriod: number;
  startTime: string;
  endTime: string;
  subjectCode: string;
  groupCode: string;
  classroomCode: string;
}

export default function WeeklyScheduleAdmin() {
  const { language } = useLanguage();
  const locale = language === "ca" ? ca : es;
  
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSchedule | null>(null);
  const [isPersonalScheduleOpen, setIsPersonalScheduleOpen] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start

  // Fetch employees with their weekly schedules
  const { data: employeeSchedules = [], isLoading } = useQuery<EmployeeSchedule[]>({
    queryKey: ["/api/admin/weekly-schedule", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/weekly-schedule?week=${format(weekStart, "yyyy-MM-dd")}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weekly schedule');
      }
      
      return response.json();
    }
  });

  // Fetch personal schedule for selected employee
  const { data: personalSchedule = [] } = useQuery<PersonalScheduleSession[]>({
    queryKey: ["/api/admin/personal-schedule", selectedEmployee?.id, format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!selectedEmployee?.id) return [];
      
      const response = await fetch(
        `/api/admin/personal-schedule/${selectedEmployee.id}?week=${format(weekStart, "yyyy-MM-dd")}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch personal schedule');
      }
      
      return response.json();
    },
    enabled: !!selectedEmployee?.id
  });

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentWeek(subWeeks(currentWeek, 1));
    } else {
      setCurrentWeek(addWeeks(currentWeek, 1));
    }
  };

  const openPersonalSchedule = (employee: EmployeeSchedule) => {
    setSelectedEmployee(employee);
    setIsPersonalScheduleOpen(true);
  };

  const getScheduleByDay = (dayOfWeek: number) => {
    return personalSchedule.filter(session => session.dayOfWeek === dayOfWeek);
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
  };

  const weekDays = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres'];
  const timeSlots = [
    { period: 1, label: '08:00 - 08:55' },
    { period: 2, label: '09:00 - 09:55' },
    { period: 3, label: '10:00 - 10:55' },
    { period: 4, label: '11:00 - 11:55' },
    { period: 5, label: '12:00 - 12:55' },
    { period: 6, label: '13:00 - 13:55' },
    { period: 7, label: '14:00 - 14:55' },
    { period: 8, label: '15:00 - 15:55' }
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{t('weeklySchedule')}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium">
            {format(weekStart, 'dd/MM/yyyy', { locale })} - {format(addDays(weekStart, 6), 'dd/MM/yyyy', { locale })}
          </span>
          <Button variant="outline" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Personal de l'Institut - Horaris Setmanals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employeeSchedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hi ha horaris disponibles per aquesta setmana</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {employeeSchedules.map(employee => (
                <div 
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                  onClick={() => openPersonalSchedule(employee)}
                  data-testid={`employee-schedule-${employee.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{employee.weeklyHours}h</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {employee.totalSessions} sessions
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {employee.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Schedule Dialog */}
      <Dialog open={isPersonalScheduleOpen} onOpenChange={setIsPersonalScheduleOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-foreground">
              <User className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              <span>
                Horari Personal - {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="grid grid-cols-6 gap-2 mb-4">
              <div className="p-3 text-sm font-medium text-center bg-rose-100 dark:bg-slate-800 text-rose-800 dark:text-rose-200 rounded border border-rose-200 dark:border-slate-600">
                Hora
              </div>
              {weekDays.map(day => (
                <div key={day} className="p-3 text-sm font-medium text-center bg-rose-100 dark:bg-slate-800 text-rose-800 dark:text-rose-200 rounded border border-rose-200 dark:border-slate-600">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-6 gap-2">
              {timeSlots.map(slot => (
                <div key={slot.period} className="contents">
                  <div className="p-2 text-xs text-center bg-rose-50 dark:bg-slate-800/50 rounded text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-slate-600">
                    {slot.label}
                  </div>
                  {[1, 2, 3, 4, 5].map(dayOfWeek => {
                    const daySchedule = getScheduleByDay(dayOfWeek);
                    const session = daySchedule.find(s => s.hourPeriod === slot.period);
                    
                    return (
                      <div key={`${dayOfWeek}-${slot.period}`} className="min-h-[60px] border border-rose-200 dark:border-slate-600 rounded bg-white dark:bg-slate-900">
                        {session ? (
                          <div className="p-2 h-full bg-rose-50 dark:bg-rose-950/30 border-l-4 border-rose-500 dark:border-rose-400 rounded">
                            <div className="text-xs font-medium text-rose-700 dark:text-rose-300">
                              {session.subjectCode}
                            </div>
                            <div className="text-xs text-rose-600 dark:text-rose-400">
                              {session.groupCode}
                            </div>
                            <div className="text-xs text-rose-500 dark:text-rose-500">
                              {session.classroomCode}
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                            <span className="text-xs">-</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}