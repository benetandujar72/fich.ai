import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { t } from "@/lib/i18n";
import { Bell, Clock, Search, Sun, Moon, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  onQuickAttendance?: () => void;
}

export default function Header({ title, onQuickAttendance }: HeaderProps) {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();

  return (
    <header className={cn(
      "sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "border-b border-border shadow-sm"
    )}>
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        
        {/* Left section with title */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-xl font-bold text-foreground truncate" data-testid="page-title">
              {title}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              {user?.firstName && `Benvingut/da, ${user.firstName}`}
            </p>
          </div>
        </div>

        {/* Center section with search (hidden on mobile) */}
        <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={language === "ca" ? "Cercar..." : "Buscar..."}
              className="pl-9 bg-muted/50 border-0 focus:bg-background transition-colors"
            />
          </div>
        </div>

        {/* Right section with actions */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {onQuickAttendance && (
            <Button 
              onClick={onQuickAttendance}
              size="sm"
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-primary/25 hidden sm:flex"
              data-testid="quick-attendance-button"
            >
              <Clock className="mr-2 h-4 w-4" />
              {t("quick_checkin", language)}
            </Button>
          )}

          {/* Quick attendance mobile button */}
          {onQuickAttendance && (
            <Button 
              onClick={onQuickAttendance}
              size="sm"
              variant="outline"
              className="sm:hidden"
              data-testid="quick-attendance-mobile-button"
            >
              <Clock className="h-4 w-4" />
            </Button>
          )}

          {/* Language selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-accent">
                <Globe className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline text-xs font-medium">
                  {language.toUpperCase()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              <DropdownMenuItem 
                onClick={() => setLanguage("ca")}
                className={cn("cursor-pointer", language === "ca" && "bg-accent")}
              >
                🇪🇸 Català
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLanguage("es")}
                className={cn("cursor-pointer", language === "es" && "bg-accent")}
              >
                🇪🇸 Español
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative hover:bg-accent"
                data-testid="notifications-button"
              >
                <Bell className="h-4 w-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] font-semibold"
                  data-testid="notification-count"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-3 border-b">
                <h3 className="font-semibold text-sm">
                  {language === "ca" ? "Notificacions" : "Notificaciones"}
                </h3>
              </div>
              <div className="p-2">
                <DropdownMenuItem className="flex items-start space-x-3 p-3 rounded-lg cursor-pointer">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Nova alerta de tardança</p>
                    <p className="text-xs text-muted-foreground">Professor X ha arribat 15 minuts tard</p>
                    <p className="text-xs text-muted-foreground mt-1">Fa 5 minuts</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center justify-center p-3 text-xs text-primary cursor-pointer">
                  {language === "ca" ? "Veure totes" : "Ver todas"}
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile search button */}
          <Button variant="ghost" size="sm" className="md:hidden hover:bg-accent">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
