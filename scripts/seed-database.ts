#!/usr/bin/env tsx

// Database seeding script for Institut Bitàcola
// Usage: npm run seed or tsx scripts/seed-database.ts

import { seedDatabase, clearTestData } from "../server/seed";

async function main() {
  const shouldClear = process.argv.includes("--clear");
  
  try {
    if (shouldClear) {
      await clearTestData();
    }
    
    await seedDatabase();
    
    console.log("\n🎯 Database seeding summary:");
    console.log("- Institution: Institut Bitàcola created");
    console.log("- Academic Year: 2025-2026 active");
    console.log("- 20 realistic teachers with Catalan names");
    console.log("- 13 departments covering all subjects");
    console.log("- Realistic schedules and settings configured");
    console.log("- Ready for production testing!");
    
  } catch (error) {
    console.error("Failed to seed database:", error);
    process.exit(1);
  }
}

main();