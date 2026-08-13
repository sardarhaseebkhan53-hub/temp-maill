import { ok, fail, readJson } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { setAliasStatus } from "@/server/services/aliases";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    const body = await readJson<{ status: "ACTIVE" | "PAUSED" | "DELETED" }>(req);
    return ok(await setAliasStatus(user.id, id, body.status));
  } catch (e) {
    return fail(e, req);
  }
}
