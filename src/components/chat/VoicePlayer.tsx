import { useEffect, useRef, useState } from "react";

export function VoicePlayer({
  src,
  mine,
  durationSeconds,
}: {
  src: string;
  mine: boolean;
  durationSeconds: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setElapsed(audio.currentTime);
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
      setElapsed(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play();
      setPlaying(true);
    }
  }

  const barCount = 14;
  const displaySeconds = playing || elapsed > 0 ? Math.ceil(elapsed) : durationSeconds;

  return (
    <div className="flex min-w-[190px] items-center gap-2.5 py-0.5">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform hover:scale-110 active:scale-95 ${
          mine ? "bg-bubble-me-foreground/15" : "bg-primary/20"
        }`}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div className="flex flex-1 items-center gap-0.5">
        {Array.from({ length: barCount }).map((_, i) => {
          const active = i / barCount <= progress;
          return (
            <span
              key={i}
              className={`flex-1 transition-colors duration-150 ${
                active ? "bg-sunflower" : mine ? "bg-bubble-me-foreground/25" : "bg-sunflower/30"
              }`}
              style={{
                height: `${5 + ((i * 29) % 14)}px`,
                width: "4px",
                borderRadius: "60% 60% 60% 12%",
                transform: `rotate(${i % 2 === 0 ? -14 : 14}deg)`,
              }}
            />
          );
        })}
      </div>
      <span className="w-8 shrink-0 text-right text-[10px] tabular-nums opacity-70">
        {formatTime(displaySeconds)}
      </span>
    </div>
  );
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4l15 8-15 8V4z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="5" y="4" width="5" height="16" rx="1" />
      <rect x="14" y="4" width="5" height="16" rx="1" />
    </svg>
  );
}
