import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadAvatar, extensionForMime } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name);
        setAvatarUrl(data.avatar_url);
      }
      setLoaded(true);
    })();
  }, [user.id]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const ext = extensionForMime(file.type, "jpg");
      const url = await uploadAvatar(file, user.id, ext);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      if (updateError) throw updateError;
      setAvatarUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload that photo.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    const name = displayName.trim();
    if (!name) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ display_name: name })
      .eq("id", user.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="relative min-h-[100dvh] bg-background">
      <header className="flex items-center gap-3 border-b border-border/60 bg-card/70 px-4 py-3 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/home" })}
          className="grid h-9 w-9 place-items-center rounded-full text-foreground transition-transform hover:scale-110 hover:bg-secondary"
          aria-label="Back"
        >
          <BackIcon />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Your profile</h1>
      </header>

      {!loaded ? (
        <div className="grid h-64 place-items-center text-4xl">
          <span className="float-slow">🌻</span>
        </div>
      ) : (
        <div className="mx-auto max-w-md px-6 py-8">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="group relative grid h-28 w-28 place-items-center overflow-hidden rounded-full ring-4 ring-primary/25 transition-transform hover:scale-105 disabled:opacity-70"
              aria-label="Change profile photo"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-sunflower to-sunflower-deep text-3xl font-semibold text-primary-foreground">
                  {displayName?.[0]?.toUpperCase() ?? "🌻"}
                </div>
              )}
              <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {uploading ? (
                  <span className="text-xs font-semibold text-white">Uploading…</span>
                ) : (
                  <CameraIcon />
                )}
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="mt-2 text-xs text-muted-foreground">Tap the photo to change it</p>
          </div>

          <div className="mt-8">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              className="w-full rounded-2xl border border-transparent bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-ring focus:bg-card"
            />
          </div>

          {error && (
            <div className="mt-4 rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving || !displayName.trim()}
            className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-petal transition-transform hover:scale-[1.02] active:scale-100 disabled:opacity-50"
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>
        </div>
      )}
    </div>
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
function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"
        stroke="white"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="14" r="3.3" stroke="white" strokeWidth="1.7" />
    </svg>
  );
}
