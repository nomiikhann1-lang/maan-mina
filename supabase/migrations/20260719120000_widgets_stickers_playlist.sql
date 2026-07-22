-- Splits the "days together" counter from a separate future-date countdown,
-- expands themes to the requested set, adds custom (uploaded) stickers,
-- a shared playlist, and song-sharing messages.

-- ── couple_settings: separate countdown date + label ───────────────────
ALTER TABLE public.couple_settings ADD COLUMN countdown_date DATE;
ALTER TABLE public.couple_settings ADD COLUMN countdown_label TEXT;

-- ── themes: replace the old set with the requested one ─────────────────
ALTER TABLE public.couple_settings DROP CONSTRAINT couple_settings_theme_check;
ALTER TABLE public.couple_settings
  ADD CONSTRAINT couple_settings_theme_check
  CHECK (theme IN ('light', 'dark', 'pink', 'blue', 'forest', 'galaxy', 'minimal'));

UPDATE public.couple_settings SET theme = 'light' WHERE theme = 'sunflower';
UPDATE public.couple_settings SET theme = 'pink' WHERE theme = 'blossom';
UPDATE public.couple_settings SET theme = 'blue' WHERE theme = 'ocean';
UPDATE public.couple_settings SET theme = 'galaxy' WHERE theme = 'lavender';

ALTER TABLE public.couple_settings ALTER COLUMN theme SET DEFAULT 'light';

-- ── messages: "song" is now a valid type (link-based song sharing) ────
ALTER TABLE public.messages DROP CONSTRAINT messages_type_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_type_check
  CHECK (type IN ('text', 'image', 'voice', 'video', 'sticker', 'song'));

-- ── custom_stickers: room for your own (e.g. anime-fied photo) stickers ─
CREATE TABLE public.custom_stickers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uploader_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.custom_stickers TO authenticated;
GRANT ALL ON public.custom_stickers TO service_role;
ALTER TABLE public.custom_stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read custom stickers" ON public.custom_stickers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users add custom stickers" ON public.custom_stickers FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Users remove their own custom stickers" ON public.custom_stickers FOR DELETE TO authenticated USING (auth.uid() = uploader_id);
ALTER TABLE public.custom_stickers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_stickers;

INSERT INTO storage.buckets (id, name, public) VALUES ('custom-stickers', 'custom-stickers', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public read custom stickers" ON storage.objects FOR SELECT TO public USING (bucket_id = 'custom-stickers');
CREATE POLICY "Authenticated upload custom stickers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'custom-stickers');
CREATE POLICY "Owners delete their custom stickers" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'custom-stickers' AND owner = auth.uid());

-- ── playlist_songs: a shared playlist you build together ──────────────
CREATE TABLE public.playlist_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  added_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.playlist_songs TO authenticated;
GRANT ALL ON public.playlist_songs TO service_role;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read the playlist" ON public.playlist_songs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users add songs" ON public.playlist_songs FOR INSERT TO authenticated WITH CHECK (auth.uid() = added_by);
CREATE POLICY "Users remove songs they added" ON public.playlist_songs FOR DELETE TO authenticated USING (auth.uid() = added_by);
ALTER TABLE public.playlist_songs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.playlist_songs;
