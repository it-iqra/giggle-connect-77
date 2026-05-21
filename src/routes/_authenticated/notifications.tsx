import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

interface Notif {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean | null;
  created_at: string;
}

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setItems((data as Notif[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  async function markAllRead() {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <button onClick={markAllRead} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-accent">
            <Check className="h-4 w-4" /> Mark all read
          </button>
        </div>

        <div className="mt-6 space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
              <Bell className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">You're all caught up.</p>
            </div>
          ) : (
            items.map((n) => (
              <div key={n.id} className={`rounded-xl border p-4 ${n.is_read ? "border-border bg-card" : "border-primary/40 bg-primary/5"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
