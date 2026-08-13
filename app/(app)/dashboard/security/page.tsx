import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SessionList } from "@/components/features/session-list";

export default async function SecurityPage() {
  const { user } = await requireUser();
  const sessions = await prisma.session.findMany({
    where: { userId: user.id, revokedAt: null },
    orderBy: { lastSeenAt: "desc" },
  });
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Security</h1>
      <p className="text-sm text-muted-foreground mt-2">
        MFA fields exist on the account (TOTP + recovery codes) and can be enabled in a later phase. Sessions can be
        revoked now.
      </p>
      <div className="mt-6">
        <SessionList
          sessions={sessions.map((s) => ({
            id: s.id,
            ip: s.ip,
            userAgent: s.userAgent,
            lastSeenAt: s.lastSeenAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
