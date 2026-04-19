import { Link } from "wouter";
import { NotebookPen, Calendar, ArrowRight, Users, FileText, Mic, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MeetingTypeSelector() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-heading font-bold">Meeting Notes</h1>
        <p className="text-muted-foreground">
          Choose the type of meeting minutes to create or view.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Board Minutes */}
        <Card className="group hover:shadow-xl transition-all duration-300 hover:border-blue-300 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-200/50">
          <CardContent className="p-7 space-y-5">
            <div className="bg-blue-500/10 w-14 h-14 rounded-2xl flex items-center justify-center">
              <NotebookPen className="h-7 w-7 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-heading font-bold">Board Minutes</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Formal company secretary minutes for board meetings, AGMs, EGMs, and committee meetings.
                Includes executive summary, attendance register, resolutions, action items, and signature blocks.
              </p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" /> Attendance register with roles & positions</div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500" /> AI-generated executive summary</div>
              <div className="flex items-center gap-2"><Mic className="h-4 w-4 text-blue-500" /> Voice notes &amp; transcript support</div>
            </div>
            <div className="flex gap-3 pt-2">
              <Link href="/meeting-minutes/board/new">
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  New Board Meeting
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/meeting-minutes/board">
                <Button variant="outline" className="gap-1.5 border-blue-200 hover:border-blue-400">
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Normal Minutes */}
        <Card className="group hover:shadow-xl transition-all duration-300 hover:border-indigo-300 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border-indigo-200/50">
          <CardContent className="p-7 space-y-5">
            <div className="bg-indigo-500/10 w-14 h-14 rounded-2xl flex items-center justify-center">
              <Calendar className="h-7 w-7 text-indigo-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-heading font-bold">Normal Minutes</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                General meeting notes for team meetings, client consultations, project updates,
                and internal discussions. Simple format with agenda, notes, and action items.
              </p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-indigo-500" /> Attendee list with notes</div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-indigo-500" /> Action items with owners &amp; deadlines</div>
              <div className="flex items-center gap-2"><Mic className="h-4 w-4 text-indigo-500" /> Paste transcript for AI formatting</div>
            </div>
            <div className="flex gap-3 pt-2">
              <Link href="/meeting-minutes/normal/new">
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                  New Meeting
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/meeting-minutes/normal">
                <Button variant="outline" className="gap-1.5 border-indigo-200 hover:border-indigo-400">
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Link href="/meeting-minutes/all">
          <Button variant="ghost" className="gap-1.5 text-muted-foreground">
            <FileText className="h-4 w-4" />
            View all meetings
          </Button>
        </Link>
      </div>
    </div>
  );
}
