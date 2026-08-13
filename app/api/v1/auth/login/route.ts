import { cookies } from "next/headers";
import { ok, fail, readJson } from "@/lib/http";
import { loginSchema } from "@/lib/validation";
import { assertRateLimit } from "@/lib/rate-limit";
import { authenticate, createSession, sessionCookieOptions } from "@/lib/auth";
import { getClientIp } from "@/lib/utils";
import { Errors } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    await assertRateLimit("auth.login", getClientIp(req.headers));
    const body = loginSchema.parse(await readJson(req));
    const user = await authenticate(body.email, body.password, {
      ip: getClientIp(req.headers),
      userAgent: req.headers.get("user-agent") || "",
    });
    if (user.status === "SUSPENDED") throw Errors.forbidden();
    const { jwt } = await createSession(user.id, {
      ip: getClientIp(req.headers),
      userAgent: req.headers.get("user-agent") || "",
    });
    const opts = sessionCookieOptions();
    (await cookies()).set(opts.name, jwt, opts);
    return ok({ id: user.id, email: user.email });
  } catch (e) {
    return fail(e, req);
  }
}
