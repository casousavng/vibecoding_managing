import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["ADMIN", "PROJECT_MANAGER", "TEKKIE"] }).notNull(),
  avatar: text("avatar"),
  mustChangePassword: integer("must_change_password", { mode: "boolean" }).notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  client: text("client").notNull(),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  manager: text("manager").notNull(),
  requirements: text("requirements").notNull(),
  suggestions: text("suggestions"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedBy: integer("updated_by").references(() => users.id),
  techStack: text("tech_stack", { mode: "json" }).$type<{
    frontend: string;
    backend: string;
    db: string;
    aiAgent: string;
    other: string;
  }>(),
  status: text("status", { enum: ["active", "completed", "delayed"] }).notNull().default("active"),
  githubLink: text("github_link"),
  clientContact: text("client_contact"),
  clientPhone: text("client_phone"),
  clientEmail: text("client_email"),
  estimatedBudget: text("estimated_budget"),
});

export const insertProjectSchema = createInsertSchema(projects)
  .omit({ id: true })
  .extend({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    clientContact: z.string().optional(),
    clientPhone: z.string().optional(),
    clientEmail: z.string().optional(),
    estimatedBudget: z.string().optional(),
  });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const projectUsers = sqliteTable("project_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

export const insertProjectUserSchema = createInsertSchema(projectUsers).omit({ id: true });
export type InsertProjectUser = z.infer<typeof insertProjectUserSchema>;
export type ProjectUser = typeof projectUsers.$inferSelect;

export const projectMessages = sqliteTable("project_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const insertProjectMessageSchema = createInsertSchema(projectMessages).omit({ id: true, timestamp: true });
export type InsertProjectMessage = z.infer<typeof insertProjectMessageSchema>;
export type ProjectMessage = typeof projectMessages.$inferSelect;

export const userNotes = sqliteTable("user_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stackSuggestions: text("stack_suggestions"),
  technicalNotes: text("technical_notes"),
});

export const insertUserNoteSchema = createInsertSchema(userNotes).omit({ id: true });
export type InsertUserNote = z.infer<typeof insertUserNoteSchema>;
export type UserNote = typeof userNotes.$inferSelect;

export const projectMeetings = sqliteTable("project_meetings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  feedback: text("feedback").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const insertProjectMeetingSchema = createInsertSchema(projectMeetings).omit({ id: true, createdAt: true });
export type InsertProjectMeeting = z.infer<typeof insertProjectMeetingSchema>;
export type ProjectMeeting = typeof projectMeetings.$inferSelect;
