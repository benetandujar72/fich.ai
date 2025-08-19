import {
  users,
  sessions,
  institutions,
  employees,
  schedules,
  attendanceRecords,
  absences,
  alerts,
  substituteAssignments,
  settings,
  emailSettings,
  absenceJustifications,
  alertNotifications,
  attendanceNetworkSettings,
  communications,
  communicationAttachments,
  communicationAuditLog,
  messageTemplates,
  emailTemplates,
  reportTemplates,
  academicYears,
  departments,
  subjects,
  classGroups,
  classrooms,
  untisScheduleSessions,
  weeklySchedule,
  privacyRequests,
  userScheduleTemplates,
} from "../shared/schema.js";
import type {
  User,
  Institution,
  InsertInstitution,
  Employee,
  InsertEmployee,
  Schedule,
  InsertSchedule,
  AttendanceRecord,
  InsertAttendanceRecord,
  Absence,
  InsertAbsence,
  Alert,
  InsertAlert,
  SubstituteAssignment,
  InsertSubstituteAssignment,
  Setting,
  InsertSetting,
  AttendanceNetworkSetting,
  InsertAttendanceNetworkSetting,
  EmailSetting,
  InsertEmailSetting,
  AbsenceJustification,
  InsertAbsenceJustification,
  AlertNotification,
  InsertAlertNotification,
  AcademicYear,
  InsertAcademicYear,
  Department,
  Subject,
  InsertSubject,
  ClassGroup,
  InsertClassGroup,
  Classroom,
  InsertClassroom,
  UntisScheduleSession,
  InsertUntisScheduleSession,
  Communication,
  InsertCommunication,
  CommunicationWithUsers,
  CommunicationAttachment,
  InsertCommunicationAttachment,
  CommunicationAuditLog,
  InsertCommunicationAuditLog,
  MessageTemplate,
  InsertMessageTemplate,
  EmailTemplate,
  InsertEmailTemplate,
  ReportTemplate,
  InsertReportTemplate,
  WeeklySchedule,
  InsertWeeklySchedule,
  UpsertUser,
} from "../shared/schema.js";
import {
  eq,
  and,
  or,
  desc,
  asc,
  isNull,
  isNotNull,
  gte,
  lte,
  count,
  sql,
  inArray,
  between,
} from "drizzle-orm";
import { db } from "./db.js";
import * as schema from "../shared/schema.js";

// Funciones de utilidad exportadas directamente

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result.length > 0 ? result[0] : null;
}

export async function getInstitutionById(
  id: string,
): Promise<Institution | null> {
  const result = await db
    .select()
    .from(institutions)
    .where(eq(institutions.id, id));
  return result.length > 0 ? result[0] : null;
}

export async function getUsersByDepartmentName(departmentName: string, institutionId: string) {
  const department = await db.query.departments.findFirst({
    where: and(
      eq(schema.departments.name, departmentName),
      eq(schema.departments.institutionId, institutionId),
    ),
  });

  if (!department) {
    return [];
  }

  const departmentEmployees = await db.query.employees.findMany({
    where: eq(schema.employees.departmentId, department.id),
    with: {
      user: true,
    },
  });

  return departmentEmployees.map((emp) => emp.user);
}

export async function createAcademicYear(
  data: InsertAcademicYear,
) {
  const values: InsertAcademicYear = {
    ...data,
    startDate: (data.startDate && typeof data.startDate !== 'string')
      ? new Date(data.startDate as unknown as Date).toISOString().split("T")[0]
      : (data.startDate as string),
    endDate: (data.endDate && typeof data.endDate !== 'string')
      ? new Date(data.endDate as unknown as Date).toISOString().split("T")[0]
      : (data.endDate as string),
    isActive: data.isActive ?? false,
    status: data.status ?? 'draft',
  };
  return db.insert(academicYears).values(values).returning();
}

export async function updateAcademicYear(
  id: string,
  data: Partial<AcademicYear>,
) {
  const updateData: { [key: string]: any } = { ...data };
  if (data.startDate && typeof data.startDate !== 'string') {
    updateData.startDate = new Date(data.startDate)
      .toISOString()
      .split("T")[0];
  }
  if (data.endDate && typeof data.endDate !== 'string') {
    updateData.endDate = new Date(data.endDate).toISOString().split("T")[0];
  }
  return db
    .update(academicYears)
    .set(updateData)
    .where(eq(academicYears.id, id))
      .returning();
}

export async function getActiveAcademicYear(
  institutionId: string,
): Promise<AcademicYear | null> {
  const now = new Date().toISOString().split("T")[0];
  const result = await db.query.academicYears.findFirst({
    where: and(
      eq(schema.academicYears.institutionId, institutionId),
      eq(schema.academicYears.isActive, true),
      lte(schema.academicYears.startDate, now),
      gte(schema.academicYears.endDate, now),
    ),
  });
  return result || null;
}

export async function createAbsence(data: InsertAbsence) {
  const values = {
      ...data,
      startDate: new Date(data.startDate).toISOString().split("T")[0],
      endDate: new Date(data.endDate).toISOString().split("T")[0],
  };
  return db.insert(absences).values(values).returning();
}

export async function getAbsencesByEmployeeAndDateRange(
  employeeId: string,
  startDate: Date,
  endDate: Date,
) {
  return db
      .select()
    .from(absences)
      .where(
        and(
        eq(absences.employeeId, employeeId),
        between(absences.startDate, startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0])
      ),
    )
    .orderBy(desc(absences.startDate));
}

export async function getAbsenceById(id: string) {
  const result = await db.select().from(absences).where(eq(absences.id, id));
  return result.length > 0 ? result[0] : null;
}

export async function updateAbsence(id: string, data: Partial<Absence>) {
  const updateData: { [key: string]: any } = { ...data };
    if (data.startDate && typeof data.startDate !== 'string') {
    updateData.startDate = new Date(data.startDate)
      .toISOString()
      .split("T")[0];
  }
  if (data.endDate && typeof data.endDate !== 'string') {
    updateData.endDate = new Date(data.endDate).toISOString().split("T")[0];
  }
  return db.update(absences).set(updateData).where(eq(absences.id, id)).returning();
}

export async function submitAbsenceJustification(
  employeeId: string,
  absenceDate: string,
  reason: string,
  adminNotes?: string,
) {
  const absenceDateFormatted = new Date(absenceDate).toISOString().split("T")[0];

  const [justification] = await db
    .insert(absenceJustifications)
    .values({
      employeeId: employeeId,
      reason: reason,
      status: "pending",
      date: absenceDateFormatted,
      adminResponse: adminNotes,
    })
      .returning();

  return justification;
}

export async function getUnjustifiedAbsences(employeeId: string, limit = 50) {
  const result = await db
        .select({
          id: absences.id,
      date: absences.startDate,
          reason: absences.reason,
      status: absences.status,
        })
        .from(absences)
    .leftJoin(
      absenceJustifications,
      eq(absences.id, absenceJustifications.id), 
    )
      .where(
        and(
        eq(absences.employeeId, employeeId),
        isNull(absenceJustifications.id),
      ),
    )
    .orderBy(desc(absences.startDate))
    .limit(limit);

  return result;
}

export async function getAbsenceJustifications(
  employeeId: string,
  page = 1,
  limit = 10,
) {
  const offset = (page - 1) * limit;

  const justifications = await db
      .select()
    .from(absenceJustifications)
    .where(eq(absenceJustifications.employeeId, employeeId))
    .orderBy(desc(absenceJustifications.date))
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(absenceJustifications)
    .where(eq(absenceJustifications.employeeId, employeeId));

  const total = totalResult[0].count;

  return {
    justifications,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

// ---- Funciones de informes requeridas por MCP (implementación mínima) ----
export async function getAttendanceOverview(
  _institutionId: string,
  _startDate?: Date,
  _endDate?: Date,
) {
  return {
    totalEmployees: 0,
    attendanceRate: 0,
    averageHoursPerDay: 0,
    totalLatesThisMonth: 0,
    totalAbsencesThisMonth: 0,
  };
}

export async function getAttendanceHistoryForUser(
  _fullName: string,
  _institutionId: string,
  _startDate?: Date,
  _endDate?: Date,
) {
  return [] as any[];
}

export async function getForensicDataForUser(
  _fullName: string,
  _institutionId: string,
  _startDate: Date,
  _endDate: Date,
) {
  return [] as any[];
}

export async function getRiskAnalysisData(
  _institutionId: string,
  _startDate: Date,
  _endDate: Date,
) {
  return [] as any[];
}

// Funciones mínimas utilizadas por otras partes del servidor
export async function getUser(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function upsertUser(userData: UpsertUser): Promise<User> {
  const [user] = await db
    .insert(users)
    .values(userData)
    .onConflictDoUpdate({
      target: users.id,
      set: { ...userData, updatedAt: new Date() },
    })
        .returning();
  return user;
}

export async function getInstitutions(): Promise<Institution[]> {
  return await db.select().from(institutions).orderBy(asc(institutions.name));
}

export async function createInstitution(data: InsertInstitution): Promise<Institution> {
  const [created] = await db.insert(institutions).values(data).returning();
    return created;
  }

export async function getAcademicYearsForInstitution(institutionId: string): Promise<AcademicYear[]> {
    return await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.institutionId, institutionId))
      .orderBy(desc(academicYears.startDate));
  }

export async function getDashboardStats(institutionId: string): Promise<any> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [totalEmployees] = await db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.institutionId, institutionId));

    const presentEmployees = await db
      .select({ count: count() })
      .from(attendanceRecords)
      .innerJoin(employees, eq(attendanceRecords.employeeId, employees.id))
      .where(
        and(
          eq(employees.institutionId, institutionId),
          eq(attendanceRecords.type, "check_in"),
          gte(attendanceRecords.timestamp, startOfDay),
          lte(attendanceRecords.timestamp, endOfDay)
        )
      );

    const [activeAlerts] = await db
      .select({ count: count() })
      .from(alerts)
      .innerJoin(employees, eq(alerts.employeeId, employees.id))
      .where(
        and(
          eq(employees.institutionId, institutionId),
          eq(alerts.status, "active")
        )
      );

    return {
      totalEmployees: totalEmployees.count,
      presentEmployees: presentEmployees[0]?.count || 0,
      activeAlerts: activeAlerts.count,
    };
  }

// Objeto de compatibilidad para import { storage } from './storage.js'
export const storage = {
  getUser,
  getUserByEmail,
  upsertUser,
  getInstitutions,
  createInstitution,
  getAcademicYears: getAcademicYearsForInstitution,
  createAcademicYear,
  getDashboardStats,
  getAttendanceOverview,
  getAttendanceHistoryForUser,
  getForensicDataForUser,
  getRiskAnalysisData,
  // Comunicaciones (stubs mínimos para compilar; implementar según necesidad)
  getCommunications: async (_userId: string, _filter?: string) => [],
  createCommunication: async (_data: any) => ({ id: 'placeholder' }),
  getUsersByInstitution: async (_institutionId: string) => [],
  // Settings y alert settings (stubs)
  getSettings: async (_institutionId: string) => ({} as any),
  upsertSetting: async (_data: any) => ({} as any),
  getAutomatedAlertSettings: async (_institutionId: string) => ({} as any),
  updateAutomatedAlertSettings: async (_institutionId: string, _json: string) => ({} as any),
  getEmailSettings: async (_institutionId: string | null) => (null as any),
  upsertEmailSettings: async (_data: any) => ({} as any),
  getAttendanceNetworkSettings: async (_institutionId: string | null) => (null as any),
  upsertAttendanceNetworkSettings: async (_data: any) => ({} as any),
  // Importación UNTIS (stubs)
  importCompleteUntisData: async (_institutionId: string, _academicYearId: string) => ({} as any),
  importUntisTeachers: async (_content: string, _institutionId: string, _academicYearId: string) => ({} as any),
  importUntisSchedule: async (_content: string, _institutionId: string, _academicYearId: string) => ({} as any),
  getUntisScheduleStatistics: async (_institutionId: string, _academicYearId: string) => ({} as any),
  getAbsenceById,
  createAbsence,
  updateAbsence,
  getAbsencesByEmployeeAndDateRange,
  submitAbsenceJustification,
  getAbsenceJustifications,
  getUnjustifiedAbsences,
  getActiveAcademicYear,
  getUsersByDepartmentName,
};
