import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { detectSongUrl } from "@/lib/songs";
import { SongCard } from "@/components/chat/SongCard";

export const Route = createFileRoute("/_authenticated/playlist")({
  component: PlaylistPage,
});

type PlaylistSong = {
  id: string;
  url: string;
  title: string | null;
  added_by: string;
  created_at: string;
};

function PlaylistPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [songs, setSongs] = useState<PlaylistSong[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function refresh() {
    const { data } = await supabase
      .from("playlist_songs")
      .select("*")
      .order("created_at", { ascending: false });
    setSongs((data as PlaylistSong[]) ?? []);
    setLoaded(true);
  }

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel("playlist")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "playlist_songs" },
        () => void refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function addSong(e: React.FormEvent) {
    e.preventDefault();
    const detected = detectSongUrl(urlInput);
    if (!detected) {
      setError("That doesn't look like a Spotify, YouTube, SoundCloud, or Apple Music link.");
      return;
    }
    setError(null);
    setAdding(true);
    const { error: insertError } = await supabase
      .from("playlist_songs")
      .insert({ added_by: user.id, url: urlInput.trim(), title: titleInput.trim() || null });
    setAdding(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setUrlInput("");
    setTitleInput("");
  }

  async function removeSong(id: string) {
    setSongs((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("playlist_songs").delete().eq("id", id);
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
        <h1 className="font-display text-lg font-semibold text-foreground">Our playlist</h1>
      </header>

      <div className="mx-auto max-w-md px-5 py-6">
        <form onSubmit={addSong} className="rounded-3xl border border-border/60 bg-card/80 p-4">
          <div className="text-sm font-medium text-foreground">Add a song</div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Paste a Spotify, YouTube, SoundCloud, or Apple Music link.
          </p>
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://open.spotify.com/track/…"
            className="mt-3 w-full rounded-2xl border border-transparent bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:bg-card"
          />
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Song title (optional)"
            maxLength={80}
            className="mt-2 w-full rounded-2xl border border-transparent bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:bg-card"
          />
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={!urlInput.trim() || adding}
            className="mt-3 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-petal transition-transform hover:scale-[1.02] active:scale-100 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add to playlist"}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {!loaded ? (
            <div className="py-10 text-center text-4xl">
              <span className="float-slow">🎵</span>
            </div>
          ) : songs.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No songs yet — add the first one to start your playlist together.
            </p>
          ) : (
            songs.map((song) => {
              const detected = detectSongUrl(song.url);
              return (
                <div
                  key={song.id}
                  className="pop-in rounded-3xl border border-border/60 bg-card/80 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-foreground">
                      {song.title || "Untitled"}
                    </span>
                    {song.added_by === user.id && (
                      <button
                        onClick={() => removeSong(song.id)}
                        className="shrink-0 text-[11px] font-semibold text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {detected ? (
                    <SongCard provider={detected.provider} embedUrl={detected.embedUrl} />
                  ) : (
                    <a
                      href={song.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline"
                    >
                      {song.url}
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
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
