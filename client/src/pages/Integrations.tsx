import {
  Plug, CheckCircle2, XCircle, ExternalLink, Settings2,
  RefreshCw, Users, FolderKanban, Calendar, Mail, AlertCircle,
  ArrowRight, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  connected: boolean;
  features: string[];
  docsUrl?: string;
}

const ZOHO_INTEGRATIONS: Integration[] = [
  {
    id: "zoho_crm",
    name: "Zoho CRM",
    description: "Sync client contacts, deals, and accounts. Access CRM records directly from meeting notes and tasks.",
    icon: Users,
    color: "text-rose-600",
    iconBg: "bg-rose-500/10",
    connected: false,
    features: ["Sync contacts & accounts", "Link meetings to CRM records", "Auto-populate attendee details", "Create follow-up activities"],
    docsUrl: "https://www.zoho.com/crm/developer/docs/",
  },
  {
    id: "zoho_projects",
    name: "Zoho Projects",
    description: "Sync tasks and project deadlines with Zoho Projects. Push action items from meeting minutes directly.",
    icon: FolderKanban,
    color: "text-blue-600",
    iconBg: "bg-blue-500/10",
    connected: false,
    features: ["Push tasks to Zoho Projects", "Sync project timelines", "Track milestones", "Two-way task updates"],
    docsUrl: "https://www.zoho.com/projects/help/",
  },
  {
    id: "zoho_calendar",
    name: "Zoho Calendar",
    description: "Schedule meetings and set reminders directly in Zoho Calendar. Sync task deadlines automatically.",
    icon: Calendar,
    color: "text-emerald-600",
    iconBg: "bg-emerald-500/10",
    connected: false,
    features: ["Create & manage calendar events", "Set meeting reminders", "Sync task due dates", "Team calendar visibility"],
    docsUrl: "https://www.zoho.com/calendar/help/",
  },
  {
    id: "zoho_mail",
    name: "Zoho Mail",
    description: "Send meeting minutes, action item reminders, and reports directly via Zoho Mail.",
    icon: Mail,
    color: "text-violet-600",
    iconBg: "bg-violet-500/10",
    connected: false,
    features: ["Email meeting minutes", "Action item reminders", "Bulk send reports", "Scheduled follow-ups"],
    docsUrl: "https://www.zoho.com/mail/help/",
  },
];

const COMING_SOON = [
  { name: "Google Meet", description: "Live transcription and automatic minutes capture", icon: "📹" },
  { name: "Microsoft Teams", description: "Meeting bot for real-time notes and recording", icon: "💼" },
  { name: "Zoom", description: "Auto-join and transcribe Zoom meetings", icon: "🎥" },
];

function IntegrationCard({ integration }: { integration: Integration }) {
  const [showConfig, setShowConfig] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();

  function handleConnect() {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast({ title: "Client ID and Secret required", variant: "destructive" });
      return;
    }
    toast({ title: `${integration.name} configuration saved`, description: "OAuth setup is not yet live — your credentials have been noted." });
    setShowConfig(false);
  }

  return (
    <Card className={cn("transition-all", integration.connected && "border-green-200 bg-green-50/30 dark:bg-green-950/10")}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl", integration.iconBg)}>
              <integration.icon className={cn("h-5 w-5", integration.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{integration.name}</h3>
                {integration.connected ? (
                  <Badge variant="outline" className="text-xs gap-1 border-green-300 text-green-700 bg-green-50">
                    <CheckCircle2 className="h-3 w-3" />Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Not connected</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {integration.features.map(f => (
            <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              {f}
            </div>
          ))}
        </div>

        {showConfig && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3 mt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">OAuth 2.0 Configuration</p>
            <div className="space-y-1.5">
              <Label className="text-xs">Zoho Client ID</Label>
              <Input className="h-8 text-sm" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="1000.XXXX..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Zoho Client Secret</Label>
              <Input className="h-8 text-sm" type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="••••••••" />
            </div>
            <p className="text-xs text-muted-foreground">
              Get your credentials from the{" "}
              <a href="https://api-console.zoho.com" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                Zoho API Console
              </a>.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleConnect} className="gap-1.5">Save & Connect</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowConfig(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {!integration.connected && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfig(s => !s)}
              className="gap-1.5"
            >
              <Settings2 className="h-3.5 w-3.5" />
              {showConfig ? "Hide Config" : "Configure"}
            </Button>
          )}
          {integration.connected && (
            <>
              <Button size="sm" variant="outline" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />Sync Now
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive">
                <XCircle className="h-3.5 w-3.5" />Disconnect
              </Button>
            </>
          )}
          {integration.docsUrl && (
            <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground ml-auto" asChild>
              <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />Docs
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Integrations() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-rose-500/10 p-2.5 rounded-xl">
            <Plug className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold">Zoho Integration</h1>
            <p className="text-sm text-muted-foreground">Connect Okiru Companion with your Zoho One apps</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 mt-1">
          <AlertCircle className="h-3 w-3" />Setup required
        </Badge>
      </div>

      {/* Setup notice */}
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
        <CardContent className="p-4 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">How to get started</p>
            <p className="text-amber-700/80 dark:text-amber-300/80 mt-0.5 text-xs leading-relaxed">
              Create a server-side OAuth app at{" "}
              <a href="https://api-console.zoho.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">api-console.zoho.com</a>
              {" "}under your Zoho account. Add the redirect URI <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">http://localhost:5000/api/integrations/zoho/callback</code>.
              Then paste your Client ID and Secret into each integration below.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Zoho integrations grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Zoho One Apps</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {ZOHO_INTEGRATIONS.map(integration => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      </div>

      <Separator />

      {/* Coming soon: meeting platform bots */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Coming Soon — Meeting Platform Bots</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {COMING_SOON.map(item => (
            <Card key={item.name} className="opacity-60 border-dashed">
              <CardContent className="p-4 flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
