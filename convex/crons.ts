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

export default crons;
