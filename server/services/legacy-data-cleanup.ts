import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";

const LEGACY_INJECTED_HEADER = "X-Haven-Demo";

/**
 * Removes messages created by the retired inbox preview action.
 *
 * The header was written only by that action, so sender names and subjects are
 * deliberately not used as deletion criteria. Real mail from any sender is
 * preserved.
 */
export async function purgeLegacyInjectedMessages() {
  const messages = await prisma.emailMessage.findMany({
    where: { headersJson: { contains: LEGACY_INJECTED_HEADER } },
    select: { id: true, mailboxId: true, receivedAt: true },
  });
  if (messages.length === 0) {
    await prisma.featureFlag.deleteMany({ where: { key: "demo_inject" } });
    return { messages: 0, mailboxes: 0 };
  }

  const mailboxIds = [...new Set(messages.map((message) => String(message.mailboxId)))];
  const messagesByDay = new Map<string, number>();
  for (const message of messages) {
    const receivedAt = message.receivedAt instanceof Date
      ? message.receivedAt
      : new Date(String(message.receivedAt));
    const day = receivedAt.toISOString().slice(0, 10);
    messagesByDay.set(day, (messagesByDay.get(day) || 0) + 1);
    await prisma.emailAttachment.deleteMany({ where: { messageId: message.id } });
    await prisma.emailMessage.delete({ where: { id: message.id } });
  }

  for (const mailboxId of mailboxIds) {
    const [messageCount, unreadCount, latest] = await Promise.all([
      prisma.emailMessage.count({ where: { mailboxId, deletedAt: null } }),
      prisma.emailMessage.count({ where: { mailboxId, deletedAt: null, read: false } }),
      prisma.emailMessage.findFirst({
        where: { mailboxId, deletedAt: null },
        orderBy: { receivedAt: "desc" },
        select: { receivedAt: true },
      }),
    ]);
    await prisma.temporaryMailbox.update({
      where: { id: mailboxId },
      data: {
        messageCount,
        unreadCount,
        lastMessageAt: latest?.receivedAt ?? null,
      },
    });
  }

  for (const [day, removed] of messagesByDay) {
    const analytics = await prisma.analyticsDaily.findUnique({ where: { day } });
    if (!analytics) continue;
    await prisma.analyticsDaily.update({
      where: { day },
      data: { messagesReceived: Math.max(0, Number(analytics.messagesReceived) - removed) },
    });
  }

  await prisma.featureFlag.deleteMany({ where: { key: "demo_inject" } });
  log.info("legacy_inbox_preview_data_removed", {
    messages: messages.length,
    mailboxes: mailboxIds.length,
  });
  return { messages: messages.length, mailboxes: mailboxIds.length };
}
