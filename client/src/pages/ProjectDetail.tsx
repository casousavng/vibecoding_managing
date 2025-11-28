import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { Calendar, CheckCircle2, Clock, Send, Edit2, X, Check, PanelRightClose, PanelRightOpen, RotateCcw, User, Phone, Mail, DollarSign, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Project {
  id: number;
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  manager: string;
  requirements: string;
  suggestions: string;
  createdBy: number;
  createdByName?: string;
  updatedAt?: string;
  updatedBy?: number;
  updatedByName?: string;
  team: number[];
  teamMembers: { id: number, name: string, role: string }[];
  messages: any[];
  progress: number;
  status: string;
  githubLink?: string;
  clientContact?: string;
  clientPhone?: string;
  clientEmail?: string;
  estimatedBudget?: string;
  techStack?: {
    frontend: string;
    backend: string;
    db: string;
    aiAgent: string;
    other: string;
  };
}

interface Message {
  id: number;
  projectId: number;
  userId: number;
  content: string;
  timestamp: string;
  userName: string;
}

interface ProjectMeeting {
  id: number;
  projectId: number;
  date: string;
  feedback: string;
}

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params ? parseInt(params.id) : 0;
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editRequirements, setEditRequirements] = useState("");
  const [editSuggestions, setEditSuggestions] = useState("");
  const [editGithubLink, setEditGithubLink] = useState("");
  const [editClientContact, setEditClientContact] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editEstimatedBudget, setEditEstimatedBudget] = useState("");
  const [editTechStack, setEditTechStack] = useState({
    frontend: "",
    backend: "",
    db: "",
    aiAgent: "",
    other: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTechStackEditing, setIsTechStackEditing] = useState(false);
  const [isTeamEditing, setIsTeamEditing] = useState(false);
  const [allUsers, setAllUsers] = useState<{ id: number, name: string, role: string }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number[]>([]);
  const [isClientDetailsEditing, setIsClientDetailsEditing] = useState(false);
  const [meetings, setMeetings] = useState<ProjectMeeting[]>([]);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [newMeetingDate, setNewMeetingDate] = useState("");
  const [newMeetingFeedback, setNewMeetingFeedback] = useState("");

  const loadMeetings = async () => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/meetings`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (err) {
      console.error("Failed to load meetings:", err);
    }
  };

  const handleSaveMeeting = async () => {
    if (!project || !newMeetingDate || !newMeetingFeedback) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsSaving(true);

    try {
      const res = await fetch(`/api/projects/${project.id}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: newMeetingDate,
          feedback: newMeetingFeedback,
        }),
      });

      if (res.ok) {
        await loadMeetings();
        setIsMeetingDialogOpen(false);
        setNewMeetingDate("");
        setNewMeetingFeedback("");
        toast.success("Meeting saved successfully");
      } else {
        const errorData = await res.json();
        console.error("Failed to save meeting:", errorData);
        toast.error(`Failed to save meeting: ${errorData.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to save meeting:", err);
      toast.error("An error occurred while saving the meeting");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (project) {
      loadMeetings();
    }
  }, [project]);

  const handleSaveClientDetails = async () => {
    if (!project) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          clientContact: editClientContact,
          clientPhone: editClientPhone,
          clientEmail: editClientEmail,
          estimatedBudget: editEstimatedBudget,
        }),
      });

      if (res.ok) {
        const updatedProject = await res.json();
        setProject(updatedProject);
        setIsClientDetailsEditing(false);
      }
    } catch (err) {
      console.error("Failed to save client details:", err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isTeamEditing) {
      loadUsers();
      setSelectedTeam(project?.team || []);
    }
  }, [isTeamEditing]);

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/users", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const handleSaveTeam = async () => {
    if (!project) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          team: selectedTeam,
        }),
      });

      if (res.ok) {
        const updatedProject = await res.json();
        setProject(updatedProject);
        setIsTeamEditing(false);
      }
    } catch (err) {
      console.error("Failed to save team:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTechStack = async () => {
    if (!project) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          techStack: editTechStack,
        }),
      });

      if (res.ok) {
        const updatedProject = await res.json();
        setProject(updatedProject);
        setIsTechStackEditing(false);
      }
    } catch (err) {
      console.error("Failed to save tech stack:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTeamMember = (userId: number) => {
    setSelectedTeam(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setMessages(data.messages || []);
        setEditRequirements(data.requirements);
        setEditSuggestions(data.suggestions || "");
        setEditGithubLink(data.githubLink || "");
        setEditClientContact(data.clientContact || "");
        setEditClientPhone(data.clientPhone || "");
        setEditClientEmail(data.clientEmail || "");
        setEditEstimatedBudget(data.estimatedBudget || "");
        setEditTechStack(data.techStack || { frontend: "", backend: "", db: "", aiAgent: "", other: "" });
      }
    } catch (err) {
      console.error("Failed to load project:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !project) return;

    try {
      const res = await fetch(`/api/projects/${project.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages([...messages, { ...msg, userName: user.name }]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleSaveEdits = async () => {
    if (!project) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          requirements: editRequirements,
          suggestions: editSuggestions,
          githubLink: editGithubLink,
          clientContact: editClientContact,
          clientPhone: editClientPhone,
          clientEmail: editClientEmail,
          estimatedBudget: editEstimatedBudget,
          techStack: editTechStack,
        }),
      });

      if (res.ok) {
        const updatedProject = await res.json();
        setProject(updatedProject);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to save edits:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!project) return;
    const newStatus = project.status === 'completed' ? 'active' : 'completed';

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updatedProject = await res.json();
        setProject(updatedProject);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading project...</div>;
  }

  if (!project) {
    return <div className="text-center py-12 text-destructive">Project not found</div>;
  }

  const isTeamMember = user && (project.team.includes(user.id) || user.role === "ADMIN" || user.role === "PROJECT_MANAGER");
  const isCreator = user?.id === project.createdBy;
  const updatedDate = project.updatedAt ? new Date(project.updatedAt) : null;

  console.log("Project data in render:", project);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="border-primary/30 text-primary uppercase tracking-wider">
              {project.client}
            </Badge>
            <Badge className={project.status === 'active' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400'}>
              {project.status}
            </Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">{project.name}</h1>
          <p className="text-muted-foreground max-w-2xl">{project.requirements}</p>
        </div>

        <div className="flex gap-2">
          {(user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER") && (
            <Button
              variant={project.status === 'completed' ? "outline" : "default"}
              size="sm"
              onClick={handleToggleStatus}
              className={project.status === 'completed' ? "border-green-500 text-green-500 hover:bg-green-500/10" : "bg-green-600 hover:bg-green-700"}
            >
              {project.status === 'completed' ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Mark as Active
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Completed
                </>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-muted-foreground hover:text-foreground gap-2"
            title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          >
            {isSidebarOpen ? (
              <>
                <span className="text-sm">Hide Sidebar</span>
                <PanelRightClose className="w-5 h-5" />
              </>
            ) : (
              <>
                <span className="text-sm">Show Sidebar</span>
                <PanelRightOpen className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        <div className={`space-y-8 transition-all duration-300 ${isSidebarOpen ? 'w-2/3' : 'w-full'}`}>
          <Card className="bg-card/30 border-white/5">
            <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Start Date</div>
                <div className="font-mono flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {new Date(project.startDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deadline</div>
                <div className="font-mono flex items-center gap-2">
                  <Clock className="w-4 h-4 text-destructive" />
                  {new Date(project.endDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Timeline</div>
                <div className="font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {project.progress}%
                </div>
              </div>
              {project.createdByName && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created By</div>
                  <div className="font-mono flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    {project.createdByName}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {(user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER") && (
            <Card className="bg-card/30 border-white/5">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Client Details
                  <Badge variant="outline" className="ml-2 text-xs font-normal text-muted-foreground border-white/10">Admin/PM Eyes Only</Badge>
                </CardTitle>
                {!isClientDetailsEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsClientDetailsEditing(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isClientDetailsEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="clientContact" className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4" /> Contact Person
                        </Label>
                        <Input
                          id="clientContact"
                          value={editClientContact}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditClientContact(e.target.value)}
                          className="bg-background/50 border-white/10"
                          placeholder="Enter contact name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clientPhone" className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" /> Phone
                        </Label>
                        <Input
                          id="clientPhone"
                          value={editClientPhone}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditClientPhone(e.target.value)}
                          className="bg-background/50 border-white/10"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clientEmail" className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" /> Email
                        </Label>
                        <Input
                          id="clientEmail"
                          value={editClientEmail}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditClientEmail(e.target.value)}
                          className="bg-background/50 border-white/10"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estimatedBudget" className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="w-4 h-4" /> Estimated Budget
                        </Label>
                        <Input
                          id="estimatedBudget"
                          value={editEstimatedBudget}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditEstimatedBudget(e.target.value)}
                          className="bg-background/50 border-white/10"
                          placeholder="Enter budget amount"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setIsClientDetailsEditing(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveClientDetails}
                        disabled={isSaving}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-background/20 p-4 rounded-lg border border-white/5">
                      <span className="text-muted-foreground flex items-center gap-2 mb-2 text-sm">
                        <User className="w-4 h-4" /> Contact Person
                      </span>
                      <span className="font-medium text-lg block pl-6">{project.clientContact || "N/A"}</span>
                    </div>
                    <div className="bg-background/20 p-4 rounded-lg border border-white/5">
                      <span className="text-muted-foreground flex items-center gap-2 mb-2 text-sm">
                        <Phone className="w-4 h-4" /> Phone
                      </span>
                      <span className="font-medium text-lg block pl-6">{project.clientPhone || "N/A"}</span>
                    </div>
                    <div className="bg-background/20 p-4 rounded-lg border border-white/5">
                      <span className="text-muted-foreground flex items-center gap-2 mb-2 text-sm">
                        <Mail className="w-4 h-4" /> Email
                      </span>
                      <span className="font-medium text-lg block pl-6">{project.clientEmail || "N/A"}</span>
                    </div>
                    <div className="bg-background/20 p-4 rounded-lg border border-white/5">
                      <span className="text-muted-foreground flex items-center gap-2 mb-2 text-sm">
                        <DollarSign className="w-4 h-4" /> Estimated Budget
                      </span>
                      <span className="font-medium text-lg block pl-6">{project.estimatedBudget || "N/A"}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}


          <Card className="bg-card/30 border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Requirements & Suggestions</CardTitle>
              {(isCreator || user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER") && !isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-semibold text-foreground block">Functional Requirements:</label>
                    <Textarea
                      value={editRequirements}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditRequirements(e.target.value)}
                      className="min-h-[100px] bg-background/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-semibold text-foreground block">Suggestions:</label>
                    <Textarea
                      value={editSuggestions}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditSuggestions(e.target.value)}
                      className="min-h-[80px] bg-background/50 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-semibold text-foreground block">GitHub Link:</label>
                    <Input
                      value={editGithubLink}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditGithubLink(e.target.value)}
                      className="bg-background/50 border-white/10"
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEdits}
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Check className="w-4 h-4 mr-2" /> Save Changes
                    </Button>
                  </div>
                </div>

              ) : (
                <>
                  <div>
                    <span className="font-semibold text-foreground block mb-1">Functional Requirements:</span>
                    {project.requirements}
                  </div>
                  {project.suggestions && (
                    <div className="p-3 bg-primary/5 border border-primary/10 rounded-md">
                      <span className="font-semibold text-primary block mb-1">Suggestions:</span>
                      {project.suggestions}
                    </div>
                  )}
                  {project.githubLink && (
                    <div className="p-3 bg-secondary/10 border border-white/5 rounded-md flex items-center gap-2">
                      <span className="font-semibold text-foreground">GitHub:</span>
                      <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                        {project.githubLink}
                      </a>
                    </div>
                  )}
                  {updatedDate && (
                    <div className="text-xs text-muted-foreground border-t border-white/5 pt-3 mt-4">
                      Last updated {updatedDate.toLocaleDateString()} at {updatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {project.updatedByName && <span className="ml-1">by {project.updatedByName}</span>}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {
          isSidebarOpen && (
            <div className="w-1/3 space-y-8 animate-in slide-in-from-right-10 duration-300">
              <Card className="bg-card/30 border-white/5">
                <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Tech Stack</CardTitle>
                  {(isCreator || user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER") && !isTechStackEditing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsTechStackEditing(true)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-4">
                  {isTechStackEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Frontend</Label>
                          <Input
                            value={editTechStack.frontend}
                            onChange={(e) => setEditTechStack({ ...editTechStack, frontend: e.target.value })}
                            className="bg-background/50 border-white/10"
                            placeholder="React, Vue..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Backend</Label>
                          <Input
                            value={editTechStack.backend}
                            onChange={(e) => setEditTechStack({ ...editTechStack, backend: e.target.value })}
                            className="bg-background/50 border-white/10"
                            placeholder="Node, Python..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Database</Label>
                          <Input
                            value={editTechStack.db}
                            onChange={(e) => setEditTechStack({ ...editTechStack, db: e.target.value })}
                            className="bg-background/50 border-white/10"
                            placeholder="PostgreSQL..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider">AI Agent</Label>
                          <Input
                            value={editTechStack.aiAgent}
                            onChange={(e) => setEditTechStack({ ...editTechStack, aiAgent: e.target.value })}
                            className="bg-background/50 border-white/10"
                            placeholder="Gemini, GPT-4..."
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Other</Label>
                          <Input
                            value={editTechStack.other}
                            onChange={(e) => setEditTechStack({ ...editTechStack, other: e.target.value })}
                            className="bg-background/50 border-white/10"
                            placeholder="Docker, AWS..."
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsTechStackEditing(false)}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveTechStack}
                          disabled={isSaving}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Frontend</div>
                        <div className="font-medium">{project.techStack?.frontend || "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Backend</div>
                        <div className="font-medium">{project.techStack?.backend || "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Database</div>
                        <div className="font-medium">{project.techStack?.db || "-"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">AI Agent</div>
                        <div className="font-medium">{project.techStack?.aiAgent || "-"}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Other</div>
                        <div className="font-medium">{project.techStack?.other || "-"}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/30 border-white/5">
                <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Team</CardTitle>
                  {(user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsTeamEditing(true)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-2">
                    {project.teamMembers?.map((member) => (
                      <div
                        key={member.id}
                        className="px-3 py-1.5 rounded-md bg-secondary/50 border border-white/10 flex items-center gap-2 text-sm font-medium text-foreground"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {member.name}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/30 border-white/5">
                <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" /> Client Meetings
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsMeetingDialogOpen(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {meetings.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No meetings recorded yet.
                    </div>
                  ) : (
                    meetings.map((meeting) => (
                      <div key={meeting.id} className="bg-background/20 p-3 rounded-md border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-primary">
                            <Calendar className="w-3 h-3" />
                            {new Date(meeting.date).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{meeting.feedback}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )
        }
      </div >

      <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Client Meeting</DialogTitle>
            <DialogDescription>
              Record a new meeting with the client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="meetingDate">Date</Label>
              <Input
                id="meetingDate"
                type="date"
                value={newMeetingDate}
                onChange={(e) => setNewMeetingDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meetingFeedback">Feedback / Notes</Label>
              <Textarea
                id="meetingFeedback"
                value={newMeetingFeedback}
                onChange={(e) => setNewMeetingFeedback(e.target.value)}
                placeholder="Enter meeting notes and client feedback..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsMeetingDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMeeting} disabled={isSaving}>Save Meeting</Button>
          </div>
        </DialogContent>
      </Dialog>



      <Card className="h-[600px] flex flex-col border-white/5 bg-card/30">
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className="text-lg flex items-center justify-between">
            Timeline
            <Badge variant="secondary" className="text-xs">{messages.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6 relative">
              <div className="absolute left-2.5 top-0 bottom-0 w-px bg-white/10" />

              {messages.map((msg) => (
                <div key={msg.id} className="relative pl-8 group">
                  <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-background border border-white/20 flex items-center justify-center z-10 group-hover:border-primary transition-colors">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-bold text-foreground">{msg.userName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground bg-white/5 p-2 rounded-md rounded-tl-none">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {isTeamMember && (
            <div className="p-4 border-t border-white/5 bg-white/[0.02]">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Log progress update..."
                  className="min-h-[80px] bg-background/50 resize-none text-xs focus:ring-0 border-white/10"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="h-auto aspect-square bg-primary hover:bg-primary/90"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={isTeamEditing} onOpenChange={setIsTeamEditing}>
        <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
          <DialogHeader>
            <DialogTitle>Manage Team</DialogTitle>
            <DialogDescription>
              Select users to add to the project team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[300px] overflow-y-auto">
            {allUsers.map((u) => (
              <div key={u.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`user-${u.id}`}
                  checked={selectedTeam.includes(u.id)}
                  onCheckedChange={() => toggleTeamMember(u.id)}
                />
                <Label htmlFor={`user-${u.id}`} className="flex-1 cursor-pointer">
                  {u.name} <span className="text-xs text-muted-foreground">({u.role})</span>
                </Label>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsTeamEditing(false)}>Cancel</Button>
            <Button onClick={handleSaveTeam} disabled={isSaving}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
