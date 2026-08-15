import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { randomToken, sha256Hex } from "@/lib/crypto";
import { randomLocalPart, validateLocalPart } from "@/lib/username";
import { getSettingNumber, SettingKeys } from "@/lib/settings";
import { getEnv } from "@/config/env";
import { nowPlusMinutes } from "@/lib/utils";
import { getPlanLimits, limitBool, limitNumber } from "@/server/services/plans";
import type { MailboxState, PlanKey, PublicMailbox, SessionUser } from "@/types";
import {
  deliveryReadinessForDomain,
  isDomainAssignable,
} from "@/server/services/email-delivery";

const EXPIRING_DEFAULT = 5;

export async function listAssignableDomains(planKey: PlanKey) {
  const eligibility =
    planKey === "BUSINESS"
      ? ["FREE", "PREMIUM_ONLY", "BUSINESS_ONLY"]
      : planKey === "PRO" || planKey === "DEVELOPER"
        ? ["FREE", "PREMIUM_ONLY"]
        : ["FREE"];
  const domains = await prisma.emailDomain.findMany({
    where: { status: "ACTIVE", eligibility: { in: eligibility } },
    orderBy: { weight: "desc" },
  });
  return domains.filter(isDomainAssignable);
}

function pickWeighted<T extends { weight: number }>(items: T[]): T { // items may be Row[]
  const total = items.reduce((s, i) => s + Math.max(1, i.weight), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= Math.max(1, item.weight);
    if (r <= 0) return item;
  }
  return items[items.length - 1] as T;
}

export async function resolveState(expiresAt: Date, current: MailboxState): Promise<MailboxState> {
  if (current === "PURGED") return "PURGED";
  const now = Date.now();
  if (expiresAt.getTime() <= now) return "EXPIRED";
  const soon = await getSettingNumber(SettingKeys.mailboxExpiringSoon, EXPIRING_DEFAULT);
  if (expiresAt.getTime() - now <= soon * 60_000) return "EXPIRING_SOON";
  return "ACTIVE";
}

export async function transitionMailbox(
  mailboxId: string,
  toState: MailboxState,
  reason: string,
  fromState?: string,
) {
  const box = await prisma.temporaryMailbox.update({
    where: { id: mailboxId },
    data: { state: toState, purgedAt: toState === "PURGED" ? new Date() : undefined },
  });
  await prisma.mailboxEvent.create({
    data: { mailboxId, fromState: fromState ?? null, toState, reason },
  });
  return box;
}

export function toPublicMailbox(box: any, favorite = false): PublicMailbox {
  const delivery = deliveryReadinessForDomain(
    box.domain ?? { mxRequired: true, mxOk: false },
  );
  return {
    id: box.id,
    address: box.address,
    localPart: box.localPart,
    domain: box.domain?.domain ?? "",
    state: box.state as MailboxState,
    expiresAt: box.expiresAt instanceof Date ? box.expiresAt.toISOString() : String(box.expiresAt),
    custom: box.custom,
    publicToken: box.publicToken,
    createdAt: box.createdAt instanceof Date ? box.createdAt.toISOString() : String(box.createdAt),
    messageCount: box.messageCount,
    unreadCount: box.unreadCount,
    favorite,
    deliveryReady: delivery.ready,
    deliveryStatus: delivery.status,
    deliveryProvider: delivery.provider,
    deliveryDetail: delivery.detail,
  };
}

export async function createMailbox(opts: {
  user?: SessionUser | null;
  guestKey?: string;
  localPart?: string;
  domainId?: string;
  custom?: boolean;
  sandbox?: boolean;
  ttlMinutes?: number;
  ip?: string;
  userAgent?: string;
}) {
  const planKey: PlanKey = opts.user?.planKey ?? "FREE";
  const limits = await getPlanLimits(planKey);
  const defaultTtl = await getSettingNumber(
    planKey === "FREE" ? SettingKeys.mailboxDefaultTtl : SettingKeys.mailboxPremiumTtl,
    // DB admin settings win; the environment variable is the next fallback.
    planKey === "FREE" ? getEnv().MAILBOX_TTL_MINUTES : 24 * 60,
  );
  const ttl = opts.ttlMinutes ?? defaultTtl;
  const maxActive = limitNumber(limits, "max_active_mailboxes", planKey === "FREE" ? 3 : 25);
  if (opts.user) {
    const active = await prisma.temporaryMailbox.count({
      where: { userId: opts.user.id, state: { in: ["ACTIVE", "EXPIRING_SOON"] } },
    });
    if (active >= maxActive) {
      throw Errors.planLimit(`Your plan allows ${maxActive} active mailboxes.`);
    }
  }

  const domains = await listAssignableDomains(planKey);
  if (domains.length === 0) throw Errors.domainUnavailable();
  const domain = (opts.domainId
    ? domains.find((d) => d.id === opts.domainId)
    : pickWeighted(domains as { weight: number }[])) as { id: string; domain: string } | undefined;
  if (!domain) throw Errors.domainUnavailable();

  const allowCustom = limitBool(limits, "custom_usernames", planKey !== "FREE");
  let local: string;
  let custom = false;
  if (opts.localPart && opts.custom) {
    if (!allowCustom && planKey === "FREE") {
      // Free users may request a custom name; we still allow it but filter strictly.
    }
    const check = validateLocalPart(opts.localPart);
    if (!check.ok) throw Errors.usernameBlocked();
    local = check.value;
    custom = true;
  } else {
    local = randomLocalPart();
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const address = `${local}@${domain.domain}`;
    const taken = await prisma.temporaryMailbox.findUnique({ where: { address } });
    if (!taken) {
      return persistMailbox({
        address,
        local,
        domainId: domain.id,
        custom,
        sandbox: Boolean(opts.sandbox),
        ttl,
        userId: opts.user?.id,
        guestKey: opts.guestKey,
        ip: opts.ip,
        userAgent: opts.userAgent,
      });
    }
    if (custom) throw Errors.usernameTaken();
    local = randomLocalPart();
  }
  throw Errors.internal();
}

async function persistMailbox(input: {
  address: string;
  local: string;
  domainId: string;
  custom: boolean;
  sandbox: boolean;
  ttl: number;
  userId?: string;
  guestKey?: string;
  ip?: string;
  userAgent?: string;
}) {
  const service = await prisma.service.findUnique({ where: { key: "temp_email" } });
  if (!service) throw Errors.internal();
  const access = randomToken(24);
  const publicToken = randomToken(18);
  const expiresAt = nowPlusMinutes(input.ttl);
  const instance = await prisma.serviceInstance.create({
    data: {
      serviceId: service.id,
      userId: input.userId,
      guestKey: input.guestKey,
      status: "ACTIVE",
      expiresAt,
      metadata: JSON.stringify({ address: input.address }),
    },
  });
  const box = await prisma.temporaryMailbox.create({
    data: {
      serviceInstanceId: instance.id,
      address: input.address,
      localPart: input.local,
      domainId: input.domainId,
      userId: input.userId,
      accessTokenHash: sha256Hex(access),
      publicToken,
      state: "ACTIVE",
      custom: input.custom,
      sandbox: input.sandbox,
      expiresAt,
      createdIp: input.ip,
      userAgent: input.userAgent?.slice(0, 300),
    },
    include: { domain: true },
  });
  await prisma.mailboxEvent.create({
    data: { mailboxId: box.id, toState: "ACTIVE", reason: "created" },
  });
  await prisma.analyticsDaily.upsert({
    where: { day: new Date().toISOString().slice(0, 10) },
    update: { mailboxesCreated: { increment: 1 } },
    create: { day: new Date().toISOString().slice(0, 10), mailboxesCreated: 1 },
  });
  return { mailbox: box, accessToken: access };
}

export async function getMailboxByToken(publicToken: string) {
  const box = await prisma.temporaryMailbox.findUnique({
    where: { publicToken },
    include: { domain: true },
  });
  if (!box) throw Errors.notFound("Mailbox");
  return refreshMailboxState(box);
}

export async function getMailboxById(id: string) {
  const box = await prisma.temporaryMailbox.findUnique({
    where: { id },
    include: { domain: true },
  });
  if (!box) throw Errors.notFound("Mailbox");
  return refreshMailboxState(box);
}

export async function refreshMailboxState(box: any) {
  const expires = box.expiresAt instanceof Date ? box.expiresAt : new Date(box.expiresAt);
  const next = await resolveState(expires, box.state as MailboxState);
  if (next !== box.state) {
    await transitionMailbox(box.id, next, "clock", box.state);
    return { ...box, state: next };
  }
  return box;
}

export async function assertMailboxUsable(box: { state: string }) {
  if (box.state === "PURGED") throw Errors.mailboxPurged();
  if (box.state === "EXPIRED") throw Errors.mailboxExpired();
}

export async function extendMailbox(id: string, minutes: number, planKey: PlanKey) {
  const box = await getMailboxById(id);
  if (box.state === "PURGED") throw Errors.mailboxPurged();
  const maxExt = await getSettingNumber(SettingKeys.mailboxMaxExtension, 120);
  const already = box.extensionMinutes;
  const grant = Math.min(minutes, Math.max(0, maxExt - already));
  if (grant <= 0) throw Errors.planLimit("This mailbox cannot be extended any further.");
  const premiumPersistent = planKey !== "FREE";
  if (!premiumPersistent && already + grant > maxExt) {
    throw Errors.planLimit("Upgrade to extend this inbox for longer.");
  }
  const currentExp = box.expiresAt instanceof Date ? box.expiresAt : new Date(box.expiresAt);
  const expiresAt = new Date(Math.max(currentExp.getTime(), Date.now()) + grant * 60_000);
  const updated = await prisma.temporaryMailbox.update({
    where: { id },
    data: {
      expiresAt,
      extensionMinutes: already + grant,
      lastExtendedAt: new Date(),
      state: "ACTIVE",
    },
    include: { domain: true },
  });
  await prisma.mailboxEvent.create({
    data: { mailboxId: id, fromState: box.state, toState: "ACTIVE", reason: `extended:${grant}` },
  });
  return updated;
}

export async function deleteMailbox(id: string) {
  const box = await getMailboxById(id);
  await prisma.emailAttachment.deleteMany({ where: { message: { mailboxId: id } } });
  await prisma.emailMessage.deleteMany({ where: { mailboxId: id } });
  await transitionMailbox(id, "PURGED", "user_deleted", box.state);
  await prisma.serviceInstance.update({
    where: { id: box.serviceInstanceId },
    data: { status: "PURGED" },
  });
  return getMailboxById(id);
}

export async function regenerateMailbox(oldId: string, ctx: { user?: SessionUser | null; guestKey?: string; ip?: string }) {
  const old = await getMailboxById(oldId);
  const created = await createMailbox({
    user: ctx.user,
    guestKey: ctx.guestKey,
    domainId: old.domainId,
    ip: ctx.ip,
  });
  if (old.state !== "PURGED") {
    await deleteMailbox(oldId);
  }
  return created;
}

export async function canAccessMailbox(
  box: any,
  ctx: { userId?: string; guestBoxes?: string[]; token?: string },
): Promise<boolean> {
  if (ctx.userId && box.userId === ctx.userId) return true;
  if (ctx.token && ctx.token === box.publicToken) return true;
  if (ctx.guestBoxes?.includes(box.id)) return true;
  return false;
}

export async function listUserMailboxes(userId: string) {
  const rows = await prisma.temporaryMailbox.findMany({
    where: { userId, state: { not: "PURGED" } },
    include: { domain: true, favorites: { where: { userId } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const refreshed = [];
  for (const row of rows) {
    refreshed.push(await refreshMailboxState(row));
  }
  return refreshed;
}
