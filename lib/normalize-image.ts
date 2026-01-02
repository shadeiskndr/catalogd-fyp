import { IMAGE_FALLBACK_DIMENSION, IMAGE_MAX_BYTES, IMAGE_MAX_DIMENSION } from "@/lib/media-types";

const JPEG_QUALITY_FIRST = 0.85;
const JPEG_QUALITY_SECOND = 0.75;
const ALPHA_SAMPLE_SIZE = 64;

function loadBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

function hasAlpha(bitmap: ImageBitmap): boolean {
  const canvas = document.createElement("canvas");
  canvas.width = ALPHA_SAMPLE_SIZE;
  canvas.height = ALPHA_SAMPLE_SIZE;
  const context = canvas.getContext("2d");
  if (context === null) {
    return false;
  }
  context.drawImage(bitmap, 0, 0, ALPHA_SAMPLE_SIZE, ALPHA_SAMPLE_SIZE);
  const { data } = context.getImageData(0, 0, ALPHA_SAMPLE_SIZE, ALPHA_SAMPLE_SIZE);
  for (let index = 3; index < data.length; index += 4) {
    if ((data[index] ?? 255) < 255) {
      return true;
    }
  }
  return false;
}

function encode(
  bitmap: ImageBitmap,
  maxDimension: number,
  type: "image/jpeg" | "image/png",
  quality: number
): Promise<Blob | null> {
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (context === null) {
    return Promise.resolve(null);
  }
  if (type === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

function renamed(file: File, blob: Blob, extension: string): File {
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.${extension}`, { type: blob.type });
}

export async function normalizeImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await loadBitmap(file);
  } catch {
    return file;
  }
  const oversized = Math.max(bitmap.width, bitmap.height) > IMAGE_MAX_DIMENSION;
  if (!oversized && file.size <= IMAGE_MAX_BYTES) {
    bitmap.close();
    return file;
  }
  const alpha = file.type === "image/png" || file.type === "image/webp" ? hasAlpha(bitmap) : false;
  if (alpha) {
    const png = await encode(bitmap, IMAGE_MAX_DIMENSION, "image/png", 1);
    if (png !== null && png.size <= IMAGE_MAX_BYTES) {
      bitmap.close();
      return renamed(file, png, "png");
    }
  }
  const attempts: Array<[number, number]> = [
    [IMAGE_MAX_DIMENSION, JPEG_QUALITY_FIRST],
    [IMAGE_FALLBACK_DIMENSION, JPEG_QUALITY_SECOND],
  ];
  let last: Blob | null = null;
  for (const [dimension, quality] of attempts) {
    // react-doctor-disable-next-line react-doctor/async-await-in-loop
    const jpeg = await encode(bitmap, dimension, "image/jpeg", quality);
    if (jpeg === null) {
      continue;
    }
    last = jpeg;
    if (jpeg.size <= IMAGE_MAX_BYTES) {
      break;
    }
  }
  bitmap.close();
  return last === null ? file : renamed(file, last, "jpg");
}
