import { prisma } from "@/lib/db";
import { cache } from "@/lib/redis";

const KEY = "flags:all";

export async function getFlags(): Promise<Record<string, boolean>> {
  const cached = await cache.get(KEY);
  if (cached) {
    try {
      return JSON.parse(cached) as Record<string, boolean>;
    } catch {
      /* ignore */
    }
  }
  try {
    const rows = await prisma.featureFlag.findMany();
    const map: Record<string, boolean> = {};
    for (const r of rows) map[r.key] = r.enabled;
    await cache.set(KEY, JSON.stringify(map), 15);
    return map;
  } catch {
    return {};
  }
}

export async function isEnabled(key: string, fallback = true): Promise<boolean> {
  const flags = await getFlags();
  return flags[key] ?? fallback;
}

export async function setFlag(key: string, enabled: boolean, description?: string) {
  await prisma.featureFlag.upsert({
    where: { key },
    update: { enabled, description },
    create: { key, enabled, description },
  });
  await cache.del(KEY);
}
