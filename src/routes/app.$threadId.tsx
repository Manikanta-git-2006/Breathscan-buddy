import { createFileRoute, useParams } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X, ImageIcon, FileText, Loader2, Activity } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/app/$threadId")({
  component: ThreadPage,
});

type DbMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments: { name: string; type: string }[];
  created_at: string;
};

function ThreadPage() {
  const { threadId } = useParams({ from: "/app/$threadId" });
  const { user } = useAuth();
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [attachMeta, setAttachMeta] = useState<Record<string, { name: string; type: string }[]>>({});

  // Load history on thread change
  useEffect(() => {
    let active = true;
    setInitial(null);
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, role, content, attachments, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (!active) return;
      if (error) {
        toast.error(error.message);
        setInitial([]);
        return;
      }
      const msgs: UIMessage[] = (data as DbMsg[]).map((m) => ({
        id: m.id,
        role: m.role,
        parts: [{ type: "text", text: m.content }],
      }));
      const meta: Record<string, { name: string; type: string }[]> = {};
      for (const m of data as DbMsg[]) if (m.attachments?.length) meta[m.id] = m.attachments;
      setAttachMeta(meta);
      setInitial(msgs);
    })();
    return () => {
      active = false;
    };
  }, [threadId]);

  if (initial === null || !user) {
    return (
      <div className="grid h-full place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ChatWindow
      key={threadId}
      threadId={threadId}
      userId={user.id}
      initialMessages={initial}
      attachMeta={attachMeta}
    />
  );
}

function ChatWindow({
  threadId,
  userId,
  initialMessages,
  attachMeta: initialAttachMeta,
}: {
  threadId: string;
  userId: string;
  initialMessages: UIMessage[];
  attachMeta: Record<string, { name: string; type: string }[]>;
}) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const [attachMeta, setAttachMeta] = useState(initialAttachMeta);
  const lastSavedRef = useRef<string | null>(null);

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message ?? "Stream error"),
    onFinish: async ({ message }) => {
      const text = textOf(message);
      if (!text || lastSavedRef.current === message.id) return;
      lastSavedRef.current = message.id;
      const { error } = await supabase.from("messages").insert({
        thread_id: threadId,
        user_id: userId,
        role: "assistant",
        content: text,
        attachments: [],
      });
      if (error) toast.error("Save failed: " + error.message);
      await supabase.from("threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
    },
  });

  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    textRef.current?.focus();
  }, [threadId, status]);

  const submit = async () => {
    const text = input.trim();
    if (!text && files.length === 0) return;
    if (status === "submitted" || status === "streaming") return;

    const fileList = new DataTransfer();
    for (const f of files) fileList.items.add(f);
    const attachments = files.map((f) => ({ name: f.name, type: f.type }));

    // Persist user message
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({
        thread_id: threadId,
        user_id: userId,
        role: "user",
        content: text,
        attachments,
      })
      .select("id")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (attachments.length && inserted) {
      setAttachMeta((m) => ({ ...m, [inserted.id]: attachments }));
    }

    // If first user message in thread, set title
    if (messages.length === 0) {
      const title = text.slice(0, 60) || (attachments[0]?.name ?? "New analysis");
      await supabase.from("threads").update({ title }).eq("id", threadId);
    }

    setInput("");
    setFiles([]);
    if (fileRef.current) fileRef.current.value = "";

    await sendMessage({ text, files: fileList.files });
  };

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {messages.length === 0 && (
            <div className="mb-8 rounded-2xl border border-border bg-card p-6 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <div
                  className="grid h-7 w-7 place-items-center rounded-lg text-primary-foreground"
                  style={{ background: "var(--gradient-hero)" }}
                >
                  <Activity className="h-3.5 w-3.5" />
                </div>
                PulmoScan AI
              </div>
              <p className="mt-3 text-muted-foreground">
                Hello! Attach a chest X-ray image or a radiology report PDF and I'll analyse it.
                You can also just type a question.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} attachments={attachMeta[m.id]} />
          ))}

          {status === "submitted" && (
            <div className="my-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Analysing…
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-card/50 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4">
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs"
                >
                  {f.type.startsWith("image/") ? (
                    <ImageIcon className="h-3 w-3" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  {f.name}
                  <button
                    onClick={() => setFiles((arr) => arr.filter((_, j) => j !== i))}
                    className="hover:text-destructive"
                    aria-label="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:ring-2 focus-within:ring-ring">
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                setFiles((cur) => [...cur, ...list]);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileRef.current?.click()}
              disabled={isLoading}
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea
              ref={textRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask about a chest X-ray or paste a report…"
              rows={1}
              className="min-h-0 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              disabled={isLoading}
            />
            <Button
              type="button"
              size="icon"
              onClick={submit}
              disabled={isLoading || (!input.trim() && files.length === 0)}
              className="shadow-[var(--shadow-soft)]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Educational tool only. Not a medical diagnosis. Always consult a clinician.
          </p>
        </div>
      </div>
    </div>
  );
}

function textOf(m: UIMessage): string {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
}

function MessageBubble({
  message,
  attachments,
}: {
  message: UIMessage;
  attachments?: { name: string; type: string }[];
}) {
  const isUser = message.role === "user";
  const text = textOf(message);

  return (
    <div className={`my-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card text-card-foreground"
        }`}
        style={isUser ? undefined : { boxShadow: "var(--shadow-card)" }}
      >
        {attachments && attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {attachments.map((a, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                  isUser ? "bg-primary-foreground/15" : "bg-muted"
                }`}
              >
                {a.type.startsWith("image/") ? (
                  <ImageIcon className="h-3 w-3" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
                {a.name}
              </span>
            ))}
          </div>
        )}
        {message.parts.map((p, i) =>
          p.type === "file" && p.mediaType?.startsWith("image/") ? (
            <img
              key={i}
              src={p.url}
              alt="attachment"
              className="mb-2 max-h-64 rounded-lg"
            />
          ) : null,
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap">{text}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-1 prose-p:my-2 prose-ul:my-2 prose-li:my-0">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}