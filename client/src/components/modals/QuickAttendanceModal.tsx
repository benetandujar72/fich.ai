import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { 
  Dialog, 
  DialogContent,
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut, Loader2 } from "lucide-react";

interface QuickAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  currentTime: string;
  shouldDisableCheckIn?: boolean;
  shouldDisableCheckOut?: boolean;
  isLoading?: boolean;
}

export default function QuickAttendanceModal({ 
  isOpen, 
  onClose, 
  onCheckIn, 
  onCheckOut, 
  currentTime,
  shouldDisableCheckIn = false,
  shouldDisableCheckOut = false,
  isLoading = false
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
      <DialogContent className="max-w-md" data-testid="quick-attendance-modal">
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
          <p className="text-3xl font-mono text-primary mb-6" data-testid="modal-current-time">
            {currentTime}
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleCheckIn}
              disabled={shouldDisableCheckIn || isLoading}
              className={`w-full py-3 px-6 text-lg font-medium ${
                shouldDisableCheckIn || isLoading
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700 text-white"
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
