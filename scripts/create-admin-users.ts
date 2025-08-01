import bcrypt from "bcrypt";
import { db } from "../server/db";
import { users, institutions } from "../shared/schema";
import { eq } from "drizzle-orm";

async function createAdminUsers() {
  console.log("🔐 Creating admin users...");

  try {
    // Get Institut Bitàcola
    const [institution] = await db.select().from(institutions).where(eq(institutions.name, "Institut Bitàcola"));
    
    if (!institution) {
      console.error("❌ Institut Bitàcola not found. Please run seeding first.");
      return;
    }

    // Create superadmin user
    const superAdminPassword = await bcrypt.hash("admin123", 10);
    const [superAdmin] = await db.insert(users).values({
      id: crypto.randomUUID(),
      email: "admin@bitacola.edu",
      firstName: "Super",
      lastName: "Admin",
      passwordHash: superAdminPassword,
      role: "superadmin",
      institutionId: institution.id
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash: superAdminPassword,
        role: "superadmin",
        updatedAt: new Date()
      }
    }).returning();

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const [admin] = await db.insert(users).values({
      id: crypto.randomUUID(),
      email: "director@bitacola.edu",
      firstName: "Maria",
      lastName: "Director",
      passwordHash: adminPassword,
      role: "admin", 
      institutionId: institution.id
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash: adminPassword,
        role: "admin",
        updatedAt: new Date()
      }
    }).returning();

    // Create employee user  
    const employeePassword = await bcrypt.hash("employee123", 10);
    const [employee] = await db.insert(users).values({
      id: crypto.randomUUID(),
      email: "profesor@bitacola.edu",
      firstName: "Joan",
      lastName: "Professor",
      passwordHash: employeePassword,
      role: "employee",
      institutionId: institution.id
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash: employeePassword,
        role: "employee", 
        updatedAt: new Date()
      }
    }).returning();

    console.log("✅ Admin users created successfully:");
    console.log(`
🔑 LOGIN CREDENTIALS:

👑 SUPERADMIN:
   Email: admin@bitacola.edu
   Password: admin123
   
👔 ADMIN (Director):
   Email: director@bitacola.edu
   Password: admin123
   
👨‍🏫 EMPLOYEE (Professor):
   Email: profesor@bitacola.edu  
   Password: employee123

🎯 Use these credentials to test the authentication system!
    `);

  } catch (error) {
    console.error("❌ Error creating admin users:", error);
  }
}

// Run the script
createAdminUsers();