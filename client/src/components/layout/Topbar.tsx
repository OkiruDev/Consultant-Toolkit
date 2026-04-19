import { Button } from "@/components/ui/button";
import { Download, FileDown, Upload, MapPin, LogOut, Home } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { useBbeeStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/exportExcel";
import { useLocation, Link } from "wouter";

const BBEE_PATHS = ["/bbee", "/scorecard", "/import", "/scenarios", "/reports", "/pillars"];

function isBbeePath(location: string) {
  return BBEE_PATHS.some(p => location === p || location.startsWith(p + "/") || location.startsWith(p));
}

const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/chat": "AI Assistant",
  "/tasks": "Tasks & Calendar",
  "/integrations": "Zoho Integration",
  "/meeting-minutes": "Meeting Notes",
  "/settings": "Settings",
};

function getPageTitle(location: string): string {
  if (location.startsWith("/meeting-minutes/board")) return "Board Minutes";
  if (location.startsWith("/meeting-minutes/normal")) return "Normal Minutes";
  if (location.startsWith("/meeting-minutes")) return "Meeting Notes";
  return PAGE_TITLES[location] ?? "";
}

export function Topbar() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const client = useBbeeStore(s => s.client);
  const [location, navigate] = useLocation();

  const showBbeeControls = isBbeePath(location);
  const pageTitle = getPageTitle(location);

  const handleExportData = () => {
    const state = useBbeeStore.getState();
    try {
      exportToExcel(state);
      toast({ title: "Excel Exported", description: "B-BBEE project data downloaded." });
    } catch {
      toast({ title: "Export Failed", variant: "destructive" });
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-5 shadow-sm z-10 sticky top-0 transition-colors duration-300 shrink-0">
      {/* Left: page context */}
      <div className="flex items-center gap-3">
        {!showBbeeControls && pageTitle && (
          <div className="text-sm font-semibold text-foreground">{pageTitle}</div>
        )}
        {showBbeeControls && (
          <div>
            <h2 className="text-sm font-semibold text-foreground leading-none">{client.name || "No client selected"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              FY {client.financialYear || "–"}{client.industrySector ? ` · ${client.industrySector}` : ""}
            </p>
          </div>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        {showBbeeControls && (
          <>
            <div className="hidden lg:flex items-center gap-1.5 mr-1">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <Select defaultValue="National">
                <SelectTrigger className="w-[130px] h-7 text-xs bg-muted/50 border-none focus:ring-0">
                  <SelectValue placeholder="EAP Province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="National">National EAP</SelectItem>
                  <SelectItem value="Gauteng">Gauteng</SelectItem>
                  <SelectItem value="Western Cape">Western Cape</SelectItem>
                  <SelectItem value="KZN">KwaZulu-Natal</SelectItem>
                  <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="h-4 w-px bg-border hidden lg:block" />
            <Button variant="outline" size="sm" className="hidden md:flex gap-1.5 h-8 rounded-full text-xs" onClick={() => navigate("/import")}>
              <Upload className="h-3.5 w-3.5" />
              Upload
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 rounded-full text-xs hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200" onClick={handleExportData}>
              <FileDown className="h-3.5 w-3.5 text-emerald-600" />
              Excel
            </Button>
            <Button size="sm" className="gap-1.5 h-8 rounded-full text-xs" onClick={() => navigate("/reports")}>
              <Download className="h-3.5 w-3.5" />
              Report
            </Button>
            <div className="h-4 w-px bg-border" />
          </>
        )}

        <ThemeToggle />
        <div className="h-4 w-px bg-border" />
        <span className="text-xs text-muted-foreground hidden lg:inline">{user?.fullName || user?.username}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={logout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
