import { requirePermission } from "@/lib/auth";
import { getEnv } from "@/config/env";
import { getCaptchaProvider } from "@/server/providers/captcha";
import { isMeaningfulSecret } from "@/lib/secrets";

/**
 * CAPTCHA admin page. Shows the configured provider, whether the
 * site-key + secret are present, and how the operator switches between
 * none / Turnstile / hCaptcha without redeploying.
 */
export default async function Page() {
  await requirePermission("admin.security.write");
  const env = getEnv();
  const provider = getCaptchaProvider();
  const providerKey = env.CAPTCHA_PROVIDER;

  const envRows = [
    { label: "CAPTCHA_PROVIDER", value: providerKey, present: true },
    { label: "TURNSTILE_SITE_KEY", present: Boolean(env.TURNSTILE_SITE_KEY) },
    { label: "TURNSTILE_SECRET_KEY", present: isMeaningfulSecret(env.TURNSTILE_SECRET_KEY), secret: true },
    { label: "HCAPTCHA_SITE_KEY", present: Boolean(env.HCAPTCHA_SITE_KEY) },
    { label: "HCAPTCHA_SECRET_KEY", present: isMeaningfulSecret(env.HCAPTCHA_SECRET_KEY), secret: true },
  ];

  const turnstileReady =
    providerKey === "turnstile" && Boolean(env.TURNSTILE_SITE_KEY) && isMeaningfulSecret(env.TURNSTILE_SECRET_KEY);
  const hcaptchaReady =
    providerKey === "hcaptcha" && Boolean(env.HCAPTCHA_SITE_KEY) && isMeaningfulSecret(env.HCAPTCHA_SECRET_KEY);
  const noneReady = providerKey === "none";
  const isReady = noneReady || turnstileReady || hcaptchaReady;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">CAPTCHA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The provider that gates anonymous abuse vectors (signup, contact form, abuse report,
          and select API surfaces). Disabled by default; recommended in production.
        </p>
      </div>

      <section
        className={`rounded-xl border p-4 text-sm ${
          isReady ? "border-success/30 bg-success/10" : "border-warning/30 bg-warning/10"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Active provider: {providerKey}</h2>
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider ${
              isReady
                ? "border-success/30 bg-success/15 text-success"
                : "border-warning/30 bg-warning/15 text-warning"
            }`}
          >
            {isReady ? "CONFIGURED" : "DISABLED / INCOMPLETE"}
          </span>
        </div>
        <p className="mt-2 text-xs">
          {providerKey === "none"
            ? "CAPTCHA_PROVIDER=none. Anonymous abuse protection is reduced; rate limits and manual review carry the load."
            : providerKey === "turnstile"
              ? "Cloudflare Turnstile is selected. Site key is served to the client; secret verifies server-side."
              : "hCaptcha is selected. Site key is served to the client; secret verifies server-side."}
        </p>
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
        <h2 className="font-semibold">Switching providers</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
          <li>
            Set <code>CAPTCHA_PROVIDER=turnstile</code> or <code>CAPTCHA_PROVIDER=hcaptcha</code> in
            the deployment environment.
          </li>
          <li>
            Set the matching site key (public) and secret (server-only) variables. The
            secret is never sent to the client.
          </li>
          <li>
            Restart the application. The page forms and APIs begin verifying tokens
            automatically.
          </li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">
          Provider: <code>{provider.key}</code>. No application code change is required to
          switch.
        </p>
      </section>
    </div>
  );
}
