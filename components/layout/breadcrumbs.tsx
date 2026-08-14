import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Crumb } from "@/lib/seo";

/**
 * Visible breadcrumb trail. BreadcrumbList structured data is only emitted on
 * pages that render this, so the markup always matches what a user can see.
 */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-[11px] text-slate-500">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex min-w-0 items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="size-3 shrink-0 text-slate-700" aria-hidden="true" />
              ) : null}
              {last ? (
                <span className="truncate font-medium text-slate-400" aria-current="page">
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={crumb.path}
                  className="truncate transition-colors hover:text-[#00f5a0]"
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
