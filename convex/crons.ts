import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

crons.interval(
  "purge expired RAWG cache",
  { hours: 24 },
  internal.rawg.purgeExpired,
  {},
)

export default crons
