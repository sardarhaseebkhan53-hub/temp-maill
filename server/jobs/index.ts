import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { getSettingNumber, SettingKeys } from "@/lib/settings";
import { transitionMailbox } from "@/server/services/mailbox";
import { sweepSmsNumbers } from "@/server/services/sms";
import { getStorage } from "@/server/providers/storage";
import { refreshAllDomainMx } from "@/server/services/email-delivery";

async function runJob(name: string, fn: () => Promise<unknown>) {
  const row = await prisma.jobRun.create({ data: { job: name, status: "RUNNING" } });
  try {
    const result = await fn();
    await prisma.jobRun.update({
      where: { id: row.id },
      data: { status: "SUCCESS", finishedAt: new Date(), resultJson: JSON.stringify(result ?? {}) },
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.jobRun.update({
      where: { id: row.id },
      data: { status: "FAILED", finishedAt: new Date(), error: message },
    });
    log.error("job_failed", { job: name, err: message });
    throw err;
  }
}

export async function expireMailboxes() {
  return runJob("expire-mailboxes", async () => {
    const soonMin = await getSettingNumber(SettingKeys.mailboxExpiringSoon, 5);
    const now = new Date();
    const soon = new Date(now.getTime() + soonMin * 60_000);
    const expiring = await prisma.temporaryMailbox.findMany({
      where: { state: "ACTIVE", expiresAt: { lte: soon, gt: now } },
      select: { id: true, state: true },
    });
    for (const b of expiring) {
      await transitionMailbox(b.id, "EXPIRING_SOON", "job", b.state);
    }
    const expired = await prisma.temporaryMailbox.findMany({
      where: { state: { in: ["ACTIVE", "EXPIRING_SOON"] }, expiresAt: { lte: now } },
      select: { id: true, state: true, serviceInstanceId: true },
    });
    for (const b of expired) {
      await transitionMailbox(b.id, "EXPIRED", "job", b.state);
      await prisma.serviceInstance.update({
        where: { id: b.serviceInstanceId },
        data: { status: "EXPIRED" },
      });
    }
    return { expiring: expiring.length, expired: expired.length };
  });
}

export async function purgeExpired() {
  return runJob("purge-retention", async () => {
    const msgFree = await getSettingNumber(SettingKeys.messageRetentionFree, 24 * 60);
    const attachMin = await getSettingNumber(SettingKeys.attachmentRetention, 24 * 60);
    const cutoffMsg = new Date(Date.now() - msgFree * 60_000);
    const cutoffAtt = new Date(Date.now() - attachMin * 60_000);

    const oldMessages = await prisma.emailMessage.findMany({
      where: {
        OR: [{ deletedAt: { lte: cutoffMsg } }, { receivedAt: { lte: cutoffMsg }, mailbox: { state: "EXPIRED" } }],
        purgedAt: null,
      },
      select: { id: true },
      take: 200,
    });
    for (const m of oldMessages) {
      await prisma.emailAttachment.deleteMany({ where: { messageId: m.id } });
      await prisma.emailMessage.update({
        where: { id: m.id },
        data: { textBody: "", htmlRaw: "", htmlSafe: "", snippet: "", purgedAt: new Date() },
      });
    }

    const oldAtt = await prisma.emailAttachment.findMany({
      where: { OR: [{ expiresAt: { lte: new Date() } }, { createdAt: { lte: cutoffAtt } }], purgedAt: null },
      take: 200,
    });
    const storage = getStorage();
    for (const a of oldAtt) {
      if (a.storageKey) await storage.delete(a.storageKey).catch(() => undefined);
      await prisma.emailAttachment.update({
        where: { id: a.id },
        data: { purgedAt: new Date(), storageKey: "" },
      });
    }

    const staleBoxes = await prisma.temporaryMailbox.findMany({
      where: { state: "EXPIRED", expiresAt: { lte: cutoffMsg } },
      take: 100,
    });
    for (const b of staleBoxes) {
      await prisma.emailMessage.deleteMany({ where: { mailboxId: b.id } });
      await transitionMailbox(b.id, "PURGED", "retention", b.state);
    }

    return { messages: oldMessages.length, attachments: oldAtt.length, mailboxes: staleBoxes.length };
  });
}

export async function reconcileSubscriptions() {
  return runJob("reconcile-subscriptions", async () => {
    const now = new Date();
    const pastDue = await prisma.subscription.updateMany({
      where: { status: "ACTIVE", currentPeriodEnd: { lt: now }, cancelAtPeriodEnd: false },
      data: { status: "PAST_DUE" },
    });
    const expired = await prisma.subscription.updateMany({
      where: { status: { in: ["PAST_DUE", "CANCELED"] }, currentPeriodEnd: { lt: new Date(now.getTime() - 3 * 86400000) } },
      data: { status: "EXPIRED" },
    });
    const ended = await prisma.subscription.updateMany({
      where: { status: "ACTIVE", cancelAtPeriodEnd: true, currentPeriodEnd: { lt: now } },
      data: { status: "CANCELED", canceledAt: now },
    });
    return { pastDue: pastDue.count, expired: expired.count, ended: ended.count };
  });
}

export async function deliverWebhooks() {
  return runJob("deliver-webhooks", async () => {
    const due = await prisma.webhookDelivery.findMany({
      where: { status: "PENDING", nextRetryAt: { lte: new Date() } },
      include: { webhook: true },
      take: 25,
    });
    let ok = 0;
    let fail = 0;
    for (const d of due) {
      if (!d.webhook.active) {
        await prisma.webhookDelivery.update({ where: { id: d.id }, data: { status: "FAILED", lastError: "webhook disabled" } });
        fail += 1;
        continue;
      }
      try {
        const url = d.webhook.url;
        if (!url.startsWith("https://") && !url.startsWith("http://localhost") && !url.startsWith("http://127.0.0.1")) {
          throw new Error("blocked scheme");
        }
        const host = new URL(url).hostname;
        if (["localhost", "127.0.0.1", "0.0.0.0", "169.254.169.254", "metadata.google.internal"].includes(host) && process.env.NODE_ENV === "production") {
          throw new Error("blocked host");
        }
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json", "x-haven-event": d.event },
          body: d.payloadJson,
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        await prisma.webhookDelivery.update({
          where: { id: d.id },
          data: { status: "SUCCESS", attempts: { increment: 1 }, lastStatus: res.status },
        });
        ok += 1;
      } catch (err) {
        const attempts = d.attempts + 1;
        const backoff = Math.min(60 * 60, 30 * 2 ** attempts);
        await prisma.webhookDelivery.update({
          where: { id: d.id },
          data: {
            status: attempts >= 6 ? "FAILED" : "PENDING",
            attempts,
            lastError: err instanceof Error ? err.message : "error",
            nextRetryAt: new Date(Date.now() + backoff * 1000),
          },
        });
        fail += 1;
      }
    }
    return { ok, fail };
  });
}

export async function rollupAnalytics() {
  return runJob("analytics-rollup", async () => {
    const day = new Date().toISOString().slice(0, 10);
    const mailboxesCreated = await prisma.temporaryMailbox.count({
      where: { createdAt: { gte: new Date(`${day}T00:00:00.000Z`) } },
    });
    const messagesReceived = await prisma.emailMessage.count({
      where: { receivedAt: { gte: new Date(`${day}T00:00:00.000Z`) } },
    });
    const signups = await prisma.user.count({
      where: { createdAt: { gte: new Date(`${day}T00:00:00.000Z`) } },
    });
    await prisma.analyticsDaily.upsert({
      where: { day },
      update: { mailboxesCreated, messagesReceived, signups },
      create: { day, mailboxesCreated, messagesReceived, signups },
    });
    return { day, mailboxesCreated, messagesReceived, signups };
  });
}

export async function runAllJobs() {
  const results: Record<string, unknown> = {};
  results.expire = await expireMailboxes().catch((e) => ({ error: String(e) }));
  results.domains = await runJob("verify-domain-mx", () => refreshAllDomainMx(15)).catch((e) => ({
    error: String(e),
  }));
  results.sms = await runJob("sweep-sms-numbers", () => sweepSmsNumbers()).catch((e) => ({
    error: String(e),
  }));
  results.purge = await purgeExpired().catch((e) => ({ error: String(e) }));
  results.subs = await reconcileSubscriptions().catch((e) => ({ error: String(e) }));
  results.hooks = await deliverWebhooks().catch((e) => ({ error: String(e) }));
  results.analytics = await rollupAnalytics().catch((e) => ({ error: String(e) }));
  return results;
}

let started = false;
export function startJobScheduler() {
  if (started || process.env.NEXT_RUNTIME === "edge") return;
  started = true;
  const tick = () => {
    runAllJobs().catch((err) => log.error("scheduler_tick_failed", { err: String(err) }));
  };
  setTimeout(tick, 8_000);
  setInterval(tick, 60_000);
}
