// Supabase Edge Function: transcribe-voice
//
// Called directly from the chat client (a signed-in user tapping
// "Transcribe" on a voice note) — not a database webhook, so this uses
// normal Supabase JWT verification (deploy WITHOUT --no-verify-jwt).
//
// Pipeline: fetch the voice note audio -> OpenAI Whisper transcribes it
// (Urdu speech comes out in Urdu script) -> a cheap chat-completion pass
// transliterates that into casual Roman Urdu, the way it's actually typed
// in everyday texting, rather than the Urdu script.
//
// Deploy with:
//   supabase functions deploy transcribe-voice
//
// Required secret:
//   supabase secrets set OPENAI_API_KEY="sk-..."

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "Transcription isn't configured yet." }), {
      status: 500,
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const audioUrl: string | undefined = body?.audio_url;
  if (!audioUrl) {
    return new Response(JSON.stringify({ error: "Missing audio_url" }), { status: 400 });
  }

  try {
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) throw new Error("Couldn't fetch the voice note");
    const audioBlob = await audioRes.blob();

    const form = new FormData();
    form.append("file", audioBlob, "voice-note.wav");
    form.append("model", "whisper-1");
    form.append("language", "ur");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    });
    if (!whisperRes.ok) {
      const errText = await whisperRes.text();
      throw new Error(`Transcription failed: ${errText}`);
    }
    const whisperData = await whisperRes.json();
    const rawText: string = whisperData?.text ?? "";
    if (!rawText.trim()) {
      return new Response(JSON.stringify({ transcript: "" }), { status: 200 });
    }

    const romanizeRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You transliterate Urdu (or mixed Urdu/English) speech transcripts into casual Roman Urdu — the way Pakistanis actually type it while texting (Latin letters, informal spelling, no diacritics). Keep any English words that were said in English as English. Output ONLY the transliterated text, nothing else — no quotes, no explanation.",
          },
          { role: "user", content: rawText },
        ],
      }),
    });
    if (!romanizeRes.ok) {
      const errText = await romanizeRes.text();
      throw new Error(`Transliteration failed: ${errText}`);
    }
    const romanizeData = await romanizeRes.json();
    const transcript: string = romanizeData?.choices?.[0]?.message?.content?.trim() ?? rawText;

    return new Response(JSON.stringify({ transcript }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("transcribe-voice failed:", err);
    return new Response(JSON.stringify({ error: "Couldn't transcribe that voice note." }), {
      status: 500,
    });
  }
});
