import { buildMetadata } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight, Check, Phone } from "lucide-react";

export const metadata = buildMetadata({
  title: "Receive SMS Online — Free Temporary Numbers | Haven",
  description: "Receive SMS online for free. Get temporary phone numbers instantly and read verification codes in real time.",
  path: "/sms-receiver",
});

export default function SmsReceiverPage() {
  return (
    <div className="min-h-screen bg-[#06080d] text-slate-200">
      <div className="mx-auto max-w-5xl px-6 pt-16 pb-24">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-4 py-1 text-sm font-medium text-[#38bdf8]">
            <Phone className="size-4" /> Temporary SMS
          </div>

          <h1 className="mt-6 font-display text-5xl font-bold tracking-tighter text-white">
            Receive SMS online.<br />Instantly. For free.
          </h1>
          
          <p className="mx-auto mt-4 max-w-md text-lg text-slate-400">
            Get a temporary phone number and read SMS verification codes in real time.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/temporary-phone"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#38bdf8] px-8 py-4 text-lg font-semibold text-black transition hover:bg-[#2aa7e0]"
            >
              Get a number now <ArrowRight className="size-5" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-8 py-4 text-lg font-medium hover:bg-white/5"
            >
              Back to Email
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            ["Instant Activation", "Get a number in under 5 seconds"],
            ["Real-time SMS", "Messages appear instantly in your inbox"],
            ["Multiple Countries", "US, UK, CA, PK, DE, FR and more"],
            ["Auto Expiry", "Numbers clean up automatically"],
            ["Code Detection", "Verification codes are highlighted"],
            ["No Signup", "Start receiving SMS immediately"],
          ].map(([title, desc], i) => (
            <div key={i} className="rounded-2xl border border-white/[0.08] bg-[#0c1017]/90 p-6">
              <div className="mb-3 flex items-center gap-2 text-[#38bdf8]">
                <Check className="size-5" />
                <span className="font-semibold text-white">{title}</span>
              </div>
              <p className="text-sm text-slate-400">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/temporary-phone"
            className="inline-flex items-center gap-3 text-xl font-semibold text-[#38bdf8] hover:underline"
          >
            Try it now → <ArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
