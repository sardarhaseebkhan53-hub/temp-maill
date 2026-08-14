import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ManualPayForm } from "@/components/features/manual-pay-form";
import { listActivePaymentMethods } from "@/server/services/payment-methods";
import { getPlanByKey } from "@/server/services/plans";
import { formatMoney } from "@/lib/utils";

export default async function ManualPayPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; interval?: string; currency?: string }>;
}) {
  await requireUser();

  const sp = await searchParams;
  const planKey = sp.plan || "PRO";
  const interval = sp.interval || "month";
  const currency = (sp.currency || "USD").toUpperCase();

  const [plan, allMethods] = await Promise.all([
    getPlanByKey(planKey),
    listActivePaymentMethods(planKey),
  ]);

  // Stripe is handled by hosted checkout, not by this manual form.
  const methods = allMethods.filter((method) => method.kind === "MANUAL");

  const price = plan?.prices.find(
    (p: { currency: string; interval: string; active: boolean }) =>
      p.currency === currency && p.interval === interval && p.active,
  );

  return (
    <div className="min-w-0">
      <Link
        href="/dashboard/billing"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-[#00f5a0]"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to billing
      </Link>

      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Manual payment
      </h1>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        Pay with a method your operator has enabled, then submit the transaction reference. Premium
        activates only after the payment is verified.
      </p>

      <div className="mt-6 max-w-xl min-w-0">
        <ManualPayForm
          planKey={planKey}
          interval={interval}
          currency={currency}
          amountLabel={
            price ? `${formatMoney(price.amountCents, price.currency)} / ${interval}` : "See pricing"
          }
          methods={methods.map((method) => ({
            key: method.key,
            displayName: method.displayName,
            description: method.description,
            instructions: method.instructions,
            accountNumber: method.accountNumber,
            accountTitle: method.accountTitle,
            merchantId: method.merchantId,
            iban: method.iban,
            bankName: method.bankName,
            qrImageUrl: method.qrImageUrl,
            currency: method.currency,
          }))}
        />
      </div>
    </div>
  );
}
