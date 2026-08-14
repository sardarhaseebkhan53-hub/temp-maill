import { cookies } from "next/headers";
import { ok, fail, readJson } from "@/lib/http";
import { registerSchema } from "@/lib/validation";
import { assertRateLimit } from "@/lib/rate-limit";
import { createSession, registerUser, sessionCookieOptions } from "@/lib/auth";
import { getClientIp } from "@/lib/utils";
import { isEnabled } from "@/lib/flags";
import { Errors } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    if (!(await isEnabled("registration", true))) throw Errors.forbidden();
    await assertRateLimit("auth.register", getClientIp(req.headers));
    const body = registerSchema.parse(await readJson(req));
    const user = await registerUser({
      email: body.email,
      password: body.password,
      name: body.name,
      locale: body.locale,
      referralCode: body.referralCode,
      ip: getClientIp(req.headers),
    });
    const { jwt } = await createSession(user.id, {
      ip: getClientIp(req.headers),
      userAgent: req.headers.get("user-agent") || "",
    });
    const opts = sessionCookieOptions();
    (await cookies()).set(opts.name, jwt, opts);
    return ok({ id: user.id, email: user.email, redirectTo: "/dashboard" }, { status: 201 });
  } catch (e) {
    return fail(e, req);
  }
}
