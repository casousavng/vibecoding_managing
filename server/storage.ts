import { db } from "./db";
import { users, projects, projectUsers, projectMessages, userNotes, projectMeetings } from "@shared/schema";
import type {
  User, InsertUser,
  Project, InsertProject,
  ProjectUser, InsertProjectUser,
  ProjectMessage, InsertProjectMessage,
  UserNote, InsertUserNote,
  ProjectMeeting, InsertProjectMeeting
} from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserPassword(id: number, passwordHash: string): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;

  addUserToProject(projectId: number, userId: number): Promise<ProjectUser>;
  removeUserFromProject(projectId: number, userId: number): Promise<void>;
  getProjectUsers(projectId: number): Promise<User[]>;
  getUserProjects(userId: number): Promise<Project[]>;

  createMessage(message: InsertProjectMessage): Promise<ProjectMessage>;
  getProjectMessages(projectId: number): Promise<Array<ProjectMessage & { userName: string }>>;

  upsertUserNote(note: InsertUserNote): Promise<UserNote>;
  getUserNotes(projectId: number, userId: number): Promise<UserNote | undefined>;

  createProjectMeeting(meeting: InsertProjectMeeting): Promise<ProjectMeeting>;
  getProjectMeetings(projectId: number): Promise<ProjectMeeting[]>;
}

export class DbStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const transportIcons = ["car", "plane", "ship", "bike", "truck", "bus"];
    const randomIcon = transportIcons[Math.floor(Math.random() * transportIcons.length)];

    const [user] = await db
      .insert(users)
      .values({ ...insertUser, avatar: randomIcon })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserPassword(id: number, passwordHash: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ passwordHash, mustChangePassword: 0 })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db.update(projects).set(projectData).where(eq(projects.id, id)).returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async addUserToProject(projectId: number, userId: number): Promise<ProjectUser> {
    const [pu] = await db.insert(projectUsers).values({ projectId, userId }).returning();
    return pu;
  }

  async removeUserFromProject(projectId: number, userId: number): Promise<void> {
    await db.delete(projectUsers).where(
      and(eq(projectUsers.projectId, projectId), eq(projectUsers.userId, userId))
    );
  }

  async getProjectUsers(projectId: number): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(projectUsers)
      .innerJoin(users, eq(projectUsers.userId, users.id))
      .where(eq(projectUsers.projectId, projectId));
    return result.map((r: { user: User }) => r.user);
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    const result = await db
      .select({ project: projects })
      .from(projectUsers)
      .innerJoin(projects, eq(projectUsers.projectId, projects.id))
      .where(eq(projectUsers.userId, userId));
    return result.map((r: { project: Project }) => r.project);
  }

  async createMessage(insertMessage: InsertProjectMessage): Promise<ProjectMessage> {
    const [message] = await db.insert(projectMessages).values(insertMessage).returning();
    return message;
  }

  async getProjectMessages(projectId: number): Promise<Array<ProjectMessage & { userName: string }>> {
    const result = await db
      .select({
        id: projectMessages.id,
        projectId: projectMessages.projectId,
        userId: projectMessages.userId,
        content: projectMessages.content,
        timestamp: projectMessages.timestamp,
        userName: users.name,
      })
      .from(projectMessages)
      .innerJoin(users, eq(projectMessages.userId, users.id))
      .where(eq(projectMessages.projectId, projectId))
      .orderBy(projectMessages.timestamp);
    return result;
  }

  async upsertUserNote(note: InsertUserNote): Promise<UserNote> {
    const existing = await db
      .select()
      .from(userNotes)
      .where(and(eq(userNotes.projectId, note.projectId), eq(userNotes.userId, note.userId)));

    if (existing.length > 0) {
      const [updated] = await db
        .update(userNotes)
        .set(note)
        .where(eq(userNotes.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userNotes).values(note).returning();
      return created;
    }
  }

  async getUserNotes(projectId: number, userId: number): Promise<UserNote | undefined> {
    const [note] = await db
      .select()
      .from(userNotes)
      .where(and(eq(userNotes.projectId, projectId), eq(userNotes.userId, userId)));
    return note;
  }

  async createProjectMeeting(meeting: InsertProjectMeeting): Promise<ProjectMeeting> {
    const [created] = await db.insert(projectMeetings).values(meeting).returning();
    return created;
  }

  async getProjectMeetings(projectId: number): Promise<ProjectMeeting[]> {
    return await db
      .select()
      .from(projectMeetings)
      .where(eq(projectMeetings.projectId, projectId))
      .orderBy(projectMeetings.date);
  }
}

export const storage = new DbStorage();
