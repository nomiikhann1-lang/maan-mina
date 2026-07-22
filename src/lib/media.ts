import { supabase } from "@/integrations/supabase/client";

function randomId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export async function uploadChatMedia(
  file: Blob,
  userId: string,
  extension: string,
): Promise<string> {
  const path = `${userId}/${randomId()}.${extension}`;
  const { error } = await supabase.storage.from("chat-media").upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("chat-media").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(file: Blob, userId: string, extension: string): Promise<string> {
  const path = `${userId}/avatar-${randomId()}.${extension}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadCustomSticker(
  file: Blob,
  userId: string,
  extension: string,
): Promise<string> {
  const path = `${userId}/${randomId()}.${extension}`;
  const { error } = await supabase.storage.from("custom-stickers").upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("custom-stickers").getPublicUrl(path);
  return data.publicUrl;
}

export function extensionForMime(mime: string, fallback: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "video/webm": "webm",
    "video/mp4": "mp4",
  };
  return map[mime] ?? fallback;
}

/**
 * Downscales + re-encodes an image on the device before upload. GIFs are
 * passed through untouched (canvas re-encoding would flatten the
 * animation). Everything else is capped to `maxDimension` on its longest
 * edge and re-encoded as JPEG at `quality`.
 */
export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.82,
): Promise<Blob> {
  if (file.type === "image/gif") return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob || blob.size >= file.size) return file;
  return blob;
}
