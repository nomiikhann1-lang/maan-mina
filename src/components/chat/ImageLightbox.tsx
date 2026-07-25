import { useEffect, useState } from "react";

export type LightboxItem = { type: "image" | "video"; src: string };

export function ImageLightbox({
  items,
  startIndex = 0,
  onClose,
}: {
  items: LightboxItem[];
  startIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const item = items[index];
  const hasMultiple = items.length > 1;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(items.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length, onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 pop-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-transform hover:scale-110 hover:bg-white/20"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {hasMultiple && index > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => i - 1);
          }}
          aria-label="Previous"
          className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-transform hover:scale-110 hover:bg-white/20 sm:left-4"
        >
          <NavIcon flip />
        </button>
      )}
      {hasMultiple && index < items.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => i + 1);
          }}
          aria-label="Next"
          className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-transform hover:scale-110 hover:bg-white/20 sm:right-4"
        >
          <NavIcon />
        </button>
      )}

      {item.type === "video" ? (
        <video
          src={item.src}
          controls
          autoPlay
          playsInline
          onClick={(e) => e.stopPropagation()}
          className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
        />
      ) : (
        <img
          src={item.src}
          alt=""
          onClick={(e) => e.stopPropagation()}
          className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
        />
      )}

      {hasMultiple && (
        <div className="mt-3 flex gap-1.5">
          {items.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NavIcon({ flip }: { flip?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
