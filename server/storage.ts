import {
  users,
  institutions,
  academicYears,
  employees,
  departments,
  schedules,
  attendanceRecords,
  absences,
  alerts,
  substituteAssignments,
  settings,
  type User,
  type UpsertUser,
  type Institution,
  type InsertInstitution,
  type AcademicYear,
  type InsertAcademicYear,
  type Employee,
  type InsertEmployee,
  type Schedule,
  type InsertSchedule,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type Absence,
  type InsertAbsence,
  type Alert,
  type InsertAlert,
  type SubstituteAssignment,
  type InsertSubstituteAssignment,
  type Setting,
  type InsertSetting,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, or, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Institution operations
  getInstitutions(): Promise<Institution[]>;
  createInstitution(institution: InsertInstitution): Promise<Institution>;

  // Academic year operations
  getAcademicYears(institutionId: string): Promise<AcademicYear[]>;
  createAcademicYear(academicYear: InsertAcademicYear): Promise<AcademicYear>;
  deleteInstitution(id: string): Promise<void>;

  // Employee operations
  getEmployees(institutionId: string): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  searchEmployees(institutionId: string, query: string): Promise<Employee[]>;

  // Schedule operations
  getEmployeeSchedules(employeeId: string): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: string, schedule: Partial<InsertSchedule>): Promise<Schedule>;
  deleteSchedule(id: string): Promise<void>;

  // Attendance operations
  getAttendanceRecords(employeeId: string, startDate?: Date, endDate?: Date): Promise<AttendanceRecord[]>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  getInstitutionAttendance(institutionId: string, date: Date): Promise<any[]>;

  // Absence operations
  getAbsences(employeeId?: string, institutionId?: string): Promise<Absence[]>;
  createAbsence(absence: InsertAbsence): Promise<Absence>;
  updateAbsence(id: string, absence: Partial<InsertAbsence>): Promise<Absence>;

  // Alert operations
  getActiveAlerts(institutionId: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  resolveAlert(id: string, resolvedBy: string): Promise<Alert>;

  // Substitute operations
  getSubstituteAssignments(date: Date, institutionId: string): Promise<SubstituteAssignment[]>;
  createSubstituteAssignment(assignment: InsertSubstituteAssignment): Promise<SubstituteAssignment>;

  // Settings operations
  getSettings(institutionId: string): Promise<Setting[]>;
  getSetting(institutionId: string, key: string): Promise<Setting | undefined>;
  upsertSetting(setting: InsertSetting): Promise<Setting>;

  // Dashboard statistics
  getDashboardStats(institutionId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Institution operations
  async getInstitutions(): Promise<Institution[]> {
    return await db.select().from(institutions).orderBy(asc(institutions.name));
  }

  async getInstitution(id: string): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.id, id));
    return institution;
  }

  async createInstitution(institution: InsertInstitution): Promise<Institution> {
    const [newInstitution] = await db.insert(institutions).values(institution).returning();
    return newInstitution;
  }

  async updateInstitution(id: string, institution: Partial<InsertInstitution>): Promise<Institution> {
    const [updated] = await db
      .update(institutions)
      .set({ ...institution, updatedAt: new Date() })
      .where(eq(institutions.id, id))
      .returning();
    return updated;
  }

  async deleteInstitution(id: string): Promise<void> {
    await db.delete(institutions).where(eq(institutions.id, id));
  }

  // Employee operations
  async getEmployees(institutionId: string, searchQuery?: string): Promise<Employee[]> {
    let query = db
      .select({
        id: employees.id,
        userId: employees.userId,
        institutionId: employees.institutionId,
        departmentId: employees.departmentId,
        employeeId: employees.employeeId,
        role: employees.role,
        startDate: employees.startDate,
        endDate: employees.endDate,
        isActive: employees.isActive,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl
        },
        department: {
          id: departments.id,
          name: departments.name
        }
      })
      .from(employees)
      .leftJoin(users, eq(employees.userId, users.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(eq(employees.institutionId, institutionId));

    if (searchQuery) {
      query = query.where(
        or(
          sql`${users.firstName} ILIKE ${`%${searchQuery}%`}`,
          sql`${users.lastName} ILIKE ${`%${searchQuery}%`}`,
          sql`${users.email} ILIKE ${`%${searchQuery}%`}`,
          sql`${employees.employeeId} ILIKE ${`%${searchQuery}%`}`
        )
      );
    }

    return await query.orderBy(asc(users.firstName), asc(users.lastName));
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updated] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updated;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  // Schedule operations
  async getEmployeeSchedules(employeeId: string): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.employeeId, employeeId), eq(schedules.isActive, true)))
      .orderBy(asc(schedules.dayOfWeek));
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [newSchedule] = await db.insert(schedules).values(schedule).returning();
    return newSchedule;
  }

  async updateSchedule(id: string, schedule: Partial<InsertSchedule>): Promise<Schedule> {
    const [updated] = await db
      .update(schedules)
      .set(schedule)
      .where(eq(schedules.id, id))
      .returning();
    return updated;
  }

  async deleteSchedule(id: string): Promise<void> {
    await db.delete(schedules).where(eq(schedules.id, id));
  }

  // Attendance operations
  async getAttendanceRecords(employeeId: string, startDate?: Date, endDate?: Date): Promise<AttendanceRecord[]> {
    let conditions = [eq(attendanceRecords.employeeId, employeeId)];
    
    if (startDate && endDate) {
      conditions.push(
        gte(attendanceRecords.timestamp, startDate),
        lte(attendanceRecords.timestamp, endDate)
      );
    }
    
    return await db
      .select()
      .from(attendanceRecords)
      .where(and(...conditions))
      .orderBy(desc(attendanceRecords.timestamp));
  }

  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [newRecord] = await db.insert(attendanceRecords).values(record).returning();
    return newRecord;
  }

  async getInstitutionAttendance(institutionId: string, date: Date): Promise<any[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select({
        employee: employees,
        records: attendanceRecords,
      })
      .from(employees)
      .leftJoin(
        attendanceRecords,
        and(
          eq(employees.id, attendanceRecords.employeeId),
          gte(attendanceRecords.timestamp, startOfDay),
          lte(attendanceRecords.timestamp, endOfDay)
        )
      )
      .where(eq(employees.institutionId, institutionId));
  }

  // Absence operations
  async getAbsences(employeeId?: string, institutionId?: string): Promise<Absence[]> {
    if (employeeId) {
      return await db
        .select()
        .from(absences)
        .where(eq(absences.employeeId, employeeId))
        .orderBy(desc(absences.createdAt));
    } else if (institutionId) {
      return await db
        .select({
          id: absences.id,
          employeeId: absences.employeeId,
          type: absences.type,
          status: absences.status,
          startDate: absences.startDate,
          endDate: absences.endDate,
          reason: absences.reason,
          documentation: absences.documentation,
          approvedBy: absences.approvedBy,
          approvedAt: absences.approvedAt,
          createdAt: absences.createdAt,
        })
        .from(absences)
        .innerJoin(employees, eq(absences.employeeId, employees.id))
        .where(eq(employees.institutionId, institutionId))
        .orderBy(desc(absences.createdAt));
    }
    
    return [];
  }

  async createAbsence(absence: InsertAbsence): Promise<Absence> {
    const [newAbsence] = await db.insert(absences).values(absence).returning();
    return newAbsence;
  }

  async updateAbsence(id: string, absence: Partial<InsertAbsence>): Promise<Absence> {
    const [updated] = await db
      .update(absences)
      .set(absence)
      .where(eq(absences.id, id))
      .returning();
    return updated;
  }

  // Alert operations
  async getActiveAlerts(institutionId: string): Promise<Alert[]> {
    return await db
      .select({
        id: alerts.id,
        employeeId: alerts.employeeId,
        type: alerts.type,
        status: alerts.status,
        title: alerts.title,
        description: alerts.description,
        metadata: alerts.metadata,
        resolvedBy: alerts.resolvedBy,
        resolvedAt: alerts.resolvedAt,
        createdAt: alerts.createdAt,
      })
      .from(alerts)
      .innerJoin(employees, eq(alerts.employeeId, employees.id))
      .where(
        and(
          eq(employees.institutionId, institutionId),
          eq(alerts.status, "active")
        )
      )
      .orderBy(desc(alerts.createdAt));
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async resolveAlert(id: string, resolvedBy: string): Promise<Alert> {
    const [resolved] = await db
      .update(alerts)
      .set({
        status: "resolved",
        resolvedBy,
        resolvedAt: new Date(),
      })
      .where(eq(alerts.id, id))
      .returning();
    return resolved;
  }

  // Substitute operations
  async getSubstituteAssignments(date: Date, institutionId: string): Promise<SubstituteAssignment[]> {
    return await db
      .select({
        id: substituteAssignments.id,
        absentEmployeeId: substituteAssignments.absentEmployeeId,
        substituteEmployeeId: substituteAssignments.substituteEmployeeId,
        date: substituteAssignments.date,
        startTime: substituteAssignments.startTime,
        endTime: substituteAssignments.endTime,
        room: substituteAssignments.room,
        notes: substituteAssignments.notes,
        isAutoAssigned: substituteAssignments.isAutoAssigned,
        createdAt: substituteAssignments.createdAt,
      })
      .from(substituteAssignments)
      .innerJoin(employees, eq(substituteAssignments.absentEmployeeId, employees.id))
      .where(
        and(
          eq(substituteAssignments.date, date.toISOString().split('T')[0]),
          eq(employees.institutionId, institutionId)
        )
      );
  }

  async createSubstituteAssignment(assignment: InsertSubstituteAssignment): Promise<SubstituteAssignment> {
    const [newAssignment] = await db.insert(substituteAssignments).values(assignment).returning();
    return newAssignment;
  }

  // Settings operations
  async getSettings(institutionId: string): Promise<Setting[]> {
    return await db.select().from(settings).where(eq(settings.institutionId, institutionId));
  }

  async getSetting(institutionId: string, key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(and(eq(settings.institutionId, institutionId), eq(settings.key, key)));
    return setting;
  }

  async upsertSetting(setting: InsertSetting): Promise<Setting> {
    const [upserted] = await db
      .insert(settings)
      .values(setting)
      .onConflictDoUpdate({
        target: [settings.institutionId, settings.key],
        set: {
          value: setting.value,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  // Institution operations
  async getInstitutions(): Promise<Institution[]> {
    return await db.select().from(institutions).orderBy(asc(institutions.name));
  }

  async createInstitution(institutionData: InsertInstitution): Promise<Institution> {
    const [institution] = await db.insert(institutions).values(institutionData).returning();
    return institution;
  }

  // Academic year operations
  async getAcademicYears(institutionId: string): Promise<AcademicYear[]> {
    return await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.institutionId, institutionId))
      .orderBy(desc(academicYears.startDate));
  }

  async createAcademicYear(yearData: InsertAcademicYear): Promise<AcademicYear> {
    const [academicYear] = await db.insert(academicYears).values(yearData).returning();
    return academicYear;
  }

  // Dashboard statistics
  async getDashboardStats(institutionId: string): Promise<any> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get total employees
    const [totalEmployees] = await db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.institutionId, institutionId));

    // Get present employees today
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

    // Get active alerts count
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
}

export const storage = new DatabaseStorage();
