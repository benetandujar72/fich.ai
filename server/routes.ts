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
      const hashedPassword = await bcrypt.hash(password || 'prof123', 10);
      const newUser = await storage.createUser({
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
  app.post('/api/schedule-import/preview', isAuthenticated, async (req, res) => {
    try {
      // This would normally parse the GP Untis file
      // For now, returning mock preview data
      const mockPreview = {
        teachers: [
          { code: "MAT01", name: "Maria Tur", email: "maria.tur@bitacola.edu" },
          { code: "CAT02", name: "Joan Pons", email: "joan.pons@bitacola.edu" }
        ],
        subjects: [
          { code: "MAT", name: "Matemàtiques", department: "Ciències" },
          { code: "CAT", name: "Català", department: "Llengües" }
        ],
        schedules: [
          { teacher: "MAT01", subject: "MAT", day: "Monday", startTime: "08:00", endTime: "09:00", group: "1ESO-A" }
        ],
        conflicts: []
      };
      
      res.json(mockPreview);
    } catch (error) {
      console.error("Error previewing import:", error);
      res.status(500).json({ message: "Failed to preview import" });
    }
  });

  app.post('/api/schedule-import/execute', isAuthenticated, async (req, res) => {
    try {
      // This would normally execute the actual import
      // For now, returning mock results
      const mockResults = {
        created: {
          teachers: 2,
          subjects: 5,
          schedules: 25
        },
        updated: {
          teachers: 0,
          subjects: 1,
          schedules: 3
        },
        errors: []
      };
      
      res.json(mockResults);
    } catch (error) {
      console.error("Error executing import:", error);
      res.status(500).json({ message: "Failed to execute import" });
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

  const httpServer = createServer(app);
  return httpServer;
}
