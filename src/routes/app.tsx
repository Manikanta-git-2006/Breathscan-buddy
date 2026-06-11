import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Activity, Plus, LogOut, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "PulmoScan AI" }] }),
  component: AppLayout,
});

type Thread = { id: string; title: string; updated_at: string };

function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const loadThreads = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("threads")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setThreads(data ?? []);
  };

  useEffect(() => {
    if (user) loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeId]);

  const createThread = async () => {
    if (!user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("threads")
      .insert({ user_id: user.id, title: "New analysis" })
      .select("id, title, updated_at")
      .single();
    setCreating(false);
    if (error || !data) {
      toast.error(error?.message ?? "Could not create thread");
      return;
    }
    setThreads((t) => [data, ...t]);
    navigate({ to: "/app/$threadId", params: { threadId: data.id } });
  };

  const deleteThread = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("threads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setThreads((t) => t.filter((x) => x.id !== id));
    if (activeId === id) navigate({ to: "/app" });
  };

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden w-72 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div
            className="grid h-8 w-8 place-items-center rounded-lg text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
          >
            <Activity className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">PulmoScan AI</span>
        </div>
        <div className="px-3">
          <Button
            onClick={createThread}
            disabled={creating}
            className="w-full justify-start gap-2 shadow-[var(--shadow-soft)]"
          >
            <Plus className="h-4 w-4" /> New analysis
          </Button>
        </div>
        <nav className="mt-4 flex-1 overflow-y-auto px-2">
          {threads.length === 0 ? (
            <p className="px-3 py-6 text-xs text-muted-foreground">
              No analyses yet. Start a new one above.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {threads.map((t) => (
                <li key={t.id}>
                  <div
                    onClick={() => navigate({ to: "/app/$threadId", params: { threadId: t.id } })}
                    className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      activeId === t.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-accent/60"
                    }`}
                  >
                    <span className="truncate">{t.title}</span>
                    <button
                      onClick={(e) => deleteThread(t.id, e)}
                      className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      aria-label="Delete thread"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 truncate px-2 text-xs text-muted-foreground">{user.email}</div>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <MobileBar onNew={createThread} />
        <Outlet />
      </main>
    </div>
  );
}

function MobileBar({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
      <Link to="/app" className="flex items-center gap-2 font-semibold">
        <div
          className="grid h-7 w-7 place-items-center rounded-lg text-primary-foreground"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Activity className="h-3.5 w-3.5" />
        </div>
        PulmoScan
      </Link>
      <Button size="sm" onClick={onNew}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}