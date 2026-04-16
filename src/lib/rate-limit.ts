/**
 * Simple in-memory rate limiter using a Map.
 * Tracks requests by a composite key (e.g. "login:<ip>") with configurable
 * window sizes and max attempts. Good enough for single-process deployments;
 * swap for Redis when you need cross-instance coordination.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically prune expired entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000);

/**
 * Check (and consume) a rate limit token.
 *
 * @param key     - Unique key, e.g. `"login:1.2.3.4"`
 * @param limit   - Max attempts allowed in the window
 * @param windowS - Window length in seconds
 */
function check(key: string, limit: number, windowS: number): RateLimitResult {
  const now = Date.now();
  const windowMs = windowS * 1000;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  entry.count++;

  if (entry.count > limit) {
    return { success: false, remaining: 0, reset: entry.resetAt };
  }

  return { success: true, remaining: limit - entry.count, reset: entry.resetAt };
}

export const rateLimiter = { check };
