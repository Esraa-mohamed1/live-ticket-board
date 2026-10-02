export const AGENT_CACHE_KEY = "global";

export function customerCacheKey(userId: string): string {
  return `user:${userId}`;
}
