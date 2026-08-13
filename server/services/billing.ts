import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { getPaymentProvider } from "@/server/providers/payment";
import { getPlanByKey } from "@/server/services/plans";
import { writeAudit } from "@/lib/auth";
import { invalidateUserCache } from "@/lib/auth";

export async function startCheckout(opts: {
  userId: string;
  email: string;
  planKey: string;
  interval: string;
  currency: string;
  origin: string;
}) {
  const plan = await getPlanByKey(opts.planKey);
  if (!plan || plan.key === "FREE") throw Errors.validation("Choose a paid plan.");
  const price = plan.prices.find(
    (p: { currency: string; interval: string; active: boolean; amountCents: number }) =>
      p.currency === opts.currency.toUpperCase() && p.interval === opts.interval && p.active,
  );
  if (!price) throw Errors.notFound("Price");
  const provider = getPaymentProvider();
  return provider.createCheckout({
    userId: opts.userId,
    email: opts.email,
    planKey: plan.key,
    interval: opts.interval,
    currency: price.currency,
    amountCents: price.amountCents,
    successUrl: `${opts.origin}/dashboard/billing?status=success`,
    cancelUrl: `${opts.origin}/pricing?status=canceled`,
  });
}

export async function submitManualPayment(opts: {
  userId: string;
  planKey: string;
  interval: string;
  currency: string;
  method: string;
  transactionId: string;
  amountCents: number;
  screenshotKey?: string;
}) {
  const plan = await getPlanByKey(opts.planKey);
  if (!plan) throw Errors.notFound("Plan");
  const payment = await prisma.payment.create({
    data: {
      userId: opts.userId,
      provider: "manual",
      amountCents: opts.amountCents,
      currency: opts.currency.toUpperCase(),
      status: "PENDING",
      description: `${plan.key} ${opts.interval}`,
      rawJson: JSON.stringify({ planKey: opts.planKey, interval: opts.interval }),
    },
  });
  await prisma.manualPayment.create({
    data: {
      paymentId: payment.id,
      userId: opts.userId,
      method: opts.method,
      transactionId: opts.transactionId,
      screenshotKey: opts.screenshotKey,
      adminStatus: "PENDING",
    },
  });
  await prisma.notification.create({
    data: {
      userId: opts.userId,
      type: "payment.submitted",
      title: "Payment submitted",
      body: "We received your payment details. Premium activates after a team member reviews it.",
      href: "/dashboard/billing",
    },
  });
  return payment;
}

export async function reviewManualPayment(opts: {
  id: string;
  action: "APPROVED" | "REJECTED" | "NEEDS_INFO";
  note?: string;
  actorId: string;
  actorEmail: string;
  ip?: string;
}) {
  const row = await prisma.manualPayment.findUnique({
    where: { id: opts.id },
    include: { payment: true },
  });
  if (!row) throw Errors.notFound("Payment");
  const before = { adminStatus: row.adminStatus, paymentStatus: row.payment.status };
  await prisma.manualPayment.update({
    where: { id: opts.id },
    data: {
      adminStatus: opts.action,
      adminNote: opts.note,
      reviewerId: opts.actorId,
      reviewedAt: new Date(),
    },
  });
  if (opts.action === "APPROVED") {
    const meta = JSON.parse(row.payment.rawJson || "{}") as { planKey?: string; interval?: string };
    const plan = await getPlanByKey(meta.planKey || "PRO");
    if (!plan) throw Errors.notFound("Plan");
    const periodEnd =
      meta.interval === "lifetime"
        ? new Date("2099-01-01")
        : meta.interval === "year"
          ? new Date(Date.now() + 365 * 86400000)
          : new Date(Date.now() + 30 * 86400000);
    const sub = await prisma.subscription.create({
      data: {
        userId: row.userId,
        planId: plan.id,
        status: "ACTIVE",
        interval: meta.interval || "month",
        currency: row.payment.currency,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        provider: "manual",
      },
    });
    await prisma.payment.update({
      where: { id: row.paymentId },
      data: { status: "SUCCEEDED", subscriptionId: sub.id },
    });
    await prisma.notification.create({
      data: {
        userId: row.userId,
        type: "payment.approved",
        title: "Payment approved",
        body: `Your ${plan.name} plan is now active.`,
        href: "/dashboard/billing",
      },
    });
    await invalidateUserCache(row.userId);
  } else if (opts.action === "REJECTED") {
    await prisma.payment.update({ where: { id: row.paymentId }, data: { status: "FAILED" } });
    await prisma.notification.create({
      data: {
        userId: row.userId,
        type: "payment.rejected",
        title: "Payment could not be verified",
        body: opts.note || "Please reply to support with a clearer transaction reference.",
        href: "/dashboard/billing",
      },
    });
  }
  await writeAudit({
    actorId: opts.actorId,
    actorEmail: opts.actorEmail,
    action: `payment.${opts.action.toLowerCase()}`,
    targetType: "ManualPayment",
    targetId: opts.id,
    before,
    after: { adminStatus: opts.action },
    ip: opts.ip,
  });
  return prisma.manualPayment.findUnique({ where: { id: opts.id } });
}

export async function applyStripeEvent(event: {
  type: string;
  userId?: string;
  providerPaymentId?: string;
  providerSubscriptionId?: string;
  amountCents?: number;
  currency?: string;
  raw: unknown;
}) {
  if (!event.userId) return;
  if (event.type === "checkout.session.completed") {
    await prisma.payment.create({
      data: {
        userId: event.userId,
        provider: "stripe",
        providerPaymentId: event.providerPaymentId,
        amountCents: event.amountCents || 0,
        currency: event.currency || "USD",
        status: "SUCCEEDED",
        rawJson: JSON.stringify(event.raw ?? {}),
      },
    });
  }
}
