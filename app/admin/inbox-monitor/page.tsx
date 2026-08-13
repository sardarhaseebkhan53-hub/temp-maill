import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  await requirePermission("admin.mailboxes.read");
  const rows = await prisma.emailMessage.findMany({
    orderBy: { receivedAt: "desc" },
    take: 50,
    select: {
      id: true,
      fromAddress: true,
      toAddress: true,
      subject: true,
      receivedAt: true,
      spamFlag: true,
      sizeBytes: true,
    },
  });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-2">Inbox monitor</h1>
      <p className="text-sm text-muted-foreground mb-4">Metadata only. Bodies are not shown here.</p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border bg-card p-3 text-sm">
            {r.receivedAt.toLocaleString()} · {r.toAddress} ← {r.fromAddress} · {r.subject}
            {r.spamFlag ? " · spam" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
