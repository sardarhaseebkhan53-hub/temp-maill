import { ok, fail, readJson } from "@/lib/http";
import { requirePermission, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { user } = await requirePermission("admin.domains.write");
    const body = await readJson<{ domain: string; eligibility?: string; weight?: number }>(req);
    const row = await prisma.emailDomain.create({
      data: {
        domain: body.domain.toLowerCase().trim(),
        eligibility: body.eligibility || "FREE",
        weight: body.weight ?? 10,
        status: "ACTIVE",
        mxRequired: true,
        catchAll: true,
      },
    });
    await writeAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "domain.create",
      targetType: "EmailDomain",
      targetId: row.id,
      after: row,
    });
    return ok(row, { status: 201 });
  } catch (e) {
    return fail(e, req);
  }
}
