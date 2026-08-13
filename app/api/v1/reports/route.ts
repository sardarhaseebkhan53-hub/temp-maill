import { ok, fail, readJson } from "@/lib/http";
import { abuseReportSchema } from "@/lib/validation";
import { assertRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await assertRateLimit("report.abuse", getClientIp(req.headers));
    const body = abuseReportSchema.parse(await readJson(req));
    const user = (await getCurrentUser())?.user;
    const row = await prisma.abuseReport.create({
      data: {
        userId: user?.id,
        mailboxId: body.mailboxId,
        messageId: body.messageId,
        reporterIp: getClientIp(req.headers),
        category: body.category,
        details: body.details,
      },
    });
    return ok({ id: row.id }, { status: 201 });
  } catch (e) {
    return fail(e, req);
  }
}
