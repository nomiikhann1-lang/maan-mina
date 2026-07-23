-- Adds "surprise" as a message type — used by the secret tap gesture on
-- the home screen sunflower, which sends a small persistent record (so it
-- shows in history and can trigger a push notification even if the other
-- person's app is closed) alongside an instant real-time broadcast effect
-- for when both of you happen to be online together.

ALTER TABLE public.messages DROP CONSTRAINT messages_type_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_type_check
  CHECK (type IN ('text', 'image', 'voice', 'video', 'sticker', 'song', 'surprise'));
