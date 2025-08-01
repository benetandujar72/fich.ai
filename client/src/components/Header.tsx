import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  onQuickAttendance?: () => void;
}

export default function Header({ title, onQuickAttendance }: HeaderProps) {
  const { language } = useLanguage();

  return (
    <header className="bg-surface shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text" data-testid="page-title">
          {title}
        </h1>
        <div className="flex items-center space-x-4">
          {onQuickAttendance && (
            <Button 
              onClick={onQuickAttendance}
              className="bg-primary text-white hover:bg-blue-700"
              data-testid="quick-attendance-button"
            >
              <Clock className="mr-2 h-4 w-4" />
              {t("quick_checkin", language)}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative"
            data-testid="notifications-button"
          >
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              data-testid="notification-count"
            >
              3
            </Badge>
          </Button>
        </div>
      </div>
    </header>
  );
}
