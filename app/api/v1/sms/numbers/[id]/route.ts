import { ok, fail } from "@/lib/http";
import { releaseNumber } from "@/server/services/sms";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    await releaseNumber(id);
    return ok({ released: true });
  } catch (e) {
    return fail(e, req);
  }
}
