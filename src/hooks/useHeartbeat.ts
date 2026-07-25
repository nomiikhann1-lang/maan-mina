import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const HEARTBEAT_MS = 25_000;

export function useHeartbeat(userId: string) {
  useEffect(() => {
    let cancelled = false;
    let interval: number | null = null;

    async function beat() {
      if (cancelled || document.visibilityState !== "visible") return;
      await supabase
        .from("profiles")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", userId);
    }

    function start() {
      if (interval) return;
      void beat();
      interval = window.setInterval(beat, HEARTBEAT_MS);
    }
    function stop() {
      if (interval) {
        window.clearInterval(interval);
        interval = null;
      }
    }
    function onVisibility() {
      if (document.visibilityState === "visible") start();
      else stop();
    }

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [userId]);
}
