import { useEffect, useState, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import {
  Plus, Trash2, Sparkles, Save, ArrowLeft, Loader2,
  ChevronUp, ChevronDown, NotebookPen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  meetingApi, MEETING_TYPES, PLATFORMS, ROLES, ATTENDANCE_STATUSES, PRIORITIES,
} from "@/lib/meetingMinutesApi";
import type { Meeting, MeetingAttendee, MeetingAgendaItem, MeetingActionItem } from "@shared/schema";

type AttendeeRow = Omit<MeetingAttendee, "id" | "meetingId"> & { _key: string };
type AgendaRow = Omit<MeetingAgendaItem, "id" | "meetingId"> & { _key: string };
type ActionRow = Omit<MeetingActionItem, "id" | "meetingId"> & { _key: string };

function uid() {
  return Math.random().toString(36).slice(2);
}

const EMPTY_ATTENDEE = (): AttendeeRow => ({
  _key: uid(), name: "", position: "", role: "director", attendanceStatus: "present", sortOrder: 0,
});

const EMPTY_AGENDA = (index: number): AgendaRow => ({
  _key: uid(), itemNumber: String(index + 1), title: "", discussionNotes: "", resolution: "", sortOrder: index,
});

const EMPTY_ACTION = (): ActionRow => ({
  _key: uid(), description: "", responsiblePerson: "", dueDate: "", priority: "medium", status: "open", agendaItemId: null,
});

interface Props { defaultCategory?: "board" | "normal" }

export default function MeetingEditor({ defaultCategory }: Props = {}) {
  const params = useParams<{ id?: string }>();
  const meetingId = params?.id !== "new" ? params?.id : undefined;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(!!meetingId);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [savedId, setSavedId] = useState<string | null>(meetingId || null);

  // Meeting header fields
  const [companyName, setCompanyName] = useState("");
  const [companyRegistration, setCompanyRegistration] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [meetingType, setMeetingType] = useState("board");
  const [meetingDate, setMeetingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [platform, setPlatform] = useState("teams");
  const [meetingLink, setMeetingLink] = useState("");
  const [chairperson, setChairperson] = useState("");
  const [companySecretary, setCompanySecretary] = useState("");
  const [venue, setVenue] = useState("");
  const [rawNotes, setRawNotes] = useState("");

  const [attendees, setAttendees] = useState<AttendeeRow[]>([EMPTY_ATTENDEE()]);
  const [agendaItems, setAgendaItems] = useState<AgendaRow[]>([EMPTY_AGENDA(0)]);
  const [actionItems, setActionItems] = useState<ActionRow[]>([]);

  useEffect(() => {
    if (!meetingId) return;
    meetingApi.get(meetingId).then(details => {
      const m = details.meeting;
      setCompanyName(m.companyName);
      setCompanyRegistration(m.companyRegistration ?? "");
      setCompanyAddress(m.companyAddress ?? "");
      setMeetingType(m.meetingType);
      setMeetingDate(m.meetingDate);
      setStartTime(m.startTime ?? "");
      setEndTime(m.endTime ?? "");
      setPlatform(m.platform);
      setMeetingLink(m.meetingLink ?? "");
      setChairperson(m.chairperson);
      setCompanySecretary(m.companySecretary);
      setVenue(m.venue ?? "");
      setRawNotes(m.rawNotes ?? "");

      setAttendees(details.attendees.length > 0
        ? details.attendees.map(a => ({ ...a, _key: uid() }))
        : [EMPTY_ATTENDEE()]);
      setAgendaItems(details.agendaItems.length > 0
        ? details.agendaItems.map(a => ({ ...a, _key: uid() }))
        : [EMPTY_AGENDA(0)]);
      setActionItems(details.actionItems.map(a => ({ ...a, _key: uid() })));
    }).catch(() => {
      toast({ title: "Failed to load meeting", variant: "destructive" });
    }).finally(() => setLoading(false));
  }, [meetingId]);

  const getHeaderPayload = useCallback(() => ({
    companyName, companyRegistration: companyRegistration || undefined,
    companyAddress: companyAddress || undefined,
    meetingType, meetingDate, startTime: startTime || undefined, endTime: endTime || undefined,
    platform, meetingLink: meetingLink || undefined, chairperson, companySecretary,
    venue: venue || undefined, rawNotes: rawNotes || undefined,
  }), [companyName, companyRegistration, companyAddress, meetingType, meetingDate,
      startTime, endTime, platform, meetingLink, chairperson, companySecretary, venue, rawNotes]);

  async function handleSave() {
    if (!companyName || !meetingType || !meetingDate || !platform || !chairperson || !companySecretary) {
      toast({ title: "Please fill in all required fields on the Details tab", variant: "destructive" });
      setActiveTab("details");
      return;
    }
    setSaving(true);
    try {
      let id = savedId;
      if (!id) {
        const created = await meetingApi.create(getHeaderPayload());
        id = created.id;
        setSavedId(id);
      } else {
        await meetingApi.update(id, getHeaderPayload());
      }

      const validAttendees = attendees.filter(a => a.name.trim());
      const validAgenda = agendaItems.filter(a => a.title.trim());
      const validActions = actionItems.filter(a => a.description.trim() && a.responsiblePerson.trim());

      await Promise.all([
        meetingApi.replaceAttendees(id, validAttendees),
        meetingApi.replaceAgendaItems(id, validAgenda),
        meetingApi.replaceActionItems(id, validActions),
      ]);

      toast({ title: "Meeting saved successfully" });
      if (!savedId) navigate(`/meeting-minutes/${id}`);
    } catch (err: any) {
      toast({ title: err.message || "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (!savedId) {
      toast({ title: "Please save the meeting first", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      await meetingApi.generate(savedId);
      toast({ title: "Minutes generated successfully!" });
      navigate(`/meeting-minutes/${savedId}/view`);
    } catch (err: any) {
      toast({ title: err.message || "Generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  // ── Attendee helpers ─────────────────────────────────────────────────────────
  function updateAttendee<K extends keyof AttendeeRow>(index: number, field: K, value: AttendeeRow[K]) {
    setAttendees(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  }

  function moveAttendee(index: number, dir: -1 | 1) {
    setAttendees(prev => {
      const next = [...prev];
      const swap = index + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  }

  // ── Agenda helpers ───────────────────────────────────────────────────────────
  function updateAgenda<K extends keyof AgendaRow>(index: number, field: K, value: AgendaRow[K]) {
    setAgendaItems(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  }

  function addAgendaItem() {
    setAgendaItems(prev => [...prev, EMPTY_AGENDA(prev.length)]);
  }

  function removeAgendaItem(index: number) {
    setAgendaItems(prev => prev.filter((_, i) => i !== index).map((a, i) => ({ ...a, itemNumber: String(i + 1), sortOrder: i })));
  }

  // ── Action helpers ────────────────────────────────────────────────────────────
  function updateAction<K extends keyof ActionRow>(index: number, field: K, value: ActionRow[K]) {
    setActionItems(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-7 w-7 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/meeting-minutes")} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="bg-primary/10 p-2 rounded-lg">
            <NotebookPen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold">
              {savedId ? (companyName || "Edit Meeting") : "New Meeting"}
            </h1>
            <p className="text-xs text-muted-foreground">Meeting Minutes Editor</p>
          </div>
        </div>
        {savedId && (
          <Badge variant="outline" className="text-xs">ID: {savedId.slice(0, 8)}…</Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="notes">Notes & Actions</TabsTrigger>
        </TabsList>

        {/* ── Details Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="details" className="mt-5">
          <div className="grid gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">Company Information</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Company Name <span className="text-destructive">*</span></Label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme (Pty) Ltd" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Registration Number</Label>
                    <Input value={companyRegistration} onChange={e => setCompanyRegistration(e.target.value)} placeholder="2024/123456/07" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Registered Address</Label>
                  <Input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="123 Business Park, Johannesburg, 2000" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Meeting Details</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Meeting Type <span className="text-destructive">*</span></Label>
                    <Select value={meetingType} onValueChange={setMeetingType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MEETING_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Meeting Date <span className="text-destructive">*</span></Label>
                    <Input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Start Time</Label>
                    <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>End Time</Label>
                    <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Venue / Location</Label>
                    <Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Boardroom / Virtual" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Platform <span className="text-destructive">*</span></Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Meeting Link</Label>
                    <Input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Officials</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Chairperson <span className="text-destructive">*</span></Label>
                  <Input value={chairperson} onChange={e => setChairperson(e.target.value)} placeholder="Mr J Smith" />
                </div>
                <div className="space-y-1.5">
                  <Label>Company Secretary <span className="text-destructive">*</span></Label>
                  <Input value={companySecretary} onChange={e => setCompanySecretary(e.target.value)} placeholder="Ms A Jones" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Attendees Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="attendees" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Add all attendees, their positions, and attendance status.</p>
            <Button size="sm" variant="outline" onClick={() => setAttendees(prev => [...prev, EMPTY_ATTENDEE()])} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Attendee
            </Button>
          </div>

          <div className="space-y-3">
            {attendees.map((attendee, i) => (
              <Card key={attendee._key}>
                <CardContent className="pt-4 pb-3">
                  <div className="grid gap-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Full Name <span className="text-destructive">*</span></Label>
                        <Input
                          value={attendee.name}
                          onChange={e => updateAttendee(i, "name", e.target.value)}
                          placeholder="Dr A Dlamini"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Position / Designation</Label>
                        <Input
                          value={attendee.position ?? ""}
                          onChange={e => updateAttendee(i, "position", e.target.value)}
                          placeholder="Chief Executive Officer"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Role</Label>
                        <Select value={attendee.role} onValueChange={v => updateAttendee(i, "role", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Attendance</Label>
                        <Select value={attendee.attendanceStatus} onValueChange={v => updateAttendee(i, "attendanceStatus", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ATTENDANCE_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end gap-1 pb-0.5">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => moveAttendee(i, -1)} disabled={i === 0}>
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => moveAttendee(i, 1)} disabled={i === attendees.length - 1}>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => setAttendees(prev => prev.filter((_, idx) => idx !== i))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button size="sm" variant="outline" onClick={() => setAttendees(prev => [...prev, EMPTY_ATTENDEE()])} className="w-full gap-1.5 border-dashed">
            <Plus className="h-4 w-4" />
            Add Another Attendee
          </Button>
        </TabsContent>

        {/* ── Agenda Tab ──────────────────────────────────────────────────────── */}
        <TabsContent value="agenda" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Capture each agenda item with discussion notes and resolutions.</p>
            <Button size="sm" variant="outline" onClick={addAgendaItem} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {agendaItems.map((item, i) => (
              <Card key={item._key}>
                <CardContent className="pt-4 pb-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16">
                      <Label className="text-xs">Item #</Label>
                      <Input
                        value={item.itemNumber}
                        onChange={e => updateAgenda(i, "itemNumber", e.target.value)}
                        className="text-center font-mono"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Agenda Item Title <span className="text-destructive">*</span></Label>
                      <Input
                        value={item.title}
                        onChange={e => updateAgenda(i, "title", e.target.value)}
                        placeholder="Opening / Welcome / Financial Report"
                      />
                    </div>
                    <Button
                      variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive mt-4"
                      onClick={() => removeAgendaItem(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Discussion Notes</Label>
                    <Textarea
                      value={item.discussionNotes ?? ""}
                      onChange={e => updateAgenda(i, "discussionNotes", e.target.value)}
                      placeholder="Summarise discussion points, key information presented..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Resolution / Outcome</Label>
                    <Textarea
                      value={item.resolution ?? ""}
                      onChange={e => updateAgenda(i, "resolution", e.target.value)}
                      placeholder="It was resolved / noted / agreed that..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button variant="outline" onClick={addAgendaItem} className="w-full gap-1.5 border-dashed">
            <Plus className="h-4 w-4" />
            Add Agenda Item
          </Button>
        </TabsContent>

        {/* ── Notes & Actions Tab ─────────────────────────────────────────────── */}
        <TabsContent value="notes" className="mt-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Raw Notes / Meeting Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={rawNotes}
                onChange={e => setRawNotes(e.target.value)}
                placeholder="Paste the meeting transcript here, or type detailed notes. The AI will use this as the primary source to generate formal minutes. Include any context, discussions, or details not captured in the agenda items above."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Tip: You can copy the auto-transcript from Google Meet, Teams, Zoom, or Zoho Meeting and paste it here.
              </p>
            </CardContent>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold">Action Items</h3>
                <p className="text-xs text-muted-foreground">Track all decisions requiring follow-up action.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setActionItems(prev => [...prev, EMPTY_ACTION()])} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Action
              </Button>
            </div>

            {actionItems.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center py-8 gap-2">
                  <p className="text-sm text-muted-foreground">No action items yet</p>
                  <Button size="sm" variant="outline" onClick={() => setActionItems([EMPTY_ACTION()])} className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    Add First Action Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {actionItems.map((action, i) => (
                  <Card key={action._key}>
                    <CardContent className="pt-4 pb-3 space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Action Description <span className="text-destructive">*</span></Label>
                        <Textarea
                          value={action.description}
                          onChange={e => updateAction(i, "description", e.target.value)}
                          placeholder="Describe the action to be taken..."
                          rows={2}
                        />
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Responsible Person <span className="text-destructive">*</span></Label>
                          <Input
                            value={action.responsiblePerson}
                            onChange={e => updateAction(i, "responsiblePerson", e.target.value)}
                            placeholder="Name / Role"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Due Date</Label>
                          <Input
                            type="date"
                            value={action.dueDate ?? ""}
                            onChange={e => updateAction(i, "dueDate", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Priority</Label>
                          <Select value={action.priority} onValueChange={v => updateAction(i, "priority", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1.5"
                          onClick={() => setActionItems(prev => prev.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Sticky action bar ─────────────────────────────────────────────────── */}
      <Separator />
      <div className="flex items-center justify-between pb-4 gap-3 flex-wrap">
        <Button variant="outline" onClick={() => navigate("/meeting-minutes")} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back to List
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </Button>
          <Button onClick={handleGenerate} disabled={generating || saving} className="gap-1.5 bg-primary">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Generating Minutes…" : "Generate Minutes (AI)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
