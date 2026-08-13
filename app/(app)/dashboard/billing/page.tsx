import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function BillingPage() {
  const { user } = await requireUser();
  const [subs, payments] = await Promise.all([
    prisma.subscription.findMany({ where: { userId: user.id }, include: { plan: true }, orderBy: { createdAt: "desc" } }),
    prisma.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Billing</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Current plan {user.planKey}. Premium never activates from a client claim.
      </p>
      <Link href="/pricing" className="inline-block mt-4 text-sm text-primary">
        Change plan
      </Link>
      <h2 className="font-semibold mt-8 mb-2">Subscriptions</h2>
      <ul className="space-y-2">
        {subs.map((s) => (
          <li key={s.id} className="rounded-xl border bg-card p-4 text-sm">
            {s.plan.name} · {s.status} · ends {s.currentPeriodEnd.toLocaleDateString()}
          </li>
        ))}
        {subs.length === 0 ? <p className="text-sm text-muted-foreground">No subscriptions.</p> : null}
      </ul>
      <h2 className="font-semibold mt-8 mb-2">Payments</h2>
      <ul className="space-y-2">
        {payments.map((p) => (
          <li key={p.id} className="rounded-xl border bg-card p-4 text-sm">
            {p.provider} · {p.status} · {(p.amountCents / 100).toFixed(2)} {p.currency}
          </li>
        ))}
      </ul>
    </div>
  );
}
