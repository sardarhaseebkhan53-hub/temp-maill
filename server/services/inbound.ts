import { prisma } from "@/lib/db";
import { cache, mailboxChannel } from "@/lib/redis";
import { Errors } from "@/lib/errors";
import { log } from "@/lib/logger";
import { classifyAttachment, extractSnippet, htmlToText, sanitizeEmailHtml } from "@/lib/sanitize";
import { getSettingNumber, SettingKeys } from "@/lib/settings";
import { attachmentKey, checksumBuffer, getStorage } from "@/server/providers/storage";
import { getScanner } from "@/server/providers/scanner";
import type { InboundEmail } from "@/server/providers/email/types";
import { refreshMailboxState } from "@/server/services/mailbox";

const DEFAULT_MAX_MESSAGE = 2 * 1024 * 1024;
const DEFAULT_MAX_ATTACH = 5 * 1024 * 1024;

export async function ingestInbound(mail: InboundEmail): Promise<{ stored: number; skipped: string[] }> {
  const skipped: string[] = [];
  let stored = 0;
  const maxMsg = await getSettingNumber(SettingKeys.maxMessageBytes, DEFAULT_MAX_MESSAGE);
  if (mail.rawSize > maxMsg) {
    log.warn("inbound_oversized", { size: mail.rawSize, from: mail.fromAddress });
    throw Errors.payloadTooLarge();
  }

  for (const to of mail.toAddresses) {
    const address = to.toLowerCase().trim();
    const box = await prisma.temporaryMailbox.findUnique({
      where: { address },
      include: { domain: true },
    });
    if (!box) {
      skipped.push(`unknown:${address}`);
      continue;
    }
    const live = await refreshMailboxState(box);
    if (live.state === "EXPIRED" || live.state === "PURGED") {
      skipped.push(`expired:${address}`);
      continue;
    }

    const blocked = await prisma.blockedSender.findFirst({
      where: {
        OR: [
          { mailboxId: box.id, pattern: mail.fromAddress },
          { userId: box.userId ?? "__none__", pattern: mail.fromAddress },
          { mailboxId: box.id, pattern: mail.fromAddress.split("@")[1] ?? "" },
        ],
      },
    });
    if (blocked) {
      skipped.push(`blocked:${address}`);
      continue;
    }

    const htmlSafe = sanitizeEmailHtml(mail.htmlBody || "");
    const text = mail.textBody || htmlToText(mail.htmlBody || "");
    const snippet = extractSnippet(text);
    const spamScore = scoreSpam(mail, text);
    const retention = await getSettingNumber(SettingKeys.messageRetentionFree, 60 * 24);
    const idempotencyKey = `${mail.idempotencyKey}:${box.id}`;
    const existing = await prisma.emailMessage.findUnique({ where: { idempotencyKey } });
    if (existing) {
      skipped.push(`duplicate:${address}`);
      continue;
    }

    const message = await prisma.emailMessage.create({
      data: {
        mailboxId: box.id,
        providerId: mail.providerMessageId,
        idempotencyKey,
        fromAddress: mail.fromAddress,
        fromName: mail.fromName,
        toAddress: address,
        subject: (mail.subject || "(no subject)").slice(0, 500),
        snippet,
        textBody: text.slice(0, 200_000),
        htmlRaw: "",
        htmlSafe: htmlSafe.slice(0, 400_000),
        headersJson: JSON.stringify(mail.headers || {}),
        sizeBytes: mail.rawSize,
        spamScore,
        spamFlag: spamScore >= 5,
        hasAttachments: mail.attachments.length > 0,
        receivedAt: mail.receivedAt,
      },
    });

    const maxAttach = await getSettingNumber(SettingKeys.maxAttachmentBytes, DEFAULT_MAX_ATTACH);
    const scanner = getScanner();
    const storage = getStorage();
    for (const att of mail.attachments) {
      if (att.content.length > maxAttach) continue;
      const verdict = classifyAttachment(att.filename, att.mimeType);
      const checksum = checksumBuffer(att.content);
      const key = attachmentKey(box.id, checksum, att.filename);
      if (!verdict.blocked) {
        await storage.put(key, att.content, att.mimeType);
      }
      const scan = verdict.blocked
        ? { status: "SKIPPED" as const, result: verdict.reason }
        : await scanner.scan(att.content, att.filename, att.mimeType);
      await prisma.emailAttachment.create({
        data: {
          messageId: message.id,
          filename: att.filename.slice(0, 180),
          mimeType: att.mimeType.slice(0, 120),
          sizeBytes: att.content.length,
          storageKey: verdict.blocked ? "" : key,
          checksum,
          blocked: verdict.blocked || scan.status === "INFECTED",
          blockReason: verdict.reason || (scan.status === "INFECTED" ? scan.result : null),
          scanStatus: scan.status,
          scanResult: scan.result,
          expiresAt: new Date(Date.now() + retention * 60_000),
        },
      });
    }

    await prisma.temporaryMailbox.update({
      where: { id: box.id },
      data: {
        messageCount: { increment: 1 },
        unreadCount: { increment: 1 },
        lastMessageAt: new Date(),
      },
    });

    await prisma.analyticsDaily.upsert({
      where: { day: new Date().toISOString().slice(0, 10) },
      update: { messagesReceived: { increment: 1 } },
      create: { day: new Date().toISOString().slice(0, 10), messagesReceived: 1 },
    });

    await cache.publish(
      mailboxChannel(box.id),
      JSON.stringify({
        type: "message.received",
        mailboxId: box.id,
        messageId: message.id,
        subject: message.subject,
        fromAddress: message.fromAddress,
        receivedAt: message.receivedAt.toISOString(),
      }),
    );

    await dispatchWebhooks(box.userId, {
      type: "message.received",
      mailboxId: box.id,
      messageId: message.id,
      address: box.address,
      from: mail.fromAddress,
      subject: message.subject,
    });

    stored += 1;
  }

  return { stored, skipped };
}

function scoreSpam(mail: InboundEmail, text: string): number {
  let score = 0;
  const hay = `${mail.subject} ${text}`.toLowerCase();
  const signals = ["congratulations you won", "urgent wire", "crypto giveaway", "click here now", "viagra", "work from home $$$"];
  for (const s of signals) if (hay.includes(s)) score += 3;
  if ((mail.htmlBody.match(/<a /gi) || []).length > 20) score += 2;
  if (mail.fromAddress.endsWith(".ru") && /invoice|payment|bank/.test(hay)) score += 2;
  return score;
}

async function dispatchWebhooks(userId: string | null, payload: Record<string, unknown>) {
  if (!userId) return;
  const hooks = await prisma.webhook.findMany({ where: { userId, active: true } });
  for (const hook of hooks) {
    const events = JSON.parse(hook.eventsJson) as string[];
    if (!events.includes(String(payload.type))) continue;
    await prisma.webhookDelivery.create({
      data: {
        webhookId: hook.id,
        event: String(payload.type),
        payloadJson: JSON.stringify(payload),
        status: "PENDING",
        nextRetryAt: new Date(),
      },
    });
  }
}
