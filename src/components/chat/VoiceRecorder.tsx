import { useRef, useState } from "react";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceRecorderButton({
  onRecorded,
  onRecordingChange,
  disabled,
  hidden,
}: {
  onRecorded: (blob: Blob, seconds: number) => void;
  onRecordingChange?: (recording: boolean) => void;
  disabled?: boolean;
  hidden?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType =
        ["audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported(t)) ??
        "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      startRef.current = Date.now();
      setSeconds(0);
      setRecording(true);
      onRecordingChange?.(true);
      timerRef.current = window.setInterval(() => {
        setSeconds(Math.round((Date.now() - startRef.current) / 1000));
      }, 250);
    } catch {
      window.alert("Microphone access is needed to record a voice note.");
    }
  }

  function cleanup() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    setRecording(false);
    onRecordingChange?.(false);
  }

  function cancel() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    cleanup();
  }

  function confirm() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      cleanup();
      return;
    }
    const finalSeconds = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      onRecorded(blob, finalSeconds);
      cleanup();
    };
    recorder.stop();
  }

  if (recording) {
    return (
      <div className="flex flex-1 items-center gap-2 rounded-full bg-secondary px-3 py-2">
        <button
          type="button"
          onClick={cancel}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-destructive transition-transform hover:scale-110 hover:bg-destructive/10 active:scale-95"
          aria-label="Cancel recording"
        >
          <TrashIcon />
        </button>
        <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium tabular-nums text-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
          {formatTime(seconds)}
        </span>
        <div className="flex flex-1 items-center gap-0.5 overflow-hidden px-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="float-slow bg-sunflower"
              style={{
                height: `${6 + ((i * 37) % 16)}px`,
                width: "4px",
                borderRadius: "60% 60% 60% 12%",
                transform: `rotate(${i % 2 === 0 ? -14 : 14}deg)`,
                animationDuration: `${0.6 + (i % 5) * 0.15}s`,
                animationDelay: `${i * 0.04}s`,
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={confirm}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-petal transition-transform hover:scale-110 active:scale-95"
          aria-label="Send voice note"
        >
          <CheckIcon />
        </button>
      </div>
    );
  }

  if (hidden) return null;

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={start}
      disabled={disabled}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-transform hover:scale-110 hover:bg-secondary active:scale-95 disabled:opacity-40"
      aria-label="Record voice note"
    >
      <MicIcon />
    </button>
  );
}

function MicIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
