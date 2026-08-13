import { ok, fail } from "@/lib/http";
import { getSmsProvider } from "@/server/providers/sms";
import { ingestSms } from "@/server/services/sms";
import { Errors } from "@/lib/errors";

export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await ctx.params;
    const raw = await req.text();
    const adapter = getSmsProvider(provider);
    if (!(await adapter.verify(req, raw))) throw Errors.forbidden();
    const msg = await adapter.parseInbound(req, raw);
    const stored = await ingestSms(msg);
    return ok({ id: stored.id });
  } catch (e) {
    return fail(e, req);
  }
}
