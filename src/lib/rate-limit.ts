/**
 * In-memory sliding-window rate limiter.
 *
 * Works per serverless instance. On Vercel this means protection is per-instance
 * rather than globally coordinated, but still meaningful for small-traffic apps.
 */

/** Map from rate-limit key → sorted list of request timestamps (ms since epoch). */
const store = new Map<string, number[]>();

export interface RateLimitResult {
  limited: boolean;
  /** Seconds until the oldest request falls out of the window. */
  retryAfterSeconds?: number;
}

/**
 * Check (and record) a request against a rate limit.
 *
 * @param key           Unique key, e.g. "send-otp:phone:+919876543210"
 * @param maxRequests   Maximum allowed requests within the window.
 * @param windowSeconds Sliding window duration in seconds.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1_000;

  const timestamps = store.get(key) ?? [];
  const recent = timestamps.filter((t) => t > windowStart);

  if (recent.length >= maxRequests) {
    const retryAfterMs = recent[0] + windowSeconds * 1_000 - now;
    return { limited: true, retryAfterSeconds: Math.ceil(retryAfterMs / 1_000) };
  }

  recent.push(now);
  store.set(key, recent);
  return { limited: false };
}
