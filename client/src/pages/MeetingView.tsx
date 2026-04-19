import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, Download, Edit3, Calendar, Video, Users, CheckSquare,
  FileText, NotebookPen, Loader2, Badge as BadgeIcon, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { meetingApi, getMeetingTypeLabel, getPlatformLabel } from "@/lib/meetingMinutesApi";
import { exportMeetingPdf } from "@/lib/exportMeetingPdf";
import type { MeetingDetails } from "@/lib/meetingMinutesApi";
import { Link } from "wouter";

const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const ATTENDANCE_COLOR: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  apology: "bg-amber-100 text-amber-700",
  absent: "bg-red-100 text-red-700",
};

export default function MeetingView() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [details, setDetails] = useState<MeetingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    meetingApi.get(params.id)
      .then(setDetails)
      .catch(() => toast({ title: "Failed to load meeting", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [params.id]);

  function handleExport() {
    if (!details) return;
    try {
      exportMeetingPdf(details);
      toast({ title: "PDF exported successfully" });
    } catch (err: any) {
      toast({ title: "Export failed: " + err.message, variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!details) return null;

  const { meeting, attendees, agendaItems, actionItems } = details;
  const present = attendees.filter(a => a.attendanceStatus === "present");
  const apologies = attendees.filter(a => a.attendanceStatus === "apology");
  const absent = attendees.filter(a => a.attendanceStatus === "absent");

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/meeting-minutes")} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="bg-primary/10 p-2 rounded-lg">
            <NotebookPen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold">{meeting.companyName}</h1>
            <p className="text-sm text-primary font-medium">{getMeetingTypeLabel(meeting.meetingType)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/meeting-minutes/${meeting.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button onClick={handleExport} className="gap-1.5">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Meeting info card */}
      <Card>
        <CardContent className="pt-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium">{meeting.meetingDate}</span>
              {meeting.startTime && <span className="text-muted-foreground">{meeting.startTime}{meeting.endTime ? ` – ${meeting.endTime}` : ""}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{getPlatformLabel(meeting.platform)}</span>
              {meeting.meetingLink && (
                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline underline-offset-2">Join</a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Venue:</span>
              <span>{meeting.venue || "Virtual"}</span>
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">Chairperson: </span>{meeting.chairperson}
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">Company Secretary: </span>{meeting.companySecretary}
            </div>
            {meeting.companyRegistration && (
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">Reg: </span>{meeting.companyRegistration}
              </div>
            )}
          </div>
          {meeting.companyAddress && (
            <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">{meeting.companyAddress}</p>
          )}
        </CardContent>
      </Card>

      {/* Executive Summary */}
      {meeting.aiExecutiveSummary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{meeting.aiExecutiveSummary}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content: attendance + minutes */}
        <div className="lg:col-span-2 space-y-5">
          {/* Attendance Register */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Attendance Register
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {present.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Present ({present.length})</p>
                  <div className="space-y-1.5">
                    {present.map(a => (
                      <div key={a.id} className="flex items-center gap-3 text-sm py-1 border-b last:border-0">
                        <div className="flex-1">
                          <span className="font-medium">{a.name}</span>
                          {a.position && <span className="text-muted-foreground ml-2">— {a.position}</span>}
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">{a.role}</Badge>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ATTENDANCE_COLOR.present}`}>Present</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {apologies.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Apologies</p>
                  <p className="text-sm">{apologies.map(a => `${a.name}${a.position ? ` (${a.position})` : ""}`).join(", ")}</p>
                </div>
              )}
              {absent.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Absent</p>
                  <p className="text-sm">{absent.map(a => `${a.name}${a.position ? ` (${a.position})` : ""}`).join(", ")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Minutes / Agenda */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <NotebookPen className="h-4 w-4 text-primary" />
                Minutes of Meeting
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meeting.aiFormattedMinutes ? (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {meeting.aiFormattedMinutes}
                </pre>
              ) : agendaItems.length > 0 ? (
                <div className="space-y-6">
                  {agendaItems.map(item => (
                    <div key={item.id} className="space-y-2">
                      <h3 className="font-semibold text-sm text-primary">
                        {item.itemNumber}. {item.title}
                      </h3>
                      {item.discussionNotes && (
                        <p className="text-sm text-foreground pl-4 border-l-2 border-muted">{item.discussionNotes}</p>
                      )}
                      {item.resolution && (
                        <div className="bg-primary/5 border border-primary/20 rounded-md px-3 py-2 text-sm">
                          <span className="font-semibold text-primary">RESOLVED: </span>{item.resolution}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No minutes recorded yet. Generate minutes using AI or add agenda item notes.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Items sidebar */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                Action Items ({actionItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No action items recorded.</p>
              ) : (
                <div className="space-y-3">
                  {actionItems.map((action, i) => (
                    <div key={action.id} className="border rounded-md p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${PRIORITY_COLOR[action.priority] ?? ""}`}>
                          {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm">{action.description}</p>
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        <p><span className="font-medium text-foreground">Responsible:</span> {action.responsiblePerson}</p>
                        {action.dueDate && <p><span className="font-medium text-foreground">Due:</span> {action.dueDate}</p>}
                        <p><span className="font-medium text-foreground">Status:</span> {action.status.replace("_", " ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signature blocks */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Confirmation of Minutes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <p className="text-xs text-muted-foreground italic">Signed as a true and correct record of the proceedings:</p>
              <div className="space-y-1">
                <div className="border-b border-foreground/30 h-8" />
                <p className="text-xs font-bold uppercase tracking-wide">Chairperson</p>
                <p className="text-xs text-muted-foreground">{meeting.chairperson}</p>
                <p className="text-xs text-muted-foreground">Name / Signature / Date</p>
              </div>
              <div className="space-y-1">
                <div className="border-b border-foreground/30 h-8" />
                <p className="text-xs font-bold uppercase tracking-wide">Company Secretary</p>
                <p className="text-xs text-muted-foreground">{meeting.companySecretary}</p>
                <p className="text-xs text-muted-foreground">Name / Signature / Date</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />
      <div className="flex justify-between pb-6">
        <Button variant="outline" onClick={() => navigate("/meeting-minutes")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          All Meetings
        </Button>
        <Button onClick={handleExport} className="gap-1.5">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>
    </div>
  );
}
