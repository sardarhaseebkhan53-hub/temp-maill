import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { nowPlusMinutes } from "@/lib/utils";
import { randomToken } from "@/lib/crypto";
import { detectOtpCode } from "@/lib/otp";
import { getEnv } from "@/config/env";
import { getSettingNumber } from "@/lib/settings";
import { getSmsProvider, normalizeE164, type SmsInbound } from "@/server/providers/sms";
import type { SessionUser } from "@/types";

/**
 * Number lifecycle (per spec, enforced server-side):
 *
 *   AVAILABLE ──assign──▶ ASSIGNED ──cron/user expiry──▶ EXPIRED
 *                ▲            │                            │
 *                │            └── user "Expire" ──▶ RELEASING
 *   quarantine   │                    ▲                    │
 *   graduates    └────────── QUARANTINED ◀── provider release ┘
 *
 * EXPIRED is a brief marker, never a resting state: every path out of an
 * assignment funnels through releaseNumber(), so a used number always lands
 * in QUARANTINED before it can re-enter the pool.
 *
 * A number is never handed to a second visitor until its quarantine window
 * (default 24h, admin-configurable) has elapsed; that is what stops a new
 * user from receiving the previous renter's SMS.
 */
type SmsNumberRow = any;

export interface PublicSmsNumber {
  id: string;
  e164: string;
  country: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  /** Bearer token: shown once to the assigning client; required for reads. */
  publicToken?: string;
}

function toPublicNumber(row: SmsNumberRow, { includeToken = false } = {}): PublicSmsNumber {
  return {
    id: row.id,
    e164: row.e164,
    country: row.country,
    status: row.status,
    expiresAt: row.expiresAt instanceof Date ? row.expiresAt.toISOString() : String(row.expiresAt),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    ...(includeToken ? { publicToken: row.publicToken } : {}),
  };
}

async function blockingNumbers(): Promise<Set<string>> {
  const now = new Date();
  const rows = await prisma.smsNumber.findMany({
    where: {
      OR: [
        { status: "ASSIGNED", expiresAt: { gt: now } },
        { status: "RELEASING" },
        { status: "BLOCKED" },
        { status: "QUARANTINED", quarantineUntil: { gt: now } },
      ],
    },
    select: { e164: true },
  });
  return new Set(rows.map((r: Record<string, unknown>) => String(r.e164)));
}

/** Real numbers the configured provider can provision, minus anything Haven
 *  currently has assigned, blocked, or in quarantine. */
export async function listAvailableNumbers(country?: string) {
  const provider = getSmsProvider();
  const blocked = await blockingNumbers();
  const available = await provider.listAvailable(country ? country.toUpperCase() : undefined);
  return available.filter((n) => !blocked.has(n.e164));
}

/** Countries that can actually be served by the configured provider right now. */
export async function listSupportedCountries(): Promise<string[]> {
  const available = await listAvailableNumbers();
  return [...new Set(available.map((n) => n.country))].sort();
}

export async function provisionNumber(opts: {
  user?: SessionUser | null;
  guestKey?: string;
  country?: string;
  e164?: string;
}) {
  const requestedCountry = opts.country?.toUpperCase();
  const available = await listAvailableNumbers(requestedCountry);
  const pick = opts.e164
    ? available.find((n) => n.e164 === normalizeE164(opts.e164))
    : available.filter((n) => !requestedCountry || n.country === requestedCountry)[0];

  if (!pick) {
    throw Errors.notFound(
      requestedCountry
        ? `No temporary numbers are currently available for ${requestedCountry}.`
        : "No temporary numbers are currently available.",
    );
  }

  const providerRow =
    (await prisma.smsProvider.findFirst({ where: { enabled: true } })) ||
    (await prisma.smsProvider.findFirst());
  if (!providerRow) throw Errors.providerDown("SMS");

  const service = await prisma.service.findUnique({ where: { key: "temp_sms" } });
  if (!service) throw Errors.internal();

  const ttl = await getSettingNumber(
    "sms.default_ttl_minutes",
    getEnv().SMS_NUMBER_TTL_MINUTES,
  );
  const now = new Date();
  const expiresAt = nowPlusMinutes(ttl);

  const adapter = getSmsProvider(providerRow.adapter || getEnv().SMS_PROVIDER);
  const { providerNumberId } = await adapter.provision(pick.e164);

  const instance = await prisma.serviceInstance.create({
    data: {
      serviceId: service.id,
      userId: opts.user?.id,
      guestKey: opts.guestKey,
      status: "ACTIVE",
      expiresAt,
      metadata: JSON.stringify({ e164: pick.e164 }),
    },
  });

  const number = await prisma.smsNumber.create({
    data: {
      serviceInstanceId: instance.id,
      providerId: providerRow.id,
      e164: pick.e164,
      country: pick.country,
      userId: opts.user?.id,
      guestKey: opts.guestKey,
      publicToken: randomToken(24),
      providerNumberId: providerNumberId ?? null,
      status: "ASSIGNED",
      assignedAt: now,
      lastActivityAt: now,
      expiresAt,
    },
  });

  return toPublicNumber(number, { includeToken: true });
}

export async function getSmsNumber(id: string): Promise<SmsNumberRow> {
  const row = await prisma.smsNumber.findUnique({ where: { id }, include: { provider: true } });
  if (!row) throw Errors.notFound("Number");
  return row;
}

/** Token bearer or owning session — anything else is forbidden. */
export function assertSmsNumberAccess(
  number: SmsNumberRow,
  actor: { userId?: string | null; token?: string | null },
): void {
  if (actor.userId && number.userId && actor.userId === number.userId) return;
  if (actor.token && number.publicToken && actor.token === number.publicToken) return;
  throw Errors.forbidden();
}

function isLive(number: SmsNumberRow): boolean {
  return number.status === "ASSIGNED" && new Date(number.expiresAt) > new Date();
}

export async function listSmsMessages(numberId: string) {
  return prisma.smsMessage.findMany({
    where: { numberId },
    orderBy: { receivedAt: "desc" },
    take: 100,
  });
}

export async function extendSmsNumber(id: string, minutes: number) {
  const number = await getSmsNumber(id);
  if (!isLive(number)) throw Errors.mailboxExpired();
  const clamped = Math.min(Math.max(1, Math.floor(minutes)), 60);
  const updated = await prisma.smsNumber.update({
    where: { id },
    data: {
      expiresAt: nowPlusMinutes(clamped),
      lastActivityAt: new Date(),
    },
  });
  await prisma.serviceInstance
    .update({ where: { id: number.serviceInstanceId }, data: { expiresAt: nowPlusMinutes(clamped) } })
    .catch(() => null);
  return updated;
}

/**
 * Release a live assignment: RELEASING → provider release → QUARANTINED.
 * The number stays unavailable until `quarantineUntil` passes.
 */
export async function releaseNumber(id: string) {
  const number = await getSmsNumber(id);
  // Only states that hold (or held) a live assignment need provider release +
  // quarantine. Terminal/pool states are returned untouched — but EXPIRED must
  // fall through, or a naturally-expired number would skip quarantine and get
  // recycled with the previous renter's traffic still arriving.
  if (number.status !== "ASSIGNED" && number.status !== "EXPIRED" && number.status !== "RELEASING") {
    return number;
  }

  await prisma.smsNumber.update({ where: { id }, data: { status: "RELEASING" } });

  const providerKey = number.provider?.adapter;
  try {
    await getSmsProvider(providerKey).release(number.e164, number.providerNumberId ?? undefined);
  } catch {
    // Provider release failure must not trap the number forever — quarantine it.
  }

  const quarantineMinutes = await getSettingNumber("sms.quarantine_minutes", 24 * 60);
  const now = new Date();
  const updated = await prisma.smsNumber.update({
    where: { id },
    data: {
      status: "QUARANTINED",
      releasedAt: now,
      quarantineUntil: new Date(now.getTime() + quarantineMinutes * 60_000),
    },
  });
  await prisma.serviceInstance
    .update({ where: { id: number.serviceInstanceId }, data: { status: "EXPIRED" } })
    .catch(() => null);
  return updated;
}

/** Cron: expire live assignments and graduate quarantined numbers. */
export async function sweepSmsNumbers(): Promise<{ expired: number; available: number }> {
  const now = new Date();

  const expiredRows = await prisma.smsNumber.findMany({
    where: { status: "ASSIGNED", expiresAt: { lte: now } },
    select: { id: true, serviceInstanceId: true },
    take: 200,
  });
  for (const row of expiredRows) {
    // Stamp EXPIRED first so the transition is auditable, then run the single
    // release path: provider release → QUARANTINED → graduate when the window
    // elapses. ServiceInstance is marked EXPIRED inside releaseNumber().
    await prisma.smsNumber.update({
      where: { id: row.id },
      data: { status: "EXPIRED" },
    });
    await releaseNumber(row.id);
  }

  const graduated = await prisma.smsNumber.updateMany({
    where: { status: "QUARANTINED", quarantineUntil: { lte: now } },
    data: { status: "AVAILABLE" },
  });

  return { expired: expiredRows.length, available: graduated.count };
}

export async function ingestSms(msg: SmsInbound) {
  const to = normalizeE164(msg.to);
  if (!to) throw Errors.validation("Webhook recipient is not a valid E.164 number.");

  const number = await prisma.smsNumber.findFirst({
    where: { e164: to },
    orderBy: { createdAt: "desc" },
  });
  if (!number) throw Errors.notFound("Number");
  if (number.status !== "ASSIGNED" || new Date(number.expiresAt) <= new Date()) {
    // Expired/quarantined numbers silently refuse new traffic — an old
    // renter's SMS must never reach a new inbox.
    throw Errors.mailboxExpired();
  }

  // Webhook de-duplication is scoped to the number assignment (spec: unique
  // phoneNumberId+providerMessageId) — the same carrier retry is dropped, but
  // two different rentals of one e164 never share a key.
  const idempotencyKey = `${msg.idempotencyKey}:${number.id}`;
  const existing = await prisma.smsMessage.findUnique({
    where: { idempotencyKey },
  });
  if (existing) return existing;

  const body = msg.body.slice(0, 2000);
  const stored = await prisma.smsMessage.create({
    data: {
      numberId: number.id,
      fromNumber: msg.from.slice(0, 32),
      body,
      providerMessageId: msg.providerMessageId ?? null,
      detectedCode: detectOtpCode(body),
      idempotencyKey,
      receivedAt: msg.receivedAt,
    },
  });
  await prisma.smsNumber.update({
    where: { id: number.id },
    data: { lastActivityAt: new Date() },
  });
  return stored;
}
