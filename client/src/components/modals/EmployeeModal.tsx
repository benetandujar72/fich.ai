import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertEmployeeSchema, type Employee } from "@shared/schema";
import { z } from "zod";
import { X } from "lucide-react";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  institutionId: string;
}

interface EmployeeFormData {
  fullName: string;
  dni: string;
  email: string;
  phone: string;
  departmentId: string;
  contractType: "full_time" | "part_time" | "substitute";
  status: "active" | "inactive" | "temporary_leave";
  startDate: string;
  endDate: string;
  schedules: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
  };
}

export default function EmployeeModal({ isOpen, onClose, employee, institutionId }: EmployeeModalProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<EmployeeFormData>({
    fullName: "",
    dni: "",
    email: "",
    phone: "",
    departmentId: "",
    contractType: "full_time",
    status: "active",
    startDate: "",
    endDate: "",
    schedules: {
      monday: "08:00-16:00",
      tuesday: "08:00-16:00",
      wednesday: "08:00-16:00",
      thursday: "08:00-16:00",
      friday: "08:00-16:00",
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employee) {
      setFormData({
        fullName: employee.fullName || "",
        dni: employee.dni || "",
        email: employee.email || "",
        phone: employee.phone || "",
        departmentId: employee.departmentId || "",
        contractType: employee.contractType || "full_time",
        status: employee.status || "active",
        startDate: employee.startDate || "",
        endDate: employee.endDate || "",
        schedules: {
          monday: "08:00-16:00",
          tuesday: "08:00-16:00", 
          wednesday: "08:00-16:00",
          thursday: "08:00-16:00",
          friday: "08:00-16:00",
        },
      });
    } else {
      // Reset form for new employee
      setFormData({
        fullName: "",
        dni: "",
        email: "",
        phone: "",
        departmentId: "",
        contractType: "full_time",
        status: "active",
        startDate: "",
        endDate: "",
        schedules: {
          monday: "08:00-16:00",
          tuesday: "08:00-16:00",
          wednesday: "08:00-16:00",
          thursday: "08:00-16:00",
          friday: "08:00-16:00",
        },
      });
    }
    setErrors({});
  }, [employee, isOpen]);

  const employeeMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = employee ? `/api/employees/${employee.id}` : "/api/employees";
      const method = employee ? "PUT" : "POST";
      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: t("success", language),
        description: employee 
          ? (language === "ca" ? "Empleat actualitzat correctament" : "Empleado actualizado correctamente")
          : (language === "ca" ? "Empleat creat correctament" : "Empleado creado correctamente"),
      });
      onClose();
    },
    onError: (error: any) => {
      if (error.message.includes("Invalid employee data")) {
        const errorData = JSON.parse(error.message.split("Invalid employee data")[1] || "{}");
        if (errorData.errors) {
          const fieldErrors: Record<string, string> = {};
          errorData.errors.forEach((err: any) => {
            fieldErrors[err.path[0]] = err.message;
          });
          setErrors(fieldErrors);
        }
      } else {
        toast({
          title: t("error", language),
          description: employee
            ? (language === "ca" ? "Error actualitzant l'empleat" : "Error actualizando el empleado")
            : (language === "ca" ? "Error creant l'empleat" : "Error creando el empleado"),
          variant: "destructive",
        });
      }
    },
  });

  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleScheduleChange = (day: keyof EmployeeFormData["schedules"], value: string) => {
    setFormData(prev => ({
      ...prev,
      schedules: { ...prev.schedules, [day]: value }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      const employeeData = {
        userId: employee?.userId || "temp-user-id", // This would be properly handled in real app
        institutionId,
        fullName: formData.fullName,
        dni: formData.dni,
        email: formData.email,
        phone: formData.phone,
        departmentId: formData.departmentId || null,
        contractType: formData.contractType,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
      };

      // Basic validation
      if (!formData.fullName.trim()) {
        setErrors({ fullName: language === "ca" ? "El nom és obligatori" : "El nombre es obligatorio" });
        return;
      }
      if (!formData.dni.trim()) {
        setErrors({ dni: language === "ca" ? "El DNI és obligatori" : "El DNI es obligatorio" });
        return;
      }
      if (!formData.email.trim()) {
        setErrors({ email: language === "ca" ? "L'email és obligatori" : "El email es obligatorio" });
        return;
      }

      employeeMutation.mutate(employeeData);
    } catch (error) {
      console.error("Validation error:", error);
    }
  };

  const departmentOptions = [
    { value: "primary", label: t("primary_education", language) },
    { value: "secondary", label: t("secondary_education", language) },
    { value: "administration", label: t("administration", language) },
  ];

  const contractTypeOptions = [
    { value: "full_time", label: t("full_time", language) },
    { value: "part_time", label: t("part_time", language) },
    { value: "substitute", label: t("substitute", language) },
  ];

  const statusOptions = [
    { value: "active", label: t("active", language) },
    { value: "inactive", label: t("inactive", language) },
    { value: "temporary_leave", label: t("temporary_leave", language) },
  ];

  const dayLabels = [
    { key: "monday", label: t("monday", language) },
    { key: "tuesday", label: t("tuesday", language) },
    { key: "wednesday", label: t("wednesday", language) },
    { key: "thursday", label: t("thursday", language) },
    { key: "friday", label: t("friday", language) },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700" data-testid="employee-modal">
        <DialogHeader>
          <DialogTitle>
            {employee 
              ? (language === "ca" ? "Editar empleat" : "Editar empleado")
              : (language === "ca" ? "Afegir nou empleat" : "Añadir nuevo empleado")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="full-name">
                {t("full_name", language)} *
              </Label>
              <Input
                id="full-name"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className={errors.fullName ? "border-error" : ""}
                data-testid="employee-fullname-input"
              />
              {errors.fullName && (
                <p className="text-sm text-error mt-1">{errors.fullName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dni">DNI/NIE *</Label>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) => handleInputChange("dni", e.target.value)}
                className={errors.dni ? "border-error" : ""}
                data-testid="employee-dni-input"
              />
              {errors.dni && (
                <p className="text-sm text-error mt-1">{errors.dni}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">
                {t("email", language)} *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-error" : ""}
                data-testid="employee-email-input"
              />
              {errors.email && (
                <p className="text-sm text-error mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">
                {t("phone", language)}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                data-testid="employee-phone-input"
              />
            </div>

            <div>
              <Label htmlFor="department">
                {t("department", language)}
              </Label>
              <Select value={formData.departmentId} onValueChange={(value) => handleInputChange("departmentId", value)}>
                <SelectTrigger id="department" data-testid="employee-department-select">
                  <SelectValue placeholder={language === "ca" ? "Selecciona departament" : "Selecciona departamento"} />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="contract-type">
                {t("contract_type", language)}
              </Label>
              <Select value={formData.contractType} onValueChange={(value: any) => handleInputChange("contractType", value)}>
                <SelectTrigger id="contract-type" data-testid="employee-contract-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contractTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">
                {t("start_date", language)}
              </Label>
              <Input
                id="start-date"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                data-testid="employee-startdate-input"
              />
            </div>

            <div>
              <Label htmlFor="end-date">
                {t("end_date", language)}
              </Label>
              <Input
                id="end-date"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                data-testid="employee-enddate-input"
              />
            </div>
          </div>

          {/* Weekly Schedule */}
          <div>
            <Label className="text-base font-medium">
              {language === "ca" ? "Horari setmanal" : "Horario semanal"}
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3">
              {dayLabels.map((day) => (
                <div key={day.key}>
                  <Label className="text-xs text-gray-600">
                    {day.label}
                  </Label>
                  <Input
                    placeholder="08:00-16:00"
                    value={formData.schedules[day.key as keyof typeof formData.schedules]}
                    onChange={(e) => handleScheduleChange(day.key as keyof typeof formData.schedules, e.target.value)}
                    className="text-sm"
                    data-testid={`employee-schedule-${day.key}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              data-testid="employee-cancel-button"
            >
              {t("cancel", language)}
            </Button>
            <Button 
              type="submit" 
              disabled={employeeMutation.isPending}
              data-testid="employee-save-button"
            >
              {employeeMutation.isPending 
                ? t("loading", language)
                : employee 
                  ? (language === "ca" ? "Actualitzar" : "Actualizar")
                  : t("create", language)
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
