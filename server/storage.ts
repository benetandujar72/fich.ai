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
        employeeName: sql<string>`${employees.firstName} || ' ' || ${employees.lastName}`.as('employeeName'),
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
        hashedPassword,
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
          gte(absenceJustifications.date, startDate),
          lte(absenceJustifications.date, endDate)
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
        j.date.toISOString().split('T')[0] === dateStr
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
    const settings = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.institutionId, institutionId),
          eq(settings.key, 'automated_alerts')
        )
      )
      .limit(1);

    return settings.length > 0 ? settings[0].value : null;
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
          createdAt: new Date(),
          updatedAt: new Date(),
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
}

export const storage = new DatabaseStorage();
