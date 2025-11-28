import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Calendar, Users as UsersIcon, BarChart3, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: number;
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
  team: number[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects", { credentials: "include", cache: "no-store" });
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

  const activeCount = projects.filter(p => p.status === "active").length;
  const delayedCount = projects.filter(p => p.status === "delayed").length;
  const completedCount = projects.filter(p => p.status === "completed").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of all active vibe projects.</p>
        </div>
        {(user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER") && (
          <Link href="/projects/new">
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary mb-1">Active Projects</p>
              <h3 className="text-3xl font-bold">{activeCount}</h3>
            </div>
            <BarChart3 className="w-8 h-8 text-primary/50" />
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-400 mb-1">Total Projects</p>
              <h3 className="text-3xl font-bold text-blue-500">{projects.length}</h3>
            </div>
            <UsersIcon className="w-8 h-8 text-blue-500/50" />
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-400 mb-1">Completed</p>
              <h3 className="text-3xl font-bold text-green-500">{completedCount}</h3>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500/50" />
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-400 mb-1">Delayed Projects</p>
              <h3 className="text-3xl font-bold text-orange-500">{delayedCount}</h3>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-500/50" />
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          <Link href="/projects" className="text-sm text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="group hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.2)] hover:-translate-y-1 overflow-hidden relative bg-card/40 backdrop-blur-sm border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <CardContent className="p-6 space-y-4 relative z-10">
                    <div>
                      <div className="text-xs text-primary font-mono mb-1 uppercase tracking-wider">{project.client}</div>
                      <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(project.endDate).toLocaleDateString()}</span>
                      </div>
                      <Badge variant={project.status === "active" ? "default" : "destructive"}>
                        {project.status}
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Timeline Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
