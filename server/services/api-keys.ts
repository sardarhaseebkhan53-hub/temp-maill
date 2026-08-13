import { prisma } from "@/lib/db";
import { generateApiKey, hashSecret } from "@/lib/crypto";
import { Errors } from "@/lib/errors";
import { dayKey } from "@/lib/utils";

export async function createApiKey(userId: string, name: string, mode: "live" | "test") {
  const generated = generateApiKey(mode);
  const row = await prisma.apiKey.create({
    data: {
      userId,
      name,
      prefix: generated.prefix,
      keyHash: hashSecret(generated.plaintext),
      lastFour: generated.lastFour,
      mode,
    },
  });
  return { key: row, plaintext: generated.plaintext };
}

export async function rotateApiKey(id: string, userId: string) {
  const existing = await prisma.apiKey.findFirst({ where: { id, userId, revokedAt: null } });
  if (!existing) throw Errors.notFound("API key");
  const generated = generateApiKey(existing.mode as "live" | "test");
  const next = await prisma.apiKey.create({
    data: {
      userId,
      name: existing.name,
      prefix: generated.prefix,
      keyHash: hashSecret(generated.plaintext),
      lastFour: generated.lastFour,
      mode: existing.mode,
      rotatedFromId: existing.id,
    },
  });
  await prisma.apiKey.update({
    where: { id: existing.id },
    data: { graceUntil: new Date(Date.now() + 24 * 3600_000) },
  });
  return { key: next, plaintext: generated.plaintext };
}

export async function revokeApiKey(id: string, userId: string) {
  const existing = await prisma.apiKey.findFirst({ where: { id, userId } });
  if (!existing) throw Errors.notFound("API key");
  return prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
}

export async function resolveApiKey(plaintext: string) {
  if (!plaintext?.startsWith("tmp_")) return null;
  const hash = hashSecret(plaintext);
  const key = await prisma.apiKey.findUnique({ where: { keyHash: hash }, include: { user: true } });
  if (!key) return null;
  if (key.revokedAt && (!key.graceUntil || key.graceUntil < new Date())) return null;
  if (key.expiresAt && key.expiresAt < new Date()) return null;
  if (key.user.status !== "ACTIVE") return null;
  await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
  return key;
}

export async function recordApiUsage(apiKeyId: string, path: string, status: number, durationMs: number, ip?: string) {
  const day = dayKey();
  await prisma.apiUsage.upsert({
    where: { apiKeyId_day: { apiKeyId, day } },
    update: {
      requests: { increment: 1 },
      errors: { increment: status >= 400 ? 1 : 0 },
      lastPath: path,
    },
    create: {
      apiKeyId,
      day,
      requests: 1,
      errors: status >= 400 ? 1 : 0,
      lastPath: path,
    },
  });
  await prisma.apiRequestLog.create({
    data: {
      correlationId: `${Date.now().toString(36)}`,
      apiKeyId,
      method: "GET",
      path,
      status,
      durationMs,
      ip,
    },
  });
}
