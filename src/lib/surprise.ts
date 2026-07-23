import { supabase } from "@/integrations/supabase/client";

export type SurpriseKind = "petals" | "confetti-hearts";

/**
 * Sends a surprise two ways at once:
 * 1. A persisted `messages` row — shows up in chat history and (via the
 *    existing push-notification edge function) reaches the other person
 *    even if their app is closed right now.
 * 2. An ephemeral realtime broadcast — for the delightful instant
 *    full-screen effect when you're both online together. This part is
 *    fire-and-forget: if they're not connected, they simply won't see the
 *    live animation, but they'll still get the message + push above.
 */
export async function sendSurprise(userId: string, kind: SurpriseKind = "petals") {
  await supabase.from("messages").insert({
    sender_id: userId,
    content: "💫 sent you a surprise",
    type: "surprise",
    media_meta: { kind },
  });

  const channel = supabase.channel("couple-surprise");
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      void channel.send({ type: "broadcast", event: "surprise", payload: { userId, kind } });
      window.setTimeout(() => void supabase.removeChannel(channel), 1200);
    }
  });
}
