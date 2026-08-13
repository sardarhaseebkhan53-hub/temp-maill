import { ok, fail } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { user } = await requireUser();
    const keys = await prisma.apiKey.findMany({ where: { userId: user.id }, include: { usage: true } });
    return ok(keys.map((k) => ({ id: k.id, name: k.name, usage: k.usage })));
  } catch (e) {
    return fail(e, req);
  }
}
