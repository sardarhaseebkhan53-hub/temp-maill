import { ok, fail, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { manualPaymentSchema } from "@/lib/validation";
import { submitManualPayment } from "@/server/services/billing";

export async function POST(req: Request) {
  try {
    const { user } = await requireUser();
    const body = manualPaymentSchema.parse(await readJson(req));
    const payment = await submitManualPayment({
      userId: user.id,
      planKey: body.planKey,
      interval: body.interval,
      currency: body.currency,
      method: body.method,
      transactionId: body.transactionId,
      amountCents: body.amountCents,
    });
    return ok({ id: payment.id, status: payment.status }, { status: 201 });
  } catch (e) {
    return fail(e, req);
  }
}
