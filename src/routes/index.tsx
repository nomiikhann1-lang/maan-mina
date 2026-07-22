import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    let onboardingSeen = false;
    try {
      onboardingSeen = localStorage.getItem("onboarding_seen") === "1";
    } catch {
      onboardingSeen = true; // no localStorage — don't get stuck, just skip onboarding
    }
    if (!onboardingSeen) throw redirect({ to: "/onboarding" });

    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/home" });
    throw redirect({ to: "/auth" });
  },
  component: Splash,
});

function Splash() {
  // Fallback splash while redirecting.
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
  }, []);
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-background">
      <div className={show ? "bloom text-6xl" : "text-6xl opacity-0"}>🌻</div>
      <div
        className={show ? "pop-in font-display text-lg text-foreground" : "opacity-0"}
        style={{ animationDelay: "0.2s" }}
      >
        Maan &amp; Mina
      </div>
    </div>
  );
}
