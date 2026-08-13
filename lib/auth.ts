import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import { getEnv } from "@/config/env";
import { hashPassword, verifyPassword, randomToken, sha256Hex, generateReferralCode } from "@/lib/crypto";
import { Errors } from "@/lib/errors";
import { log } from "@/lib/logger";
import { cache } from "@/lib/redis";
import type { PlanKey, RoleKey, SessionUser, SubscriptionStatus } from "@/types";

function secretKey() {
  return new TextEncoder().encode(getEnv().AUTH_SECRET);
}

export async function signSessionToken(sessionId: string, userId: string): Promise<string> {
  const env = getEnv();
  return new SignJWT({ sid: sessionId, sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${env.SESSION_TTL_DAYS}d`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<{ sid: string; sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sid !== "string" || typeof payload.sub !== "string") return null;
    return { sid: payload.sid, sub: payload.sub };
  } catch {
    return null;
  }
}

export async function createSession(userId: string, meta?: { ip?: string; userAgent?: string }) {
  const env = getEnv();
  const raw = randomToken(32);
  const tokenHash = sha256Hex(raw);
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 86_400_000);
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      ip: meta?.ip,
      userAgent: meta?.userAgent?.slice(0, 300),
      expiresAt,
    },
  });
  const jwt = await signSessionToken(session.id, userId);
  return { session, jwt, raw };
}

export async function destroySession(sessionId: string) {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await cache.del(`session:${sessionId}`);
}

export async function rotateSession(oldSessionId: string, userId: string, meta?: { ip?: string; userAgent?: string }) {
  const created = await createSession(userId, meta);
  await prisma.session.update({
    where: { id: oldSessionId },
    data: { revokedAt: new Date(), rotatedFromId: created.session.id },
  });
  return created;
}

async function loadSessionUser(userId: string): Promise<SessionUser | null> {
  const cached = await cache.get(`user:${userId}`);
  if (cached) {
    try {
      return JSON.parse(cached) as SessionUser;
    } catch {
      /* ignore */
    }
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      subscriptions: {
        where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!user || user.status === "DELETED") return null;
  const roles = user.roles.map((r: { role: { key: string } }) => r.role.key as RoleKey);
  const permissions = [
    ...new Set(
      user.roles.flatMap((r: { role: { permissions: { permission: { key: string } }[] } }) =>
        r.role.permissions.map((p: { permission: { key: string } }) => p.permission.key),
      ),
    ),
  ] as string[];
  const sub = user.subscriptions[0];
  const view: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    displayName: user.displayName,
    locale: user.locale,
    theme: user.theme,
    status: user.status as SessionUser["status"],
    roles,
    permissions,
    planKey: (sub?.plan.key as PlanKey) ?? "FREE",
    subscriptionStatus: (sub?.status as SubscriptionStatus) ?? null,
  };
  await cache.set(`user:${userId}`, JSON.stringify(view), 30);
  return view;
}

export async function invalidateUserCache(userId: string) {
  await cache.del(`user:${userId}`);
}

export async function getCurrentUser(): Promise<{ user: SessionUser; sessionId: string } | null> {
  const jar = await cookies();
  const env = getEnv();
  const token = jar.get(env.SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const session = await prisma.session.findUnique({ where: { id: payload.sid } });
  if (!session || session.revokedAt || session.expiresAt < new Date() || session.userId !== payload.sub) {
    return null;
  }
  const user = await loadSessionUser(session.userId);
  if (!user || user.status === "BANNED" || user.status === "SUSPENDED") return user
    ? { user, sessionId: session.id }
    : null;
  if (Date.now() - session.lastSeenAt.getTime() > 5 * 60_000) {
    await prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => null);
  }
  return { user, sessionId: session.id };
}

export async function requireUser() {
  const ctx = await getCurrentUser();
  if (!ctx) throw Errors.unauthorized();
  if (ctx.user.status === "BANNED") throw Errors.forbidden();
  if (ctx.user.status === "SUSPENDED") throw Errors.forbidden();
  return ctx;
}

export function hasPermission(user: SessionUser, permission: string): boolean {
  if (user.roles.includes("SUPER_ADMIN")) return true;
  return user.permissions.includes(permission);
}

export async function requirePermission(permission: string) {
  const ctx = await requireUser();
  if (!hasPermission(ctx.user, permission)) throw Errors.forbidden();
  return ctx;
}

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
  locale?: string;
  referralCode?: string;
  ip?: string;
}) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Errors.conflict("An account with that email already exists.");
  const passwordHash = await hashPassword(input.password);
  let referredById: string | null = null;
  if (input.referralCode) {
    const ref = await prisma.user.findUnique({ where: { referralCode: input.referralCode.toUpperCase() } });
    if (ref && ref.email !== email) referredById = ref.id;
  }
  const userRole = await prisma.role.findUnique({ where: { key: "USER" } });
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: input.name,
      displayName: input.name,
      locale: input.locale ?? "en",
      referralCode: generateReferralCode(),
      referredById,
      lastLoginIp: input.ip,
      lastLoginAt: new Date(),
      roles: userRole ? { create: { roleId: userRole.id } } : undefined,
    },
  });
  if (referredById) {
    const existingRef = await prisma.referral.findUnique({ where: { refereeId: user.id } }).catch(() => null);
    if (!existingRef) {
      await prisma.referral.create({
        data: { referrerId: referredById, refereeId: user.id, status: "PENDING" },
      });
    }
  }
  await prisma.activityLog.create({
    data: { userId: user.id, action: "account.created", ip: input.ip },
  });
  return user;
}

export async function authenticate(email: string, password: string, meta?: { ip?: string; userAgent?: string }) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.passwordHash) {
    await recordSecurity("login.failed", { ip: meta?.ip, metaJson: JSON.stringify({ email }) });
    throw Errors.unauthorized();
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    await recordSecurity("login.failed", { userId: user.id, ip: meta?.ip });
    throw Errors.unauthorized();
  }
  if (user.status === "BANNED") throw Errors.forbidden();
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), lastLoginIp: meta?.ip },
  });
  await recordSecurity("login.success", { userId: user.id, ip: meta?.ip, userAgent: meta?.userAgent });
  return user;
}

export async function recordSecurity(
  type: string,
  data: { userId?: string; ip?: string; userAgent?: string; metaJson?: string },
) {
  await prisma.securityEvent.create({
    data: {
      type,
      userId: data.userId,
      ip: data.ip,
      userAgent: data.userAgent?.slice(0, 300),
      metaJson: data.metaJson ?? "{}",
    },
  });
}

export async function requestHeadersMeta() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "0.0.0.0",
    userAgent: h.get("user-agent") || "",
  };
}

export function sessionCookieOptions() {
  const env = getEnv();
  return {
    name: env.SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: Boolean(env.COOKIE_SECURE) || env.NODE_ENV === "production",
    path: "/",
    maxAge: env.SESSION_TTL_DAYS * 86_400,
  };
}

export async function writeAudit(input: {
  actorId?: string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        actorEmail: input.actorEmail,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        beforeJson: JSON.stringify(input.before ?? {}),
        afterJson: JSON.stringify(input.after ?? {}),
        ip: input.ip,
      },
    });
  } catch (err) {
    log.warn("audit_write_failed", { err: err instanceof Error ? err.message : String(err) });
  }
}
