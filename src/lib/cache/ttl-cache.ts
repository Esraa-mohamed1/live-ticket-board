type Clock = () => number;

interface Entry<V> {
  value: V;
  expiresAt: number;
}

export class TTLCache<K, V> {
  private store = new Map<K, Entry<V>>();
  private readonly ttlMs: number;
  private readonly clock: Clock;

  constructor(ttlMs: number, clock: Clock = Date.now) {
    this.ttlMs = ttlMs;
    this.clock = clock;
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (this.clock() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: K, value: V): void {
    this.store.set(key, { value, expiresAt: this.clock() + this.ttlMs });
  }

  delete(key: K): void {
    this.store.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (String(key).startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}
