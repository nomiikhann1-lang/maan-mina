export type GrowthPhase = "seed" | "sprout" | "bud" | "bloom";

/** Before 100 total messages: seed → sprout → bud. At 100+: blooming. */
export function growthPhase(total: number): GrowthPhase {
  if (total < 100) {
    if (total < 34) return "seed";
    if (total < 67) return "sprout";
    return "bud";
  }
  return "bloom";
}

/** 1 petal at 100 messages, +1 petal per additional 100, capped at a full 8-petal bloom. */
export function bloomPetalCount(total: number): number {
  return Math.max(1, Math.min(8, Math.floor(total / 100)));
}

/** The flower itself grows visually alongside the petal count. */
function bloomScale(total: number): number {
  const petals = bloomPetalCount(total);
  return 0.55 + ((petals - 1) * (1.35 - 0.55)) / 7;
}

const PHASE_LABEL: Record<GrowthPhase, string> = {
  seed: "Just planted",
  sprout: "Sprouting",
  bud: "Budding",
  bloom: "In bloom",
};

export function SunflowerGrowth({
  totalCount,
  justGrew,
  onTap,
  size = "h-14 w-14",
}: {
  totalCount: number;
  justGrew: boolean;
  onTap: () => void;
  size?: string;
}) {
  const phase = growthPhase(totalCount);
  const petals = bloomPetalCount(totalCount);
  const maxedOut = phase === "bloom" && petals >= 8;

  return (
    <button
      type="button"
      onClick={onTap}
      className="pop-in flex flex-col items-center gap-1.5 rounded-3xl border border-border/60 bg-card/80 px-5 py-4 shadow-soft backdrop-blur transition-transform hover:scale-105 active:scale-95"
      title="A little secret: tap me quickly a few times ✨"
    >
      <span className={`${size} ${justGrew ? "bloom" : ""}`}>
        <GrowthArt phase={phase} petals={petals} />
      </span>
      <span className="text-[11px] font-semibold text-muted-foreground">
        {maxedOut ? "Full bloom 🌻" : PHASE_LABEL[phase]}
      </span>
      <span className="text-[10px] text-muted-foreground/70">
        {phase === "bloom"
          ? `${petals} of 8 petals · ${totalCount} messages`
          : `${totalCount} / 100 messages`}
      </span>
    </button>
  );
}

function GrowthArt({ phase, petals }: { phase: GrowthPhase; petals: number }) {
  const scale = phase === "bloom" ? bloomScale(petals * 100) : 1;
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible">
      {/* soil */}
      <ellipse cx="32" cy="56" rx="18" ry="5" fill="#8a6a4a" />
      <ellipse cx="32" cy="54" rx="16" ry="4" fill="#6b4f36" />

      {phase === "seed" && (
        <>
          <ellipse cx="32" cy="49" rx="3.5" ry="2.5" fill="#7a4f2a" />
          <path
            d="M32 49q1-4 4-3"
            stroke="#8fbf7a"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}

      {phase === "sprout" && (
        <>
          <path d="M32 52V38" stroke="#5a8a5a" strokeWidth="3" strokeLinecap="round" />
          <path
            d="M32 44q-7-2-8-8"
            stroke="#5a8a5a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M32 40q7-1 9-6"
            stroke="#5a8a5a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="32" cy="35" r="4" fill="#8fbf7a" />
        </>
      )}

      {phase === "bud" && (
        <>
          <path d="M32 52V26" stroke="#5a8a5a" strokeWidth="3.5" strokeLinecap="round" />
          <path
            d="M32 40q-8-2-9-9"
            stroke="#5a8a5a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M32 36q8-1 10-7"
            stroke="#5a8a5a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="32" cy="21" rx="7" ry="9" fill="#8fbf7a" />
          <ellipse cx="32" cy="19" rx="4.5" ry="6" fill="#e8a13d" opacity="0.85" />
        </>
      )}

      {phase === "bloom" && (
        <>
          <path d="M32 52V26" stroke="#5a8a5a" strokeWidth="3.5" strokeLinecap="round" />
          <path
            d="M32 42q-9-2-10-9"
            stroke="#5a8a5a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M32 38q9-1 11-7"
            stroke="#5a8a5a"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <g style={{ transform: `scale(${scale})`, transformOrigin: "32px 18px" }}>
            {Array.from({ length: petals }).map((_, i) => (
              <ellipse
                key={i}
                cx="32"
                cy="9"
                rx="5"
                ry="9"
                fill="#F6C945"
                transform={`rotate(${(360 / petals) * i} 32 18)`}
              />
            ))}
            <circle cx="32" cy="18" r="8" fill="#7a4f2a" />
            <circle cx="29" cy="15" r="1.3" fill="#5c3a1f" />
            <circle cx="35" cy="16" r="1.3" fill="#5c3a1f" />
            <circle cx="32" cy="21" r="1.3" fill="#5c3a1f" />
          </g>
        </>
      )}
    </svg>
  );
}
