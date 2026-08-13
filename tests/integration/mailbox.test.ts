import { describe, expect, it, beforeAll } from "vitest";
import { prisma } from "@/lib/db";
import { createMailbox, resolveState } from "@/server/services/mailbox";
import { ingestInbound } from "@/server/services/inbound";

describe("mailbox lifecycle", () => {
  beforeAll(async () => {
    const existing = await prisma.service.findUnique({ where: { key: "temp_email" } });
    if (!existing) {
      await prisma.service.create({
        data: { key: "temp_email", name: "Temporary Email", enabled: true, sortOrder: 1 },
      });
    }
    const domain = await prisma.emailDomain.findUnique({ where: { domain: "mail.haven.test" } });
    if (!domain) {
      await prisma.emailDomain.create({
        data: {
          domain: "mail.haven.test",
          status: "ACTIVE",
          eligibility: "FREE",
          weight: 100,
          mxOk: true,
        },
      });
    }
    if (!(await prisma.plan.findUnique({ where: { key: "FREE" } }))) {
      const plan = await prisma.plan.create({
        data: { key: "FREE", name: "Free", isDefault: true, isPublic: true },
      });
      await prisma.planLimit.create({ data: { planId: plan.id, key: "max_active_mailboxes", value: "3" } });
    }
  });

  it("creates an address and receives sanitized mail", async () => {
    const { mailbox } = await createMailbox({ guestKey: "test-guest" });
    expect(mailbox.address).toContain("@");
    expect(mailbox.state).toBe("ACTIVE");

    const result = await ingestInbound({
      provider: "mock",
      idempotencyKey: `t-${Date.now()}`,
      fromAddress: "phish@evil.test",
      toAddresses: [mailbox.address],
      subject: "Hello",
      textBody: "hi",
      htmlBody: `<p>hi</p><script>alert(1)</script><img src=x onerror=alert(1)>`,
      headers: {},
      attachments: [],
      receivedAt: new Date(),
      rawSize: 120,
    });
    expect(result.stored).toBe(1);
    const msg = await prisma.emailMessage.findFirst({ where: { mailboxId: mailbox.id } });
    expect(msg).toBeTruthy();
    expect(msg!.htmlSafe).not.toMatch(/script/i);
    expect(msg!.htmlSafe.toLowerCase()).not.toContain("onerror");
  });

  it("marks expired boxes from the clock", async () => {
    const state = await resolveState(new Date(Date.now() - 1000), "ACTIVE");
    expect(state).toBe("EXPIRED");
  });

  it("is idempotent on duplicate deliveries", async () => {
    const { mailbox } = await createMailbox({ guestKey: "test-guest-2" });
    const mail = {
      provider: "mock",
      idempotencyKey: `dup-${mailbox.id}`,
      fromAddress: "a@b.test",
      toAddresses: [mailbox.address],
      subject: "once",
      textBody: "once",
      htmlBody: "<p>once</p>",
      headers: {},
      attachments: [],
      receivedAt: new Date(),
      rawSize: 40,
    };
    const a = await ingestInbound(mail);
    const b = await ingestInbound(mail);
    expect(a.stored).toBe(1);
    expect(b.stored).toBe(0);
  });
});
