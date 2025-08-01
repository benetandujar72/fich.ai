import { db } from "./db";
import { 
  institutions, 
  academicYears, 
  departments, 
  users, 
  employees, 
  schedules,
  settings 
} from "@shared/schema";
import type { 
  InsertInstitution, 
  InsertEmployee, 
  InsertSchedule,
  InsertSetting,
  UpsertUser
} from "@shared/schema";

// Institut Bitàcola test data for 2025-2026
export async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    // 1. Create Institut Bitàcola
    const [institution] = await db.insert(institutions).values({
      name: "Institut Bitàcola",
      address: "Carrer de l'Educació, 123, 08080 Barcelona, Catalunya",
      timezone: "Europe/Barcelona",
      defaultLanguage: "ca"
    }).returning();

    console.log(`✅ Created institution: ${institution.name}`);

    // 2. Create Academic Year 2025-2026
    const [academicYear] = await db.insert(academicYears).values({
      institutionId: institution.id,
      name: "2025-2026",
      startDate: "2025-09-15",
      endDate: "2026-06-22",
      isActive: true
    }).returning();

    console.log(`✅ Created academic year: ${academicYear.name}`);

    // 3. Create Departments
    const departmentData = [
      { name: "Matemàtiques", institutionId: institution.id },
      { name: "Llengua Catalana i Literatura", institutionId: institution.id },
      { name: "Llengua Castellana i Literatura", institutionId: institution.id },
      { name: "Anglès", institutionId: institution.id },
      { name: "Ciències Naturals", institutionId: institution.id },
      { name: "Física i Química", institutionId: institution.id },
      { name: "Història", institutionId: institution.id },
      { name: "Geografia", institutionId: institution.id },
      { name: "Educació Física", institutionId: institution.id },
      { name: "Tecnologia", institutionId: institution.id },
      { name: "Arts Plàstiques", institutionId: institution.id },
      { name: "Música", institutionId: institution.id },
      { name: "Administració", institutionId: institution.id }
    ];

    const createdDepartments = await db.insert(departments).values(departmentData).returning();
    console.log(`✅ Created ${createdDepartments.length} departments`);

    // 4. Create 20 Teachers with realistic Catalan names and data
    const teachersData: UpsertUser[] = [
      { id: "user-001", email: "marta.puig@institutbitacola.edu.cat", firstName: "Marta", lastName: "Puig Solà", role: "admin", institutionId: institution.id },
      { id: "user-002", email: "jordi.vila@institutbitacola.edu.cat", firstName: "Jordi", lastName: "Vila Martín", role: "employee", institutionId: institution.id },
      { id: "user-003", email: "carme.roca@institutbitacola.edu.cat", firstName: "Carme", lastName: "Roca Fortuny", role: "employee", institutionId: institution.id },
      { id: "user-004", email: "pere.mas@institutbitacola.edu.cat", firstName: "Pere", lastName: "Mas Ribas", role: "employee", institutionId: institution.id },
      { id: "user-005", email: "anna.font@institutbitacola.edu.cat", firstName: "Anna", lastName: "Font Casals", role: "employee", institutionId: institution.id },
      { id: "user-006", email: "david.serra@institutbitacola.edu.cat", firstName: "David", lastName: "Serra Vidal", role: "employee", institutionId: institution.id },
      { id: "user-007", email: "laura.tort@institutbitacola.edu.cat", firstName: "Laura", lastName: "Tort Camps", role: "employee", institutionId: institution.id },
      { id: "user-008", email: "xavier.pla@institutbitacola.edu.cat", firstName: "Xavier", lastName: "Pla Bosch", role: "employee", institutionId: institution.id },
      { id: "user-009", email: "montse.olive@institutbitacola.edu.cat", firstName: "Montserrat", lastName: "Olivé Rovira", role: "employee", institutionId: institution.id },
      { id: "user-010", email: "ramon.soler@institutbitacola.edu.cat", firstName: "Ramon", lastName: "Soler Pons", role: "employee", institutionId: institution.id },
      { id: "user-011", email: "teresa.mir@institutbitacola.edu.cat", firstName: "Teresa", lastName: "Mir Comas", role: "employee", institutionId: institution.id },
      { id: "user-012", email: "marc.sala@institutbitacola.edu.cat", firstName: "Marc", lastName: "Sala Ferrer", role: "employee", institutionId: institution.id },
      { id: "user-013", email: "nuria.costa@institutbitacola.edu.cat", firstName: "Núria", lastName: "Costa Blanch", role: "employee", institutionId: institution.id },
      { id: "user-014", email: "albert.torres@institutbitacola.edu.cat", firstName: "Albert", lastName: "Torres Gual", role: "employee", institutionId: institution.id },
      { id: "user-015", email: "rosa.camps@institutbitacola.edu.cat", firstName: "Rosa", lastName: "Camps Valls", role: "employee", institutionId: institution.id },
      { id: "user-016", email: "lluis.naval@institutbitacola.edu.cat", firstName: "Lluís", lastName: "Naval Puche", role: "employee", institutionId: institution.id },
      { id: "user-017", email: "pilar.julia@institutbitacola.edu.cat", firstName: "Pilar", lastName: "Julià Ribó", role: "employee", institutionId: institution.id },
      { id: "user-018", email: "enric.moya@institutbitacola.edu.cat", firstName: "Enric", lastName: "Moya Llobera", role: "employee", institutionId: institution.id },
      { id: "user-019", email: "cristina.ramos@institutbitacola.edu.cat", firstName: "Cristina", lastName: "Ramos Llull", role: "employee", institutionId: institution.id },
      { id: "user-020", email: "francesc.garcia@institutbitacola.edu.cat", firstName: "Francesc", lastName: "Garcia Miró", role: "employee", institutionId: institution.id }
    ];

    // Insert users using upsert
    const createdUsers = [];
    for (const userData of teachersData) {
      const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
        target: users.id,
        set: { ...userData, updatedAt: new Date() }
      }).returning();
      createdUsers.push(user);
    }

    console.log(`✅ Created ${createdUsers.length} users`);

    // 5. Create Employee records with realistic assignment to departments
    const employeesData: InsertEmployee[] = [
      { userId: "user-001", institutionId: institution.id, departmentId: createdDepartments[12].id, dni: "12345678A", fullName: "Marta Puig Solà", email: "marta.puig@institutbitacola.edu.cat", phone: "+34 93 123 45 67", contractType: "full_time", status: "active", startDate: "2025-09-01" },
      { userId: "user-002", institutionId: institution.id, departmentId: createdDepartments[0].id, dni: "23456789B", fullName: "Jordi Vila Martín", email: "jordi.vila@institutbitacola.edu.cat", phone: "+34 93 234 56 78", contractType: "full_time", status: "active", startDate: "2023-09-01" },
      { userId: "user-003", institutionId: institution.id, departmentId: createdDepartments[1].id, dni: "34567890C", fullName: "Carme Roca Fortuny", email: "carme.roca@institutbitacola.edu.cat", phone: "+34 93 345 67 89", contractType: "full_time", status: "active", startDate: "2022-09-01" },
      { userId: "user-004", institutionId: institution.id, departmentId: createdDepartments[2].id, dni: "45678901D", fullName: "Pere Mas Ribas", email: "pere.mas@institutbitacola.edu.cat", phone: "+34 93 456 78 90", contractType: "full_time", status: "active", startDate: "2021-09-01" },
      { userId: "user-005", institutionId: institution.id, departmentId: createdDepartments[3].id, dni: "56789012E", fullName: "Anna Font Casals", email: "anna.font@institutbitacola.edu.cat", phone: "+34 93 567 89 01", contractType: "full_time", status: "active", startDate: "2024-09-01" },
      { userId: "user-006", institutionId: institution.id, departmentId: createdDepartments[4].id, dni: "67890123F", fullName: "David Serra Vidal", email: "david.serra@institutbitacola.edu.cat", phone: "+34 93 678 90 12", contractType: "full_time", status: "active", startDate: "2020-09-01" },
      { userId: "user-007", institutionId: institution.id, departmentId: createdDepartments[5].id, dni: "78901234G", fullName: "Laura Tort Camps", email: "laura.tort@institutbitacola.edu.cat", phone: "+34 93 789 01 23", contractType: "full_time", status: "active", startDate: "2023-09-01" },
      { userId: "user-008", institutionId: institution.id, departmentId: createdDepartments[6].id, dni: "89012345H", fullName: "Xavier Pla Bosch", email: "xavier.pla@institutbitacola.edu.cat", phone: "+34 93 890 12 34", contractType: "full_time", status: "active", startDate: "2022-09-01" },
      { userId: "user-009", institutionId: institution.id, departmentId: createdDepartments[7].id, dni: "90123456I", fullName: "Montserrat Olivé Rovira", email: "montse.olive@institutbitacola.edu.cat", phone: "+34 93 901 23 45", contractType: "part_time", status: "active", startDate: "2024-09-01" },
      { userId: "user-010", institutionId: institution.id, departmentId: createdDepartments[8].id, dni: "01234567J", fullName: "Ramon Soler Pons", email: "ramon.soler@institutbitacola.edu.cat", phone: "+34 93 012 34 56", contractType: "full_time", status: "active", startDate: "2019-09-01" },
      { userId: "user-011", institutionId: institution.id, departmentId: createdDepartments[9].id, dni: "12345670K", fullName: "Teresa Mir Comas", email: "teresa.mir@institutbitacola.edu.cat", phone: "+34 93 123 45 70", contractType: "full_time", status: "active", startDate: "2023-09-01" },
      { userId: "user-012", institutionId: institution.id, departmentId: createdDepartments[10].id, dni: "23456701L", fullName: "Marc Sala Ferrer", email: "marc.sala@institutbitacola.edu.cat", phone: "+34 93 234 56 01", contractType: "full_time", status: "active", startDate: "2025-09-01" },
      { userId: "user-013", institutionId: institution.id, departmentId: createdDepartments[11].id, dni: "34567012M", fullName: "Núria Costa Blanch", email: "nuria.costa@institutbitacola.edu.cat", phone: "+34 93 345 60 12", contractType: "full_time", status: "active", startDate: "2024-09-01" },
      { userId: "user-014", institutionId: institution.id, departmentId: createdDepartments[0].id, dni: "45670123N", fullName: "Albert Torres Gual", email: "albert.torres@institutbitacola.edu.cat", phone: "+34 93 456 01 23", contractType: "part_time", status: "active", startDate: "2023-09-01" },
      { userId: "user-015", institutionId: institution.id, departmentId: createdDepartments[1].id, dni: "56701234O", fullName: "Rosa Camps Valls", email: "rosa.camps@institutbitacola.edu.cat", phone: "+34 93 567 12 34", contractType: "full_time", status: "active", startDate: "2022-09-01" },
      { userId: "user-016", institutionId: institution.id, departmentId: createdDepartments[2].id, dni: "67012345P", fullName: "Lluís Naval Puche", email: "lluis.naval@institutbitacola.edu.cat", phone: "+34 93 601 23 45", contractType: "full_time", status: "active", startDate: "2021-09-01" },
      { userId: "user-017", institutionId: institution.id, departmentId: createdDepartments[3].id, dni: "70123456Q", fullName: "Pilar Julià Ribó", email: "pilar.julia@institutbitacola.edu.cat", phone: "+34 93 012 34 67", contractType: "substitute", status: "active", startDate: "2025-01-15" },
      { userId: "user-018", institutionId: institution.id, departmentId: createdDepartments[4].id, dni: "01234568R", fullName: "Enric Moya Llobera", email: "enric.moya@institutbitacola.edu.cat", phone: "+34 93 123 45 68", contractType: "full_time", status: "active", startDate: "2020-09-01" },
      { userId: "user-019", institutionId: institution.id, departmentId: createdDepartments[5].id, dni: "12345679S", fullName: "Cristina Ramos Llull", email: "cristina.ramos@institutbitacola.edu.cat", phone: "+34 93 234 56 79", contractType: "full_time", status: "active", startDate: "2024-09-01" },
      { userId: "user-020", institutionId: institution.id, departmentId: createdDepartments[6].id, dni: "23456780T", fullName: "Francesc Garcia Miró", email: "francesc.garcia@institutbitacola.edu.cat", phone: "+34 93 345 67 80", contractType: "full_time", status: "active", startDate: "2023-09-01" }
    ];

    const createdEmployees = await db.insert(employees).values(employeesData).returning();
    console.log(`✅ Created ${createdEmployees.length} employees`);

    // 6. Create realistic schedules for teachers (Monday to Friday, different subjects)
    const scheduleData: InsertSchedule[] = [];
    
    // Standard schedule: 8:00-14:30 Monday to Friday for full-time teachers
    createdEmployees.forEach((employee, index) => {
      if (employee.contractType === "full_time") {
        for (let day = 1; day <= 5; day++) { // Monday to Friday
          scheduleData.push({
            employeeId: employee.id,
            dayOfWeek: day,
            startTime: "08:00",
            endTime: "14:30",
            isActive: true
          });
        }
      } else if (employee.contractType === "part_time") {
        // Part-time: alternate days or reduced hours
        for (let day = 1; day <= 5; day += 2) { // Monday, Wednesday, Friday
          scheduleData.push({
            employeeId: employee.id,
            dayOfWeek: day,
            startTime: "08:00",
            endTime: "12:00",
            isActive: true
          });
        }
      } else if (employee.contractType === "substitute") {
        // Substitute: flexible schedule when needed
        scheduleData.push({
          employeeId: employee.id,
          dayOfWeek: 1,
          startTime: "08:00",
          endTime: "14:30",
          isActive: false
        });
      }
    });

    const createdSchedules = await db.insert(schedules).values(scheduleData).returning();
    console.log(`✅ Created ${createdSchedules.length} schedule entries`);

    // 7. Create institution settings
    const settingsData: InsertSetting[] = [
      { institutionId: institution.id, key: "attendance_late_threshold", value: "15" }, // 15 minutes
      { institutionId: institution.id, key: "attendance_very_late_threshold", value: "30" }, // 30 minutes
      { institutionId: institution.id, key: "auto_alert_late_arrival", value: "true" },
      { institutionId: institution.id, key: "auto_alert_missing_checkout", value: "true" },
      { institutionId: institution.id, key: "notification_email_enabled", value: "true" },
      { institutionId: institution.id, key: "timezone", value: "Europe/Barcelona" },
      { institutionId: institution.id, key: "working_days", value: "1,2,3,4,5" }, // Monday to Friday
      { institutionId: institution.id, key: "substitute_auto_assignment", value: "false" }
    ];

    const createdSettings = await db.insert(settings).values(settingsData).returning();
    console.log(`✅ Created ${createdSettings.length} institution settings`);

    console.log("🎉 Database seeding completed successfully!");
    
    return {
      institution,
      academicYear,
      departments: createdDepartments,
      users: createdUsers,
      employees: createdEmployees,
      schedules: createdSchedules,
      settings: createdSettings
    };

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Function to clear existing test data before reseeding
export async function clearTestData() {
  console.log("🧹 Clearing existing test data...");
  
  try {
    // Clear in reverse order due to foreign key constraints
    await db.delete(schedules);
    await db.delete(employees);
    await db.delete(users);
    await db.delete(departments);
    await db.delete(academicYears);
    await db.delete(institutions);
    await db.delete(settings);
    
    console.log("✅ Test data cleared successfully");
  } catch (error) {
    console.error("❌ Error clearing test data:", error);
    throw error;
  }
}