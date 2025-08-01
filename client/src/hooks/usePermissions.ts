import { useAuth } from './useAuth';

export type UserRole = 'superadmin' | 'admin' | 'employee';

export interface Permissions {
  // Dashboard
  canViewAllInstitutions: boolean;
  canViewInstitutionDashboard: boolean;
  canViewPersonalDashboard: boolean;

  // Employee management
  canCreateEmployee: boolean;
  canEditEmployee: boolean;
  canDeleteEmployee: boolean;
  canViewEmployees: boolean;
  canImportSchedules: boolean;

  // Institution management
  canCreateInstitution: boolean;
  canEditInstitution: boolean;
  canViewInstitutions: boolean;

  // Academic years
  canCreateAcademicYear: boolean;
  canEditAcademicYear: boolean;

  // Attendance
  canViewAllAttendance: boolean;
  canViewOwnAttendance: boolean;
  canEditAttendance: boolean;
  canManualCheckIn: boolean;

  // Reports
  canGenerateInstitutionReports: boolean;
  canGeneratePersonalReports: boolean;
  canExportData: boolean;

  // Alerts
  canManageAlerts: boolean;
  canViewAlerts: boolean;
  canResolveAlerts: boolean;

  // Settings
  canEditSettings: boolean;
  canManageUsers: boolean;
  canViewSecuritySettings: boolean;

  // Schedules
  canEditSchedules: boolean;
  canViewSchedules: boolean;

  // Absences
  canApproveAbsences: boolean;
  canRequestAbsence: boolean;
  canViewAbsences: boolean;
}

export function usePermissions(): Permissions {
  const { user } = useAuth();
  const role = user?.role as UserRole;

  const getPermissions = (userRole: UserRole): Permissions => {
    switch (userRole) {
      case 'superadmin':
        return {
          // Dashboard
          canViewAllInstitutions: true,
          canViewInstitutionDashboard: true,
          canViewPersonalDashboard: true,

          // Employee management
          canCreateEmployee: true,
          canEditEmployee: true,
          canDeleteEmployee: true,
          canViewEmployees: true,
          canImportSchedules: true,

          // Institution management
          canCreateInstitution: true,
          canEditInstitution: true,
          canViewInstitutions: true,

          // Academic years
          canCreateAcademicYear: true,
          canEditAcademicYear: true,

          // Attendance
          canViewAllAttendance: true,
          canViewOwnAttendance: true,
          canEditAttendance: true,
          canManualCheckIn: true,

          // Reports
          canGenerateInstitutionReports: true,
          canGeneratePersonalReports: true,
          canExportData: true,

          // Alerts
          canManageAlerts: true,
          canViewAlerts: true,
          canResolveAlerts: true,

          // Settings
          canEditSettings: true,
          canManageUsers: true,
          canViewSecuritySettings: true,

          // Schedules
          canEditSchedules: true,
          canViewSchedules: true,

          // Absences
          canApproveAbsences: true,
          canRequestAbsence: true,
          canViewAbsences: true,
        };

      case 'admin':
        return {
          // Dashboard
          canViewAllInstitutions: false,
          canViewInstitutionDashboard: true,
          canViewPersonalDashboard: true,

          // Employee management
          canCreateEmployee: true,
          canEditEmployee: true,
          canDeleteEmployee: false, // Solo suspender, no eliminar
          canViewEmployees: true,
          canImportSchedules: true,

          // Institution management
          canCreateInstitution: false,
          canEditInstitution: true, // Solo su institución
          canViewInstitutions: false,

          // Academic years
          canCreateAcademicYear: true,
          canEditAcademicYear: true,

          // Attendance
          canViewAllAttendance: true, // Solo de su institución
          canViewOwnAttendance: true,
          canEditAttendance: true,
          canManualCheckIn: true,

          // Reports
          canGenerateInstitutionReports: true, // Solo de su institución
          canGeneratePersonalReports: true,
          canExportData: true,

          // Alerts
          canManageAlerts: true,
          canViewAlerts: true,
          canResolveAlerts: true,

          // Settings
          canEditSettings: true, // Solo de su institución
          canManageUsers: true, // Solo usuarios de su institución
          canViewSecuritySettings: false,

          // Schedules
          canEditSchedules: true,
          canViewSchedules: true,

          // Absences
          canApproveAbsences: true,
          canRequestAbsence: true,
          canViewAbsences: true,
        };

      case 'employee':
        return {
          // Dashboard
          canViewAllInstitutions: false,
          canViewInstitutionDashboard: false,
          canViewPersonalDashboard: true,

          // Employee management
          canCreateEmployee: false,
          canEditEmployee: false, // Solo datos personales básicos
          canDeleteEmployee: false,
          canViewEmployees: false,
          canImportSchedules: false,

          // Institution management
          canCreateInstitution: false,
          canEditInstitution: false,
          canViewInstitutions: false,

          // Academic years
          canCreateAcademicYear: false,
          canEditAcademicYear: false,

          // Attendance
          canViewAllAttendance: false,
          canViewOwnAttendance: true,
          canEditAttendance: false,
          canManualCheckIn: true, // Solo check-in/check-out

          // Reports
          canGenerateInstitutionReports: false,
          canGeneratePersonalReports: true,
          canExportData: false, // Solo sus propios datos

          // Alerts
          canManageAlerts: false,
          canViewAlerts: false, // Solo alertas que le afecten
          canResolveAlerts: false,

          // Settings
          canEditSettings: false,
          canManageUsers: false,
          canViewSecuritySettings: false,

          // Schedules
          canEditSchedules: false,
          canViewSchedules: true, // Solo su horario

          // Absences
          canApproveAbsences: false,
          canRequestAbsence: true,
          canViewAbsences: true, // Solo sus propias ausencias
        };

      default:
        // Permisos por defecto (ninguno)
        return {
          canViewAllInstitutions: false,
          canViewInstitutionDashboard: false,
          canViewPersonalDashboard: false,
          canCreateEmployee: false,
          canEditEmployee: false,
          canDeleteEmployee: false,
          canViewEmployees: false,
          canImportSchedules: false,
          canCreateInstitution: false,
          canEditInstitution: false,
          canViewInstitutions: false,
          canCreateAcademicYear: false,
          canEditAcademicYear: false,
          canViewAllAttendance: false,
          canViewOwnAttendance: false,
          canEditAttendance: false,
          canManualCheckIn: false,
          canGenerateInstitutionReports: false,
          canGeneratePersonalReports: false,
          canExportData: false,
          canManageAlerts: false,
          canViewAlerts: false,
          canResolveAlerts: false,
          canEditSettings: false,
          canManageUsers: false,
          canViewSecuritySettings: false,
          canEditSchedules: false,
          canViewSchedules: false,
          canApproveAbsences: false,
          canRequestAbsence: false,
          canViewAbsences: false,
        };
    }
  };

  return getPermissions(role || 'employee');
}

export function useRoleDisplay() {
  const { user } = useAuth();
  
  const getRoleDisplayName = (role: string, language: string) => {
    const roleNames = {
      ca: {
        superadmin: 'Superadministrador',
        admin: 'Administrador',
        employee: 'Professor/a',
      },
      es: {
        superadmin: 'Superadministrador',
        admin: 'Administrador', 
        employee: 'Profesor/a',
      }
    };
    
    return roleNames[language as keyof typeof roleNames]?.[role as keyof typeof roleNames.ca] || role;
  };

  return { getRoleDisplayName };
}