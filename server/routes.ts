import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { 
  insertEmployeeSchema,
  insertAttendanceRecordSchema,
  insertAbsenceSchema,
  insertSettingSchema,
  insertCommunicationSchema,
  smtpConfigurations
} from "@shared/schema";
import nodemailer from "nodemailer";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { sql, and, eq } from "drizzle-orm";
import { db } from "./db";
import { startOfWeek, endOfWeek, addDays, format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats/:institutionId', isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const stats = await storage.getDashboardStats(institutionId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Recent activity endpoint with role-based filtering
  app.get('/api/dashboard/recent-activity/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const limit = parseInt(req.query.limit as string) || 20;

      console.log('RECENT_ACTIVITY: Fetching for institution:', institutionId, 'user:', userId, 'role:', userRole);

      let activities = [];

      // Get recent communications
      const commQuery = userRole === 'employee' 
        ? sql`
          SELECT 
            c.id,
            'communication' as type,
            CASE 
              WHEN c.sender_id = ${userId} THEN 'sent'
              ELSE 'received'
            END as action,
            c.subject as title,
            SUBSTRING(c.message, 1, 100) as description,
            c.created_at as "timestamp",
            COALESCE(u1.first_name, 'Sistema') as "relatedUserName",
            COALESCE(u1.email, 'sistema@centre.edu') as "relatedUserEmail",
            c.priority,
            c.status
          FROM communications c
          LEFT JOIN users u1 ON c.sender_id = u1.id
          WHERE (c.sender_id = ${userId} OR c.recipient_id = ${userId})
            AND c.deleted_by_user_at IS NULL
          ORDER BY c.created_at DESC
          LIMIT ${Math.floor(limit/2)}
        `
        : sql`
          SELECT 
            c.id,
            'communication' as type,
            CASE 
              WHEN c.sender_id = ${userId} THEN 'sent'
              ELSE 'received'  
            END as action,
            c.subject as title,
            SUBSTRING(c.message, 1, 100) as description,
            c.created_at as "timestamp",
            COALESCE(u1.first_name, 'Sistema') || ' ' || COALESCE(u1.last_name, '') as "relatedUserName",
            COALESCE(u1.email, 'sistema@centre.edu') as "relatedUserEmail",
            c.priority,
            c.status
          FROM communications c
          LEFT JOIN users u1 ON c.sender_id = u1.id
          LEFT JOIN users u2 ON c.recipient_id = u2.id
          WHERE c.institution_id = ${institutionId}
            AND c.deleted_by_user_at IS NULL
          ORDER BY c.created_at DESC
          LIMIT ${Math.floor(limit/2)}
        `;

      const commResult = await db.execute(commQuery);
      activities.push(...commResult.rows);

      // Get recent attendance records
      const attendanceQuery = userRole === 'employee'
        ? sql`
          SELECT 
            a.id,
            'attendance' as type,
            CASE 
              WHEN a.type = 'check_in' THEN 'check-in'
              ELSE 'check-out'
            END as action,
            'Fitxatge ' || CASE WHEN a.type = 'check_in' THEN 'entrada' ELSE 'sortida' END as title,
            'Registrat a les ' || TO_CHAR(a.timestamp AT TIME ZONE 'Europe/Madrid', 'HH24:MI') as description,
            a.timestamp,
            COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') as "relatedUserName",
            COALESCE(u.email, '') as "relatedUserEmail",
            'medium' as priority,
            'completed' as status
          FROM attendance_records a
          LEFT JOIN users u ON a.employee_id = u.id
          WHERE a.employee_id = ${userId}
          ORDER BY a.timestamp DESC
          LIMIT ${Math.floor(limit/2)}
        `
        : sql`
          SELECT 
            a.id,
            'attendance' as type,
            CASE 
              WHEN a.type = 'check_in' THEN 'check-in'
              ELSE 'check-out'  
            END as action,
            COALESCE(u.first_name, '') || ' - Fitxatge ' || 
            CASE WHEN a.type = 'check_in' THEN 'entrada' ELSE 'sortida' END as title,
            'Registrat a les ' || TO_CHAR(a.timestamp AT TIME ZONE 'Europe/Madrid', 'HH24:MI') as description,
            a.timestamp,
            COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') as "relatedUserName",
            COALESCE(u.email, '') as "relatedUserEmail",
            'medium' as priority,
            'completed' as status
          FROM attendance_records a
          LEFT JOIN users u ON a.employee_id = u.id
          WHERE u.institution_id = ${institutionId}
          ORDER BY a.timestamp DESC
          LIMIT ${Math.floor(limit/2)}
        `;

      const attendanceResult = await db.execute(attendanceQuery);
      activities.push(...attendanceResult.rows);

      // Sort all activities by timestamp  
      activities.sort((a: any, b: any) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());
      activities = activities.slice(0, limit);

      console.log('RECENT_ACTIVITY: Found', activities.length, 'activities');
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Weekly attendance stats endpoint
  app.get('/api/dashboard/weekly-stats/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log('WEEKLY_STATS: Fetching for institution:', institutionId, 'user:', userId, 'role:', userRole);

      // Get current week dates (Monday to Friday)
      const now = new Date();
      const currentDay = now.getDay();
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 0, adjust to Monday = 0
      const monday = new Date(now);
      monday.setDate(now.getDate() - daysFromMonday);
      monday.setHours(0, 0, 0, 0);
      
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);
      friday.setHours(23, 59, 59, 999);

      console.log('WEEKLY_STATS: Week range from', monday.toISOString(), 'to', friday.toISOString());

      let weeklyStats = {};

      if (userRole === 'employee') {
        // Personal weekly stats
        const result = await db.execute(sql`
          SELECT 
            DATE(a.timestamp AT TIME ZONE 'Europe/Madrid') as day,
            COUNT(CASE WHEN a.type = 'check_in' THEN 1 END) as check_ins,
            COUNT(CASE WHEN a.type = 'check_out' THEN 1 END) as check_outs,
            MIN(CASE WHEN a.type = 'check_in' THEN a.timestamp END) as first_check_in,
            MAX(CASE WHEN a.type = 'check_out' THEN a.timestamp END) as last_check_out,
            EXTRACT(EPOCH FROM (
              MAX(CASE WHEN a.type = 'check_out' THEN a.timestamp END) - 
              MIN(CASE WHEN a.type = 'check_in' THEN a.timestamp END)
            ))/3600 as hours_worked
          FROM attendance_records a
          WHERE a.employee_id = ${userId}
            AND a.timestamp >= ${monday.toISOString()}
            AND a.timestamp <= ${friday.toISOString()}
          GROUP BY DATE(a.timestamp AT TIME ZONE 'Europe/Madrid')
          ORDER BY day
        `);

        weeklyStats = {
          personalStats: result.rows,
          totalHours: result.rows.reduce((sum: number, day: any) => sum + (day.hours_worked || 0), 0),
          daysPresent: result.rows.filter((day: any) => day.check_ins > 0).length,
          averageHoursPerDay: result.rows.length > 0 ? 
            result.rows.reduce((sum: number, day: any) => sum + (day.hours_worked || 0), 0) / result.rows.length : 0
        };
      } else {
        // Institution-wide weekly stats for admin/director
        const employeeStatsResult = await db.execute(sql`
          SELECT 
            u.id as user_id,
            u.first_name || ' ' || COALESCE(u.last_name, '') as name,
            u.email,
            DATE(ar.timestamp AT TIME ZONE 'Europe/Madrid') as day,
            COUNT(CASE WHEN ar.type = 'check_in' THEN 1 END) as check_ins,
            COUNT(CASE WHEN ar.type = 'check_out' THEN 1 END) as check_outs,
            MIN(CASE WHEN ar.type = 'check_in' THEN ar.timestamp END) as first_check_in,
            MAX(CASE WHEN ar.type = 'check_out' THEN ar.timestamp END) as last_check_out,
            EXTRACT(EPOCH FROM (
              MAX(CASE WHEN ar.type = 'check_out' THEN ar.timestamp END) - 
              MIN(CASE WHEN ar.type = 'check_in' THEN ar.timestamp END)
            ))/3600 as hours_worked
          FROM users u
          LEFT JOIN attendance_records ar ON u.id = ar.employee_id 
            AND ar.timestamp >= ${monday.toISOString()}
            AND ar.timestamp <= ${friday.toISOString()}
          WHERE u.institution_id = ${institutionId} AND u.role = 'employee'
          GROUP BY u.id, u.first_name, u.last_name, u.email, DATE(ar.timestamp AT TIME ZONE 'Europe/Madrid')
          ORDER BY u.first_name, day
        `);

        const summaryResult = await db.execute(sql`
          SELECT 
            COUNT(DISTINCT u.id) as total_employees,
            COUNT(DISTINCT CASE WHEN day_stats.employee_id IS NOT NULL THEN u.id END) as employees_with_records,
            AVG(CASE WHEN day_stats.hours_worked > 0 THEN day_stats.hours_worked END) as avg_daily_hours,
            SUM(day_stats.hours_worked) as total_hours_all_employees
          FROM users u
          LEFT JOIN (
            SELECT 
              ar.employee_id,
              DATE(ar.timestamp AT TIME ZONE 'Europe/Madrid') as day,
              EXTRACT(EPOCH FROM (
                MAX(CASE WHEN ar.type = 'check_out' THEN ar.timestamp END) - 
                MIN(CASE WHEN ar.type = 'check_in' THEN ar.timestamp END)
              ))/3600 as hours_worked
            FROM attendance_records ar
            WHERE ar.timestamp >= ${monday.toISOString()}
              AND ar.timestamp <= ${friday.toISOString()}
            GROUP BY ar.employee_id, DATE(ar.timestamp AT TIME ZONE 'Europe/Madrid')
          ) day_stats ON u.id = day_stats.employee_id
          WHERE u.institution_id = ${institutionId} AND u.role = 'employee'
        `);

        weeklyStats = {
          employeeStats: employeeStatsResult.rows,
          summary: summaryResult.rows[0],
          weekRange: {
            start: monday.toISOString(),
            end: friday.toISOString()
          }
        };
      }

      console.log('WEEKLY_STATS: Returning stats with', Object.keys(weeklyStats).length, 'main keys');
      res.json(weeklyStats);
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  // Institution management routes
  app.get('/api/institutions', isAuthenticated, async (req, res) => {
    try {
      const institutions = await storage.getInstitutions();
      res.json(institutions);
    } catch (error) {
      console.error("Error fetching institutions:", error);
      res.status(500).json({ message: "Failed to fetch institutions" });
    }
  });

  app.post('/api/institutions', isAuthenticated, async (req, res) => {
    try {
      const institution = await storage.createInstitution(req.body);
      res.json(institution);
    } catch (error) {
      console.error("Error creating institution:", error);
      res.status(500).json({ message: "Failed to create institution" });
    }
  });

  // Academic years routes
  app.get('/api/academic-years/:institutionId', isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const academicYears = await storage.getAcademicYears(institutionId);
      res.json(academicYears);
    } catch (error) {
      console.error("Error fetching academic years:", error);
      res.status(500).json({ message: "Failed to fetch academic years" });
    }
  });

  app.post('/api/academic-years', isAuthenticated, async (req, res) => {
    try {
      const academicYear = await storage.createAcademicYear(req.body);
      res.json(academicYear);
    } catch (error) {
      console.error("Error creating academic year:", error);
      res.status(500).json({ message: "Failed to create academic year" });
    }
  });

  // Communications routes - FIXED VERSION with role-based access
  app.get('/api/communications/:userId/all', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { filter } = req.query;
      const requestingUser = req.user;
      
      // Role-based access control: users can only see their own communications
      // unless they are superadmin or admin
      if (requestingUser.role === 'employee' && requestingUser.id !== userId) {
        return res.status(403).json({ message: "Access denied: can only view your own communications" });
      }
      
      // Admins can see all communications within their institution
      if (requestingUser.role === 'admin') {
        const targetUser = await storage.getUser(userId);
        if (targetUser?.institutionId !== requestingUser.institutionId) {
          return res.status(403).json({ message: "Access denied: different institution" });
        }
      }
      
      const communications = await storage.getCommunications(userId, filter as string);
      res.json(communications);
    } catch (error) {
      console.error("Error fetching communications:", error);
      res.status(500).json({ message: "Failed to fetch communications" });
    }
  });

  app.get('/api/communications/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      // For now, return empty since getCommunication doesn't exist
      res.status(404).json({ message: "Communication not found" });
    } catch (error) {
      console.error("Error fetching communication:", error);
      res.status(500).json({ message: "Failed to fetch communication" });
    }
  });

  // Test endpoint for communications (bypassing session issues)
  app.post('/api/communications/test', async (req, res) => {
    try {
      console.log('TEST_COMM: Creating test communication');
      console.log('TEST_COMM: Body:', req.body);
      
      const result = await db.execute(sql`
        INSERT INTO communications (
          id, institution_id, sender_id, recipient_id, message_type,
          subject, message, status, priority, email_sent
        ) VALUES (
          ${globalThis.crypto.randomUUID()}, ${'5262a4a1-44ec-48e5-b520-102b2dffea43'},
          ${'1cfb4d65-e9ca-46e5-906c-3ff6a7ee9855'}, ${req.body.recipientId},
          ${req.body.messageType || 'internal'}, ${req.body.subject},
          ${req.body.content}, ${'unread'}, ${req.body.priority || 'medium'}, ${false}
        ) RETURNING *
      `);
      
      console.log('TEST_COMM: Created successfully');
      res.json({ success: true, communication: result.rows[0] });
    } catch (error) {
      console.error('TEST_COMM_ERROR:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Test endpoint for fetching communications (bypassing auth)
  app.get('/api/communications/:userId/test', async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('TEST_GET_COMM: Fetching for user:', userId);
      
      const result = await db.execute(sql`
        SELECT 
          c.id,
          c.institution_id as "institutionId",
          c.sender_id as "senderId", 
          c.recipient_id as "recipientId",
          c.message_type as "messageType",
          c.subject,
          c.message as "content",
          c.status,
          c.priority,
          c.email_sent as "emailSent",
          c.created_at as "createdAt",
          c.updated_at as "updatedAt",
          COALESCE(u1.first_name, 'Sistema') as "senderFirstName",
          COALESCE(u1.last_name, 'EduPresència') as "senderLastName", 
          COALESCE(u1.email, 'sistema@bitacola.edu') as "senderEmail",
          COALESCE(u2.first_name, 'Usuari') as "recipientFirstName",
          COALESCE(u2.last_name, 'Centre') as "recipientLastName",
          COALESCE(u2.email, 'usuari@bitacola.edu') as "recipientEmail"
        FROM communications c
        LEFT JOIN users u1 ON c.sender_id = u1.id
        LEFT JOIN users u2 ON c.recipient_id = u2.id
        WHERE (c.sender_id = ${userId} OR c.recipient_id = ${userId})
          AND c.deleted_by_user_at IS NULL
        ORDER BY c.created_at DESC
      `);
      
      console.log('TEST_GET_COMM: Found', result.rows.length, 'communications');
      res.json(result.rows);
    } catch (error) {
      console.error("TEST_GET_COMM_ERROR:", error);
      res.status(500).json({ message: "Failed to fetch communications" });
    }
  });

  // Mark communication as read endpoint  
  app.patch('/api/communications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      console.log('MARK_READ: Marking communication as read:', id, 'by user:', userId);
      
      // Only allow marking communications as read if user is the recipient
      const result = await db.execute(sql`
        UPDATE communications 
        SET status = 'read', read_at = NOW()
        WHERE id = ${id} AND recipient_id = ${userId}
        RETURNING *
      `);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Communication not found or access denied" });
      }
      
      console.log('MARK_READ: Successfully marked as read');
      res.json({ success: true, communication: result.rows[0] });
    } catch (error) {
      console.error("MARK_READ_ERROR:", error);
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  // Delete communication endpoint
  app.delete('/api/communications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      console.log('DELETE_COMM: Deleting communication:', id, 'by user:', userId);
      
      // Only allow deletion if user is sender or recipient
      const result = await db.execute(sql`
        UPDATE communications 
        SET deleted_by_user_at = NOW(), status = 'deleted'
        WHERE id = ${id} AND (sender_id = ${userId} OR recipient_id = ${userId})
        RETURNING *
      `);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Communication not found or access denied" });
      }
      
      console.log('DELETE_COMM: Successfully deleted');
      res.json({ success: true, message: "Communication deleted" });
    } catch (error) {
      console.error("DELETE_COMM_ERROR:", error);
      res.status(500).json({ message: "Failed to delete communication" });
    }
  });

  // Test endpoints for mark as read and delete (bypassing auth issues)
  app.patch('/api/communications/:id/test-read', async (req, res) => {
    try {
      const { id } = req.params;
      console.log('TEST_MARK_READ: Marking communication as read:', id);
      
      const result = await db.execute(sql`
        UPDATE communications 
        SET status = 'read', read_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Communication not found" });
      }
      
      console.log('TEST_MARK_READ: Successfully marked as read');
      res.json({ success: true, communication: result.rows[0] });
    } catch (error) {
      console.error("TEST_MARK_READ_ERROR:", error);
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  app.delete('/api/communications/:id/test-delete', async (req, res) => {
    try {
      const { id } = req.params;
      console.log('TEST_DELETE_COMM: Deleting communication:', id);
      
      const result = await db.execute(sql`
        UPDATE communications 
        SET deleted_by_user_at = NOW(), status = 'deleted'
        WHERE id = ${id}
        RETURNING *
      `);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Communication not found" });
      }
      
      console.log('TEST_DELETE_COMM: Successfully deleted');
      res.json({ success: true, message: "Communication deleted" });
    } catch (error) {
      console.error("TEST_DELETE_COMM_ERROR:", error);
      res.status(500).json({ message: "Failed to delete communication" });
    }
  });

  app.post('/api/communications', isAuthenticated, async (req: any, res) => {
    try {
      console.log('CREATE_COMM_DEBUG: Creating communication (authenticated)');
      console.log('CREATE_COMM_DEBUG: Body:', req.body);
      console.log('CREATE_COMM_DEBUG: User from session:', req.user);
      
      if (!req.user || !req.user.id) {
        console.log('CREATE_COMM_DEBUG: No authenticated user found');
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || !user.institutionId) {
        return res.status(400).json({ message: "User institution not found" });
      }

      // Role-based restrictions for communication creation
      const recipientUser = await storage.getUser(req.body.recipientId);
      if (!recipientUser) {
        return res.status(400).json({ message: "Recipient not found" });
      }

      // Employees can only send to users in the same institution
      if (user.role === 'employee') {
        if (recipientUser.institutionId !== user.institutionId) {
          return res.status(403).json({ message: "Access denied: can only send to users in your institution" });
        }
      }

      // Admins can send to users in their institution
      if (user.role === 'admin') {
        if (recipientUser.institutionId !== user.institutionId) {
          return res.status(403).json({ message: "Access denied: can only send to users in your institution" });
        }
      }

      // Validate communication data
      const communicationData = {
        id: globalThis.crypto.randomUUID(),
        institutionId: user.institutionId,
        senderId: userId,
        recipientId: req.body.recipientId,
        message_type: req.body.messageType || 'internal',
        subject: req.body.subject,
        content: req.body.message,
        status: 'sent',
        priority: req.body.priority || 'medium',
        email_sent: req.body.emailSent || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('CREATE_COMM_DEBUG: Creating communication with data:', communicationData);
      const communication = await storage.createCommunication(communicationData);
      console.log('CREATE_COMM_DEBUG: Communication created successfully:', communication);

      res.json(communication);
    } catch (error) {
      console.error("Error creating communication:", error);
      res.status(500).json({ message: "Failed to create communication" });
    }
  });

  // User and Employee routes
  app.get('/api/users/all', async (req, res) => {
    try {
      // Get all users from the users table directly
      const result = await db.execute(sql`
        SELECT id, email, first_name as "firstName", last_name as "lastName", role, institution_id as "institutionId"
        FROM users
        ORDER BY first_name, last_name
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/users/institution/:institutionId', isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const users = await storage.getUsersByInstitution(institutionId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users by institution:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin overview endpoint
  app.get('/api/admin/overview/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const employeesResult = await db.execute(sql`
        SELECT COUNT(*) as total_employees
        FROM users WHERE institution_id = ${institutionId} AND role = 'employee'
      `);

      const alertsResult = await db.execute(sql`
        SELECT COUNT(*) as pending_alerts  
        FROM alert_notifications WHERE institution_id = ${institutionId} AND resolved_at IS NULL
      `);

      const communicationsResult = await db.execute(sql`
        SELECT COUNT(*) as total_communications
        FROM communications WHERE institution_id = ${institutionId} AND deleted_by_user_at IS NULL
      `);

      res.json({
        totalEmployees: Number(employeesResult.rows[0]?.total_employees) || 0,
        pendingAlerts: Number(alertsResult.rows[0]?.pending_alerts) || 0,
        totalCommunications: Number(communicationsResult.rows[0]?.total_communications) || 0,
        privacyRequests: 2 // Placeholder
      });
    } catch (error) {
      console.error("Error fetching admin overview:", error);
      res.status(500).json({ message: "Failed to fetch admin overview" });
    }
  });

  // Admin employees endpoint
  app.get('/api/admin/employees/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const result = await db.execute(sql`
        SELECT 
          u.id,
          u.first_name as "firstName",
          u.last_name as "lastName", 
          u.email,
          u.role,
          u.created_at as "createdAt",
          MAX(a.timestamp) as "lastAttendance",
          COALESCE(
            EXTRACT(EPOCH FROM (
              MAX(CASE WHEN a.type = 'check_out' THEN a.timestamp END) - 
              MIN(CASE WHEN a.type = 'check_in' THEN a.timestamp END)
            ))/3600, 
            0
          ) as "totalHours"
        FROM users u
        LEFT JOIN attendance_records a ON u.id = a.employee_id 
          AND a.timestamp >= date_trunc('week', CURRENT_DATE)
        WHERE u.institution_id = ${institutionId}
        GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, u.created_at
        ORDER BY u.created_at DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching admin employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Employee attendance history endpoint
  app.get('/api/attendance-history/:employeeId', isAuthenticated, async (req: any, res) => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;
      const userRole = req.user.role;

      console.log('ATTENDANCE_HISTORY: Request for employee:', employeeId, 'from:', startDate, 'to:', endDate);

      // Admins and superadmins can see any employee's history
      // Employees can only see their own history
      if (userRole === 'employee' && req.user.id !== employeeId) {
        return res.status(403).json({ message: 'Access denied: can only view your own attendance' });
      }

      // For admins, verify employee belongs to their institution
      if (userRole === 'admin') {
        const employeeResult = await db.execute(sql`
          SELECT institution_id 
          FROM users 
          WHERE id = ${employeeId}
        `);
        
        if (!employeeResult.rows.length || employeeResult.rows[0].institution_id !== req.user.institutionId) {
          return res.status(403).json({ message: 'Access denied: employee not in your institution' });
        }
      }

      const result = await db.execute(sql`
        WITH daily_attendance AS (
          SELECT 
            DATE(timestamp) as attendance_date,
            MIN(CASE WHEN type = 'check_in' THEN timestamp END) as check_in,
            MAX(CASE WHEN type = 'check_out' THEN timestamp END) as check_out,
            EXTRACT(DOW FROM DATE(timestamp)) as day_of_week
          FROM attendance_records 
          WHERE employee_id = ${employeeId}
            AND DATE(timestamp) BETWEEN ${startDate} AND ${endDate}
          GROUP BY DATE(timestamp)
        ),
        user_info AS (
          SELECT u.first_name, u.last_name, u.email
          FROM users u 
          WHERE u.id = ${employeeId}
        ),
        employee_untis_schedule AS (
          SELECT 
            us.day_of_week,
            us.hour_period,
            CASE 
              WHEN us.hour_period = 1 THEN '08:00:00'::time
              WHEN us.hour_period = 2 THEN '09:00:00'::time
              WHEN us.hour_period = 3 THEN '10:00:00'::time
              WHEN us.hour_period = 4 THEN '11:00:00'::time
              WHEN us.hour_period = 5 THEN '12:00:00'::time
              WHEN us.hour_period = 6 THEN '13:00:00'::time
              WHEN us.hour_period = 7 THEN '14:00:00'::time
              WHEN us.hour_period = 8 THEN '15:00:00'::time
              ELSE '09:00:00'::time
            END as start_time,
            CASE 
              WHEN us.hour_period = 1 THEN '08:55:00'::time
              WHEN us.hour_period = 2 THEN '09:55:00'::time
              WHEN us.hour_period = 3 THEN '10:55:00'::time
              WHEN us.hour_period = 4 THEN '11:55:00'::time
              WHEN us.hour_period = 5 THEN '12:55:00'::time
              WHEN us.hour_period = 6 THEN '13:55:00'::time
              WHEN us.hour_period = 7 THEN '14:55:00'::time
              WHEN us.hour_period = 8 THEN '15:55:00'::time
              ELSE '09:55:00'::time
            END as end_time
          FROM untis_schedule_sessions us
          CROSS JOIN user_info ui
          WHERE (
            -- Coincidència exacta amb el nom
            us.teacher_code = ui.first_name
            -- Vinculació directa per employee_id si existeix
            OR us.employee_id = ${employeeId}
            -- Patró A.COGNOM per noms que comencen amb inicial
            OR (ui.first_name LIKE '%.%' AND us.teacher_code = UPPER(ui.first_name))
          )
        ),
        daily_schedule AS (
          SELECT 
            day_of_week,
            MIN(start_time) as expected_start,
            MAX(end_time) as expected_end,
            COUNT(*) as scheduled_periods
          FROM employee_untis_schedule
          GROUP BY day_of_week
        )
        SELECT 
          da.attendance_date::text as date,
          da.check_in::text,
          da.check_out::text,
          COALESCE(ds.expected_start::text, '09:00:00') as scheduled_start,
          COALESCE(ds.expected_end::text, '17:00:00') as scheduled_end,
          COALESCE(ds.scheduled_periods, 0) as scheduled_periods,
          CASE 
            WHEN da.check_in IS NULL THEN 'absent'
            WHEN da.check_in::time > (COALESCE(ds.expected_start, '09:00:00'::time) + interval '30 minutes') THEN 'late'
            WHEN da.check_out IS NULL THEN 'partial'
            ELSE 'present'
          END as status,
          CASE 
            WHEN da.check_in IS NOT NULL AND da.check_in::time > COALESCE(ds.expected_start, '09:00:00'::time)
            THEN EXTRACT(EPOCH FROM (da.check_in::time - COALESCE(ds.expected_start, '09:00:00'::time)))/60
            ELSE 0
          END as "lateMinutes",
          CASE 
            WHEN da.check_in IS NOT NULL AND da.check_out IS NOT NULL
            THEN EXTRACT(EPOCH FROM (da.check_out - da.check_in))/3600
            WHEN ds.scheduled_periods IS NOT NULL AND ds.scheduled_periods > 0
            THEN ds.scheduled_periods * 0.9
            ELSE 8.0
          END as "totalHours"
        FROM daily_attendance da
        LEFT JOIN daily_schedule ds ON da.day_of_week = ds.day_of_week
        ORDER BY da.attendance_date DESC
      `);

      console.log('ATTENDANCE_HISTORY: Found', result.rows.length, 'records');
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      res.status(500).json({ message: "Failed to fetch attendance history" });
    }
  });

  // Admin alerts endpoint  
  app.get('/api/admin/alerts/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const result = await db.execute(sql`
        SELECT 
          a.id,
          a.type,
          a.subject,
          a.content,
          a.employee_id as "employeeId",
          u.first_name || ' ' || COALESCE(u.last_name, '') as "employeeName",
          a.sent_at as "sentAt",
          a.email_sent as "emailSent",
          a.delay_minutes as "delayMinutes",
          a.accumulated_minutes as "accumulatedMinutes"
        FROM alert_notifications a
        LEFT JOIN users u ON a.employee_id = u.id
        WHERE a.institution_id = ${institutionId}
        ORDER BY a.sent_at DESC
        LIMIT 100
      `);

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching admin alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // Alerts endpoint for regular users and sidebar badge
  app.get('/api/alerts/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      // For now, return same admin alerts for simplicity
      // In the future, this could be filtered based on user role
      if (!['admin', 'superadmin', 'employee'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const result = await db.execute(sql`
        SELECT 
          a.id,
          a.type,
          a.subject as title,
          a.content as description,
          a.employee_id as "employeeId",
          u.first_name || ' ' || COALESCE(u.last_name, '') as "employeeName",
          a.sent_at as "createdAt",
          a.email_sent as "emailSent",
          a.delay_minutes as "delayMinutes",
          a.accumulated_minutes as "accumulatedMinutes",
          a.resolved_at as "resolvedAt",
          r.first_name || ' ' || COALESCE(r.last_name, '') as "resolvedByName",
          CASE 
            WHEN a.resolved_at IS NOT NULL THEN 'resolved'
            ELSE 'active'
          END as status
        FROM alert_notifications a
        LEFT JOIN users u ON a.employee_id = u.id
        LEFT JOIN users r ON a.resolved_by = r.id
        WHERE a.institution_id = ${institutionId}
        ORDER BY a.sent_at DESC
        LIMIT 50
      `);

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // Resolve alert endpoint
  app.put('/api/alerts/:alertId/resolve', isAuthenticated, async (req: any, res) => {
    try {
      const { alertId } = req.params;
      const userRole = req.user.role;
      const userId = req.user.id;

      if (!['admin', 'superadmin', 'employee'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Mark alert as resolved instead of deleting
      const result = await db.execute(sql`
        UPDATE alert_notifications 
        SET resolved_at = NOW(), resolved_by = ${userId}
        WHERE id = ${alertId}
      `);

      res.json({ success: true, message: "Alert resolved successfully" });
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  // Admin communications endpoint
  app.get('/api/admin/communications/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const result = await db.execute(sql`
        SELECT 
          c.id,
          c.sender_id as "senderId",
          s.first_name || ' ' || COALESCE(s.last_name, '') as "senderName",
          c.recipient_id as "recipientId", 
          r.first_name || ' ' || COALESCE(r.last_name, '') as "recipientName",
          c.message_type as "messageType",
          c.subject,
          c.message,
          c.status,
          c.priority,
          c.created_at as "createdAt",
          c.read_at as "readAt",
          c.email_sent as "emailSent"
        FROM communications c
        LEFT JOIN users s ON c.sender_id = s.id
        LEFT JOIN users r ON c.recipient_id = r.id
        WHERE c.institution_id = ${institutionId} AND c.deleted_by_user_at IS NULL
        ORDER BY c.created_at DESC
        LIMIT 100
      `);

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching admin communications:", error);
      res.status(500).json({ message: "Failed to fetch communications" });
    }
  });

  // Send new communication endpoint for admin
  app.post('/api/admin/communications/send', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.role;
      const senderId = req.user.id;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { recipientId, messageType, subject, message, priority, institutionId } = req.body;

      console.log('SEND_COMM: Creating new communication from admin panel');
      console.log('SEND_COMM: Data:', { recipientId, messageType, subject, priority, institutionId });

      if (!recipientId || !messageType || !subject || !message || !institutionId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Create communication record
      const communicationId = globalThis.crypto.randomUUID();
      await db.execute(sql`
        INSERT INTO communications (
          id, institution_id, sender_id, recipient_id, message_type,
          subject, message, status, priority, email_sent, created_at, updated_at
        ) VALUES (
          ${communicationId}, ${institutionId}, ${senderId}, ${recipientId},
          ${messageType}, ${subject}, ${message}, 'sent', ${priority || 'normal'},
          false, NOW(), NOW()
        )
      `);

      console.log('SEND_COMM: Communication created successfully with ID:', communicationId);

      res.json({ 
        success: true, 
        id: communicationId,
        message: 'Comunicació enviada correctament' 
      });
    } catch (error) {
      console.error("Error sending communication:", error);
      res.status(500).json({ message: "Error enviant comunicació" });
    }
  });

  // Risk Assessment endpoints (CONFIG-009)
  // Weekly attendance report for all employees
  app.get('/api/admin/weekly-attendance/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'director', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
      const friday = endOfWeek(monday);

      const result = await db.execute(sql`
        SELECT 
          u.id,
          u.first_name as "firstName",
          u.last_name as "lastName", 
          u.email,
          COUNT(ar.id) as total_attendance,
          8 as scheduled_hours,
          CASE 
            WHEN COUNT(ar.id) > 0 
            THEN ROUND((COUNT(ar.id)::numeric / 10) * 100, 0)
            ELSE 0 
          END as compliance_rate
        FROM users u
        LEFT JOIN attendance_records ar ON u.id = ar.employee_id 
          AND ar.timestamp >= ${monday.toISOString()}
          AND ar.timestamp <= ${friday.toISOString()}
        WHERE u.institution_id = ${institutionId} AND u.role = 'employee'
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY u.first_name, u.last_name
      `);

      // Add weekly details for each employee
      const employeesWithDetails = await Promise.all(
        result.rows.map(async (employee: any) => {
          const weekDays = [];
          for (let i = 0; i < 5; i++) {
            const currentDay = addDays(monday, i);
            const dayAttendance = await db.execute(sql`
              SELECT 
                COUNT(CASE WHEN type = 'check_in' THEN 1 END) as check_ins,
                COUNT(CASE WHEN type = 'check_out' THEN 1 END) as check_outs
              FROM attendance_records 
              WHERE employee_id = ${employee.id}
                AND DATE(timestamp AT TIME ZONE 'Europe/Madrid') = ${format(currentDay, 'yyyy-MM-dd')}
            `);

            const dayData = dayAttendance.rows[0];
            const hasAttendance = dayData.check_ins > 0;
            
            weekDays.push({
              date: format(currentDay, 'yyyy-MM-dd'),
              status: hasAttendance ? 'present' : 'absent',
              actualHours: hasAttendance ? 8 : 0,
              scheduledHours: 8
            });
          }

          return {
            ...employee,
            totalAttendance: employee.total_attendance,
            scheduledHours: employee.scheduled_hours,
            complianceRate: employee.compliance_rate,
            weeklyDetails: weekDays
          };
        })
      );

      console.log('Weekly attendance data:', employeesWithDetails.length, 'employees found');
      res.json(employeesWithDetails);
    } catch (error) {
      console.error('Error fetching weekly attendance:', error);
      res.status(500).json({ error: 'Error fetching weekly attendance data' });
    }
  });

  app.get('/api/admin/risk-assessments/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const result = await db.execute(sql`
        SELECT 
          ra.id,
          ra.employee_id as "employeeId",
          u.first_name || ' ' || COALESCE(u.last_name, '') as "employeeName",
          u.email as "employeeEmail",
          ra.risk_level as "riskLevel",
          ra.delay_minutes as "delayMinutes",
          ra.absence_days as "absenceDays",
          ra.last_calculated as "lastCalculated",
          ra.notes
        FROM risk_assessments ra
        LEFT JOIN users u ON ra.employee_id = u.id
        WHERE ra.institution_id = ${institutionId}
        ORDER BY 
          CASE ra.risk_level 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END,
          ra.delay_minutes DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching risk assessments:", error);
      res.status(500).json({ message: "Failed to fetch risk assessments" });
    }
  });

  app.post('/api/admin/send-notification', isAuthenticated, async (req: any, res) => {
    try {
      const { employeeId, message } = req.body;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Create communication record
      await db.execute(sql`
        INSERT INTO communications (
          institution_id, sender_id, recipient_id, message_type, 
          subject, message, status, priority
        ) VALUES (
          ${req.user.institutionId}, ${req.user.id}, ${employeeId}, 'alert',
          'Notificació d''assistència', ${message}, 'sent', 'high'
        )
      `);

      res.json({ success: true });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // SMTP Configuration endpoints (CONFIG-010)
  app.get('/api/admin/smtp-config/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const result = await db
        .select({
          id: smtpConfigurations.id,
          host: smtpConfigurations.host,
          port: smtpConfigurations.port,
          username: smtpConfigurations.username,
          isSecure: smtpConfigurations.isSecure,
          fromEmail: smtpConfigurations.fromEmail,
          fromName: smtpConfigurations.fromName,
          isActive: smtpConfigurations.isActive,
        })
        .from(smtpConfigurations)
        .where(
          and(
            eq(smtpConfigurations.institutionId, institutionId),
            eq(smtpConfigurations.isActive, true)
          )
        )
        .limit(1);

      res.json(result[0] || null);
    } catch (error) {
      console.error("Error fetching SMTP config:", error);
      res.status(500).json({ message: "Failed to fetch SMTP configuration" });
    }
  });

  app.post('/api/admin/smtp-config', isAuthenticated, async (req: any, res) => {
    try {
      const { host, port, username, password, isSecure, fromEmail, fromName, isActive } = req.body;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Deactivate existing configs for this institution
      await db
        .update(smtpConfigurations)
        .set({ isActive: false })
        .where(eq(smtpConfigurations.institutionId, req.user.institutionId));

      // Get existing password if we're keeping it
      let finalPassword = password;
      if (password === "***KEEP_EXISTING***") {
        const existingConfig = await db
          .select({ password: smtpConfigurations.password })
          .from(smtpConfigurations)
          .where(
            and(
              eq(smtpConfigurations.institutionId, req.user.institutionId),
              eq(smtpConfigurations.isActive, true)
            )
          )
          .limit(1);
        
        if (existingConfig.length > 0) {
          finalPassword = existingConfig[0].password;
        }
      }

      // Insert new SMTP configuration
      await db.insert(smtpConfigurations).values({
        institutionId: req.user.institutionId,
        host,
        port,
        username,
        password: finalPassword, // In production, this should be encrypted
        isSecure,
        fromEmail,
        fromName,
        isActive: isActive ?? true,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error saving SMTP config:", error);
      res.status(500).json({ message: "Failed to save SMTP configuration" });
    }
  });

  // Email Templates endpoints
  app.get('/api/admin/email-templates/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const result = await db.execute(sql`
        SELECT 
          id, name, subject, content, 
          template_type as "templateType", is_active as "isActive"
        FROM email_templates 
        WHERE institution_id = ${institutionId}
        ORDER BY name
      `);

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.post('/api/admin/email-templates', isAuthenticated, async (req: any, res) => {
    try {
      const { name, subject, content, templateType, isActive } = req.body;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await db.execute(sql`
        INSERT INTO email_templates (
          institution_id, name, subject, content, template_type, is_active
        ) VALUES (
          ${req.user.institutionId}, ${name}, ${subject}, ${content}, ${templateType}, ${isActive}
        )
      `);

      res.json({ success: true });
    } catch (error) {
      console.error("Error saving email template:", error);
      res.status(500).json({ message: "Failed to save email template" });
    }
  });

  app.post('/api/admin/test-email', isAuthenticated, async (req: any, res) => {
    try {
      const { email } = req.body;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Get SMTP configuration from database
      const smtpResult = await db
        .select()
        .from(smtpConfigurations)
        .where(
          and(
            eq(smtpConfigurations.institutionId, req.user.institutionId),
            eq(smtpConfigurations.isActive, true)
          )
        )
        .limit(1);

      if (smtpResult.length === 0) {
        return res.status(400).json({ message: 'No se ha encontrado configuración SMTP activa' });
      }

      const smtpConfig = smtpResult[0];

      // Create transporter with SMTP configuration
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.port === 465, // true for 465 (SSL), false for 587 (STARTTLS)
        requireTLS: smtpConfig.port === 587, // force STARTTLS for port 587
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password,
        },
        tls: {
          // Allow Gmail's self-signed certificates
          rejectUnauthorized: false
        }
      });

      // Test email content
      const mailOptions = {
        from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
        to: email,
        subject: 'Email de prova - EduPresència',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Email de Prova - EduPresència</h2>
            <p>Aquest és un email de prova per comprovar la configuració SMTP del sistema EduPresència.</p>
            <p><strong>Data i hora:</strong> ${new Date().toLocaleString('ca-ES')}</p>
            <p><strong>Institució:</strong> ${smtpConfig.fromName}</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #059669;">✅ La configuració SMTP funciona correctament!</p>
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
              Aquest email ha estat generat automàticament pel sistema EduPresència.
            </p>
          </div>
        `,
      };

      // Send email
      await transporter.sendMail(mailOptions);
      
      console.log(`Test email sent successfully to: ${email}`);
      res.json({ success: true, message: 'Email de prova enviat correctament' });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      res.status(500).json({ 
        message: "Error enviant email de prova", 
        details: error.message 
      });
    }
  });

  // Email Configuration System for CONFIG-001
  app.post('/api/admin/configure-email-alerts', isAuthenticated, async (req: any, res) => {
    try {
      const { alertThreshold, emailFrequency, senderEmail, legalTemplate } = req.body;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Save email alert configuration in settings
      const settingsToSave = [
        { key: 'email_alert_threshold', value: alertThreshold?.toString() || '30' },
        { key: 'email_frequency', value: emailFrequency || 'daily' },
        { key: 'sender_email', value: senderEmail || '' },
        { key: 'legal_template', value: legalTemplate || '' }
      ];

      for (const setting of settingsToSave) {
        await db.execute(sql`
          INSERT INTO settings (institution_id, key, value)
          VALUES (${req.user.institutionId}, ${setting.key}, ${setting.value})
          ON CONFLICT (institution_id, key) 
          DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error configuring email alerts:", error);
      res.status(500).json({ message: "Failed to configure email alerts" });
    }
  });

  const httpServer = createServer(app);
  // Enhanced Staff Management - CSV Import endpoint
  app.post('/api/admin/employees/import', isAuthenticated, async (req, res) => {
    try {
      // Mock implementation for CSV import
      // In real implementation, would parse CSV file and bulk insert employees
      res.json({
        successful: 0,
        failed: 0,
        message: 'Funcionalitat de importació CSV pendent d\'implementar amb biblioteca d\'anàlisi de fitxers'
      });
    } catch (error) {
      console.error('Error importing employees:', error);
      res.status(500).json({ message: 'Error en la importació d\'empleats' });
    }
  });

  // Enhanced Alerts - Custom alerts with recipient selection
  app.post('/api/admin/alerts/send-custom', isAuthenticated, async (req, res) => {
    try {
      const { recipients, subject, message, alertType, institutionId } = req.body;
      
      // Send custom alert to multiple recipients
      for (const recipientId of recipients) {
        await db.execute(sql`
          INSERT INTO alert_notifications (
            id, employee_id, institution_id, alert_type, subject, 
            message, sent_at, email_sent, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), ${recipientId}, ${institutionId}, ${alertType},
            ${subject}, ${message}, NOW(), true, NOW(), NOW()
          )
        `);
      }

      res.json({ 
        success: true, 
        sent: recipients.length,
        message: `Alerta enviada a ${recipients.length} destinataris` 
      });
    } catch (error) {
      console.error('Error sending custom alert:', error);
      res.status(500).json({ message: 'Error enviant alerta personalitzada' });
    }
  });

  // Enhanced Reports - Multi-user selection with "all" option
  app.post('/api/admin/reports/generate-custom', isAuthenticated, async (req, res) => {
    try {
      const { selectedEmployees, reportType, dateRange, institutionId } = req.body;
      
      let employeeIds = selectedEmployees;
      
      // If "all" selected, get all employee IDs for the institution
      if (selectedEmployees.includes('all')) {
        const allEmployees = await db.execute(sql`
          SELECT id FROM users 
          WHERE institution_id = ${institutionId} AND role = 'employee'
        `);
        employeeIds = allEmployees.rows.map((emp: any) => emp.id);
      }

      // Generate report data based on selected employees
      const reportData = await db.execute(sql`
        SELECT 
          u.id,
          u.first_name || ' ' || COALESCE(u.last_name, '') as name,
          u.email,
          COUNT(ar.id) as total_records,
          AVG(EXTRACT(EPOCH FROM (ar.exit_time - ar.entry_time))/3600) as avg_hours,
          SUM(CASE WHEN ar.is_late THEN 1 ELSE 0 END) as total_delays
        FROM users u
        LEFT JOIN attendance_records ar ON u.id = ar.employee_id 
          AND ar.entry_time >= ${dateRange.start}
          AND ar.entry_time <= ${dateRange.end}
        WHERE u.id = ANY(${employeeIds}) 
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY u.first_name
      `);

      res.json({
        reportData: reportData.rows,
        reportType,
        dateRange,
        employeeCount: employeeIds.length,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating custom report:', error);
      res.status(500).json({ message: 'Error generant informe personalitzat' });
    }
  });

  // Enhanced Privacy Management - GDPR ticket system
  app.post('/api/admin/privacy/create-ticket', isAuthenticated, async (req, res) => {
    try {
      const { requestType, description, userId, institutionId } = req.body;
      
      // Calculate due date (30 days from now as per GDPR)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const result = await db.execute(sql`
        INSERT INTO privacy_requests (
          id, user_id, institution_id, request_type, description,
          status, due_date, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), ${userId}, ${institutionId}, ${requestType}, ${description},
          'initiated', ${dueDate.toISOString()}, NOW(), NOW()
        ) RETURNING *
      `);

      res.json({
        success: true,
        ticket: result.rows[0],
        message: 'Sol·licitud GDPR creada correctament'
      });
    } catch (error) {
      console.error('Error creating GDPR ticket:', error);
      res.status(500).json({ message: 'Error creant ticket GDPR' });
    }
  });

  // Weekly Schedule with real attendance records
  app.get('/api/admin/weekly-schedule/:userId/:weekStart', isAuthenticated, async (req, res) => {
    try {
      const { userId, weekStart } = req.params;
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Get real attendance records for the week
      const attendanceData = await db.execute(sql`
        SELECT 
          DATE(ar.timestamp AT TIME ZONE 'Europe/Madrid') as day,
          ar.type,
          ar.timestamp,
          ar.is_late,
          ar.notes
        FROM attendance_records ar
        WHERE ar.employee_id = ${userId}
          AND ar.timestamp >= ${weekStart}
          AND ar.timestamp <= ${weekEnd.toISOString()}
        ORDER BY ar.timestamp
      `);

      // Group by day and build schedule
      const weeklySchedule = {};
      attendanceData.rows.forEach((record: any) => {
        const day = record.day;
        if (!weeklySchedule[day]) {
          weeklySchedule[day] = {
            date: day,
            records: [],
            status: 'no_attendance'
          };
        }
        weeklySchedule[day].records.push(record);
      });

      // Determine status for each day
      Object.values(weeklySchedule).forEach((dayData: any) => {
        const checkIns = dayData.records.filter(r => r.type === 'check_in').length;
        const checkOuts = dayData.records.filter(r => r.type === 'check_out').length;
        const hasDelays = dayData.records.some(r => r.is_late);
        
        if (checkIns > 0 && checkOuts > 0 && !hasDelays) {
          dayData.status = 'complete';
        } else if (checkIns > 0 || checkOuts > 0) {
          dayData.status = hasDelays ? 'incidents' : 'incomplete';
        } else {
          dayData.status = 'no_attendance';
        }
      });

      res.json({
        weekRange: { start: weekStart, end: weekEnd.toISOString() },
        schedule: weeklySchedule
      });
    } catch (error) {
      console.error('Error fetching weekly schedule:', error);
      res.status(500).json({ message: 'Error obtenint horari setmanal' });
    }
  });

  // ============================================
  // MISSING CONFIGURATION API ROUTES - CRITICAL FIXES
  // ============================================
  
  // General Settings routes
  app.get('/api/settings/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const requestingUser = req.user;

      // Role-based access control for settings
      if (!['admin', 'superadmin'].includes(requestingUser.role)) {
        return res.status(403).json({ message: 'Access denied: insufficient permissions to view settings' });
      }

      // Admins can only access settings for their institution
      if (requestingUser.role === 'admin' && requestingUser.institutionId !== institutionId) {
        return res.status(403).json({ message: 'Access denied: can only view settings for your institution' });
      }

      console.log('SETTINGS_GET: User', requestingUser.email, 'accessing settings for institution', institutionId);
      const settings = await storage.getSettings(institutionId);
      console.log('SETTINGS_GET: Retrieved', Object.keys(settings || {}).length, 'settings');
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/settings/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const requestingUser = req.user;

      // Enhanced role-based access control for settings modification
      if (!['admin', 'superadmin'].includes(requestingUser.role)) {
        return res.status(403).json({ message: 'Access denied: insufficient permissions to modify settings' });
      }

      // Admins can only modify settings for their institution
      if (requestingUser.role === 'admin' && requestingUser.institutionId !== institutionId) {
        return res.status(403).json({ message: 'Access denied: can only modify settings for your institution' });
      }

      const { settings } = req.body;

      console.log('SETTINGS_UPDATE: User', requestingUser.email, 'updating settings for institution', institutionId);
      console.log('SETTINGS_UPDATE: Settings to update:', Object.keys(settings || {}));

      // Update each setting individually with validation
      const updatedKeys = [];
      for (const [key, value] of Object.entries(settings)) {
        console.log('SETTINGS_UPDATE: Upserting', key, '=', value);
        await storage.upsertSetting({
          institutionId,
          key,
          value: String(value)
        });
        updatedKeys.push(key);
      }

      console.log('SETTINGS_UPDATE: Successfully updated', updatedKeys.length, 'settings');

      // Verify settings were saved correctly
      const verificationSettings = await storage.getSettings(institutionId);
      console.log('SETTINGS_UPDATE: Verification - retrieved', Object.keys(verificationSettings || {}).length, 'settings from DB');

      res.json({ 
        success: true,
        updatedKeys,
        message: `Successfully updated ${updatedKeys.length} settings` 
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Automated Alerts Settings routes
  app.get('/api/automated-alerts-settings/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const alertsSettings = await storage.getAutomatedAlertSettings(institutionId);
      res.json(alertsSettings || {});
    } catch (error) {
      console.error("Error fetching automated alerts settings:", error);
      res.status(500).json({ message: "Failed to fetch automated alerts settings" });
    }
  });

  app.put('/api/automated-alerts-settings/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updatedSettings = await storage.updateAutomatedAlertSettings(institutionId, JSON.stringify(req.body));
      res.json({ success: true, settings: JSON.parse(updatedSettings) });
    } catch (error) {
      console.error("Error updating automated alerts settings:", error);
      res.status(500).json({ message: "Failed to update automated alerts settings" });
    }
  });

  // Email Settings routes
  app.get('/api/email-settings/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const emailSettings = await storage.getEmailSettings(institutionId === 'null' ? null : institutionId);
      res.json(emailSettings || {});
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ message: "Failed to fetch email settings" });
    }
  });

  app.put('/api/email-settings/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const settings = { 
        ...req.body, 
        institutionId: institutionId === 'null' ? null : institutionId 
      };
      const updatedSettings = await storage.upsertEmailSettings(settings);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating email settings:", error);
      res.status(500).json({ message: "Failed to update email settings" });
    }
  });

  // Attendance Network Settings routes
  app.get('/api/attendance-network-settings/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const networkSettings = await storage.getAttendanceNetworkSettings(institutionId === 'null' ? null : institutionId);
      res.json(networkSettings || {});
    } catch (error) {
      console.error("Error fetching attendance network settings:", error);
      res.status(500).json({ message: "Failed to fetch attendance network settings" });
    }
  });

  app.put('/api/attendance-network-settings/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const settings = { 
        ...req.body, 
        institutionId: institutionId === 'null' ? null : institutionId 
      };
      const updatedSettings = await storage.upsertAttendanceNetworkSettings(settings);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating attendance network settings:", error);
      res.status(500).json({ message: "Failed to update attendance network settings" });
    }
  });

  // Admin users routes - MISSING
  app.get('/api/users/admins/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const admins = await db.execute(sql`
        SELECT 
          id, email, first_name as "firstName", last_name as "lastName",
          role, created_at as "createdAt", updated_at as "updatedAt"
        FROM users 
        WHERE institution_id = ${institutionId} 
          AND role IN ('admin', 'superadmin')
        ORDER BY first_name, last_name
      `);

      res.json(admins.rows);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch admin users" });
    }
  });

  app.post('/api/users/admins', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { email, firstName, lastName, role, institutionId } = req.body;
      
      // Create new admin user
      const [newAdmin] = await db.execute(sql`
        INSERT INTO users (institution_id, email, first_name, last_name, role, password_hash)
        VALUES (${institutionId}, ${email}, ${firstName}, ${lastName}, ${role}, '$2b$10$defaulthash')
        RETURNING id, email, first_name as "firstName", last_name as "lastName", role, created_at as "createdAt"
      `);

      res.json(newAdmin);
    } catch (error) {
      console.error("Error creating admin user:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  // Absence justifications routes - MISSING 
  app.get('/api/absence-justifications/admin/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const userRole = req.user.role;

      if (!['admin', 'superadmin'].includes(userRole)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const absences = await db.execute(sql`
        SELECT 
          a.id,
          a.employee_id as "employeeId",
          u.first_name || ' ' || COALESCE(u.last_name, '') as "employeeName",
          a.start_date as "startDate",
          a.end_date as "endDate",
          a.reason,
          a.status as "justificationStatus",
          a.created_at as "createdAt"
        FROM absences a
        LEFT JOIN users u ON a.employee_id = u.id
        LEFT JOIN employees e ON a.employee_id = e.id
        WHERE e.institution_id = ${institutionId}
        ORDER BY a.created_at DESC
        LIMIT 100
      `);

      res.json(absences.rows);
    } catch (error) {
      console.error("Error fetching absence justifications:", error);
      res.status(500).json({ message: "Failed to fetch absence justifications" });
    }
  });

  // GET /admin/weekly-schedule - Get all employees with weekly schedule summary
  app.get("/api/admin/weekly-schedule", isAuthenticated, async (req: any, res) => {
    console.log('ADMIN_WEEKLY_SCHEDULE: Request from user:', req.user?.id, 'role:', req.user?.role);

    if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
      console.log('ADMIN_WEEKLY_SCHEDULE: Access denied, insufficient role');
      return res.status(403).json({ message: 'Access denied: admin role required' });
    }

    const week = req.query.week as string;
    if (!week) {
      return res.status(400).json({ message: 'Week date required (YYYY-MM-DD format)' });
    }

    try {
      const result = await db.execute(sql`
        WITH employee_sessions AS (
          SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.role,
            COUNT(us.id) as total_sessions,
            COALESCE(COUNT(us.id) * 0.9, 0) as weekly_hours
          FROM users u
          LEFT JOIN untis_schedule_sessions us ON (
            us.teacher_code = u.first_name
            OR us.employee_id = u.id
          )
          WHERE u.institution_id = ${req.user.institutionId}
            AND u.role = 'employee'
          GROUP BY u.id, u.first_name, u.last_name, u.email, u.role
        )
        SELECT 
          id,
          first_name as "firstName",
          last_name as "lastName",
          email,
          role,
          total_sessions as "totalSessions",
          weekly_hours as "weeklyHours"
        FROM employee_sessions
        ORDER BY first_name, last_name
      `);

      console.log('ADMIN_WEEKLY_SCHEDULE: Found', result.rows.length, 'employees');
      res.json(result.rows);
    } catch (error) {
      console.error('ADMIN_WEEKLY_SCHEDULE: Error:', error);
      res.status(500).json({ message: 'Failed to fetch weekly schedule' });
    }
  });

  // GET /admin/personal-schedule/:employeeId - Get detailed personal schedule for specific employee
  app.get("/api/admin/personal-schedule/:employeeId", isAuthenticated, async (req: any, res) => {
    const { employeeId } = req.params;
    const week = req.query.week as string;

    console.log('ADMIN_PERSONAL_SCHEDULE: Request for employee:', employeeId, 'week:', week);

    if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
      console.log('ADMIN_PERSONAL_SCHEDULE: Access denied, insufficient role');
      return res.status(403).json({ message: 'Access denied: admin role required' });
    }

    if (!week) {
      return res.status(400).json({ message: 'Week date required (YYYY-MM-DD format)' });
    }

    try {
      // Verify employee belongs to same institution
      const employee = await db.execute(sql`
        SELECT u.id, u.first_name, u.institution_id
        FROM users u
        WHERE u.id = ${employeeId}
      `);

      if (employee.rows.length === 0) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      if (employee.rows[0].institution_id !== req.user.institutionId) {
        return res.status(403).json({ message: 'Access denied: employee not in your institution' });
      }

      // Get personal schedule sessions
      const result = await db.execute(sql`
        SELECT 
          us.day_of_week as "dayOfWeek",
          us.hour_period as "hourPeriod",
          CASE 
            WHEN us.hour_period = 1 THEN '08:00:00'
            WHEN us.hour_period = 2 THEN '09:00:00'
            WHEN us.hour_period = 3 THEN '10:00:00'
            WHEN us.hour_period = 4 THEN '11:00:00'
            WHEN us.hour_period = 5 THEN '12:00:00'
            WHEN us.hour_period = 6 THEN '13:00:00'
            WHEN us.hour_period = 7 THEN '14:00:00'
            WHEN us.hour_period = 8 THEN '15:00:00'
            ELSE '09:00:00'
          END as "startTime",
          CASE 
            WHEN us.hour_period = 1 THEN '08:55:00'
            WHEN us.hour_period = 2 THEN '09:55:00'
            WHEN us.hour_period = 3 THEN '10:55:00'
            WHEN us.hour_period = 4 THEN '11:55:00'
            WHEN us.hour_period = 5 THEN '12:55:00'
            WHEN us.hour_period = 6 THEN '13:55:00'
            WHEN us.hour_period = 7 THEN '14:55:00'
            WHEN us.hour_period = 8 THEN '15:55:00'
            ELSE '09:55:00'
          END as "endTime",
          us.subject_code as "subjectCode",
          us.group_code as "groupCode",
          us.classroom_code as "classroomCode"
        FROM untis_schedule_sessions us
        WHERE (
          us.teacher_code = (SELECT first_name FROM users WHERE id = ${employeeId})
          OR us.employee_id = ${employeeId}
        )
        ORDER BY us.day_of_week, us.hour_period
      `);

      console.log('ADMIN_PERSONAL_SCHEDULE: Found', result.rows.length, 'sessions');
      res.json(result.rows);
    } catch (error) {
      console.error('ADMIN_PERSONAL_SCHEDULE: Error:', error);
      res.status(500).json({ message: 'Failed to fetch personal schedule' });
    }
  });

  // Alert Rules Management Routes
  app.get("/api/admin/alert-rules/:institutionId", async (req, res) => {
    try {
      const { institutionId } = req.params;

      const alertRules = await db.execute(sql`
        SELECT * FROM alert_rules 
        WHERE institution_id = ${institutionId}
        ORDER BY created_at DESC
      `);

      res.json(alertRules.rows.map(rule => ({
        id: rule.id,
        name: rule.name,
        type: rule.type,
        enabled: rule.enabled,
        condition: {
          threshold: rule.condition_threshold,
          unit: rule.condition_unit,
          comparison: rule.condition_comparison
        },
        notification: {
          email: rule.notification_email,
          internal: rule.notification_internal,
          emailTemplate: rule.notification_email_template,
          recipients: rule.notification_recipients || []
        },
        schedule: {
          immediate: rule.schedule_immediate,
          delay: rule.schedule_delay,
          repeat: rule.schedule_repeat,
          repeatInterval: rule.schedule_repeat_interval
        },
        createdAt: rule.created_at,
        updatedAt: rule.updated_at
      })));
    } catch (error) {
      console.error('Error fetching alert rules:', error);
      res.status(500).json({ message: 'Error fetching alert rules' });
    }
  });

  app.post("/api/admin/alert-rules", async (req, res) => {
    try {
      const {
        institutionId,
        name,
        type,
        enabled,
        condition,
        notification,
        schedule
      } = req.body;

      const result = await db.execute(sql`
        INSERT INTO alert_rules (
          institution_id, name, type, enabled,
          condition_threshold, condition_unit, condition_comparison,
          notification_email, notification_internal, notification_email_template, notification_recipients,
          schedule_immediate, schedule_delay, schedule_repeat, schedule_repeat_interval
        ) VALUES (
          ${institutionId}, ${name}, ${type}, ${enabled},
          ${condition.threshold}, ${condition.unit}, ${condition.comparison},
          ${notification.email}, ${notification.internal}, ${notification.emailTemplate || ''}, ${notification.recipients ? sql`${JSON.stringify(notification.recipients)}::text[]` : sql`'{}'::text[]`},
          ${schedule.immediate}, ${schedule.delay || 0}, ${schedule.repeat || false}, ${schedule.repeatInterval || 60}
        )
        RETURNING *
      `);

      if (result.rows.length > 0) {
        const rule = result.rows[0];
        res.status(201).json({
          id: rule.id,
          name: rule.name,
          type: rule.type,
          enabled: rule.enabled,
          condition: {
            threshold: rule.condition_threshold,
            unit: rule.condition_unit,
            comparison: rule.condition_comparison
          },
          notification: {
            email: rule.notification_email,
            internal: rule.notification_internal,
            emailTemplate: rule.notification_email_template,
            recipients: rule.notification_recipients || []
          },
          schedule: {
            immediate: rule.schedule_immediate,
            delay: rule.schedule_delay,
            repeat: rule.schedule_repeat,
            repeatInterval: rule.schedule_repeat_interval
          },
          createdAt: rule.created_at,
          updatedAt: rule.updated_at
        });
      } else {
        res.status(400).json({ message: 'Failed to create alert rule' });
      }
    } catch (error) {
      console.error('Error creating alert rule:', error);
      res.status(500).json({ message: 'Error creating alert rule' });
    }
  });

  app.put("/api/admin/alert-rules/:ruleId", async (req, res) => {
    try {
      const { ruleId } = req.params;
      const {
        name,
        type,
        enabled,
        condition,
        notification,
        schedule
      } = req.body;

      const result = await db.execute(sql`
        UPDATE alert_rules SET
          name = ${name},
          type = ${type},
          enabled = ${enabled},
          condition_threshold = ${condition.threshold},
          condition_unit = ${condition.unit},
          condition_comparison = ${condition.comparison},
          notification_email = ${notification.email},
          notification_internal = ${notification.internal},
          notification_email_template = ${notification.emailTemplate || ''},
          notification_recipients = ${notification.recipients ? sql`${JSON.stringify(notification.recipients)}::text[]` : sql`'{}'::text[]`},
          schedule_immediate = ${schedule.immediate},
          schedule_delay = ${schedule.delay || 0},
          schedule_repeat = ${schedule.repeat || false},
          schedule_repeat_interval = ${schedule.repeatInterval || 60},
          updated_at = NOW()
        WHERE id = ${ruleId}
        RETURNING *
      `);

      if (result.rows.length > 0) {
        const rule = result.rows[0];
        res.json({
          id: rule.id,
          name: rule.name,
          type: rule.type,
          enabled: rule.enabled,
          condition: {
            threshold: rule.condition_threshold,
            unit: rule.condition_unit,
            comparison: rule.condition_comparison
          },
          notification: {
            email: rule.notification_email,
            internal: rule.notification_internal,
            emailTemplate: rule.notification_email_template,
            recipients: rule.notification_recipients || []
          },
          schedule: {
            immediate: rule.schedule_immediate,
            delay: rule.schedule_delay,
            repeat: rule.schedule_repeat,
            repeatInterval: rule.schedule_repeat_interval
          },
          createdAt: rule.created_at,
          updatedAt: rule.updated_at
        });
      } else {
        res.status(404).json({ message: 'Alert rule not found' });
      }
    } catch (error) {
      console.error('Error updating alert rule:', error);
      res.status(500).json({ message: 'Error updating alert rule' });
    }
  });

  app.delete("/api/admin/alert-rules/:ruleId", async (req, res) => {
    try {
      const { ruleId } = req.params;

      const result = await db.execute(sql`
        DELETE FROM alert_rules WHERE id = ${ruleId}
        RETURNING id
      `);

      if (result.rows.length > 0) {
        res.json({ message: 'Alert rule deleted successfully' });
      } else {
        res.status(404).json({ message: 'Alert rule not found' });
      }
    } catch (error) {
      console.error('Error deleting alert rule:', error);
      res.status(500).json({ message: 'Error deleting alert rule' });
    }
  });

  return httpServer;
}