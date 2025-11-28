import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FolderKanban, BarChart3, Users, Settings, LogOut, Rocket, PanelLeftClose, PanelLeftOpen, Briefcase, Car, Plane, Ship, Bike, Truck, Bus, User } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const iconMap: Record<string, any> = {
  rocket: Rocket,
  briefcase: Briefcase,
  car: Car,
  plane: Plane,
  ship: Ship,
  bike: Bike,
  truck: Truck,
  bus: Bus,
  user: User,
};

export function Sidebar({ isOpen, toggle }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: FolderKanban, label: "Projects", href: "/projects" },
    { icon: BarChart3, label: "Metrics", href: "/metrics" },
    ...(user?.role === "ADMIN" ? [
      { icon: Users, label: "Users", href: "/users" },
      { icon: Settings, label: "Settings", href: "/settings" }
    ] : []),
  ];

  const UserIcon = user?.avatar && iconMap[user.avatar] ? iconMap[user.avatar] : User;

  return (
    <div className={cn(
      "h-screen bg-sidebar border-r border-sidebar-border flex flex-col text-sidebar-foreground font-sans transition-all duration-300",
      isOpen ? "w-64" : "w-20"
    )}>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_hsl(var(--primary)/0.5)] shrink-0">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          {isOpen && <span className="font-bold text-xl tracking-tight animate-in fade-in duration-300">Mars Shot</span>}
        </div>
        {isOpen && (
          <Button variant="ghost" size="icon" onClick={toggle} className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground">
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        )}
      </div>

      {!isOpen && (
        <div className="flex justify-center mb-4">
          <Button variant="ghost" size="icon" onClick={toggle} className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground">
            <PanelLeftOpen className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="px-4 py-2 flex-1">
        {isOpen && (
          <div className="text-xs uppercase tracking-wider text-sidebar-foreground/50 font-mono mb-2 pl-2 animate-in fade-in duration-300">
            Menu
          </div>
        )}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group cursor-pointer",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                    !isOpen && "justify-center px-2"
                  )}
                  title={!isOpen ? item.label : undefined}
                >
                  <item.icon
                    className={cn(
                      "w-4 h-4 transition-colors shrink-0",
                      isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                    )}
                  />
                  {isOpen && <span className="animate-in fade-in duration-300">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-sidebar-border space-y-2">
        <div className={cn("flex items-center gap-3 mb-3 px-2 pt-2", !isOpen && "justify-center px-0")}>
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
            <UserIcon className="w-5 h-5 text-secondary-foreground" />
          </div>
          {isOpen && (
            <div className="flex-1 overflow-hidden animate-in fade-in duration-300">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.role}</div>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors",
            !isOpen && "justify-center px-2"
          )}
          title={!isOpen ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {isOpen && <span className="animate-in fade-in duration-300">Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
