import { z } from "zod";
import { prisma } from "@/lib/db";
import { requirePermission, writeAudit } from "@/lib/auth";
import { fail, ok } from "@/lib/http";
import { parseBody } from "@/lib/validation";
import {
  isValidEmailDomain,
  normalizeEmailDomain,
  refreshDomainMx,
  verifyDomainMx,
} from "@/server/services/email-delivery";
import { Errors } from "@/lib/errors";

const createSchema = z.object({
  domain: z.string().min(3).max(253),
  displayName: z.string().trim().max(80).optional(),
  eligibility: z.enum(["FREE", "PREMIUM_ONLY", "BUSINESS_ONLY"]).default("FREE"),
  weight: z.number().int().min(1).max(1000).default(100),
});

const verifySchema = z.object({ id: z.string().min(1) });

export async function GET(req: Request) {
  try {
    await requirePermission("admin.domains.write");
    const rows = await prisma.emailDomain.findMany({ orderBy: { domain: "asc" } });
    return ok(rows);
  } catch (e) {
    return fail(e, req);
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await requirePermission("admin.domains.write");
    const body = parseBody(createSchema, await req.json());
    const domain = normalizeEmailDomain(body.domain);
    if (!isValidEmailDomain(domain) || !domain.endsWith(".com")) {
      throw Errors.validation("Enter a valid .com domain you control, without a protocol or @ sign.");
    }
    if (await prisma.emailDomain.findUnique({ where: { domain } })) {
      throw Errors.conflict("That domain is already configured.");
    }

    const verification = await verifyDomainMx(domain);
    const row = await prisma.emailDomain.create({
      data: {
        domain,
        displayName: body.displayName || domain,
        eligibility: body.eligibility,
        weight: body.weight,
        status: verification.ok ? "ACTIVE" : "DEGRADED",
        mxRequired: true,
        mxOk: verification.ok,
        catchAll: true,
        lastHealthAt: new Date(),
        lastHealthNote: verification.note,
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

/** Re-run DNS verification after the operator changes MX records. */
export async function PATCH(req: Request) {
  try {
    const { user } = await requirePermission("admin.domains.write");
    const { id } = parseBody(verifySchema, await req.json());
    const row = await refreshDomainMx(id);
    if (!row) throw Errors.notFound("Domain");
    await writeAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "domain.verify_mx",
      targetType: "EmailDomain",
      targetId: row.id,
      after: row,
    });
    return ok(row);
  } catch (e) {
    return fail(e, req);
  }
}
