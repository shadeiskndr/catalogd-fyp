import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("warm hot game lists", { hours: 1 }, internal.ingest.warmHotLists, {});
crons.interval("warm genre game lists", { hours: 6 }, internal.ingest.warmGenreLists, {});
crons.interval("refresh genre catalogue", { hours: 12 }, internal.ingest.refreshGenres, {});
crons.interval(
  "backfill referenced games",
  { hours: 24 },
  internal.ingest.backfillReferencedGames,
  {}
);
crons.interval("evict cold optimized images", { hours: 6 }, internal.images.cacheEvict, {});
crons.interval("drain recommender warm queue", { minutes: 30 }, internal.rag.drainWarmQueue, {});
crons.daily(
  "backfill missing game vectors",
  { hourUTC: 4, minuteUTC: 23 },
  internal.rag.backfillMissingVectors,
  {}
);

crons.daily("prune ai-rec threads", { hourUTC: 3, minuteUTC: 17 }, internal.aiRec.pruneThreads, {});

export default crons;
