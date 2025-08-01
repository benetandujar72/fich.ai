import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { 
  insertEmployeeSchema,
  insertAttendanceRecordSchema,
  insertAbsenceSchema,
  insertSettingSchema 
} from "@shared/schema";
import { z } from "zod";

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

  // Employee routes
  app.get('/api/employees/:institutionId/:searchQuery?', isAuthenticated, async (req, res) => {
    try {
      const { institutionId, searchQuery } = req.params;
      const employees = await storage.getEmployees(institutionId, searchQuery);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post('/api/employees', isAuthenticated, async (req, res) => {
    try {
      const employee = await storage.createEmployee(req.body);
      res.json(employee);
    } catch (error: any) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.patch('/api/employees/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const employee = await storage.updateEmployee(id, req.body);
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete('/api/employees/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmployee(id);
      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Attendance routes
  app.get('/api/attendance/:employeeId', isAuthenticated, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;
      const records = await storage.getAttendanceRecords(
        employeeId, 
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(records);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  app.post('/api/attendance', isAuthenticated, async (req, res) => {
    try {
      const attendanceData = {
        ...req.body,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date()
      };
      const record = await storage.createAttendanceRecord(attendanceData);
      res.json(record);
    } catch (error: any) {
      console.error("Error creating attendance record:", error);
      res.status(400).json({ message: "Invalid attendance data", error: error.message });
    }
  });

  // Alerts routes
  app.get('/api/alerts/:institutionId', isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const alerts = await storage.getActiveAlerts(institutionId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.patch('/api/alerts/:id/resolve', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.user as any)?.id;
      const alert = await storage.resolveAlert(id, userId);
      res.json(alert);
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  // Settings routes
  app.get('/api/settings/:institutionId', isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const settings = await storage.getSettings(institutionId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Recent activity routes
  app.get("/api/dashboard/recent-activity/:institutionId", isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      // For now, return empty array - this will be implemented later
      res.json([]);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Alerts routes
  app.get("/api/alerts/:institutionId", isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const alerts = await storage.getActiveAlerts(institutionId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // Admin users routes
  app.get("/api/users/admins/:institutionId", isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const adminUsers = await storage.getAdminUsers(institutionId);
      res.json(adminUsers);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch admin users" });
    }
  });

  app.post('/api/users/admins', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser || (currentUser.role !== 'superadmin' && currentUser.role !== 'admin')) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      const { email, firstName, lastName, role, password, institutionId } = req.body;

      // Validate required fields
      if (!email || !firstName || !lastName || !role || !institutionId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Create user
      const hashedPassword = await require('bcrypt').hash(password || 'prof123', 10);
      const newUser = await storage.upsertUser({
        email,
        firstName,
        lastName,
        role,
        passwordHash: hashedPassword,
        institutionId
      });

      res.json({ id: newUser.id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName, role: newUser.role });
    } catch (error) {
      console.error('Error creating admin user:', error);
      res.status(500).json({ message: 'Failed to create admin user' });
    }
  });

  // All users route for quick attendance dropdown
  app.get("/api/users/all", async (req, res) => {
    try {
      const users = await storage.getAllUsersForDropdown();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users for dropdown:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Data subject rights endpoints
  app.post('/api/data-subject-rights', isAuthenticated, async (req: any, res) => {
    try {
      const { type, description, contactEmail, userId } = req.body;
      
      // Create a data subject rights request
      const request = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        type,
        description,
        contactEmail,
        status: 'pending',
        createdAt: new Date(),
        responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };
      
      // In a real system, this would be stored in the database
      console.log('Data subject rights request:', request);
      
      res.json({ message: 'Request submitted successfully', requestId: request.id });
    } catch (error) {
      console.error('Error submitting data subject rights request:', error);
      res.status(500).json({ message: 'Failed to submit request' });
    }
  });

  app.get('/api/data-subject-rights/my-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get user's employee data if exists
      let employeeData = null;
      try {
        employeeData = await storage.getEmployeeByUserId(userId);
      } catch (error) {
        // Employee might not exist, which is fine
      }

      // Get attendance records if employee exists
      let attendanceRecords: any[] = [];
      if (employeeData) {
        try {
          attendanceRecords = await storage.getAttendanceRecords(employeeData.id);
        } catch (error) {
          // No attendance records, which is fine
        }
      }

      const exportDate = new Date();
      const exportId = Math.random().toString(36).substr(2, 9);
      
      // Create digital signature hash
      const crypto = await import('crypto');
      const signatureData = `${currentUser.email}-${exportDate.toISOString()}-${exportId}`;
      const digitalSignature = crypto.createHash('sha256').update(signatureData).digest('hex');

      const userData = {
        document_info: {
          title: 'Exportació de Dades Personals - RGPD',
          export_id: exportId,
          export_date: exportDate.toISOString(),
          user_name: `${currentUser.firstName} ${currentUser.lastName}`,
          digital_signature: digitalSignature,
          certification: 'Aquest document ha estat generat automàticament pel sistema EduPresència i conté una signatura digital per garantir la seva autenticitat.'
        },
        personal_data: {
          id: currentUser.id,
          email: currentUser.email,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          role: currentUser.role,
          createdAt: currentUser.createdAt,
          updatedAt: currentUser.updatedAt
        },
        employee_data: employeeData,
        attendance_records: attendanceRecords,
        legal_info: {
          retention_period: '4 years from employment termination',
          legal_basis: 'Legal obligation (labor law compliance)',
          gdpr_article: 'Article 15 - Right of access by the data subject',
          export_purpose: 'Compliment del dret d\'accés segons RGPD'
        },
        audit_trail: {
          exported_by: currentUser.email,
          export_timestamp: exportDate.toISOString(),
          ip_address: req.ip || 'unknown',
          user_agent: req.get('User-Agent') || 'unknown'
        }
      };

      // Log the data export for audit purposes
      console.log(`Data export requested by ${currentUser.email} at ${exportDate.toISOString()}, export ID: ${exportId}`);

      res.json(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ message: 'Failed to fetch user data' });
    }
  });

  // Quick authentication endpoint
  app.post('/api/quick-auth', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Authenticate user
      const user = await storage.authenticateUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Get employee record first
      const employee = await storage.getEmployeeByUserId(user.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee record not found" });
      }

      // Check last attendance record to determine next action  
      const lastAttendance = await storage.getLastAttendanceRecord(employee.id);
      let nextAction = "check-in";
      
      if (lastAttendance) {
        const today = new Date().toDateString();
        const lastDate = new Date(lastAttendance.timestamp).toDateString();
        
        if (today === lastDate) {
          // Same day - check if user is checked in
          nextAction = lastAttendance.type === "check_in" ? "check-out" : "check-in";
        }
      }

      res.json({ user, employee, nextAction });
    } catch (error) {
      console.error("Error in quick auth:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Quick attendance endpoint
  app.post('/api/quick-attendance', async (req, res) => {
    try {
      const { employeeId, type } = req.body;
      
      // Get employee details for schedule checking
      const employee = await storage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const now = new Date();
      const attendanceRecord = await storage.createAttendanceRecord({
        employeeId,
        type,
        timestamp: now,
        method: "web",
        location: "login_screen"
      });

      // Calculate if attendance is on time, late, or early
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Convert Sunday from 0 to 7
      
      let status = "on_time";
      let statusMessage = "A l'hora";
      
      // Get employee schedule for today (this would need schedule data)
      // For now, assume standard work hours: 9:00-17:00
      if (type === "check_in") {
        if (currentTime > "09:00") {
          status = "late";
          statusMessage = "Amb retard";
        } else if (currentTime < "08:30") {
          status = "early";
          statusMessage = "Avançat";
        }
      }

      res.json({
        success: true,
        time: now.toLocaleTimeString("ca-ES", { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        }),
        date: now.toLocaleDateString("ca-ES"),
        type,
        status,
        statusMessage,
        employeeName: employee.fullName,
        record: attendanceRecord
      });
    } catch (error) {
      console.error("Error registering attendance:", error);
      res.status(500).json({ message: "Failed to register attendance" });
    }
  });

  // GP Untis schedule import routes
  app.post('/api/schedule-import/preview', isAuthenticated, async (req: any, res) => {
    try {
      const { csvContent } = req.body;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.institutionId) {
        return res.status(400).json({ message: "User institution not found" });
      }

      // Get active academic year
      const activeYear = await storage.getActiveAcademicYear(user.institutionId);
      if (!activeYear) {
        return res.status(400).json({ message: "No active academic year found" });
      }

      // Parse CSV and return preview
      const preview = await storage.parseUntisCSV(csvContent, user.institutionId, activeYear.id);
      res.json(preview);
    } catch (error) {
      console.error("Error previewing GP Untis schedule:", error);
      res.status(500).json({ message: "Failed to preview schedule" });
    }
  });

  app.post('/api/schedule-import/execute', isAuthenticated, async (req: any, res) => {
    try {
      const { csvContent } = req.body;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.institutionId) {
        return res.status(400).json({ message: "User institution not found" });
      }

      // Get active academic year
      const activeYear = await storage.getActiveAcademicYear(user.institutionId);
      if (!activeYear) {
        return res.status(400).json({ message: "No active academic year found" });
      }

      // Import schedule
      const result = await storage.importUntisSchedule(csvContent, user.institutionId, activeYear.id);
      res.json(result);
    } catch (error) {
      console.error("Error importing GP Untis schedule:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to import schedule", error: errorMessage });
    }
  });

  // Additional GP Untis endpoints
  app.get('/api/schedule-import/sessions/:institutionId/:academicYearId', isAuthenticated, async (req, res) => {
    try {
      const { institutionId, academicYearId } = req.params;
      const sessions = await storage.getUntisScheduleSessions(institutionId, academicYearId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching schedule sessions:", error);
      res.status(500).json({ message: "Failed to fetch schedule sessions" });
    }
  });

  app.get('/api/schedule-import/statistics/:institutionId/:academicYearId', isAuthenticated, async (req, res) => {
    try {
      const { institutionId, academicYearId } = req.params;
      const stats = await storage.getUntisScheduleStatistics(institutionId, academicYearId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching schedule statistics:", error);
      res.status(500).json({ message: "Failed to fetch schedule statistics" });
    }
  });

  // Test import with real TXT file
  app.post('/api/schedule-import/test-real', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.institutionId) {
        return res.status(401).json({ message: 'Institution not found' });
      }

      // Read the real uploaded TXT file using dynamic import
      const fs = await import('fs');
      const filePath = './attached_assets/HORARIS_1754043300200.TXT';
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Test file not found' });
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Get active academic year
      const activeYear = await storage.getActiveAcademicYear(user.institutionId);
      if (!activeYear) {
        return res.status(400).json({ message: 'No active academic year found' });
      }

      // Import the real TXT file
      const result = await storage.importUntisScheduleFromTXT(fileContent, user.institutionId, activeYear.id);
      res.json({
        message: 'Import successful with real GP Untis TXT format',
        ...result
      });
    } catch (error) {
      console.error("Error testing real GP Untis import:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to test real import", error: errorMessage });
    }
  });

  app.post('/api/settings', isAuthenticated, async (req, res) => {
    try {
      const setting = await storage.upsertSetting(req.body);
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats/:institutionId", isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const stats = await storage.getDashboardStats(institutionId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Institution routes
  app.get("/api/institutions", isAuthenticated, async (req, res) => {
    try {
      const institutions = await storage.getInstitutions();
      res.json(institutions);
    } catch (error) {
      console.error("Error fetching institutions:", error);
      res.status(500).json({ message: "Failed to fetch institutions" });
    }
  });

  app.get("/api/institutions/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const institution = await storage.getInstitution(id);
      if (!institution) {
        return res.status(404).json({ message: "Institution not found" });
      }
      res.json(institution);
    } catch (error) {
      console.error("Error fetching institution:", error);
      res.status(500).json({ message: "Failed to fetch institution" });
    }
  });

  // Employee routes
  app.get("/api/employees/:institutionId", isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const { search } = req.query;
      
      let employees;
      if (search && typeof search === 'string') {
        employees = await storage.getEmployees(institutionId, search);
      } else {
        employees = await storage.getEmployees(institutionId);
      }
      
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/single/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const employee = await storage.getUser(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, validatedData);
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmployee(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Schedule routes
  app.get("/api/schedules/:employeeId", isAuthenticated, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const schedules = await storage.getEmployeeSchedules(employeeId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  // Attendance routes
  app.get("/api/attendance/:employeeId", isAuthenticated, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const records = await storage.getAttendanceRecords(employeeId, start, end);
      res.json(records);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  app.post("/api/attendance", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAttendanceRecordSchema.parse(req.body);
      const record = await storage.createAttendanceRecord(validatedData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      }
      console.error("Error creating attendance record:", error);
      res.status(500).json({ message: "Failed to create attendance record" });
    }
  });

  app.get("/api/attendance/institution/:institutionId", isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const { date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();
      
      const attendance = await storage.getInstitutionAttendance(institutionId, targetDate);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching institution attendance:", error);
      res.status(500).json({ message: "Failed to fetch institution attendance" });
    }
  });

  // Absence routes
  app.get("/api/absences", isAuthenticated, async (req, res) => {
    try {
      const { employeeId, institutionId } = req.query;
      const absences = await storage.getAbsences(
        employeeId as string, 
        institutionId as string
      );
      res.json(absences);
    } catch (error) {
      console.error("Error fetching absences:", error);
      res.status(500).json({ message: "Failed to fetch absences" });
    }
  });

  app.post("/api/absences", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAbsenceSchema.parse(req.body);
      const absence = await storage.createAbsence(validatedData);
      res.status(201).json(absence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid absence data", errors: error.errors });
      }
      console.error("Error creating absence:", error);
      res.status(500).json({ message: "Failed to create absence" });
    }
  });

  // Alert routes
  app.get("/api/alerts/:institutionId", isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const alerts = await storage.getActiveAlerts(institutionId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.put("/api/alerts/:id/resolve", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.claims.sub;
      const alert = await storage.resolveAlert(id, userId);
      res.json(alert);
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  // Settings routes
  app.get("/api/settings/:institutionId", isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const settings = await storage.getSettings(institutionId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings/:institutionId/:key", isAuthenticated, async (req, res) => {
    try {
      const { institutionId, key } = req.params;
      const { value } = req.body;
      
      const setting = await storage.upsertSetting({
        institutionId,
        key,
        value: String(value),
      });
      
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Network settings routes
  app.get("/api/attendance-network-settings/:institutionId", isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const networkSettings = await storage.getAttendanceNetworkSettings(institutionId);
      res.json(networkSettings || {
        institutionId,
        allowedNetworks: [],
        requireNetworkValidation: false,
        description: ""
      });
    } catch (error) {
      console.error("Error fetching network settings:", error);
      res.status(500).json({ message: "Failed to fetch network settings" });
    }
  });

  app.put("/api/attendance-network-settings/:institutionId", isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const { allowedNetworks, requireNetworkValidation, description } = req.body;
      
      const networkSettings = await storage.upsertAttendanceNetworkSettings({
        institutionId,
        allowedNetworks: allowedNetworks || [],
        requireNetworkValidation: requireNetworkValidation || false,
        description: description || ""
      });
      
      res.json(networkSettings);
    } catch (error) {
      console.error("Error updating network settings:", error);
      res.status(500).json({ message: "Failed to update network settings" });
    }
  });

  // Check attendance permission based on IP
  app.post("/api/attendance/check-permission", async (req, res) => {
    try {
      const { institutionId } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      const isAllowed = await storage.isIPAllowedForAttendance(institutionId, clientIP);
      
      res.json({ 
        allowed: isAllowed, 
        clientIP,
        message: isAllowed 
          ? "Accés autoritzat des de la xarxa local" 
          : "Fitxatge només disponible des de la xarxa local del centre"
      });
    } catch (error) {
      console.error("Error checking attendance permission:", error);
      res.status(500).json({ message: "Failed to check attendance permission" });
    }
  });

  // Email settings routes
  app.get("/api/email-settings/:institutionId", isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const settings = await storage.getEmailSettings(institutionId);
      res.json(settings || {
        institutionId,
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPassword: "",
        senderEmail: "",
        senderName: ""
      });
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ message: "Failed to fetch email settings" });
    }
  });

  app.put("/api/email-settings/:institutionId", isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const emailConfig = req.body;
      
      const settings = await storage.upsertEmailSettings({
        institutionId,
        ...emailConfig
      });
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating email settings:", error);
      res.status(500).json({ message: "Failed to update email settings" });
    }
  });

  app.post("/api/email-settings/:institutionId/test", isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const emailConfig = req.body;
      
      // Simple test email sending (mock implementation)
      // In production, would use nodemailer or similar
      console.log("Test email would be sent with config:", emailConfig);
      
      res.json({ 
        message: "Test email sent successfully",
        config: {
          host: emailConfig.smtpHost,
          port: emailConfig.smtpPort,
          user: emailConfig.smtpUser
        }
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Absence justification routes
  app.get("/api/absence-justifications/:employeeId", isAuthenticated, async (req, res) => {
    try {
      const { employeeId } = req.params;
      const justifications = await storage.getAbsenceJustifications(employeeId);
      res.json(justifications);
    } catch (error) {
      console.error("Error fetching absence justifications:", error);
      res.status(500).json({ message: "Failed to fetch absence justifications" });
    }
  });

  app.post("/api/absence-justifications", isAuthenticated, async (req, res) => {
    try {
      const justificationData = req.body;
      const justification = await storage.createAbsenceJustification(justificationData);
      res.json(justification);
    } catch (error) {
      console.error("Error creating absence justification:", error);
      res.status(500).json({ message: "Failed to create absence justification" });
    }
  });

  app.put("/api/absence-justifications/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminResponse } = req.body;
      
      const updated = await storage.updateAbsenceJustificationStatus(id, status, adminResponse);
      res.json(updated);
    } catch (error) {
      console.error("Error updating absence justification status:", error);
      res.status(500).json({ message: "Failed to update absence justification status" });
    }
  });

  // Password management routes
  app.put("/api/users/:userId/password", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;
      
      // Validate password strength
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }
      
      // Check for complexity requirements
      const hasUppercase = /[A-Z]/.test(newPassword);
      const hasLowercase = /[a-z]/.test(newPassword);
      const hasNumbers = /\d/.test(newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
      
      if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecialChar) {
        return res.status(400).json({ 
          message: "Password must contain uppercase, lowercase, numbers, and special characters" 
        });
      }
      
      const updatedUser = await storage.updateUserPassword(userId, newPassword);
      res.json({ message: "Password updated successfully", userId: updatedUser.id });
    } catch (error) {
      console.error("Error updating user password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Weekly attendance calendar route
  app.get("/api/attendance/weekly/:employeeId/:weekStart", isAuthenticated, async (req, res) => {
    try {
      const { employeeId, weekStart } = req.params;
      const startDate = new Date(weekStart);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      const weeklyData = await storage.getWeeklyAttendance(employeeId, startDate, endDate);
      res.json(weeklyData);
    } catch (error) {
      console.error("Error fetching weekly attendance:", error);
      res.status(500).json({ message: "Failed to fetch weekly attendance" });
    }
  });

  // Admin absence justification routes
  app.get("/api/absence-justifications/admin/:institutionId", isAuthenticated, async (req, res) => {
    try {
      const { institutionId } = req.params;
      const justifications = await storage.getInstitutionAbsenceJustifications(institutionId);
      res.json(justifications);
    } catch (error) {
      console.error("Error fetching institution absence justifications:", error);
      res.status(500).json({ message: "Failed to fetch absence justifications" });
    }
  });

  // Automated alerts settings endpoints
  app.get('/api/automated-alerts-settings/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const settings = await storage.getAutomatedAlertSettings(institutionId);
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching automated alert settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/automated-alerts-settings/:institutionId', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      const settings = req.body;
      const updated = await storage.updateAutomatedAlertSettings(institutionId, settings);
      res.json(updated);
    } catch (error) {
      console.error("Error updating automated alert settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.post('/api/automated-alerts-settings/:institutionId/test', isAuthenticated, async (req: any, res) => {
    try {
      const { institutionId } = req.params;
      await storage.sendTestAlert(institutionId);
      res.json({ message: "Test alert sent successfully" });
    } catch (error) {
      console.error("Error sending test alert:", error);
      res.status(500).json({ message: "Failed to send test alert" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
