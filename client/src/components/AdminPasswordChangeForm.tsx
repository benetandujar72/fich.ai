import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Shield } from "lucide-react";

interface AdminPasswordChangeFormProps {
  userId: string;
  userEmail: string;
  onSuccess: () => void;
  language: string;
}

export default function AdminPasswordChangeForm({ 
  userId, 
  userEmail, 
  onSuccess, 
  language 
}: AdminPasswordChangeFormProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
      return await apiRequest('PUT', `/api/users/admins/${userId}/password`, {
        newPassword
      });
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Contrasenya canviada" : "Contraseña cambiada",
        description: language === "ca" 
          ? "La contrasenya s'ha actualitzat correctament" 
          : "La contraseña se ha actualizado correctamente",
        variant: "default",
      });
      setNewPassword("");
      setConfirmPassword("");
      onSuccess();
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder={language === "ca" ? "Introdueix nova contrasenya" : "Introduce nueva contraseña"}
            className="pr-10"
            data-testid="new-password-input"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowNewPassword(!showNewPassword)}
            data-testid="toggle-new-password"
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">
          {language === "ca" ? "Confirma la contrasenya" : "Confirmar contraseña"}
        </Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={language === "ca" ? "Confirma la nova contrasenya" : "Confirma la nueva contraseña"}
            className="pr-10"
            data-testid="confirm-password-input"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            data-testid="toggle-confirm-password"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>
      </div>

      {/* Password requirements */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">
          {language === "ca" ? "Requisits de la contrasenya:" : "Requisitos de la contraseña:"}
        </p>
        <div className="space-y-1 text-sm">
          <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${passwordValidation.minLength ? 'bg-green-500' : 'bg-gray-300'}`} />
            {language === "ca" ? "Mínim 8 caràcters" : "Mínimo 8 caracteres"}
          </div>
          <div className={`flex items-center gap-2 ${passwordValidation.hasLetter ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${passwordValidation.hasLetter ? 'bg-green-500' : 'bg-gray-300'}`} />
            {language === "ca" ? "Al menys una lletra" : "Al menos una letra"}
          </div>
          <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${passwordValidation.hasNumber ? 'bg-green-500' : 'bg-gray-300'}`} />
            {language === "ca" ? "Al menys un número" : "Al menos un número"}
          </div>
          <div className={`flex items-center gap-2 ${passwordValidation.hasSpecial ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${passwordValidation.hasSpecial ? 'bg-green-500' : 'bg-gray-300'}`} />
            {language === "ca" ? "Al menys un caràcter especial" : "Al menos un carácter especial"}
          </div>
          {confirmPassword && (
            <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-green-600' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${passwordsMatch ? 'bg-green-500' : 'bg-red-400'}`} />
              {passwordsMatch 
                ? (language === "ca" ? "Les contrasenyes coincideixen" : "Las contraseñas coinciden")
                : (language === "ca" ? "Les contrasenyes no coincideixen" : "Las contraseñas no coinciden")
              }
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          disabled={!isPasswordValid || !passwordsMatch || changePasswordMutation.isPending}
          data-testid="save-password-button"
          className="flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          {changePasswordMutation.isPending 
            ? (language === "ca" ? "Canviant..." : "Cambiando...")
            : (language === "ca" ? "Canviar contrasenya" : "Cambiar contraseña")
          }
        </Button>
      </div>
    </form>
  );
}