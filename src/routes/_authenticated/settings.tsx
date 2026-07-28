import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  disablePushNotifications,
  enablePushNotifications,
  isPushEnabled,
  pushSupported,
} from "@/lib/push";
import { useCoupleSettings } from "@/lib/coupleSettings";
import { THEMES } from "@/lib/theme";
import { compressImage, extensionForMime, uploadCustomSticker } from "@/lib/media";
import { isSoundEnabled, playSentChime, setSoundEnabled } from "@/lib/sound";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

// Bump this string whenever you ship a change — it's the fastest way to
// confirm a deployment actually went live: if this doesn't match what you
// expect after a push, the deploy hasn't updated yet (check Vercel's
// Deployments tab for the commit it actually built).
const APP_VERSION = "2026.07.23-1";

type CustomSticker = {
  id: string;
  image_url: string;
  label: string | null;
  assigned_to: "maan" | "mina";
};

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { settings, setTheme, setAnniversaryDate, setCountdown } = useCoupleSettings();
  const [pushOn, setPushOn] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const supported = pushSupported();

  const [countdownDateDraft, setCountdownDateDraft] = useState(settings.countdown_date ?? "");
  const [countdownLabelDraft, setCountdownLabelDraft] = useState(settings.countdown_label ?? "");

  const [stickers, setStickers] = useState<CustomSticker[]>([]);
  const [stickersLoaded, setStickersLoaded] = useState(false);
  const [stickerUploading, setStickerUploading] = useState(false);
  const [stickerError, setStickerError] = useState<string | null>(null);
  const [stickersExpanded, setStickersExpanded] = useState(false);
  const [newStickerTarget, setNewStickerTarget] = useState<"maan" | "mina">(() => {
    try {
      return (localStorage.getItem("last_sticker_target") as "maan" | "mina") ?? "maan";
    } catch {
      return "maan";
    }
  });
  const stickerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isPushEnabled().then(setPushOn);
  }, []);

  useEffect(() => {
    setCountdownDateDraft(settings.countdown_date ?? "");
    setCountdownLabelDraft(settings.countdown_label ?? "");
  }, [settings.countdown_date, settings.countdown_label]);

  useEffect(() => {
    refreshStickers();
    const channel = supabase
      .channel("custom-stickers-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "custom_stickers" }, () =>
        refreshStickers(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function refreshStickers() {
    const { data } = await supabase
      .from("custom_stickers")
      .select("id, image_url, label, assigned_to")
      .order("created_at", { ascending: false });
    setStickers((data as CustomSticker[]) ?? []);
    setStickersLoaded(true);
  }

  async function togglePush() {
    setPushBusy(true);
    setPushError(null);
    try {
      if (pushOn) {
        await disablePushNotifications();
        setPushOn(false);
      } else {
        const result = await enablePushNotifications(user.id);
        if (result.ok) {
          setPushOn(true);
        } else {
          setPushError(result.error ?? "Couldn't enable notifications.");
        }
      }
    } finally {
      setPushBusy(false);
    }
  }

  async function saveCountdown() {
    await setCountdown(countdownDateDraft || null, countdownLabelDraft || null);
  }

  async function handleStickerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStickerError("Please choose an image file.");
      return;
    }
    setStickerError(null);
    setStickerUploading(true);
    try {
      const compressed = await compressImage(file, 512, 0.85);
      const ext = extensionForMime(compressed.type || file.type, "jpg");
      const url = await uploadCustomSticker(compressed, user.id, ext);
      const { error } = await supabase
        .from("custom_stickers")
        .insert({ uploader_id: user.id, image_url: url, assigned_to: newStickerTarget });
      if (error) throw error;
      try {
        localStorage.setItem("last_sticker_target", newStickerTarget);
      } catch {
        // not critical — just won't remember the choice next time
      }
      void refreshStickers();
    } catch (err) {
      setStickerError(err instanceof Error ? err.message : "Couldn't add that sticker.");
    } finally {
      setStickerUploading(false);
    }
  }

  async function deleteSticker(id: string) {
    setStickers((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("custom_stickers").delete().eq("id", id);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-background">
      <header className="flex items-center gap-3 border-b border-border/60 bg-card/70 px-4 py-3 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/home" })}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-foreground transition-transform hover:scale-110 hover:bg-secondary"
          aria-label="Back"
        >
          <BackIcon />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Settings</h1>
      </header>

      <div className="mx-auto max-w-md px-5 py-6">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/80">
          <Link
            to="/profile"
            className="flex items-center justify-between px-4 py-4 transition-colors hover:bg-secondary/60"
          >
            <span className="text-sm font-medium text-foreground">Edit profile</span>
            <ChevronIcon />
          </Link>
          <Link
            to="/playlist"
            className="flex items-center justify-between border-t border-border/60 px-4 py-4 transition-colors hover:bg-secondary/60"
          >
            <span className="text-sm font-medium text-foreground">Our playlist</span>
            <ChevronIcon />
          </Link>
          <Link
            to="/bucket-list"
            className="flex items-center justify-between border-t border-border/60 px-4 py-4 transition-colors hover:bg-secondary/60"
          >
            <span className="text-sm font-medium text-foreground">Our bucket list</span>
            <ChevronIcon />
          </Link>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 bg-card/80">
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">Notifications</div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {supported
                  ? "Get notified when a new message arrives"
                  : "Not supported in this browser"}
              </p>
            </div>
            <ToggleSwitch checked={pushOn} disabled={!supported || pushBusy} onClick={togglePush} />
          </div>
          {pushError && <div className="px-4 pb-4 text-xs text-destructive">{pushError}</div>}
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 bg-card/80">
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">Sound</div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                A soft chime when messages are sent, received, or surprises arrive
              </p>
            </div>
            <ToggleSwitch
              checked={soundOn}
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                setSoundEnabled(next);
                if (next) playSentChime();
              }}
            />
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 bg-card/80 px-4 py-4">
          <div className="text-sm font-medium text-foreground">Our anniversary</div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Powers the "Days together" counter on your home screen — always counts up.
          </p>
          <input
            type="date"
            value={settings.anniversary_date ?? ""}
            onChange={(e) => void setAnniversaryDate(e.target.value || null)}
            max={new Date().toISOString().slice(0, 10)}
            className="mt-3 w-full max-w-full rounded-2xl border border-transparent bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:bg-card"
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 bg-card/80 px-4 py-4">
          <div className="text-sm font-medium text-foreground">Countdown to something</div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            A separate, upcoming date — a trip, a visit, a future anniversary. Ticks down live on
            the home screen.
          </p>
          <input
            value={countdownLabelDraft}
            onChange={(e) => setCountdownLabelDraft(e.target.value)}
            onBlur={saveCountdown}
            placeholder="What are we counting down to?"
            maxLength={30}
            className="mt-3 w-full max-w-full rounded-2xl border border-transparent bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:bg-card"
          />
          <input
            type="date"
            value={countdownDateDraft}
            onChange={(e) => {
              setCountdownDateDraft(e.target.value);
            }}
            onBlur={saveCountdown}
            min={new Date().toISOString().slice(0, 10)}
            className="mt-2 w-full max-w-full rounded-2xl border border-transparent bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:bg-card"
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 bg-card/80 px-4 py-4">
          <div className="text-sm font-medium text-foreground">Theme</div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pick a look together — changes for both of you.
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => void setTheme(t.id)}
                className={`flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 transition-transform hover:scale-105 ${
                  settings.theme === t.id ? "border-primary" : "border-transparent"
                }`}
              >
                <span
                  className="h-8 w-8 shrink-0 rounded-full"
                  style={{ background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }}
                />
                <span className="truncate text-[10px] font-semibold text-foreground">
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-border/60 bg-card/80">
          <button
            type="button"
            onClick={() => setStickersExpanded((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">
                Our stickers {stickers.length > 0 && `(${stickers.length})`}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Add your own — great for anime-fied photos. Shows up in the sticker picker.
              </p>
            </div>
            <span
              className={`shrink-0 text-muted-foreground transition-transform ${stickersExpanded ? "rotate-180" : ""}`}
            >
              <ChevronDownIcon />
            </span>
          </button>

          {stickersExpanded && (
            <div className="px-4 pb-4">
              <input
                ref={stickerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleStickerUpload}
              />
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Add to:</span>
                <div className="flex overflow-hidden rounded-full border border-border">
                  {(["maan", "mina"] as const).map((target) => (
                    <button
                      key={target}
                      type="button"
                      onClick={() => setNewStickerTarget(target)}
                      className={`px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                        newStickerTarget === target
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {target}
                    </button>
                  ))}
                </div>
              </div>
              {!stickersLoaded ? (
                <div className="text-xs text-muted-foreground">Loading…</div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {stickers.map((s) => (
                    <div
                      key={s.id}
                      className="group relative aspect-square overflow-hidden rounded-2xl border border-border/60"
                    >
                      <img
                        src={s.image_url}
                        alt={s.label ?? ""}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold capitalize text-white">
                        {s.assigned_to}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteSticker(s.id)}
                        aria-label="Remove sticker"
                        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M6 6l12 12M18 6L6 18"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => stickerInputRef.current?.click()}
                    disabled={stickerUploading}
                    className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-transform hover:scale-105 hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    {stickerUploading ? (
                      <span className="text-[10px]">Uploading…</span>
                    ) : (
                      <span className="text-2xl">+</span>
                    )}
                  </button>
                </div>
              )}
              {stickerError && <div className="mt-2 text-xs text-destructive">{stickerError}</div>}
            </div>
          )}
        </div>

        <button
          onClick={signOut}
          className="mt-6 w-full rounded-full border border-destructive/30 bg-destructive/10 py-3 text-sm font-semibold text-destructive transition-transform hover:scale-[1.01] active:scale-100"
        >
          Sign out
        </button>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Maan &amp; Mina · made with 🌻
        </p>
        <p className="mt-1 text-center text-[10px] text-muted-foreground/50">v{APP_VERSION}</p>
      </div>
    </div>
  );
}

function ToggleSwitch({
  checked,
  onClick,
  disabled,
}: {
  checked: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={checked}
      className={`flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-40 ${
        checked ? "justify-end bg-primary" : "justify-start bg-secondary"
      }`}
    >
      <span className="h-6 w-6 shrink-0 rounded-full bg-white shadow" />
    </button>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground"
      />
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
