import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  NotebookPen, MessageSquare, CheckSquare, BarChart3,
  Plug, ArrowRight, TrendingUp, Calendar, Mic,
  Users, Hexagon, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { meetingApi } from "@/lib/meetingMinutesApi";
import { cn } from "@/lib/utils";

interface FeatureCard {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline";
  gradient: string;
  iconBg: string;
  available: boolean;
}

const features: FeatureCard[] = [
  {
    title: "Meeting Notes",
    description: "Record Board Minutes and Normal Minutes with AI-powered transcription. Generate executive summaries, action items and signature-ready PDF documents.",
    href: "/meeting-minutes",
    icon: NotebookPen,
    gradient: "from-blue-500/10 to-indigo-500/5",
    iconBg: "bg-blue-500/10 text-blue-600",
    available: true,
  },
  {
    title: "AI Assistant",
    description: "Your voice-enabled AI companion. Schedule meetings, manage tasks, send reminders, answer compliance questions — just ask.",
    href: "/chat",
    icon: MessageSquare,
    badge: "Voice enabled",
    badgeVariant: "secondary",
    gradient: "from-violet-500/10 to-purple-500/5",
    iconBg: "bg-violet-500/10 text-violet-600",
    available: true,
  },
  {
    title: "Tasks & Calendar",
    description: "Track project deadlines, consultant assignments, and client deliverables. Sync with Zoho Calendar and Projects.",
    href: "/tasks",
    icon: CheckSquare,
    gradient: "from-emerald-500/10 to-green-500/5",
    iconBg: "bg-emerald-500/10 text-emerald-600",
    available: true,
  },
  {
    title: "B-BBEE Compliance",
    description: "Full B-BBEE scorecard calculations across all 7 pillars. Import Excel toolkits, run scenarios, and export professional reports.",
    href: "/bbee",
    icon: BarChart3,
    gradient: "from-amber-500/10 to-orange-500/5",
    iconBg: "bg-amber-500/10 text-amber-700",
    available: true,
  },
  {
    title: "Zoho Integration",
    description: "Connect Zoho CRM, Projects, and Calendar. Sync contacts, create tasks in Zoho Projects, and manage your calendar from one place.",
    href: "/integrations",
    icon: Plug,
    badge: "Setup required",
    badgeVariant: "outline",
    gradient: "from-rose-500/10 to-pink-500/5",
    iconBg: "bg-rose-500/10 text-rose-600",
    available: true,
  },
];

const quickStats = [
  { label: "Active Features", value: "5", icon: TrendingUp, color: "text-primary" },
  { label: "AI-Powered", value: "Yes", icon: Mic, color: "text-violet-600" },
  { label: "Zoho Integration", value: "Ready", icon: Plug, color: "text-emerald-600" },
  { label: "Team Access", value: "Multi-user", icon: Users, color: "text-amber-600" },
];

export default function Hub() {
  const { user } = useAuth();
  const [meetingCount, setMeetingCount] = useState<number | null>(null);

  useEffect(() => {
    meetingApi.list().then(m => setMeetingCount(m.length)).catch(() => {});
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 h-32 w-32 rounded-full border-2 border-white/30" />
          <div className="absolute top-16 right-24 h-16 w-16 rounded-full border border-white/20" />
          <div className="absolute bottom-4 left-48 h-20 w-20 rounded-full border border-white/20" />
        </div>
        <div className="relative flex items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Hexagon className="h-5 w-5 text-white" fill="currentColor" />
              </div>
              <span className="text-white/80 font-medium text-sm">Okiru Companion</span>
            </div>
            <h1 className="text-3xl font-heading font-bold">
              {greeting()}, {user?.fullName?.split(" ")[0] || user?.username}
            </h1>
            <p className="text-white/75 text-base max-w-lg">
              Your intelligent consultant workspace. Manage meetings, tasks, compliance, and client engagements — all in one place.
            </p>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-3 shrink-0">
            {quickStats.map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm min-w-[110px]">
                <stat.icon className="h-4 w-4 text-white/70 mb-1" />
                <p className="text-white font-bold text-lg leading-none">{stat.value}</p>
                <p className="text-white/60 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div>
        <h2 className="text-lg font-heading font-bold mb-4 text-foreground">Workspace Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Link key={feature.title} href={feature.href}>
              <Card className={cn(
                "group cursor-pointer hover:shadow-lg transition-all duration-200 border hover:border-primary/30 h-full",
                `bg-gradient-to-br ${feature.gradient}`
              )}>
                <CardContent className="p-5 flex flex-col h-full gap-3">
                  <div className="flex items-start justify-between">
                    <div className={cn("p-2.5 rounded-xl", feature.iconBg)}>
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      {feature.badge && (
                        <Badge variant={feature.badgeVariant} className="text-xs">{feature.badge}</Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent meetings quick access */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/meeting-minutes/board">
          <Card className="group cursor-pointer hover:shadow-md hover:border-blue-300 transition-all bg-blue-50 dark:bg-blue-950/20 border-blue-200/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <NotebookPen className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Board Minutes</p>
                <p className="text-xs text-muted-foreground">Formal company secretary minutes</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/meeting-minutes/normal">
          <Card className="group cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-indigo-500/10 p-2 rounded-lg">
                <Calendar className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Normal Minutes</p>
                <p className="text-xs text-muted-foreground">General meeting notes & actions</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/chat">
          <Card className="group cursor-pointer hover:shadow-md hover:border-violet-300 transition-all bg-violet-50 dark:bg-violet-950/20 border-violet-200/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-violet-500/10 p-2 rounded-lg">
                <Mic className="h-4 w-4 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Voice Assistant</p>
                <p className="text-xs text-muted-foreground">Ask me anything, speak or type</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-violet-600 transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
