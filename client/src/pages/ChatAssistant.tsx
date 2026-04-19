import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Mic, MicOff, Volume2, VolumeX, Sparkles,
  MessageSquare, Loader2, RotateCcw, ChevronDown,
  Calendar, CheckSquare, NotebookPen, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { label: "Schedule a meeting", icon: Calendar, prompt: "I need to schedule a meeting. What details do you need?" },
  { label: "Add a task", icon: CheckSquare, prompt: "I want to add a new task. Can you help me set it up?" },
  { label: "New board minutes", icon: NotebookPen, prompt: "I need to start board meeting minutes. What information do you need from me?" },
  { label: "Summarise my day", icon: Sparkles, prompt: "Give me a quick summary of what I should focus on today based on my tasks and upcoming meetings." },
];

const SUGGESTED_PROMPTS = [
  "What tasks are overdue or due soon?",
  "Draft an agenda for a board meeting",
  "How do I calculate B-BBEE ownership scores?",
  "Remind me about the steps for an AGM",
  "What Zoho integrations are available?",
];

function uid() { return Math.random().toString(36).slice(2); }

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Speech recognition setup
  const speechAvailable = typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const startListening = useCallback(() => {
    if (!speechAvailable) {
      toast({ title: "Voice input not supported in this browser", variant: "destructive" });
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "en-ZA";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onerror = () => {
      setListening(false);
      toast({ title: "Voice recognition error", variant: "destructive" });
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [speechAvailable, toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-ZA";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;

    const userMsg: Message = { id: uid(), role: "user", content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setShowSuggestions(false);

    const assistantId = uid();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", timestamp: new Date() };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

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
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m)
              );
            }
          } catch {}
        }
      }

      if (voiceEnabled && fullText) {
        // Speak first 300 chars to avoid overly long TTS
        speak(fullText.slice(0, 300) + (fullText.length > 300 ? "..." : ""));
      }
    } catch (err: any) {
      setMessages(prev =>
        prev.map(m => m.id === assistantId
          ? { ...m, content: "Sorry, I encountered an error. Please check your ANTHROPIC_API_KEY is set and try again." }
          : m)
      );
      toast({ title: "Chat error", description: err.message, variant: "destructive" });
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function clearChat() {
    setMessages([]);
    setShowSuggestions(true);
    window.speechSynthesis?.cancel();
  }

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
            <p className="text-xs text-muted-foreground">Powered by Claude — your intelligent Okiru Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {speechAvailable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVoiceEnabled(v => !v)}
              className={cn("gap-1.5", voiceEnabled && "border-violet-400 text-violet-600 bg-violet-50 dark:bg-violet-950/30")}
            >
              {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              {voiceEnabled ? "Voice on" : "Voice off"}
            </Button>
          )}
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="gap-1.5 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-3 flex-wrap shrink-0">
        {QUICK_ACTIONS.map(a => (
          <Button
            key={a.label}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => sendMessage(a.prompt)}
            disabled={streaming}
          >
            <a.icon className="h-3 w-3" />
            {a.label}
          </Button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border bg-muted/20 p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="bg-violet-500/10 p-5 rounded-3xl">
              <Sparkles className="h-10 w-10 text-violet-500" />
            </div>
            <div className="space-y-1">
              <h2 className="font-semibold text-lg">How can I help you today?</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Ask me to schedule meetings, manage tasks, explain B-BBEE concepts, or anything else.
                {speechAvailable && " You can also use your voice."}
              </p>
            </div>
            {showSuggestions && (
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {SUGGESTED_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-xs bg-background border rounded-full px-3 py-1.5 hover:border-primary hover:text-primary transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            {msg.role === "assistant" && (
              <div className="bg-violet-500/10 p-1.5 rounded-lg h-7 w-7 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-background border shadow-sm rounded-tl-sm"
              )}
            >
              {msg.content || (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking…
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="mt-3 shrink-0">
        <div className="flex gap-2 items-end bg-background border rounded-2xl p-2 shadow-sm focus-within:border-primary transition-colors">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={listening ? "Listening…" : "Ask anything or give an instruction…"}
            className="flex-1 border-0 focus-visible:ring-0 resize-none min-h-[40px] max-h-[120px] py-2 bg-transparent"
            rows={1}
            disabled={streaming}
          />
          <div className="flex items-center gap-1.5 pb-1">
            {speechAvailable && (
              <Button
                size="icon"
                variant={listening ? "default" : "ghost"}
                className={cn("h-9 w-9 rounded-xl shrink-0", listening && "bg-red-500 hover:bg-red-600 animate-pulse")}
                onClick={listening ? stopListening : startListening}
                disabled={streaming}
                title={listening ? "Stop recording" : "Start voice input"}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            <Button
              size="icon"
              className="h-9 w-9 rounded-xl shrink-0"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
            >
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-1.5">
          Press Enter to send · Shift+Enter for new line{speechAvailable ? " · Click mic for voice" : ""}
        </p>
      </div>
    </div>
  );
}
