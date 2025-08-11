import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { 
  Dialog, 
  DialogContent,
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut, Loader2, Timer, CheckCircle, XCircle } from "lucide-react";
import { type ExpectedTimes, type AttendanceStatus } from "@/lib/scheduleUtils";

interface QuickAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  currentTime: string;
  shouldDisableCheckIn?: boolean;
  shouldDisableCheckOut?: boolean;
  isLoading?: boolean;
  expectedTimes?: ExpectedTimes;
  attendanceStatus?: AttendanceStatus;
}

export default function QuickAttendanceModal({ 
  isOpen, 
  onClose, 
  onCheckIn, 
  onCheckOut, 
  currentTime,
  shouldDisableCheckIn = false,
  shouldDisableCheckOut = false,
  isLoading = false,
  expectedTimes,
  attendanceStatus
}: QuickAttendanceModalProps) {
  const { language } = useLanguage();

  const handleCheckIn = () => {
    onCheckIn();
  };

  const handleCheckOut = () => {
    onCheckOut();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md modal-content-solid" data-testid="quick-attendance-modal">
        <DialogTitle className="sr-only">
          Control d'assistència ràpid
        </DialogTitle>
        <DialogDescription className="sr-only">
          Marca la teva entrada o sortida de manera ràpida
        </DialogDescription>
        <div className="text-center p-6">
          <Clock className="h-16 w-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text mb-2">
            {t("quick_checkin", language)}
          </h3>
          <p className="text-3xl font-mono text-primary mb-4" data-testid="modal-current-time">
            {currentTime}
          </p>
          
          {/* Expected Times Display */}
          {expectedTimes?.hasScheduleToday && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Timer className="h-4 w-4" />
                {language === "ca" ? "Horaris previstos" : "Horarios previstos"}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className={`text-lg font-bold ${attendanceStatus?.entryColor === 'green' ? 'text-green-600' : attendanceStatus?.entryColor === 'red' ? 'text-red-600' : 'text-gray-600'}`}>
                    {expectedTimes.expectedEntry || "--:--"}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    {attendanceStatus?.entryColor === 'green' && <CheckCircle className="h-3 w-3 text-green-600" />}
                    {attendanceStatus?.entryColor === 'red' && <XCircle className="h-3 w-3 text-red-600" />}
                    {language === "ca" ? "Entrada" : "Entrada"}
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${attendanceStatus?.exitColor === 'green' ? 'text-green-600' : attendanceStatus?.exitColor === 'red' ? 'text-red-600' : 'text-gray-600'}`}>
                    {expectedTimes.expectedExit || "--:--"}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    {attendanceStatus?.exitColor === 'green' && <CheckCircle className="h-3 w-3 text-green-600" />}
                    {attendanceStatus?.exitColor === 'red' && <XCircle className="h-3 w-3 text-red-600" />}
                    {language === "ca" ? "Sortida" : "Salida"}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={handleCheckIn}
              disabled={shouldDisableCheckIn || isLoading}
              className={`w-full py-3 px-6 text-lg font-medium ${
                shouldDisableCheckIn || isLoading
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed" 
                  : attendanceStatus?.entryColor === 'green' 
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-orange-600 hover:bg-orange-700 text-white"
              }`}
              data-testid="modal-checkin-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {language === "ca" ? "Registrant..." : "Registrando..."}
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  {language === "ca" ? "Entrada" : "Entrada"}
                  {shouldDisableCheckIn && (
                    <span className="ml-2 text-xs">
                      ({language === "ca" ? "Ja fitxat" : "Ya fichado"})
                    </span>
                  )}
                </>
              )}
            </Button>
            <Button 
              onClick={handleCheckOut}
              disabled={shouldDisableCheckOut || isLoading}
              className={`w-full py-3 px-6 text-lg font-medium ${
                shouldDisableCheckOut || isLoading
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed" 
                  : attendanceStatus?.exitColor === 'green' 
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
              }`}
              data-testid="modal-checkout-button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {language === "ca" ? "Registrant..." : "Registrando..."}
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-5 w-5" />
                  {language === "ca" ? "Sortida" : "Salida"}
                  {shouldDisableCheckOut && (
                    <span className="ml-2 text-xs">
                      ({language === "ca" ? "Primer fitxa entrada" : "Primero ficha entrada"})
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
          
          <Button 
            variant="ghost"
            onClick={onClose} 
            className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
            data-testid="modal-close-button"
          >
            {t("close", language)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
