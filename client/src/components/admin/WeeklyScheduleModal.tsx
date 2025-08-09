import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Coffee } from "lucide-react";

interface WeeklyScheduleModalProps {
  userId: string;
  onClose: () => void;
}

interface ScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  location?: string;
  notes?: string;
}

export function WeeklyScheduleModal({ userId, onClose }: WeeklyScheduleModalProps) {
  const { data: user } = useQuery({
    queryKey: ['/api/users', userId],
  });

  const { data: schedule = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users', userId, 'schedule'],
  });

  const dayNames = [
    'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'
  ];

  const getScheduleForDay = (dayIndex: number): ScheduleEntry | null => {
    return schedule.find((entry: ScheduleEntry) => entry.dayOfWeek === dayIndex + 1) || null;
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM format
  };

  const calculateTotalHours = () => {
    return schedule.reduce((total: number, entry: ScheduleEntry) => {
      const start = new Date(`2024-01-01T${entry.startTime}`);
      const end = new Date(`2024-01-01T${entry.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      // Subtract break time if exists
      if (entry.breakStart && entry.breakEnd) {
        const breakStart = new Date(`2024-01-01T${entry.breakStart}`);
        const breakEnd = new Date(`2024-01-01T${entry.breakEnd}`);
        const breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
        return total + hours - breakHours;
      }
      
      return total + hours;
    }, 0);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
                  {calculateTotalHours().toFixed(1)}h
                </div>
                <div className="text-sm text-muted-foreground">
                  Hores Setmanals
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {schedule.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Dies Laborals
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {user?.email}
                </div>
                <div className="text-sm text-muted-foreground">
                  Email
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
                  <Card key={index} className={daySchedule ? "border-green-200" : "border-gray-200"}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        {dayName}
                        {daySchedule && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Actiu
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {daySchedule ? (
                        <>
                          {/* Work Hours */}
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">
                              {formatTime(daySchedule.startTime)} - {formatTime(daySchedule.endTime)}
                            </span>
                          </div>

                          {/* Break Time */}
                          {daySchedule.breakStart && daySchedule.breakEnd && (
                            <div className="flex items-center gap-2 text-sm text-orange-600">
                              <Coffee className="h-4 w-4" />
                              <span>
                                Descans: {formatTime(daySchedule.breakStart)} - {formatTime(daySchedule.breakEnd)}
                              </span>
                            </div>
                          )}

                          {/* Location */}
                          {daySchedule.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{daySchedule.location}</span>
                            </div>
                          )}

                          {/* Notes */}
                          {daySchedule.notes && (
                            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {daySchedule.notes}
                            </div>
                          )}

                          {/* Total Hours for Day */}
                          <div className="pt-2 border-t">
                            <div className="text-sm font-medium text-center">
                              {(() => {
                                const start = new Date(`2024-01-01T${daySchedule.startTime}`);
                                const end = new Date(`2024-01-01T${daySchedule.endTime}`);
                                let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                
                                if (daySchedule.breakStart && daySchedule.breakEnd) {
                                  const breakStart = new Date(`2024-01-01T${daySchedule.breakStart}`);
                                  const breakEnd = new Date(`2024-01-01T${daySchedule.breakEnd}`);
                                  const breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
                                  hours -= breakHours;
                                }
                                
                                return `${hours.toFixed(1)}h total`;
                              })()}
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