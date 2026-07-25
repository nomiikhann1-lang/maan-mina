import { useMemo } from "react";
import type { SurpriseKind } from "@/lib/surprise";

const PETAL_EMOJI = ["🌸", "🌼", "🌻", "🌷"];
const CONFETTI_EMOJI = ["💛", "❤️", "✨", "💫"];

export function SurpriseOverlay({ kind }: { kind: SurpriseKind | null }) {
  const particles = useMemo(() => {
    if (!kind) return [];
    const pool = kind === "petals" ? PETAL_EMOJI : CONFETTI_EMOJI;
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      emoji: pool[i % pool.length],
      left: Math.round(Math.random() * 100),
      delay: Math.random() * 1.4,
      duration: 2.6 + Math.random() * 1.6,
      size: 18 + Math.round(Math.random() * 16),
      drift: Math.round((Math.random() - 0.5) * 80),
    }));
  }, [kind]);

  if (!kind) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-[-10%]"
          style={
            {
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animation: `surprise-fall ${p.duration}s ease-in ${p.delay}s both`,
              "--surprise-drift": `${p.drift}px`,
            } as React.CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
