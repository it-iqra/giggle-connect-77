import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { OnlineDot } from "@/components/OnlineStatus";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  component: ChatThread,
});

type Msg = { id: string; sender_id: string; receiver_id: string; message: string; created_at: string; is_read?: boolean };

function ChatThread() {
  const { id: otherId } = Route.useParams();
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [otherName, setOtherName] = useState("User");
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);
  const initialLoadDone = useRef(false);

  async function markRead(ids: string[]) {
    if (!ids.length || !user) return;
    await supabase.from("messages").update({ is_read: true }).in("id", ids).eq("receiver_id", user.id);
  }

  useEffect(() => {
    if (!user) return;
    initialLoadDone.current = false;
    (async () => {
      const [{ data: messages }, { data: prof }] = await Promise.all([
        supabase.from("messages").select("*")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: true }),
        supabase.from("profiles").select("username,full_name").eq("id", otherId).maybeSingle(),
      ]);
      const list = (messages ?? []) as Msg[];
      setMsgs(list);
      if (prof) setOtherName(prof.full_name ?? prof.username ?? "User");
      const unreadIds = list.filter(m => m.receiver_id === user.id && !m.is_read).map(m => m.id);
      if (unreadIds.length) markRead(unreadIds);
      initialLoadDone.current = true;
    })();

    const channel = supabase.channel(`chat:${user.id}:${otherId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Msg;
        if ((m.sender_id === user.id && m.receiver_id === otherId) || (m.sender_id === otherId && m.receiver_id === user.id)) {
          setMsgs(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
          if (m.receiver_id === user.id) {
            // highlight new incoming + mark read
            setHighlightIds(prev => new Set(prev).add(m.id));
            setTimeout(() => setHighlightIds(prev => { const n = new Set(prev); n.delete(m.id); return n; }), 3500);
            markRead([m.id]);
          }
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, otherId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText("");
    const { error, data } = await supabase.from("messages").insert({ sender_id: user!.id, receiver_id: otherId, message: t }).select().single();
    if (error) console.error(error);
    else if (data) setMsgs(prev => prev.some(x => x.id === data.id) ? prev : [...prev, data as Msg]);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 py-6">
        <Link to="/messages" className="text-sm text-muted-foreground">← Messages</Link>
        <div className="mt-2 flex items-center gap-3 border-b border-border pb-3">
          <div className="relative">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground font-bold">{otherName[0]?.toUpperCase()}</div>
            <span className="absolute -bottom-0.5 -right-0.5"><OnlineDot userId={otherId} /></span>
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">{otherName}</h1>
            <OnlineDot userId={otherId} showLabel />
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto py-4">
          {msgs.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet. Say hi 👋</p>}
          {msgs.map((m) => {
            const mine = m.sender_id === user!.id;
            const highlight = highlightIds.has(m.id);
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card border border-border"} ${highlight ? "flash-new" : ""}`}>
                  {m.message}
                  <div className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="flex gap-2 border-t border-border pt-3">
          <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." maxLength={2000} />
          <Button type="submit" size="icon" className="bg-[image:var(--gradient-primary)] text-primary-foreground"><Send className="h-4 w-4" /></Button>
        </form>
      </div>
    </div>
  );
}
