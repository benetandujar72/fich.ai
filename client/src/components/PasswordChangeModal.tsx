import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react";

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  language: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
}

export default function PasswordChangeModal({ 
  isOpen, 
  onClose, 
  userId, 
  userEmail, 
  language 
}: PasswordChangeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordChangesMutation = useMutation({
    mutationFn: async (data: { userId: string; newPassword: string }) => {
      return await apiRequest("PUT", `/api/users/${data.userId}/password`, {
        newPassword: data.newPassword
      });
    },
    onSuccess: () => {
      toast({
        title: language === "ca" ? "Èxit" : "Éxito",
        description: language === "ca" 
          ? "Contrasenya canviada correctament" 
          : "Contraseña cambiada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: language === "ca" ? "Error" : "Error",
        description: error.message || (language === "ca" 
          ? "Error canviant la contrasenya" 
          : "Error cambiando la contraseña"),
        variant: "destructive",
      });
    },
  });

  const evaluatePasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push(language === "ca" 
        ? "Mínim 8 caràcters" 
        : "Mínimo 8 caracteres");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push(language === "ca" 
        ? "Una lletra majúscula" 
        : "Una letra mayúscula");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push(language === "ca" 
        ? "Una lletra minúscula" 
        : "Una letra minúscula");
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push(language === "ca" 
        ? "Un número" 
        : "Un número");
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push(language === "ca" 
        ? "Un caràcter especial" 
        : "Un carácter especial");
    }

    return { score, feedback };
  };

  const passwordStrength = evaluatePasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isValidPassword = passwordStrength.score >= 4 && passwordsMatch;

  const getStrengthColor = (score: number) => {
    if (score <= 2) return "text-red-500";
    if (score <= 3) return "text-yellow-500";
    return "text-green-500";
  };

  const getStrengthLabel = (score: number) => {
    if (score <= 2) return language === "ca" ? "Feble" : "Débil";
    if (score <= 3) return language === "ca" ? "Mitjana" : "Media";
    return language === "ca" ? "Forta" : "Fuerte";
  };

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidPassword) {
      passwordChangesMutation.mutate({ userId, newPassword });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>
              {language === "ca" ? "Canviar Contrasenya" : "Cambiar Contraseña"}
            </span>
          </DialogTitle>
          <DialogDescription>
            {language === "ca" 
              ? `Canviant contrasenya per: ${userEmail}` 
              : `Cambiando contraseña para: ${userEmail}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">
              {language === "ca" ? "Nova Contrasenya" : "Nueva Contraseña"}
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
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
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="toggle-password-visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {language === "ca" ? "Fortalesa:" : "Fortaleza:"}
                  </span>
                  <span className={`text-sm font-medium ${getStrengthColor(passwordStrength.score)}`}>
                    {getStrengthLabel(passwordStrength.score)}
                  </span>
                </div>
                
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 rounded ${
                        level <= passwordStrength.score
                          ? passwordStrength.score <= 2
                            ? "bg-red-500"
                            : passwordStrength.score <= 3
                            ? "bg-yellow-500"
                            : "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>

                {passwordStrength.feedback.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">
                      {language === "ca" ? "Requeriments:" : "Requerimientos:"}
                    </p>
                    <ul className="space-y-1">
                      {passwordStrength.feedback.map((item, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              {language === "ca" ? "Confirmar Contrasenya" : "Confirmar Contraseña"}
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
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                data-testid="toggle-confirm-password-visibility"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {confirmPassword && (
              <div className="flex items-center space-x-2">
                {passwordsMatch ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      {language === "ca" ? "Les contrasenyes coincideixen" : "Las contraseñas coinciden"}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">
                      {language === "ca" ? "Les contrasenyes no coincideixen" : "Las contraseñas no coinciden"}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              data-testid="cancel-password-change"
            >
              {language === "ca" ? "Cancel·lar" : "Cancelar"}
            </Button>
            <Button
              type="submit"
              disabled={!isValidPassword || passwordChangesMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="save-password-change"
            >
              {passwordChangesMutation.isPending
                ? (language === "ca" ? "Canviant..." : "Cambiando...")
                : (language === "ca" ? "Canviar Contrasenya" : "Cambiar Contraseña")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}