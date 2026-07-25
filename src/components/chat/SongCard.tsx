import { SONG_PROVIDER_LABEL, type SongProvider } from "@/lib/songs";

export function SongCard({ provider, embedUrl }: { provider: SongProvider; embedUrl: string }) {
  const height = provider === "youtube" ? 172 : provider === "soundcloud" ? 166 : 152;
  return (
    <div className="w-64 max-w-full overflow-hidden rounded-2xl bg-black/5">
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className="block"
        title={`${SONG_PROVIDER_LABEL[provider]} player`}
      />
    </div>
  );
}
