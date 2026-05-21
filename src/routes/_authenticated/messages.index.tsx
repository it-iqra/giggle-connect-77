import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/messages/")({
  component: MessagesIndex,
});

type Convo = { otherId: string; lastMessage: string; lastAt: string; name: string };

function MessagesIndex() {
  const { user } = useAuth();
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: msgs } = await supabase.from("messages")
        .select("sender_id,receiver_id,message,created_at")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false }).limit(200);

      const byOther = new Map<string, { msg: string; at: string }>();
      for (const m of msgs ?? []) {
        const other = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!byOther.has(other)) byOther.set(other, { msg: m.message, at: m.created_at });
      }
      const ids = Array.from(byOther.keys());
      if (ids.length === 0) { setConvos([]); setLoading(false); return; }
      const { data: profs } = await supabase.from("profiles").select("id,username,full_name").in("id", ids);
      const nameMap = new Map((profs ?? []).map(p => [p.id, p.full_name ?? p.username ?? "User"]));
      setConvos(ids.map(id => ({ otherId: id, lastMessage: byOther.get(id)!.msg, lastAt: byOther.get(id)!.at, name: nameMap.get(id) ?? "User" })));
      setLoading(false);
    })();
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
            <Link key={c.otherId} to="/messages/$id" params={{ id: c.otherId }} className="flex items-center gap-4 border-b border-border p-4 last:border-0 hover:bg-muted/50">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground font-bold">{c.name[0]?.toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between"><span className="font-semibold">{c.name}</span><span className="text-xs text-muted-foreground">{new Date(c.lastAt).toLocaleDateString()}</span></div>
                <p className="truncate text-sm text-muted-foreground">{c.lastMessage}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
