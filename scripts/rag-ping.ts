import { embed, generateText } from "ai";
import { buildGameDocument } from "../lib/rag-document";
import {
  EMBEDDING_DIMENSION,
  embeddingProviderOptions,
  GEMMA_4_31B,
  GLM_4_7_FLASH,
  getChatModel,
  getEmbeddingModel,
  INDEX_PURPOSE,
  QUERY_PURPOSE,
} from "../lib/rag-models";

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

const doc = buildGameDocument({
  name: "Hollow Knight",
  released: "2017-02-24",
  genres: ["Action", "Adventure", "Indie", "Platformer"],
  platforms: ["PC", "Nintendo Switch", "PlayStation 4", "Xbox One"],
  tags: ["Singleplayer", "Atmospheric", "Metroidvania", "Souls-like", "2D", "Difficult"],
  developers: ["Team Cherry"],
  publishers: ["Team Cherry"],
  description:
    "Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom of insects and heroes. Explore twisting caverns, battle tainted creatures and befriend bizarre bugs, all in a classic, hand-drawn 2D style.",
});
const query = "atmospheric hand-drawn 2D metroidvania with tough boss fights";

const model = getEmbeddingModel();
const [indexed, retrievalDoc, q, qAsIndex] = await Promise.all([
  embed({ model, value: doc, providerOptions: embeddingProviderOptions(INDEX_PURPOSE) }),
  embed({ model, value: doc, providerOptions: embeddingProviderOptions(QUERY_PURPOSE) }),
  embed({ model, value: query, providerOptions: embeddingProviderOptions(QUERY_PURPOSE) }),
  embed({ model, value: query, providerOptions: embeddingProviderOptions(INDEX_PURPOSE) }),
]);

const report = {
  dimension: { got: indexed.embedding.length, expected: EMBEDDING_DIMENSION },
  tokensForDocument: indexed.usage.tokens,
  purposeCanary: {
    cosine_indexDoc_vs_retrievalDoc: cosine(indexed.embedding, retrievalDoc.embedding),
    cosine_retrievalQuery_vs_indexDoc: cosine(q.embedding, indexed.embedding),
    cosine_indexQuery_vs_indexDoc: cosine(qAsIndex.embedding, indexed.embedding),
    cosine_retrievalQuery_vs_retrievalDoc: cosine(q.embedding, retrievalDoc.embedding),
  },
};
console.log(JSON.stringify(report, null, 2));
if (indexed.embedding.length !== EMBEDDING_DIMENSION) {
  throw new Error("dimension mismatch");
}

for (const m of [GLM_4_7_FLASH, GEMMA_4_31B]) {
  try {
    const started = Date.now();
    const result = await generateText({
      model: getChatModel(m),
      prompt: "Reply with the single word: pong",
      ...(m.surface === "mantle" ? { providerOptions: { openai: { forceReasoning: false } } } : {}),
    });
    console.log(
      m.id,
      "OK",
      JSON.stringify(result.text.trim()),
      `${Date.now() - started}ms`,
      result.usage
    );
  } catch (error) {
    console.log(m.id, "FAILED", error instanceof Error ? error.message.slice(0, 400) : error);
  }
}
