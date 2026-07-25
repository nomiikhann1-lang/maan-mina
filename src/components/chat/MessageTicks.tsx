import { useEffect, useRef, useState } from "react";

type TickState = "sent" | "delivered" | "seen";

export function MessageTicks({
  deliveredAt,
  seenAt,
}: {
  deliveredAt: string | null;
  seenAt: string | null;
}) {
  const trueState: TickState = seenAt ? "seen" : deliveredAt ? "delivered" : "sent";
  const [displayState, setDisplayState] = useState<TickState>(trueState);
  const prevTrueStateRef = useRef<TickState>(trueState);

  useEffect(() => {
    const prev = prevTrueStateRef.current;
    prevTrueStateRef.current = trueState;
    if (trueState === prev) return;

    // If it jumped straight from sent to seen (the recipient already had
    // the chat open, so delivered + seen landed almost instantly), hold on
    // "delivered" for a beat first so the progression is actually visible
    // instead of snapping straight to blue.
    if (prev === "sent" && trueState === "seen") {
      setDisplayState("delivered");
      const t = window.setTimeout(() => setDisplayState("seen"), 450);
      return () => window.clearTimeout(t);
    }
    setDisplayState(trueState);
  }, [trueState]);

  const color = displayState === "seen" ? "#5B9BF2" : "currentColor";

  return (
    <span key={displayState} className="pop-in inline-flex" style={{ animationDuration: "0.3s" }}>
      {displayState === "sent" ? (
        <svg width="14" height="10" viewBox="0 0 16 12" fill="none" aria-label="Sent">
          <path
            d="M1 6.5L5.5 11L15 1"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          width="18"
          height="10"
          viewBox="0 0 20 12"
          fill="none"
          aria-label={displayState === "seen" ? "Seen" : "Delivered"}
          className="transition-colors duration-300"
        >
          <path
            d="M1 6.5L5.5 11L15 1"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 6.5L10.5 11L20 1"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}
