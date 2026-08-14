import { cn } from "@/lib/utils";

/**
 * Shared dark page frame for the public content pages so blog, tools, pricing
 * and the SEO landers all share the homepage's visual language.
 */
export function PageShell({
  eyebrow,
  title,
  description,
  children,
  aside,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative min-h-screen min-w-0 overflow-x-clip bg-[#06080d] bg-ambient-radial pb-16 text-slate-200">
      <div className={cn("mx-auto w-full max-w-[1480px] min-w-0 px-3 pt-6 sm:px-5", className)}>
        <header className="mb-6 min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#00f5a0]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
          ) : null}
        </header>

        {aside ? (
          <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-6">{children}</div>
            <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">{aside}</aside>
          </div>
        ) : (
          <div className="min-w-0 space-y-6">{children}</div>
        )}
      </div>
    </div>
  );
}
