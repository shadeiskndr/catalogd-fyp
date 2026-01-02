import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createBedrockMantle } from "@ai-sdk/amazon-bedrock/mantle";

export const EMBEDDING_MODEL_ID = "amazon.nova-2-multimodal-embeddings-v1:0";
export const EMBEDDING_DIMENSION = 1024;
export const INDEX_PURPOSE = "GENERIC_INDEX";
export const QUERY_PURPOSE = "GENERIC_RETRIEVAL";
export const IMAGE_QUERY_PURPOSE = "IMAGE_RETRIEVAL";
export const TEMPLATE_VERSION = 1;

export type RagModel = {
  id: string;
  name: string;
  surface: "converse" | "mantle";
  api: "chat" | "responses";
  contextTokens: number;
  pricing: { inputPer1M: number; outputPer1M: number };
  supportsTools: boolean;
  supportsReasoning: boolean;
  supportsImage: boolean;
  supportsVideo: boolean;
  supportsAudio: boolean;
};

export const GLM_4_7_FLASH: RagModel = {
  id: "zai.glm-4.7-flash",
  name: "GLM 4.7 Flash",
  surface: "converse",
  api: "chat",
  contextTokens: 203_000,
  pricing: { inputPer1M: 0.07, outputPer1M: 0.4 },
  supportsTools: true,
  supportsReasoning: false,
  supportsImage: false,
  supportsVideo: false,
  supportsAudio: false,
};

export const GEMMA_4_31B: RagModel = {
  id: "google.gemma-4-31b",
  name: "Gemma 4 31B",
  surface: "mantle",
  api: "responses",
  contextTokens: 262_144,
  pricing: { inputPer1M: 0.14, outputPer1M: 0.4 },
  supportsTools: true,
  supportsReasoning: true,
  supportsImage: true,
  supportsVideo: true,
  supportsAudio: false,
};

export const GEMMA_4_E2B: RagModel = {
  id: "google.gemma-4-e2b",
  name: "Gemma 4 E2B",
  surface: "mantle",
  api: "responses",
  contextTokens: 131_072,
  pricing: { inputPer1M: 0.04, outputPer1M: 0.08 },
  supportsTools: true,
  supportsReasoning: true,
  supportsImage: true,
  supportsVideo: false,
  supportsAudio: true,
};

export const RUNTIME_MODEL: RagModel = GLM_4_7_FLASH;
export const IMAGE_DESCRIBERS: readonly RagModel[] = [GEMMA_4_31B];
export const VIDEO_DESCRIBERS: readonly RagModel[] = [GEMMA_4_31B];
export const AUDIO_DESCRIBERS: readonly RagModel[] = [GEMMA_4_E2B];

function region(): string {
  return process.env["AWS_REGION"] ?? "us-east-1";
}

export function getEmbeddingModel() {
  const embeddingRegion = process.env["AWS_EMBEDDING_REGION"] ?? region();
  return createAmazonBedrock({ region: embeddingRegion }).embeddingModel(EMBEDDING_MODEL_ID);
}

export function getChatModel(model: RagModel) {
  if (model.surface === "converse") {
    return createAmazonBedrock({ region: region() })(model.id);
  }
  const mantle = createBedrockMantle({
    region: region(),
    baseURL: `https://bedrock-mantle.${region()}.api.aws/openai/v1`,
  });
  return model.api === "chat" ? mantle.chat(model.id) : mantle.responses(model.id);
}

export function embeddingProviderOptions(purpose: string) {
  return { bedrock: { embeddingPurpose: purpose, embeddingDimension: EMBEDDING_DIMENSION } };
}

export function tokenCostUsd(tokens: number, per1M: number): number {
  return (tokens * per1M) / 1_000_000;
}
