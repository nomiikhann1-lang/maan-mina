-- Reply/quote, video messages, multi-photo albums, last-active tracking,
-- and shared couple-level settings (anniversary date + theme).

-- ── reply/quote ─────────────────────────────────────────────────────────
ALTER TABLE public.messages
  ADD COLUMN reply_to_id UUID REFERENCES public.messages (id) ON DELETE SET NULL;

-- ── allow "video" as a message type (multi-photo albums reuse the existing
--    "image" type + media_meta.urls, so no new type needed for those) ────
ALTER TABLE public.messages DROP CONSTRAINT messages_type_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_type_check CHECK (type IN ('text', 'image', 'voice', 'video', 'sticker'));

-- ── last-seen tracking for "last online X ago" ─────────────────────────
ALTER TABLE public.profiles ADD COLUMN last_active_at TIMESTAMPTZ;
-- Already covered by the existing "Users update own profile" policy
-- (auth.uid() = id), so no new RLS policy is needed for this column.
-- Add profiles to realtime so "last seen" updates live while a chat is
-- open, not just after a reload.
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ── shared settings: anniversary countdown + theme choice ─────────────
-- Singleton table (id is always 1) so both of you read/write the same row.
CREATE TABLE public.couple_settings (
  id SMALLINT NOT NULL PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  anniversary_date DATE,
  theme TEXT NOT NULL DEFAULT 'sunflower' CHECK (theme IN ('sunflower', 'blossom', 'ocean', 'lavender')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.couple_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

GRANT SELECT, UPDATE ON public.couple_settings TO authenticated;
GRANT ALL ON public.couple_settings TO service_role;
ALTER TABLE public.couple_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read couple settings" ON public.couple_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Signed-in users update couple settings" ON public.couple_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE public.couple_settings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_settings;
