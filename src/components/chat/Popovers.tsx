import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EMOJI_CATEGORIES } from "@/lib/emoji";
import { STICKER_IDS, STICKER_LABELS, StickerArt, type StickerId } from "@/lib/stickers";
import { useState, type ReactNode } from "react";

export function EmojiPopover({
  trigger,
  onPick,
}: {
  trigger: ReactNode;
  onPick: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-[min(20rem,calc(100vw-24px))] rounded-3xl border-border/60 bg-card p-0 shadow-soft"
        collisionPadding={12}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-1 overflow-x-auto border-b border-border/60 px-2 py-1.5">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => setCategory(i)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                category === i
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="grid max-h-56 grid-cols-7 gap-1 overflow-y-auto p-2.5">
          {EMOJI_CATEGORIES[category].emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onPick(emoji);
              }}
              className="grid h-9 w-9 place-items-center rounded-xl text-xl transition-transform hover:scale-125 hover:bg-secondary active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export type CustomSticker = {
  id: string;
  image_url: string;
  label: string | null;
  ownerName: "Maan" | "Mina" | "Ours";
};
export type StickerPick = { kind: "builtin"; id: StickerId } | { kind: "custom"; url: string };

function StickerGrid({
  stickers,
  emptyMessage,
  onPickCustom,
}: {
  stickers: CustomSticker[];
  emptyMessage: string;
  onPickCustom: (url: string) => void;
}) {
  if (stickers.length === 0) {
    return (
      <p className="col-span-4 py-6 text-center text-xs text-muted-foreground">{emptyMessage}</p>
    );
  }
  return (
    <>
      {stickers.map((s) => (
        <button
          key={s.id}
          type="button"
          title={s.label ?? ""}
          onClick={() => onPickCustom(s.image_url)}
          className="aspect-square overflow-hidden rounded-2xl transition-transform hover:scale-110 active:scale-95"
        >
          <img src={s.image_url} alt={s.label ?? ""} className="h-full w-full object-cover" />
        </button>
      ))}
    </>
  );
}

export function StickerPopover({
  trigger,
  onPick,
  customStickers,
}: {
  trigger: ReactNode;
  onPick: (pick: StickerPick) => void;
  customStickers: CustomSticker[];
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"builtin" | "maan" | "mina">("builtin");

  const maanStickers = customStickers.filter((s) => s.ownerName === "Maan");
  const minaStickers = customStickers.filter((s) => s.ownerName === "Mina");

  function pickCustom(url: string) {
    onPick({ kind: "custom", url });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-[min(20rem,calc(100vw-24px))] rounded-3xl border-border/60 bg-card p-0 shadow-soft"
        collisionPadding={12}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-1 overflow-x-auto border-b border-border/60 px-2 py-1.5">
          {(
            [
              ["builtin", "Cute"],
              ["maan", `Maan${maanStickers.length > 0 ? ` (${maanStickers.length})` : ""}`],
              ["mina", `Mina${minaStickers.length > 0 ? ` (${minaStickers.length})` : ""}`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                tab === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto p-3">
          {tab === "builtin" &&
            STICKER_IDS.map((id) => (
              <button
                key={id}
                type="button"
                title={STICKER_LABELS[id]}
                onClick={() => {
                  onPick({ kind: "builtin", id });
                  setOpen(false);
                }}
                className="grid aspect-square place-items-center rounded-2xl p-1.5 transition-transform hover:scale-110 hover:bg-secondary active:scale-95"
              >
                <StickerArt id={id} className="h-full w-full" />
              </button>
            ))}
          {tab === "maan" && (
            <StickerGrid
              stickers={maanStickers}
              emptyMessage="No stickers from Maan yet — add some in Settings."
              onPickCustom={pickCustom}
            />
          )}
          {tab === "mina" && (
            <StickerGrid
              stickers={minaStickers}
              emptyMessage="No stickers from Mina yet — add some in Settings."
              onPickCustom={pickCustom}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
