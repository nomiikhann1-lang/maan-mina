import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { greetingFor } from "@/lib/greeting";
import { previewForMessage } from "@/lib/messagePreview";
import { formatRelativeTime } from "@/lib/time";
import { useCoupleSettings } from "@/lib/coupleSettings";
import { DaysTogetherWidget, UpcomingCountdownWidget } from "@/components/chat/CountdownWidget";
import { PokeButtons } from "@/components/chat/PokeButtons";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  last_active_at: string | null;
};

type LastMessage = {
  content: string;
  type: "text" | "image" | "voice" | "video" | "sticker" | "song";
  created_at: string;
  sender_id: string;
  media_meta: { urls?: string[] } | null;
};

function HomePage() {
  const { user } = Route.useRouteContext();
  const { settings } = useCoupleSettings();
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [lastMessage, setLastMessage] = useState<LastMessage | null>(null);
  const [loaded, setLoaded] = useState(false);

  const me = profiles[user.id];
  const other = Object.values(profiles).find((p) => p.id !== user.id);
  const greeting = greetingFor(me?.display_name ?? "friend");

  async function refresh() {
    const [{ data: profs }, { data: msgs }] = await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_url, last_active_at"),
      supabase
        .from("messages")
        .select("content, type, created_at, sender_id, media_meta")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);
    setProfiles(Object.fromEntries((profs ?? []).map((p) => [p.id, p as Profile])));
    setLastMessage((msgs && (msgs[0] as LastMessage)) ?? null);
    setLoaded(true);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function sendPoke(content: string) {
    await supabase.from("messages").insert({ sender_id: user.id, content, type: "text" });
    void refresh();
  }

  const preview = lastMessage ? previewForMessage(lastMessage) : "No messages yet — say hi!";
  const otherStatus = other?.last_active_at
    ? `last seen ${formatRelativeTime(other.last_active_at)}`
    : "";

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        <div className="drift absolute -top-8 -right-6 text-8xl opacity-15">🌻</div>
        <div
          className="drift absolute top-1/3 -left-8 text-6xl opacity-15"
          style={{ animationDelay: "-5s" }}
        >
          🌼
        </div>
        <div className="float-slow absolute bottom-24 right-8 text-5xl opacity-15">🌸</div>
      </div>

      <header className="safe-top relative z-10 flex flex-wrap items-start justify-between gap-2 px-5 pt-6">
        <div>
          <div className="font-display text-2xl text-foreground">
            <span className="mr-2">{greeting.emoji}</span>
            {greeting.text}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">a cozy corner just for two</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <DaysTogetherWidget anniversaryDate={settings.anniversary_date} />
            <UpcomingCountdownWidget
              countdownDate={settings.countdown_date}
              countdownLabel={settings.countdown_label}
            />
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full ring-2 ring-primary/30 transition-transform hover:scale-105"
              aria-label="Your profile"
            >
              <SelfAvatar profile={me} />
            </Link>
            <Link
              to="/settings"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground transition-transform hover:scale-105 hover:bg-accent/40"
              aria-label="Settings"
            >
              <SettingsIcon />
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-6">
        {!loaded ? (
          <div className="float-slow text-4xl">🌻</div>
        ) : (
          <>
            <Link
              to="/chat"
              className="pop-in group w-full max-w-sm rounded-3xl border border-border/70 bg-card/90 p-6 text-left shadow-soft backdrop-blur transition-transform hover:scale-[1.02]"
            >
              <div className="flex items-center gap-4">
                <PartnerAvatar profile={other} />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg font-semibold text-foreground">
                    {other?.display_name ?? "Waiting for your other half…"}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{preview}</p>
                  {otherStatus && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground/80">{otherStatus}</p>
                  )}
                </div>
              </div>
              <div className="mt-5 flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-petal transition-transform group-hover:scale-[1.02]">
                Open chat <ArrowIcon />
              </div>
            </Link>

            <div className="w-full max-w-sm">
              <PokeButtons onSend={sendPoke} />
            </div>
          </>
        )}
      </div>

      <div className="safe-bottom relative z-10 pb-10 text-center text-xs text-muted-foreground">
        Every message blooms with love 🌻
      </div>
    </div>
  );
}

function SelfAvatar({ profile }: { profile?: Profile }) {
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />;
  }
  return (
    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-sunflower to-sunflower-deep text-sm font-semibold text-primary-foreground">
      {profile?.display_name?.[0]?.toUpperCase() ?? "🌻"}
    </div>
  );
}

function PartnerAvatar({ profile }: { profile?: Profile }) {
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt=""
        className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-primary/30"
      />
    );
  }
  return (
    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sunflower to-sunflower-deep text-xl font-semibold text-primary-foreground ring-2 ring-primary/30">
      {profile?.display_name?.[0]?.toUpperCase() ?? "🌻"}
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M19.4 13.5a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.56V20a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.33-1.87 1.7 1.7 0 00-1.55-1H4a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.33-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.33h.05a1.7 1.7 0 001-1.55V4a2 2 0 114 0v.09a1.7 1.7 0 001 1.56 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87v.05a1.7 1.7 0 001.56 1H20a2 2 0 110 4h-.09a1.7 1.7 0 00-1.56 1z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
