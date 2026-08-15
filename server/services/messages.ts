import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import type { PublicAttachment, PublicMessage, PublicMessageDetail } from "@/types";
import { getStorage } from "@/server/providers/storage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toPublicMessage(m: any): PublicMessage {
  return {
    id: m.id,
    fromAddress: m.fromAddress,
    fromName: m.fromName,
    toAddress: m.toAddress,
    subject: m.subject,
    snippet: m.snippet,
    receivedAt: m.receivedAt instanceof Date ? m.receivedAt.toISOString() : String(m.receivedAt),
    read: m.read,
    hasAttachments: m.hasAttachments,
    spamFlag: m.spamFlag,
    sizeBytes: m.sizeBytes,
    detectedCode: m.detectedCode ?? null,
  };
}

export async function listMessages(opts: {
  mailboxId: string;
  cursor?: string;
  limit: number;
  q?: string;
  sort: "newest" | "oldest" | "unread";
  filter: "all" | "unread" | "has-attachment";
  sender?: string;
}) {
  const where: Record<string, unknown> = {
    mailboxId: opts.mailboxId,
    deletedAt: null,
  };
  if (opts.filter === "unread") where.read = false;
  if (opts.filter === "has-attachment") where.hasAttachments = true;
  if (opts.sender) where.fromAddress = { contains: opts.sender };
  if (opts.q) {
    where.OR = [
      { subject: { contains: opts.q } },
      { snippet: { contains: opts.q } },
      { fromAddress: { contains: opts.q } },
    ];
  }
  if (opts.cursor) {
    const cursor = await prisma.emailMessage.findUnique({ where: { id: opts.cursor } });
    if (cursor) {
      where.AND = [
        opts.sort === "oldest" ? { receivedAt: { gt: cursor.receivedAt } } : { receivedAt: { lt: cursor.receivedAt } },
      ];
    }
  }
  const rows = await prisma.emailMessage.findMany({
    where,
    orderBy:
      opts.sort === "oldest"
        ? { receivedAt: "asc" }
        : opts.sort === "unread"
          ? [{ read: "asc" }, { receivedAt: "desc" }]
          : { receivedAt: "desc" },
    take: opts.limit + 1,
  });
  const nextCursor = rows.length > opts.limit ? rows[opts.limit - 1]?.id : null;
  const items = rows.slice(0, opts.limit).map(toPublicMessage);
  return { items, nextCursor };
}

export async function getMessage(id: string, mailboxId?: string): Promise<PublicMessageDetail> {
  const m = await prisma.emailMessage.findUnique({
    where: { id },
    include: { attachments: true },
  });
  if (!m || m.deletedAt) throw Errors.notFound("Message");
  if (mailboxId && m.mailboxId !== mailboxId) throw Errors.notFound("Message");
  return {
    ...toPublicMessage(m),
    textBody: m.textBody,
    htmlSafe: m.htmlSafe,
    attachments: (m.attachments || []).map(
      (a: { id: string; filename: string; mimeType: string; sizeBytes: number; blocked: boolean }): PublicAttachment => ({
        id: a.id,
        filename: a.filename,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
        blocked: a.blocked,
      }),
    ),
  };
}

export async function markRead(id: string, read: boolean) {
  const m = await prisma.emailMessage.findUnique({ where: { id } });
  if (!m) throw Errors.notFound("Message");
  if (m.read === read) return m;
  await prisma.emailMessage.update({ where: { id }, data: { read } });
  await prisma.temporaryMailbox.update({
    where: { id: m.mailboxId },
    data: { unreadCount: { increment: read ? -1 : 1 } },
  });
  return prisma.emailMessage.findUnique({ where: { id } });
}

export async function deleteMessage(id: string) {
  const m = await prisma.emailMessage.findUnique({ where: { id } });
  if (!m) throw Errors.notFound("Message");
  await prisma.emailMessage.update({ where: { id }, data: { deletedAt: new Date() } });
  if (!m.read) {
    await prisma.temporaryMailbox.update({
      where: { id: m.mailboxId },
      data: { unreadCount: { increment: -1 }, messageCount: { increment: -1 } },
    });
  } else {
    await prisma.temporaryMailbox.update({
      where: { id: m.mailboxId },
      data: { messageCount: { increment: -1 } },
    });
  }
}

export async function getAttachmentBytes(messageId: string, attachmentId: string) {
  const att = await prisma.emailAttachment.findUnique({ where: { id: attachmentId } });
  if (!att || att.messageId !== messageId) throw Errors.notFound("Attachment");
  if (att.blocked) throw Errors.unsupportedMedia();
  const bytes = await getStorage().get(att.storageKey);
  return { att, bytes };
}
