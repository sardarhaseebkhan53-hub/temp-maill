import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/page-shell";
import { AdSlot } from "@/components/ads/ad-slot";
import { resolveAdSlots } from "@/server/services/ads";

export const metadata = buildMetadata({
  title: "Developer API — Haven",
  description:
    "Authenticate with hashed API keys. Create mailboxes, read messages, and subscribe to webhooks.",
  path: "/developer-api",
});

const endpoints: [string, string][] = [
  ["POST /api/v1/mailboxes", "Create a mailbox"],
  ["GET /api/v1/mailboxes", "List mailboxes"],
  ["GET /api/v1/mailboxes/:id", "Read a mailbox"],
  ["DELETE /api/v1/mailboxes/:id", "Purge a mailbox"],
  ["GET /api/v1/messages", "List messages"],
  ["GET /api/v1/messages/:id", "Read a message"],
  ["DELETE /api/v1/messages/:id", "Delete a message"],
  ["GET /api/v1/messages/:id/attachments/:attachmentId", "Download an attachment"],
  ["POST/GET/DELETE /api/v1/webhooks", "Manage webhooks"],
  ["GET /api/v1/usage", "Read usage counters"],
];

const examples: [string, string][] = [
  [
    "curl",
    `curl -X POST https://example.com/api/v1/mailboxes \\
  -H "Authorization: Bearer tmp_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{}'`,
  ],
  [
    "javascript",
    `const res = await fetch("/api/v1/mailboxes", {
  method: "POST",
  headers: { Authorization: "Bearer tmp_live_…", "Content-Type": "application/json" },
  body: JSON.stringify({}),
});
const { data } = await res.json();`,
  ],
  [
    "python",
    `import requests

r = requests.post(
    "https://example.com/api/v1/mailboxes",
    headers={"Authorization": "Bearer tmp_live_…"},
    json={},
)
print(r.json())`,
  ],
  [
    "php",
    `$ch = curl_init("https://example.com/api/v1/mailboxes");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer tmp_live_…"]);
curl_setopt($ch, CURLOPT_POST, true);
echo curl_exec($ch);`,
  ],
];

export default async function DeveloperApiPage() {
  const ads = await resolveAdSlots(["TOP_LEADERBOARD", "RECTANGLE", "CONTENT"]);

  return (
    <PageShell
      eyebrow="Developer API"
      title="Haven API"
      description="Provision disposable inboxes from the tools you already run. Keys are hashed at rest, prefixed tmp_live_ / tmp_test_, and rate-limited per key."
      aside={
        <>
          <AdSlot slot="RECTANGLE" resolved={ads.RECTANGLE} />
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-4">
            <h2 className="text-sm font-bold text-white">Get a key</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              Create and rotate API keys from your dashboard after you register.
            </p>
            <Link
              href="/dashboard/api-keys"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#00f5a0] px-4 py-2.5 text-xs font-bold text-[#06090e] transition-colors hover:bg-[#00e092]"
            >
              Open API keys
            </Link>
          </div>
        </>
      }
    >
      <AdSlot slot="TOP_LEADERBOARD" resolved={ads.TOP_LEADERBOARD} />

      <section className="min-w-0">
        <h2 className="mb-3 font-display text-lg font-bold text-white">Endpoints</h2>
        <ul className="min-w-0 divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1017]/95">
          {endpoints.map(([route, description]) => (
            <li
              key={route}
              className="flex min-w-0 flex-col gap-1 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <code className="min-w-0 break-all font-mono text-xs text-[#7dffcd]">{route}</code>
              <span className="shrink-0 text-[11px] text-slate-400">{description}</span>
            </li>
          ))}
        </ul>
      </section>

      <AdSlot slot="CONTENT" resolved={ads.CONTENT} />

      <section className="min-w-0">
        <h2 className="mb-3 font-display text-lg font-bold text-white">Examples</h2>
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          {examples.map(([language, code]) => (
            <div key={language} className="min-w-0">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {language}
              </p>
              <pre className="min-w-0 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#070a10] p-4 text-xs leading-relaxed text-slate-300">
                <code>{code}</code>
              </pre>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
