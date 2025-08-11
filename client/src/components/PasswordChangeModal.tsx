import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";
import { Lock, Eye, EyeOff } from "lucide-react";

interface PasswordChangeModalProps {
  children: React.ReactNode;
}

export function PasswordChangeModal({ children }: PasswordChangeModalProps) {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { language } = useLanguage();
  const { toast } = useToast();

  const passwordValidation = {
    minLength: newPassword.length >= 8,
    hasNumber: /\d/.test(newPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    hasLetter: /[a-zA-Z]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== "";

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Contrasenya canviada" : "Contraseña cambiada",
        description: language === "ca" 
          ? "La contrasenya s'ha actualitzat correctament" 
          : "La contraseña se ha actualizado correctamente",
        variant: "default",
      });
      setOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: error.message || (language === "ca" 
          ? "No s'ha pogut canviar la contrasenya" 
          : "No se pudo cambiar la contraseña"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid || !passwordsMatch) return;
    changePasswordMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md modal-content-solid" data-testid="password-change-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {language === "ca" ? "Canviar contrasenya" : "Cambiar contraseña"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">
              {language === "ca" ? "Contrasenya actual" : "Contraseña actual"}
            </Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                data-testid="input-current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                data-testid="button-toggle-current-password"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">
              {language === "ca" ? "Nova contrasenya" : "Nueva contraseña"}
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                data-testid="input-new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowNewPassword(!showNewPassword)}
                data-testid="button-toggle-new-password"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {newPassword && (
              <div className="text-sm space-y-1">
                <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="text-xs">•</span>
                  {language === "ca" ? "Mínim 8 caràcters" : "Mínimo 8 caracteres"}
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasLetter ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="text-xs">•</span>
                  {language === "ca" ? "Almenys una lletra" : "Al menos una letra"}
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="text-xs">•</span>
                  {language === "ca" ? "Almenys un número" : "Al menos un número"}
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasSpecial ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="text-xs">•</span>
                  {language === "ca" ? "Almenys un caràcter especial" : "Al menos un carácter especial"}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              {language === "ca" ? "Confirmar nova contrasenya" : "Confirmar nueva contraseña"}
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                data-testid="input-confirm-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                data-testid="button-toggle-confirm-password"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {confirmPassword && !passwordsMatch && (
              <p className="text-sm text-red-600">
                {language === "ca" ? "Les contrasenyes no coincideixen" : "Las contraseñas no coinciden"}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              data-testid="button-cancel"
            >
              {language === "ca" ? "Cancel·lar" : "Cancelar"}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!isPasswordValid || !passwordsMatch || !currentPassword || changePasswordMutation.isPending}
              data-testid="button-change-password"
            >
              {changePasswordMutation.isPending 
                ? (language === "ca" ? "Canviant..." : "Cambiando...")
                : (language === "ca" ? "Canviar contrasenya" : "Cambiar contraseña")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}