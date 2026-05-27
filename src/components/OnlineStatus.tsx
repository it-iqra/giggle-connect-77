import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/** Stale threshold: a profile flagged online but with last_seen older than this is treated as offline. */
const STALE_MS = 90_000;

function timeAgo(iso: string | null): string {
  if (!iso) return "a while ago";
  const diff = Date.now() - +new Date(iso);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function useUserPresence(userId: string | null | undefined) {
  const [state, setState] = useState<{ is_online: boolean; last_seen: string | null }>({ is_online: false, last_seen: null });

  useEffect(() => {
    if (!userId) return;
    let active = true;

    supabase.from("profiles").select("is_online,last_seen").eq("id", userId).maybeSingle()
      .then(({ data }) => { if (active && data) setState({ is_online: !!data.is_online, last_seen: data.last_seen ?? null }); });

    const ch = supabase.channel(`presence:${userId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (p) => {
          const row = p.new as { is_online: boolean; last_seen: string | null };
          setState({ is_online: !!row.is_online, last_seen: row.last_seen ?? null });
        })
      .subscribe();

    // Re-evaluate staleness every 30s so UI flips to offline without an update event
    const tick = setInterval(() => setState((s) => ({ ...s })), 30_000);
    return () => { active = false; supabase.removeChannel(ch); clearInterval(tick); };
  }, [userId]);

  const isOnlineEffective = state.is_online && state.last_seen ? (Date.now() - +new Date(state.last_seen) < STALE_MS) : state.is_online;
  return { isOnline: isOnlineEffective, lastSeen: state.last_seen, lastSeenText: timeAgo(state.last_seen) };
}

interface OnlineDotProps {
  userId: string | null | undefined;
  className?: string;
  showLabel?: boolean;
}

export function OnlineDot({ userId, className, showLabel = false }: OnlineDotProps) {
  const { isOnline, lastSeenText } = useUserPresence(userId);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full ring-2 ring-background",
          isOnline ? "bg-success" : "bg-muted-foreground/50"
        )}
        title={isOnline ? "Online" : `Last seen ${lastSeenText}`}
      />
      {showLabel && (
        <span className={cn("text-xs", isOnline ? "text-success" : "text-muted-foreground")}>
          {isOnline ? "Online" : `Last seen ${lastSeenText}`}
        </span>
      )}
    </span>
  );
}
