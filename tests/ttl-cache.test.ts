import { describe, it, expect } from "vitest";
import { TTLCache } from "@/lib/cache/ttl-cache";

describe("TTLCache", () => {
  it("stores and retrieves a value before TTL expires", () => {
    let now = 1000;
    const cache = new TTLCache<string, string>(500, () => now);

    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");

    now += 400;
    expect(cache.get("key1")).toBe("value1");
  });

  it("expires entries on read when clock exceeds TTL", () => {
    let now = 1000;
    const cache = new TTLCache<string, number>(500, () => now);

    cache.set("stat-a", 42);
    expect(cache.get("stat-a")).toBe(42);

    now += 501;
    expect(cache.get("stat-a")).toBeUndefined();
  });

  it("deletes a specific key", () => {
    const cache = new TTLCache<string, string>(10_000);
    cache.set("key-to-delete", "val");
    expect(cache.get("key-to-delete")).toBe("val");

    cache.delete("key-to-delete");
    expect(cache.get("key-to-delete")).toBeUndefined();
  });

  it("invalidates all entries matching a prefix with deleteByPrefix", () => {
    const cache = new TTLCache<string, string>(10_000);
    cache.set("user:123:stats", "data-1");
    cache.set("user:123:tickets", "data-2");
    cache.set("user:456:stats", "data-3");
    cache.set("global", "all-stats");

    cache.deleteByPrefix("user:123");

    expect(cache.get("user:123:stats")).toBeUndefined();
    expect(cache.get("user:123:tickets")).toBeUndefined();
    expect(cache.get("user:456:stats")).toBe("data-3");
    expect(cache.get("global")).toBe("all-stats");
  });
});
