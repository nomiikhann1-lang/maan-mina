// Supabase Edge Function: send-push
//
// Triggered by a Database Webhook on INSERT into public.messages (set up in
// Supabase Dashboard → Database → Webhooks — see README.md for the exact
// steps). Looks up the *other* person's push subscriptions and sends them a
// web push notification about the new message.
//
// Deploy with:
//   supabase functions deploy send-push --no-verify-jwt
//
// Required secrets (supabase secrets set ...):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, WEBHOOK_SECRET
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by
// the Edge Functions runtime — no need to set those yourself.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@example.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

type MessageRow = {
  id: string;
  sender_id: string;
  content: string;
  type: "text" | "image" | "voice" | "video" | "sticker" | "song";
  media_meta: { urls?: string[] } | null;
};

function previewFor(message: MessageRow) {
  switch (message.type) {
    case "image": {
      const count = message.media_meta?.urls?.length ?? 1;
      return count > 1 ? `📷 Sent ${count} photos` : "📷 Sent a photo";
    }
    case "voice":
      return "🎤 Sent a voice note";
    case "video":
      return "🎥 Sent a video note";
    case "sticker":
      return "✨ Sent a sticker";
    case "song":
      return "🎵 Shared a song";
    default:
      return message.content.length > 120 ? message.content.slice(0, 117) + "…" : message.content;
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!WEBHOOK_SECRET || req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response("VAPID keys not configured", { status: 500 });
  }

  const payload = await req.json().catch(() => null);
  const message: MessageRow | undefined = payload?.record;
  if (!message?.id || !message.sender_id) {
    return new Response("Bad payload", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const [{ data: sender }, { data: subscriptions }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", message.sender_id).maybeSingle(),
    supabase.from("push_subscriptions").select("*").neq("user_id", message.sender_id),
  ]);

  if (!subscriptions || subscriptions.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  const title = `${sender?.display_name ?? "Someone"} 💬`;
  const body = previewFor(message);
  const notificationPayload = JSON.stringify({ title, body, url: "/chat" });

  const staleEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          notificationPayload,
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error("push send failed", err);
        }
      }
    }),
  );

  if (staleEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
  }

  return new Response(JSON.stringify({ sent: subscriptions.length - staleEndpoints.length }), { status: 200 });
});
