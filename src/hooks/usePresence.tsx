import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Heartbeat presence: marks the current user online and updates last_seen periodically. */
export function usePresence() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const sessionId = crypto.randomUUID();

    const setOnline = () =>
      supabase.from("profiles")
        .update({ is_online: true, last_seen: new Date().toISOString(), current_session_id: sessionId })
        .eq("id", user.id);

    const setOffline = () =>
      supabase.from("profiles")
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq("id", user.id);

    setOnline();
    const heartbeat = setInterval(setOnline, 30_000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") setOnline();
      else setOffline();
    };
    const onBeforeUnload = () => {
      // Best-effort offline ping; navigator.sendBeacon won't carry auth, so just fire-and-forget
      setOffline();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      setOffline();
    };
  }, [user]);
}
