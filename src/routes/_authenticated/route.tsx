import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CoupleSettingsProvider } from "@/lib/coupleSettings";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { SurpriseOverlay } from "@/components/SurpriseOverlay";
import { playSurpriseChime } from "@/lib/sound";
import type { SurpriseKind } from "@/lib/surprise";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  useHeartbeat(user.id);
  const [surpriseKind, setSurpriseKind] = useState<SurpriseKind | null>(null);

  // Lives at the layout level (not inside chat.tsx) so a live surprise
  // effect fires no matter which screen you're currently on — home,
  // chat, settings, wherever.
  useEffect(() => {
    const channel = supabase
      .channel("couple-surprise")
      .on("broadcast", { event: "surprise" }, (payload) => {
        if (payload.payload?.userId === user.id) return;
        const kind = (payload.payload?.kind as SurpriseKind) ?? "petals";
        setSurpriseKind(kind);
        playSurpriseChime();
        window.setTimeout(() => setSurpriseKind(null), 2600);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  return (
    <CoupleSettingsProvider>
      <Outlet />
      <SurpriseOverlay kind={surpriseKind} />
    </CoupleSettingsProvider>
  );
}
