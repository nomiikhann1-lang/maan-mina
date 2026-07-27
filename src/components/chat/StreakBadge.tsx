export function StreakBadge({ streak }: { streak: number }) {
  if (streak <= 0) return null;
  return (
    <div
      className="pop-in flex items-center gap-1.5 rounded-full border border-primary/30 bg-card/80 px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-soft backdrop-blur"
      title="Consecutive days you've both messaged"
    >
      <span>🔥</span>
      <span>
        {streak} day{streak === 1 ? "" : "s"} in a row
      </span>
    </div>
  );
}
