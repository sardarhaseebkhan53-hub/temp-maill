import { prisma } from "@/lib/db";
import type { PublicStats } from "@/types";

export async function publicStats(): Promise<PublicStats> {
  const [mailboxesCreated, messagesReceived, activeMailboxes] = await Promise.all([
    prisma.temporaryMailbox.count(),
    prisma.emailMessage.count(),
    prisma.temporaryMailbox.count({ where: { state: { in: ["ACTIVE", "EXPIRING_SOON"] } } }),
  ]);
  return {
    mailboxesCreated,
    messagesReceived,
    activeMailboxes,
    countriesServed: 48,
  };
}

export async function adminKpis() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [
    users,
    activeUsers,
    mailboxes,
    messagesToday,
    activeMailboxes,
    premium,
    pendingPayments,
    openAbuse,
    apiToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 30 * 86400000) } } }),
    prisma.temporaryMailbox.count(),
    prisma.emailMessage.count({ where: { receivedAt: { gte: today } } }),
    prisma.temporaryMailbox.count({ where: { state: { in: ["ACTIVE", "EXPIRING_SOON"] } } }),
    prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] } } }),
    prisma.manualPayment.count({ where: { adminStatus: "PENDING" } }),
    prisma.abuseReport.count({ where: { status: "OPEN" } }),
    prisma.apiRequestLog.count({ where: { createdAt: { gte: today } } }),
  ]);
  const revenue = await prisma.payment.aggregate({
    where: { status: "SUCCEEDED" },
    _sum: { amountCents: true },
  });
  const series = await prisma.analyticsDaily.findMany({
    orderBy: { day: "asc" },
    take: 30,
  });
  return {
    users,
    activeUsers,
    mailboxes,
    messagesToday,
    activeMailboxes,
    premium,
    pendingPayments,
    openAbuse,
    apiToday,
    revenueCents: revenue._sum.amountCents ?? 0,
    series,
  };
}
