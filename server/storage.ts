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
  attendanceNetworkSettings,
  emailSettings,
  absenceJustifications,
  alertNotifications,
  subjects,
  classGroups,
  classrooms,
  untisScheduleSessions,
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
  type AttendanceNetworkSetting,
  type InsertAttendanceNetworkSetting,
  type EmailSetting,
  type InsertEmailSetting,
  type AbsenceJustification,
  type InsertAbsenceJustification,
  type AlertNotification,
  type InsertAlertNotification,
  type Subject,
  type InsertSubject,
  type ClassGroup,
  type InsertClassGroup,
  type Classroom,
  type InsertClassroom,
  type UntisScheduleSession,
  type InsertUntisScheduleSession,
} from "@shared/schema";
import { logger } from './logger';
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, or, sql, count, ne, isNull } from "drizzle-orm";

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

  // Network settings operations
  getAttendanceNetworkSettings(institutionId: string): Promise<AttendanceNetworkSetting | undefined>;
  upsertAttendanceNetworkSettings(settings: InsertAttendanceNetworkSetting): Promise<AttendanceNetworkSetting>;
  isIPAllowedForAttendance(institutionId: string, clientIP: string): Promise<boolean>;

  // Email settings operations
  getEmailSettings(institutionId: string): Promise<EmailSetting | undefined>;
  upsertEmailSettings(settings: InsertEmailSetting): Promise<EmailSetting>;

  // Absence justifications operations
  getAbsenceJustifications(employeeId: string): Promise<AbsenceJustification[]>;
  createAbsenceJustification(justification: InsertAbsenceJustification): Promise<AbsenceJustification>;
  updateAbsenceJustificationStatus(id: string, status: string, adminResponse?: string): Promise<AbsenceJustification>;

  // Alert notifications operations
  createAlertNotification(notification: InsertAlertNotification): Promise<AlertNotification>;
  getAlertNotifications(institutionId: string): Promise<AlertNotification[]>;

  // Password management operations
  updateUserPassword(userId: string, newPassword: string): Promise<User>;

  // Weekly attendance operations
  getWeeklyAttendance(employeeId: string, startDate: Date, endDate: Date): Promise<any[]>;

  // Institution-wide absence justifications
  getInstitutionAbsenceJustifications(institutionId: string): Promise<AbsenceJustification[]>;

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
    const query = db
      .select()
      .from(employees)
      .where(eq(employees.institutionId, institutionId));

    return await query.orderBy(asc(employees.fullName));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async searchEmployees(institutionId: string, searchQuery: string): Promise<Employee[]> {
    return await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.institutionId, institutionId),
          or(
            sql`${employees.fullName} ILIKE ${`%${searchQuery}%`}`,
            sql`${employees.email} ILIKE ${`%${searchQuery}%`}`,
            sql`${employees.dni} ILIKE ${`%${searchQuery}%`}`
          )
        )
      )
      .orderBy(asc(employees.fullName));
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

  // Institution-wide absence justifications
  async getInstitutionAbsenceJustifications(institutionId: string): Promise<AbsenceJustification[]> {
    const justifications = await db
      .select({
        id: absenceJustifications.id,
        employeeId: absenceJustifications.employeeId,
        employeeName: employees.fullName,
        updatedAt: absenceJustifications.updatedAt,
        date: absenceJustifications.date,
        reason: absenceJustifications.reason,
        status: absenceJustifications.status,
        adminResponse: absenceJustifications.adminResponse,
        createdAt: absenceJustifications.createdAt,
      })
      .from(absenceJustifications)
      .innerJoin(employees, eq(absenceJustifications.employeeId, employees.id))
      .where(eq(employees.institutionId, institutionId))
      .orderBy(desc(absenceJustifications.createdAt));

    return justifications;
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
    // Check if setting exists first
    const existing = await this.getSetting(setting.institutionId, setting.key);
    
    if (existing) {
      // Update existing setting
      const [updated] = await db
        .update(settings)
        .set({
          value: setting.value,
          updatedAt: new Date(),
        })
        .where(and(
          eq(settings.institutionId, setting.institutionId),
          eq(settings.key, setting.key)
        ))
        .returning();
      return updated;
    } else {
      // Insert new setting
      const [inserted] = await db
        .insert(settings)
        .values({
          ...setting,
          id: sql`gen_random_uuid()`,
        })
        .returning();
      return inserted;
    }
  }

  // Attendance network settings operations
  async getAttendanceNetworkSettings(institutionId: string): Promise<AttendanceNetworkSetting | undefined> {
    const [networkSettings] = await db
      .select()
      .from(attendanceNetworkSettings)
      .where(eq(attendanceNetworkSettings.institutionId, institutionId));
    return networkSettings;
  }

  async upsertAttendanceNetworkSettings(settings: InsertAttendanceNetworkSetting): Promise<AttendanceNetworkSetting> {
    const [upserted] = await db
      .insert(attendanceNetworkSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: [attendanceNetworkSettings.institutionId],
        set: {
          allowedNetworks: settings.allowedNetworks,
          requireNetworkValidation: settings.requireNetworkValidation,
          description: settings.description,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upserted;
  }

  // Check if IP is allowed for attendance
  async isIPAllowedForAttendance(institutionId: string, clientIP: string): Promise<boolean> {
    const networkSettings = await this.getAttendanceNetworkSettings(institutionId);
    
    if (!networkSettings || !networkSettings.requireNetworkValidation) {
      return true; // No network validation required
    }

    // Check if client IP is in allowed networks
    const allowedNetworks = networkSettings.allowedNetworks || [];
    
    for (const network of allowedNetworks) {
      if (this.isIPInNetwork(clientIP, network)) {
        return true;
      }
    }
    
    return false;
  }

  private isIPInNetwork(ip: string, network: string): boolean {
    // Simple implementation for IP/CIDR matching
    if (network.includes('/')) {
      // CIDR notation (e.g., 192.168.1.0/24)
      const [networkIP, maskBits] = network.split('/');
      const mask = parseInt(maskBits);
      
      const ipToNumber = (ip: string) => {
        return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
      };
      
      const ipNum = ipToNumber(ip);
      const networkNum = ipToNumber(networkIP);
      const maskNum = ((0xffffffff << (32 - mask)) >>> 0);
      
      return (ipNum & maskNum) === (networkNum & maskNum);
    } else {
      // Direct IP match
      return ip === network;
    }
  }

  // Email settings operations
  async getEmailSettings(institutionId: string): Promise<EmailSetting | undefined> {
    const [settings] = await db
      .select()
      .from(emailSettings)
      .where(eq(emailSettings.institutionId, institutionId));
    return settings;
  }

  async upsertEmailSettings(settings: InsertEmailSetting): Promise<EmailSetting> {
    const existing = await this.getEmailSettings(settings.institutionId);
    
    if (existing) {
      const [updated] = await db
        .update(emailSettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(emailSettings.institutionId, settings.institutionId))
        .returning();
      return updated;
    } else {
      const [inserted] = await db
        .insert(emailSettings)
        .values({
          ...settings,
          id: sql`gen_random_uuid()`,
        })
        .returning();
      return inserted;
    }
  }

  // Absence justifications operations
  async getAbsenceJustifications(employeeId: string): Promise<AbsenceJustification[]> {
    return await db
      .select()
      .from(absenceJustifications)
      .where(eq(absenceJustifications.employeeId, employeeId))
      .orderBy(desc(absenceJustifications.date));
  }

  async createAbsenceJustification(justification: InsertAbsenceJustification): Promise<AbsenceJustification> {
    const [created] = await db
      .insert(absenceJustifications)
      .values({
        ...justification,
        id: sql`gen_random_uuid()`,
      })
      .returning();
    return created;
  }

  async updateAbsenceJustificationStatus(id: string, status: string, adminResponse?: string): Promise<AbsenceJustification> {
    const [updated] = await db
      .update(absenceJustifications)
      .set({
        status,
        adminResponse,
        updatedAt: new Date(),
      })
      .where(eq(absenceJustifications.id, id))
      .returning();
    return updated;
  }

  // Alert notifications operations
  async createAlertNotification(notification: InsertAlertNotification): Promise<AlertNotification> {
    const [created] = await db
      .insert(alertNotifications)
      .values({
        ...notification,
        id: sql`gen_random_uuid()`,
      })
      .returning();
    return created;
  }

  async getAlertNotifications(institutionId: string): Promise<AlertNotification[]> {
    return await db
      .select()
      .from(alertNotifications)
      .where(eq(alertNotifications.institutionId, institutionId))
      .orderBy(desc(alertNotifications.sentAt));
  }

  // Password management operations
  async updateUserPassword(userId: string, newPassword: string): Promise<User> {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const [updatedUser] = await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  // Weekly attendance operations
  async getWeeklyAttendance(employeeId: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      // Get attendance records for the week
      const records = await db
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.employeeId, employeeId),
            gte(attendanceRecords.timestamp, startDate),
            lte(attendanceRecords.timestamp, endDate)
          )
        )
        .orderBy(attendanceRecords.timestamp);

    // Get absence justifications for the week
    const justifications = await db
      .select()
      .from(absenceJustifications)
      .where(
        and(
          eq(absenceJustifications.employeeId, employeeId),
          sql`${absenceJustifications.date} >= ${startDate.toISOString().split('T')[0]}`,
          sql`${absenceJustifications.date} <= ${endDate.toISOString().split('T')[0]}`
        )
      );

    // Group attendance by date
    const dailyAttendance = new Map();
    
    records.forEach((record: any) => {
      const date = record.timestamp.toISOString().split('T')[0];
      if (!dailyAttendance.has(date)) {
        dailyAttendance.set(date, { date, records: [] });
      }
      dailyAttendance.get(date).records.push(record);
    });

    // Process each day's data
    const weeklyData = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayData = dailyAttendance.get(dateStr);
      const justification = justifications.find(j => 
        j.date === dateStr
      );

      let checkInTime = null;
      let checkOutTime = null;
      let totalHours = null;

      if (dayData) {
        const checkInRecord = dayData.records.find((r: any) => r.type === 'check_in');
        const checkOutRecord = dayData.records.find((r: any) => r.type === 'check_out');
        
        if (checkInRecord) {
          checkInTime = checkInRecord.timestamp.toLocaleTimeString('ca-ES', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        
        if (checkOutRecord) {
          checkOutTime = checkOutRecord.timestamp.toLocaleTimeString('ca-ES', {
            hour: '2-digit', 
            minute: '2-digit'
          });
        }

        if (checkInRecord && checkOutRecord) {
          const diff = checkOutRecord.timestamp.getTime() - checkInRecord.timestamp.getTime();
          totalHours = Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
        }
      }

      weeklyData.push({
        date: dateStr,
        checkInTime,
        checkOutTime,
        totalHours,
        justification: justification ? {
          id: justification.id,
          reason: justification.reason,
          status: justification.status,
          adminResponse: justification.adminResponse
        } : null
      });
    }

    return weeklyData;
    } catch (error) {
      console.error("Error in getWeeklyAttendance:", error);
      return [];
    }
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

  // Get admin users for an institution
  async getAdminUsers(institutionId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.institutionId, institutionId),
          or(eq(users.role, "admin"), eq(users.role, "superadmin"))
        )
      )
      .orderBy(asc(users.firstName));
  }

  // Authenticate user for quick attendance
  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(password, user.passwordHash || '');
    return isValid ? user : null;
  }

  // Get employee by user ID
  async getEmployeeByUserId(userId: string): Promise<Employee | null> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, userId));
    
    return employee || null;
  }

  // Get last attendance record for an employee
  async getLastAttendanceRecord(employeeId: string): Promise<AttendanceRecord | null> {
    const [record] = await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.employeeId, employeeId))
      .orderBy(desc(attendanceRecords.timestamp))
      .limit(1);
    
    return record || null;
  }

  // Get all users for dropdown (simplified data)
  async getAllUsersForDropdown(): Promise<any[]> {
    return await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.role, "employee"))
      .orderBy(asc(users.firstName), asc(users.lastName));
  }

  // Automated alert settings operations
  async getAutomatedAlertSettings(institutionId: string): Promise<any> {
    const alertSettings = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.institutionId, institutionId),
          eq(settings.key, 'automated_alerts')
        )
      )
      .limit(1);

    return alertSettings.length > 0 ? alertSettings[0].value : null;
  }

  async updateAutomatedAlertSettings(institutionId: string, alertSettings: any): Promise<any> {
    const existingSettings = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.institutionId, institutionId),
          eq(settings.key, 'automated_alerts')
        )
      )
      .limit(1);

    if (existingSettings.length > 0) {
      // Update existing
      const [updated] = await db
        .update(settings)
        .set({
          value: alertSettings,
          updatedAt: new Date(),
        })
        .where(eq(settings.id, existingSettings[0].id))
        .returning();
      return updated.value;
    } else {
      // Create new
      const [created] = await db
        .insert(settings)
        .values({
          institutionId,
          key: 'automated_alerts',
          value: alertSettings,
        })
        .returning();
      return created.value;
    }
  }

  async sendTestAlert(institutionId: string): Promise<void> {
    // Get email settings first
    const emailSettings = await this.getEmailSettings(institutionId);
    if (!emailSettings || !emailSettings.senderEmail) {
      throw new Error("Email configuration not found. Please configure email settings first.");
    }

    // Get alert settings
    const alertSettings = await this.getAutomatedAlertSettings(institutionId);
    if (!alertSettings || !alertSettings.recipientEmails || alertSettings.recipientEmails.length === 0) {
      throw new Error("No recipients configured for alerts.");
    }

    // Get institution info
    const institution = await this.getInstitution(institutionId);
    const centerName = institution?.name || "Centre Educatiu";

    // Prepare test email content
    const subject = `[PROVA] ${centerName} - Test d'Alertes Automàtiques`;
    
    const body = `Estimat/da administrador/a,

Aquest és un email de prova del sistema d'alertes automàtiques d'EduPresència.

CONFIGURACIÓ ACTUAL:
- Centre: ${centerName}
- Llindar de retard: ${alertSettings.delayThresholdMinutes || 15} minuts
- Llindar d'absència: ${alertSettings.absenceThresholdDays || 3} dies
- Freqüència d'informes: ${alertSettings.reportFrequency || 'setmanal'}
- Hora d'enviament: ${alertSettings.reportTime || '09:00'}

COMPLIMENT LEGAL:
${alertSettings.legalComplianceMode ? 
  'El sistema inclou referències legals per garantir el compliment de l\'Article 34.9 de l\'Estatut dels Treballadors.' :
  'Mode de compliment legal desactivat.'}

Si rebeu aquest email, la configuració és correcta.

Salutacions cordials,
Sistema de Control d'Assistència EduPresència

---
Aquest és un email automàtic generat pel sistema. Si us plau, no respongueu directament.
Data de prova: ${new Date().toLocaleString('ca-ES')}`;

    // In a real implementation, this would send the actual email
    // For now, we simulate the process
    console.log(`Test alert sent to: ${alertSettings.recipientEmails.join(', ')}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body preview: ${body.substring(0, 100)}...`);
    
    // In production, integrate with actual email service like SendGrid, SES, or SMTP
    // Example pseudo-code:
    // await emailService.send({
    //   from: emailSettings.senderEmail,
    //   to: alertSettings.recipientEmails,
    //   subject,
    //   text: body
    // });
  }

  // GP Untis Import Functions
  async parseUntisCSV(csvContent: string, institutionId: string, academicYearId: string) {
    logger.scheduleImport('CSV_PARSE_START', `Starting GP Untis CSV parse for institution ${institutionId}`);
    
    const lines = csvContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const parsedSessions: any[] = [];
    const teachers = new Set<string>();
    const subjects = new Set<string>();
    const classGroups = new Set<string>();
    const classrooms = new Set<string>();

    try {
      for (const line of lines) {
        const [classe, grup, docent, materia, aula, dia, hora] = line.split(',').map(s => s.trim());
        
        if (!grup || !docent || !materia || !dia || !hora) {
          logger.warn('SCHEDULE_IMPORT', `Skipping invalid line: ${line}`);
          continue;
        }

        // Extract unique values
        teachers.add(docent);
        subjects.add(materia);
        classGroups.add(grup);
        if (aula && aula !== '') classrooms.add(aula);

        parsedSessions.push({
          institutionId,
          academicYearId,
          classeId: classe || null,
          groupCode: grup,
          teacherCode: docent,
          subjectCode: materia,
          classroomCode: aula || null,
          dayOfWeek: parseInt(dia),
          hourPeriod: parseInt(hora),
        });
      }

      logger.scheduleImport('CSV_PARSE_SUCCESS', `Parsed ${parsedSessions.length} sessions`, {
        teachers: teachers.size,
        subjects: subjects.size,
        classGroups: classGroups.size,
        classrooms: classrooms.size
      });

      return {
        sessions: parsedSessions,
        summary: {
          teachers: Array.from(teachers),
          subjects: Array.from(subjects),
          classGroups: Array.from(classGroups),
          classrooms: Array.from(classrooms)
        }
      };
    } catch (error) {
      logger.scheduleImportError('CSV_PARSE_ERROR', error as Error, { linesProcessed: parsedSessions.length });
      throw error;
    }
  }

  async importUntisSchedule(csvContent: string, institutionId: string, academicYearId: string) {
    logger.scheduleImport('IMPORT_START', `Starting GP Untis import for institution ${institutionId}`);
    
    try {
      // Parse CSV content
      const { sessions, summary } = await this.parseUntisCSV(csvContent, institutionId, academicYearId);

      // Clear existing schedule sessions for this academic year
      logger.scheduleImport('CLEANUP', 'Removing existing schedule sessions');
      await db.delete(untisScheduleSessions)
        .where(
          and(
            eq(untisScheduleSessions.institutionId, institutionId),
            eq(untisScheduleSessions.academicYearId, academicYearId)
          )
        );

      // Create/update subjects
      logger.scheduleImport('SUBJECTS_SYNC', `Syncing ${summary.subjects.length} subjects`);
      for (const subjectCode of summary.subjects) {
        await db.insert(subjects)
          .values({
            institutionId,
            academicYearId,
            code: subjectCode,
            name: subjectCode, // Use code as name for now
          })
          .onConflictDoNothing();
      }

      // Create/update class groups
      logger.scheduleImport('GROUPS_SYNC', `Syncing ${summary.classGroups.length} class groups`);
      for (const groupCode of summary.classGroups) {
        const level = groupCode.replace(/[ABC]$/, ''); // S1A -> S1
        const section = groupCode.slice(-1); // S1A -> A
        
        await db.insert(classGroups)
          .values({
            institutionId,
            academicYearId,
            code: groupCode,
            level,
            section,
          })
          .onConflictDoNothing();
      }

      // Create/update classrooms
      logger.scheduleImport('CLASSROOMS_SYNC', `Syncing ${summary.classrooms.length} classrooms`);
      for (const classroomCode of summary.classrooms) {
        await db.insert(classrooms)
          .values({
            institutionId,
            code: classroomCode,
            name: classroomCode,
          })
          .onConflictDoNothing();
      }

      // Insert schedule sessions with proper linking
      logger.scheduleImport('SESSIONS_INSERT', `Inserting ${sessions.length} schedule sessions`);
      const insertedSessions = await db.insert(untisScheduleSessions)
        .values(sessions)
        .returning();

      // Update links to existing employees
      logger.scheduleImport('EMPLOYEE_LINKING', 'Linking sessions to existing employees');
      const employeeCount = await this.linkUntisScheduleToEmployees(institutionId, academicYearId);

      logger.scheduleImport('IMPORT_SUCCESS', `Import completed successfully`, {
        sessionsImported: insertedSessions.length,
        employeesLinked: employeeCount,
        summary
      });

      return {
        success: true,
        sessionsImported: insertedSessions.length,
        employeesLinked: employeeCount,
        summary
      };

    } catch (error) {
      logger.scheduleImportError('IMPORT_FAILED', error as Error);
      throw error;
    }
  }

  async linkUntisScheduleToEmployees(institutionId: string, academicYearId: string) {
    logger.scheduleImport('EMPLOYEE_LINKING_START', 'Starting employee linking process');
    
    try {
      // Get all employees for this institution
      const employeesList = await db.select().from(employees)
        .where(eq(employees.institutionId, institutionId));

      let linkedCount = 0;

      // Link schedule sessions to employees by matching names
      for (const employee of employeesList) {
        const fullNameParts = employee.fullName.split(' ');
        const lastName = fullNameParts[fullNameParts.length - 1];
        const firstName = fullNameParts[0];
        
        // Try different name matching patterns
        const namePatterns = [
          employee.fullName.toUpperCase(),
          `${firstName.charAt(0)}.${lastName}`.toUpperCase(),
          `${lastName}`.toUpperCase(),
          `${firstName} ${lastName}`.toUpperCase(),
        ];

        for (const pattern of namePatterns) {
          const updated = await db.update(untisScheduleSessions)
            .set({ employeeId: employee.id })
            .where(
              and(
                eq(untisScheduleSessions.institutionId, institutionId),
                eq(untisScheduleSessions.academicYearId, academicYearId),
                eq(untisScheduleSessions.teacherCode, pattern),
                isNull(untisScheduleSessions.employeeId)
              )
            )
            .returning({ id: untisScheduleSessions.id });

          if (updated.length > 0) {
            linkedCount += updated.length;
            logger.scheduleImport('EMPLOYEE_LINKED', `Linked ${updated.length} sessions to ${employee.fullName} using pattern: ${pattern}`);
            break; // Stop trying other patterns for this employee
          }
        }
      }

      logger.scheduleImport('EMPLOYEE_LINKING_SUCCESS', `Linked ${linkedCount} sessions to employees`);
      return linkedCount;

    } catch (error) {
      logger.scheduleImportError('EMPLOYEE_LINKING_ERROR', error as Error);
      throw error;
    }
  }

  async getUntisScheduleSessions(institutionId: string, academicYearId: string) {
    logger.dbQuery('SELECT', 'untis_schedule_sessions', { institutionId, academicYearId });
    
    try {
      return await db.select().from(untisScheduleSessions)
        .where(
          and(
            eq(untisScheduleSessions.institutionId, institutionId),
            eq(untisScheduleSessions.academicYearId, academicYearId)
          )
        )
        .orderBy(
          asc(untisScheduleSessions.dayOfWeek),
          asc(untisScheduleSessions.hourPeriod),
          asc(untisScheduleSessions.groupCode)
        );
    } catch (error) {
      logger.dbError('SELECT', 'untis_schedule_sessions', error as Error, { institutionId, academicYearId });
      throw error;
    }
  }

  async getUntisScheduleStatistics(institutionId: string, academicYearId: string) {
    logger.dbQuery('SELECT_STATS', 'untis_schedule_sessions', { institutionId, academicYearId });
    
    try {
      const [stats] = await db.select({
        totalSessions: count(),
        linkedSessions: count(untisScheduleSessions.employeeId),
        uniqueTeachers: sql<number>`COUNT(DISTINCT ${untisScheduleSessions.teacherCode})`,
        uniqueSubjects: sql<number>`COUNT(DISTINCT ${untisScheduleSessions.subjectCode})`,
        uniqueGroups: sql<number>`COUNT(DISTINCT ${untisScheduleSessions.groupCode})`,
      }).from(untisScheduleSessions)
        .where(
          and(
            eq(untisScheduleSessions.institutionId, institutionId),
            eq(untisScheduleSessions.academicYearId, academicYearId)
          )
        );

      return stats;
    } catch (error) {
      logger.dbError('SELECT_STATS', 'untis_schedule_sessions', error as Error, { institutionId, academicYearId });
      throw error;
    }
  }

  async getActiveAcademicYear(institutionId: string): Promise<AcademicYear | undefined> {  
    logger.dbQuery('SELECT', 'academic_years', { institutionId, isActive: true });
    
    try {
      const [activeYear] = await db
        .select()
        .from(academicYears)
        .where(
          and(
            eq(academicYears.institutionId, institutionId),
            eq(academicYears.isActive, true)
          )
        )
        .limit(1);
      
      return activeYear || undefined;
    } catch (error) {
      logger.dbError('SELECT', 'academic_years', error as Error, { institutionId });
      throw error;
    }
  }

  async importUntisScheduleFromTXT(txtContent: string, institutionId: string, academicYearId: string) {
    logger.scheduleImport('TXT_IMPORT_START', `Starting GP Untis TXT import for institution ${institutionId}`);
    
    try {
      const lines = txtContent.trim().split('\n');
      const sessions: any[] = [];
      const teachers = new Set<string>();
      const subjects = new Set<string>();
      const classGroups = new Set<string>();
      const classrooms = new Set<string>();
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Parse TXT format: sessionId,"groupCode","teacherCode","subjectCode","roomCode",dayNum,hourNum,,
        const parts = line.split(',');
        if (parts.length < 7) continue;
        
        const sessionId = parts[0];
        const groupCode = parts[1]?.replace(/"/g, '') || '';
        const teacherCode = parts[2]?.replace(/"/g, '') || '';
        const subjectCode = parts[3]?.replace(/"/g, '') || '';
        const roomCode = parts[4]?.replace(/"/g, '') || '';
        const dayNum = parseInt(parts[5]) || 0;
        const hourNum = parseInt(parts[6]) || 0;
        
        if (!sessionId || !groupCode || !teacherCode || !subjectCode) continue;
        
        // Collect unique values
        teachers.add(teacherCode);
        subjects.add(subjectCode);
        classGroups.add(groupCode);
        if (roomCode) classrooms.add(roomCode);
        
        sessions.push({
          institutionId,
          academicYearId,
          sessionId: sessionId.trim(),
          groupCode: groupCode.trim(),
          teacherCode: teacherCode.trim(),
          subjectCode: subjectCode.trim(),
          classroomCode: roomCode.trim() || null,
          dayOfWeek: dayNum,
          hourPeriod: hourNum,
          employeeId: null, // Will be linked later
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      if (sessions.length === 0) {
        throw new Error('No valid schedule sessions found in the TXT file');
      }
      
      logger.scheduleImport('TXT_PARSE_SUCCESS', `Parsed ${sessions.length} sessions from TXT`, {
        teachers: teachers.size,
        subjects: subjects.size,
        classGroups: classGroups.size,
        classrooms: classrooms.size
      });
      
      // Clear existing sessions for this academic year
      await db.delete(untisScheduleSessions)
        .where(
          and(
            eq(untisScheduleSessions.institutionId, institutionId),
            eq(untisScheduleSessions.academicYearId, academicYearId)
          )
        );
      
      // Insert new sessions
      const insertedSessions = await db.insert(untisScheduleSessions)
        .values(sessions)
        .returning();
      
      // Try to link sessions to employees
      const employeeCount = await this.linkUntisScheduleToEmployees(institutionId, academicYearId);
      
      return {
        success: true,
        sessionsImported: insertedSessions.length,
        employeesLinked: employeeCount,
        summary: {
          teachers: Array.from(teachers),
          subjects: Array.from(subjects),
          classGroups: Array.from(classGroups),
          classrooms: Array.from(classrooms)
        }
      };
    } catch (error) {
      logger.scheduleImportError('TXT_IMPORT_ERROR', error as Error);
      throw error;
    }
  }

  async importUntisTeachers(txtContent: string, institutionId: string, academicYearId: string) {
    logger.scheduleImport('TEACHERS_IMPORT_START', `Starting GP Untis teachers import`);
    
    try {
      const lines = txtContent.trim().split('\n');
      const teachersData: any[] = [];
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Parse teacher format: "CODE","FULL_NAME",...,HOURS,...
        const parts = line.split(',');
        if (parts.length < 16) continue;
        
        const teacherCode = parts[0]?.replace(/"/g, '') || '';
        const fullName = parts[1]?.replace(/"/g, '') || teacherCode;
        const hoursStr = parts[15]?.replace(/"/g, '') || '0';
        const hours = parseFloat(hoursStr) || 0;
        
        if (!teacherCode || teacherCode === '?') continue;
        
        // Generate email from teacher code
        const email = `${teacherCode.toLowerCase().replace(/[^a-z0-9]/g, '.')}@insbitacola.cat`;
        
        teachersData.push({
          institutionId,
          fullName: fullName || teacherCode,
          email,
          teacherCode,
          weeklyHours: hours,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      logger.scheduleImport('TEACHERS_PARSE_SUCCESS', `Parsed ${teachersData.length} teachers`);
      
      // Insert or update teachers
      let createdCount = 0;
      let updatedCount = 0;
      
      for (const teacherData of teachersData) {
        const [existing] = await db.select()
          .from(employees)
          .where(
            and(
              eq(employees.institutionId, institutionId),
              eq(employees.email, teacherData.email)
            )
          )
          .limit(1);
        
        if (existing) {
          await db.update(employees)
            .set({
              fullName: teacherData.fullName,
              updatedAt: new Date()
            })
            .where(eq(employees.id, existing.id));
          updatedCount++;
        } else {
          // Check if user exists, if not create one
          let userId;
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, teacherData.email));

          if (existingUser) {
            userId = existingUser.id;
          } else {
            // Create user for the teacher with default password
            const bcrypt = await import('bcrypt');
            const passwordHash = await bcrypt.hash('prof123', 10);
            
            const [newUser] = await db
              .insert(users)
              .values({
                email: teacherData.email,
                firstName: teacherData.fullName.split(' ')[0],
                lastName: teacherData.fullName.split(' ').slice(1).join(' ') || '',
                role: 'employee',
                institutionId,
                passwordHash
              })
              .returning();
            userId = newUser.id;
            logger.scheduleImport('USER_CREATED', `Created user for teacher: ${teacherData.email}`);
          }

          // Create employee with userId
          await db.insert(employees).values({
            ...teacherData,
            userId,
            dni: teacherData.teacherCode, // Use teacher code as DNI
            startDate: new Date(),
            contractType: 'full_time',
            status: 'active'
          });
          createdCount++;
        }
      }
      
      return {
        success: true,
        teachersProcessed: teachersData.length,
        created: createdCount,
        updated: updatedCount
      };
    } catch (error) {
      logger.scheduleImportError('TEACHERS_IMPORT_ERROR', error as Error);
      throw error;
    }
  }

  async importUntisSubjects(txtContent: string, institutionId: string, academicYearId: string) {
    logger.scheduleImport('SUBJECTS_IMPORT_START', `Starting GP Untis subjects import`);
    
    try {
      const lines = txtContent.trim().split('\n');
      const subjectsData: any[] = [];
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Parse subject format: "CODE","NAME","SHORTNAME","ROOM",...
        const parts = line.split(',');
        if (parts.length < 4) continue;
        
        const subjectCode = parts[0]?.replace(/"/g, '') || '';
        const subjectName = parts[1]?.replace(/"/g, '') || subjectCode;
        const shortName = parts[2]?.replace(/"/g, '') || '';
        const defaultRoom = parts[3]?.replace(/"/g, '') || '';
        
        if (!subjectCode) continue;
        
        subjectsData.push({
          institutionId,
          academicYearId,
          code: subjectCode,
          name: subjectName,
          shortName: shortName || subjectCode,
          defaultClassroom: defaultRoom || null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      logger.scheduleImport('SUBJECTS_PARSE_SUCCESS', `Parsed ${subjectsData.length} subjects`);
      
      // Clear existing subjects for this academic year
      await db.delete(subjects)
        .where(
          and(
            eq(subjects.institutionId, institutionId),
            eq(subjects.academicYearId, academicYearId)
          )
        );
      
      // Insert new subjects
      const insertedSubjects = await db.insert(subjects)
        .values(subjectsData)
        .returning();
      
      return {
        success: true,
        subjectsImported: insertedSubjects.length
      };
    } catch (error) {
      logger.scheduleImportError('SUBJECTS_IMPORT_ERROR', error as Error);
      throw error;
    }
  }

  async importUntisClassGroups(txtContent: string, institutionId: string, academicYearId: string) {
    logger.scheduleImport('GROUPS_IMPORT_START', `Starting GP Untis class groups import`);
    
    try {
      const lines = txtContent.trim().split('\n');
      const groupsData: any[] = [];
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Parse group format: "GROUPCODE",...
        const parts = line.split(',');
        if (parts.length < 1) continue;
        
        const groupCode = parts[0]?.replace(/"/g, '') || '';
        if (!groupCode) continue;
        
        // Determine level and section from group code (e.g., S1A -> level: S1, section: A)
        const level = groupCode.replace(/[ABC]$/, ''); // S1A -> S1
        const section = groupCode.slice(-1); // S1A -> A
        
        groupsData.push({
          institutionId,
          academicYearId,
          code: groupCode,
          level,
          section,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      logger.scheduleImport('GROUPS_PARSE_SUCCESS', `Parsed ${groupsData.length} class groups`);
      
      // Clear existing groups for this academic year
      await db.delete(classGroups)
        .where(
          and(
            eq(classGroups.institutionId, institutionId),
            eq(classGroups.academicYearId, academicYearId)
          )
        );
      
      // Insert new groups
      const insertedGroups = await db.insert(classGroups)
        .values(groupsData)
        .returning();
      
      return {
        success: true,
        groupsImported: insertedGroups.length
      };
    } catch (error) {
      logger.scheduleImportError('GROUPS_IMPORT_ERROR', error as Error);
      throw error;
    }
  }

  async importCompleteUntisData(institutionId: string, academicYearId: string) {
    logger.scheduleImport('COMPLETE_IMPORT_START', `Starting complete GP Untis data import`);
    
    try {
      const fs = await import('fs');
      
      // Initialize counters
      let teachersCreated = 0, teachersUpdated = 0;
      let subjectsImported = 0, groupsImported = 0, schedulesImported = 0;
      
      // Import teachers
      const teachersPath = './attached_assets/PROFESSORAT_1754044133486.TXT';
      if (fs.existsSync(teachersPath)) {
        const teachersContent = fs.readFileSync(teachersPath, 'utf8');
        const teachersResult = await this.importUntisTeachers(teachersContent, institutionId, academicYearId);
        teachersCreated = teachersResult.created;
        teachersUpdated = teachersResult.updated;
        logger.scheduleImport('TEACHERS_IMPORTED', `Teachers: ${teachersCreated} created, ${teachersUpdated} updated`);
      }
      
      // Import subjects
      const subjectsPath = './attached_assets/MATÈRIES_1754044172639.TXT';
      if (fs.existsSync(subjectsPath)) {
        const subjectsContent = fs.readFileSync(subjectsPath, 'utf8');
        const subjectsResult = await this.importUntisSubjects(subjectsContent, institutionId, academicYearId);
        subjectsImported = subjectsResult.subjectsImported;
        logger.scheduleImport('SUBJECTS_IMPORTED', `Subjects: ${subjectsImported} imported`);
      }
      
      // Import class groups
      const groupsPath = './attached_assets/GRUPS_1754044162024.TXT';
      if (fs.existsSync(groupsPath)) {
        const groupsContent = fs.readFileSync(groupsPath, 'utf8');
        const groupsResult = await this.importUntisClassGroups(groupsContent, institutionId, academicYearId);
        groupsImported = groupsResult.groupsImported;
        logger.scheduleImport('GROUPS_IMPORTED', `Groups: ${groupsImported} imported`);
      }
      
      // Import schedule sessions
      const schedulePath = './attached_assets/HORARIS_1754043300200.TXT';
      if (fs.existsSync(schedulePath)) {
        const scheduleContent = fs.readFileSync(schedulePath, 'utf8');
        const scheduleResult = await this.importUntisScheduleFromTXT(scheduleContent, institutionId, academicYearId);
        schedulesImported = scheduleResult.sessionsImported || 0;
        logger.scheduleImport('SCHEDULE_IMPORTED', `Sessions: ${schedulesImported} imported, ${scheduleResult.employeesLinked} linked`);
      }
      
      // Final employee linking with improved matching
      const finalLinkCount = await this.linkUntisScheduleToEmployees(institutionId, academicYearId);
      
      return {
        success: true,
        teachersCreated,
        teachersUpdated,
        subjectsImported,
        groupsImported,
        schedulesImported,
        message: 'Complete GP Untis data import successful',
        finalEmployeesLinked: finalLinkCount
      };
    } catch (error) {
      logger.scheduleImportError('COMPLETE_IMPORT_ERROR', error as Error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
