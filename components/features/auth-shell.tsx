import { Check } from "lucide-react";
import { HavenMark } from "@/components/brand/logo";

const assurances = [
  "No plaintext passwords, ever",
  "httpOnly session cookies",
  "Delete your account and data at any time",
];

/**
 * Shared frame for the login and registration screens so both stay visually
 * consistent with the rest of the dark neon UI.
 */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] min-w-0 overflow-hidden bg-[#06080d] px-4 py-12 sm:px-6 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-[#00f5a0]/[0.07] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-52 right-0 size-[420px] rounded-full bg-purple-600/[0.09] blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-5xl min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <section className="hidden min-w-0 lg:block">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00f5a0]/25 bg-[#00f5a0]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#00f5a0]">
            <HavenMark className="size-4" />
            Haven account
          </div>
          <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
            Privacy tools that stay
            <span className="block text-[#00f5a0]">out of your way.</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Temporary email, aliases, and a developer API — with server-enforced expiry and mail that
            is sanitized before it reaches your screen.
          </p>
          <ul className="mt-7 space-y-3">
            {assurances.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-xs text-slate-300">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-[#00f5a0]/25 bg-[#00f5a0]/10">
                  <Check className="size-3 text-[#00f5a0]" aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#00f5a0]">
            {eyebrow}
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-white">{title}</h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">{description}</p>
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </div>
  );
}
