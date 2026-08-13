import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { nowPlusMinutes } from "@/lib/utils";
import { getSmsProvider, type SmsInbound } from "@/server/providers/sms";
import { getSettingNumber } from "@/lib/settings";
import type { SessionUser } from "@/types";

export async function listAvailableNumbers(country?: string) {
  const provider = getSmsProvider();
  const live = await prisma.smsNumber.findMany({
    where: { status: "ACTIVE" },
    select: { e164: true },
  });
  const taken = new Set(live.map((n) => n.e164));
  const available = await provider.listAvailable(country);
  return available.filter((n) => !taken.has(n.e164));
}

export async function provisionNumber(opts: {
  user?: SessionUser | null;
  guestKey?: string;
  country?: string;
  e164?: string;
}) {
  const available = await listAvailableNumbers(opts.country);
  const pick = opts.e164 ? available.find((n) => n.e164 === opts.e164) : available[0];
  if (!pick) throw Errors.notFound("Number");
  const providerRow = await prisma.smsProvider.findFirst({ where: { enabled: true } }) ||
    (await prisma.smsProvider.findFirst());
  if (!providerRow) throw Errors.providerDown("SMS");
  const service = await prisma.service.findUnique({ where: { key: "temp_sms" } });
  if (!service) throw Errors.internal();
  const ttl = await getSettingNumber("sms.default_ttl_minutes", 20);
  const expiresAt = nowPlusMinutes(ttl);
  await getSmsProvider(providerRow.adapter).provision(pick.e164);
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
  return prisma.smsNumber.create({
    data: {
      serviceInstanceId: instance.id,
      providerId: providerRow.id,
      e164: pick.e164,
      country: pick.country,
      userId: opts.user?.id,
      guestKey: opts.guestKey,
      status: "ACTIVE",
      expiresAt,
    },
  });
}

export async function releaseNumber(id: string) {
  const num = await prisma.smsNumber.findUnique({ where: { id }, include: { provider: true } });
  if (!num) throw Errors.notFound("Number");
  await getSmsProvider(num.provider.adapter).release(num.e164);
  await prisma.smsNumber.update({ where: { id }, data: { status: "RELEASED" } });
  await prisma.serviceInstance.update({ where: { id: num.serviceInstanceId }, data: { status: "EXPIRED" } });
}

export async function ingestSms(msg: SmsInbound) {
  const existing = await prisma.smsMessage.findUnique({ where: { idempotencyKey: msg.idempotencyKey } });
  if (existing) return existing;
  const number = await prisma.smsNumber.findFirst({
    where: { e164: msg.to, status: "ACTIVE" },
  });
  if (!number) throw Errors.notFound("Number");
  if (number.expiresAt < new Date()) throw Errors.mailboxExpired();
  return prisma.smsMessage.create({
    data: {
      numberId: number.id,
      fromNumber: msg.from,
      body: msg.body.slice(0, 2000),
      idempotencyKey: msg.idempotencyKey,
      receivedAt: msg.receivedAt,
    },
  });
}

export async function listSmsMessages(numberId: string) {
  return prisma.smsMessage.findMany({
    where: { numberId },
    orderBy: { receivedAt: "desc" },
    take: 100,
  });
}
