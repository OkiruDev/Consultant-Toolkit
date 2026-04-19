import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  ShoppingCart,
  Building2,
  HeartHandshake,
  Settings,
  Briefcase,
  GitCompare,
  FileSpreadsheet,
  FileText,
  Hexagon,
  Calculator,
  LineChart,
  Table,
  ArrowLeftRight,
  NotebookPen,
  MessageSquare,
  CheckSquare,
  Plug,
  BarChart3,
  ChevronDown,
  Home,
  Calendar,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBbeeStore } from "@/lib/store";
import { useActiveClient } from "@/lib/client-context";
import { useState } from "react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  testId?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
      data-testid={item.testId ?? `nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-sidebar-foreground/70")} />
      {item.name}
    </Link>
  );
}

function CollapsibleSection({ label, items, location }: { label: string; items: NavItem[]; location: string }) {
  const hasActive = items.some(i => location === i.href || location.startsWith(i.href + "/"));
  const [open, setOpen] = useState(hasActive);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors rounded"
      >
        {label}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-0.5">
          {items.map(item => (
            <NavLink
              key={item.name}
              item={item}
              isActive={location === item.href || location.startsWith(item.href + "/")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const client = useBbeeStore(s => s.client);
  const { setActiveClientId } = useActiveClient();

  const isBbee = location.startsWith("/bbee") || location.startsWith("/pillars") || location.startsWith("/scorecard") || location === "/" && false;

  const mainItems: NavItem[] = [
    { name: "Home", href: "/", icon: Home },
    { name: "Meeting Notes", href: "/meeting-minutes", icon: NotebookPen },
    { name: "AI Assistant", href: "/chat", icon: MessageSquare },
    { name: "Tasks & Calendar", href: "/tasks", icon: CheckSquare },
    { name: "Zoho Integration", href: "/integrations", icon: Plug },
  ];

  const bbeeItems: NavItem[] = [
    { name: "Dashboard", href: "/bbee", icon: LayoutDashboard },
    { name: "Scorecard", href: "/scorecard", icon: Table },
    { name: "Import Excel", href: "/import", icon: FileSpreadsheet },
    { name: "Scenarios", href: "/scenarios", icon: GitCompare },
    { name: "Exports", href: "/reports", icon: FileText },
  ];

  const bbeeDataItems: NavItem[] = [
    { name: "Financials & TMPS", href: "/pillars/financials", icon: Calculator },
    { name: "Industry Norms", href: "/pillars/industry-norms", icon: LineChart },
  ];

  const bbeePillarItems: NavItem[] = [
    { name: "Ownership", href: "/pillars/ownership", icon: Users },
    { name: "Management Control", href: "/pillars/management", icon: UserCog },
    { name: "Skills Development", href: "/pillars/skills", icon: BookOpen },
    { name: "Pref. Procurement", href: "/pillars/procurement", icon: ShoppingCart },
    { name: "Enterprise Dev", href: "/pillars/enterprise", icon: Building2 },
    { name: "Socio-Economic Dev", href: "/pillars/sed", icon: HeartHandshake },
    { name: "YES Initiative", href: "/pillars/yes", icon: Briefcase },
  ];

  const meetingSubItems: NavItem[] = [
    { name: "Board Minutes", href: "/meeting-minutes/board", icon: NotebookPen },
    { name: "Normal Minutes", href: "/meeting-minutes/normal", icon: Calendar },
  ];

  const isMeetingActive = location.startsWith("/meeting-minutes");
  const [meetingExpanded, setMeetingExpanded] = useState(isMeetingActive);

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border shadow-sm z-10 shrink-0">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-sidebar-border bg-sidebar/50 gap-2.5">
        <div className="bg-primary p-1.5 rounded-lg shadow-sm">
          <Hexagon className="h-5 w-5 text-white" fill="currentColor" />
        </div>
        <div>
          <div className="font-heading font-bold text-base text-primary leading-none">Okiru Companion</div>
          <div className="text-[10px] text-muted-foreground">Consultant Workspace</div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Main workspace */}
        <div className="space-y-0.5">
          {mainItems.map(item => {
            if (item.href === "/meeting-minutes") {
              const active = location.startsWith("/meeting-minutes");
              return (
                <div key={item.name}>
                  <button
                    onClick={() => setMeetingExpanded(o => !o)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full",
                      active ? "bg-primary/10 text-primary font-semibold" : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <NotebookPen className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-sidebar-foreground/70")} />
                    Meeting Notes
                    <ChevronDown className={cn("h-3.5 w-3.5 ml-auto transition-transform", meetingExpanded && "rotate-180")} />
                  </button>
                  {meetingExpanded && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
                      {meetingSubItems.map(sub => (
                        <NavLink key={sub.name} item={sub} isActive={location.startsWith(sub.href)} />
                      ))}
                      <NavLink
                        item={{ name: "All Meetings", href: "/meeting-minutes/all", icon: FileText }}
                        isActive={location === "/meeting-minutes/all" || location === "/meeting-minutes"}
                      />
                    </div>
                  )}
                </div>
              );
            }
            const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
            return <NavLink key={item.name} item={item} isActive={active} />;
          })}
        </div>

        {/* B-BBEE Compliance section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">B-BBEE Compliance</span>
          </div>

          {client.name && (
            <button
              className="flex items-center justify-between w-full bg-card hover:bg-muted border border-border shadow-sm rounded-md px-3 py-2 text-sm text-left transition-all group"
              onClick={() => {
                useBbeeStore.getState().clearData();
                setActiveClientId(null);
              }}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Active Client</span>
                <span className="font-semibold text-xs truncate group-hover:text-primary transition-colors">{client.name}</span>
              </div>
              <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          )}

          <div className="space-y-0.5">
            {bbeeItems.map(item => (
              <NavLink key={item.name} item={item} isActive={location === item.href} />
            ))}
          </div>

          <CollapsibleSection label="Base Data" items={bbeeDataItems} location={location} />
          <CollapsibleSection label="Pillars" items={bbeePillarItems} location={location} />
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border bg-sidebar-accent/30">
        <NavLink
          item={{ name: "Platform Settings", href: "/settings", icon: Settings, testId: "nav-settings" }}
          isActive={location === "/settings"}
        />
      </div>
    </div>
  );
}
