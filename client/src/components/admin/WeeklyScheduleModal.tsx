import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Coffee } from "lucide-react";

interface WeeklyScheduleModalProps {
  userId: string;
  onClose: () => void;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ScheduleEntry {
  dayOfWeek: number;
  hourPeriod: number;
  timeSlot: string;
  subjectCode: string;
  groupCode: string;
  classroomCode: string;
  title: string;
  location: string;
}

export function WeeklyScheduleModal({ userId, onClose }: WeeklyScheduleModalProps) {
  const { data: user } = useQuery({
    queryKey: ['/api/admin/employees', userId],
    queryFn: () => apiRequest(`/api/admin/employees/${userId}`),
  }) as { data: User | undefined };

  const { data: schedule = [], isLoading } = useQuery({
    queryKey: ['/api/admin/personal-schedule', userId],
    queryFn: () => apiRequest(`/api/admin/personal-schedule/${userId}?week=${getCurrentWeek()}`),
  }) as { data: ScheduleEntry[]; isLoading: boolean };

  const getCurrentWeek = () => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    return monday.toISOString().split('T')[0];
  };

  const dayNames = [
    'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'
  ];

  const getScheduleForDay = (dayIndex: number): ScheduleEntry[] => {
    return schedule.filter((entry) => entry.dayOfWeek === dayIndex + 1);
  };

  const calculateTotalSessions = () => {
    return schedule.length;
  };

  const getUniqueSubjects = () => {
    const subjects = new Set(schedule.map(entry => entry.subjectCode));
    return subjects.size;
  };

  const getHourLabel = (hourPeriod: number): string => {
    const ordinals = ['1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a'];
    return ordinals[hourPeriod - 1] ? `${ordinals[hourPeriod - 1]} hora` : `Hora ${hourPeriod}`;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto modal-content-solid">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Horari Setmanal - {user?.firstName} {user?.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {calculateTotalSessions()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Sessions Setmanals
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {getUniqueSubjects()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Matèries Diferents
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  Professor/a
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Schedule Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayNames.map((dayName, index) => {
                const daySchedule = getScheduleForDay(index);
                
                return (
                  <Card key={index} className={daySchedule.length > 0 ? "border-green-200" : "border-gray-200"}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        {dayName}
                        {daySchedule.length > 0 && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {daySchedule.length} sessions
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {daySchedule.length > 0 ? (
                        <>
                          {/* Sessions */}
                          {daySchedule
                            .sort((a, b) => a.hourPeriod - b.hourPeriod)
                            .map((session, sessionIndex) => (
                              <div key={sessionIndex}>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-blue-500" />
                                      <span className="font-medium text-blue-700 dark:text-blue-300">
                                        {getHourLabel(session.hourPeriod)}
                                      </span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {session.subjectCode}
                                    </Badge>
                                  </div>
                                  
                                  <div className="text-sm space-y-1">
                                    <div className="font-medium">
                                      {session.title}
                                    </div>
                                    
                                    {session.classroomCode && (
                                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                        <MapPin className="h-3 w-3" />
                                        <span>{session.classroomCode}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Pati coeducatiu entre 3a i 4a hora */}
                                {session.hourPeriod === 3 && (
                                  <div className="my-2 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                    <div className="flex items-center gap-2">
                                      <Coffee className="h-4 w-4 text-yellow-600" />
                                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                                        Patis Coeducatius
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          
                          {/* Total sessions for day */}
                          <div className="pt-2 border-t">
                            <div className="text-sm font-medium text-center text-green-600">
                              {daySchedule.length} sessions aquest dia
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Sense horari definit</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}