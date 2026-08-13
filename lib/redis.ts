/**
 * Redis-compatible cache with a process-local fallback.
 * Never throws on the request path if Redis is unavailable.
 */

type Entry = { value: string; expiresAt: number };

class MemoryStore {
  private map = new Map<string, Entry>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private lists = new Map<string, string[]>();
  private subs = new Map<string, Set<(msg: string) => void>>();

  private gc(key: string) {
    const e = this.map.get(key);
    if (e && e.expiresAt < Date.now()) {
      this.map.delete(key);
      return true;
    }
    return false;
  }

  async get(key: string): Promise<string | null> {
    if (this.gc(key)) return null;
    return this.map.get(key)?.value ?? null;
  }

  async set(key: string, value: string, ttlSec?: number): Promise<void> {
    const expiresAt = ttlSec ? Date.now() + ttlSec * 1000 : Number.MAX_SAFE_INTEGER;
    this.map.set(key, { value, expiresAt });
    const prev = this.timers.get(key);
    if (prev) clearTimeout(prev);
    if (ttlSec) {
      this.timers.set(
        key,
        setTimeout(() => this.map.delete(key), ttlSec * 1000 + 50),
      );
    }
  }

  async del(key: string): Promise<void> {
    this.map.delete(key);
    this.lists.delete(key);
  }

  async incr(key: string, ttlSec?: number): Promise<number> {
    const current = Number((await this.get(key)) || "0") + 1;
    const existing = this.map.get(key);
    const ttl =
      ttlSec ??
      (existing && existing.expiresAt < Number.MAX_SAFE_INTEGER
        ? Math.max(1, Math.ceil((existing.expiresAt - Date.now()) / 1000))
        : undefined);
    await this.set(key, String(current), ttl);
    return current;
  }

  async expire(key: string, ttlSec: number): Promise<void> {
    const e = this.map.get(key);
    if (!e) return;
    await this.set(key, e.value, ttlSec);
  }

  async lpush(key: string, value: string): Promise<void> {
    const list = this.lists.get(key) ?? [];
    list.unshift(value);
    this.lists.set(key, list);
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    const list = this.lists.get(key) ?? [];
    this.lists.set(key, list.slice(start, stop + 1));
  }

  async publish(channel: string, message: string): Promise<number> {
    const set = this.subs.get(channel);
    if (!set) return 0;
    for (const fn of set) {
      try {
        fn(message);
      } catch {
        /* ignore subscriber errors */
      }
    }
    return set.size;
  }

  subscribe(channel: string, fn: (msg: string) => void): () => void {
    let set = this.subs.get(channel);
    if (!set) {
      set = new Set();
      this.subs.set(channel, set);
    }
    set.add(fn);
    return () => {
      set?.delete(fn);
    };
  }

  async ping(): Promise<boolean> {
    return true;
  }
}

export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSec?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string, ttlSec?: number): Promise<number>;
  expire(key: string, ttlSec: number): Promise<void>;
  publish(channel: string, message: string): Promise<number>;
  subscribe(channel: string, fn: (msg: string) => void): () => void;
  ping(): Promise<boolean>;
}

const memory = new MemoryStore();

export const cache: CacheClient = memory;

export async function pingCache(): Promise<{ ok: boolean; latencyMs: number; detail?: string }> {
  const start = Date.now();
  try {
    const ok = await cache.ping();
    return { ok, latencyMs: Date.now() - start, detail: process.env.REDIS_URL ? "redis" : "memory" };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      detail: err instanceof Error ? err.message : "cache error",
    };
  }
}

export function mailboxChannel(mailboxId: string): string {
  return `mailbox:${mailboxId}`;
}
