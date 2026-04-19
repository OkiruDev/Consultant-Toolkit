import type {
  Meeting, InsertMeeting,
  MeetingAttendee, InsertMeetingAttendee,
  MeetingAgendaItem, InsertMeetingAgendaItem,
  MeetingActionItem, InsertMeetingActionItem,
} from "@shared/schema";

export type MeetingDetails = {
  meeting: Meeting;
  attendees: MeetingAttendee[];
  agendaItems: MeetingAgendaItem[];
  actionItems: MeetingActionItem[];
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message || "Request failed");
  }
  return res.json();
}

export const meetingApi = {
  list: () => request<Meeting[]>("/api/meetings"),

  get: (id: string) => request<MeetingDetails>(`/api/meetings/${id}`),

  create: (data: Omit<InsertMeeting, "organizationId" | "createdByUserId">) =>
    request<Meeting>("/api/meetings", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Partial<InsertMeeting>) =>
    request<Meeting>(`/api/meetings/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/meetings/${id}`, { method: "DELETE" }),

  replaceAttendees: (id: string, attendees: Omit<InsertMeetingAttendee, "meetingId">[]) =>
    request<MeetingAttendee[]>(`/api/meetings/${id}/attendees`, {
      method: "PUT",
      body: JSON.stringify(attendees),
    }),

  replaceAgendaItems: (id: string, items: Omit<InsertMeetingAgendaItem, "meetingId">[]) =>
    request<MeetingAgendaItem[]>(`/api/meetings/${id}/agenda-items`, {
      method: "PUT",
      body: JSON.stringify(items),
    }),

  replaceActionItems: (id: string, items: Omit<InsertMeetingActionItem, "meetingId">[]) =>
    request<MeetingActionItem[]>(`/api/meetings/${id}/action-items`, {
      method: "PUT",
      body: JSON.stringify(items),
    }),

  generate: (id: string) =>
    request<Meeting>(`/api/meetings/${id}/generate`, { method: "POST" }),
};

export const MEETING_TYPES = [
  { value: "board", label: "Board Meeting" },
  { value: "agm", label: "Annual General Meeting (AGM)" },
  { value: "egm", label: "Extraordinary General Meeting (EGM)" },
  { value: "exco", label: "Executive Committee Meeting" },
  { value: "audit", label: "Audit Committee Meeting" },
  { value: "remco", label: "Remuneration Committee Meeting" },
  { value: "other", label: "Other Meeting" },
] as const;

export const PLATFORMS = [
  { value: "google_meet", label: "Google Meet" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "zoom", label: "Zoom" },
  { value: "zoho_meet", label: "Zoho Meeting" },
  { value: "in_person", label: "In-Person" },
] as const;

export const ROLES = [
  { value: "director", label: "Director" },
  { value: "executive", label: "Executive" },
  { value: "secretary", label: "Company Secretary" },
  { value: "observer", label: "Observer" },
  { value: "guest", label: "Guest / Invitee" },
  { value: "attendee", label: "Attendee" },
] as const;

export const ATTENDANCE_STATUSES = [
  { value: "present", label: "Present" },
  { value: "apology", label: "Apology" },
  { value: "absent", label: "Absent" },
] as const;

export const PRIORITIES = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;

export const ACTION_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export function getMeetingTypeLabel(value: string) {
  return MEETING_TYPES.find(t => t.value === value)?.label ?? value;
}

export function getPlatformLabel(value: string) {
  return PLATFORMS.find(p => p.value === value)?.label ?? value;
}
