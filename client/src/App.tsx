import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ClientProvider } from "@/lib/client-context";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";

// Hub & core pages (no B-BBEE client required)
import Hub from "@/pages/Hub";
import ChatAssistant from "@/pages/ChatAssistant";
import Tasks from "@/pages/Tasks";
import Integrations from "@/pages/Integrations";
import AuthPage from "@/pages/AuthPage";
import Settings from "@/pages/Settings";

// Meeting Minutes
import MeetingTypeSelector from "@/pages/MeetingTypeSelector";
import MeetingMinutesList from "@/pages/MeetingMinutesList";
import MeetingEditor from "@/pages/MeetingEditor";
import MeetingView from "@/pages/MeetingView";

// B-BBEE pages
import Dashboard from "@/pages/Dashboard";
import Ownership from "@/pages/pillars/Ownership";
import ManagementControl from "@/pages/pillars/ManagementControl";
import SkillsDevelopment from "@/pages/pillars/SkillsDevelopment";
import ESD from "@/pages/pillars/ESD";
import SED from "@/pages/pillars/SED";
import Financials from "@/pages/pillars/Financials";
import IndustryNorms from "@/pages/pillars/IndustryNorms";
import Reports from "@/pages/Reports";
import Scenarios from "@/pages/Scenarios";
import ExcelImport from "@/pages/ExcelImport";
import Scorecard from "@/pages/Scorecard";
import ClientSelector from "@/pages/ClientSelector";

import { AnimatePresence } from "framer-motion";
import { AppLoader } from "@/components/Loader";
import { useBbeeStore } from "@/lib/store";
import { useActiveClient } from "@/lib/client-context";
import { useEffect } from "react";

function DataLoader({ children }: { children: React.ReactNode }) {
  const { activeClientId } = useActiveClient();
  const { loadClientData, isLoaded, activeClientId: storeClientId } = useBbeeStore();

  useEffect(() => {
    if (activeClientId && activeClientId !== storeClientId) {
      loadClientData(activeClientId);
    }
  }, [activeClientId, storeClientId, loadClientData]);

  if (!activeClientId) return <ClientSelector />;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Loading client data…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <Switch>
          {/* ── Hub & top-level tools (no client required) ── */}
          <Route path="/" component={Hub} />
          <Route path="/chat" component={ChatAssistant} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/integrations" component={Integrations} />
          <Route path="/settings" component={Settings} />

          {/* ── Meeting Minutes ── */}
          <Route path="/meeting-minutes" component={MeetingTypeSelector} />
          <Route path="/meeting-minutes/all">{() => <MeetingMinutesList category="all" />}</Route>
          <Route path="/meeting-minutes/board">{() => <MeetingMinutesList category="board" />}</Route>
          <Route path="/meeting-minutes/normal">{() => <MeetingMinutesList category="normal" />}</Route>
          <Route path="/meeting-minutes/new">{() => <MeetingEditor />}</Route>
          <Route path="/meeting-minutes/board/new">{() => <MeetingEditor defaultCategory="board" />}</Route>
          <Route path="/meeting-minutes/normal/new">{() => <MeetingEditor defaultCategory="normal" />}</Route>
          <Route path="/meeting-minutes/:id/view" component={MeetingView} />
          <Route path="/meeting-minutes/:id">{() => <MeetingEditor />}</Route>

          {/* ── B-BBEE (requires active client) ── */}
          <Route>
            <ClientProvider>
              <DataLoader>
                <Switch>
                  <Route path="/bbee" component={Dashboard} />
                  <Route path="/scorecard" component={Scorecard} />
                  <Route path="/import" component={ExcelImport} />
                  <Route path="/scenarios" component={Scenarios} />
                  <Route path="/reports" component={Reports} />

                  <Route path="/pillars/financials" component={Financials} />
                  <Route path="/pillars/industry-norms" component={IndustryNorms} />
                  <Route path="/pillars/ownership" component={Ownership} />
                  <Route path="/pillars/management" component={ManagementControl} />
                  <Route path="/pillars/skills" component={SkillsDevelopment} />
                  <Route path="/pillars/procurement" component={ESD} />
                  <Route path="/pillars/sed" component={SED} />

                  <Route path="/pillars/:pillar">
                    {(params) => (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-3xl font-heading font-bold capitalize">{params.pillar.replace("-", " ")}</h1>
                        <p className="text-muted-foreground mt-2">Coming soon.</p>
                      </div>
                    )}
                  </Route>

                  <Route component={NotFound} />
                </Switch>
              </DataLoader>
            </ClientProvider>
          </Route>
        </Switch>
      </AnimatePresence>
    </AppLayout>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <AppLoader />;
  if (!user) return <AuthPage />;
  return <AppRoutes />;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="okiru-companion-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AuthenticatedApp />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
