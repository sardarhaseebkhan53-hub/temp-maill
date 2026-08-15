import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  assertSmsNumberAccess,
  ingestSms,
  listAvailableNumbers,
  provisionNumber,
  releaseNumber,
  sweepSmsNumbers,
} from "@/server/services/sms";
import { getSmsProvider } from "@/server/providers/sms";

/**
 * End-to-end SMS lifecycle against the development mock provider:
 * assign → inbound webhook → OTP detection → access control → expiry →
 * quarantine → graduated availability.
 */
/** The test DB persists between runs — quarantined leftovers would otherwise shrink the mock pool. */
async function purgeTestAssignments() {
  const rows: any[] = await prisma.smsNumber.findMany({
    where: { guestKey: { contains: "sms-test-" } },
    select: { id: true, serviceInstanceId: true },
  });
  if (rows.length === 0) return;
  await prisma.smsMessage.deleteMany({ where: { numberId: { in: rows.map((r) => r.id) } } });
  await prisma.smsNumber.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
  await prisma.serviceInstance.deleteMany({
    where: { id: { in: rows.map((r) => r.serviceInstanceId) } },
  });
}

describe("temporary phone number lifecycle", () => {
  beforeAll(async () => {
    await purgeTestAssignments();
    if (!(await prisma.service.findUnique({ where: { key: "temp_sms" } }))) {
      await prisma.service.create({
        data: { key: "temp_sms", name: "Temporary Phone", enabled: true, sortOrder: 2 },
      });
    }
    if (!(await prisma.smsProvider.findFirst())) {
      await prisma.smsProvider.create({
        data: { key: "mock", name: "Development SMS", adapter: "mock", enabled: true, isDefault: true },
      });
    } else {
      await prisma.smsProvider.updateMany({ data: { enabled: false } });
      await prisma.smsProvider.updateMany({ where: { key: "mock" }, data: { enabled: true } });
    }
  });

  afterAll(async () => {
    await purgeTestAssignments();
  });

  it("assigns a real pool number and delivers an inbound SMS with its detected OTP", async () => {
    const available = await listAvailableNumbers();
    expect(available.length).toBeGreaterThan(0);

    const assigned = await provisionNumber({ guestKey: "sms-test-guest" });
    expect(assigned.e164).toMatch(/^\+\d{8,15}$/);
    expect(assigned.status).toBe("ASSIGNED");
    expect(assigned.publicToken).toBeTruthy();

    // The assigned number disappears from availability immediately.
    const afterAssign = await listAvailableNumbers();
    expect(afterAssign.map((n) => n.e164)).not.toContain(assigned.e164);

    // Simulate the carrier webhook (mock adapter verifies only in dev).
    const adapter = getSmsProvider("mock");
    const inbound = await adapter.parseInbound(
      new Request("http://localhost/api/v1/sms/inbound/mock", { method: "POST" }),
      JSON.stringify({
        to: assigned.e164,
        from: "+13105550199",
        body: "Your verification code is 482913. It expires in 10 minutes.",
        id: "it-sms-1",
      }),
    );
    const stored = await ingestSms(inbound);
    expect(stored.detectedCode).toBe("482913");

    // Duplicate webhooks never create a second copy.
    const duplicate = await ingestSms(inbound);
    expect(duplicate.id).toBe(stored.id);
    const count = await prisma.smsMessage.count({ where: { numberId: assigned.id } });
    expect(count).toBe(1);
  });

  it("enforces token/owner access (no IDOR)", async () => {
    const assigned = await provisionNumber({ guestKey: "sms-test-guest-2" });
    const row = await prisma.smsNumber.findUnique({ where: { id: assigned.id } });

    expect(() => assertSmsNumberAccess(row, { token: "wrong" })).toThrow();
    expect(() => assertSmsNumberAccess(row, {})).toThrow();
    expect(() => assertSmsNumberAccess(row, { userId: "someone-else" })).toThrow();
    expect(() => assertSmsNumberAccess(row, { token: assigned.publicToken })).not.toThrow();
  });

  it("expires, quarantines and only then recycles numbers", async () => {
    const assigned = await provisionNumber({ guestKey: "sms-test-guest-3" });

    // Force expiry and sweep.
    await prisma.smsNumber.update({
      where: { id: assigned.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const swept = await sweepSmsNumbers();
    expect(swept.expired).toBeGreaterThanOrEqual(1);

    const after = await prisma.smsNumber.findUnique({ where: { id: assigned.id } });
    expect(after!.status).toBe("QUARANTINED");
    expect(new Date(after!.quarantineUntil).getTime()).toBeGreaterThan(Date.now());

    // An expired assignment rejects new inbound SMS.
    const adapter = getSmsProvider("mock");
    const inbound = await adapter.parseInbound(
      new Request("http://localhost/api/v1/sms/inbound/mock", { method: "POST" }),
      JSON.stringify({ to: assigned.e164, from: "+13105550199", body: "late message", id: "it-sms-late" }),
    );
    await expect(ingestSms(inbound)).rejects.toThrow();

    // And it stays out of the pool while quarantined.
    const duringQuarantine = await listAvailableNumbers();
    expect(duringQuarantine.map((n) => n.e164)).not.toContain(assigned.e164);

    // When quarantine elapses the number graduates back to AVAILABLE.
    await prisma.smsNumber.update({
      where: { id: assigned.id },
      data: { quarantineUntil: new Date(Date.now() - 1000) },
    });
    await sweepSmsNumbers();
    const recycled = await prisma.smsNumber.findUnique({ where: { id: assigned.id } });
    expect(recycled!.status).toBe("AVAILABLE");
    const afterQuarantine = await listAvailableNumbers();
    expect(afterQuarantine.map((n) => n.e164)).toContain(assigned.e164);
  });

  it("release quarantines immediately, without waiting for expiry", async () => {
    const assigned = await provisionNumber({ guestKey: "sms-test-guest-4" });
    await releaseNumber(assigned.id);
    const row = await prisma.smsNumber.findUnique({ where: { id: assigned.id } });
    expect(row!.status).toBe("QUARANTINED");
    const pool = await listAvailableNumbers();
    expect(pool.map((n) => n.e164)).not.toContain(assigned.e164);
  });
});
