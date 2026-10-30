// Tiny in-memory limiter: protects the shared free-tier quota from one user.
const hits = new Map<string, number[]>();

export function checkRateLimit(userId: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(userId, recent);
    return { ok: false as const, retryAfterSeconds: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  hits.set(userId, recent);
  if (hits.size > 500) {
    for (const [id, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(id);
  }
  return { ok: true as const };
}