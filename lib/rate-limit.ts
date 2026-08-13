import { prisma } from "@/lib/db";
import { cache } from "@/lib/redis";
import { AppError, Errors } from "@/lib/errors";

export type RateScope = "ip" | "account" | "apikey" | "global";

interface Rule {
  key: string;
  scope: RateScope;
  limit: number;
  windowSec: number;
  burst: number;
  enabled: boolean;
}

const DEFAULT_RULES: Rule[] = [
  { key: "anon.mailbox.create", scope: "ip", limit: 8, windowSec: 60, burst: 2, enabled: true },
  { key: "anon.mailbox.create.hour", scope: "ip", limit: 40, windowSec: 3600, burst: 0, enabled: true },
  { key: "auth.login", scope: "ip", limit: 8, windowSec: 300, burst: 0, enabled: true },
  { key: "auth.register", scope: "ip", limit: 5, windowSec: 3600, burst: 0, enabled: true },
  { key: "api.default", scope: "apikey", limit: 60, windowSec: 60, burst: 10, enabled: true },
  { key: "inbound.webhook", scope: "ip", limit: 300, windowSec: 60, burst: 50, enabled: true },
  { key: "contact.form", scope: "ip", limit: 4, windowSec: 3600, burst: 0, enabled: true },
  { key: "report.abuse", scope: "ip", limit: 8, windowSec: 3600, burst: 0, enabled: true },
];

let ruleCache: Rule[] | null = null;
let ruleCacheAt = 0;

async function loadRules(): Promise<Rule[]> {
  if (ruleCache && Date.now() - ruleCacheAt < 15_000) return ruleCache;
  try {
    const rows = await prisma.rateLimitRule.findMany({ where: { enabled: true } });
    ruleCache =
      rows.length > 0
        ? rows.map((r) => ({
            key: r.key,
            scope: r.scope as RateScope,
            limit: r.limit,
            windowSec: r.windowSec,
            burst: r.burst,
            enabled: r.enabled,
          }))
        : DEFAULT_RULES;
  } catch {
    ruleCache = DEFAULT_RULES;
  }
  ruleCacheAt = Date.now();
  return ruleCache;
}

export async function hitRateLimit(opts: {
  ruleKey: string;
  identifier: string;
  cost?: number;
}): Promise<{ allowed: boolean; remaining: number; resetSec: number; limit: number }> {
  const rules = await loadRules();
  const rule = rules.find((r) => r.key === opts.ruleKey) ?? DEFAULT_RULES.find((r) => r.key === opts.ruleKey);
  if (!rule || !rule.enabled) {
    return { allowed: true, remaining: 999, resetSec: 0, limit: 999 };
  }
  const cost = opts.cost ?? 1;
  const bucket = `rl:${rule.key}:${opts.identifier}`;
  try {
    const count = await cache.incr(bucket, rule.windowSec);
    if (count === cost || count === 1) {
      await cache.expire(bucket, rule.windowSec);
    }
    const limit = rule.limit + rule.burst;
    const allowed = count <= limit;
    return {
      allowed,
      remaining: Math.max(0, limit - count),
      resetSec: rule.windowSec,
      limit,
    };
  } catch {
    return { allowed: true, remaining: rule.limit, resetSec: rule.windowSec, limit: rule.limit };
  }
}

export async function assertRateLimit(ruleKey: string, identifier: string) {
  const result = await hitRateLimit({ ruleKey, identifier });
  if (!result.allowed) {
    throw Errors.rateLimited(result.resetSec);
  }
  return result;
}

export function rateLimitHeaders(result: { remaining: number; resetSec: number; limit: number }) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetSec),
  };
}

export function isRateLimitError(err: unknown): err is AppError {
  return err instanceof AppError && err.code === "RATE_LIMITED";
}
