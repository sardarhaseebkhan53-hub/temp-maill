import { ok, fail } from "@/lib/http";
import { assertSmsNumberAccess, getSmsNumber, listSmsMessages } from "@/server/services/sms";
import { requestContext, mailboxAuthToken } from "@/server/api/context";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const auth = await requestContext(req);
    const token = await mailboxAuthToken(req);
    const number = await getSmsNumber(id);
    assertSmsNumberAccess(number, { userId: auth.user?.id, token });

    const messages = await listSmsMessages(id);
    return ok(
      messages.map((m: Record<string, unknown>) => ({
        id: m.id,
        fromNumber: m.fromNumber,
        body: m.body,
        detectedCode: m.detectedCode ?? null,
        read: m.read,
        receivedAt: m.receivedAt instanceof Date ? m.receivedAt.toISOString() : String(m.receivedAt),
      })),
    );
  } catch (e) {
    return fail(e, req);
  }
}
