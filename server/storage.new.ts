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
  institutionId: string,
  data: Partial<InsertAcademicYear>,
) {
  const values: InsertAcademicYear = {
    institutionId,
    name: data.name || "Default Name",
    startDate: data.startDate
      ? new Date(data.startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    endDate: data.endDate
      ? new Date(data.endDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    isActive: data.isActive || false,
    status: data.status || 'draft',
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
