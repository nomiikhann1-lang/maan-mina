// Supabase Edge Function: transcribe-voice

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // 1. Handle browser/app CORS preflight checks
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  // 2. Fetch the API key dynamically per request
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

  if (!GROQ_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Transcription isn't configured yet." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", {
      status: 401,
      headers: corsHeaders,
    });
  }

  const body = await req.json().catch(() => null);
  const audioUrl: string | undefined = body?.audio_url;
  if (!audioUrl) {
    return new Response(
      JSON.stringify({ error: "Missing audio_url" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 3. Fetch voice note audio file
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) throw new Error("Couldn't fetch the voice note");
    const audioBlob = await audioRes.blob();

    // 4. Prepare file for Groq Whisper
    const form = new FormData();
    const audioFile = new File([audioBlob], "voice-note.m4a", {
      type: audioBlob.type || "audio/m4a",
    });
    form.append("file", audioFile);
    form.append("model", "whisper-large-v3");
    form.append("language", "ur");

    const whisperRes = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: form,
      }
    );

    if (!whisperRes.ok) {
      const errText = await whisperRes.text();
      throw new Error(`Groq Whisper failed: ${errText}`);
    }

    const whisperData = await whisperRes.json();
    const rawText: string = whisperData?.text ?? "";

    if (!rawText.trim()) {
      return new Response(
        JSON.stringify({ transcript: "" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Transliterate to Roman Urdu using Groq Llama 3.3
    const romanizeRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
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
      throw new Error(`Groq Transliteration failed: ${errText}`);
    }

    const romanizeData = await romanizeRes.json();
    const transcript: string =
      romanizeData?.choices?.[0]?.message?.content?.trim() ?? rawText;

    return new Response(
      JSON.stringify({ transcript }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("transcribe-voice failed:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Couldn't transcribe that voice note." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});