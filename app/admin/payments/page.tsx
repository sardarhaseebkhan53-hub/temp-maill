import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PaymentReview } from "@/components/features/admin-payment-review";
import { AdminPaymentMethods } from "@/components/features/admin-payment-methods";
import { listAllPaymentMethods } from "@/server/services/payment-methods";

export default async function Page() {
  await requirePermission("admin.payments.write");

  const [rows, methods, plans] = await Promise.all([
    prisma.manualPayment.findMany({
      include: { payment: true, user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    listAllPaymentMethods(),
    prisma.plan.findMany({ where: { key: { not: "FREE" } }, orderBy: { sortOrder: "asc" } }),
  ]);

  const pending = rows.filter((row) => row.adminStatus === "PENDING");

  return (
    <div className="min-w-0 space-y-8">
      <header className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">Payments</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure the methods customers may pay with, and review manual submissions. Premium is
          only ever activated here — never from a client claim.
        </p>
      </header>

      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-white">Payment methods</h2>
          <span className="text-xs text-slate-500">
            {methods.filter((method) => method.enabled).length} of {methods.length} enabled
          </span>
        </div>
        <AdminPaymentMethods
          methods={methods}
          planKeys={plans.map((plan) => String(plan.key))}
        />
      </section>

      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-white">Manual payments</h2>
          {pending.length > 0 ? (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300">
              {pending.length} awaiting review
            </span>
          ) : null}
        </div>
        <PaymentReview
          rows={rows.map((row) => {
            let plan = "—";
            try {
              const meta = JSON.parse(row.payment.rawJson || "{}") as {
                planKey?: string;
                interval?: string;
              };
              if (meta.planKey) plan = `${meta.planKey} ${meta.interval ?? ""}`.trim();
            } catch {
              /* description fallback below */
            }
            return {
              id: row.id,
              email: row.user.email,
              method: row.method,
              transactionId: row.transactionId,
              status: row.adminStatus,
              amountCents: row.payment.amountCents,
              currency: row.payment.currency,
              plan: plan === "—" ? (row.payment.description ?? "—") : plan,
              submittedAt: new Date(row.createdAt).toISOString(),
              note: row.adminNote ?? null,
            };
          })}
        />
      </section>
    </div>
  );
}
