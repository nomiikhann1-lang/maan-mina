export type SongProvider = "spotify" | "youtube" | "soundcloud" | "apple-music";

export type DetectedSong = { provider: SongProvider; embedUrl: string; originalUrl: string };

/**
 * Recognizes Spotify / YouTube / SoundCloud / Apple Music links and builds
 * their official no-auth-required embed URL. Purely pattern-based — there's
 * no API call, so there's no title/artist metadata, just a working player.
 */
export function detectSongUrl(raw: string): DetectedSong | null {
  const text = raw.trim();
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");

  if (host === "open.spotify.com") {
    const match = url.pathname.match(/\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    return {
      provider: "spotify",
      embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}`,
      originalUrl: text,
    };
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v");
    if (!id) return null;
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube.com/embed/${id}`,
      originalUrl: text,
    };
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    if (!id) return null;
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube.com/embed/${id}`,
      originalUrl: text,
    };
  }

  if (host === "soundcloud.com") {
    return {
      provider: "soundcloud",
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(text)}&auto_play=false&color=%23F6C945&visual=false`,
      originalUrl: text,
    };
  }

  if (host === "music.apple.com") {
    return {
      provider: "apple-music",
      embedUrl: text.replace("music.apple.com", "embed.music.apple.com"),
      originalUrl: text,
    };
  }

  return null;
}

export const SONG_PROVIDER_LABEL: Record<SongProvider, string> = {
  spotify: "Spotify",
  youtube: "YouTube",
  soundcloud: "SoundCloud",
  "apple-music": "Apple Music",
};
