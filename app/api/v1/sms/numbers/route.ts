import { ok, fail, readJson } from "@/lib/http";
import { listAvailableNumbers, provisionNumber } from "@/server/services/sms";
import { requestContext } from "@/server/api/context";
import { isEnabled } from "@/lib/flags";
import { Errors } from "@/lib/errors";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    return ok(await listAvailableNumbers(url.searchParams.get("country") || undefined));
  } catch (e) {
    return fail(e, req);
  }
}

export async function POST(req: Request) {
  try {
    if (!(await isEnabled("temp_sms", true))) throw Errors.forbidden();
    const ctx = await requestContext(req);
    const body = await readJson<{ country?: string; e164?: string }>(req).catch(() => ({}));
    const num = await provisionNumber({
      user: ctx.user,
      guestKey: ctx.guest.gid,
      country: (body as { country?: string }).country,
      e164: (body as { e164?: string }).e164,
    });
    return ok(num, { status: 201 });
  } catch (e) {
    return fail(e, req);
  }
}
