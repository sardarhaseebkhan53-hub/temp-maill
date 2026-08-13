import Link from "next/link";
import {
  AtSign,
  ChevronRight,
  Clock,
  Code2,
  Crown,
  Globe,
  Mail,
  Paperclip,
  QrCode,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { CubePremium3DIcon } from "@/components/brand/3d-icons";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Mail,
    title: "Instant & Free",
    desc: "Get a temp email address instantly. No signup.",
    color: "teal",
    href: "/temporary-email",
  },
  {
    icon: Zap,
    title: "Real-time Inbox",
    desc: "Receive emails in real time as soon as they arrive.",
    color: "blue",
    href: "/temporary-inbox",
  },
  {
    icon: Clock,
    title: "Auto Expiry",
    desc: "Addresses and emails expire automatically.",
    color: "teal",
    href: "/10-minute-mail",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Private",
    desc: "We sanitize HTML and block trackers.",
    color: "teal",
    href: "/private-email",
  },
  {
    icon: Globe,
    title: "Multiple Domains",
    desc: "Choose from multiple high-quality domains.",
    color: "purple",
    href: "/temporary-email",
  },
  {
    icon: QrCode,
    title: "QR & Share",
    desc: "Share your address easily with QR or link.",
    color: "teal",
    href: "/tools",
  },
  {
    icon: AtSign,
    title: "Aliases",
    desc: "Create unlimited aliases for your address.",
    color: "blue",
    href: "/dashboard/aliases",
  },
  {
    icon: Paperclip,
    title: "Attachments",
    desc: "View attachments safely and download easily.",
    color: "blue",
    href: "/temporary-email",
  },
  {
    icon: Code2,
    title: "Developer API",
    desc: "Integrate email & SMS into your apps.",
    color: "purple",
    href: "/developer-api",
  },
  {
    icon: Crown,
    title: "Premium Plans",
    desc: "Custom domain, no ads, more storage & more.",
    color: "gold",
    href: "/pricing",
  },
];

export function FeaturesSidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 backdrop-blur-xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between space-y-4",
        className,
      )}
    >
      {/* Header */}
      <div>
        <h3 className="font-display text-base sm:text-lg font-bold text-white tracking-tight">
          Powerful features
        </h3>
        <p className="text-xs text-slate-400 font-normal mt-0.5">
          Everything you need. Nothing you don't.
        </p>
      </div>

      {/* Feature Cards List */}
      <div className="space-y-1.5 flex-1">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.title}
              href={f.href}
              className="group flex items-center justify-between gap-3 p-2.5 rounded-xl border border-transparent hover:border-white/[0.08] hover:bg-white/[0.04] transition-all duration-150"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "size-8 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                    f.color === "teal" &&
                      "bg-[#00f5a0]/10 border-[#00f5a0]/30 text-[#00f5a0] shadow-[0_0_10px_rgba(0,245,160,0.15)]",
                    f.color === "blue" &&
                      "bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.15)]",
                    f.color === "purple" &&
                      "bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.15)]",
                    f.color === "gold" &&
                      "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#00f5a0] transition-colors">
                    {f.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                    {f.desc}
                  </p>
                </div>
              </div>
              <ChevronRight className="size-3.5 text-slate-500 group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Bottom Go Premium Card */}
      <div className="relative rounded-xl border border-purple-500/30 bg-gradient-to-b from-[#140e28] to-[#0d0a1c] p-3.5 shadow-[0_0_20px_rgba(139,92,246,0.15)] overflow-hidden">
        <div className="flex items-start gap-3">
          <CubePremium3DIcon className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white">Go Premium</h4>
            <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
              Unlock more features, custom domains and ad-free experience.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 mt-2 transition-colors"
            >
              <span>Upgrade Now</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
