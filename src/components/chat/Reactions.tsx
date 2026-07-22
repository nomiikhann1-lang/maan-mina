import { QUICK_REACTIONS } from "@/lib/emoji";

export type Reaction = { id: string; message_id: string; user_id: string; emoji: string };

export function ReactionPickerBar({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <div className="pop-in flex items-center gap-0.5 rounded-full border border-border/60 bg-card px-1.5 py-1 shadow-soft">
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPick(emoji);
          }}
          className="grid h-8 w-8 place-items-center rounded-full text-base transition-transform hover:scale-125 active:scale-95"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export function ReactionBadges({
  reactions,
  myUserId,
  onToggle,
  align,
}: {
  reactions: Reaction[];
  myUserId: string;
  onToggle: (emoji: string) => void;
  align: "start" | "end";
}) {
  if (reactions.length === 0) return null;
  const groups = new Map<string, { count: number; mine: boolean }>();
  for (const r of reactions) {
    const g = groups.get(r.emoji) ?? { count: 0, mine: false };
    g.count += 1;
    if (r.user_id === myUserId) g.mine = true;
    groups.set(r.emoji, g);
  }
  return (
    <div
      className={`-mt-2 flex flex-wrap gap-1 ${align === "end" ? "justify-end" : "justify-start"}`}
    >
      {[...groups.entries()].map(([emoji, g]) => (
        <button
          key={emoji}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(emoji);
          }}
          className={`pop-in flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs shadow-soft transition-transform hover:scale-105 ${
            g.mine ? "border-primary bg-primary/15" : "border-border/60 bg-card"
          }`}
        >
          <span>{emoji}</span>
          {g.count > 1 && (
            <span className="text-[10px] font-semibold text-muted-foreground">{g.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
