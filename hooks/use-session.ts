import { useQuery } from "@tanstack/react-query"
import { getSessionData } from "@/utils/appwrite"

export const sessionKeys = {
  all: ["session"] as const,
  current: () => [...sessionKeys.all, "current"] as const,
}

export function useSession() {
  return useQuery({
    queryKey: sessionKeys.current(),
    queryFn: getSessionData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
