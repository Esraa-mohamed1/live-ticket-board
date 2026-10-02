export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

type Clock = () => number;

interface Window {
  timestamps: number[];
}

export class SlidingWindowLimiter {
  private readonly store = new Map<string, Window>();
  private readonly max: number;
  private readonly windowMs: number;
  private readonly clock: Clock;

  constructor(max: number, windowMs: number, clock: Clock = Date.now) {
    this.max = max;
    this.windowMs = windowMs;
    this.clock = clock;
  }

  check(key: string): RateLimitResult {
    const now = this.clock();
    const cutoff = now - this.windowMs;

    const window = this.store.get(key) ?? { timestamps: [] };
    window.timestamps = window.timestamps.filter((t) => t > cutoff);

    if (window.timestamps.length >= this.max) {
      const oldest = window.timestamps[0];
      const retryAfter = oldest !== undefined ? oldest + this.windowMs - now : this.windowMs;
      return { allowed: false, remaining: 0, retryAfter };
    }

    window.timestamps.push(now);
    this.store.set(key, window);

    return {
      allowed: true,
      remaining: this.max - window.timestamps.length,
      retryAfter: 0,
    };
  }
}
