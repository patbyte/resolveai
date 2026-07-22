type Bucket = { count: number; resetsAt: number };

const WINDOW_MS = 60_000;
const REQUEST_LIMIT = 12;
const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
  const current = buckets.get(key);
  const bucket = !current || current.resetsAt <= now
    ? { count: 0, resetsAt: now + WINDOW_MS }
    : current;

  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    allowed: bucket.count <= REQUEST_LIMIT,
    remaining: Math.max(0, REQUEST_LIMIT - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetsAt - now) / 1_000))
  };
}

export function resetRateLimitsForTests() {
  buckets.clear();
}
