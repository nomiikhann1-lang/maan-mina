export type QuotedMessage = {
  id: string;
  senderLabel: string;
  preview: string;
};

export function ReplyComposerBar({
  quoted,
  onCancel,
}: {
  quoted: QuotedMessage;
  onCancel: () => void;
}) {
  return (
    <div className="pop-in mx-2.5 mb-1.5 flex items-center gap-2 rounded-2xl border-l-4 border-primary bg-secondary/70 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-primary">{quoted.senderLabel}</div>
        <div className="truncate text-xs text-muted-foreground">{quoted.preview}</div>
      </div>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onCancel}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-background/60"
        aria-label="Cancel reply"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

export function QuotedPreview({
  quoted,
  onClick,
  mine,
}: {
  quoted: QuotedMessage;
  onClick?: () => void;
  mine: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`mb-1.5 block w-full rounded-xl border-l-[3px] px-2.5 py-1.5 text-left transition-colors ${
        mine
          ? "border-bubble-me-foreground/40 bg-bubble-me-foreground/10 hover:bg-bubble-me-foreground/15"
          : "border-primary/50 bg-primary/10 hover:bg-primary/15"
      }`}
    >
      <div
        className={`text-[11px] font-semibold ${mine ? "text-bubble-me-foreground/80" : "text-primary"}`}
      >
        {quoted.senderLabel}
      </div>
      <div
        className={`truncate text-xs ${mine ? "text-bubble-me-foreground/70" : "text-muted-foreground"}`}
      >
        {quoted.preview}
      </div>
    </button>
  );
}
