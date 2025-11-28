import { db } from "./db";
import { users, projects, projectUsers } from "@shared/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Check if users already exist
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  // Create users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const pmPassword = await bcrypt.hash("pm123", 10);
  const tekkiePassword = await bcrypt.hash("tekkie123", 10);

  const [admin] = await db.insert(users).values({
    name: "Admin User",
    email: "admin@empresa.pt",
    passwordHash: adminPassword,
    role: "ADMIN",
    mustChangePassword: true,
  }).returning();

  const [pm] = await db.insert(users).values({
    name: "Project Manager",
    email: "pm@empresa.pt",
    passwordHash: pmPassword,
    role: "PROJECT_MANAGER",
    mustChangePassword: true,
  }).returning();

  const [alice] = await db.insert(users).values({
    name: "Alice Tekkie",
    email: "alice@empresa.pt",
    passwordHash: tekkiePassword,
    role: "TEKKIE",
    mustChangePassword: true,
  }).returning();

  const [bob] = await db.insert(users).values({
    name: "Bob Coder",
    email: "bob@empresa.pt",
    passwordHash: tekkiePassword,
    role: "TEKKIE",
    mustChangePassword: true,
  }).returning();

  const [charlie] = await db.insert(users).values({
    name: "Charlie Dev",
    email: "charlie@empresa.pt",
    passwordHash: tekkiePassword,
    role: "TEKKIE",
    mustChangePassword: true,
  }).returning();

  console.log("✓ Users created");

  // Create sample projects
  const [project1] = await db.insert(projects).values({
    name: "Vibe Coding Platform",
    client: "Startup X",
    startDate: new Date("2023-10-01"),
    endDate: new Date("2024-03-01"),
    manager: "Project Manager",
    requirements: "A high-energy coding platform for rapid prototyping.",
    suggestions: "Focus on dark mode and neon accents.",
    createdBy: pm.id,
    status: "active",
  }).returning();

  const [project2] = await db.insert(projects).values({
    name: "E-Commerce Redesign",
    client: "ShopifyStore",
    startDate: new Date("2023-11-15"),
    endDate: new Date("2024-01-30"),
    manager: "Project Manager",
    requirements: "Revamp the checkout flow for higher conversion.",
    suggestions: "Make it seamless and mobile-first.",
    createdBy: pm.id,
    status: "delayed",
  }).returning();

  const [project3] = await db.insert(projects).values({
    name: "Internal Dashboard",
    client: "Internal",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-06-01"),
    manager: "Admin User",
    requirements: "Tool for managing resources.",
    suggestions: "Keep it simple.",
    createdBy: admin.id,
    status: "active",
  }).returning();

  console.log("✓ Projects created");

  // Assign team members
  await db.insert(projectUsers).values([
    { projectId: project1.id, userId: pm.id },
    { projectId: project1.id, userId: alice.id },
    { projectId: project1.id, userId: bob.id },

    { projectId: project2.id, userId: pm.id },
    { projectId: project2.id, userId: charlie.id },

    { projectId: project3.id, userId: admin.id },
    { projectId: project3.id, userId: alice.id },
    { projectId: project3.id, userId: bob.id },
    { projectId: project3.id, userId: charlie.id },
  ]);

  console.log("✓ Team members assigned");
  console.log("\n✅ Seeding complete!");
  console.log("\nLogin credentials:");
  console.log("Admin: admin@empresa.pt / admin123");
  console.log("PM: pm@empresa.pt / pm123");
  console.log("Tekkie: alice@empresa.pt / tekkie123");

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
