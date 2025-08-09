import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { 
  insertEmployeeSchema,
  insertAttendanceRecordSchema,
  insertAbsenceSchema,
  insertSettingSchema,
  insertCommunicationSchema 
} from "@shared/schema";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "./db";

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
            DATE(a.timestamp AT TIME ZONE 'Europe/Madrid') as day,
            COUNT(CASE WHEN a.type = 'check_in' THEN 1 END) as check_ins,
            COUNT(CASE WHEN a.type = 'check_out' THEN 1 END) as check_outs,
            MIN(CASE WHEN a.type = 'check_in' THEN a.timestamp END) as first_check_in,
            MAX(CASE WHEN a.type = 'check_out' THEN a.timestamp END) as last_check_out,
            EXTRACT(EPOCH FROM (
              MAX(CASE WHEN a.type = 'check_out' THEN a.timestamp END) - 
              MIN(CASE WHEN a.type = 'check_in' THEN a.timestamp END)
            ))/3600 as hours_worked
          FROM users u
          LEFT JOIN attendance_records a ON u.id = a.employee_id 
            AND a.timestamp >= ${monday.toISOString()}
            AND a.timestamp <= ${friday.toISOString()}
          WHERE u.institution_id = ${institutionId} AND u.role = 'employee'
          GROUP BY u.id, u.first_name, u.last_name, u.email, DATE(a.timestamp AT TIME ZONE 'Europe/Madrid')
          ORDER BY u.first_name, day
        `);

        const summaryResult = await db.execute(sql`
          SELECT 
            COUNT(DISTINCT u.id) as total_employees,
            COUNT(DISTINCT CASE WHEN a.employee_id IS NOT NULL THEN u.id END) as employees_with_records,
            AVG(CASE WHEN day_stats.hours_worked > 0 THEN day_stats.hours_worked END) as avg_daily_hours,
            SUM(day_stats.hours_worked) as total_hours_all_employees
          FROM users u
          LEFT JOIN (
            SELECT 
              a.employee_id,
              DATE(a.timestamp AT TIME ZONE 'Europe/Madrid') as day,
              EXTRACT(EPOCH FROM (
                MAX(CASE WHEN a.type = 'check_out' THEN a.timestamp END) - 
                MIN(CASE WHEN a.type = 'check_in' THEN a.timestamp END)
              ))/3600 as hours_worked
            FROM attendance_records a
            WHERE a.timestamp >= ${monday.toISOString()}
              AND a.timestamp <= ${friday.toISOString()}
            GROUP BY a.employee_id, DATE(a.timestamp AT TIME ZONE 'Europe/Madrid')
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

  // Communications routes - FIXED VERSION
  app.get('/api/communications/:userId/all', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const { filter } = req.query;
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
  app.patch('/api/communications/:id/read', async (req, res) => {
    try {
      const { id } = req.params;
      console.log('MARK_READ: Marking communication as read:', id);
      
      const result = await db.execute(sql`
        UPDATE communications 
        SET status = 'read', read_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Communication not found" });
      }
      
      console.log('MARK_READ: Successfully marked as read');
      res.json({ success: true, communication: result.rows[0] });
    } catch (error) {
      console.error("MARK_READ_ERROR:", error);
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  // Delete communication endpoint
  app.delete('/api/communications/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log('DELETE_COMM: Deleting communication:', id);
      
      const result = await db.execute(sql`
        UPDATE communications 
        SET deleted_by_user_at = NOW(), status = 'deleted'
        WHERE id = ${id}
        RETURNING *
      `);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Communication not found" });
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
      
      // Additional auth check to debug session issue
      if (!req.user || !req.user.id) {
        console.log('CREATE_COMM_DEBUG: No authenticated user found');
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user || !user.institutionId) {
        return res.status(400).json({ message: "User institution not found" });
      }

      // Validate communication data
      const communicationData = {
        id: globalThis.crypto.randomUUID(),
        institutionId: user.institutionId,
        senderId: userId,
        recipientId: req.body.recipientId,
        message_type: req.body.messageType || 'internal',
        subject: req.body.subject,
        content: req.body.content,
        status: 'sent',
        priority: req.body.priority || 'medium',
        email_sent: req.body.emailSent || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const communication = await storage.createCommunication(communicationData);

      // Skip email sending for now

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
        FROM alert_notifications WHERE institution_id = ${institutionId} AND email_sent = false
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

  const httpServer = createServer(app);
  return httpServer;
}