import { sql } from "drizzle-orm";
import { pgTable, text, integer, serial, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  avatar: text("avatar"),
  mustChangePassword: integer("must_change_password").notNull().default(0),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  client: text("client").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  manager: text("manager").notNull(),
  requirements: text("requirements").notNull(),
  suggestions: text("suggestions"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
  techStack: json("tech_stack").$type<{
    frontend: string;
    backend: string;
    db: string;
    aiAgent: string;
    other: string;
  }>(),
  status: text("status").notNull().default("active"),
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

export const projectUsers = pgTable("project_users", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

export const insertProjectUserSchema = createInsertSchema(projectUsers).omit({ id: true });
export type InsertProjectUser = z.infer<typeof insertProjectUserSchema>;
export type ProjectUser = typeof projectUsers.$inferSelect;

export const projectMessages = pgTable("project_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertProjectMessageSchema = createInsertSchema(projectMessages).omit({ id: true, timestamp: true });
export type InsertProjectMessage = z.infer<typeof insertProjectMessageSchema>;
export type ProjectMessage = typeof projectMessages.$inferSelect;

export const userNotes = pgTable("user_notes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stackSuggestions: text("stack_suggestions"),
  technicalNotes: text("technical_notes"),
});

export const insertUserNoteSchema = createInsertSchema(userNotes).omit({ id: true });
export type InsertUserNote = z.infer<typeof insertUserNoteSchema>;
export type UserNote = typeof userNotes.$inferSelect;

export const projectMeetings = pgTable("project_meetings", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  feedback: text("feedback").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProjectMeetingSchema = createInsertSchema(projectMeetings).omit({ id: true, createdAt: true });
export type InsertProjectMeeting = z.infer<typeof insertProjectMeetingSchema>;
export type ProjectMeeting = typeof projectMeetings.$inferSelect;
