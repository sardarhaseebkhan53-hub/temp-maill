import { ok, fail, readJson } from "@/lib/http";
import { assertSmsNumberAccess, extendSmsNumber, getSmsNumber } from "@/server/services/sms";
import { requestContext, mailboxAuthToken } from "@/server/api/context";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const auth = await requestContext(req);
    const token = await mailboxAuthToken(req);
    const number = await getSmsNumber(id);
    assertSmsNumberAccess(number, { userId: auth.user?.id, token });

    const body = await readJson<{ minutes?: number }>(req).catch(() => ({ minutes: 10 }));
    const updated = await extendSmsNumber(id, body?.minutes ?? 10);
    return ok({
      id: updated.id,
      e164: updated.e164,
      country: updated.country,
      status: updated.status,
      expiresAt: updated.expiresAt instanceof Date ? updated.expiresAt.toISOString() : String(updated.expiresAt),
    });
  } catch (e) {
    return fail(e, req);
  }
}
