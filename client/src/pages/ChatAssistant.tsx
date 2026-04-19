import { useState, useRef, useEffect } from "react";
import {
  Send, Mic, MicOff, Volume2, VolumeX, Sparkles,
  MessageSquare, Loader2, RotateCcw,
  BookOpen, Search, Target, Clock, Zap, CheckCircle2,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SMART_ACTIONS = [
  {
    id: "pickup",
    label: "Pick up where I left off",
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-200 dark:border-blue-800",
    description: "Resume your last session",
    prompt: "I want to pick up where I left off. Based on my current tasks and meetings, what was I working on and what are the 3 most important things I should do next?",
    fetchContext: true,
  },
  {
    id: "prioritise",
    label: "What should I prioritise?",
    icon: Target,
    color: "text-orange-600",
    bg: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-200 dark:border-orange-800",
    description: "Get your focus for today",
    prompt: "Based on my current tasks and deadlines, what should I prioritise right now? Use urgency × importance framing and give me a ranked action list with clear reasoning.",
    fetchContext: true,
  },
  {
    id: "deliverables",
    label: "Check deliverables",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800",
    description: "Are we on track?",
    prompt: "Review my outstanding tasks and upcoming meetings. Are all deliverables on track? What's at risk of being missed and what immediate action should I take?",
    fetchContext: true,
  },
  {
    id: "find",
    label: "Find a document",
    icon: Search,
    color: "text-violet-600",
    bg: "bg-violet-500/10 hover:bg-violet-500/20 border-violet-200 dark:border-violet-800",
    description: "Locate files & minutes",
    prompt: "I need help finding a document. Please ask me what type of document I'm looking for and help me locate it, recreate it, or point me to where it should be.",
    fetchContext: false,
  },
  {
    id: "skill",
    label: "Learn a new skill",
    icon: BookOpen,
    color: "text-rose-600",
    bg: "bg-rose-500/10 hover:bg-rose-500/20 border-rose-200 dark:border-rose-800",
    description: "B-BBEE, governance & more",
    prompt: "I want to learn something new relevant to my work. Give me a numbered menu of learning topics — B-BBEE scoring, Companies Act procedure, King IV principles, company secretarial practice — then teach me whichever I choose.",
    fetchContext: false,
  },
  {
    id: "brief",
    label: "Quick B-BBEE briefing",
    icon: Zap,
    color: "text-amber-600",
    bg: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-200 dark:border-amber-800",
    description: "Compliance snapshot",
    prompt: "Give me a sharp B-BBEE briefing for today — the 5 key elements, current scoring priorities, common client pitfalls, and 3 things I should know before walking into a client meeting.",
    fetchContext: false,
  },
];

function uid() { return Math.random().toString(36).slice(2); }

function WaveformBars() {
  return (
    <div className="flex items-end gap-0.5 h-5 px-1">
      {[0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.75].map((h, i) => (
        <div
          key={i}
          className="w-1 bg-red-500 rounded-full animate-pulse"
          style={{ height: `${h * 100}%`, minHeight: "3px", animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showActions, setShowActions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakingMsgIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchContext(): Promise<string> {
    try {
      const [tasksRes, meetingsRes] = await Promise.all([
        fetch("/api/tasks", { credentials: "include" }),
        fetch("/api/meetings", { credentials: "include" }),
      ]);
      const tasks = tasksRes.ok ? await tasksRes.json() : [];
      const meetings = meetingsRes.ok ? await meetingsRes.json() : [];

      const today = new Date().toISOString().split("T")[0];
      const overdue = tasks.filter((t: any) => t.dueDate && t.dueDate < today && t.status !== "done");
      const upcoming = tasks.filter((t: any) => t.dueDate && t.dueDate >= today && t.status !== "done").slice(0, 8);
      const recentMeetings = meetings.slice(0, 5);

      return [
        "\n\n--- LIVE WORKSPACE CONTEXT ---",
        `Today: ${today}`,
        `Overdue tasks (${overdue.length}): ${overdue.map((t: any) => `"${t.title}" due ${t.dueDate} [${t.priority}]`).join(", ") || "none"}`,
        `Upcoming tasks (${upcoming.length}): ${upcoming.map((t: any) => `"${t.title}" due ${t.dueDate} [${t.status}]`).join(", ") || "none"}`,
        `Recent meetings (${recentMeetings.length}): ${recentMeetings.map((m: any) => `${m.meetingType} – ${m.companyName} on ${m.meetingDate} [${m.status}]`).join(", ") || "none"}`,
        "---",
      ].join("\n");
    } catch {
      return "";
    }
  }

  async function sendMessage(text: string, withContext = false) {
    if (!text.trim() || streaming) return;

    let promptText = text.trim();
    if (withContext) {
      const ctx = await fetchContext();
      promptText = text.trim() + ctx;
    }

    const userMsg: Message = { id: uid(), role: "user", content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setShowActions(false);

    const assistantId = uid();
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }]);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      if (withContext) history[history.length - 1].content = promptText;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n").filter(l => l.startsWith("data: "))) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m));
            }
          } catch {}
        }
      }

      if (voiceEnabled && fullText) {
        speakingMsgIdRef.current = assistantId;
        speakText(fullText.slice(0, 900));
      }
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: "Sorry, I encountered an error. Check that your ANTHROPIC_API_KEY is configured." }
          : m
      ));
      toast({ title: "Chat error", description: err.message, variant: "destructive" });
    } finally {
      setStreaming(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        await transcribeAudio(new Blob(audioChunksRef.current, { type: mimeType }), mimeType);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setRecording(true);
    } catch {
      toast({ title: "Microphone access denied", description: "Allow microphone access in your browser settings.", variant: "destructive" });
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function transcribeAudio(blob: Blob, mimeType: string) {
    setTranscribing(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const res = await fetch("/api/voice/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ audio: base64, mimeType }),
      });

      if (!res.ok) throw new Error((await res.json()).message || "Transcription failed");
      const { transcript } = await res.json();
      if (transcript?.trim()) {
        await sendMessage(transcript.trim());
      } else {
        toast({ title: "No speech detected", description: "Please speak clearly and try again." });
      }
    } catch (err: any) {
      toast({ title: "Transcription failed", description: err.message, variant: "destructive" });
    } finally {
      setTranscribing(false);
    }
  }

  async function speakText(text: string) {
    stopSpeaking();
    setSpeaking(true);
    try {
      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text, voice: "nova" }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => setSpeaking(false);
      audio.play();
    } catch {
      setSpeaking(false);
      toast({ title: "Voice playback failed", description: "Check OPENAI_API_KEY is set in your environment.", variant: "destructive" });
    }
  }

  function stopSpeaking() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpeaking(false);
  }

  function clearChat() { setMessages([]); setShowActions(true); stopSpeaking(); }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  const busy = streaming || recording || transcribing;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-violet-500/10 p-2.5 rounded-xl">
            <MessageSquare className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold">AI Assistant</h1>
            <p className="text-xs text-muted-foreground">Powered by Claude · Voice by OpenAI Whisper</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVoiceEnabled(v => !v)}
            className={cn("gap-1.5 text-xs", voiceEnabled && "border-violet-400 text-violet-600 bg-violet-50 dark:bg-violet-950/30")}
          >
            {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {voiceEnabled ? "Voice on" : "Voice off"}
          </Button>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="gap-1.5 text-xs text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" />Clear
            </Button>
          )}
        </div>
      </div>

      {/* Smart Action Cards */}
      {showActions && (
        <div className="shrink-0 mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            What would you like to do?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SMART_ACTIONS.map(action => (
              <button
                key={action.id}
                onClick={() => sendMessage(action.prompt, action.fetchContext)}
                disabled={busy}
                className={cn(
                  "flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all",
                  action.bg,
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                <div className="p-1.5 rounded-lg bg-white/60 dark:bg-black/20 shrink-0 mt-0.5">
                  <action.icon className={cn("h-3.5 w-3.5", action.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border bg-muted/20 p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="bg-violet-500/10 p-5 rounded-3xl">
              <Sparkles className="h-10 w-10 text-violet-500" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">How can I help you today?</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Pick an action above, type a message, or tap the mic to speak.
              </p>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="bg-violet-500/10 p-1.5 rounded-lg h-7 w-7 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-background border shadow-sm rounded-tl-sm"
              )}
            >
              {msg.content || (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />Thinking…
                </span>
              )}
            </div>
            {msg.role === "assistant" && msg.content && voiceEnabled && (
              <button
                onClick={() => {
                  if (speaking && speakingMsgIdRef.current === msg.id) {
                    stopSpeaking();
                  } else {
                    speakingMsgIdRef.current = msg.id;
                    speakText(msg.content.slice(0, 900));
                  }
                }}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted shrink-0 mt-0.5 transition-colors"
                title={speaking && speakingMsgIdRef.current === msg.id ? "Stop" : "Play response"}
              >
                {speaking && speakingMsgIdRef.current === msg.id
                  ? <StopCircle className="h-3.5 w-3.5 text-violet-500" />
                  : <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                }
              </button>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 shrink-0">
        <div className="flex gap-2 items-end bg-background border rounded-2xl p-2 shadow-sm focus-within:border-primary transition-colors">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              recording ? "Recording — tap mic to stop…"
              : transcribing ? "Transcribing your voice…"
              : "Ask anything or give an instruction…"
            }
            className="flex-1 border-0 focus-visible:ring-0 resize-none min-h-[40px] max-h-[120px] py-2 bg-transparent text-sm"
            rows={1}
            disabled={busy}
          />
          <div className="flex items-center gap-1.5 pb-1">
            {recording && <WaveformBars />}
            <Button
              size="icon"
              variant={recording ? "default" : "ghost"}
              className={cn(
                "h-9 w-9 rounded-xl shrink-0",
                recording && "bg-red-500 hover:bg-red-600 text-white",
                transcribing && "opacity-60"
              )}
              onClick={recording ? stopRecording : startRecording}
              disabled={streaming || transcribing}
              title={recording ? "Stop recording" : "Record voice (OpenAI Whisper)"}
            >
              {transcribing
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : recording
                  ? <MicOff className="h-4 w-4" />
                  : <Mic className="h-4 w-4" />
              }
            </Button>
            <Button
              size="icon"
              className="h-9 w-9 rounded-xl shrink-0"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || busy}
            >
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-1.5">
          Enter to send · Shift+Enter for new line · Mic for OpenAI voice input
        </p>
      </div>
    </div>
  );
}
