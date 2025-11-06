import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Customers from "@/pages/customers";
import Credits from "@/pages/credits";
import Profile from "@/pages/profile";
import Store from "@/pages/store";
import CustomerTrack from "@/pages/customer-track";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <Component />;
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes - Customer portal */}
      <Route path="/customer-track/:path*" component={CustomerTrack} />
      
      {!user ? (
        <>
          <Route path="/auth" component={AuthPage} />
          <Route>
            <Redirect to="/auth" />
          </Route>
        </>
      ) : (
        <>
          <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
          <Route path="/customers" component={() => <ProtectedRoute component={Customers} />} />
          <Route path="/credits" component={() => <ProtectedRoute component={Credits} />} />
          <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
          <Route path="/store" component={() => <ProtectedRoute component={Store} />} />
          <Route path="/auth">
            <Redirect to="/" />
          </Route>
          <Route component={NotFound} />
        </>
      )}
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();

  const sidebarStyle = {
    "--sidebar-width": "280px",
    "--sidebar-width-icon": "72px",
  };

  if (!user) {
    return <Router />;
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 max-w-7xl">
              <Router />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <AppContent />
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
