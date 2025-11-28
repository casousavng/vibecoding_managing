import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/authContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectCreate from "@/pages/ProjectCreate";
import ProjectDetail from "@/pages/ProjectDetail";
import Metrics from "@/pages/Metrics";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Login} />

      <Route path="/">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Route>

      <Route path="/projects">
        <AppLayout>
          <Projects />
        </AppLayout>
      </Route>

      <Route path="/projects/new">
        <AppLayout>
          <ProjectCreate />
        </AppLayout>
      </Route>

      <Route path="/projects/:id">
        <AppLayout>
          <ProjectDetail />
        </AppLayout>
      </Route>

      <Route path="/metrics">
        <AppLayout>
          <Metrics />
        </AppLayout>
      </Route>

      <Route path="/users">
        <AppLayout>
          <Users />
        </AppLayout>
      </Route>

      <Route path="/settings">
        <AppLayout>
          <Settings />
        </AppLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
