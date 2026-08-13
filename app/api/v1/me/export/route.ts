import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail } from "@/lib/http";

export async function GET(req: Request) {
  try {
    const { user } = await requireUser();
    const [mailboxes, aliases, payments] = await Promise.all([
      prisma.temporaryMailbox.findMany({ where: { userId: user.id }, select: { address: true, state: true, createdAt: true } }),
      prisma.alias.findMany({ where: { userId: user.id }, select: { address: true, status: true } }),
      prisma.payment.findMany({
        where: { userId: user.id },
        select: { amountCents: true, currency: true, status: true, createdAt: true, provider: true },
      }),
    ]);
    return new Response(JSON.stringify({ user: { id: user.id, email: user.email }, mailboxes, aliases, payments }, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "attachment; filename=haven-export.json",
      },
    });
  } catch (e) {
    return fail(e, req);
  }
}
