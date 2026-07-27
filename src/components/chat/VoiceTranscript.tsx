import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function VoiceTranscript({
  messageId,
  audioUrl,
  existing,
  mine,
}: {
  messageId: string;
  audioUrl: string;
  existing?: string;
  mine: boolean;
}) {
  const [transcript, setTranscript] = useState<string | null>(existing ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) setTranscript(existing);
  }, [existing]);

  async function transcribe() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("transcribe-voice", {
        body: { audio_url: audioUrl },
      });
      if (fnError) throw fnError;
      const text: string = data?.transcript ?? "";
      if (!text) {
        setError("Couldn't make out any speech in that one.");
        return;
      }
      setTranscript(text);
      await supabase.rpc("set_voice_transcript", { msg_id: messageId, transcript: text });
    } catch {
      setError("Transcription isn't set up yet, or something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (transcript) {
    return (
      <div
        className={`mt-1.5 border-t pt-1.5 text-xs italic ${
          mine
            ? "border-bubble-me-foreground/15 text-bubble-me-foreground/80"
            : "border-border/60 text-muted-foreground"
        }`}
      >
        {transcript}
      </div>
    );
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void transcribe();
        }}
        disabled={loading}
        className={`text-[10px] font-semibold underline decoration-dotted ${
          mine ? "text-bubble-me-foreground/70" : "text-muted-foreground"
        } disabled:opacity-60`}
      >
        {loading ? "Transcribing…" : "Transcribe (Roman Urdu)"}
      </button>
      {error && <div className="mt-0.5 text-[10px] text-destructive">{error}</div>}
    </div>
  );
}
