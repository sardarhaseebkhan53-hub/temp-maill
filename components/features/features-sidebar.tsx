import Link from "next/link";
import { ChevronRight, Clock, Globe, Mail, Paperclip, ShieldCheck, Zap } from "lucide-react";
import { CubePremium3DIcon } from "@/components/brand/3d-icons";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Mail,
    title: "Instant & free",
    description: "A usable address without signup.",
    color: "teal",
    href: "/temporary-email",
  },
  {
    icon: Zap,
    title: "Real-time inbox",
    description: "New mail appears as it arrives.",
    color: "blue",
    href: "/temporary-inbox",
  },
  {
    icon: Clock,
    title: "Automatic expiry",
    description: "Addresses expire on schedule.",
    color: "teal",
    href: "/10-minute-mail",
  },
  {
    icon: ShieldCheck,
    title: "Sanitized & private",
    description: "Dangerous HTML and trackers are blocked.",
    color: "teal",
    href: "/private-email",
  },
  {
    icon: Globe,
    title: "Multiple domains",
    description: "Choose from available Haven domains.",
    color: "purple",
    href: "/temporary-email",
  },
  {
    icon: Paperclip,
    title: "Real attachments",
    description: "Received files are scanned and listed.",
    color: "blue",
    href: "/temporary-email",
  },
];

export function FeaturesSidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "flex min-w-0 flex-col space-y-4 rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-4 shadow-2xl backdrop-blur-xl",
        className,
      )}
    >
      <div>
        <h2 className="font-display text-base font-bold tracking-tight text-white sm:text-lg">Powerful features</h2>
        <p className="mt-0.5 text-xs text-slate-400">Supporting tools for your temporary inbox.</p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.title}
              href={feature.href}
              className="group flex min-w-0 items-center justify-between gap-3 rounded-xl border border-transparent p-2.5 transition-colors hover:border-white/[0.08] hover:bg-white/[0.04]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-xl border",
                    feature.color === "teal" && "border-[#00f5a0]/30 bg-[#00f5a0]/10 text-[#00f5a0]",
                    feature.color === "blue" && "border-sky-500/30 bg-sky-500/10 text-sky-400",
                    feature.color === "purple" && "border-purple-500/30 bg-purple-500/10 text-purple-400",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-semibold text-white transition-colors group-hover:text-[#00f5a0]">
                    {feature.title}
                  </h3>
                  <p className="mt-0.5 truncate text-[11px] leading-tight text-slate-400">{feature.description}</p>
                </div>
              </div>
              <ChevronRight className="size-3.5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-200" />
            </Link>
          );
        })}
      </div>

      <div className="relative min-w-0 rounded-xl border border-purple-500/30 bg-gradient-to-b from-[#140e28] to-[#0d0a1c] p-3.5 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
        <div className="flex min-w-0 items-start gap-3">
          <CubePremium3DIcon className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white">Go Premium</h3>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-300">
              Add custom domains, longer retention, and an ad-free experience.
            </p>
            <Link
              href="/pricing"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 transition-colors hover:text-purple-300"
            >
              Upgrade now <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
