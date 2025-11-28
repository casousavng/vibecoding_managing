import { z } from "zod";

// Types
export type Role = "ADMIN" | "PROJECT_MANAGER" | "TEKKIE";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Message {
  id: number;
  projectId: number;
  userId: number;
  userName: string;
  content: string;
  timestamp: string;
}

export interface Project {
  id: number;
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  progress: number; // 0-100
  status: "active" | "completed" | "delayed";
  manager: string; // Angariador
  description: string; // Requisitos funcionais
  suggestions: string;
  team: number[]; // User IDs
  messages: Message[];
}

// Mock Data
export const MOCK_USERS: User[] = [
  { id: 1, name: "Admin User", email: "admin@empresa.pt", role: "ADMIN", avatar: "https://i.pravatar.cc/150?u=1" },
  { id: 2, name: "Project Manager", email: "pm@empresa.pt", role: "PROJECT_MANAGER", avatar: "https://i.pravatar.cc/150?u=2" },
  { id: 3, name: "Alice Tekkie", email: "alice@empresa.pt", role: "TEKKIE", avatar: "https://i.pravatar.cc/150?u=3" },
  { id: 4, name: "Bob Coder", email: "bob@empresa.pt", role: "TEKKIE", avatar: "https://i.pravatar.cc/150?u=4" },
  { id: 5, name: "Charlie Dev", email: "charlie@empresa.pt", role: "TEKKIE", avatar: "https://i.pravatar.cc/150?u=5" },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 1,
    name: "Vibe Coding Platform",
    client: "Startup X",
    startDate: "2023-10-01",
    endDate: "2024-03-01",
    progress: 75,
    status: "active",
    manager: "Project Manager",
    description: "A high-energy coding platform for rapid prototyping.",
    suggestions: "Focus on dark mode and neon accents.",
    team: [2, 3, 4],
    messages: [
      { id: 1, projectId: 1, userId: 2, userName: "Project Manager", content: "Kickoff meeting went well.", timestamp: "2023-10-01T09:00:00Z" },
      { id: 2, projectId: 1, userId: 3, userName: "Alice Tekkie", content: "Frontend scaffolded.", timestamp: "2023-10-05T14:00:00Z" },
      { id: 3, projectId: 1, userId: 4, userName: "Bob Coder", content: "API endpoints connected.", timestamp: "2023-10-10T11:30:00Z" },
    ],
  },
  {
    id: 2,
    name: "E-Commerce Redesign",
    client: "ShopifyStore",
    startDate: "2023-11-15",
    endDate: "2024-01-30",
    progress: 40,
    status: "delayed",
    manager: "Project Manager",
    description: "Revamp the checkout flow for higher conversion.",
    suggestions: "Make it seamless and mobile-first.",
    team: [2, 5],
    messages: [
      { id: 4, projectId: 2, userId: 5, userName: "Charlie Dev", content: "Initial designs reviewed.", timestamp: "2023-11-16T10:00:00Z" },
    ],
  },
  {
    id: 3,
    name: "Internal Dashboard",
    client: "Internal",
    startDate: "2024-01-01",
    endDate: "2024-06-01",
    progress: 10,
    status: "active",
    manager: "Admin User",
    description: "Tool for managing resources.",
    suggestions: "Keep it simple.",
    team: [1, 3, 4, 5],
    messages: [],
  },
];
