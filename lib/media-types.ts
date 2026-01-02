export const IMAGE_MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export const VIDEO_MEDIA_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const AUDIO_MEDIA_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/ogg",
  "audio/flac",
  "audio/webm",
] as const;

export const ACCEPTED_MEDIA_TYPES: readonly string[] = [
  ...IMAGE_MEDIA_TYPES,
  ...VIDEO_MEDIA_TYPES,
  ...AUDIO_MEDIA_TYPES,
];

export const ACCEPT_ATTRIBUTE = ACCEPTED_MEDIA_TYPES.join(",");

export const IMAGE_MAX_DIMENSION = 2048;
export const IMAGE_MAX_BYTES = 1024 * 1024;
export const IMAGE_FALLBACK_DIMENSION = 1568;
export const IMAGE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 18 * 1024 * 1024;
export const VIDEO_MAX_SECONDS = 150;
export const AUDIO_MAX_BYTES = 18 * 1024 * 1024;
export const MAX_ATTACHMENTS = 3;

export type MediaModality = "image" | "video" | "audio";

export function mediaModality(mediaType: string): MediaModality | null {
  if ((IMAGE_MEDIA_TYPES as readonly string[]).includes(mediaType)) {
    return "image";
  }
  if ((VIDEO_MEDIA_TYPES as readonly string[]).includes(mediaType)) {
    return "video";
  }
  if ((AUDIO_MEDIA_TYPES as readonly string[]).includes(mediaType)) {
    return "audio";
  }
  return null;
}

export function maxBytesFor(modality: MediaModality): number {
  switch (modality) {
    case "image":
      return IMAGE_UPLOAD_MAX_BYTES;
    case "video":
      return VIDEO_MAX_BYTES;
    case "audio":
      return AUDIO_MAX_BYTES;
    default:
      return IMAGE_UPLOAD_MAX_BYTES;
  }
}
