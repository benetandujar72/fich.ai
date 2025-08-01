import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  date,
  time,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("employee"), // superadmin, admin, employee
  institutionId: varchar("institution_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Institutions/Centers
export const institutions = pgTable("institutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  address: text("address"),
  timezone: varchar("timezone").notNull().default("Europe/Barcelona"),
  defaultLanguage: varchar("default_language").notNull().default("ca"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Academic Years
export const academicYears = pgTable("academic_years", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  name: varchar("name").notNull(), // e.g., "2024-2025"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Departments
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Employee contract types
export const contractTypeEnum = pgEnum("contract_type", ["full_time", "part_time", "substitute"]);
export const employeeStatusEnum = pgEnum("employee_status", ["active", "inactive", "temporary_leave"]);

// Employees
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  institutionId: varchar("institution_id").notNull(),
  departmentId: varchar("department_id"),
  dni: varchar("dni").notNull(),
  fullName: varchar("full_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  contractType: contractTypeEnum("contract_type").notNull(),
  status: employeeStatusEnum("status").notNull().default("active"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employee schedules
export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 1-7 (Monday-Sunday)
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isLectiveTime: boolean("is_lective_time").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attendance records
export const attendanceTypeEnum = pgEnum("attendance_type", ["check_in", "check_out"]);
export const attendanceMethodEnum = pgEnum("attendance_method", ["web", "qr", "nfc", "manual"]);

export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  type: attendanceTypeEnum("type").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  method: attendanceMethodEnum("method").notNull().default("web"),
  location: text("location"), // For geolocation verification
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Absence types and reasons
export const absenceTypeEnum = pgEnum("absence_type", ["sick_leave", "personal", "vacation", "training", "other"]);
export const absenceStatusEnum = pgEnum("absence_status", ["pending", "approved", "rejected"]);

export const absences = pgTable("absences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  type: absenceTypeEnum("type").notNull(),
  status: absenceStatusEnum("status").notNull().default("pending"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  documentation: text("documentation"), // File path or URL
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Alerts
export const alertTypeEnum = pgEnum("alert_type", ["late_arrival", "absence", "missing_checkout", "substitute_needed"]);
export const alertStatusEnum = pgEnum("alert_status", ["active", "resolved", "dismissed"]);

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  type: alertTypeEnum("type").notNull(),
  status: alertStatusEnum("status").notNull().default("active"),
  title: varchar("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"), // Additional alert-specific data
  resolvedBy: varchar("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Substitute assignments
export const substituteAssignments = pgTable("substitute_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  absentEmployeeId: varchar("absent_employee_id").notNull(),
  substituteEmployeeId: varchar("substitute_employee_id").notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  room: varchar("room"),
  notes: text("notes"),
  isAutoAssigned: boolean("is_auto_assigned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Settings for alert thresholds and configurations
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  key: varchar("key").notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [users.institutionId],
    references: [institutions.id],
  }),
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
  }),
}));

export const institutionsRelations = relations(institutions, ({ many }) => ({
  users: many(users),
  employees: many(employees),
  departments: many(departments),
  academicYears: many(academicYears),
  settings: many(settings),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  institution: one(institutions, {
    fields: [employees.institutionId],
    references: [institutions.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  schedules: many(schedules),
  attendanceRecords: many(attendanceRecords),
  absences: many(absences),
  alerts: many(alerts),
  substituteAssignments: many(substituteAssignments, {
    relationName: "substitute",
  }),
  absentAssignments: many(substituteAssignments, {
    relationName: "absent",
  }),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [departments.institutionId],
    references: [institutions.id],
  }),
  employees: many(employees),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  employee: one(employees, {
    fields: [schedules.employeeId],
    references: [employees.id],
  }),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  employee: one(employees, {
    fields: [attendanceRecords.employeeId],
    references: [employees.id],
  }),
}));

export const absencesRelations = relations(absences, ({ one }) => ({
  employee: one(employees, {
    fields: [absences.employeeId],
    references: [employees.id],
  }),
  approver: one(users, {
    fields: [absences.approvedBy],
    references: [users.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  employee: one(employees, {
    fields: [alerts.employeeId],
    references: [employees.id],
  }),
  resolver: one(users, {
    fields: [alerts.resolvedBy],
    references: [users.id],
  }),
}));

export const substituteAssignmentsRelations = relations(substituteAssignments, ({ one }) => ({
  absentEmployee: one(employees, {
    fields: [substituteAssignments.absentEmployeeId],
    references: [employees.id],
    relationName: "absent",
  }),
  substituteEmployee: one(employees, {
    fields: [substituteAssignments.substituteEmployeeId],
    references: [employees.id],
    relationName: "substitute",
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  institution: one(institutions, {
    fields: [settings.institutionId],
    references: [institutions.id],
  }),
}));

// Insert schemas
export const insertInstitutionSchema = createInsertSchema(institutions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
});

export const insertAbsenceSchema = createInsertSchema(absences).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertSubstituteAssignmentSchema = createInsertSchema(substituteAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertAcademicYearSchema = createInsertSchema(academicYears).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type AcademicYear = typeof academicYears.$inferSelect;
export type InsertAcademicYear = z.infer<typeof insertAcademicYearSchema>;
export type Department = typeof departments.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type Absence = typeof absences.$inferSelect;
export type InsertAbsence = z.infer<typeof insertAbsenceSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type SubstituteAssignment = typeof substituteAssignments.$inferSelect;
export type InsertSubstituteAssignment = z.infer<typeof insertSubstituteAssignmentSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
