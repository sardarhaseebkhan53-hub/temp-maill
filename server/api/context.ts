import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { getGuest } from "@/lib/guest";
import { resolveApiKey } from "@/server/services/api-keys";
import { getClientIp } from "@/lib/utils";
import type { SessionUser } from "@/types";

export async function requestContext(req: Request) {
  const auth = req.headers.get("authorization") || "";
  let apiKey = null;
  if (auth.startsWith("Bearer tmp_")) {
    apiKey = await resolveApiKey(auth.slice(7).trim());
  }
  const session = await getCurrentUser().catch(() => null);
  const guest = await getGuest();
  return {
    user: session?.user ?? (apiKey ? await userFromApi(apiKey.userId) : null),
    sessionId: session?.sessionId,
    guest,
    apiKey,
    ip: getClientIp(req.headers),
    userAgent: req.headers.get("user-agent") || "",
  };
}

async function userFromApi(userId: string): Promise<SessionUser | null> {
  const session = await getCurrentUser().catch(() => null);
  if (session?.user.id === userId) return session.user;
  const { prisma } = await import("@/lib/db");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      subscriptions: {
        where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
        include: { plan: true },
        take: 1,
      },
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    displayName: user.displayName,
    locale: user.locale,
    theme: user.theme,
    status: user.status as SessionUser["status"],
    roles: user.roles.map((r: { role: { key: string } }) => r.role.key) as SessionUser["roles"],
    permissions: [
      ...new Set(
        user.roles.flatMap((r: { role: { permissions: { permission: { key: string } }[] } }) =>
          r.role.permissions.map((p: { permission: { key: string } }) => p.permission.key),
        ),
      ),
    ] as string[],
    planKey: (user.subscriptions[0]?.plan.key as SessionUser["planKey"]) ?? "FREE",
    subscriptionStatus: (user.subscriptions[0]?.status as SessionUser["subscriptionStatus"]) ?? null,
  };
}

export async function mailboxAuthToken(req: Request): Promise<string | undefined> {
  const url = new URL(req.url);
  const q = url.searchParams.get("token") || undefined;
  if (q) return q;
  try {
    const body = await req.clone().json();
    if (body?.token) return String(body.token);
  } catch {
    /* no body */
  }
  const jar = await cookies();
  return jar.get("haven_box_token")?.value;
}
