import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { greetingFor } from "@/lib/greeting";
import { compressImage, extensionForMime, uploadChatMedia } from "@/lib/media";
import { previewForMessage } from "@/lib/messagePreview";
import { formatRelativeTime } from "@/lib/time";
import { useVisualViewport } from "@/hooks/useVisualViewportHeight";
import {
  EmojiPopover,
  StickerPopover,
  type CustomSticker,
  type StickerPick,
} from "@/components/chat/Popovers";
import { ImageLightbox, type LightboxItem } from "@/components/chat/ImageLightbox";
import { MessageTicks } from "@/components/chat/MessageTicks";
import { ReactionBadges, ReactionPickerBar, type Reaction } from "@/components/chat/Reactions";
import { VoiceRecorderButton } from "@/components/chat/VoiceRecorder";
import { VoicePlayer } from "@/components/chat/VoicePlayer";
import { VideoRecorderButton } from "@/components/chat/VideoRecorder";
import { QuotedPreview, ReplyComposerBar, type QuotedMessage } from "@/components/chat/Reply";
import { StickerArt, type StickerId } from "@/lib/stickers";
import { detectSongUrl, type SongProvider } from "@/lib/songs";
import { SongCard } from "@/components/chat/SongCard";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

const PAGE_SIZE = 50;
const MAX_PHOTOS = 10;

type MessageType = "text" | "image" | "voice" | "video" | "sticker" | "song";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  type: MessageType;
  media_url: string | null;
  media_meta: {
    duration_seconds?: number;
    sticker_id?: StickerId;
    custom_sticker_url?: string;
    urls?: string[];
    provider?: SongProvider;
    embed_url?: string;
  } | null;
  delivered_at: string | null;
  seen_at: string | null;
  reply_to_id: string | null;
};

type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  last_active_at: string | null;
};

function ChatPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lightbox, setLightbox] = useState<{ items: LightboxItem[]; index: number } | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [recordingKind, setRecordingKind] = useState<"voice" | "video" | null>(null);
  const isRecording = recordingKind !== null;
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<QuotedMessage | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [customStickers, setCustomStickers] = useState<CustomSticker[]>([]);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageElRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const lastTypingSentRef = useRef(0);
  const prevScrollHeightRef = useRef(0);

  const { height: viewportHeight, offsetTop } = useVisualViewport();
  const me = profiles[user.id];
  const other = Object.values(profiles).find((p) => p.id !== user.id);
  const greeting = greetingFor(me?.display_name ?? "friend");
  const messageById = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  function focusInput() {
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  // initial load: most recent PAGE_SIZE messages
  useEffect(() => {
    (async () => {
      const [{ data: msgs }, { data: profs }, { data: reacts }] = await Promise.all([
        supabase
          .from("messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE),
        supabase.from("profiles").select("id, display_name, avatar_url, last_active_at"),
        supabase.from("message_reactions").select("*"),
      ]);
      const ordered = ((msgs ?? []) as Message[]).slice().reverse();
      setMessages(ordered);
      setHasMore((msgs ?? []).length === PAGE_SIZE);
      setProfiles(Object.fromEntries((profs ?? []).map((p) => [p.id, p as Profile])));
      const grouped: Record<string, Reaction[]> = {};
      for (const r of (reacts ?? []) as Reaction[]) {
        (grouped[r.message_id] ??= []).push(r);
      }
      setReactions(grouped);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    async function loadCustomStickers() {
      const { data } = await supabase
        .from("custom_stickers")
        .select("id, image_url, label")
        .order("created_at", { ascending: false });
      setCustomStickers((data as CustomSticker[]) ?? []);
    }
    void loadCustomStickers();
    const channel = supabase
      .channel("custom-stickers-chat")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "custom_stickers" },
        () => void loadCustomStickers(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadMore() {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldest = messages[0].created_at;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .lt("created_at", oldest)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    const older = ((data ?? []) as Message[]).slice().reverse();
    const el = scrollerRef.current;
    prevScrollHeightRef.current = el?.scrollHeight ?? 0;
    setMessages((prev) => [...older, ...prev]);
    setHasMore((data ?? []).length === PAGE_SIZE);
    setLoadingMore(false);
  }

  // preserve scroll position after prepending older messages
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || prevScrollHeightRef.current === 0) return;
    el.scrollTop += el.scrollHeight - prevScrollHeightRef.current;
    prevScrollHeightRef.current = 0;
  }, [messages]);

  function onScroll() {
    const el = scrollerRef.current;
    if (el && el.scrollTop < 80) void loadMore();
  }

  // realtime: messages, reactions, typing broadcast, presence
  useEffect(() => {
    const channel = supabase
      .channel("messages-room", { config: { presence: { key: user.id } } })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => {
            const next = payload.new as Message;
            if (prev.some((m) => m.id === next.id)) return prev;
            return [...prev, next];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const next = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === next.id ? next : m)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          const old = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        (payload) => {
          setReactions((prev) => {
            const copy: Record<string, Reaction[]> = { ...prev };
            if (payload.eventType === "DELETE") {
              const old = payload.old as Reaction;
              copy[old.message_id] = (copy[old.message_id] ?? []).filter((r) => r.id !== old.id);
            } else {
              const row = payload.new as Reaction;
              const list = (copy[row.message_id] ?? []).filter((r) => r.id !== row.id);
              copy[row.message_id] = [...list, row];
            }
            return copy;
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          const next = payload.new as Profile;
          setProfiles((prev) => ({ ...prev, [next.id]: next }));
        },
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.userId === user.id) return;
        setOtherTyping(true);
        if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = window.setTimeout(() => setOtherTyping(false), 3000);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const others = Object.keys(state).filter((key) => key !== user.id);
        setOtherOnline(others.length > 0);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user.id]);

  // autoscroll to bottom only for genuinely new messages (not pagination loads)
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    if (prevScrollHeightRef.current !== 0) return;
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastMessageId, loaded, otherTyping]);

  // mark incoming messages delivered as soon as they arrive
  useEffect(() => {
    const toDeliver = messages
      .filter((m) => m.sender_id !== user.id && !m.delivered_at)
      .map((m) => m.id);
    if (toDeliver.length > 0) {
      supabase.rpc("mark_messages_delivered", { msg_ids: toDeliver }).then(({ error }) => {
        if (error) console.error("mark_messages_delivered failed:", error.message);
      });
    }
  }, [messages, user.id]);

  // mark seen while the chat is open and visible
  const markSeen = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    const toSee = messages.filter((m) => m.sender_id !== user.id && !m.seen_at).map((m) => m.id);
    if (toSee.length > 0) {
      supabase.rpc("mark_messages_seen", { msg_ids: toSee }).then(({ error }) => {
        if (error) console.error("mark_messages_seen failed:", error.message);
      });
    }
  }, [messages, user.id]);

  useEffect(() => {
    markSeen();
    document.addEventListener("visibilitychange", markSeen);
    window.addEventListener("focus", markSeen);
    return () => {
      document.removeEventListener("visibilitychange", markSeen);
      window.removeEventListener("focus", markSeen);
    };
  }, [markSeen]);

  function notifyTyping() {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId: user.id } });
  }

  async function insertMessage(fields: Partial<Message> & { content: string; type: MessageType }) {
    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: user.id, reply_to_id: replyingTo?.id ?? null, ...fields })
      .select()
      .single();
    if (error) throw error;
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]));
    setReplyingTo(null);
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    setUploadError(null);
    try {
      const song = detectSongUrl(content);
      if (song) {
        await insertMessage({
          content: `🎵 ${content}`,
          type: "song",
          media_url: song.originalUrl,
          media_meta: { provider: song.provider, embed_url: song.embedUrl },
        });
      } else {
        await insertMessage({ content, type: "text" });
      }
    } catch (err) {
      setText(content);
      setUploadError(err instanceof Error ? err.message : "Couldn't send that message.");
      console.error(err);
    } finally {
      setSending(false);
      focusInput();
    }
  }

  async function sendSticker(pick: StickerPick) {
    setUploadError(null);
    try {
      if (pick.kind === "builtin") {
        await insertMessage({
          content: "✨ Sticker",
          type: "sticker",
          media_meta: { sticker_id: pick.id },
        });
      } else {
        await insertMessage({
          content: "✨ Sticker",
          type: "sticker",
          media_meta: { custom_sticker_url: pick.url },
        });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Couldn't send that sticker.");
      console.error(err);
    } finally {
      focusInput();
    }
  }

  async function handleImagesPick(e: React.ChangeEvent<HTMLInputElement>) {
    const allFiles = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (allFiles.length === 0) return;
    const files = allFiles.slice(0, MAX_PHOTOS);
    const badFile = files.find((f) => !f.type.startsWith("image/"));
    if (badFile) {
      setUploadError("Please choose only image files.");
      return;
    }
    setUploadError(
      allFiles.length > MAX_PHOTOS ? `Only the first ${MAX_PHOTOS} photos were sent.` : null,
    );
    setUploadBusy(true);
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const compressed = await compressImage(file);
          const ext = extensionForMime(compressed.type || file.type, "jpg");
          return uploadChatMedia(compressed, user.id, ext);
        }),
      );
      await insertMessage({
        content: urls.length > 1 ? `📷 ${urls.length} photos` : "📷 Photo",
        type: "image",
        media_url: urls[0],
        media_meta: { urls },
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Couldn't send those photos.");
    } finally {
      setUploadBusy(false);
      focusInput();
    }
  }

  async function handleVoiceRecorded(blob: Blob, seconds: number) {
    setUploadError(null);
    setUploadBusy(true);
    try {
      const ext = extensionForMime(blob.type, "webm");
      const url = await uploadChatMedia(blob, user.id, ext);
      await insertMessage({
        content: `🎤 Voice note (${seconds}s)`,
        type: "voice",
        media_url: url,
        media_meta: { duration_seconds: seconds },
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Couldn't send that voice note.");
    } finally {
      setUploadBusy(false);
      focusInput();
    }
  }

  async function handleVideoRecorded(blob: Blob, seconds: number) {
    setUploadError(null);
    setUploadBusy(true);
    try {
      const ext = extensionForMime(blob.type, "webm");
      const url = await uploadChatMedia(blob, user.id, ext);
      await insertMessage({
        content: `🎥 Video note (${seconds}s)`,
        type: "video",
        media_url: url,
        media_meta: { duration_seconds: seconds },
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Couldn't send that video note.");
    } finally {
      setUploadBusy(false);
      focusInput();
    }
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const mine = (reactions[messageId] ?? []).find((r) => r.user_id === user.id);
    if (mine && mine.emoji === emoji) {
      await supabase.from("message_reactions").delete().eq("id", mine.id);
      setReactions((prev) => ({
        ...prev,
        [messageId]: (prev[messageId] ?? []).filter((r) => r.id !== mine.id),
      }));
    } else {
      const { data } = await supabase
        .from("message_reactions")
        .upsert(
          { message_id: messageId, user_id: user.id, emoji },
          { onConflict: "message_id,user_id" },
        )
        .select()
        .single();
      if (data) {
        setReactions((prev) => ({
          ...prev,
          [messageId]: [
            ...(prev[messageId] ?? []).filter((r) => r.user_id !== user.id),
            data as Reaction,
          ],
        }));
      }
    }
  }

  async function deleteMsg(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await supabase.from("messages").delete().eq("id", id);
  }

  function labelFor(senderId: string) {
    return senderId === user.id ? "You" : (profiles[senderId]?.display_name ?? "Them");
  }

  function startReply(m: Message) {
    setReplyingTo({ id: m.id, senderLabel: labelFor(m.sender_id), preview: previewForMessage(m) });
    focusInput();
  }

  function scrollToMessage(id: string) {
    const el = messageElRefs.current.get(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(id);
    setTimeout(() => setHighlightId(null), 1200);
  }

  function openLightbox(items: LightboxItem[], index: number) {
    setLightbox({ items, index });
  }

  const lastMineSeenId = useMemo(() => {
    const mine = messages.filter((m) => m.sender_id === user.id && m.seen_at);
    return mine.length > 0 ? mine[mine.length - 1].id : null;
  }, [messages, user.id]);

  const otherStatus = otherOnline
    ? "online"
    : other?.last_active_at
      ? `last seen ${formatRelativeTime(other.last_active_at)}`
      : "offline";

  return (
    <div
      className="fixed inset-x-0 top-0 z-20 flex flex-col overflow-hidden bg-background"
      style={{
        height: viewportHeight,
        transform: offsetTop ? `translateY(${offsetTop}px)` : undefined,
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        <div className="drift absolute -top-8 -right-6 text-8xl opacity-15">🌻</div>
        <div
          className="drift absolute top-1/3 -left-8 text-6xl opacity-15"
          style={{ animationDelay: "-5s" }}
        >
          🌼
        </div>
        <div className="float-slow absolute bottom-24 right-8 text-5xl opacity-15">🌸</div>
      </div>

      <header className="safe-top relative z-10 flex items-center gap-3 border-b border-border/60 bg-card/70 px-3 py-3 backdrop-blur">
        <button
          onClick={() => navigate({ to: "/home" })}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-foreground transition-transform hover:scale-110 hover:bg-secondary"
          aria-label="Back to home"
        >
          <BackIcon />
        </button>
        <Avatar profile={other} fallback="🌻" />
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-semibold leading-tight text-foreground">
            {other?.display_name ?? "Waiting for your other half…"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {otherTyping ? (
              <span className="italic text-primary">
                {other?.display_name ?? "They"} is typing…
              </span>
            ) : (
              <>
                <span
                  className={`inline-block h-2 w-2 rounded-full ${otherOnline ? "bg-sage" : "bg-border"}`}
                />
                {otherStatus}
              </>
            )}
          </div>
        </div>
      </header>

      {/* messages */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="scroll-touch relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        {!loaded ? (
          <div className="flex h-full items-center justify-center text-4xl">
            <span className="float-slow">🌻</span>
          </div>
        ) : messages.length === 0 ? (
          <EmptyState name={other?.display_name} />
        ) : (
          <ul className="mx-auto flex max-w-2xl flex-col gap-1.5">
            {loadingMore && (
              <li className="flex justify-center py-2 text-xs text-muted-foreground">
                Loading earlier messages…
              </li>
            )}
            {messages.map((m, i) => {
              const mine = m.sender_id === user.id;
              const prev = messages[i - 1];
              const grouped =
                prev &&
                prev.sender_id === m.sender_id &&
                new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() <
                  3 * 60 * 1000;
              const showDay = !prev || !sameDay(prev.created_at, m.created_at);
              const quoted = m.reply_to_id ? messageById.get(m.reply_to_id) : undefined;
              return (
                <div key={m.id}>
                  {showDay && <DayDivider iso={m.created_at} />}
                  <Bubble
                    message={m}
                    mine={mine}
                    grouped={grouped}
                    reactions={reactions[m.id] ?? []}
                    myUserId={user.id}
                    showTicks={mine && m.id === lastMineSeenId}
                    highlighted={m.id === highlightId}
                    setRef={(el) => {
                      if (el) messageElRefs.current.set(m.id, el);
                      else messageElRefs.current.delete(m.id);
                    }}
                    quoted={
                      m.reply_to_id
                        ? quoted
                          ? {
                              id: quoted.id,
                              senderLabel: labelFor(quoted.sender_id),
                              preview: previewForMessage(quoted),
                            }
                          : { id: m.reply_to_id, senderLabel: "", preview: "Original message" }
                        : undefined
                    }
                    onQuotedClick={
                      m.reply_to_id ? () => scrollToMessage(m.reply_to_id!) : undefined
                    }
                    onDelete={mine ? () => deleteMsg(m.id) : undefined}
                    onReact={(emoji) => toggleReaction(m.id, emoji)}
                    onReply={() => startReply(m)}
                    onOpenImage={(index) => {
                      const urls = m.media_meta?.urls ?? (m.media_url ? [m.media_url] : []);
                      openLightbox(
                        urls.map((src) => ({ type: "image", src }) as LightboxItem),
                        index,
                      );
                    }}
                    onOpenVideo={() => {
                      if (m.media_url) openLightbox([{ type: "video", src: m.media_url }], 0);
                    }}
                  />
                </div>
              );
            })}
            {otherTyping && (
              <li className="mt-1 flex justify-start">
                <div className="flex items-center gap-1 rounded-3xl rounded-bl-md border border-border/60 bg-bubble-them px-4 py-3">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                  <span
                    className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </li>
            )}
          </ul>
        )}
      </div>

      {uploadError && (
        <div className="relative z-10 mx-4 mb-2 rounded-2xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {uploadError}
        </div>
      )}

      {replyingTo && <ReplyComposerBar quoted={replyingTo} onCancel={() => setReplyingTo(null)} />}

      {/* composer */}
      <form
        onSubmit={send}
        className="safe-bottom relative z-10 flex flex-nowrap items-end gap-1 border-t border-border/60 bg-card/80 px-2 py-2.5 backdrop-blur"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImagesPick}
        />

        {!isRecording && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadBusy}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-transform hover:scale-110 hover:bg-secondary active:scale-95 disabled:opacity-40"
            aria-label="Send photos"
          >
            <ImageIcon />
          </button>
        )}

        <VideoRecorderButton
          onRecorded={handleVideoRecorded}
          onRecordingChange={(r) => setRecordingKind(r ? "video" : null)}
          disabled={uploadBusy || recordingKind === "voice"}
          hidden={recordingKind === "voice"}
        />

        {!isRecording && (
          <>
            <StickerPopover
              onPick={(pick) => void sendSticker(pick)}
              customStickers={customStickers}
              trigger={
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-transform hover:scale-110 hover:bg-secondary active:scale-95"
                  aria-label="Send a sticker"
                >
                  <StickerIcon />
                </button>
              }
            />

            <EmojiPopover
              onPick={(emoji) => {
                setText((t) => t + emoji);
                focusInput();
              }}
              trigger={
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg transition-transform hover:scale-110 hover:bg-secondary"
                  aria-label="Emoji"
                >
                  🙂
                </button>
              }
            />
          </>
        )}

        {!isRecording && (
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              notifyTyping();
            }}
            placeholder="Say something sweet…"
            className="min-w-0 flex-1 rounded-full bg-secondary px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            maxLength={2000}
          />
        )}

        {text.trim() ? (
          <button
            type="submit"
            onMouseDown={(e) => e.preventDefault()}
            disabled={!text.trim() || sending}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-petal transition-transform hover:scale-110 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            aria-label="Send"
          >
            <SendIcon />
          </button>
        ) : (
          <VoiceRecorderButton
            onRecorded={handleVoiceRecorded}
            onRecordingChange={(r) => setRecordingKind(r ? "voice" : null)}
            disabled={uploadBusy || recordingKind === "video"}
            hidden={recordingKind === "video"}
          />
        )}
      </form>

      {lightbox && (
        <ImageLightbox
          items={lightbox.items}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

function Bubble({
  message,
  mine,
  grouped,
  reactions,
  myUserId,
  showTicks,
  highlighted,
  setRef,
  quoted,
  onQuotedClick,
  onDelete,
  onReact,
  onReply,
  onOpenImage,
  onOpenVideo,
}: {
  message: Message;
  mine: boolean;
  grouped: boolean;
  reactions: Reaction[];
  myUserId: string;
  showTicks: boolean;
  highlighted: boolean;
  setRef: (el: HTMLLIElement | null) => void;
  quoted?: QuotedMessage;
  onQuotedClick?: () => void;
  onDelete?: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onOpenImage: (index: number) => void;
  onOpenVideo: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const lastTapRef = useRef(0);
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  function startPress() {
    pressTimer.current = window.setTimeout(() => setShowReactionBar(true), 380);
  }
  function endPress() {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  function handleTap() {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap — react instantly with a heart, Instagram-style.
      onReact("❤️");
      setShowHeartPop(true);
      window.setTimeout(() => setShowHeartPop(false), 900);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    if (isImage || isVideo) return;
    setShowActions((s) => !s);
  }

  const isSticker = message.type === "sticker";
  const isImage = message.type === "image";
  const isVideo = message.type === "video";
  const isSong = message.type === "song";
  const imageUrls = message.media_meta?.urls ?? (message.media_url ? [message.media_url] : []);
  const entranceClass = isSticker ? "sticker-bounce" : mine ? "slide-in-mine" : "slide-in-theirs";

  return (
    <li
      ref={setRef}
      className={`${entranceClass} flex flex-col ${mine ? "items-end" : "items-start"} ${grouped ? "mt-0.5" : "mt-3"} ${
        highlighted ? "rounded-3xl bg-primary/15 transition-colors" : ""
      }`}
    >
      {showReactionBar && (
        <div className="mb-1">
          <ReactionPickerBar
            onPick={(emoji) => {
              onReact(emoji);
              setShowReactionBar(false);
            }}
          />
        </div>
      )}
      <div
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onClick={handleTap}
        className={`group relative max-w-[80%] cursor-pointer select-none text-sm leading-relaxed transition-transform hover:scale-[1.01] ${
          isSticker
            ? ""
            : `rounded-3xl px-4 py-2.5 shadow-soft ${
                mine
                  ? "rounded-br-md bg-bubble-me text-bubble-me-foreground"
                  : "rounded-bl-md border border-border/60 bg-bubble-them text-bubble-them-foreground"
              }`
        }`}
      >
        {showHeartPop && (
          <span className="heart-pop pointer-events-none absolute inset-0 z-10 grid place-items-center text-5xl drop-shadow-lg">
            ❤️
          </span>
        )}
        {quoted && <QuotedPreview quoted={quoted} onClick={onQuotedClick} mine={mine} />}

        {message.type === "text" && (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        )}

        {isImage && imageUrls.length > 0 && (
          <div
            className={`grid gap-1 ${imageUrls.length === 1 ? "grid-cols-1" : "grid-cols-3"} max-w-xs`}
          >
            {imageUrls.map((url, i) => (
              <img
                key={url + i}
                src={url}
                alt=""
                loading="lazy"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenImage(i);
                }}
                className={
                  imageUrls.length === 1
                    ? "max-h-72 w-full rounded-2xl object-cover"
                    : "aspect-square w-full rounded-lg object-cover"
                }
              />
            ))}
          </div>
        )}

        {isVideo && message.media_url && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenVideo();
            }}
            className="relative block max-h-72 w-full max-w-xs overflow-hidden rounded-2xl"
          >
            <video
              src={message.media_url}
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/20">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white/85">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#333">
                  <path d="M6 4l15 8-15 8V4z" />
                </svg>
              </span>
            </span>
            {typeof message.media_meta?.duration_seconds === "number" && (
              <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {message.media_meta.duration_seconds}s
              </span>
            )}
          </button>
        )}

        {message.type === "voice" && message.media_url && (
          <VoicePlayer
            src={message.media_url}
            mine={mine}
            durationSeconds={message.media_meta?.duration_seconds ?? 0}
          />
        )}

        {isSong && message.media_meta?.embed_url && message.media_meta.provider && (
          <SongCard
            provider={message.media_meta.provider}
            embedUrl={message.media_meta.embed_url}
          />
        )}

        {isSticker && message.media_meta?.custom_sticker_url && (
          <img
            src={message.media_meta.custom_sticker_url}
            alt=""
            className="h-28 w-28 rounded-2xl object-cover"
          />
        )}
        {isSticker && !message.media_meta?.custom_sticker_url && message.media_meta?.sticker_id && (
          <StickerArt id={message.media_meta.sticker_id} className="h-28 w-28" />
        )}

        <div
          className={`mt-1 flex flex-wrap items-center gap-1.5 text-[10px] ${
            isSticker
              ? "justify-center text-muted-foreground"
              : mine
                ? "text-bubble-me-foreground/70"
                : "text-muted-foreground"
          }`}
        >
          <span>{time}</span>
          {mine && !isSticker && (
            <MessageTicks deliveredAt={message.delivered_at} seenAt={message.seen_at} />
          )}
          {showActions && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReply();
                }}
                className="rounded-full bg-background/40 px-2 py-0.5 font-semibold hover:bg-background/70"
              >
                reply
              </button>
              {!mine && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReactionBar(true);
                  }}
                  className="rounded-full bg-background/40 px-2 py-0.5 font-semibold hover:bg-background/70"
                >
                  react
                </button>
              )}
              {mine && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="rounded-full bg-background/40 px-2 py-0.5 font-semibold hover:bg-background/70"
                >
                  delete
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {showTicks && mine && (
        <span className="mr-1 mt-0.5 text-[10px] text-muted-foreground">Seen</span>
      )}
      <ReactionBadges
        reactions={reactions}
        myUserId={myUserId}
        onToggle={onReact}
        align={mine ? "end" : "start"}
      />
    </li>
  );
}

function DayDivider({ iso }: { iso: string }) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  let label: string;
  if (sameDay(d.toISOString(), today.toISOString())) label = "Today";
  else if (sameDay(d.toISOString(), yesterday.toISOString())) label = "Yesterday";
  else label = d.toLocaleDateString([], { month: "short", day: "numeric" });
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-border/70" />
      <span className="rounded-full bg-secondary px-3 py-0.5 text-[11px] font-semibold text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border/70" />
    </div>
  );
}

function sameDay(a: string, b: string) {
  const da = new Date(a),
    db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function EmptyState({ name }: { name?: string }) {
  return (
    <div className="mx-auto mt-16 max-w-sm text-center">
      <div className="bloom mb-3 text-6xl">🌻</div>
      <h3 className="font-display text-xl font-semibold text-foreground">
        {name ? `Say hi to ${name}` : "Just waiting on your other half"}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        This little café is empty for now. Send the first message and watch it bloom.
      </p>
    </div>
  );
}

function Avatar({ profile, fallback }: { profile?: Profile; fallback: string }) {
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt=""
        className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/40"
      />
    );
  }
  const letter = profile?.display_name?.[0]?.toUpperCase();
  return (
    <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-sunflower to-sunflower-deep text-lg font-semibold text-primary-foreground ring-2 ring-primary/30">
      {letter ?? fallback}
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12L20 4L14 20L12 13L4 12Z"
        fill="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
        stroke="currentColor"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M21 15l-5-5-5 5M9 20l3-3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StickerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12a8 8 0 1 1 8 8h-3a5 5 0 0 1-5-5v-3z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 20v-4a1 1 0 0 1 1-1h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="10" r="1.2" fill="currentColor" />
      <circle cx="14" cy="9" r="1.2" fill="currentColor" />
    </svg>
  );
}
