import { ok, fail, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { startCheckout } from "@/server/services/billing";
import { originFromRequest } from "@/lib/utils";
import { isEnabled } from "@/lib/flags";
import { Errors } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    if (!(await isEnabled("premium", true))) throw Errors.forbidden();
    const { user } = await requireUser();
    const body = await readJson<{ planKey: string; interval: string; currency: string }>(req);
    const result = await startCheckout({
      userId: user.id,
      email: user.email,
      planKey: body.planKey,
      interval: body.interval,
      currency: body.currency || "USD",
      origin: originFromRequest(req),
    });
    return ok(result);
  } catch (e) {
    return fail(e, req);
  }
}
