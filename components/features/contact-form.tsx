"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/v1/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        topic: fd.get("topic"),
        message: fd.get("message"),
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (json.success) {
      toast.success("Message received");
      e.currentTarget.reset();
    } else toast.error(json.error?.message || "Could not send");
  }
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <Input name="name" placeholder="Name" required />
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="topic" placeholder="Topic" required />
      <textarea
        name="message"
        required
        minLength={10}
        className="w-full min-h-32 rounded-lg border bg-card p-3 text-sm"
        placeholder="How can we help?"
      />
      <Button type="submit" loading={busy}>
        Send
      </Button>
    </form>
  );
}
