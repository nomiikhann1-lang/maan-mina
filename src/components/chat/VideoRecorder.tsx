import { useEffect, useRef, useState } from "react";

const MAX_SECONDS = 15;

export function VideoRecorderButton({
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 854 }, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play();
      }
      const mimeType =
        [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
          "video/mp4",
        ].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: 800_000,
        audioBitsPerSecond: 64_000,
      });
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
        const elapsed = (Date.now() - startRef.current) / 1000;
        setSeconds(Math.round(elapsed));
        if (elapsed >= MAX_SECONDS) confirm();
      }, 200);
    } catch {
      window.alert("Camera access is needed to record a video note.");
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
    // Stop the ticking timer immediately — otherwise the auto-stop check at
    // MAX_SECONDS can fire this again before recorder.state flips to
    // "inactive" (stop() is async), calling confirm() more than once.
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const finalSeconds = Math.max(
      1,
      Math.min(MAX_SECONDS, Math.round((Date.now() - startRef.current) / 1000)),
    );
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      onRecorded(blob, finalSeconds);
      cleanup();
    };
    recorder.stop();
  }

  if (recording) {
    const progress = Math.min(1, seconds / MAX_SECONDS);
    return (
      <div className="pop-in absolute inset-x-2 bottom-[calc(100%+8px)] flex flex-col items-center gap-2 rounded-3xl border border-border/60 bg-card p-3 shadow-soft">
        <div className="relative aspect-[3/4] w-32 overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
            {seconds}s / {MAX_SECONDS}s
          </div>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={cancel}
            className="grid h-10 w-10 place-items-center rounded-full text-destructive transition-transform hover:scale-110 hover:bg-destructive/10 active:scale-95"
            aria-label="Cancel recording"
          >
            <TrashIcon />
          </button>
          <button
            type="button"
            onClick={confirm}
            className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-petal transition-transform hover:scale-110 active:scale-95"
            aria-label="Send video note"
          >
            <CheckIcon />
          </button>
        </div>
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
      aria-label="Record a video note"
    >
      <VideoIcon />
    </button>
  );
}

function VideoIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="13" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 10l5-3v10l-5-3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
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
