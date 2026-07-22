import { useRef, useState } from "react";

type Particle = { id: number; x: number; rot: number; delay: number; emoji: string };

function burstParticles(emoji: string): Particle[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i,
    x: Math.round((Math.random() - 0.5) * 140),
    rot: Math.round((Math.random() - 0.5) * 60),
    delay: Math.random() * 0.25,
    emoji: Math.random() < 0.6 ? emoji : "💛",
  }));
}

export function PokeButtons({ onSend }: { onSend: (content: string) => Promise<void> }) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [sentKey, setSentKey] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleId = useRef(0);

  async function poke(key: string, content: string, emoji: string) {
    if (busyKey) return;
    setBusyKey(key);
    particleId.current += 1;
    setParticles(burstParticles(emoji));
    if (navigator.vibrate) navigator.vibrate(12);
    try {
      await onSend(content);
      setSentKey(key);
      setTimeout(() => setSentKey(null), 1600);
    } finally {
      setBusyKey(null);
      setTimeout(() => setParticles([]), 1300);
    }
  }

  return (
    <div className="relative grid grid-cols-2 gap-2.5">
      {particles.length > 0 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-2 z-10 flex justify-center overflow-visible"
        >
          {particles.map((p) => (
            <span
              key={p.id}
              className="poke-particle absolute text-xl"
              style={
                {
                  "--poke-x": `${p.x}px`,
                  "--poke-rot": `${p.rot}deg`,
                  animationDelay: `${p.delay}s`,
                } as React.CSSProperties
              }
            >
              {p.emoji}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => poke("thinking", "💭 Thinking of you", "💭")}
        disabled={!!busyKey}
        className="pop-in flex flex-col items-center gap-1 rounded-2xl border border-border/60 bg-card/80 py-3 shadow-soft transition-transform hover:scale-[1.03] active:scale-90 disabled:opacity-60"
      >
        <span className={`text-xl ${busyKey === "thinking" ? "animate-bounce" : ""}`}>
          {sentKey === "thinking" ? "✅" : "💭"}
        </span>
        <span className="text-xs font-semibold text-foreground">
          {sentKey === "thinking" ? "Sent!" : "Thinking of you"}
        </span>
      </button>
      <button
        type="button"
        onClick={() => poke("missing", "🥺 Missing you", "🥺")}
        disabled={!!busyKey}
        className="pop-in flex flex-col items-center gap-1 rounded-2xl border border-border/60 bg-card/80 py-3 shadow-soft transition-transform hover:scale-[1.03] active:scale-90 disabled:opacity-60"
      >
        <span className={`text-xl ${busyKey === "missing" ? "animate-bounce" : ""}`}>
          {sentKey === "missing" ? "✅" : "🥺"}
        </span>
        <span className="text-xs font-semibold text-foreground">
          {sentKey === "missing" ? "Sent!" : "Missing you"}
        </span>
      </button>
    </div>
  );
}
