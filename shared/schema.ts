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
  unique,
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
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
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

// Subjects/Materies (GP Untis compatible)
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  academicYearId: varchar("academic_year_id").notNull(),
  code: varchar("code").notNull(), // e.g., "ANG 1.1", "MATES 1"
  name: varchar("name").notNull(), // Full subject name
  shortName: varchar("short_name"),
  defaultClassroom: varchar("default_classroom"),
  department: varchar("department"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Classes/Groups (S1A, S1B, etc.) - GP Untis compatible
export const classGroups = pgTable("class_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  academicYearId: varchar("academic_year_id").notNull(),
  code: varchar("code").notNull(), // e.g., "S1A", "S2B"
  level: varchar("level").notNull(), // e.g., "1ESO", "2ESO"
  section: varchar("section").notNull(), // e.g., "A", "B"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Classrooms/Aules
export const classrooms = pgTable("classrooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  code: varchar("code").notNull(), // e.g., "111", "GYM", "PATI"
  name: varchar("name"), // Optional full name
  capacity: integer("capacity"),
  type: varchar("type"), // normal, gym, lab, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// GP Untis Schedule Sessions
export const untisScheduleSessions = pgTable("untis_schedule_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  academicYearId: varchar("academic_year_id").notNull(),
  sessionId: varchar("session_id"),
  classeId: varchar("classe_id"), // CLASSE field from CSV
  groupCode: varchar("group_code").notNull(), // GRUP field (S1A, S1B)
  teacherCode: varchar("teacher_code").notNull(), // DOCENT field
  subjectCode: varchar("subject_code").notNull(), // MATÈRIA field
  classroomCode: varchar("classroom_code"), // AULA field (can be empty)
  dayOfWeek: integer("day_of_week").notNull(), // DIA field (1-5)
  hourPeriod: integer("hour_period").notNull(), // HORA field
  employeeId: varchar("employee_id"), // Linked to employees table
  subjectId: varchar("subject_id"), // Linked to subjects table
  classGroupId: varchar("class_group_id"), // Linked to class_groups table
  classroomId: varchar("classroom_id"), // Linked to classrooms table
  importedAt: timestamp("imported_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employee schedules (simplified - derived from Untis data)
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

// Communications table removed - using newer definition below

// Weekly schedule view for employees (derived from Untis sessions)
export const weeklySchedule = pgTable("weekly_schedule", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  institutionId: varchar("institution_id").notNull(),
  academicYearId: varchar("academic_year_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 1-5 (Monday-Friday)
  hourPeriod: integer("hour_period").notNull(), // 1-8 typical class periods
  subjectCode: varchar("subject_code"),
  subjectName: varchar("subject_name"),
  groupCode: varchar("group_code"),
  classroomCode: varchar("classroom_code"),
  isLectiveHour: boolean("is_lective_hour").notNull().default(true), // true for teaching, false for non-teaching
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Settings for alert thresholds and configurations - Fixed unique constraint
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  key: varchar("key").notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  settingsUniqueInstitutionKey: unique("settings_institution_key_unique").on(table.institutionId, table.key),
}));

// SMTP Configuration table for CONFIG-010  
export const smtpConfigurations = pgTable("smtp_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  host: varchar("host").notNull(),
  port: integer("port").notNull(),
  username: varchar("username").notNull(),
  password: varchar("password").notNull(), // Should be encrypted
  isSecure: boolean("is_secure").notNull().default(true),
  fromEmail: varchar("from_email").notNull(),
  fromName: varchar("from_name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Risk Assessment table for CONFIG-009
export const riskAssessments = pgTable("risk_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  institutionId: varchar("institution_id").notNull(),
  riskLevel: varchar("risk_level").notNull(), // 'low', 'medium', 'high', 'critical'
  delayMinutes: integer("delay_minutes").notNull().default(0),
  absenceDays: integer("absence_days").notNull().default(0),
  lastCalculated: timestamp("last_calculated").notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  riskAssessmentUniqueEmployee: unique("risk_assessment_employee_unique").on(table.employeeId, table.institutionId),
}));

// Email configuration settings
export const emailSettings = pgTable("email_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull().unique(),
  smtpHost: varchar("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUser: varchar("smtp_user"),
  smtpPassword: varchar("smtp_password"),
  senderEmail: varchar("sender_email"),
  senderName: varchar("sender_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Absence justifications
export const absenceJustifications = pgTable("absence_justifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull(),
  date: date("date").notNull(),
  reason: text("reason").notNull(),
  adminResponse: text("admin_response"),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alert notifications log
export const alertNotifications = pgTable("alert_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  employeeId: varchar("employee_id").notNull(),
  type: varchar("type").notNull(), // delay_alert, accumulated_delay, manual_notification
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  delayMinutes: integer("delay_minutes").default(0),
  accumulatedMinutes: integer("accumulated_minutes").default(0),
  sentAt: timestamp("sent_at").defaultNow(),
  emailSent: boolean("email_sent").default(false),
});

// Network settings for attendance control - only allow attendance from specific networks
export const attendanceNetworkSettings = pgTable("attendance_network_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  allowedNetworks: text("allowed_networks").array().notNull().default(sql`'{}'`),
  requireNetworkValidation: boolean("require_network_validation").default(false),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueInstitution: unique().on(table.institutionId),
}));

// Communication message types
export const messageTypeEnum = pgEnum("message_type", [
  "alert",          // Alertas automáticas del sistema
  "notification",   // Notificaciones oficiales
  "communication",  // Comunicaciones entre usuarios
  "announcement",   // Comunicados generales
  "privacy_policy"  // Comunicaciones política de privacidad
]);

// Communication message status
export const messageStatusEnum = pgEnum("message_status", [
  "draft",          // Borrador
  "sent",           // Enviado
  "delivered",      // Entregado
  "read",           // Leído
  "deleted_by_user", // Eliminado por usuario (soft delete)
  "failed"          // Falló el envío
]);

// Main communications table
export const communications = pgTable("communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  senderId: varchar("sender_id").notNull(), // Usuario que envía
  recipientId: varchar("recipient_id").notNull(), // Usuario que recibe
  messageType: messageTypeEnum("message_type").notNull().default("communication"),
  subject: varchar("subject").notNull(),
  message: text("message").notNull(),
  status: messageStatusEnum("status").notNull().default("sent"),
  priority: varchar("priority").notNull().default("normal"), // low, normal, high, urgent
  
  // Email integration
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  
  // Tracking
  readAt: timestamp("read_at"),
  deliveredAt: timestamp("delivered_at"),
  deletedByUserAt: timestamp("deleted_by_user_at"),
  
  // Metadata for forensic tracking
  senderIpAddress: varchar("sender_ip_address"),
  userAgent: text("user_agent"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Communication attachments (PDFs, justificantes, etc.)
export const communicationAttachments = pgTable("communication_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communicationId: varchar("communication_id").notNull(),
  fileName: varchar("file_name").notNull(),
  originalFileName: varchar("original_file_name").notNull(),
  fileSize: integer("file_size").notNull(), // en bytes
  mimeType: varchar("mime_type").notNull(),
  objectPath: varchar("object_path").notNull(), // Path en object storage
  uploadedBy: varchar("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit log for forensic tracking of all communication actions
export const communicationAuditLog = pgTable("communication_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communicationId: varchar("communication_id").notNull(),
  userId: varchar("user_id").notNull(),
  action: varchar("action").notNull(), // created, sent, read, deleted, attempted_modification
  oldValues: jsonb("old_values"), // Valores anteriores para cambios
  newValues: jsonb("new_values"), // Valores nuevos para cambios
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"), // Información adicional para auditoría
  createdAt: timestamp("created_at").defaultNow(),
});

// Message templates for automated communications
export const messageTemplates = pgTable("message_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  name: varchar("name").notNull(),
  messageType: messageTypeEnum("message_type").notNull(),
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employee import templates and logs
export const employeeImportLogs = pgTable("employee_import_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  importedBy: varchar("imported_by").notNull(), // Admin user ID
  fileName: varchar("file_name").notNull(),
  totalRecords: integer("total_records").notNull(),
  successfulImports: integer("successful_imports").default(0),
  failedImports: integer("failed_imports").default(0),
  errors: jsonb("errors"), // Array of error objects
  status: varchar("status").notNull().default("processing"), // processing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Admin alert configurations
export const adminAlertConfigs = pgTable("admin_alert_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  alertType: varchar("alert_type").notNull(), // manual, scheduled, threshold
  recipients: text("recipients").array().notNull(), // Array of user IDs or 'all'
  subject: varchar("subject").notNull(),
  messageTemplate: text("message_template").notNull(),
  scheduleSettings: jsonb("schedule_settings"), // For scheduled alerts
  thresholdSettings: jsonb("threshold_settings"), // For threshold-based alerts
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Privacy policy requests tracking
export const privacyRequests = pgTable("privacy_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").notNull(),
  userId: varchar("user_id").notNull(), // Usuario que hace la solicitud
  requestType: varchar("request_type").notNull(), // access, rectification, deletion, portability
  description: text("description"),
  status: varchar("status").notNull().default("initiated"), // initiated, in_progress, resolved, rejected
  adminResponse: text("admin_response"),
  assignedTo: varchar("assigned_to"), // Admin user ID
  dueDate: timestamp("due_date"), // GDPR compliance deadlines
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weekly schedule templates for users (for the popup view)
export const userScheduleTemplates = pgTable("user_schedule_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  institutionId: varchar("institution_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 1=Monday, 7=Sunday
  startTime: varchar("start_time").notNull(), // HH:MM format
  endTime: varchar("end_time").notNull(), // HH:MM format
  breakStart: varchar("break_start"), // Optional break time
  breakEnd: varchar("break_end"), // Optional break time
  location: varchar("location"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserDay: unique().on(table.userId, table.dayOfWeek),
}));

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

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [subjects.institutionId],
    references: [institutions.id],
  }),
  academicYear: one(academicYears, {
    fields: [subjects.academicYearId],
    references: [academicYears.id],
  }),
  scheduleSessions: many(untisScheduleSessions),
}));

export const classGroupsRelations = relations(classGroups, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [classGroups.institutionId],
    references: [institutions.id],
  }),
  academicYear: one(academicYears, {
    fields: [classGroups.academicYearId],
    references: [academicYears.id],
  }),
  scheduleSessions: many(untisScheduleSessions),
}));

export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [classrooms.institutionId],
    references: [institutions.id],
  }),
  scheduleSessions: many(untisScheduleSessions),
}));

export const untisScheduleSessionsRelations = relations(untisScheduleSessions, ({ one }) => ({
  institution: one(institutions, {
    fields: [untisScheduleSessions.institutionId],
    references: [institutions.id],
  }),
  academicYear: one(academicYears, {
    fields: [untisScheduleSessions.academicYearId],
    references: [academicYears.id],
  }),
  employee: one(employees, {
    fields: [untisScheduleSessions.employeeId],
    references: [employees.id],
  }),
  subject: one(subjects, {
    fields: [untisScheduleSessions.subjectId],
    references: [subjects.id],
  }),
  classGroup: one(classGroups, {
    fields: [untisScheduleSessions.classGroupId],
    references: [classGroups.id],
  }),
  classroom: one(classrooms, {
    fields: [untisScheduleSessions.classroomId],
    references: [classrooms.id],
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

export const attendanceNetworkSettingsRelations = relations(attendanceNetworkSettings, ({ one }) => ({
  institution: one(institutions, {
    fields: [attendanceNetworkSettings.institutionId],
    references: [institutions.id],
  }),
}));

// Communications relations
export const communicationsRelations = relations(communications, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [communications.institutionId],
    references: [institutions.id],
  }),
  sender: one(users, {
    fields: [communications.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  recipient: one(users, {
    fields: [communications.recipientId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
  attachments: many(communicationAttachments),
  auditLogs: many(communicationAuditLog),
}));

export const communicationAttachmentsRelations = relations(communicationAttachments, ({ one }) => ({
  communication: one(communications, {
    fields: [communicationAttachments.communicationId],
    references: [communications.id],
  }),
  uploadedByUser: one(users, {
    fields: [communicationAttachments.uploadedBy],
    references: [users.id],
  }),
}));

export const communicationAuditLogRelations = relations(communicationAuditLog, ({ one }) => ({
  communication: one(communications, {
    fields: [communicationAuditLog.communicationId],
    references: [communications.id],
  }),
  user: one(users, {
    fields: [communicationAuditLog.userId],
    references: [users.id],
  }),
}));

export const messageTemplatesRelations = relations(messageTemplates, ({ one }) => ({
  institution: one(institutions, {
    fields: [messageTemplates.institutionId],
    references: [institutions.id],
  }),
  createdByUser: one(users, {
    fields: [messageTemplates.createdBy],
    references: [users.id],
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

export const insertAttendanceNetworkSettingSchema = createInsertSchema(attendanceNetworkSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailSettingSchema = createInsertSchema(emailSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAbsenceJustificationSchema = createInsertSchema(absenceJustifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertNotificationSchema = createInsertSchema(alertNotifications).omit({
  id: true,
  sentAt: true,
});

export const insertAcademicYearSchema = createInsertSchema(academicYears).omit({
  id: true,
  createdAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
});

export const insertClassGroupSchema = createInsertSchema(classGroups).omit({
  id: true,
  createdAt: true,
});

export const insertClassroomSchema = createInsertSchema(classrooms).omit({
  id: true,
  createdAt: true,
});

export const insertUntisScheduleSessionSchema = createInsertSchema(untisScheduleSessions).omit({
  id: true,
  createdAt: true,
  importedAt: true,
});

export const insertCommunicationSchema = createInsertSchema(communications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunicationAttachmentSchema = createInsertSchema(communicationAttachments).omit({
  id: true,
  createdAt: true,
});

export const insertCommunicationAuditLogSchema = createInsertSchema(communicationAuditLog).omit({
  id: true,
  createdAt: true,
});

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWeeklyScheduleSchema = createInsertSchema(weeklySchedule).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;
export type ClassGroup = typeof classGroups.$inferSelect;
export type InsertClassGroup = typeof classGroups.$inferInsert;
export type Classroom = typeof classrooms.$inferSelect;
export type InsertClassroom = typeof classrooms.$inferInsert;
export type UntisScheduleSession = typeof untisScheduleSessions.$inferSelect;
export type InsertUntisScheduleSession = typeof untisScheduleSessions.$inferInsert;
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
export type AttendanceNetworkSetting = typeof attendanceNetworkSettings.$inferSelect;
export type InsertAttendanceNetworkSetting = z.infer<typeof insertAttendanceNetworkSettingSchema>;
export type EmailSetting = typeof emailSettings.$inferSelect;
export type InsertEmailSetting = z.infer<typeof insertEmailSettingSchema>;
export type AbsenceJustification = typeof absenceJustifications.$inferSelect;
export type InsertAbsenceJustification = z.infer<typeof insertAbsenceJustificationSchema>;
export type AlertNotification = typeof alertNotifications.$inferSelect;
export type InsertAlertNotification = z.infer<typeof insertAlertNotificationSchema>;

export type Communication = typeof communications.$inferSelect;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;

// Extended communication type with user information
export type CommunicationWithUsers = Communication & {
  senderFirstName?: string;
  senderLastName?: string;
  senderEmail?: string;
  recipientFirstName?: string; 
  recipientLastName?: string;
  recipientEmail?: string;
};
export type CommunicationAttachment = typeof communicationAttachments.$inferSelect;
export type InsertCommunicationAttachment = z.infer<typeof insertCommunicationAttachmentSchema>;
export type CommunicationAuditLog = typeof communicationAuditLog.$inferSelect;
export type InsertCommunicationAuditLog = z.infer<typeof insertCommunicationAuditLogSchema>;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;

export type WeeklySchedule = typeof weeklySchedule.$inferSelect;
export type InsertWeeklySchedule = z.infer<typeof insertWeeklyScheduleSchema>;
