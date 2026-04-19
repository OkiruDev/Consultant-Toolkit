import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Plus, NotebookPen, Calendar, Video, Trash2, Eye, Edit3, CheckCircle2, Clock, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { meetingApi, getMeetingTypeLabel, getPlatformLabel, MEETING_TYPES } from "@/lib/meetingMinutesApi";
import type { Meeting } from "@shared/schema";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: React.ElementType }> = {
  draft: { label: "Draft", variant: "secondary", icon: FileText },
  generated: { label: "Generated", variant: "default", icon: CheckCircle2 },
  finalised: { label: "Finalised", variant: "outline", icon: CheckCircle2 },
};

const BOARD_TYPES = ["board", "agm", "egm", "audit", "remco", "exco"];

const CATEGORY_CONFIG = {
  board: { label: "Board Minutes", color: "text-blue-600", icon: NotebookPen, newHref: "/meeting-minutes/board/new" },
  normal: { label: "Normal Minutes", color: "text-indigo-600", icon: Calendar, newHref: "/meeting-minutes/normal/new" },
  all: { label: "All Meetings", color: "text-foreground", icon: FileText, newHref: "/meeting-minutes/new" },
};

interface Props { category: "board" | "normal" | "all" }

export default function MeetingMinutesList({ category }: Props) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const { toast } = useToast();
  const cfg = CATEGORY_CONFIG[category];
  const Icon = cfg.icon;

  useEffect(() => {
    meetingApi.list()
      .then(all => {
        const filtered = category === "all"
          ? all
          : category === "board"
          ? all.filter(m => BOARD_TYPES.includes(m.meetingType))
          : all.filter(m => !BOARD_TYPES.includes(m.meetingType));
        setMeetings(filtered);
      })
      .catch(() => toast({ title: "Failed to load meetings", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [category]);

  async function handleDelete(id: string) {
    try {
      await meetingApi.delete(id);
      setMeetings(prev => prev.filter(m => m.id !== id));
      toast({ title: "Meeting deleted" });
    } catch {
      toast({ title: "Failed to delete meeting", variant: "destructive" });
    }
  }

  const filtered = typeFilter === "all" ? meetings : meetings.filter(m => m.meetingType === typeFilter);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/meeting-minutes">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="bg-primary/10 p-2.5 rounded-lg">
            <Icon className={`h-5 w-5 ${cfg.color}`} />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold">{cfg.label}</h1>
            <p className="text-sm text-muted-foreground">AI-powered formal minutes</p>
          </div>
        </div>
        <Link href={cfg.newHref}>
          <Button className="gap-2"><Plus className="h-4 w-4" />New Meeting</Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {MEETING_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} meeting{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Icon className="h-12 w-12 text-muted-foreground/40" />
            <div className="text-center">
              <p className="font-semibold text-muted-foreground">No meetings yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create a new meeting to get started</p>
            </div>
            <Link href={cfg.newHref}>
              <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" />Create Meeting</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map(meeting => {
            const statusCfg = STATUS_CONFIG[meeting.status] ?? STATUS_CONFIG.draft;
            const StatusIcon = statusCfg.icon;
            return (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{meeting.companyName}</CardTitle>
                      <p className="text-sm font-medium text-primary">{getMeetingTypeLabel(meeting.meetingType)}</p>
                    </div>
                    <Badge variant={statusCfg.variant} className="shrink-0 gap-1">
                      <StatusIcon className="h-3 w-3" />{statusCfg.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{meeting.meetingDate}{meeting.startTime && ` at ${meeting.startTime}`}</span>
                    <span className="flex items-center gap-1.5"><Video className="h-3.5 w-3.5" />{getPlatformLabel(meeting.platform)}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Chair: {meeting.chairperson}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Link href={`/meeting-minutes/${meeting.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5"><Edit3 className="h-3.5 w-3.5" />Edit</Button>
                    </Link>
                    {(meeting.status === "generated" || meeting.status === "finalised") && (
                      <Link href={`/meeting-minutes/${meeting.id}/view`}>
                        <Button size="sm" className="gap-1.5"><Eye className="h-3.5 w-3.5" />View & Export</Button>
                      </Link>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive ml-auto">
                          <Trash2 className="h-3.5 w-3.5" />Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete the meeting and all data. This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(meeting.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
