import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";

describe("mini ORM invariants", () => {
  it("fills NOT NULL timestamp columns the caller omitted", async () => {
    // JobRun.startedAt is NOT NULL with no SQL default.
    const row = await prisma.jobRun.create({ data: { job: `test-${Date.now()}` } });
    expect(row.startedAt).toBeInstanceOf(Date);
    expect(Number.isNaN(new Date(row.startedAt).getTime())).toBe(false);
  });

  it("supports a `not` filter on a single-column unique field", async () => {
    // Regression: flattenWhere treated any single-column unique as a compound
    // key and spliced the filter object into the WHERE clause, producing
    // invalid SQL for `{ key: { not: "FREE" } }`.
    const key = `orm-test-${Date.now()}`;
    await prisma.featureFlag.upsert({
      where: { key },
      update: { enabled: true },
      create: { key, enabled: true, description: "orm test" },
    });

    const others = await prisma.featureFlag.findMany({ where: { key: { not: key } } });
    expect(Array.isArray(others)).toBe(true);
    expect(others.every((flag: { key: string }) => flag.key !== key)).toBe(true);
  });

  it("still resolves genuine compound unique lookups", async () => {
    const plan = await prisma.plan.findFirst();
    if (!plan) return;

    const limitKey = `limit-${Date.now()}`;
    await prisma.planLimit.create({ data: { planId: plan.id, key: limitKey, value: "1" } });

    const found = await prisma.planLimit.findUnique({
      where: { planId_key: { planId: plan.id, key: limitKey } },
    });
    expect(found?.value).toBe("1");
  });
});
