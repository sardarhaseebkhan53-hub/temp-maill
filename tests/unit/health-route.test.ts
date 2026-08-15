import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pingDb: vi.fn(),
  pingCache: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  pingDb: mocks.pingDb,
  prisma: { emailDomain: { findMany: mocks.findMany } },
}));
vi.mock("@/lib/redis", () => ({ pingCache: mocks.pingCache }));
vi.mock("@/server/providers/email", () => ({
  getInboundProvider: () => ({ health: async () => ({ ok: true, detail: "development test adapter" }) }),
  listInboundProviders: () => [
    { key: "mock", health: async () => ({ ok: true, detail: "development test adapter" }) },
  ],
}));
vi.mock("@/server/providers/sms", () => ({
  getSmsProvider: () => ({ health: async () => ({ ok: true, detail: "test" }) }),
}));
vi.mock("@/server/services/email-delivery", () => ({
  inboundProviderReadiness: () => ({
    status: "DEVELOPMENT",
    ready: false,
    provider: "mock",
    detail: "Development test mode; public internet email is not connected.",
  }),
  isDomainAssignable: () => true,
}));

import { GET } from "@/app/api/health/route";

describe("health route failure handling", () => {
  beforeEach(() => {
    mocks.pingDb.mockReset();
    mocks.pingCache.mockReset();
    mocks.findMany.mockReset();
    mocks.pingCache.mockResolvedValue({ ok: true, latencyMs: 1 });
  });

  it("returns a controlled 503 response and skips domain queries when the database is down", async () => {
    mocks.pingDb.mockResolvedValue({ ok: false, latencyMs: 2, detail: "database offline" });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("down");
    expect(body.checks.database).toMatchObject({ ok: false, detail: "database offline" });
    expect(body.checks.emailDomains).toMatchObject({
      ok: false,
      detail: "Skipped because the database is unavailable.",
    });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("reports mock delivery as local-only rather than public-ready", async () => {
    mocks.pingDb.mockResolvedValue({ ok: true, latencyMs: 1 });
    mocks.findMany.mockResolvedValue([{ status: "ACTIVE", domain: "mail.haven.test" }]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.checks.publicMailDelivery).toMatchObject({
      ok: false,
      mode: "DEVELOPMENT",
      assignableDomains: 1,
    });
  });
});
