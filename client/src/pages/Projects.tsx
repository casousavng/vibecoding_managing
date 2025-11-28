import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Plus, Search, Filter, Github } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: number;
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
  team: number[];
  teamMembers: { id: number, name: string }[];
  githubLink?: string;
  techStack?: {
    frontend: string;
    backend: string;
    db: string;
    aiAgent: string;
    other: string;
  };
}

export default function Projects() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string[]>(["active", "completed", "delayed"]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter.includes(p.status);
    return matchesSearch && matchesStatus;

  });

  const toggleStatus = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage and track all deliverables.</p>
        </div>
        {(user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER") && (
          <Link href="/projects/new">
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4 bg-card/30 p-4 rounded-lg border border-white/5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects or clients..."
            className="pl-9 bg-background/50 border-white/10 focus:border-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-white/10 hover:bg-white/5 gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("active")}
              onCheckedChange={() => toggleStatus("active")}
            >
              Active
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("completed")}
              onCheckedChange={() => toggleStatus("completed")}
            >
              Completed
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("delayed")}
              onCheckedChange={() => toggleStatus("delayed")}
            >
              Delayed
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No projects found.
          </div>
        ) : (
          filteredProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="group block cursor-pointer">
                <Card className="border-white/5 bg-card/40 hover:bg-card/60 hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-6 flex items-center gap-6">
                    <div className={`w-1.5 h-12 rounded-full ${project.status === 'completed' ? 'bg-green-500' :
                      project.status === 'active' ? 'bg-blue-500' :
                        project.status === 'delayed' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div className="md:col-span-1">
                        <p className="text-xs text-primary font-mono mb-1">{project.client}</p>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{project.name}</h3>
                        {project.githubLink && (
                          <a
                            href={project.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Github className="w-3 h-3" />
                            <span>Repo</span>
                          </a>
                        )}
                      </div>

                      <div className="md:col-span-1">
                        <p className="text-xs text-muted-foreground mb-1">Timeline</p>
                        <p className="text-sm font-medium">
                          {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="md:col-span-1">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">Timeline Progress</span>
                          <span className="font-mono">{project.progress}%</span>
                        </div>
                        <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="md:col-span-1 flex justify-end items-center">
                        <div className="flex -space-x-2">
                          {project.teamMembers?.slice(0, 3).map((member) => (
                            <div key={member.id} className="px-2 py-1 rounded-md bg-secondary/50 border border-white/10 flex items-center justify-center text-xs font-medium text-foreground">
                              {member.name.split(' ')[0]}
                            </div>
                          ))}
                          {project.teamMembers && project.teamMembers.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-bold">
                              +{project.teamMembers.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
