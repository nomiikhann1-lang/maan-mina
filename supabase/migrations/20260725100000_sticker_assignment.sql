-- Custom sticker ownership was being inferred from the uploader's profile
-- name, which meant every sticker landed under whoever happened to be
-- logged in at the time — not what either of you actually intended. This
-- makes the category an explicit choice made at upload time instead.

ALTER TABLE public.custom_stickers
  ADD COLUMN assigned_to TEXT NOT NULL DEFAULT 'maan' CHECK (assigned_to IN ('maan', 'mina'));

ALTER TABLE public.custom_stickers ALTER COLUMN assigned_to DROP DEFAULT;

-- Either of you can now tidy up either category — it's a shared, trusted
-- two-person app, so sticker cleanup shouldn't be locked to whoever
-- originally uploaded a given one.
DROP POLICY "Users remove their own custom stickers" ON public.custom_stickers;
CREATE POLICY "Signed-in users manage all custom stickers" ON public.custom_stickers
  FOR DELETE TO authenticated USING (true);
