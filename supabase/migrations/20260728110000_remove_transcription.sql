-- Voice transcription was removed. Drops the function it depended on.
-- Safe to run whether or not the previous migration was already applied.

DROP FUNCTION IF EXISTS public.set_voice_transcript(UUID, TEXT);
