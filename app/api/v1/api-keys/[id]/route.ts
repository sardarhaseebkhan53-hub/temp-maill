import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { revokeApiKey } from "@/server/services/api-keys";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    await revokeApiKey(id, user.id);
    return ok({ revoked: true });
  } catch (e) {
    return fail(e, req);
  }
}
