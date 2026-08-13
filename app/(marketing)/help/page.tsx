import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Help Center — Haven",
  description: "Get started with disposable inboxes, accounts, and the API.",
  path: "/help",
});

export default function HelpPage() {
  return (
    <div className="container py-12 max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-semibold">Help center</h1>
      <ul className="space-y-3">
        <li>
          <Link href="/faq" className="text-primary hover:underline">
            FAQ
          </Link>
        </li>
        <li>
          <Link href="/temporary-email" className="text-primary hover:underline">
            Using a temporary inbox
          </Link>
        </li>
        <li>
          <Link href="/developer-api" className="text-primary hover:underline">
            API quickstart
          </Link>
        </li>
        <li>
          <Link href="/contact" className="text-primary hover:underline">
            Open a ticket
          </Link>
        </li>
        <li>
          <Link href="/abuse" className="text-primary hover:underline">
            Report abuse
          </Link>
        </li>
      </ul>
    </div>
  );
}
