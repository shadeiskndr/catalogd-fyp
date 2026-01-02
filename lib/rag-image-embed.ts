import { AwsV4Signer } from "aws4fetch";
import { EMBEDDING_DIMENSION, EMBEDDING_MODEL_ID } from "@/lib/rag-models";

export type ImageFormat = "jpeg" | "png" | "gif" | "webp";

export function detectImageFormat(bytes: Uint8Array): ImageFormat {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "png";
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "gif";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return "jpeg";
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

export type ImageEmbedResult = { embedding: number[]; inputTokens: number };

export async function bedrockEmbedImage(
  bytes: Uint8Array,
  purpose: string,
  format: ImageFormat = detectImageFormat(bytes)
): Promise<ImageEmbedResult> {
  const region = process.env["AWS_EMBEDDING_REGION"] ?? process.env["AWS_REGION"] ?? "us-east-1";
  const accessKeyId = process.env["AWS_ACCESS_KEY_ID"];
  const secretAccessKey = process.env["AWS_SECRET_ACCESS_KEY"];
  if (accessKeyId === undefined || secretAccessKey === undefined) {
    throw new Error("Missing AWS credentials (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY).");
  }
  const url = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(EMBEDDING_MODEL_ID)}/invoke`;
  const body = JSON.stringify({
    taskType: "SINGLE_EMBEDDING",
    singleEmbeddingParams: {
      embeddingPurpose: purpose,
      embeddingDimension: EMBEDDING_DIMENSION,
      image: { format, source: { bytes: bytesToBase64(bytes) } },
    },
  });
  const sessionToken = process.env["AWS_SESSION_TOKEN"];
  const signer = new AwsV4Signer({
    url,
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    region,
    service: "bedrock",
    accessKeyId,
    secretAccessKey,
    ...(sessionToken === undefined ? {} : { sessionToken }),
  });
  const signed = await signer.sign();
  const response = await fetch(signed.url, { method: "POST", headers: signed.headers, body });
  if (!response.ok) {
    throw new Error(`Bedrock image embed failed: ${response.status} ${await response.text()}`);
  }
  const json = (await response.json()) as {
    embeddings?: Array<{ embedding?: number[] }>;
    embedding?: number[];
  };
  const embedding = json.embeddings?.[0]?.embedding ?? json.embedding;
  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error("Unexpected Nova image embedding response shape.");
  }
  const inputTokens = Number(response.headers.get("x-amzn-bedrock-input-token-count") ?? "0");
  return { embedding, inputTokens: Number.isFinite(inputTokens) ? inputTokens : 0 };
}
