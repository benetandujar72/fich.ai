CREATE TYPE "public"."absence_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."absence_type" AS ENUM('sick_leave', 'personal', 'vacation', 'training', 'other');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('active', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('late_arrival', 'absence', 'missing_checkout', 'substitute_needed');--> statement-breakpoint
CREATE TYPE "public"."attendance_method" AS ENUM('web', 'qr', 'nfc', 'manual');--> statement-breakpoint
CREATE TYPE "public"."attendance_type" AS ENUM('check_in', 'check_out');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('full_time', 'part_time', 'substitute');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('active', 'inactive', 'temporary_leave');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('draft', 'sent', 'delivered', 'read', 'deleted_by_user', 'failed');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('alert', 'notification', 'communication', 'announcement');--> statement-breakpoint
CREATE TABLE "absence_justifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"date" date NOT NULL,
	"reason" text NOT NULL,
	"admin_response" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "absences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"type" "absence_type" NOT NULL,
	"status" "absence_status" DEFAULT 'pending' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text,
	"documentation" text,
	"approved_by" varchar,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "academic_years" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alert_notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"content" text NOT NULL,
	"delay_minutes" integer DEFAULT 0,
	"accumulated_minutes" integer DEFAULT 0,
	"sent_at" timestamp DEFAULT now(),
	"email_sent" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"type" "alert_type" NOT NULL,
	"status" "alert_status" DEFAULT 'active' NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"metadata" jsonb,
	"resolved_by" varchar,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance_network_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" varchar NOT NULL,
	"allowed_networks" text[] DEFAULT '{}' NOT NULL,
	"require_network_validation" boolean DEFAULT false,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "attendance_network_settings_institution_id_unique" UNIQUE("institution_id")
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"type" "attendance_type" NOT NULL,
	"timestamp" timestamp NOT NULL,
	"method" "attendance_method" DEFAULT 'web' NOT NULL,
	"location" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "class_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" varchar NOT NULL,
	"academic_year_id" varchar NOT NULL,
	"code" varchar NOT NULL,
	"level" varchar NOT NULL,
	"section" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "classrooms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" varchar NOT NULL,
	"code" varchar NOT NULL,
	"name" varchar,
	"capacity" integer,
	"type" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communication_attachments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"communication_id" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"original_file_name" varchar NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar NOT NULL,
	"object_path" varchar NOT NULL,
	"uploaded_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communication_audit_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"communication_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"message_type" "message_type" DEFAULT 'communication' NOT NULL,
	"subject" varchar NOT NULL,
	"content" text NOT NULL,
	"status" "message_status" DEFAULT 'sent' NOT NULL,
	"priority" varchar DEFAULT 'normal' NOT NULL,
	"email_sent" boolean DEFAULT false,
	"email_sent_at" timestamp,
	"read_at" timestamp,
	"delivered_at" timestamp,
	"deleted_by_user_at" timestamp,
	"sender_ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" varchar NOT NULL,
	"smtp_host" varchar,
	"smtp_port" integer,
	"smtp_user" varchar,
	"smtp_password" varchar,
	"sender_email" varchar,
	"sender_name" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "email_settings_institution_id_unique" UNIQUE("institution_id")
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"institution_id" varchar NOT NULL,
	"department_id" varchar,
	"dni" varchar NOT NULL,
	"full_name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar,
	"contract_type" "contract_type" NOT NULL,
	"status" "employee_status" DEFAULT 'active' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"address" text,
	"timezone" varchar DEFAULT 'Europe/Barcelona' NOT NULL,
	"default_language" varchar DEFAULT 'ca' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"message_type" "message_type" NOT NULL,
	"subject" varchar NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_lective_time" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" varchar NOT NULL,
	"key" varchar NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" varchar NOT NULL,
	"academic_year_id" varchar NOT NULL,
	"code" varchar NOT NULL,
	"name" varchar NOT NULL,
	"short_name" varchar,
	"default_classroom" varchar,
	"department" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "substitute_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"absent_employee_id" varchar NOT NULL,
	"substitute_employee_id" varchar NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"room" varchar,
	"notes" text,
	"is_auto_assigned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "untis_schedule_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" varchar NOT NULL,
	"academic_year_id" varchar NOT NULL,
	"session_id" varchar,
	"classe_id" varchar,
	"group_code" varchar NOT NULL,
	"teacher_code" varchar NOT NULL,
	"subject_code" varchar NOT NULL,
	"classroom_code" varchar,
	"day_of_week" integer NOT NULL,
	"hour_period" integer NOT NULL,
	"employee_id" varchar,
	"subject_id" varchar,
	"class_group_id" varchar,
	"classroom_id" varchar,
	"imported_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"password_hash" varchar,
	"role" varchar DEFAULT 'employee' NOT NULL,
	"institution_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weekly_schedule" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"institution_id" varchar NOT NULL,
	"academic_year_id" varchar NOT NULL,
	"day_of_week" integer NOT NULL,
	"hour_period" integer NOT NULL,
	"subject_code" varchar,
	"subject_name" varchar,
	"group_code" varchar,
	"classroom_code" varchar,
	"is_lective_hour" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");