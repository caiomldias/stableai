const buckets = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, limit: number, now = Date.now()) {
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}
