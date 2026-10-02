import { describe, it, expect } from "vitest";
import { SlidingWindowLimiter } from "@/lib/rate-limit/sliding-window";

describe("SlidingWindowLimiter", () => {
  it("allows requests up to the max limit", () => {
    let now = 10_000;
    const limiter = new SlidingWindowLimiter(3, 1000, () => now);

    const r1 = limiter.check("user-1");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    now += 100;
    const r2 = limiter.check("user-1");
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    now += 100;
    const r3 = limiter.check("user-1");
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests once max limit is reached and calculates retryAfter", () => {
    let now = 10_000;
    const limiter = new SlidingWindowLimiter(2, 1000, () => now);

    limiter.check("user-1"); // at 10_000

    now = 10_200;
    limiter.check("user-1"); // at 10_200

    now = 10_300;
    const blocked = limiter.check("user-1");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    // Oldest is at 10_000, window is 1000. It expires at 11_000. Current is 10_300 => retryAfter = 700
    expect(blocked.retryAfter).toBe(700);
  });

  it("resets capacity when timestamps age out of the sliding window", () => {
    let now = 10_000;
    const limiter = new SlidingWindowLimiter(2, 1000, () => now);

    limiter.check("user-1"); // 10_000
    limiter.check("user-1"); // 10_000

    expect(limiter.check("user-1").allowed).toBe(false);

    // Advance beyond window
    now += 1001;
    const resAfterWindow = limiter.check("user-1");
    expect(resAfterWindow.allowed).toBe(true);
    expect(resAfterWindow.remaining).toBe(1);
  });

  it("isolates rate limits by user key", () => {
    const now = 10_000;
    const limiter = new SlidingWindowLimiter(1, 1000, () => now);

    const u1First = limiter.check("user-1");
    expect(u1First.allowed).toBe(true);

    const u1Second = limiter.check("user-1");
    expect(u1Second.allowed).toBe(false);

    const u2First = limiter.check("user-2");
    expect(u2First.allowed).toBe(true);
  });
});
