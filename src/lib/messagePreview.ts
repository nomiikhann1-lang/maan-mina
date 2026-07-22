type PreviewableMessage = {
  type: "text" | "image" | "voice" | "video" | "sticker" | "song";
  content: string;
  media_meta: { urls?: string[]; sticker_id?: string } | null;
};

export function previewForMessage(m: PreviewableMessage): string {
  switch (m.type) {
    case "image": {
      const count = m.media_meta?.urls?.length ?? 1;
      return count > 1 ? `📷 ${count} photos` : "📷 Photo";
    }
    case "voice":
      return "🎤 Voice note";
    case "video":
      return "🎥 Video note";
    case "sticker":
      return "✨ Sticker";
    case "song":
      return "🎵 Song";
    default:
      return m.content;
  }
}
