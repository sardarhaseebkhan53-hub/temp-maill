import Stripe from "stripe";
import { getEnv, isProduction } from "@/config/env";
import { Errors } from "@/lib/errors";

export interface CheckoutInput {
  userId: string;
  email: string;
  planKey: string;
  interval: string;
  currency: string;
  amountCents: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  provider: string;
  checkoutUrl?: string;
  providerRef?: string;
  requiresManual: boolean;
}

export interface PaymentProvider {
  readonly key: string;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  parseWebhook(req: Request, raw: string): Promise<{
    type: string;
    providerPaymentId?: string;
    providerSubscriptionId?: string;
    status?: string;
    userId?: string;
    planKey?: string;
    interval?: string;
    amountCents?: number;
    currency?: string;
    raw: unknown;
  } | null>;
}

class StripePaymentProvider implements PaymentProvider {
  readonly key = "stripe";
  private client(): Stripe {
    const env = getEnv();
    if (!env.STRIPE_SECRET_KEY) throw Errors.providerDown("Stripe");
    return new Stripe(env.STRIPE_SECRET_KEY);
  }

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const stripe = this.client();
    const session = await stripe.checkout.sessions.create({
      mode: input.interval === "lifetime" ? "payment" : "subscription",
      customer_email: input.email,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { userId: input.userId, planKey: input.planKey, interval: input.interval },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amountCents,
            product_data: { name: `Haven ${input.planKey}` },
            recurring:
              input.interval === "lifetime"
                ? undefined
                : { interval: input.interval === "year" ? "year" : "month" },
          },
        },
      ],
    });
    return { provider: "stripe", checkoutUrl: session.url ?? undefined, providerRef: session.id, requiresManual: false };
  }

  async parseWebhook(req: Request, raw: string) {
    const env = getEnv();
    if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) return null;
    const sig = req.headers.get("stripe-signature");
    if (!sig) throw Errors.forbidden();
    const stripe = this.client();
    const event = stripe.webhooks.constructEvent(raw, sig, env.STRIPE_WEBHOOK_SECRET);
    const obj = event.data.object as {
      id?: string;
      metadata?: { userId?: string; planKey?: string; interval?: string };
      amount_total?: number;
      currency?: string;
      subscription?: string;
      payment_status?: string;
    };
    return {
      type: event.type,
      providerPaymentId: obj.id,
      providerSubscriptionId: typeof obj.subscription === "string" ? obj.subscription : undefined,
      status: obj.payment_status,
      // The plan comes from the metadata we set when creating the session, so
      // the purchased plan is never taken from anything the browser sent.
      userId: obj.metadata?.userId,
      planKey: obj.metadata?.planKey,
      interval: obj.metadata?.interval,
      amountCents: obj.amount_total,
      currency: obj.currency?.toUpperCase(),
      raw: event,
    };
  }
}

class ManualPaymentProvider implements PaymentProvider {
  readonly key = "manual";

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    return {
      provider: "manual",
      checkoutUrl: `/dashboard/billing/manual?plan=${encodeURIComponent(input.planKey)}&interval=${input.interval}&currency=${input.currency}`,
      requiresManual: true,
    };
  }

  async parseWebhook() {
    return null;
  }
}

export function getPaymentProvider(key?: string): PaymentProvider {
  const env = getEnv();
  const requested = (key || env.PAYMENT_PROVIDER).toLowerCase();
  if (requested === "stripe") {
    if (!env.STRIPE_SECRET_KEY && isProduction()) {
      return new ManualPaymentProvider();
    }
    return new StripePaymentProvider();
  }
  return new ManualPaymentProvider();
}
