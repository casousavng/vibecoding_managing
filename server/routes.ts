import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import passport from "passport";
import bcrypt from "bcryptjs";
import { insertUserSchema, insertProjectSchema, insertProjectMessageSchema, insertUserNoteSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth routes
  app.post("/api/auth/login", (req, res, next) => {
    console.log("Login attempt body:", req.body);
    // Handle empty password login manually because passport-local rejects it
    // Check for falsy password (empty string, null, undefined)
    if (!req.body.password) {
      (async () => {
        try {
          const user = await storage.getUserByEmail(req.body.email);
          if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
          }
          const isValid = await bcrypt.compare("", user.passwordHash);
          if (!isValid) {
            return res.status(401).json({ message: "Invalid credentials" });
          }
          req.logIn(user as any, (err) => {
            if (err) {
              return res.status(500).json({ message: "Login failed" });
            }
            const { passwordHash, ...userWithoutPassword } = user;
            return res.json({ user: userWithoutPassword });
          });
        } catch (error) {
          next(error);
        }
      })();
      return;
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        const { passwordHash, ...userWithoutPassword } = user;
        return res.json({ user: userWithoutPassword });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const { passwordHash, ...userWithoutPassword } = req.user as any;
    res.json({ user: userWithoutPassword });
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = req.user as any;

    try {
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid current password" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, hashedPassword);
      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User routes
  app.get("/api/users", requireRole("ADMIN", "PROJECT_MANAGER"), async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const usersWithoutPasswords = allUsers.map(({ passwordHash, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", requireRole("ADMIN"), async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromError(result.error).toString() });
      }

      const hashedPassword = await bcrypt.hash(result.data.passwordHash, 10);
      const user = await storage.createUser({
        ...result.data,
        passwordHash: hashedPassword,
        mustChangePassword: true,
      });

      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/users/:id", requireRole("ADMIN"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = { ...req.body };

      if (updateData.passwordHash !== undefined) {
        updateData.passwordHash = await bcrypt.hash(updateData.passwordHash, 10);
      }

      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/users/:id", requireRole("ADMIN"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Project routes
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const projectsList = await storage.getAllProjects(); // Fetch all projects for everyone

      const projectsWithTeams = await Promise.all(
        projectsList.map(async (project) => {
          const team = await storage.getProjectUsers(project.id);
          const teamIds = team.map(u => u.id);

          const totalDays = Math.ceil(
            (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          const daysElapsed = Math.ceil(
            (Date.now() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          const progress = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));

          return {
            ...project,
            team: teamIds,
            teamMembers: team.map(({ passwordHash, ...rest }) => rest),
            progress,
          };
        })
      );

      res.json(projectsWithTeams);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const user = req.user as any;
      const team = await storage.getProjectUsers(id);
      const teamIds = team.map(u => u.id);

      if (user.role === "TEKKIE" && !teamIds.includes(user.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const messages = await storage.getProjectMessages(id);

      const totalDays = Math.ceil(
        (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysElapsed = Math.ceil(
        (Date.now() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const progress = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));

      let updatedByName = null;
      if (project.updatedBy) {
        const updater = await storage.getUser(project.updatedBy);
        updatedByName = updater?.name;
      }

      let createdByName: string | null = null;
      if (project.createdBy) {
        console.log(`Looking up creator for project ${id}, createdBy: ${project.createdBy} (type: ${typeof project.createdBy})`);
        const creator = await storage.getUser(project.createdBy);
        console.log(`Found user:`, creator);
        createdByName = creator?.name || null;
      }

      res.json({
        ...project,
        team: teamIds,
        teamMembers: team.map(({ passwordHash, ...rest }) => rest),
        messages,
        progress,
        updatedByName,
        createdByName,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/projects", requireRole("ADMIN", "PROJECT_MANAGER"), async (req, res) => {
    try {
      console.log("createProject body:", req.body);
      const { team, ...projectData } = req.body;
      const user = req.user as any;

      const result = insertProjectSchema.safeParse({
        ...projectData,
        createdBy: user.id,
      });
      if (!result.success) {
        return res.status(400).json({ message: fromError(result.error).toString() });
      }

      const project = await storage.createProject(result.data);

      if (team && Array.isArray(team)) {
        for (const userId of team) {
          await storage.addUserToProject(project.id, userId);
        }
      }

      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/projects/:id", requireRole("ADMIN", "PROJECT_MANAGER"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const { team, ...projectData } = req.body;

      const existingProject = await storage.getProject(id);
      if (!existingProject) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Only creator can edit requirements & suggestions
      if ((projectData.requirements || projectData.suggestions) && existingProject.createdBy !== user.id && user.role !== "ADMIN") {
        return res.status(403).json({ message: "Only project creator can edit requirements and suggestions" });
      }

      const project = await storage.updateProject(id, {
        ...projectData,
        updatedAt: new Date(),
        updatedBy: user.id,
      });
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (team && Array.isArray(team)) {
        const currentTeam = await storage.getProjectUsers(id);
        const currentIds = currentTeam.map(u => u.id);

        for (const userId of team) {
          if (!currentIds.includes(userId)) {
            await storage.addUserToProject(id, userId);
          }
        }

        for (const userId of currentIds) {
          if (!team.includes(userId)) {
            await storage.removeUserFromProject(id, userId);
          }
        }
      }

      // Return full project with team, messages, and progress (like GET endpoint)
      const teamMembers = await storage.getProjectUsers(id);
      const teamIds = teamMembers.map(u => u.id);
      const messages = await storage.getProjectMessages(id);

      const totalDays = Math.ceil(
        (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysElapsed = Math.ceil(
        (Date.now() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const progress = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));

      let updatedByName = null;
      if (project.updatedBy) {
        const updater = await storage.getUser(project.updatedBy);
        updatedByName = updater?.name;
      }

      res.json({
        ...project,
        team: teamIds,
        teamMembers: teamMembers.map(({ passwordHash, ...rest }) => rest),
        messages,
        progress,
        updatedByName,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/projects/:id", requireRole("ADMIN", "PROJECT_MANAGER"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Project messages
  app.post("/api/projects/:id/messages", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const user = req.user as any;

      const team = await storage.getProjectUsers(projectId);
      const teamIds = team.map(u => u.id);

      if (user.role === "TEKKIE" && !teamIds.includes(user.id)) {
        return res.status(403).json({ message: "You must be part of the project team" });
      }

      const result = insertProjectMessageSchema.safeParse({
        projectId,
        userId: user.id,
        content: req.body.content,
      });

      if (!result.success) {
        return res.status(400).json({ message: fromError(result.error).toString() });
      }

      const message = await storage.createMessage(result.data);
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/projects/:id/meetings", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const meetings = await storage.getProjectMeetings(projectId);
      res.json(meetings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/projects/:id/meetings", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { date, feedback } = req.body;

      const meeting = await storage.createProjectMeeting({
        projectId,
        date: new Date(date),
        feedback,
      });
      res.json(meeting);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User notes
  app.put("/api/projects/:projectId/notes/:userId", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = parseInt(req.params.userId);
      const currentUser = req.user as any;

      if (currentUser.role === "TEKKIE" && currentUser.id !== userId) {
        return res.status(403).json({ message: "You can only edit your own notes" });
      }

      const result = insertUserNoteSchema.safeParse({
        projectId,
        userId,
        ...req.body,
      });

      if (!result.success) {
        return res.status(400).json({ message: fromError(result.error).toString() });
      }

      const note = await storage.upsertUserNote(result.data);
      res.json(note);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/projects/:projectId/notes/:userId", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = parseInt(req.params.userId);

      const note = await storage.getUserNotes(projectId, userId);
      res.json(note || { projectId, userId, stackSuggestions: "", technicalNotes: "" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Database Configuration Routes
  app.get("/api/config/db", requireAuth, (req, res) => {
    if ((req.user as any).role !== "ADMIN") return res.sendStatus(403);
    try {
      const configPath = path.join(process.cwd(), "server", "db_config.json");
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        res.json(config);
      } else {
        res.json({ type: "local" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to load config" });
    }
  });

  app.post("/api/config/db", requireAuth, (req, res) => {
    if ((req.user as any).role !== "ADMIN") return res.sendStatus(403);
    try {
      const configPath = path.join(process.cwd(), "server", "db_config.json");
      fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
      res.json({ message: "Configuration saved" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save config" });
    }
  });

  app.get("/api/config/schema", requireAuth, (req, res) => {
    if ((req.user as any).role !== "ADMIN") return res.sendStatus(403);
    try {
      const migrationsDir = path.join(process.cwd(), "server", "migrations");
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();
      let fullSchema = "";
      for (const file of files) {
        fullSchema += `-- Migration: ${file}\n`;
        fullSchema += fs.readFileSync(path.join(migrationsDir, file), "utf-8");
        fullSchema += "\n\n";
      }
      res.setHeader("Content-Disposition", "attachment; filename=schema.sql");
      res.setHeader("Content-Type", "text/plain");
      res.send(fullSchema);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate schema" });
    }
  });

  return httpServer;
}
