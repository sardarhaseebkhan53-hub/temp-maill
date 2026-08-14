"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";

interface AuthResponse {
  success: boolean;
  data?: { id: string; email: string; redirectTo?: string };
  error?: { code?: string; message?: string; details?: unknown };
}

/** Only same-origin relative paths may be used as a post-login destination. */
function safeRedirect(target: string | null | undefined, fallback: string): string {
  if (!target) return fallback;
  if (!target.startsWith("/") || target.startsWith("//")) return fallback;
  return target;
}

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload =
      mode === "login"
        ? {
            email: String(form.get("email") || ""),
            password: String(form.get("password") || ""),
            remember: form.get("remember") === "on",
          }
        : {
            email: String(form.get("email") || ""),
            password: String(form.get("password") || ""),
            name: String(form.get("name") || "") || undefined,
          };

    try {
      const res = await fetch(mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => ({}))) as AuthResponse;

      if (!res.ok || !json.success) {
        setError(
          json.error?.message ||
            (mode === "login"
              ? "We could not sign you in. Please try again."
              : "We could not create your account. Please try again."),
        );
        setBusy(false);
        return;
      }

      // The server decides where an account belongs; ?next= may only
      // narrow that to another same-origin page.
      const destination = safeRedirect(next, json.data?.redirectTo || "/dashboard");
      router.replace(destination);
      router.refresh();
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate={false}>
      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-xs font-medium text-red-300"
        >
          <AlertCircle className="mt-px size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0">{error}</span>
        </div>
      ) : null}

      {mode === "register" ? (
        <Field label="Name" htmlFor="name" hint="Optional">
          <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={80}
            placeholder="How should we greet you?"
            className={inputClass}
          />
        </Field>
      ) : null}

      <Field label="Email address" htmlFor="email">
        <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          className={inputClass}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        hint={mode === "register" ? "At least 10 characters" : undefined}
      >
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={mode === "login" ? "Your password" : "Create a strong password"}
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition-colors hover:text-slate-200"
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </Field>

      {mode === "login" ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <label className="inline-flex cursor-pointer items-center gap-2 text-slate-400">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="size-3.5 rounded border-slate-700 bg-[#070a10] accent-[#00f5a0]"
            />
            Keep me signed in
          </label>
          <Link href="/forgot-password" className="font-medium text-[#00f5a0] hover:underline">
            Forgot password?
          </Link>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00f5a0] px-5 py-3 text-sm font-bold text-[#06090e] shadow-[0_0_24px_rgba(0,245,160,0.28)] transition-all hover:bg-[#00e092] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        {busy ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : null}
        {busy
          ? mode === "login"
            ? "Signing in…"
            : "Creating account…"
          : mode === "login"
            ? "Log in"
            : "Create account"}
      </button>

      <p className="text-center text-xs text-slate-400">
        {mode === "login" ? (
          <>
            Need an account?{" "}
            <Link href="/register" className="font-semibold text-[#00f5a0] hover:underline">
              Create one
            </Link>
          </>
        ) : (
          <>
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-[#00f5a0] hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

const inputClass =
  "w-full min-w-0 rounded-xl border border-white/10 bg-[#070a10] py-3 pl-10 pr-3.5 text-sm text-white placeholder:text-slate-600 transition-colors focus:border-[#00f5a0]/60 focus:outline-none focus:ring-2 focus:ring-[#00f5a0]/20";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-300">
          {label}
        </label>
        {hint ? <span className="text-[11px] text-slate-500">{hint}</span> : null}
      </div>
      <div className="relative min-w-0">{children}</div>
    </div>
  );
}
