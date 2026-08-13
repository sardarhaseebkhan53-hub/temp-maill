import Link from "next/link";
import { HavenWordmark } from "@/components/brand/logo";

const cols = [
  {
    title: "Product",
    links: [
      ["/temporary-email", "Temporary email"],
      ["/temporary-phone", "Temporary phone"],
      ["/developer-api", "Developer API"],
      ["/pricing", "Pricing"],
      ["/tools", "Tools"],
      ["/blog", "Blog"],
      ["/faq", "FAQ"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["/privacy", "Privacy"],
      ["/terms", "Terms"],
      ["/cookies", "Cookies"],
      ["/acceptable-use", "Acceptable use"],
      ["/abuse", "Abuse"],
      ["/security", "Security"],
    ],
  },
  {
    title: "Company",
    links: [
      ["/contact", "Contact"],
      ["/help", "Help"],
      ["/status", "Status"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-card/40 no-print mt-16">
      <div className="container py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <HavenWordmark />
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            A shorter memory for the mail you do not need to keep.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-semibold mb-3">{c.title}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href ?? "/"} className="hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container pb-10 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Haven. All rights reserved.
      </div>
    </footer>
  );
}
