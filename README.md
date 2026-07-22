# Maan & Mina

A cozy realtime messenger for two, built with TanStack Start + Supabase.

## Stack

- **TanStack Start** (React 19, file-based routing) as the app framework
- **Nitro** as the server build target — pinned to the `vercel` preset in `vite.config.ts`
- **Supabase** for auth (email/password) + Postgres + Realtime (the message feed updates live via `postgres_changes`)

## What changed to make this Vercel-ready

This project was exported from Lovable, which normally builds it for Lovable's own Cloudflare-based hosting. To deploy it on Vercel:

1. **`vite.config.ts`** — pinned `nitro.preset` to `"vercel"` so `vite build` always emits a `.vercel/output` directory (Vercel's Build Output API v3). Verified locally: `npm run build` produces a valid `.vercel/output/config.json` and an `__server` serverless function. No `vercel.json` is needed — Vercel detects `.vercel/output` automatically.
2. **Removed the "Continue with Google" button** and the `@lovable.dev/cloud-auth-js` dependency. That flow calls a `/~oauth/initiate` broker route that only exists inside Lovable's own infrastructure — outside Lovable it would just fail. Email/password sign-in (plain Supabase Auth) still works fully and is now the only sign-in method. If you want Google sign-in back, wire up [Supabase's own Google OAuth provider](https://supabase.com/docs/guides/auth/social-login/auth-google) instead — I'm happy to add that once you confirm you want it.
3. **`.env` is no longer committed.** It previously held real Supabase keys in plain text. It's now a placeholder template and is gitignored (`.env.example` mirrors it) — see below for what to fill in.
4. Confirmed `npm install`, `tsc --noEmit`, and `npm run build` all pass cleanly.

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (get the values from your Supabase project's Settings → API page):

| Variable | Used by | Notes |
|---|---|---|
| `SUPABASE_URL` | server | your Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | server | the `sb_publishable_...` anon key |
| `VITE_SUPABASE_URL` | client (build-time) | same URL, exposed to the browser bundle |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client (build-time) | same publishable key, exposed to the browser bundle |
| `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` | tooling | your project ref, e.g. `abcdefghijklmno` |

Not currently used by any route, but present in `src/integrations/supabase/client.server.ts` for future admin/service-role needs:

| Variable | Notes |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | only add this if you end up writing server code that needs to bypass Row Level Security. Never expose it with a `VITE_` prefix. |

## Database setup

Run the two migrations in `supabase/migrations/` against your Supabase project (via `supabase db push`, or paste them into the SQL editor in order). They create:
- `profiles` — one row per user, auto-created on signup via a trigger
- `messages` — the chat log, with Row Level Security so users can only send as themselves and only delete their own messages
- Realtime is enabled on `messages` so new/deleted messages push to connected clients instantly

## Local development

```bash
npm install
cp .env.example .env   # then fill in your real Supabase values
npm run dev
```

## Deploying to Vercel

1. Push this repo to GitHub (or your git host of choice).
2. Import it in Vercel — Framework Preset can be left as "Other"/auto-detect, since Nitro's `vercel` preset produces the Build Output directly. Build command `npm run build`, no output directory override needed.
3. Add the environment variables listed above.
4. Deploy.

## What's new in this update

A full feature pass on top of the base messenger:

- **Onboarding** (`/onboarding`) — shown once on first visit (tracked via `localStorage`), then routes into the app.
- **Home screen** (`/home`) — the new post-login landing page: greeting, a card for your conversation with a live last-message preview, and quick links to Profile/Settings.
- **Profile screen** (`/profile`) — edit your display name and upload an avatar photo.
- **Settings screen** (`/settings`) — notification toggle, link to profile, sign out.
- **Chat screen** — now supports:
  - **Images** — tap the image icon to send a photo; tap any photo to open it full-screen.
  - **Voice notes** — tap the mic to record, with a live waveform + timer, cancel or send.
  - **Stickers** — an original sticker pack (`src/lib/stickers.tsx`): six cute chibi expressions + six flower designs. All hand-drawn for this app — no real people or copyrighted characters, so there's nothing to worry about there.
  - **Emoji picker** — categorized emoji grid in the composer.
  - **Reactions** — long-press (or tap "react") any message to react with an emoji; tap a reaction to remove your own.
  - **Sent / Delivered / Seen** — ticks under your own messages, backed by two new SECURITY DEFINER functions (`mark_messages_delivered`, `mark_messages_seen`) so the other person can only ever flip those two timestamps, never edit your message content.
  - **Typing indicator** and **online/offline status** — via Supabase Realtime broadcast + presence.
  - **Keyboard-dismiss fix** — every composer button now uses `onMouseDown={e => e.preventDefault()}` plus a refocus call after sending, so tapping Send/emoji/stickers no longer drops the keyboard on mobile.
- **Push notifications** — see the dedicated section below; this piece needs a few manual steps since it involves a real backend function, not just app code.
- **Animations** — page-load bloom/pop-in effects, message pop-in, typing dots, drifting background petals (all already in `styles.css`, now used more consistently across the new screens).
- Cleaned up `public/` — you had a duplicate/garbled favicon set (a `web-app-manifest-192x192.png` mislabeled as 512 and vice versa, a stray `favicon.zip` and `New folder`, an orphaned `site.webmanifest`). Fixed the sizes, removed the junk, and pointed `__root.tsx` at your actual generated favicon set instead of my old placeholder icon.

## Database setup (updated)

Run the migrations in `supabase/migrations/` **in order**, in the Supabase SQL Editor (or `supabase db push`). There's one new file since the last round: `20260717130000_rich_messaging.sql`. It adds:
- `type` / `media_url` / `media_meta` / `delivered_at` / `seen_at` columns on `messages`
- `message_reactions` and `push_subscriptions` tables (with RLS)
- the `mark_messages_delivered` / `mark_messages_seen` functions
- two storage buckets: `chat-media` (photos + voice notes) and `avatars` (profile photos) — public read, authenticated write, delete restricted to the uploader

If you already ran the earlier migrations, you only need to run this new one.

## Setting up push notifications

This is the one feature that needs real backend wiring, not just app code — a browser can't send itself a push while it's closed, so a server has to do it. Here's the full path:

**1. Add the VAPID public key to your Vercel env vars** (I generated a keypair for you — the public key is safe to share, already in `.env.example` as `VITE_VAPID_PUBLIC_KEY`):

```
VITE_VAPID_PUBLIC_KEY=BAXlVG1e91q2tZzfM_LBwfAvrriNBA57kiHt9Z6-EfUo1mpuqM5QMPcp-_5zGD3zauAq2DNtEKVVNlJ0oMz5ECs
```

**2. Install the Supabase CLI** if you don't have it: `npm install -g supabase`, then `supabase login` and `supabase link --project-ref your-project-ref`.

**3. Deploy the edge function:**
```bash
supabase functions deploy send-push --no-verify-jwt
```
(`--no-verify-jwt` is needed because the database webhook that triggers this function calls it directly, not as a logged-in user. The function checks its own `x-webhook-secret` header instead — see step 4.)

**4. Set the function's secrets** (the private key and webhook secret below were generated for you — I'm giving them to you here in chat rather than putting them in the repo, since anything in the repo could end up on GitHub):
```bash
supabase secrets set VAPID_PUBLIC_KEY="BAXlVG1e91q2tZzfM_LBwfAvrriNBA57kiHt9Z6-EfUo1mpuqM5QMPcp-_5zGD3zauAq2DNtEKVVNlJ0oMz5ECs"
supabase secrets set VAPID_PRIVATE_KEY="gRcR0raktE_sG_xvYks8hGhInYKD2qS2uE9RmWlV10A"
supabase secrets set VAPID_SUBJECT="mailto:you@example.com"
supabase secrets set WEBHOOK_SECRET="99467d4b584c622cf5008ef09eef804e2271c6606cb87dd9"
```
(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically inside edge functions — you don't set those yourself.)

**5. Create the Database Webhook** that calls the function whenever a message is sent:
- Supabase Dashboard → **Database → Webhooks** → **Create a new hook**
- Name: `send-push-on-message`
- Table: `messages`, Events: `INSERT` only
- Type: **HTTP Request**, Method: `POST`
- URL: `https://<your-project-ref>.supabase.co/functions/v1/send-push`
- Headers: add `x-webhook-secret` = `99467d4b584c622cf5008ef09eef804e2271c6606cb87dd9` (same value as above)
- Save.

**6. Turn it on in the app** — open Settings → toggle Notifications on (this asks for browser permission and saves a push subscription for that device). Do this on both of your phones/browsers.

That's it — new messages will now trigger a push to whichever of you didn't send it, even if the app is closed (subject to the platform notes below).

**Platform notes:**
- **Android (Chrome)**: works well, including when the app is installed to the home screen.
- **iPhone (Safari)**: only works if the app is **installed to the home screen first** ("Add to Home Screen"), and requires iOS 16.4+. Push to a plain Safari tab isn't supported by iOS.
- If notifications ever stop arriving for one of you, toggling Settings → Notifications off and back on re-subscribes that device.

## Second feature pass — what's new

### New migration to run

Run `supabase/migrations/20260718090000_reply_video_settings.sql` in the SQL Editor (after the two earlier migrations, in order). It adds:
- `reply_to_id` on `messages` (for reply/quote)
- `video` as a valid message type
- `last_active_at` on `profiles`, added to realtime (for "last seen X ago")
- a `couple_settings` singleton table (anniversary date + theme), shared and synced live between both of you

### Feature notes

- **Last online time** — the header now shows "online" (live, via presence) or "last seen 5m ago" (from `profiles.last_active_at`, refreshed every ~25s while the app is open and visible on a device).
- **Mobile layout fixes** — pinned the composer to the real visible viewport (via the VisualViewport API, not just `100dvh`, since that doesn't reliably shrink for the keyboard on every Android browser), turned off page-level bounce/rubber-banding (`overscroll-behavior: none`), locked pinch-zoom (which was shifting the layout), and reduced/reflowed the composer icons so nothing overflows on narrow phones (moved Photo+Video behind fewer, smaller buttons with `min-w-0`/`flex-nowrap` so the row always fits).
- **Sent/Delivered/Seen** — about this one: I re-audited the code and hardened it (the RPC calls now log errors instead of failing silently — check your browser console if ticks still don't progress). But I couldn't reproduce a code bug — the logic looks correct, and delivered/seen fundamentally requires **the other person to have actually opened the chat** on their device (that's what flips the tick — it's not automatic). Two things to check on your end: (1) make sure the new migrations actually ran, (2) test with both accounts open on two devices/browsers, not just one. If it's still stuck after that, open the browser console while chatting and tell me what error (if any) `mark_messages_delivered`/`mark_messages_seen` throws — that'll tell us exactly where it's breaking.
- **Stickers** — expanded from 12 to 37 (18 chibi expressions + 19 flowers/objects). I wasn't able to match "as many as your emoji picker" (~130) — that's a lot of individually hand-drawn original artwork to keep at good quality in one pass. Let me know if you'd like another batch added.
- **Reply/quote** — tap a message → "reply" to quote it; tap the quoted snippet inside a reply to jump back to the original.
- **Image compression** — photos are downscaled to a 1600px long edge and re-encoded as JPEG (quality 0.82) client-side before upload. GIFs are left untouched so they don't lose animation.
- **Multiple photos** — the photo picker now accepts up to 10 at once (`multiple` file input), sent together as one album bubble; extra selections beyond 10 are dropped with a small warning.
- **Video notes** — tap the camera icon to record up to 15 seconds with a live front-camera preview, capped automatically at 15s. Kept small via capture-time settings (480×854, ~800kbps video / 64kbps audio) rather than a heavier re-encode step — client-side video transcoding would need a large library (ffmpeg.wasm) that's overkill for 15-second clips.
- **Countdown widget** — top-right of the home screen. Shows "Day N" counting from a shared anniversary date (set in Settings → "Our special date"); shows a gentle "Add our date" prompt until one's set.
- **Custom theme** — 4 presets (Sunflower/Blossom/Ocean/Lavender) in Settings, synced live between both of you via `couple_settings`.
- **"Thinking of you" / "Missing you"** — two one-tap buttons on the home screen that send a preset message instantly, no need to open the chat or keyboard.
- **Pagination** — chat now loads the most recent 50 messages, and fetches the next 50 older ones automatically when you scroll near the top (scroll position is preserved so it doesn't jump).
- **Emoji picker** — moved out of the text input into its own icon in the composer row (was cramped inside the input before).

## Third pass — bug fixes and polish

No new migration needed for this round — everything here is client-side.

### Real bugs found and fixed

- **Video recorder "breaking the view"** — this was a real bug: both `VideoRecorderButton` and `VoiceRecorderButton` were rendered inside `{!isRecording && (...)}`. The instant you started recording, React unmounted the very component showing the recording UI (it doesn't just hide — the element and all its internal state disappear). On top of that, the video recording panel was absolutely-positioned relative to a tiny 40px icon wrapper instead of the full composer, so even a fixed mount would have rendered squished. Both are fixed: the recorder components now stay mounted the whole time (they take a `hidden` prop to hide their own idle icon without unmounting), and the recording panel is now anchored to the full-width composer.
- **Mobile layout jumping** — the previous fix (`100dvh` + a JS-computed height) wasn't enough because the container was still in normal document flow, so iOS could still auto-scroll the whole page to bring a focused input into view, dragging everything with it. The chat screen is now `position: fixed` to the actual viewport (anchored via the VisualViewport API's height *and* offset, not just height), which can't be dragged around by that browser behavior. Also added `overscroll-behavior: none` site-wide and locked pinch-zoom, since both were contributing to the "moves while swiping" feeling.
- **Video auto-stop race condition** — at exactly 15 seconds, the recorder's own timer and its auto-stop check could both fire before the recorder finished stopping, occasionally calling stop twice. Fixed by clearing the timer immediately when stopping starts, not after.
- **Silent send failures** — sending a text message or sticker that failed (e.g. a dropped connection) previously just logged to the console with no on-screen feedback. Both now show the same error banner used for photo/voice/video uploads.

### Requested changes

- **Countdown widget** now properly counts down for a **future** date — live-ticking `Nd Nh` / `Nh Nm` / `Nm Ns` (auto-adjusts granularity, updates every second) with an hourglass icon. If the date has already passed, it falls back to the "Day N together" counter instead, since that's the more natural read for a past anniversary.
- **"Thinking of you" / "Missing you"** now trigger a small burst of floating emoji particles rising and fading from the button, plus a short vibration on devices that support it (`navigator.vibrate` — mostly Android; iOS Safari doesn't expose this API, so it'll just skip silently there).
- Popovers (emoji/sticker pickers) now cap their width to the actual viewport (`min(20rem, 100vw - 24px)`) with 12px collision padding, so they can no longer render wider than the screen on narrow phones.

If the mobile layout still feels off in a specific spot, the most useful thing you can send me is: which phone/browser, and whether it's the composer being cut off, the page bouncing/shifting, or something else — "still not fixed" narrows down to a lot of different possible causes, and I've addressed the ones I could identify concretely in the code.

## Fourth pass — reactions, animations, themes, widgets, stickers, songs

### New migration to run

Run `supabase/migrations/20260719120000_widgets_stickers_playlist.sql` (after the three earlier ones). It:
- splits the countdown into two independent date fields (`anniversary_date` for the always-counts-up "Days together", new `countdown_date`/`countdown_label` for a separate future countdown)
- replaces the theme set and remaps any theme you'd already picked (old → new: sunflower→light, blossom→pink, ocean→blue, lavender→galaxy)
- adds `custom_stickers` (table + storage bucket) for your own uploaded stickers
- adds `playlist_songs` for the shared playlist
- adds `song` as a valid message type

### Answers to your questions

- **Poke buttons**: Home screen, directly under the "Open chat" card — not in the chat screen itself.
- **Delivered ticks not showing**: this is expected, not a bug, in the common case — if the other person already has the chat open when you send, `delivered_at` and `seen_at` both get set within milliseconds of each other, so the UI has nothing to visually distinguish. I've made the tick icon animate through sent → delivered → seen over ~450ms whenever that happens, purely so you can *see* the progression (see below) — the underlying delivered timestamp was always being recorded correctly, it just wasn't visible before.

### What's new

- **Double-tap to react** — double-tap any message for an instant ❤️ (Instagram-style), with a heart that pops and fades over the bubble.
- **Typing indicator** now shows the actual name: "Mina is typing…" instead of generic "typing…".
- **Animated ticks** — sent → delivered → seen now visibly animates instead of snapping; the icon transitions through each state with a brief pop, and turns blue for seen.
- **Voice waveform** reskinned as small sunflower-petal shapes (teardrop, rotated, sunflower-yellow when played) instead of plain bars — used in both the recorder and the playback bubble.
- **Message animations** — your own messages slide in from the right, theirs from the left (instead of both just popping in the same way); stickers get a bouncier "bloom" entrance instead.
- **7 themes**: Light, Dark, Pink, Blue, Forest, Galaxy, Minimal — all in Settings, synced live between both of you.
- **Two separate widgets** on the home screen: "Days together" (always counts up from your anniversary date) and a genuinely separate "Countdown" widget for any upcoming date you set — live-ticking days/hours/minutes/seconds, with its own label (e.g. "Our trip").
- **More stickers**: 39 now (was 37) — added a couple-hug and a kiss-mark on top of the existing hug/kiss chibi stickers, plus a few more hug/kiss/couple emoji in the picker's Love category.
- **Room for your own stickers** — Settings → "Our stickers" lets either of you upload images (auto-compressed) that show up in a second "Ours" tab in the sticker picker, right next to the built-in ones. This is exactly the slot for those anime-fied photos once they're ready — no code changes needed on your end, just upload them there when you have them.
- **Song sharing** — paste a Spotify, YouTube, SoundCloud, or Apple Music link as a message and it automatically becomes an embedded, playable card instead of plain text. No API keys involved — it's pattern-matching the URL into each service's public embed format.
- **Shared playlist** — a new screen (Settings → "Our playlist", or `/playlist`) where you both add songs to a running list you build together, separate from chat history.

### Honest scope note on songs

This is link-based sharing, not a search — there's no "search for a song by name" box, because that would need a Spotify/YouTube API key and OAuth setup, which is a bigger, separate piece of infrastructure. Pasting a link you already have (from the Spotify/YouTube app's share button, for instance) works great; typing just a song title won't do anything. Let me know if you'd want proper search added later — it's doable, just needs API credentials from you first.
