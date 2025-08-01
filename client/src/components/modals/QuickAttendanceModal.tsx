import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { 
  Dialog, 
  DialogContent 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, LogIn, LogOut } from "lucide-react";

interface QuickAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  currentTime: string;
}

export default function QuickAttendanceModal({ 
  isOpen, 
  onClose, 
  onCheckIn, 
  onCheckOut, 
  currentTime 
}: QuickAttendanceModalProps) {
  const { language } = useLanguage();

  const handleCheckIn = () => {
    onCheckIn();
    onClose();
  };

  const handleCheckOut = () => {
    onCheckOut();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="quick-attendance-modal">
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
              className="w-full bg-secondary text-white py-3 px-6 text-lg font-medium hover:bg-green-700"
              data-testid="modal-checkin-button"
            >
              <LogIn className="mr-2 h-5 w-5" />
              {language === "ca" ? "Entrada" : "Entrada"}
            </Button>
            <Button 
              onClick={handleCheckOut}
              className="w-full bg-error text-white py-3 px-6 text-lg font-medium hover:bg-red-700"
              data-testid="modal-checkout-button"
            >
              <LogOut className="mr-2 h-5 w-5" />
              {language === "ca" ? "Sortida" : "Salida"}
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
