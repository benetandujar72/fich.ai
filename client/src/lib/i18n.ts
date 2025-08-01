export const translations = {
  ca: {
    // Navigation
    "dashboard": "Tauler de control",
    "employees": "Personal",
    "attendance": "Fitxatge",
    "alerts": "Alertes",
    "reports": "Informes",
    "settings": "Configuració",
    
    // Dashboard
    "present_staff": "Personal present",
    "delays_today": "Retards avui",
    "absences": "Absències",
    "active_guards": "Guàrdies actives",
    "quick_actions": "Accions ràpides",
    "recent_activity": "Activitat recent",
    "weekly_attendance": "Assistència setmanal",
    
    // Employee management
    "employee_management": "Gestió de personal",
    "add_employee": "Afegir empleat",
    "search": "Buscar",
    "department": "Departament",
    "status": "Estat",
    "filter": "Filtrar",
    "employee_list": "Llista d'empleats",
    "employee": "Empleat",
    "schedule": "Horari",
    "actions": "Accions",
    
    // Attendance
    "quick_checkin": "Fitxatge ràpid",
    "current_time": "Hora actual",
    "checkin_entry": "Fitxar entrada",
    "checkin_exit": "Fitxar sortida",
    "alternative_methods": "Mètodes alternatius",
    "qr_code": "Codi QR",
    "nfc_card": "Targeta NFC",
    "todays_schedule": "Horari d'avui",
    
    // Settings
    "center_configuration": "Configuració del centre",
    "center_name": "Nom del centre",
    "academic_year": "Curs acadèmic",
    "timezone": "Zona horària",
    "default_language": "Idioma per defecte",
    "data_retention": "Política de retenció de dades",
    "user_management": "Gestió d'usuaris",
    
    // Common
    "save": "Guardar",
    "cancel": "Cancel·lar",
    "edit": "Editar",
    "delete": "Eliminar",
    "create": "Crear",
    "close": "Tancar",
    "yes": "Sí",
    "no": "No",
    "loading": "Carregant...",
    "error": "Error",
    "success": "Èxit",
    
    // Forms
    "full_name": "Nom complet",
    "email": "Correu electrònic",
    "phone": "Telèfon",
    "contract_type": "Tipus de contracte",
    "start_date": "Data d'inici",
    "end_date": "Data de fi",
    
    // Status
    "active": "Actiu",
    "inactive": "Inactiu",
    "temporary_leave": "Baixa temporal",
    
    // Contract types
    "full_time": "Jornada completa",
    "part_time": "Jornada parcial",
    "substitute": "Substitució",
    
    // Days of week
    "monday": "Dilluns",
    "tuesday": "Dimarts",
    "wednesday": "Dimecres",
    "thursday": "Dijous",
    "friday": "Divendres",
    
    // Departments
    "primary_education": "Educació Primària",
    "secondary_education": "Educació Secundària",
    "administration": "Administració",
  },
  es: {
    // Navigation
    "dashboard": "Panel de control",
    "employees": "Personal",
    "attendance": "Fichaje",
    "alerts": "Alertas",
    "reports": "Informes",
    "settings": "Configuración",
    
    // Dashboard
    "present_staff": "Personal presente",
    "delays_today": "Retrasos hoy",
    "absences": "Ausencias",
    "active_guards": "Guardias activas",
    "quick_actions": "Acciones rápidas",
    "recent_activity": "Actividad reciente",
    "weekly_attendance": "Asistencia semanal",
    
    // Employee management
    "employee_management": "Gestión de personal",
    "add_employee": "Añadir empleado",
    "search": "Buscar",
    "department": "Departamento",
    "status": "Estado",
    "filter": "Filtrar",
    "employee_list": "Lista de empleados",
    "employee": "Empleado",
    "schedule": "Horario",
    "actions": "Acciones",
    
    // Attendance
    "quick_checkin": "Fichaje rápido",
    "current_time": "Hora actual",
    "checkin_entry": "Fichar entrada",
    "checkin_exit": "Fichar salida",
    "alternative_methods": "Métodos alternativos",
    "qr_code": "Código QR",
    "nfc_card": "Tarjeta NFC",
    "todays_schedule": "Horario de hoy",
    
    // Settings
    "center_configuration": "Configuración del centro",
    "center_name": "Nombre del centro",
    "academic_year": "Curso académico",
    "timezone": "Zona horaria",
    "default_language": "Idioma por defecto",
    "data_retention": "Política de retención de datos",
    "user_management": "Gestión de usuarios",
    
    // Common
    "save": "Guardar",
    "cancel": "Cancelar",
    "edit": "Editar",
    "delete": "Eliminar",
    "create": "Crear",
    "close": "Cerrar",
    "yes": "Sí",
    "no": "No",
    "loading": "Cargando...",
    "error": "Error",
    "success": "Éxito",
    
    // Forms
    "full_name": "Nombre completo",
    "email": "Correo electrónico",
    "phone": "Teléfono",
    "contract_type": "Tipo de contrato",
    "start_date": "Fecha de inicio",
    "end_date": "Fecha de fin",
    
    // Status
    "active": "Activo",
    "inactive": "Inactivo",
    "temporary_leave": "Baja temporal",
    
    // Contract types
    "full_time": "Jornada completa",
    "part_time": "Jornada parcial",
    "substitute": "Sustitución",
    
    // Days of week
    "monday": "Lunes",
    "tuesday": "Martes",
    "wednesday": "Miércoles",
    "thursday": "Jueves",
    "friday": "Viernes",
    
    // Departments
    "primary_education": "Educación Primaria",
    "secondary_education": "Educación Secundaria",
    "administration": "Administración",
  },
};

export const t = (key: string, language: "ca" | "es" = "ca"): string => {
  return translations[language][key as keyof typeof translations.ca] || key;
};
