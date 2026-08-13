import { buildMetadata } from "@/lib/seo";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Developer API — Haven",
  description: "Authenticate with hashed API keys. Create mailboxes, read messages, and subscribe to webhooks.",
  path: "/developer-api",
});

const examples = {
  curl: `curl -X POST https://example.com/api/v1/mailboxes \\
  -H "Authorization: Bearer tmp_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{}'`,
  js: `const res = await fetch("/api/v1/mailboxes", {
  method: "POST",
  headers: { Authorization: "Bearer tmp_live_…", "Content-Type": "application/json" },
  body: JSON.stringify({}),
});
const { data } = await res.json();`,
  python: `import requests
r = requests.post("https://example.com/api/v1/mailboxes",
  headers={"Authorization": "Bearer tmp_live_…"},
  json={})
print(r.json())`,
  php: `$ch = curl_init("https://example.com/api/v1/mailboxes");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer tmp_live_…"]);
curl_setopt($ch, CURLOPT_POST, true);
echo curl_exec($ch);`,
};

export default function DeveloperApiPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="font-display text-4xl font-semibold">Haven API</h1>
      <p className="mt-3 text-muted-foreground">
        Provision disposable inboxes from the tools you already run. Keys are hashed at rest, prefixed{" "}
        <code className="text-xs">tmp_live_</code> / <code className="text-xs">tmp_test_</code>, and rate-limited per key.
      </p>
      <div className="mt-8 rounded-2xl border bg-card p-5 space-y-2 text-sm">
        <p>
          <code>POST /api/v1/mailboxes</code> — create
        </p>
        <p>
          <code>GET /api/v1/mailboxes</code> — list
        </p>
        <p>
          <code>GET /api/v1/mailboxes/:id</code> — read
        </p>
        <p>
          <code>DELETE /api/v1/mailboxes/:id</code> — purge
        </p>
        <p>
          <code>GET /api/v1/messages</code> — list
        </p>
        <p>
          <code>GET /api/v1/messages/:id</code> — read
        </p>
        <p>
          <code>DELETE /api/v1/messages/:id</code> — delete
        </p>
        <p>
          <code>GET /api/v1/messages/:id/attachments/:attachmentId</code>
        </p>
        <p>
          <code>POST/GET/DELETE /api/v1/webhooks</code>
        </p>
        <p>
          <code>GET /api/v1/usage</code>
        </p>
      </div>
      <h2 className="font-display text-2xl font-semibold mt-10 mb-3">Examples</h2>
      {Object.entries(examples).map(([lang, code]) => (
        <div key={lang} className="mb-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{lang}</p>
          <pre className="rounded-xl bg-haven-950 text-haven-50 p-4 text-xs overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>
      ))}
      <p className="mt-8 text-sm">
        Create a key in the <Link href="/dashboard/api-keys" className="text-primary hover:underline">dashboard</Link> after you register.
      </p>
    </div>
  );
}
