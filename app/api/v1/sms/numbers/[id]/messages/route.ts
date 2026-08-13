import { ok, fail } from "@/lib/http";
import { listSmsMessages } from "@/server/services/sms";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    return ok(await listSmsMessages(id));
  } catch (e) {
    return fail(e, req);
  }
}
