import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Activity, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onLogout: () => void;
}

export default function MobileHeader({ isMobileMenuOpen, setIsMobileMenuOpen, onLogout }: MobileHeaderProps) {
  const { user } = useAuth();
  
  const userInitials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'U';

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] md:hidden bg-white dark:bg-gray-900 border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-3 py-2.5">
        {/* App Logo and Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-sm font-bold text-white">F</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">fich.ai</h1>
            <p className="text-xs text-muted-foreground">Sistema Inteligent de Fitxatge</p>
          </div>
        </div>

        {/* User Profile and Menu Button */}
        <div className="flex items-center gap-2">
          {/* User Profile */}
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-500">
              <AvatarFallback className="text-white font-semibold text-xs bg-transparent">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start min-w-0">
              <p className="text-xs font-medium text-foreground truncate max-w-16 sm:max-w-20">
                {user?.firstName}
              </p>
              <Badge variant="outline" className="text-[10px] px-1 py-0 leading-3 h-auto">
                {user?.role === 'superadmin' ? 'SA' : 
                 user?.role === 'admin' ? 'Admin' : 'Emp'}
              </Badge>
            </div>
          </div>

          {/* Menu Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2"
            data-testid="mobile-menu-button"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}