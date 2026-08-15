import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEnv } from "@/config/env";

/**
 * Storage admin page. Surfaces the active driver, where attachments
 * live, and the size of the on-disk footprint when the local driver
 * is in use. Secrets (S3 access keys) are never rendered.
 */
export default async function Page() {
  await requirePermission("admin.settings.write");
  const env = getEnv();
  const [attachmentCount, messageCount] = await Promise.all([
    prisma.emailAttachment.count().catch(() => 0),
    prisma.emailMessage.count().catch(() => 0),
  ]);

  const envRows = [
    { label: "STORAGE_DRIVER", value: env.STORAGE_DRIVER, present: true },
    { label: "S3_ENDPOINT", present: Boolean(env.S3_ENDPOINT), secret: false },
    { label: "S3_REGION", value: env.S3_REGION || "", present: Boolean(env.S3_REGION) },
    { label: "S3_BUCKET", value: env.S3_BUCKET || "", present: Boolean(env.S3_BUCKET) },
    { label: "S3_ACCESS_KEY", present: Boolean(env.S3_ACCESS_KEY), secret: true },
    { label: "S3_SECRET_KEY", present: Boolean(env.S3_SECRET_KEY), secret: true },
  ];

  const isLocal = env.STORAGE_DRIVER === "local";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Storage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Attachment storage backend. Local filesystem in dev; S3-compatible in production.
          Attachment metadata is always in the database; the driver only changes where the
          file bytes live.
        </p>
      </div>

      <section
        className={`rounded-xl border p-4 text-sm ${
          isLocal
            ? "border-warning/30 bg-warning/10"
            : "border-success/30 bg-success/10"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Active driver: {env.STORAGE_DRIVER}</h2>
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider ${
              isLocal
                ? "border-warning/30 bg-warning/15 text-warning"
                : "border-success/30 bg-success/15 text-success"
            }`}
          >
            {isLocal ? "DEV / LOCAL" : "PRODUCTION"}
          </span>
        </div>
        <p className="mt-2 text-xs">
          {isLocal
            ? "Attachments are written under database/data/attachments/. Acceptable for dev and small deployments. Switch to S3-compatible storage for production."
            : "Object storage is configured. Attachments are written to the S3-compatible bucket; metadata stays in the database."}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Attachments
          </p>
          <p className="mt-1 text-2xl font-semibold">{attachmentCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mail messages
          </p>
          <p className="mt-1 text-2xl font-semibold">{messageCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Driver
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold">{env.STORAGE_DRIVER}</p>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Environment configuration</h2>
        <ul className="mt-2 space-y-1 font-mono text-xs">
          {envRows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{row.label}</span>
              <span
                className={row.present ? "text-foreground" : "text-muted-foreground italic"}
              >
                {row.present
                  ? (row as { secret?: boolean }).secret
                    ? "configured (hidden)"
                    : (row as { value?: string }).value || "—"
                  : "unset"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border bg-card p-4 text-sm">
        <h2 className="font-semibold">Switching to S3-compatible storage</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
          <li>Set <code>STORAGE_DRIVER=s3</code>.</li>
          <li>
            Set <code>S3_ENDPOINT</code>, <code>S3_REGION</code>, and <code>S3_BUCKET</code> to the
            values supplied by your provider.
          </li>
          <li>
            Set <code>S3_ACCESS_KEY</code> and <code>S3_SECRET_KEY</code> as server-side
            environment variables (never in the database or the admin UI).
          </li>
          <li>
            Restart the application. Existing local attachments remain on disk; new ones
            upload to S3.
          </li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">
          Application code does not change — the <code>StorageDriver</code> interface is the
          only contract.
        </p>
      </section>
    </div>
  );
}
