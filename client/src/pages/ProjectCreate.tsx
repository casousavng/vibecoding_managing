import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function ProjectCreate() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [requirements, setRequirements] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [techStack, setTechStack] = useState({
    frontend: "",
    backend: "",
    db: "",
    aiAgent: "",
    other: ""
  });
  const [selectedTeam, setSelectedTeam] = useState<number[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/users", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.filter((u: User) => u.role === "TEKKIE"));
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          client,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          manager: user?.name || "Project Manager",
          requirements,
          suggestions,
          githubLink,
          clientContact,
          clientPhone,
          clientEmail,
          estimatedBudget,
          techStack,
          team: selectedTeam,
        }),
      });

      if (res.ok) {
        setLocation("/projects");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to create project");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUser = (userId: number) => {
    setSelectedTeam(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="w-full max-w-none mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
        <p className="text-muted-foreground mt-1">Create a new vibe coding initiative.</p>
      </div>

      <Card className="border-white/5 bg-card/30">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Vibe Platform V2"
                  className="bg-background/50 border-white/10"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Input
                  id="client"
                  placeholder="e.g. Startup Inc."
                  className="bg-background/50 border-white/10"
                  value={client}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClient(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background/50 border-white/10 hover:bg-white/5",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="p-6 [--cell-size:4rem] shadow-xl rounded-xl border border-border/50 [&_td]:text-lg [&_th]:text-lg [&_button]:text-lg"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background/50 border-white/10 hover:bg-white/5",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="p-6 [--cell-size:4rem] shadow-xl rounded-xl border border-border/50 [&_td]:text-lg [&_th]:text-lg [&_button]:text-lg"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {(user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER") && (
              <div className="space-y-4 border-t border-white/10 pt-4">
                <h3 className="text-sm font-medium">Client Details (Admin/PM Eyes Only)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientContact">Contact Person</Label>
                    <Input
                      id="clientContact"
                      placeholder="e.g. John Doe"
                      className="bg-background/50 border-white/10"
                      value={clientContact}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientContact(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">Phone</Label>
                    <Input
                      id="clientPhone"
                      placeholder="e.g. +351 912 345 678"
                      className="bg-background/50 border-white/10"
                      value={clientPhone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="e.g. john@example.com"
                      className="bg-background/50 border-white/10"
                      value={clientEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedBudget">Estimated Budget</Label>
                    <Input
                      id="estimatedBudget"
                      placeholder="e.g. €25,000"
                      className="bg-background/50 border-white/10"
                      value={estimatedBudget}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEstimatedBudget(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="requirements">Functional Requirements</Label>
              <Textarea
                id="requirements"
                placeholder="Describe the core functionality..."
                className="min-h-[100px] bg-background/50 border-white/10"
                value={requirements}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRequirements(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestions">Manager Suggestions</Label>
              <Textarea
                id="suggestions"
                placeholder="Any specific tech stack or vibe instructions?"
                className="min-h-[80px] bg-background/50 border-white/10"
                value={suggestions}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSuggestions(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="githubLink">GitHub Link</Label>
              <Input
                id="githubLink"
                placeholder="https://github.com/..."
                className="bg-background/50 border-white/10"
                value={githubLink}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGithubLink(e.target.value)}
              />
            </div>

            <div className="space-y-4 border-t border-white/10 pt-4">
              <h3 className="text-sm font-medium">Tech Stack</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frontend">Frontend</Label>
                  <Input
                    id="frontend"
                    placeholder="React, Vue..."
                    value={techStack.frontend}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTechStack({ ...techStack, frontend: e.target.value })}
                    className="bg-background/50 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backend">Backend</Label>
                  <Input
                    id="backend"
                    placeholder="Node, Python..."
                    value={techStack.backend}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTechStack({ ...techStack, backend: e.target.value })}
                    className="bg-background/50 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db">Database</Label>
                  <Input
                    id="db"
                    placeholder="PostgreSQL, Mongo..."
                    value={techStack.db}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTechStack({ ...techStack, db: e.target.value })}
                    className="bg-background/50 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aiAgent">AI Agent</Label>
                  <Input
                    id="aiAgent"
                    placeholder="Gemini, GPT-4..."
                    value={techStack.aiAgent}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTechStack({ ...techStack, aiAgent: e.target.value })}
                    className="bg-background/50 border-white/10"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="other">Other</Label>
                  <Input
                    id="other"
                    placeholder="Docker, AWS..."
                    value={techStack.other}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTechStack({ ...techStack, other: e.target.value })}
                    className="bg-background/50 border-white/10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Team Allocation</Label>
              {loadingUsers ? (
                <div className="p-4 text-center text-muted-foreground">Loading team members...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 rounded-lg border border-white/5 bg-background/30">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedTeam.includes(user.id)}
                        onCheckedChange={() => toggleUser(user.id)}
                      />
                      <Label
                        htmlFor={`user-${user.id}`}
                        className="text-sm font-normal cursor-pointer flex items-center gap-2"
                      >
                        {user.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <div className="text-destructive text-sm font-medium p-3 bg-destructive/10 rounded">{error}</div>}

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="ghost" onClick={() => setLocation("/projects")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 min-w-[120px]">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Project"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
