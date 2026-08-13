import { prisma } from "@/lib/db";
import { cache } from "@/lib/redis";
import { parseBool } from "@/lib/utils";

const CACHE_KEY = "settings:all";
const CACHE_TTL = 15;

type SettingMap = Record<string, string>;

let memorySnapshot: SettingMap | null = null;

export async function getSettings(): Promise<SettingMap> {
  const cached = await cache.get(CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached) as SettingMap;
    } catch {
      /* fall through */
    }
  }
  if (memorySnapshot) return memorySnapshot;
  try {
    const rows = await prisma.systemSetting.findMany();
    const map: SettingMap = {};
    for (const row of rows) map[row.key] = row.value;
    memorySnapshot = map;
    await cache.set(CACHE_KEY, JSON.stringify(map), CACHE_TTL);
    return map;
  } catch {
    return memorySnapshot ?? {};
  }
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const all = await getSettings();
  return all[key] ?? fallback;
}

export async function getSettingNumber(key: string, fallback: number): Promise<number> {
  const raw = await getSetting(key, String(fallback));
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export async function getSettingBool(key: string, fallback = false): Promise<boolean> {
  const raw = await getSetting(key);
  if (!raw) return fallback;
  return parseBool(raw, fallback);
}

export async function setSetting(key: string, value: string, group = "general", type = "string") {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value, group, type },
    create: { key, value, group, type },
  });
  memorySnapshot = null;
  await cache.del(CACHE_KEY);
}

export async function setSettings(entries: { key: string; value: string; group?: string; type?: string }[]) {
  for (const e of entries) {
    await prisma.systemSetting.upsert({
      where: { key: e.key },
      update: { value: e.value, group: e.group ?? "general", type: e.type ?? "string" },
      create: { key: e.key, value: e.value, group: e.group ?? "general", type: e.type ?? "string" },
    });
  }
  memorySnapshot = null;
  await cache.del(CACHE_KEY);
}

export const SettingKeys = {
  mailboxDefaultTtl: "mailbox.default_ttl_minutes",
  mailboxPremiumTtl: "mailbox.premium_ttl_minutes",
  mailboxMaxExtension: "mailbox.max_extension_minutes",
  mailboxExpiringSoon: "mailbox.expiring_soon_minutes",
  messageRetentionFree: "message.retention_minutes_free",
  messageRetentionPremium: "message.retention_minutes_premium",
  attachmentRetention: "attachment.retention_minutes",
  brandName: "brand.name",
  brandTagline: "brand.tagline",
  maintenanceMode: "maintenance.enabled",
  registrationEnabled: "feature.registration",
  defaultLocale: "i18n.default_locale",
  defaultCurrency: "billing.default_currency",
  maxAttachmentBytes: "mailbox.max_attachment_bytes",
  maxMessageBytes: "mailbox.max_message_bytes",
  usernameMin: "mailbox.username_min",
  usernameMax: "mailbox.username_max",
  adsEnabled: "ads.enabled",
  referralRewardCents: "referral.reward_cents",
  referralCap: "referral.max_rewards_per_user",
} as const;
