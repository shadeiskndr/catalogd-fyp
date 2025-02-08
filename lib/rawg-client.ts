// RAWG API Client with rate limiting
const MAX_REQUESTS_PER_TEN_SECONDS = 30
const REQUEST_TIME_INTERVAL = 10000 // in milliseconds

const RAWG_API_URL = "https://api.rawg.io/api/"
const RAWG_API_KEY = process.env.RAWG_API_KEY

let tokenBucket = MAX_REQUESTS_PER_TEN_SECONDS
const requestBuffer: (() => Promise<Response>)[] = []

/**
 * Rate-limited fetch wrapper for RAWG API
 * Uses token bucket algorithm to respect API rate limits
 */
export async function rawgFetch(endpoint: string): Promise<Response> {
  const handleRequest = async () => {
    const url = `${RAWG_API_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}key=${RAWG_API_KEY}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`RAWG API Error: ${response.statusText}`)
    }

    tokenBucket++
    return response
  }

  // Token bucket algorithm to limit the number of requests to the API
  if (tokenBucket > 0) {
    tokenBucket--
    return handleRequest()
  } else {
    return new Promise((resolve, reject) => {
      // Add the request to the buffer
      requestBuffer.push(handleRequest)

      // Wait for the next time interval to process the requests
      setTimeout(() => {
        const requestsToProcess = Math.min(
          requestBuffer.length,
          MAX_REQUESTS_PER_TEN_SECONDS,
        )
        // Process the requests
        const requests = requestBuffer.splice(0, requestsToProcess)
        Promise.all(requests.map((request) => request()))
          .then((responses) => {
            resolve(responses[0])
          })
          .catch(reject)
          .finally(() => {
            tokenBucket = MAX_REQUESTS_PER_TEN_SECONDS - requestsToProcess
          })
      }, REQUEST_TIME_INTERVAL)
    })
  }
}

// Type definitions
export interface ResponseSchema<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface GameDataType {
  id?: number
  name: string
  slug: string
  games_count: number
  image_background: string
  description: string
}

export interface Screenshot {
  count: number
  next: string | null
  previous: string | null
  results: ScreenshotItem[]
}

export interface ScreenshotItem {
  id: number
  image: string
  width: number
  height: number
  is_deleted: boolean
}
