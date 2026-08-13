"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
        name: fd.get("name"),
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) {
      toast.error(json.error?.message || "Could not continue");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      {mode === "register" ? <Input name="name" placeholder="Name" /> : null}
      <Input name="email" type="email" placeholder="Email" required autoComplete="email" />
      <Input name="password" type="password" placeholder="Password" required autoComplete={mode === "login" ? "current-password" : "new-password"} />
      <Button type="submit" loading={busy} className="w-full">
        {mode === "login" ? "Log in" : "Create account"}
      </Button>
      <p className="text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            Need an account? <Link href="/register" className="text-primary">Create one</Link>
          </>
        ) : (
          <>
            Already registered? <Link href="/login" className="text-primary">Log in</Link>
          </>
        )}
      </p>
    </form>
  );
}
