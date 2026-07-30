import { useEffect, useRef, useState } from "react";

export type LightboxItem = { type: "image" | "video"; src: string };

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_ZOOM = 2.5;

function ZoomableImage({ src, onRequestClose }: { src: string; onRequestClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isGesturing, setIsGesturing] = useState(false);

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{
    startDistance: number;
    startScale: number;
    startTranslate: { x: number; y: number };
  } | null>(null);
  const panRef = useRef<{
    startX: number;
    startY: number;
    startTranslate: { x: number; y: number };
  } | null>(null);
  const movedRef = useRef(false);
  const tapTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) window.clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  function clampTranslate(nextScale: number, t: { x: number; y: number }) {
    const el = containerRef.current;
    if (!el) return t;
    const maxX = (el.clientWidth * (nextScale - 1)) / 2;
    const maxY = (el.clientHeight * (nextScale - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, t.x)),
      y: Math.max(-maxY, Math.min(maxY, t.y)),
    };
  }

  function zoomTo(nextScale: number) {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, nextScale));
    setScale(clamped);
    setTranslate((t) => (clamped <= 1 ? { x: 0, y: 0 } : clampTranslate(clamped, t)));
  }

  function handleTap() {
    if (tapTimeoutRef.current) {
      window.clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
      // Double tap: toggle between zoomed in and reset.
      if (scale > 1.4) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      } else {
        zoomTo(DOUBLE_TAP_ZOOM);
      }
      return;
    }
    tapTimeoutRef.current = window.setTimeout(() => {
      tapTimeoutRef.current = null;
      // Single tap only closes when not zoomed in — otherwise it's more
      // likely an attempt to interact with the zoomed image.
      if (scale <= 1) onRequestClose();
    }, 250);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movedRef.current = false;
    setIsGesturing(true);

    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchRef.current = { startDistance: dist, startScale: scale, startTranslate: translate };
      panRef.current = null;
    } else if (pointersRef.current.size === 1 && scale > 1) {
      panRef.current = { startX: e.clientX, startY: e.clientY, startTranslate: translate };
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const nextScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, pinchRef.current.startScale * (dist / pinchRef.current.startDistance)),
      );
      setScale(nextScale);
      setTranslate(clampTranslate(nextScale, pinchRef.current.startTranslate));
      movedRef.current = true;
    } else if (pointersRef.current.size === 1 && panRef.current) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedRef.current = true;
      setTranslate(
        clampTranslate(scale, {
          x: panRef.current.startTranslate.x + dx,
          y: panRef.current.startTranslate.y + dy,
        }),
      );
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;

    if (pointersRef.current.size === 0) {
      panRef.current = null;
      setIsGesturing(false);
      if (scale < 1.02) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      }
      if (!movedRef.current) handleTap();
    }
  }

  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    zoomTo(scale - e.deltaY * 0.0015);
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none select-none overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="h-full w-full object-contain"
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transition: isGesturing ? "none" : "transform 0.2s ease-out",
        }}
      />
    </div>
  );
}

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
      className="pop-in fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-2"
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-transform hover:scale-110 hover:bg-white/20"
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
          onClick={() => setIndex((i) => i - 1)}
          aria-label="Previous"
          className="absolute left-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-transform hover:scale-110 hover:bg-white/20 sm:left-4"
        >
          <NavIcon flip />
        </button>
      )}
      {hasMultiple && index < items.length - 1 && (
        <button
          onClick={() => setIndex((i) => i + 1)}
          aria-label="Next"
          className="absolute right-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-transform hover:scale-110 hover:bg-white/20 sm:right-4"
        >
          <NavIcon />
        </button>
      )}

      <div className="h-full w-full max-w-full">
        {item.type === "video" ? (
          <div className="flex h-full w-full items-center justify-center">
            <video
              src={item.src}
              controls
              autoPlay
              playsInline
              className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        ) : (
          // Keyed by src so pinch/pan/zoom state fully resets when navigating.
          <ZoomableImage key={item.src} src={item.src} onRequestClose={onClose} />
        )}
      </div>

      {hasMultiple && (
        <div className="absolute bottom-4 flex gap-1.5">
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
