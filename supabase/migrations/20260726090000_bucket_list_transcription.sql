-- Shared bucket list (things to do together) and a narrow function that
-- lets either of you attach a transcript to a voice note without opening
-- up general message editing.

CREATE TABLE public.bucket_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  added_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  text TEXT NOT NULL CHECK (length(text) > 0 AND length(text) <= 200),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_by UUID REFERENCES auth.users,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bucket_list_items TO authenticated;
GRANT ALL ON public.bucket_list_items TO service_role;
ALTER TABLE public.bucket_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read the bucket list" ON public.bucket_list_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users add bucket list items" ON public.bucket_list_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = added_by);
-- Either of you can check items off (or edit) or remove — it's a shared
-- list, and whoever actually did the thing should be able to tick it,
-- even if the other person added it.
CREATE POLICY "Signed-in users update bucket list items" ON public.bucket_list_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Signed-in users delete bucket list items" ON public.bucket_list_items FOR DELETE TO authenticated USING (true);
ALTER TABLE public.bucket_list_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bucket_list_items;

-- Voice note transcript storage — attaches to messages.media_meta without
-- opening up general message content editing.
CREATE OR REPLACE FUNCTION public.set_voice_transcript(msg_id UUID, transcript TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.messages
  SET media_meta = COALESCE(media_meta, '{}'::jsonb) || jsonb_build_object('transcript', transcript)
  WHERE id = msg_id AND type = 'voice';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_voice_transcript(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_voice_transcript(UUID, TEXT) TO authenticated;
