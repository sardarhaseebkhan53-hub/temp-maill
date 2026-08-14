import { cookies } from "next/headers";
import { ok, fail, readJson } from "@/lib/http";
import { loginSchema } from "@/lib/validation";
import { assertRateLimit } from "@/lib/rate-limit";
import { authenticate, createSession, hasPermission, sessionCookieOptions } from "@/lib/auth";
import { getClientIp } from "@/lib/utils";
import { prisma } from "@/lib/db";
import type { RoleKey } from "@/types";

export async function POST(req: Request) {
  try {
    await assertRateLimit("auth.login", getClientIp(req.headers));
    const body = loginSchema.parse(await readJson(req));
    const user = await authenticate(body.email, body.password, {
      ip: getClientIp(req.headers),
      userAgent: req.headers.get("user-agent") || "",
    });

    const { jwt } = await createSession(user.id, {
      ip: getClientIp(req.headers),
      userAgent: req.headers.get("user-agent") || "",
    });

    const opts = sessionCookieOptions();
    (await cookies()).set(opts.name, jwt, {
      ...opts,
      // "Remember me" keeps the long-lived cookie; otherwise the session
      // cookie is dropped when the browser closes.
      maxAge: body.remember === false ? undefined : opts.maxAge,
    });

    return ok({
      id: user.id,
      email: user.email,
      redirectTo: (await isAdmin(user.id)) ? "/admin" : "/dashboard",
    });
  } catch (e) {
    return fail(e, req);
  }
}

/** Server-side decision so the browser never chooses its own landing page. */
async function isAdmin(userId: string): Promise<boolean> {
  const rows = (await prisma.userRole.findMany({
    where: { userId },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  })) as {
    role: { key: string; permissions: { permission: { key: string } }[] };
  }[];

  return hasPermission(
    {
      roles: rows.map((r) => r.role.key as RoleKey),
      permissions: rows.flatMap((r) => r.role.permissions.map((p) => p.permission.key)),
    } as Parameters<typeof hasPermission>[0],
    "admin.access",
  );
}
