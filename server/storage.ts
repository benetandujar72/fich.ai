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
  communications,
  communicationAttachments,
  communicationAuditLog,
  messageTemplates,
  weeklySchedule,
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
  type Communication,
  type InsertCommunication,
  type CommunicationAttachment,
  type InsertCommunicationAttachment,
  type CommunicationAuditLog,
  type InsertCommunicationAuditLog,
  type MessageTemplate,
  type InsertMessageTemplate,
  type WeeklySchedule,
  type InsertWeeklySchedule,
} from "@shared/schema";
import { logger } from './logger';
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, or, sql, count, ne, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { format } from "date-fns";

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
  getSettings(institutionId: string | null): Promise<Setting[]>;
  getSetting(institutionId: string, key: string): Promise<Setting | undefined>;
  upsertSetting(setting: InsertSetting): Promise<Setting>;

  // Network settings operations
  getAttendanceNetworkSettings(institutionId: string | null): Promise<AttendanceNetworkSetting | undefined>;
  upsertAttendanceNetworkSettings(settings: InsertAttendanceNetworkSetting): Promise<AttendanceNetworkSetting>;
  isIPAllowedForAttendance(institutionId: string, clientIP: string): Promise<boolean>;

  // Email settings operations
  getEmailSettings(institutionId: string | null): Promise<EmailSetting | undefined>;
  upsertEmailSettings(settings: InsertEmailSetting): Promise<EmailSetting>;

  // Absence justifications operations
  getAbsenceJustifications(employeeId: string): Promise<AbsenceJustification[]>;
  createAbsenceJustification(justification: InsertAbsenceJustification): Promise<AbsenceJustification>;
  updateAbsenceJustificationStatus(id: string, status: string, adminResponse?: string): Promise<AbsenceJustification>;

  // Alert notifications operations
  createAlertNotification(notification: InsertAlertNotification): Promise<AlertNotification>;
  getAlertNotifications(institutionId: string | null): Promise<AlertNotification[]>;

  // Password management operations
  updateUserPassword(userId: string, newPassword: string): Promise<User>;

  // Weekly attendance operations
  getWeeklyAttendance(employeeId: string, startDate: Date, endDate: Date): Promise<any[]>;

  // Institution-wide absence justifications
  getInstitutionAbsenceJustifications(institutionId: string): Promise<AbsenceJustification[]>;

  // Dashboard statistics
  getDashboardStats(institutionId: string): Promise<any>;

  // Automated alert settings operations
  getAutomatedAlertSettings(institutionId: string | null): Promise<any>;
  updateAutomatedAlertSettings(institutionId: string | null, alertSettings: any): Promise<any>;
  sendTestAlert(institutionId: string | null): Promise<void>;
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

  async getEmployeeByUserId(userId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.userId, userId));
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
  async getSettings(institutionId: string | null): Promise<Setting[]> {
    return await db.select().from(settings).where(institutionId === null 
      ? sql`${settings.institutionId} IS NULL`
      : eq(settings.institutionId, institutionId));
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
  async getAttendanceNetworkSettings(institutionId: string | null): Promise<AttendanceNetworkSetting | undefined> {
    const [networkSettings] = await db
      .select()
      .from(attendanceNetworkSettings)
      .where(institutionId === null 
        ? sql`${attendanceNetworkSettings.institutionId} IS NULL`
        : eq(attendanceNetworkSettings.institutionId, institutionId));
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
    let networkSettings = await this.getAttendanceNetworkSettings(institutionId);
    
    // If no settings for specific institution, try global settings (null)
    if (!networkSettings && institutionId !== 'null') {
      networkSettings = await this.getAttendanceNetworkSettings(null);
    }
    
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
  async getEmailSettings(institutionId: string | null): Promise<EmailSetting | undefined> {
    const [emailSetting] = await db
      .select()
      .from(emailSettings)
      .where(institutionId === null 
        ? sql`${emailSettings.institutionId} IS NULL`
        : eq(emailSettings.institutionId, institutionId));
    return emailSetting;
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

  async getAlertNotifications(institutionId: string | null): Promise<AlertNotification[]> {
    return await db
      .select()
      .from(alertNotifications)
      .where(institutionId === null 
        ? sql`${alertNotifications.institutionId} IS NULL`
        : eq(alertNotifications.institutionId, institutionId))
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
      // Adjust dates to cover the full day range in local timezone
      const localStartDate = new Date(startDate);
      localStartDate.setHours(0, 0, 0, 0); // Start of first day
      
      const localEndDate = new Date(endDate);
      localEndDate.setHours(23, 59, 59, 999); // End of last day

      console.log(`[getWeeklyAttendance] Query parameters:`, {
        employeeId,
        originalStartDate: startDate.toISOString(),
        originalEndDate: endDate.toISOString(),
        localStartDate: localStartDate.toISOString(),
        localEndDate: localEndDate.toISOString()
      });

      // Get attendance records for the week using date range that covers full days
      const records = await db
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.employeeId, employeeId),
            gte(attendanceRecords.timestamp, localStartDate),
            lte(attendanceRecords.timestamp, localEndDate)
          )
        )
        .orderBy(attendanceRecords.timestamp);

      console.log(`[getWeeklyAttendance] Found ${records.length} attendance records:`, records);

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
      // Ensure we handle timestamp correctly whether it's Date object or string
      const timestamp = record.timestamp instanceof Date ? record.timestamp : new Date(record.timestamp);
      const date = timestamp.toISOString().split('T')[0];
      console.log(`[getWeeklyAttendance] Processing record:`, {
        id: record.id,
        type: record.type,
        timestamp: record.timestamp,
        dateExtracted: date
      });
      if (!dailyAttendance.has(date)) {
        dailyAttendance.set(date, { date, records: [] });
      }
      dailyAttendance.get(date).records.push(record);
    });
    
    console.log(`[getWeeklyAttendance] Daily attendance map:`, Object.fromEntries(dailyAttendance));

    // Process each day's data - iterate through the original date range
    const weeklyData = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = dailyAttendance.get(dateStr);
      const justification = justifications.find(j => 
        j.date === dateStr
      );
      
      console.log(`[getWeeklyAttendance] Processing day ${dateStr}:`, {
        dayData: dayData ? `Found ${dayData.records.length} records` : 'No records',
        justification: justification ? 'Found justification' : 'No justification',
        availableDates: Array.from(dailyAttendance.keys())
      });

      let checkInTime = null;
      let checkOutTime = null;
      let totalHours = null;

      if (dayData) {
        const checkInRecord = dayData.records.find((r: any) => r.type === 'check_in');
        const checkOutRecord = dayData.records.find((r: any) => r.type === 'check_out');
        
        if (checkInRecord) {
          const timestamp = checkInRecord.timestamp instanceof Date ? checkInRecord.timestamp : new Date(checkInRecord.timestamp);
          checkInTime = timestamp.toLocaleTimeString('ca-ES', {
            hour: '2-digit',
            minute: '2-digit'
          });
          console.log(`[getWeeklyAttendance] Check-in found:`, { timestamp, checkInTime });
        }
        
        if (checkOutRecord) {
          const timestamp = checkOutRecord.timestamp instanceof Date ? checkOutRecord.timestamp : new Date(checkOutRecord.timestamp);
          checkOutTime = timestamp.toLocaleTimeString('ca-ES', {
            hour: '2-digit', 
            minute: '2-digit'
          });
          console.log(`[getWeeklyAttendance] Check-out found:`, { timestamp, checkOutTime });
        }

        if (checkInRecord && checkOutRecord) {
          const checkInTimestamp = checkInRecord.timestamp instanceof Date ? checkInRecord.timestamp : new Date(checkInRecord.timestamp);
          const checkOutTimestamp = checkOutRecord.timestamp instanceof Date ? checkOutRecord.timestamp : new Date(checkOutRecord.timestamp);
          const diff = checkOutTimestamp.getTime() - checkInTimestamp.getTime();
          totalHours = Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);

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

    console.log(`[getWeeklyAttendance] Returning weekly data:`, weeklyData);
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
  async getAutomatedAlertSettings(institutionId: string | null): Promise<any> {
    const alertSettings = await db
      .select()
      .from(settings)
      .where(
        and(
          institutionId === null 
            ? sql`${settings.institutionId} IS NULL`
            : eq(settings.institutionId, institutionId),
          eq(settings.key, 'automated_alerts')
        )
      )
      .limit(1);

    if (alertSettings.length === 0) {
      return null;
    }

    // Parse JSON string from database
    const value = alertSettings[0].value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.error('Error parsing automated alert settings JSON:', e);
        return null;
      }
    }
    
    return value;
  }

  async updateAutomatedAlertSettings(institutionId: string | null, alertSettings: any): Promise<any> {
    const existingSettings = await db
      .select()
      .from(settings)
      .where(
        and(
          institutionId === null 
            ? sql`${settings.institutionId} IS NULL`
            : eq(settings.institutionId, institutionId),
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
          id: sql`gen_random_uuid()`,
          institutionId: institutionId as string,
          key: 'automated_alerts',
          value: alertSettings,
          updatedAt: new Date(),
        })
        .returning();
      return created.value;
    }
  }

  async sendTestAlert(institutionId: string | null): Promise<void> {
    // Get email settings first
    const emailSettings = await this.getEmailSettings(institutionId);
    if (!emailSettings || !emailSettings.senderEmail) {
      throw new Error("Email configuration not found. Please configure email settings first.");
    }

    // Get alert settings
    const alertSettings = await this.getAutomatedAlertSettings(institutionId);
    console.log('Alert settings for test:', alertSettings);
    
    if (!alertSettings) {
      throw new Error("No alert settings configured.");
    }
    
    // Now alertSettings is already parsed as an object
    const recipientEmails = alertSettings.recipientEmails || [];
    
    if (!recipientEmails || recipientEmails.length === 0) {
      throw new Error("No recipients configured for alerts.");
    }

    // Get institution info
    const institution = institutionId ? await this.getInstitution(institutionId) : null;
    const centerName = institution?.name || "Sistema Global";

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
    console.log(`Test alert sent to: ${recipientEmails.join(', ')}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body preview: ${body.substring(0, 100)}...`);
    
    console.log('Test alert sent successfully to:', recipientEmails);
    // Return void as expected by the function signature
    
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
  // Weekly schedule methods
  async getWeeklySchedule(userId: string, weekStart?: string) {
    try {
      // Get user's employee record
      const user = await this.getUser(userId);
      if (!user) throw new Error('User not found');

      // Find employee by email
      const [employee] = await db.select()
        .from(employees)
        .where(eq(employees.email, user.email!))
        .limit(1);

      if (!employee) {
        console.log('WeeklySchedule API - No employee found for user:', user.email);
        return []; // Return empty if no employee record
      }

      // Get current academic year for the institution
      const currentDate = weekStart ? new Date(weekStart) : new Date();
      const [currentAcademicYear] = await db.select()
        .from(academicYears)
        .where(
          and(
            eq(academicYears.institutionId, employee.institutionId),
            lte(academicYears.startDate, currentDate),
            gte(academicYears.endDate, currentDate)
          )
        )
        .limit(1);

      if (!currentAcademicYear) {
        console.log('WeeklySchedule API - No active academic year found for date:', currentDate.toISOString());
        console.log('WeeklySchedule API - Institution:', employee.institutionId);
        
        // Get all academic years for debugging
        const allAcademicYears = await db.select()
          .from(academicYears)
          .where(eq(academicYears.institutionId, employee.institutionId));
        console.log('WeeklySchedule API - Available academic years:', JSON.stringify(allAcademicYears, null, 2));
        
        return []; // Return empty if no active academic year
      }

      console.log('WeeklySchedule API - Using academic year:', currentAcademicYear.name, currentAcademicYear.id);

      // Get weekly schedule from Untis data for the active academic year
      const schedule = await db.select({
        id: weeklySchedule.id,
        dayOfWeek: weeklySchedule.dayOfWeek,
        hourPeriod: weeklySchedule.hourPeriod,
        subjectCode: weeklySchedule.subjectCode,
        subjectName: weeklySchedule.subjectName,
        groupCode: weeklySchedule.groupCode,
        classroomCode: weeklySchedule.classroomCode,
        isLectiveHour: weeklySchedule.isLectiveHour
      })
      .from(weeklySchedule)
      .where(
        and(
          eq(weeklySchedule.employeeId, employee.id),
          eq(weeklySchedule.academicYearId, currentAcademicYear.id)
        )
      );

      console.log(`WeeklySchedule API - Found ${schedule.length} sessions for employee ${employee.id} (${user.email}) in academic year ${currentAcademicYear.name}`);
      if (schedule.length > 0) {
        console.log('WeeklySchedule API - First session:', JSON.stringify(schedule[0], null, 2));
      } else {
        console.log('WeeklySchedule API - No sessions found, checking employee data...');
        console.log('WeeklySchedule API - Employee found:', JSON.stringify(employee, null, 2));
        console.log('WeeklySchedule API - Academic year used:', JSON.stringify(currentAcademicYear, null, 2));
      }
      
      return schedule;
    } catch (error) {
      console.error('GET_WEEKLY_SCHEDULE_ERROR', error);
      throw error;
    }
  }

  // Communications methods

  async createCommunication(communicationData: any) {
    try {
      console.log('CREATE_COMMUNICATION: Creating with data:', communicationData);
      
      // Direct SQL insert using correct column names from schema
      const result = await db.execute(sql`
        INSERT INTO communications (
          id, institution_id, sender_id, recipient_id, message_type,
          subject, message, status, priority, email_sent, created_at, updated_at
        ) VALUES (
          ${communicationData.id}, ${communicationData.institutionId}, 
          ${communicationData.senderId}, ${communicationData.recipientId},
          ${communicationData.message_type}, ${communicationData.subject},
          ${communicationData.content}, ${communicationData.status},
          ${communicationData.priority}, ${communicationData.email_sent},
          NOW(), NOW()
        ) RETURNING *
      `);

      console.log('CREATE_COMMUNICATION: Successfully created');
      return result.rows[0] || communicationData;
    } catch (error) {
      console.error('CREATE_COMMUNICATION_ERROR', error);
      throw error;
    }
  }

  async markCommunicationAsRead(communicationId: string, userId: string) {
    try {
      const readTime = new Date();
      const [communication] = await db.update(communications)
        .set({
          status: 'read',
          readAt: readTime
        })
        .where(and(
          eq(communications.id, communicationId),
          eq(communications.recipientId, userId)
        ))
        .returning();

      // Add audit trail
      if (communication) {
        await db.insert(communicationAuditLog)
          .values({
            communicationId: communication.id,
            userId: userId,
            action: 'read',
            metadata: { readAt: readTime.toISOString() }
          });
      }

      return communication;
    } catch (error) {
      console.error('MARK_COMMUNICATION_READ_ERROR', error);
      throw error;
    }
  }

  async deleteCommunication(communicationId: string, userId: string) {
    try {
      const deleteTime = new Date();
      const [communication] = await db.update(communications)
        .set({
          deletedByUserAt: deleteTime
        })
        .where(and(
          eq(communications.id, communicationId),
          or(
            eq(communications.senderId, userId),
            eq(communications.recipientId, userId)
          )
        ))
        .returning();

      // Add audit trail
      if (communication) {
        await db.insert(communicationAuditLog)
          .values({
            communicationId: communication.id,
            userId: userId,
            action: 'deleted',
            metadata: { deletedAt: deleteTime.toISOString() }
          });
      }

      return communication;
    } catch (error) {
      console.error('DELETE_COMMUNICATION_ERROR', error);
      throw error;
    }
  }

  async getCommunicationById(communicationId: string, userId: string) {
    try {
      const [communication] = await db.select({
        id: communications.id,
        institutionId: communications.institutionId,
        senderId: communications.senderId,
        recipientId: communications.recipientId,
        messageType: communications.messageType,
        subject: communications.subject,
        message: communications.message,
        status: communications.status,
        priority: communications.priority,
        emailSent: communications.emailSent,
        emailSentAt: communications.emailSentAt,
        readAt: communications.readAt,
        deliveredAt: communications.deliveredAt,
        deletedByUserAt: communications.deletedByUserAt,
        createdAt: communications.createdAt,
        updatedAt: communications.updatedAt,
        sender: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        },
        recipient: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        }
      })
      .from(communications)
      .leftJoin(users, eq(communications.senderId, users.id))
      .leftJoin(users, eq(communications.recipientId, users.id))
      .where(and(
        eq(communications.id, communicationId),
        or(
          eq(communications.senderId, userId),
          eq(communications.recipientId, userId)
        ),
        isNull(communications.deletedByUserAt)
      ));

      return communication;
    } catch (error) {
      console.error('GET_COMMUNICATION_BY_ID_ERROR', error);
      throw error;
    }
  }

  async getCommunicationAttachments(communicationId: string) {
    try {
      const attachments = await db.select()
        .from(communicationAttachments)
        .where(eq(communicationAttachments.communicationId, communicationId));

      return attachments;
    } catch (error) {
      console.error('GET_COMMUNICATION_ATTACHMENTS_ERROR', error);
      throw error;
    }
  }

  async addCommunicationAttachment(attachmentData: InsertCommunicationAttachment) {
    try {
      const [attachment] = await db.insert(communicationAttachments)
        .values(attachmentData)
        .returning();

      return attachment;
    } catch (error) {
      console.error('ADD_COMMUNICATION_ATTACHMENT_ERROR', error);
      throw error;
    }
  }

  async updateCommunication(communicationId: string, updateData: Partial<InsertCommunication>) {
    try {
      const [communication] = await db.update(communications)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(communications.id, communicationId))
        .returning();

      return communication;
    } catch (error) {
      console.error('UPDATE_COMMUNICATION_ERROR', error);
      throw error;
    }
  }

  async getCommunications(userId: string, filter?: string) {
    try {
      console.log('GET_COMMUNICATIONS: Fetching for user:', userId, 'filter:', filter);
      
      let whereClause = sql`(c.sender_id = ${userId} OR c.recipient_id = ${userId}) AND c.deleted_by_user_at IS NULL`;
      
      if (filter === 'sent') {
        whereClause = sql`c.sender_id = ${userId} AND c.deleted_by_user_at IS NULL`;
      } else if (filter === 'inbox') {
        whereClause = sql`c.recipient_id = ${userId} AND c.deleted_by_user_at IS NULL`;
      } else if (filter === 'unread') {
        whereClause = sql`c.recipient_id = ${userId} AND c.read_at IS NULL AND c.deleted_by_user_at IS NULL`;
      }
      
      // Enhanced SQL query with proper user joins and filtering
      const result = await db.execute(sql`
        SELECT 
          c.id,
          c.institution_id as "institutionId",
          c.sender_id as "senderId", 
          c.recipient_id as "recipientId",
          c.message_type as "messageType",
          c.subject,
          c.message,
          c.status,
          c.priority,
          c.email_sent as "emailSent",
          c.email_sent_at as "emailSentAt",
          c.read_at as "readAt",
          c.delivered_at as "deliveredAt",
          c.deleted_by_user_at as "deletedByUserAt",
          c.created_at as "createdAt",
          c.updated_at as "updatedAt",
          COALESCE(s.first_name, 'Sistema') as "senderFirstName",
          COALESCE(s.last_name, 'EduPresència') as "senderLastName", 
          COALESCE(s.email, 'sistema@bitacola.edu') as "senderEmail",
          COALESCE(r.first_name, 'Usuari') as "recipientFirstName",
          COALESCE(r.last_name, 'Centre') as "recipientLastName",
          COALESCE(r.email, 'usuari@bitacola.edu') as "recipientEmail"
        FROM communications c
        LEFT JOIN users s ON c.sender_id = s.id
        LEFT JOIN users r ON c.recipient_id = r.id
        WHERE ${whereClause}
        ORDER BY c.created_at DESC
      `);

      console.log('GET_COMMUNICATIONS: Found', result.rows.length, 'communications');
      return result.rows;
    } catch (error) {
      console.error('GET_COMMUNICATIONS_ERROR', error);
      throw error;
    }
  }

  // Password change method
  async changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const user = await this.getUser(userId);
      if (!user) throw new Error('User not found');

      // Verify current password
      const bcrypt = await import('bcrypt');
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash!);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await db.update(users)
        .set({ passwordHash: hashedNewPassword })
        .where(eq(users.id, userId));

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('CHANGE_PASSWORD_ERROR', error);
      throw error;
    }
  }

  // Get users by institution for communications
  async getUsersByInstitution(institutionId: string) {
    try {
      const institutionUsers = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role
      })
      .from(users)
      .where(eq(users.institutionId, institutionId));

      return institutionUsers;
    } catch (error) {
      console.error('GET_USERS_BY_INSTITUTION_ERROR', error);
      throw error;
    }
  }

  // Generate weekly schedule from Untis sessions (for import process)
  async generateWeeklyScheduleFromUntis(institutionId: string, academicYearId: string) {
    try {
      // Clear existing weekly schedule for this academic year
      await db.delete(weeklySchedule)
        .where(and(
          eq(weeklySchedule.institutionId, institutionId),
          eq(weeklySchedule.academicYearId, academicYearId)
        ));

      // Generate weekly schedule directly from Untis sessions using SQL for better performance
      const result = await db.execute(sql`
        INSERT INTO weekly_schedule (id, employee_id, institution_id, academic_year_id, day_of_week, hour_period, subject_code, subject_name, group_code, classroom_code, is_lective_hour, created_at, updated_at)
        SELECT 
          gen_random_uuid(),
          uss.employee_id,
          uss.institution_id,
          uss.academic_year_id,
          uss.day_of_week,
          uss.hour_period,
          uss.subject_code,
          uss.subject_code,
          uss.group_code,
          uss.classroom_code,
          true,
          NOW(),
          NOW()
        FROM untis_schedule_sessions uss
        WHERE uss.institution_id = ${institutionId}
        AND uss.academic_year_id = ${academicYearId}
        AND uss.employee_id IS NOT NULL
      `);

      const insertedCount = result.rowCount || 0;
      console.log('WEEKLY_SCHEDULE_GENERATED', `Generated ${insertedCount} weekly schedule entries from Untis data`);
      return insertedCount;
    } catch (error) {
      console.error('GENERATE_WEEKLY_SCHEDULE_ERROR', error);
      throw error;
    }
  }

  // Reports functionality
  async getAttendanceOverview(institutionId: string, startDate?: Date, endDate?: Date): Promise<{
    totalEmployees: number;
    attendanceRate: number;
    averageHoursPerDay: number;
    totalLatesThisMonth: number;
    totalAbsencesThisMonth: number;
  }> {
    try {
      const now = new Date();
      const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEndDate = endDate || now;

      // Get total employees in institution
      const allEmployees = await db
        .select({ count: count() })
        .from(employees)
        .where(eq(employees.institutionId, institutionId));
      
      const totalEmployees = allEmployees[0]?.count || 0;

      if (totalEmployees === 0) {
        return {
          totalEmployees: 0,
          attendanceRate: 0,
          averageHoursPerDay: 0,
          totalLatesThisMonth: 0,
          totalAbsencesThisMonth: 0,
        };
      }

      // Get attendance records for the period - SIMPLIFIED VERSION
      const attendanceData = await db
        .select({
          employeeId: attendanceRecords.employeeId,
          timestamp: attendanceRecords.timestamp,
          type: attendanceRecords.type,
        })
        .from(attendanceRecords)
        .innerJoin(employees, eq(attendanceRecords.employeeId, employees.id))
        .where(eq(employees.institutionId, institutionId));

      console.log(`DEBUG: Found ${attendanceData.length} attendance records for institution ${institutionId}`);

      // Calculate attendance statistics
      const employeeAttendance = new Map<string, { dates: Set<string>; totalHours: number; lateCount: number }>();
      
      for (const record of attendanceData) {
        // Simple date formatting without date-fns
        const dateStr = record.timestamp.toISOString().split('T')[0];
        const employeeId = record.employeeId;
        
        if (!employeeAttendance.has(employeeId)) {
          employeeAttendance.set(employeeId, { 
            dates: new Set(), 
            totalHours: 0, 
            lateCount: 0 
          });
        }
        
        const empData = employeeAttendance.get(employeeId)!;
        empData.dates.add(dateStr);
        
        // Check if late (after 8:30)
        const hour = record.timestamp.getHours();
        const minute = record.timestamp.getMinutes();
        if (record.type === 'check_in' && (hour > 8 || (hour === 8 && minute > 30))) {
          empData.lateCount++;
        }
      }

      // Get absences for the period - SIMPLIFIED VERSION
      const absenceData = await db
        .select({ employeeId: absences.employeeId })
        .from(absences)
        .innerJoin(employees, eq(absences.employeeId, employees.id))
        .where(eq(employees.institutionId, institutionId));

      console.log(`DEBUG: Found ${absenceData.length} absences for institution ${institutionId}`);

      // Calculate metrics
      const workingDays = Math.ceil((defaultEndDate.getTime() - defaultStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const expectedAttendanceDays = totalEmployees * Math.max(1, workingDays);
      const actualAttendanceDays = Array.from(employeeAttendance.values()).reduce((sum, emp) => sum + emp.dates.size, 0);
      
      const attendanceRate = expectedAttendanceDays > 0 ? (actualAttendanceDays / expectedAttendanceDays) * 100 : 0;
      const totalLatesThisMonth = Array.from(employeeAttendance.values()).reduce((sum, emp) => sum + emp.lateCount, 0);
      const averageHoursPerDay = totalEmployees > 0 ? (actualAttendanceDays * 8) / Math.max(totalEmployees, 1) : 0;

      return {
        totalEmployees,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        averageHoursPerDay: Math.round(averageHoursPerDay * 10) / 10,
        totalLatesThisMonth,
        totalAbsencesThisMonth: absenceData.length,
      };

    } catch (error) {
      console.error("Error getting attendance overview:", error);
      throw error;
    }
  }

  // Employee-specific attendance overview (for employee role)
  async getEmployeeAttendanceOverview(userId: string, startDate?: Date, endDate?: Date): Promise<{
    totalEmployees: number;
    attendanceRate: number;
    averageHoursPerDay: number;
    totalLatesThisMonth: number;
    totalAbsencesThisMonth: number;
  }> {
    try {
      const now = new Date();
      const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEndDate = endDate || now;

      // Get employee record for this user
      const employee = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, userId))
        .limit(1);

      if (employee.length === 0) {
        return {
          totalEmployees: 0,
          attendanceRate: 0,
          averageHoursPerDay: 0,
          totalLatesThisMonth: 0,
          totalAbsencesThisMonth: 0,
        };
      }

      const employeeRecord = employee[0];
      console.log(`DEBUG: Found employee ${employeeRecord.fullName} for user ${userId}`);

      // Get attendance records for this specific employee
      const attendanceData = await db
        .select({
          timestamp: attendanceRecords.timestamp,
          type: attendanceRecords.type,
        })
        .from(attendanceRecords)
        .where(eq(attendanceRecords.employeeId, employeeRecord.id));

      console.log(`DEBUG: Found ${attendanceData.length} attendance records for employee ${employeeRecord.id}`);

      // Calculate attendance for this employee only
      const workingDays = Math.ceil((defaultEndDate.getTime() - defaultStartDate.getTime()) / (1000 * 60 * 60 * 24));
      const attendanceDays = new Set<string>();
      let lateCount = 0;

      for (const record of attendanceData) {
        const dateStr = record.timestamp.toISOString().split('T')[0];
        attendanceDays.add(dateStr);
        
        // Check if late (after 8:30)
        const hour = record.timestamp.getHours();
        const minute = record.timestamp.getMinutes();
        if (record.type === 'check_in' && (hour > 8 || (hour === 8 && minute > 30))) {
          lateCount++;
        }
      }

      // Get absences for this employee
      const absenceData = await db
        .select()
        .from(absences)
        .where(eq(absences.employeeId, employeeRecord.id));

      console.log(`DEBUG: Found ${absenceData.length} absences for employee ${employeeRecord.id}`);

      const attendanceRate = workingDays > 0 ? (attendanceDays.size / Math.max(workingDays, 1)) * 100 : 0;
      const averageHoursPerDay = attendanceDays.size > 0 ? (attendanceDays.size * 8) / Math.max(attendanceDays.size, 1) : 0;

      return {
        totalEmployees: 1, // For employee view, always 1
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        averageHoursPerDay: Math.round(averageHoursPerDay * 10) / 10,
        totalLatesThisMonth: lateCount,
        totalAbsencesThisMonth: absenceData.length,
      };

    } catch (error) {
      console.error("Error getting employee attendance overview:", error);
      throw error;
    }
  }

  // Employee-specific monthly trends
  async getEmployeeMonthlyTrends(userId: string, months: number = 12): Promise<Array<{
    month: string;
    attendanceRate: number;
    totalHours: number;
    lateCount: number;
    absenceCount: number;
  }>> {
    try {
      const results = [];
      const now = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthOverview = await this.getEmployeeAttendanceOverview(userId, startDate, endDate);
        
        results.push({
          month: monthDate.toISOString().substring(0, 7),
          attendanceRate: monthOverview.attendanceRate,
          totalHours: monthOverview.averageHoursPerDay * 20, // Approximate working days
          lateCount: monthOverview.totalLatesThisMonth,
          absenceCount: monthOverview.totalAbsencesThisMonth,
        });
      }
      
      return results;
    } catch (error) {
      console.error("Error getting employee monthly trends:", error);
      throw error;
    }
  }

  // Employee detailed attendance records
  async getEmployeeDetailedAttendance(userId: string, startDate?: Date, endDate?: Date): Promise<Array<{
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    hoursWorked: number;
    status: 'on_time' | 'late' | 'absent' | 'incomplete';
    lateMinutes: number;
  }>> {
    try {
      const now = new Date();
      const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEndDate = endDate || now;

      // Get employee record
      const employee = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, userId))
        .limit(1);

      if (employee.length === 0) return [];

      const employeeRecord = employee[0];

      // Get all attendance records for the period
      const attendanceData = await db
        .select({
          timestamp: attendanceRecords.timestamp,
          type: attendanceRecords.type,
        })
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.employeeId, employeeRecord.id),
            gte(attendanceRecords.timestamp, defaultStartDate),
            lte(attendanceRecords.timestamp, defaultEndDate)
          )
        )
        .orderBy(attendanceRecords.timestamp);

      // Process by date
      const results = [];
      const currentDate = new Date(defaultStartDate);
      
      while (currentDate <= defaultEndDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Get records for this date
        const dayRecords = attendanceData.filter(record => 
          record.timestamp.toISOString().split('T')[0] === dateStr
        );
        
        const checkInRecord = dayRecords.find(r => r.type === 'check_in');
        const checkOutRecord = dayRecords.find(r => r.type === 'check_out');
        
        let status: 'on_time' | 'late' | 'absent' | 'incomplete' = 'absent';
        let lateMinutes = 0;
        let hoursWorked = 0;
        
        if (checkInRecord) {
          const checkInTime = checkInRecord.timestamp;
          const hour = checkInTime.getHours();
          const minute = checkInTime.getMinutes();
          
          // Check if late (after 8:30)
          if (hour > 8 || (hour === 8 && minute > 30)) {
            const expectedTime = new Date(checkInTime);
            expectedTime.setHours(8, 30, 0, 0);
            lateMinutes = Math.round((checkInTime.getTime() - expectedTime.getTime()) / (1000 * 60));
            status = 'late';
          } else {
            status = 'on_time';
          }
          
          // Calculate hours worked if both check-in and check-out exist
          if (checkOutRecord) {
            hoursWorked = (checkOutRecord.timestamp.getTime() - checkInRecord.timestamp.getTime()) / (1000 * 60 * 60);
          } else {
            status = 'incomplete';
          }
        }
        
        results.push({
          date: dateStr,
          checkIn: checkInRecord ? checkInRecord.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null,
          checkOut: checkOutRecord ? checkOutRecord.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null,
          hoursWorked: Math.round(hoursWorked * 100) / 100,
          status,
          lateMinutes,
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return results;
    } catch (error) {
      console.error("Error getting employee detailed attendance:", error);
      throw error;
    }
  }

  // Institution detailed attendance (for admins)
  async getInstitutionDetailedAttendance(institutionId: string, startDate?: Date, endDate?: Date): Promise<Array<{
    employeeName: string;
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    hoursWorked: number;
    status: 'on_time' | 'late' | 'absent' | 'incomplete';
    lateMinutes: number;
  }>> {
    try {
      const now = new Date();
      const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEndDate = endDate || now;

      // Get all employees in institution
      const employeesList = await db
        .select()
        .from(employees)
        .where(eq(employees.institutionId, institutionId));

      const results = [];
      
      for (const employee of employeesList) {
        // Get attendance records for this employee
        const attendanceData = await db
          .select({
            timestamp: attendanceRecords.timestamp,
            type: attendanceRecords.type,
          })
          .from(attendanceRecords)
          .where(
            and(
              eq(attendanceRecords.employeeId, employee.id),
              gte(attendanceRecords.timestamp, defaultStartDate),
              lte(attendanceRecords.timestamp, defaultEndDate)
            )
          )
          .orderBy(attendanceRecords.timestamp);

        // Process by date for this employee
        const currentDate = new Date(defaultStartDate);
        
        while (currentDate <= defaultEndDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          const dayRecords = attendanceData.filter(record => 
            record.timestamp.toISOString().split('T')[0] === dateStr
          );
          
          const checkInRecord = dayRecords.find(r => r.type === 'check_in');
          const checkOutRecord = dayRecords.find(r => r.type === 'check_out');
          
          let status: 'on_time' | 'late' | 'absent' | 'incomplete' = 'absent';
          let lateMinutes = 0;
          let hoursWorked = 0;
          
          if (checkInRecord) {
            const checkInTime = checkInRecord.timestamp;
            const hour = checkInTime.getHours();
            const minute = checkInTime.getMinutes();
            
            if (hour > 8 || (hour === 8 && minute > 30)) {
              const expectedTime = new Date(checkInTime);
              expectedTime.setHours(8, 30, 0, 0);
              lateMinutes = Math.round((checkInTime.getTime() - expectedTime.getTime()) / (1000 * 60));
              status = 'late';
            } else {
              status = 'on_time';
            }
            
            if (checkOutRecord) {
              hoursWorked = (checkOutRecord.timestamp.getTime() - checkInRecord.timestamp.getTime()) / (1000 * 60 * 60);
            } else {
              status = 'incomplete';
            }
          }
          
          results.push({
            employeeName: employee.fullName,
            date: dateStr,
            checkIn: checkInRecord ? checkInRecord.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null,
            checkOut: checkOutRecord ? checkOutRecord.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : null,
            hoursWorked: Math.round(hoursWorked * 100) / 100,
            status,
            lateMinutes,
          });
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      return results.sort((a, b) => b.date.localeCompare(a.date)); // Most recent first
    } catch (error) {
      console.error("Error getting institution detailed attendance:", error);
      throw error;
    }
  }

  async getDepartmentComparison(institutionId: string, startDate?: Date, endDate?: Date): Promise<Array<{
    departmentName: string;
    totalEmployees: number;
    attendanceRate: number;
    averageHours: number;
    lateCount: number;
  }>> {
    try {
      const now = new Date();
      const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEndDate = endDate || now;

      // Get departments with employee counts
      const departmentData = await db
        .select({
          departmentId: employees.departmentId,
          departmentName: departments.name,
          employeeId: employees.id,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(eq(employees.institutionId, institutionId));

      if (departmentData.length === 0) {
        return [];
      }

      // Group by department
      const deptMap = new Map<string, { name: string; employeeIds: Set<string> }>();
      
      for (const emp of departmentData) {
        const deptId = emp.departmentId || 'sin-departamento';
        const deptName = emp.departmentName || 'Sin departamento';
        
        if (!deptMap.has(deptId)) {
          deptMap.set(deptId, { name: deptName, employeeIds: new Set() });
        }
        deptMap.get(deptId)!.employeeIds.add(emp.employeeId);
      }

      // Get attendance data for all employees
      const attendanceData = await db
        .select({
          employeeId: attendanceRecords.employeeId,
          timestamp: attendanceRecords.timestamp,
          type: attendanceRecords.type,
        })
        .from(attendanceRecords)
        .innerJoin(employees, eq(attendanceRecords.employeeId, employees.id))
        .where(
          and(
            eq(employees.institutionId, institutionId),
            gte(attendanceRecords.timestamp, defaultStartDate),
            lte(attendanceRecords.timestamp, defaultEndDate)
          )
        );

      // Calculate department statistics
      const results = [];
      
      for (const [deptId, deptInfo] of Array.from(deptMap.entries())) {
        const employeeAttendance = new Map<string, { dates: Set<string>; lateCount: number }>();
        
        // Initialize for all employees in department
        for (const empId of deptInfo.employeeIds) {
          employeeAttendance.set(empId, { dates: new Set(), lateCount: 0 });
        }
        
        // Process attendance records
        for (const record of attendanceData) {
          if (deptInfo.employeeIds.has(record.employeeId)) {
            const dateStr = record.timestamp.toISOString().split('T')[0];
            const empData = employeeAttendance.get(record.employeeId)!;
            empData.dates.add(dateStr);
            
            // Check if late
            const hour = record.timestamp.getHours();
            const minute = record.timestamp.getMinutes();
            if (record.type === 'check_in' && (hour > 8 || (hour === 8 && minute > 30))) {
              empData.lateCount++;
            }
          }
        }

        // Calculate metrics
        const totalEmployees = deptInfo.employeeIds.size;
        const workingDays = Math.ceil((defaultEndDate.getTime() - defaultStartDate.getTime()) / (1000 * 60 * 60 * 24));
        const expectedAttendanceDays = totalEmployees * Math.max(1, workingDays);
        const actualAttendanceDays = Array.from(employeeAttendance.values()).reduce((sum, emp) => sum + emp.dates.size, 0);
        const totalLates = Array.from(employeeAttendance.values()).reduce((sum, emp) => sum + emp.lateCount, 0);
        
        const attendanceRate = expectedAttendanceDays > 0 ? (actualAttendanceDays / expectedAttendanceDays) * 100 : 0;
        const averageHours = totalEmployees > 0 ? (actualAttendanceDays * 8) / Math.max(totalEmployees, 1) : 0;

        results.push({
          departmentName: deptInfo.name,
          totalEmployees,
          attendanceRate: Math.round(attendanceRate * 10) / 10,
          averageHours: Math.round(averageHours * 10) / 10,
          lateCount: totalLates,
        });
      }

      return results.sort((a, b) => b.attendanceRate - a.attendanceRate);

    } catch (error) {
      console.error("Error getting department comparison:", error);
      throw error;
    }
  }

  async getMonthlyTrends(institutionId: string, months: number = 12): Promise<Array<{
    month: string;
    attendanceRate: number;
    totalHours: number;
    lateCount: number;
    absenceCount: number;
  }>> {
    try {
      const results = [];
      const now = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const monthOverview = await this.getAttendanceOverview(institutionId, startDate, endDate);
        
        results.push({
          month: monthDate.toISOString().substring(0, 7),
          attendanceRate: monthOverview.attendanceRate,
          totalHours: monthOverview.averageHoursPerDay * monthOverview.totalEmployees,
          lateCount: monthOverview.totalLatesThisMonth,
          absenceCount: monthOverview.totalAbsencesThisMonth,
        });
      }
      
      return results;

    } catch (error) {
      console.error("Error getting monthly trends:", error);
      throw error;
    }
  }

  async getAttendanceRatesByPeriod(institutionId: string, startDate: Date, endDate: Date): Promise<Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
    attendanceRate: number;
  }>> {
    try {
      // Get all employees in institution
      const allEmployees = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.institutionId, institutionId));
      
      const totalEmployees = allEmployees.length;
      if (totalEmployees === 0) return [];

      // Get attendance records for the period
      const attendanceData = await db
        .select({
          employeeId: attendanceRecords.employeeId,
          timestamp: attendanceRecords.timestamp,
          type: attendanceRecords.type,
        })
        .from(attendanceRecords)
        .innerJoin(employees, eq(attendanceRecords.employeeId, employees.id))
        .where(
          and(
            eq(employees.institutionId, institutionId),
            gte(attendanceRecords.timestamp, startDate),
            lte(attendanceRecords.timestamp, endDate)
          )
        );

      // Get absences for the period
      const absenceData = await db
        .select({
          employeeId: absences.employeeId,
          date: absences.startDate,
        })
        .from(absences)
        .innerJoin(employees, eq(absences.employeeId, employees.id))
        .where(
          and(
            eq(employees.institutionId, institutionId),
            gte(absences.startDate, startDate),
            lte(absences.startDate, endDate)
          )
        );

      // Process by date
      const results = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Get attendance for this date
        const dayAttendance = attendanceData.filter(record => 
          record.timestamp.toISOString().split('T')[0] === dateStr
        );
        
        const dayAbsences = absenceData.filter(absence => 
          absence.date.toISOString().split('T')[0] === dateStr
        );
        
        // Count unique employees who checked in
        const presentEmployees = new Set(
          dayAttendance
            .filter(record => record.type === 'check_in')
            .map(record => record.employeeId)
        );
        
        // Count late arrivals (after 8:30)
        const lateEmployees = dayAttendance.filter(record => 
          record.type === 'check_in' && 
          (record.timestamp.getHours() > 8 || 
           (record.timestamp.getHours() === 8 && record.timestamp.getMinutes() > 30))
        ).length;
        
        const present = presentEmployees.size;
        const absent = totalEmployees - present;
        const attendanceRate = totalEmployees > 0 ? (present / totalEmployees) * 100 : 0;
        
        results.push({
          date: dateStr,
          present,
          absent,
          late: lateEmployees,
          attendanceRate: Math.round(attendanceRate * 10) / 10,
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return results;

    } catch (error) {
      console.error("Error getting attendance rates by period:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
