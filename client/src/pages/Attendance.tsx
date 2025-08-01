import { useState, useEffect } from "react";
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
  Clock
} from "lucide-react";
import QuickAttendanceModal from "@/components/modals/QuickAttendanceModal";
import type { AttendanceRecord } from "@shared/schema";

export default function Attendance() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isQuickAttendanceOpen, setIsQuickAttendanceOpen] = useState(false);

  // Mock employee ID - in real app, this would come from user context
  const employeeId = user?.id || "mock-employee-id";

  const { data: attendanceRecords = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance", employeeId],
    enabled: !!employeeId,
  });

  const attendanceMutation = useMutation({
    mutationFn: async (data: { type: "check_in" | "check_out"; employeeId: string; timestamp: Date }) => {
      return await apiRequest("POST", "/api/attendance", {
        ...data,
        method: "web",
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: t("success", language),
        description: variables.type === "check_in" 
          ? (language === "ca" ? "Entrada registrada correctament" : "Entrada registrada correctamente")
          : (language === "ca" ? "Sortida registrada correctament" : "Salida registrada correctamente"),
      });
    },
    onError: () => {
      toast({
        title: t("error", language),
        description: language === "ca" ? "Error registrant el fitxatge" : "Error registrando el fichaje",
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

  const timeString = currentTime.toLocaleTimeString("ca-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const handleCheckIn = () => {
    attendanceMutation.mutate({
      type: "check_in",
      employeeId,
      timestamp: new Date(),
    });
  };

  const handleCheckOut = () => {
    attendanceMutation.mutate({
      type: "check_out",
      employeeId,
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

  const mockSchedule = [
    {
      time: "08:00 - 09:00",
      subject: language === "ca" ? "Matemàtiques - 3r A" : "Matemáticas - 3º A",
      status: "completed",
      testId: "schedule-math"
    },
    {
      time: "09:00 - 10:00",
      subject: language === "ca" ? "Ciències - 3r B" : "Ciencias - 3º B",
      status: "current",
      testId: "schedule-science"
    },
    {
      time: "10:30 - 11:30",
      subject: language === "ca" ? "Tutoria - 3r A" : "Tutoría - 3º A",
      status: "pending",
      testId: "schedule-tutoring"
    },
  ];

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
                disabled={attendanceMutation.isPending}
                className="w-full bg-secondary text-white py-4 px-6 text-lg font-medium hover:bg-green-700"
                data-testid="checkin-button"
              >
                <LogIn className="mr-3 h-5 w-5" />
                {t("checkin_entry", language)}
              </Button>
              <Button 
                onClick={handleCheckOut}
                disabled={attendanceMutation.isPending}
                className="w-full bg-error text-white py-4 px-6 text-lg font-medium hover:bg-red-700"
                data-testid="checkout-button"
              >
                <LogOut className="mr-3 h-5 w-5" />
                {t("checkin_exit", language)}
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
              {mockSchedule.map((item, index) => (
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
              ))}
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
      />
    </main>
  );
}
