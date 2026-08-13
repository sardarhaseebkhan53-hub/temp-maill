import { ok, fail, readJson } from "@/lib/http";
import { contactSchema } from "@/lib/validation";
import { assertRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await assertRateLimit("contact.form", getClientIp(req.headers));
    const body = contactSchema.parse(await readJson(req));
    await prisma.contactSubmission.create({
      data: { ...body, ip: getClientIp(req.headers) },
    });
    await prisma.supportTicket.create({
      data: {
        email: body.email,
        subject: body.topic,
        status: "OPEN",
      },
    });
    return ok({ received: true });
  } catch (e) {
    return fail(e, req);
  }
}
