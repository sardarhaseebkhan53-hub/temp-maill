import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session || session.userId !== user.id) throw Errors.notFound("Session");
    await prisma.session.update({ where: { id }, data: { revokedAt: new Date() } });
    return ok({ revoked: true });
  } catch (e) {
    return fail(e, req);
  }
}
