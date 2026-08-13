import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PaymentReview } from "@/components/features/admin-payment-review";

export default async function Page() {
  await requirePermission("admin.payments.write");
  const rows = await prisma.manualPayment.findMany({
    include: { payment: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-4">Payments</h1>
      <PaymentReview
        rows={rows.map((r) => ({
          id: r.id,
          email: r.user.email,
          method: r.method,
          transactionId: r.transactionId,
          status: r.adminStatus,
          amountCents: r.payment.amountCents,
          currency: r.payment.currency,
        }))}
      />
    </div>
  );
}
