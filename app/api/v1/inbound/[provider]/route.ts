import { ok, fail } from "@/lib/http";
import { getInboundProvider } from "@/server/providers/email";
import { ingestInbound } from "@/server/services/inbound";
import { assertRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { Errors } from "@/lib/errors";
import { log } from "@/lib/logger";

export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await ctx.params;
    await assertRateLimit("inbound.webhook", getClientIp(req.headers));
    const raw = await req.text();
    const adapter = getInboundProvider(provider);
    const verified = await adapter.verify(req, raw);
    if (!verified) throw Errors.forbidden();
    const mails = await adapter.parse(req, raw);
    const results = [];
    for (const mail of mails) {
      results.push(await ingestInbound(mail));
    }
    log.info("inbound_accepted", { provider, stored: results.reduce((s, r) => s + r.stored, 0) });
    return ok({ results });
  } catch (e) {
    return fail(e, req);
  }
}
