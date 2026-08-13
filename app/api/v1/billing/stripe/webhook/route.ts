import { ok, fail } from "@/lib/http";
import { getPaymentProvider } from "@/server/providers/payment";
import { applyStripeEvent } from "@/server/services/billing";

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const event = await getPaymentProvider("stripe").parseWebhook(req, raw);
    if (event) await applyStripeEvent(event);
    return ok({ received: true });
  } catch (e) {
    return fail(e, req);
  }
}
