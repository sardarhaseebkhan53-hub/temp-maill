import { createHmac } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resetEnvCache } from "@/config/env";
import { prisma } from "@/lib/db";
import { createMailbox } from "@/server/services/mailbox";
import { ingestInbound } from "@/server/services/inbound";
import { MailgunInboundProvider } from "@/server/providers/email/mailgun";

const SIGNING_KEY = "mailgun-integration-signing-key";
const RAW_BODY = "raw-body-ignored-by-verify";

function signMailgun(opts: { timestamp?: number; token?: string; key?: string; body?: string } = {}) {
  const timestamp = String(opts.timestamp ?? Math.floor(Date.now() / 1000));
  const token = opts.token ?? "random-token";
  const key = opts.key ?? SIGNING_KEY;
  const signature = createHmac("sha256", key).update(timestamp + token).digest("hex");
  return { timestamp, token, signature, body: opts.body ?? RAW_BODY };
}

function buildMailgunForm(fields: Record<string, string>, attachments: { name: string; type: string; data: string }[] = []) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  attachments.forEach((att, index) => {
    form.set(`attachment-${index + 1}`, new File([att.data], att.name, { type: att.type }));
  });
  return form;
}

async function callInboundHandler(req: Request) {
  const { POST } = await import("@/app/api/v1/inbound/[provider]/route");
  return POST(req, { params: Promise.resolve({ provider: "mailgun" }) });
}

describe("Mailgun inbound pipeline", () => {
  beforeAll(async () => {
    process.env.EMAIL_INBOUND_PROVIDER = "mailgun";
    process.env.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY;
    resetEnvCache();

    const service = await prisma.service.findUnique({ where: { key: "temp_email" } });
    if (!service) {
      await prisma.service.create({
        data: { key: "temp_email", name: "Temporary Email", enabled: true, sortOrder: 1 },
      });
    }
    // The Mailgun readiness gate is `READY`, which requires a .com domain
    // that is also assignable. Use `mail.example.com` with `mxOk` set so
    // the integration test can create real mailboxes against it.
    const comDomain = await prisma.emailDomain.findUnique({ where: { domain: "mail.example.com" } });
    if (!comDomain) {
      await prisma.emailDomain.create({
        data: {
          domain: "mail.example.com",
          status: "ACTIVE",
          eligibility: "FREE",
          weight: 100,
          mxOk: true,
          mxRequired: true,
        },
      });
    } else if (!comDomain.mxOk || comDomain.status !== "ACTIVE") {
      await prisma.emailDomain.update({
        where: { id: comDomain.id },
        data: { mxOk: true, status: "ACTIVE" },
      });
    }
    const plan = await prisma.plan.findUnique({ where: { key: "FREE" } });
    if (!plan) {
      const created = await prisma.plan.create({
        data: { key: "FREE", name: "Free", isDefault: true, isPublic: true },
      });
      await prisma.planLimit.create({ data: { planId: created.id, key: "max_active_mailboxes", value: "3" } });
    }
  });

  beforeEach(() => {
    process.env.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY;
    resetEnvCache();
  });

  it("rejects an invalid signature without storing anything", async () => {
    const { mailbox } = await createMailbox({ guestKey: "mg-bad-sig" });
    const { timestamp, token } = signMailgun();
    const form = buildMailgunForm({
      timestamp,
      token,
      signature: "deadbeef".repeat(8), // 64 hex chars, but wrong
      from: "Sender <sender@example.net>",
      recipient: mailbox.address,
      subject: "Bad signature",
      "body-plain": "should not be stored",
      "Message-Id": "mg-bad-sig-1",
    });
    const req = new Request("https://haven.test/api/webhooks/mailgun/inbound", { method: "POST", body: form });
    const res = await callInboundHandler(req);
    expect(res.status).toBe(403);
    const stored = await prisma.emailMessage.count({ where: { mailboxId: mailbox.id } });
    expect(stored).toBe(0);
  });

  it("rejects an expired signature (timestamp older than 5 minutes)", async () => {
    const { mailbox } = await createMailbox({ guestKey: "mg-expired" });
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
    const { token, signature } = signMailgun({ timestamp: oldTimestamp });
    const form = buildMailgunForm({
      timestamp: String(oldTimestamp),
      token,
      signature,
      from: "Sender <sender@example.net>",
      recipient: mailbox.address,
      subject: "Expired",
      "body-plain": "expired",
      "Message-Id": "mg-expired-1",
    });
    const req = new Request("https://haven.test/api/webhooks/mailgun/inbound", { method: "POST", body: form });
    const res = await callInboundHandler(req);
    expect(res.status).toBe(403);
    const stored = await prisma.emailMessage.count({ where: { mailboxId: mailbox.id } });
    expect(stored).toBe(0);
  });

  it("rejects a malformed request (missing signature fields)", async () => {
    const { mailbox } = await createMailbox({ guestKey: "mg-malformed" });
    const form = buildMailgunForm({
      from: "Sender <sender@example.net>",
      recipient: mailbox.address,
      subject: "No signature",
      "body-plain": "no sig",
    });
    const req = new Request("https://haven.test/api/webhooks/mailgun/inbound", { method: "POST", body: form });
    const res = await callInboundHandler(req);
    expect(res.status).toBe(403);
  });

  it("rejects when MAILGUN_WEBHOOK_SIGNING_KEY is not configured", async () => {
    // Create the mailbox first (so we still have a known recipient) and only
    // then remove the signing key. The handler must still reject — even a
    // well-formed body cannot pass verification without a configured key.
    const { mailbox } = await createMailbox({ guestKey: "mg-nokey" });
    delete process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
    resetEnvCache();
    const { timestamp, token, signature } = signMailgun();
    const form = buildMailgunForm({
      timestamp,
      token,
      signature,
      from: "Sender <sender@example.net>",
      recipient: mailbox.address,
      subject: "No signing key",
      "body-plain": "no key",
      "Message-Id": "mg-nokey-1",
    });
    const req = new Request("https://haven.test/api/webhooks/mailgun/inbound", { method: "POST", body: form });
    const res = await callInboundHandler(req);
    expect(res.status).toBe(403);
    // Restore for following tests
    process.env.MAILGUN_WEBHOOK_SIGNING_KEY = SIGNING_KEY;
    resetEnvCache();
  });

  it("accepts a valid signature and stores a single message", async () => {
    const { mailbox } = await createMailbox({ guestKey: "mg-valid" });
    const { timestamp, token, signature } = signMailgun();
    const form = buildMailgunForm({
      timestamp,
      token,
      signature,
      from: "Acme <acme@example.net>",
      recipient: mailbox.address,
      subject: "Verification code 482913",
      "body-plain": "Your code is 482913. It expires in 5 minutes.",
      "body-html": "<p>Your code is <b>482913</b></p>",
      "Message-Id": "mg-valid-1",
      "message-headers": JSON.stringify([
        ["X-Mailgun-Sid", "abc"],
        ["From", "Acme <acme@example.net>"],
      ]),
    });
    const req = new Request("https://haven.test/api/webhooks/mailgun/inbound", { method: "POST", body: form });
    const res = await callInboundHandler(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; data: { results: { stored: number; skipped: string[] }[] } };
    expect(json.success).toBe(true);
    expect(json.data.results[0]!.stored).toBe(1);

    const stored = await prisma.emailMessage.findFirst({
      where: { mailboxId: mailbox.id, providerId: "mg-valid-1" },
    });
    expect(stored).toBeTruthy();
    expect(stored!.fromAddress).toBe("acme@example.net");
    expect(stored!.toAddress).toBe(mailbox.address);
    expect(stored!.subject).toBe("Verification code 482913");
    // Detected OTP must come from the actual content; never invented.
    expect(stored!.detectedCode).toBe("482913");
    expect(stored!.headersJson).toContain("X-Mailgun-Sid");
  });

  it("parses attachments and stores them via the local storage driver", async () => {
    const { mailbox } = await createMailbox({ guestKey: "mg-attachment" });
    const { timestamp, token, signature } = signMailgun();
    const form = buildMailgunForm(
      {
        timestamp,
        token,
        signature,
        from: "Acme <acme@example.net>",
        recipient: mailbox.address,
        subject: "With attachment",
        "body-plain": "see attached",
        "body-html": "<p>see attached</p>",
        "Message-Id": "mg-attachment-1",
      },
      [{ name: "note.txt", type: "text/plain", data: "hello attachment body" }],
    );
    const req = new Request("https://haven.test/api/webhooks/mailgun/inbound", { method: "POST", body: form });
    const res = await callInboundHandler(req);
    expect(res.status).toBe(200);
    const message = await prisma.emailMessage.findFirst({
      where: { mailboxId: mailbox.id, providerId: "mg-attachment-1" },
      include: { attachments: true },
    });
    expect(message).toBeTruthy();
    expect(message!.hasAttachments).toBe(true);
    expect(message!.attachments).toHaveLength(1);
    const att = message!.attachments[0]!;
    expect(att.filename).toBe("note.txt");
    expect(att.mimeType).toBe("text/plain");
    expect(att.sizeBytes).toBe(21);
    // ATTACHMENT_SCANNER defaults to "none" in this environment, so the
    // scanner returns SKIPPED with a benign result. CLEAN would be produced
    // if a real scanner (ClamAV, cloud) were configured and accepted the file.
    expect(["CLEAN", "SKIPPED"]).toContain(att.scanStatus);
  });

  it("is idempotent — replays of the same Message-Id do not double-store", async () => {
    const { mailbox } = await createMailbox({ guestKey: "mg-dup" });
    const messageId = "mg-dup-1";
    for (let i = 0; i < 3; i++) {
      const { timestamp, token, signature } = signMailgun();
      const form = buildMailgunForm({
        timestamp,
        token,
        signature,
        from: "Acme <acme@example.net>",
        recipient: mailbox.address,
        subject: "Duplicate test",
        "body-plain": "body",
        "Message-Id": messageId,
      });
      const req = new Request("https://haven.test/api/webhooks/mailgun/inbound", { method: "POST", body: form });
      const res = await callInboundHandler(req);
      expect(res.status).toBe(200);
    }
    const total = await prisma.emailMessage.count({
      where: { mailboxId: mailbox.id, providerId: messageId },
    });
    expect(total).toBe(1);
  });

  it("delivers the same message to multiple recipients (To: a, b)", async () => {
    const a = await createMailbox({ guestKey: "mg-multi-a" });
    const b = await createMailbox({ guestKey: "mg-multi-b" });
    // Unique message id so re-runs against the shared test database do not
    // double-count previous deliveries.
    const messageId = `mg-multi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { timestamp, token, signature } = signMailgun();
    const form = buildMailgunForm({
      timestamp,
      token,
      signature,
      from: "Acme <acme@example.net>",
      recipient: `${a.mailbox.address}, ${b.mailbox.address}`,
      subject: "Broadcast",
      "body-plain": "to both",
      "Message-Id": messageId,
    });
    const req = new Request("https://haven.test/api/webhooks/mailgun/inbound", { method: "POST", body: form });
    const res = await callInboundHandler(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; data: { results: { stored: number }[] } };
    expect(json.data.results[0]!.stored).toBe(2);
    const stored = await prisma.emailMessage.findMany({ where: { providerId: messageId } });
    expect(stored).toHaveLength(2);
    const aStored = stored.find((m) => m.mailboxId === a.mailbox.id);
    const bStored = stored.find((m) => m.mailboxId === b.mailbox.id);
    expect(aStored?.toAddress).toBe(a.mailbox.address);
    expect(bStored?.toAddress).toBe(b.mailbox.address);
  });

  it("skips an unknown recipient and stores nothing for it", async () => {
    const { mailbox } = await createMailbox({ guestKey: "mg-unknown" });
    const { timestamp, token, signature } = signMailgun();
    const form = buildMailgunForm({
      timestamp,
      token,
      signature,
      from: "Acme <acme@example.net>",
      recipient: `does-not-exist@haven.test, ${mailbox.address}`,
      subject: "Mixed recipients",
      "body-plain": "only one is real",
      "Message-Id": "mg-unknown-1",
    });
    const req = new Request("https://haven.test/api/webhooks/mailgun/inbound", { method: "POST", body: form });
    const res = await callInboundHandler(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; data: { results: { stored: number; skipped: string[] }[] } };
    expect(json.data.results[0]!.stored).toBe(1);
    expect(json.data.results[0]!.skipped.some((s) => s.startsWith("unknown:"))).toBe(true);
    const total = await prisma.emailMessage.count({ where: { mailboxId: mailbox.id, providerId: "mg-unknown-1" } });
    expect(total).toBe(1);
  });

  it("skips an expired mailbox but stores to a live one", async () => {
    const live = await createMailbox({ guestKey: "mg-mix-live" });
    const expiring = await createMailbox({ guestKey: "mg-mix-expired" });
    // Force the second mailbox to the EXPIRED state via the public state machine.
    await prisma.temporaryMailbox.update({
      where: { id: expiring.mailbox.id },
      data: { state: "EXPIRED", expiresAt: new Date(Date.now() - 60_000) },
    });

    const { timestamp, token, signature } = signMailgun();
    const form = buildMailgunForm({
      timestamp,
      token,
      signature,
      from: "Acme <acme@example.net>",
      recipient: `${expiring.mailbox.address}, ${live.mailbox.address}`,
      subject: "Mixed state",
      "body-plain": "one is expired",
      "Message-Id": "mg-mix-state-1",
    });
    const req = new Request("https://haven.test/api/webhooks/mailgun/inbound", { method: "POST", body: form });
    const res = await callInboundHandler(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { results: { stored: number; skipped: string[] }[] } };
    expect(json.data.results[0]!.stored).toBe(1);
    expect(json.data.results[0]!.skipped.some((s) => s.startsWith("expired:"))).toBe(true);
    const storedForLive = await prisma.emailMessage.count({
      where: { mailboxId: live.mailbox.id, providerId: "mg-mix-state-1" },
    });
    const storedForExpired = await prisma.emailMessage.count({
      where: { mailboxId: expiring.mailbox.id, providerId: "mg-mix-state-1" },
    });
    expect(storedForLive).toBe(1);
    expect(storedForExpired).toBe(0);
  });

  it("parse() alone produces an InboundEmail without persisting anything", async () => {
    const { timestamp, token, signature } = signMailgun();
    const form = buildMailgunForm({
      timestamp,
      token,
      signature,
      from: "Test <t@example.net>",
      recipient: "parse-only@haven.test",
      subject: "Parse only",
      "body-plain": "do not store",
      "Message-Id": "mg-parse-only-1",
    });
    const req = new Request("https://haven.test/api/webhooks/mailgun/inbound", { method: "POST", body: form });
    const raw = await req.clone().text();
    const provider = new MailgunInboundProvider();
    expect(await provider.verify(req, raw)).toBe(true);
    const mails = await provider.parse(req, raw);
    expect(mails).toHaveLength(1);
    expect(mails[0]).toMatchObject({
      idempotencyKey: "mailgun:mg-parse-only-1",
      fromAddress: "t@example.net",
      toAddresses: ["parse-only@haven.test"],
      subject: "Parse only",
    });
    // Make sure parse() did not touch the database.
    const stored = await prisma.emailMessage.count({ where: { providerId: "mg-parse-only-1" } });
    expect(stored).toBe(0);
  });

  it("sanitizes script tags out of HTML bodies before storage", async () => {
    const { mailbox } = await createMailbox({ guestKey: "mg-sanitize" });
    const { timestamp, token, signature } = signMailgun();
    const form = buildMailgunForm({
      timestamp,
      token,
      signature,
      from: "Acme <acme@example.net>",
      recipient: mailbox.address,
      subject: "Sanitize",
      "body-plain": "safe text",
      "body-html": `<p>hello</p><script>alert(1)</script><img src=x onerror=alert(2)>`,
      "Message-Id": "mg-sanitize-1",
    });
    const req = new Request("https://haven.test/api/webhooks/mailgun/inbound", { method: "POST", body: form });
    const res = await callInboundHandler(req);
    expect(res.status).toBe(200);
    const msg = await prisma.emailMessage.findFirst({ where: { mailboxId: mailbox.id, providerId: "mg-sanitize-1" } });
    expect(msg).toBeTruthy();
    expect(msg!.htmlSafe.toLowerCase()).not.toContain("script");
    expect(msg!.htmlSafe.toLowerCase()).not.toContain("onerror");
  });

  it("rejects oversized messages before they hit the database", async () => {
    const { mailbox } = await createMailbox({ guestKey: "mg-oversize" });
    // The shared HTTP handler streams into Mailgun's own size limit; this
    // direct call isolates the ingestInbound guard. ingestInbound throws
    // Errors.payloadTooLarge() when rawSize exceeds the configured maximum.
    await expect(
      ingestInbound({
        provider: "mailgun",
        providerMessageId: "oversize-1",
        idempotencyKey: "mailgun:oversize-1",
        fromAddress: "a@example.net",
        toAddresses: [mailbox.address],
        subject: "big",
        textBody: "x",
        htmlBody: "",
        headers: {},
        attachments: [],
        receivedAt: new Date(),
        rawSize: 5 * 1024 * 1024, // 5 MB — over the 2 MB default
      }),
    ).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
  });
});
