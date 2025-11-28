import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("admin@empresa.pt");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (showChangePassword) {
        if (newPassword !== confirmPassword) {
          setError("Passwords do not match");
          setIsSubmitting(false);
          return;
        }

        const res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: password, newPassword }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to update password");
        }

        // After successful password change, redirect to dashboard
        setLocation("/");
      } else {
        const success = await login(email, password);
        if (success) {
          // Check if user needs to change password
          // We need to fetch the user again or modify login to return the user object
          // For now, let's assume login updates the user context
          const res = await fetch("/api/auth/me");
          if (res.ok) {
            const data = await res.json();
            if (data.user.mustChangePassword) {
              setShowChangePassword(true);
              setIsSubmitting(false);
              return;
            }
          }
          setLocation("/");
        } else {
          setError("Invalid credentials");
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      if (!showChangePassword) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[128px]" />

      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_hsl(var(--primary)/0.6)]">
            <span className="text-white font-bold font-mono text-xl">V</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {showChangePassword ? "Change Password" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {showChangePassword ? "Please set a new password for your account" : "Enter your vibe coding credentials"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!showChangePassword ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                    required
                  />
                </div>
              </>
            )}

            {error && <div className="text-destructive text-sm font-medium text-center">{error}</div>}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)] transition-all hover:shadow-[0_0_25px_-5px_hsl(var(--primary)/0.6)] hover:scale-[1.02]"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (showChangePassword ? "Update Password" : "Sign In")}
            </Button>
          </form>

          {!showChangePassword && (
            <div className="mt-6 text-center text-xs text-muted-foreground font-mono bg-muted/50 p-3 rounded border border-border/50">
              <p>Demo Credentials:</p>
              <p>Admin: admin@empresa.pt / admin123</p>
              <p>PM: pm@empresa.pt / pm123</p>
              <p>Tekkie: alice@empresa.pt / tekkie123</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
