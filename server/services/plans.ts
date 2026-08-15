import { prisma } from "@/lib/db";
import type { PlanKey, PlanView } from "@/types";

export async function listPublicPlans(): Promise<PlanView[]> {
  const plans = await prisma.plan.findMany({
    where: { isPublic: true },
    include: { prices: { where: { active: true } }, limits: true },
    orderBy: { sortOrder: "asc" },
  });
  return plans.map(toView);
}

export async function getPlanByKey(key: string) {
  return prisma.plan.findUnique({
    where: { key },
    include: { prices: true, limits: true },
  });
}

export function toView(plan: any): PlanView {
  const limits: Record<string, string> = {};
  for (const l of plan.limits) limits[l.key] = l.value;
  return {
    key: plan.key as PlanKey,
    name: plan.name,
    description: plan.description ?? "",
    highlight: plan.highlight,
    prices: plan.prices.map((p: { currency: string; interval: string; amountCents: number }) => ({
      currency: p.currency,
      interval: p.interval,
      amountCents: p.amountCents,
    })),
    limits,
  };
}

export async function getPlanLimits(planKey: PlanKey): Promise<Record<string, string>> {
  const plan = await prisma.plan.findUnique({
    where: { key: planKey },
    include: { limits: true },
  });
  const limits: Record<string, string> = {};
  if (!plan) return limits;
  for (const l of plan.limits) limits[l.key] = l.value;
  return limits;
}

export function limitNumber(limits: Record<string, string>, key: string, fallback: number): number {
  const n = Number(limits[key]);
  return Number.isFinite(n) ? n : fallback;
}

export function limitBool(limits: Record<string, string>, key: string, fallback = false): boolean {
  const v = limits[key];
  if (v == null) return fallback;
  return v === "true" || v === "1" || v === "yes";
}
