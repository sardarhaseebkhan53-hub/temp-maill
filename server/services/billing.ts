import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { getPaymentProvider } from "@/server/providers/payment";
import { getPlanByKey } from "@/server/services/plans";
import { assertMethodAccepts } from "@/server/services/payment-methods";
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
  /** Informational only — the charged amount comes from the plan price. */
  amountCents?: number;
  screenshotKey?: string;
}) {
  const plan = await getPlanByKey(opts.planKey);
  if (!plan) throw Errors.notFound("Plan");
  if (plan.key === "FREE") throw Errors.validation("Choose a paid plan.");

  // The price is read from the database, never from the submitted form, and
  // the method must be one the operator actually enabled for this plan.
  const price = plan.prices.find(
    (p: { currency: string; interval: string; active: boolean; amountCents: number }) =>
      p.currency === opts.currency.toUpperCase() && p.interval === opts.interval && p.active,
  );
  if (!price) throw Errors.notFound("Price");
  await assertMethodAccepts({
    methodKey: opts.method,
    planKey: plan.key,
    amountCents: price.amountCents,
  });

  const payment = await prisma.payment.create({
    data: {
      userId: opts.userId,
      provider: "manual",
      // Authoritative price from the plan, not the amount the browser sent.
      amountCents: price.amountCents,
      currency: price.currency,
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
    await prisma.payment.update({ where: { id: row.paymentId }, data: { status: "SUCCEEDED" } });
    await activateSubscription({
      userId: row.userId,
      planKey: meta.planKey || "PRO",
      interval: meta.interval || "month",
      currency: row.payment.currency,
      provider: "manual",
      paymentId: row.paymentId,
    });
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
  planKey?: string;
  interval?: string;
  providerPaymentId?: string;
  providerSubscriptionId?: string;
  amountCents?: number;
  currency?: string;
  raw: unknown;
}) {
  if (!event.userId) return;

  if (event.type === "checkout.session.completed") {
    // Stripe retries deliveries, so the same session must not create a second
    // payment or a second subscription.
    if (event.providerPaymentId) {
      const seen = await prisma.payment.findFirst({
        where: { provider: "stripe", providerPaymentId: event.providerPaymentId },
      });
      if (seen) return;
    }

    const payment = await prisma.payment.create({
      data: {
        userId: event.userId,
        provider: "stripe",
        providerPaymentId: event.providerPaymentId,
        amountCents: event.amountCents || 0,
        currency: event.currency || "USD",
        status: "SUCCEEDED",
        description: event.planKey ? `${event.planKey} ${event.interval ?? ""}`.trim() : undefined,
        rawJson: JSON.stringify(event.raw ?? {}),
      },
    });

    // A verified Stripe payment is the only client-independent signal we
    // accept, so this is where premium is actually granted.
    await activateSubscription({
      userId: event.userId,
      planKey: event.planKey || "PRO",
      interval: event.interval || "month",
      currency: event.currency || "USD",
      provider: "stripe",
      providerSubscriptionId: event.providerSubscriptionId,
      paymentId: payment.id,
    });
    return;
  }

  if (event.type === "customer.subscription.deleted" && event.providerSubscriptionId) {
    await prisma.subscription.updateMany({
      where: { providerSubscriptionId: event.providerSubscriptionId },
      data: { status: "CANCELED", canceledAt: new Date() },
    });
    await invalidateUserCache(event.userId);
  }
}

/** Shared activation path for Stripe and approved manual payments. */
export async function activateSubscription(opts: {
  userId: string;
  planKey: string;
  interval: string;
  currency: string;
  provider: string;
  providerSubscriptionId?: string;
  paymentId?: string;
}) {
  const plan = await getPlanByKey(opts.planKey);
  if (!plan) throw Errors.notFound("Plan");

  const periodEnd =
    opts.interval === "lifetime"
      ? new Date("2099-01-01")
      : opts.interval === "year"
        ? new Date(Date.now() + 365 * 86400000)
        : new Date(Date.now() + 30 * 86400000);

  // Supersede any prior active plan so a user never holds two at once.
  await prisma.subscription.updateMany({
    where: { userId: opts.userId, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
    data: { status: "CANCELED", canceledAt: new Date() },
  });

  const subscription = await prisma.subscription.create({
    data: {
      userId: opts.userId,
      planId: plan.id,
      status: "ACTIVE",
      interval: opts.interval,
      currency: opts.currency.toUpperCase(),
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      provider: opts.provider,
      providerSubscriptionId: opts.providerSubscriptionId,
    },
  });

  if (opts.paymentId) {
    await prisma.payment.update({
      where: { id: opts.paymentId },
      data: { subscriptionId: subscription.id },
    });
  }

  await prisma.notification.create({
    data: {
      userId: opts.userId,
      type: "subscription.activated",
      title: `${plan.name} is active`,
      body: "Your premium features, including the ad-free experience, are now enabled.",
      href: "/dashboard/billing",
    },
  });

  await invalidateUserCache(opts.userId);
  return subscription;
}
