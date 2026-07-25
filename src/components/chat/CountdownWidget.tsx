import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/** Always counts up — "how long have we been together". */
export function DaysTogetherWidget({ anniversaryDate }: { anniversaryDate: string | null }) {
  if (!anniversaryDate) {
    return (
      <Link
        to="/settings"
        className="pop-in flex items-center gap-1 rounded-full border border-dashed border-primary/50 bg-card/80 px-3 py-1.5 text-[11px] font-semibold text-primary shadow-soft transition-transform hover:scale-105"
      >
        🌱 Add our date
      </Link>
    );
  }

  const start = new Date(anniversaryDate + "T00:00:00").getTime();
  const days = Math.max(0, Math.floor((Date.now() - start) / 86400000)) + 1;

  return (
    <Link
      to="/settings"
      className="pop-in flex items-center gap-1.5 rounded-full border border-primary/30 bg-card/80 px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-soft backdrop-blur transition-transform hover:scale-105"
      title="Tap to change our special date"
    >
      <span>💛</span>
      <span>
        Days together: <span className="text-primary">{days}</span>
      </span>
    </Link>
  );
}

/** Always a forward countdown to a separate, upcoming date. */
export function UpcomingCountdownWidget({
  countdownDate,
  countdownLabel,
}: {
  countdownDate: string | null;
  countdownLabel: string | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!countdownDate) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [countdownDate]);

  if (!countdownDate) return null;

  const target = new Date(countdownDate + "T00:00:00").getTime();
  const diffMs = target - now;
  const label = countdownLabel?.trim() || "Countdown";

  if (diffMs <= 0) {
    return (
      <Link
        to="/settings"
        className="pop-in bloom flex items-center gap-1.5 rounded-full border border-primary/30 bg-card/80 px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-soft backdrop-blur transition-transform hover:scale-105"
      >
        <span>🎉</span>
        <span>{label} is here!</span>
      </Link>
    );
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const compact =
    days > 0
      ? `${days}d ${hours}h`
      : hours > 0
        ? `${hours}h ${minutes}m`
        : `${minutes}m ${seconds}s`;

  return (
    <Link
      to="/settings"
      className="pop-in flex items-center gap-1.5 rounded-full border border-primary/30 bg-card/80 px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-soft backdrop-blur transition-transform hover:scale-105"
      title={`Tap to change "${label}"`}
    >
      <span className={days === 0 && hours === 0 ? "animate-pulse" : undefined}>⏳</span>
      <span className="max-w-[8rem] truncate">{label}:</span>
      <span className="tabular-nums text-primary">{compact}</span>
    </Link>
  );
}
