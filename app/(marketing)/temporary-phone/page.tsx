import { SmsPanel } from "@/components/features/sms-panel";
import { buildMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { AdSlot } from "@/components/ads/ad-slot";
import { resolveAdSlots } from "@/server/services/ads";
import { Smartphone, Users, Zap, Shield, Clock, Globe } from "lucide-react";

export const metadata = buildMetadata({
  title: "Temporary Phone Number — Receive SMS Online | Haven",
  description: "Get a free temporary phone number instantly. Receive SMS verification codes online. Perfect for signups, testing, and privacy.",
  path: "/temporary-phone",
});

const features = [
  {
    icon: Smartphone,
    title: "Instant Numbers",
    desc: "Get a real temporary number in seconds from multiple countries.",
  },
  {
    icon: Clock,
    title: "Auto Expiry",
    desc: "Numbers automatically expire after use. No long-term commitment.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    desc: "Keep your real number private. Perfect for one-time verifications.",
  },
  {
    icon: Globe,
    title: "Multiple Countries",
    desc: "Choose from US, UK, Canada, Pakistan, Germany and more.",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Choose Country",
    desc: "Select your preferred country or let us pick the best available number.",
  },
  {
    step: "02",
    title: "Get Number",
    desc: "Receive a temporary phone number instantly with a public token.",
  },
  {
    step: "03",
    title: "Receive SMS",
    desc: "All messages sent to the number appear in real-time in your inbox.",
  },
  {
    step: "04",
    title: "Done",
    desc: "Number expires automatically. No cleanup needed.",
  },
];

const outputs = [
  {
    icon: Users,
    title: "Unified Inbox",
    desc: "Clean, real-time SMS inbox with automatic code detection.",
  },
  {
    icon: Zap,
    title: "Instant Delivery",
    desc: "Messages appear within seconds of being sent.",
  },
  {
    icon: Shield,
    title: "Secure Access",
    desc: "Token-based access — only you can read your messages.",
  },
];

export default async function TemporaryPhonePage() {
  const ads = await resolveAdSlots(["TOP_LEADERBOARD", "RECTANGLE", "CONTENT"]);

  return (
    <PageShell
      path="/temporary-phone"
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Temporary Phone", path: "/temporary-phone" },
      ]}
      eyebrow="Temporary SMS"
      title="Temporary Phone Numbers"
      description="Receive SMS verification codes instantly. Free, private, and no signup required."
      aside={<AdSlot slot="RECTANGLE" resolved={ads.RECTANGLE} />}
    >
      <AdSlot slot="TOP_LEADERBOARD" resolved={ads.TOP_LEADERBOARD} />

      {/* Hero + Working SMS Panel */}
      <div className="mt-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-4 py-1 text-sm font-medium text-[#38bdf8]">
            <Smartphone className="size-4" />
            Real temporary numbers • Mock mode active
          </div>
        </div>

        <SmsPanel />
      </div>

      {/* Features Section */}
      <section className="mt-16">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            Why use Haven Temporary Numbers?
          </h2>
          <p className="mt-2 text-slate-400">Simple. Private. Reliable.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/[0.08] bg-[#0c1017]/90 p-6 transition hover:border-[#38bdf8]/40"
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#38bdf8]/10 text-[#38bdf8]">
                <feature.icon className="size-5" />
              </div>
              <h3 className="font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works - Process Section */}
      <section className="mt-16 rounded-3xl border border-white/[0.08] bg-[#0c1017]/90 p-8">
        <div className="mb-10 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            How it works
          </h2>
          <p className="mt-2 text-slate-400">Get a number and start receiving SMS in under 30 seconds</p>
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          {processSteps.map((step, index) => (
            <div key={index} className="relative">
              <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-[#38bdf8] text-sm font-bold text-black">
                {step.step}
              </div>
              <h3 className="font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Outputs Section */}
      <section className="mt-16">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            What you get
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {outputs.map((output, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/[0.08] bg-[#0c1017]/90 p-6"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-white/5">
                <output.icon className="size-5 text-[#38bdf8]" />
              </div>
              <h3 className="font-semibold text-white">{output.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{output.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Happy Clients / Trust Section */}
      <section className="mt-16 rounded-3xl border border-white/[0.08] bg-[#0c1017]/90 p-10 text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight text-white">
          Trusted by developers &amp; privacy-conscious users
        </h2>
        <p className="mx-auto mt-3 max-w-md text-slate-400">
          Used daily for account verification, testing, and protecting your real phone number.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-slate-400 md:grid-cols-4">
          <div>✓ No signup required</div>
          <div>✓ Real-time delivery</div>
          <div>✓ Auto code detection</div>
          <div>✓ Works on mobile &amp; desktop</div>
        </div>
      </section>

      <AdSlot slot="CONTENT" resolved={ads.CONTENT} />
    </PageShell>
  );
}
