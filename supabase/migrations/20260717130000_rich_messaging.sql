-- Rich messaging: message types (image/voice/sticker), reactions,
-- delivered/seen receipts, push notification subscriptions, and storage.

-- ── messages: extend for image/voice/sticker + read receipts ──────────────
ALTER TABLE public.messages
  ADD COLUMN type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'voice', 'sticker')),
  ADD COLUMN media_url TEXT,
  ADD COLUMN media_meta JSONB,
  ADD COLUMN delivered_at TIMESTAMPTZ,
  ADD COLUMN seen_at TIMESTAMPTZ;

-- Recipients need to flip delivered_at/seen_at, but must never touch content
-- or sender_id. Route that through SECURITY DEFINER functions instead of a
-- broad UPDATE grant so the only thing a recipient can ever change is these
-- two timestamps on messages they didn't send.
CREATE OR REPLACE FUNCTION public.mark_messages_delivered(msg_ids UUID[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.messages
  SET delivered_at = now()
  WHERE id = ANY(msg_ids) AND sender_id <> auth.uid() AND delivered_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_messages_seen(msg_ids UUID[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.messages
  SET seen_at = now(), delivered_at = COALESCE(delivered_at, now())
  WHERE id = ANY(msg_ids) AND sender_id <> auth.uid() AND seen_at IS NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_messages_delivered(UUID[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_messages_seen(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_messages_delivered(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_seen(UUID[]) TO authenticated;

-- ── message_reactions ───────────────────────────────────────────────────
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (length(emoji) > 0 AND length(emoji) <= 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);
CREATE INDEX message_reactions_message_id_idx ON public.message_reactions (message_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read reactions" ON public.message_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users add own reactions" ON public.message_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users change own reactions" ON public.message_reactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own reactions" ON public.message_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- ── push_subscriptions ──────────────────────────────────────────────────
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── storage: chat media (images/voice notes) + avatars ─────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read chat media" ON storage.objects FOR SELECT TO public USING (bucket_id = 'chat-media');
CREATE POLICY "Authenticated upload chat media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-media');
CREATE POLICY "Owners delete their chat media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'chat-media' AND owner = auth.uid());

CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Owners update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND owner = auth.uid());
CREATE POLICY "Owners delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND owner = auth.uid());
