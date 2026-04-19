import { useEffect, useState } from "react";
import {
  Plus, CheckSquare, Trash2, Edit3, Calendar,
  Loader2, Flag, User, FolderOpen, CheckCircle2, Circle,
  Clock, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Task } from "@shared/schema";

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
  high:   { label: "High",   color: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  low:    { label: "Low",    color: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" },
};

const STATUS_CONFIG = {
  todo:        { label: "To Do",       icon: Circle,       color: "text-muted-foreground" },
  in_progress: { label: "In Progress", icon: Clock,        color: "text-blue-600" },
  done:        { label: "Done",        icon: CheckCircle2, color: "text-green-600" },
  cancelled:   { label: "Cancelled",   icon: Circle,       color: "text-muted-foreground/50" },
};

const EMPTY_FORM = {
  title: "", description: "", priority: "medium", status: "todo",
  dueDate: "", projectName: "", assignee: "",
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message);
  }
  return res.json();
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    apiFetch<Task[]>("/api/tasks")
      .then(setTasks)
      .catch(() => toast({ title: "Failed to load tasks", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  function openNew() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(task: Task) {
    setForm({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ?? "",
      projectName: task.projectName ?? "",
      assignee: task.assignee ?? "",
    });
    setEditingId(task.id);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description || undefined,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || undefined,
        projectName: form.projectName || undefined,
        assignee: form.assignee || undefined,
      };
      if (editingId) {
        const updated = await apiFetch<Task>(`/api/tasks/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
        setTasks(prev => prev.map(t => t.id === editingId ? updated : t));
        toast({ title: "Task updated" });
      } else {
        const created = await apiFetch<Task>("/api/tasks", { method: "POST", body: JSON.stringify(payload) });
        setTasks(prev => [created, ...prev]);
        toast({ title: "Task created" });
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(task: Task) {
    const next = task.status === "done" ? "todo" : task.status === "todo" ? "in_progress" : "done";
    try {
      const updated = await apiFetch<Task>(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks(prev => prev.filter(t => t.id !== id));
      toast({ title: "Task deleted" });
    } catch {
      toast({ title: "Failed to delete task", variant: "destructive" });
    }
  }

  const filtered = tasks.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === "todo").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
    overdue: tasks.filter(t => t.dueDate && t.dueDate < new Date().toISOString().slice(0, 10) && t.status !== "done" && t.status !== "cancelled").length,
  };

  function isOverdue(task: Task) {
    return task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== "done" && task.status !== "cancelled";
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl">
            <CheckSquare className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold">Tasks & Calendar</h1>
            <p className="text-sm text-muted-foreground">Track project deadlines and consultant assignments</p>
          </div>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",       value: stats.total,      color: "text-foreground" },
          { label: "In Progress", value: stats.inProgress, color: "text-blue-600" },
          { label: "Done",        value: stats.done,        color: "text-green-600" },
          { label: "Overdue",     value: stats.overdue,     color: stats.overdue > 0 ? "text-red-600" : "text-muted-foreground" },
        ].map(s => (
          <Card key={s.label} className="text-center py-3">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center">{filtered.length} task{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 gap-4">
            <CheckSquare className="h-12 w-12 text-muted-foreground/40" />
            <div className="text-center">
              <p className="font-semibold text-muted-foreground">No tasks yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create a task to track your work</p>
            </div>
            <Button variant="outline" onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" />Add First Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const pCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium;
            const sCfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.todo;
            const StatusIcon = sCfg.icon;
            const overdue = isOverdue(task);

            return (
              <Card key={task.id} className={cn("hover:shadow-sm transition-shadow", task.status === "done" && "opacity-60")}>
                <CardContent className="py-3 px-4 flex items-start gap-3">
                  <button
                    onClick={() => toggleStatus(task)}
                    className={cn("mt-0.5 shrink-0 transition-colors", sCfg.color, "hover:scale-110")}
                    title="Cycle status"
                  >
                    <StatusIcon className="h-5 w-5" />
                  </button>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className={cn("font-medium text-sm", task.status === "done" && "line-through text-muted-foreground")}>
                        {task.title}
                      </span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", pCfg.color)}>
                        {pCfg.label}
                      </span>
                      {overdue && <Badge variant="destructive" className="text-xs h-5">Overdue</Badge>}
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {task.dueDate && (
                        <span className={cn("flex items-center gap-1", overdue && "text-red-600 font-medium")}>
                          <Calendar className="h-3 w-3" />{task.dueDate}
                        </span>
                      )}
                      {task.assignee && (
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{task.assignee}</span>
                      )}
                      {task.projectName && (
                        <span className="flex items-center gap-1"><FolderOpen className="h-3 w-3" />{task.projectName}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(task)}>
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Task</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete "{task.title}". This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(task.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
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

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Task" : "New Task"}</DialogTitle>
            <DialogDescription>Fill in the task details below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Additional details…" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Assignee</Label>
                <Input value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} placeholder="Name or role" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Project / Category</Label>
              <Input value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} placeholder="e.g. Client ABC Engagement" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
