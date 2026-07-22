import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { CoupleSettingsProvider } from "@/lib/coupleSettings";
import { useHeartbeat } from "@/hooks/useHeartbeat";

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
  return (
    <CoupleSettingsProvider>
      <Outlet />
    </CoupleSettingsProvider>
  );
}
