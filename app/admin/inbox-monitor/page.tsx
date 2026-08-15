import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Live operations dashboard for both temporary inboxes and temporary phone
 * numbers. Metadata only — message bodies and OTP codes are never shown
 * here.
 */
export default async function Page() {
  await requirePermission("admin.mailboxes.read");
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60_000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60_000);

  const [
    mailboxes,
    recentMessages,
    activeMailboxes,
    quarantinedNumbers,
    activeNumbers,
    blockedNumbers,
    recentSms,
    spamFlagged,
  ] = await Promise.all([
    prisma.emailMessage.findMany({
      orderBy: { receivedAt: "desc" },
      take: 30,
      select: {
        id: true,
        fromAddress: true,
        toAddress: true,
        subject: true,
        receivedAt: true,
        spamFlag: true,
        sizeBytes: true,
        hasAttachments: true,
        detectedCode: true,
      },
    }),
    prisma.emailMessage.count({ where: { receivedAt: { gte: oneDayAgo } } }),
    prisma.temporaryMailbox.count({
      where: { state: { in: ["ACTIVE", "EXPIRING_SOON"] } },
    }),
    prisma.smsNumber.count({
      where: { status: "QUARANTINED", quarantineUntil: { gt: now } },
    }),
    prisma.smsNumber.count({
      where: { status: "ASSIGNED", expiresAt: { gt: now } },
    }),
    prisma.smsNumber.count({ where: { status: "BLOCKED" } }),
    prisma.smsMessage.count({ where: { receivedAt: { gte: oneHourAgo } } }),
    prisma.emailMessage.count({ where: { spamFlag: true, receivedAt: { gte: oneDayAgo } } }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Inbox monitor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live operations surface for temporary mailboxes and SMS assignments. Bodies are never
          shown here; this view is metadata only.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active mailboxes", activeMailboxes],
          ["Mail messages (24h)", recentMessages],
          ["Spam flagged (24h)", spamFlagged],
          ["Active phone numbers", activeNumbers],
          ["Quarantined numbers", quarantinedNumbers],
          ["Blocked numbers", blockedNumbers],
          ["SMS messages (1h)", recentSms],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border bg-card p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Most recent mail (metadata only)</h2>
        {mailboxes.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            No messages have arrived yet. Once the inbound webhook is wired and a real message
            reaches a generated mailbox, the row appears here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-white/[0.05]">
            {mailboxes.map((m) => (
              <li
                key={m.id}
                className="grid min-w-0 grid-cols-1 gap-1 py-2 text-xs sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-center"
              >
                <span className="font-mono text-[11px] text-muted-foreground">
                  {new Date(m.receivedAt).toLocaleString()}
                </span>
                <span className="min-w-0 truncate">
                  <span className="text-muted-foreground">{m.toAddress}</span> ←{" "}
                  <span className="text-foreground">{m.fromAddress}</span> · {m.subject}
                </span>
                <span className="flex items-center gap-1.5 sm:justify-end">
                  {m.detectedCode ? (
                    <span className="rounded border border-[#00f5a0]/30 bg-[#00f5a0]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-[#00f5a0]">
                      OTP
                    </span>
                  ) : null}
                  {m.hasAttachments ? (
                    <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">
                      attachment
                    </span>
                  ) : null}
                  {m.spamFlag ? (
                    <span className="rounded border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive">
                      spam
                    </span>
                  ) : null}
                  <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {Math.round(m.sizeBytes / 1024)} KB
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
