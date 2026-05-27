import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { OnlineDot } from "@/components/OnlineStatus";

export const Route = createFileRoute("/_authenticated/messages/")({
  component: MessagesIndex,
});

type Convo = { otherId: string; lastMessage: string; lastAt: string; name: string; avatar: string | null; unread: number };

function MessagesIndex() {
  const { user } = useAuth();
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    const { data: msgs } = await supabase.from("messages")
      .select("sender_id,receiver_id,message,created_at,is_read")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false }).limit(500);

    const byOther = new Map<string, { msg: string; at: string; unread: number }>();
    for (const m of msgs ?? []) {
      const other = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      const isUnread = m.receiver_id === user.id && !m.is_read ? 1 : 0;
      const cur = byOther.get(other);
      if (!cur) byOther.set(other, { msg: m.message, at: m.created_at, unread: isUnread });
      else cur.unread += isUnread;
    }
    const ids = Array.from(byOther.keys());
    if (ids.length === 0) { setConvos([]); setLoading(false); return; }
    const { data: profs } = await supabase.from("profiles").select("id,username,full_name,avatar_url").in("id", ids);
    const profMap = new Map((profs ?? []).map(p => [p.id, p]));
    setConvos(ids.map(id => {
      const p = profMap.get(id);
      const c = byOther.get(id)!;
      return { otherId: id, lastMessage: c.msg, lastAt: c.at, unread: c.unread, name: p?.full_name ?? p?.username ?? "User", avatar: p?.avatar_url ?? null };
    }).sort((a, b) => +new Date(b.lastAt) - +new Date(a.lastAt)));
    setLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel(`inbox:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-bold">Messages</h1>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          {loading ? <p className="p-6 text-muted-foreground">Loading...</p> : convos.length === 0 ? (
            <p className="p-12 text-center text-muted-foreground">No conversations yet. Message a seller from a gig page.</p>
          ) : convos.map((c) => (
            <Link
              key={c.otherId}
              to="/messages/$id"
              params={{ id: c.otherId }}
              className={`flex items-center gap-4 border-b border-border p-4 last:border-0 transition-colors ${c.unread > 0 ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"}`}
            >
              <div className="relative">
                {c.avatar ? (
                  <img src={c.avatar} alt={c.name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground font-bold">{c.name[0]?.toUpperCase()}</div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5"><OnlineDot userId={c.otherId} /></span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between">
                  <span className={c.unread > 0 ? "font-bold text-foreground" : "font-semibold"}>{c.name}</span>
                  <span className={`text-xs ${c.unread > 0 ? "text-primary font-semibold" : "text-muted-foreground"}`}>{new Date(c.lastAt).toLocaleDateString()}</span>
                </div>
                <p className={`truncate text-sm ${c.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>{c.lastMessage}</p>
              </div>
              {c.unread > 0 && (
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">{c.unread}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
