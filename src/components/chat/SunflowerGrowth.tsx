const STAGES = [
  { min: 0, max: 4, label: "Just planted" },
  { min: 5, max: 14, label: "Sprouting" },
  { min: 15, max: 29, label: "Budding" },
  { min: 30, max: Infinity, label: "In full bloom" },
] as const;

export function stageForCount(count: number): 0 | 1 | 2 | 3 {
  if (count >= 30) return 3;
  if (count >= 15) return 2;
  if (count >= 5) return 1;
  return 0;
}

export function SunflowerGrowth({
  weeklyCount,
  justGrew,
  onTap,
}: {
  weeklyCount: number;
  justGrew: boolean;
  onTap: () => void;
}) {
  const stage = stageForCount(weeklyCount);
  const info = STAGES[stage];

  return (
    <button
      type="button"
      onClick={onTap}
      className="pop-in flex flex-col items-center gap-1 rounded-3xl border border-border/60 bg-card/80 px-4 py-3 shadow-soft backdrop-blur transition-transform hover:scale-105 active:scale-95"
      title="A little secret: tap me quickly a few times ✨"
    >
      <span className={`h-14 w-14 ${justGrew ? "bloom" : ""}`}>
        <GrowthArt stage={stage} />
      </span>
      <span className="text-[10px] font-semibold text-muted-foreground">{info.label}</span>
      <span className="text-[10px] text-muted-foreground/70">{weeklyCount} messages this week</span>
    </button>
  );
}

function GrowthArt({ stage }: { stage: 0 | 1 | 2 | 3 }) {
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      {/* soil */}
      <ellipse cx="32" cy="56" rx="18" ry="5" fill="#8a6a4a" />
      <ellipse cx="32" cy="54" rx="16" ry="4" fill="#6b4f36" />

      {stage === 0 && (
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

      {stage === 1 && (
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

      {stage === 2 && (
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

      {stage === 3 && (
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
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <ellipse
              key={angle}
              cx="32"
              cy="9"
              rx="5"
              ry="9"
              fill="#F6C945"
              transform={`rotate(${angle} 32 18)`}
            />
          ))}
          <circle cx="32" cy="18" r="8" fill="#7a4f2a" />
          <circle cx="29" cy="15" r="1.3" fill="#5c3a1f" />
          <circle cx="35" cy="16" r="1.3" fill="#5c3a1f" />
          <circle cx="32" cy="21" r="1.3" fill="#5c3a1f" />
        </>
      )}
    </svg>
  );
}
