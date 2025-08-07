import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  MessageCircle
} from "lucide-react";

interface WeeklyCalendarProps {
  employeeId: string;
  language: string;
}

interface DayAttendance {
  date: string;
  status: 'complete' | 'partial' | 'absent' | 'justified';
  checkIn?: string;
  checkOut?: string;
  totalHours?: number;
  justification?: {
    id: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    adminResponse?: string;
  };
}

export default function WeeklyCalendar({ employeeId, language }: WeeklyCalendarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [justificationReason, setJustificationReason] = useState("");
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Get current week's Monday
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(d.setDate(diff));
  };

  // Memoize weekStart to prevent recalculation on every render
  const weekStart = useMemo(() => getWeekStart(currentWeek), [currentWeek]);
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });

  // Fetch weekly attendance data with proper caching
  const { data: weeklyAttendance = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/attendance/weekly", employeeId, weekStart.toISOString()],
    enabled: !!employeeId,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
  
  // console.log('[DEBUG] WeeklyCalendar rendered with employeeId:', employeeId, 'weekStart:', weekStart.toISOString());

  // Submit absence justification
  const justificationMutation = useMutation({
    mutationFn: async (data: { date: string; reason: string }) => {
      return await apiRequest("POST", "/api/absence-justifications", {
        employeeId,
        date: data.date,
        reason: data.reason,
      });
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Justificació enviada" : "Justificación enviada",
        description: language === "ca" 
          ? "La justificació d'absència ha estat enviada per a revisió" 
          : "La justificación de ausencia ha sido enviada para revisión",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/weekly", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/absence-justifications"] });
      setShowJustificationModal(false);
      setJustificationReason("");
      setSelectedDate(null);
    },
    onError: (error: any) => {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: error.message || (language === "ca" 
          ? "Error enviant la justificació" 
          : "Error enviando la justificación"),
        variant: "destructive",
      });
    },
  });

  const getDayAttendance = (date: Date): DayAttendance => {
    const dateStr = date.toISOString().split('T')[0];
    const attendance = (weeklyAttendance as any[]).find((att: any) => 
      att.date?.split('T')[0] === dateStr
    );

    if (!attendance) {
      return { date: dateStr, status: 'absent' };
    }

    if (attendance.justification) {
      return {
        date: dateStr,
        status: 'justified',
        checkIn: attendance.checkInTime,
        checkOut: attendance.checkOutTime,
        totalHours: attendance.totalHours,
        justification: attendance.justification
      };
    }

    if (attendance.checkInTime && attendance.checkOutTime) {
      return {
        date: dateStr,
        status: 'complete',
        checkIn: attendance.checkInTime,
        checkOut: attendance.checkOutTime,
        totalHours: attendance.totalHours
      };
    }

    if (attendance.checkInTime && !attendance.checkOutTime) {
      return {
        date: dateStr,
        status: 'partial',
        checkIn: attendance.checkInTime,
        totalHours: attendance.totalHours
      };
    }

    return { date: dateStr, status: 'absent' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'partial':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'justified':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'absent':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4" />;
      case 'partial':
        return <Clock className="h-4 w-4" />;
      case 'justified':
        return <MessageCircle className="h-4 w-4" />;
      case 'absent':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete':
        return language === "ca" ? "Complet" : "Completo";
      case 'partial':
        return language === "ca" ? "Parcial" : "Parcial";
      case 'justified':
        return language === "ca" ? "Justificat" : "Justificado";
      case 'absent':
        return language === "ca" ? "Absent" : "Ausente";
      default:
        return language === "ca" ? "Desconegut" : "Desconocido";
    }
  };

  const getDayName = (date: Date) => {
    const days = language === "ca" 
      ? ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres']
      : ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    return days[date.getDay() - 1];
  };

  const handleDayClick = (date: Date, attendance: DayAttendance) => {
    if (attendance.status === 'absent') {
      setSelectedDate(attendance.date);
      setShowJustificationModal(true);
    }
  };

  const handleSubmitJustification = () => {
    if (selectedDate && justificationReason.trim()) {
      justificationMutation.mutate({
        date: selectedDate,
        reason: justificationReason.trim()
      });
    }
  };

  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(prevWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(nextWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  if (isLoading) {
    return (
      <Card data-testid="weekly-calendar-loading">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            {language === "ca" ? "Calendari Setmanal" : "Calendario Semanal"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="weekly-calendar">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            {language === "ca" ? "Calendari Setmanal" : "Calendario Semanal"}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              data-testid="previous-week-button"
            >
              ←
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentWeek}
              data-testid="current-week-button"
            >
              {language === "ca" ? "Avui" : "Hoy"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              data-testid="next-week-button"
            >
              →
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {weekStart.toLocaleDateString(language === "ca" ? "ca-ES" : "es-ES", {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })} - {weekDays[4].toLocaleDateString(language === "ca" ? "ca-ES" : "es-ES", {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-4">
          {weekDays.map((date, index) => {
            const attendance = getDayAttendance(date);
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${getStatusColor(attendance.status)} ${
                  attendance.status === 'absent' ? 'hover:border-red-400' : ''
                }`}
                onClick={() => handleDayClick(date, attendance)}
                data-testid={`calendar-day-${date.toISOString().split('T')[0]}`}
              >
                <div className="text-center">
                  <div className="font-medium text-sm mb-1">
                    {getDayName(date)}
                  </div>
                  <div className="text-lg font-bold mb-2">
                    {date.getDate()}
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    {getStatusIcon(attendance.status)}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {getStatusText(attendance.status)}
                  </Badge>
                  {attendance.checkIn && (
                    <div className="mt-2 text-xs">
                      <div>
                        <strong>{language === "ca" ? "Entrada:" : "Entrada:"}</strong> {attendance.checkIn}
                      </div>
                      {attendance.checkOut && (
                        <div>
                          <strong>{language === "ca" ? "Sortida:" : "Salida:"}</strong> {attendance.checkOut}
                        </div>
                      )}
                      {attendance.totalHours && (
                        <div className="mt-1">
                          <strong>{language === "ca" ? "Total:" : "Total:"}</strong> {attendance.totalHours}h
                        </div>
                      )}
                    </div>
                  )}
                  {attendance.justification && (
                    <div className="mt-2">
                      <Badge 
                        variant={attendance.justification.status === 'approved' ? 'default' : 
                               attendance.justification.status === 'rejected' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {attendance.justification.status === 'approved' 
                          ? (language === "ca" ? "Aprovat" : "Aprobado")
                          : attendance.justification.status === 'rejected'
                          ? (language === "ca" ? "Rebutjat" : "Rechazado")
                          : (language === "ca" ? "Pendent" : "Pendiente")}
                      </Badge>
                    </div>
                  )}
                  {attendance.status === 'absent' && (
                    <div className="mt-2 text-xs text-red-600">
                      {language === "ca" ? "Clic per justificar" : "Click para justificar"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">
            {language === "ca" ? "Llegenda" : "Leyenda"}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">{language === "ca" ? "Complet" : "Completo"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">{language === "ca" ? "Parcial" : "Parcial"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm">{language === "ca" ? "Justificat" : "Justificado"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm">{language === "ca" ? "Absent" : "Ausente"}</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Absence Justification Modal */}
      <Dialog open={showJustificationModal} onOpenChange={setShowJustificationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "ca" ? "Justificar Absència" : "Justificar Ausencia"}
            </DialogTitle>
            <DialogDescription>
              {language === "ca" 
                ? `Proporciona una justificació per l'absència del ${selectedDate ? new Date(selectedDate).toLocaleDateString("ca-ES") : ""}`
                : `Proporciona una justificación para la ausencia del ${selectedDate ? new Date(selectedDate).toLocaleDateString("es-ES") : ""}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="justification-reason">
                {language === "ca" ? "Motiu de l'absència" : "Motivo de la ausencia"}
              </Label>
              <Textarea
                id="justification-reason"
                value={justificationReason}
                onChange={(e) => setJustificationReason(e.target.value)}
                placeholder={language === "ca" 
                  ? "Descriu el motiu de l'absència..." 
                  : "Describe el motivo de la ausencia..."}
                rows={4}
                data-testid="justification-reason-input"
              />
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowJustificationModal(false);
                setJustificationReason("");
                setSelectedDate(null);
              }}
              data-testid="cancel-justification"
            >
              {language === "ca" ? "Cancel·lar" : "Cancelar"}
            </Button>
            <Button
              onClick={handleSubmitJustification}
              disabled={!justificationReason.trim() || justificationMutation.isPending}
              data-testid="submit-justification"
            >
              {justificationMutation.isPending
                ? (language === "ca" ? "Enviant..." : "Enviando...")
                : (language === "ca" ? "Enviar Justificació" : "Enviar Justificación")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}