import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    const row = await prisma.webhook.findFirst({ where: { id, userId: user.id } });
    if (!row) throw Errors.notFound("Webhook");
    await prisma.webhook.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return fail(e, req);
  }
}
