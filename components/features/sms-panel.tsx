"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";

interface NumberRow {
  id: string;
  e164: string;
  country: string;
  expiresAt: string;
  status: string;
}

interface Msg {
  id: string;
  fromNumber: string;
  body: string;
  receivedAt: string;
}

export function SmsPanel() {
  const [country, setCountry] = useState("");
  const [num, setNum] = useState<NumberRow | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);

  async function provision() {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/sms/numbers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ country: country || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Unavailable");
      setNum(json.data);
      toast.success("Number reserved");
      await load(json.data.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not get a number");
    } finally {
      setBusy(false);
    }
  }

  async function load(id: string) {
    const res = await fetch(`/api/v1/sms/numbers/${id}/messages`);
    const json = await res.json();
    if (json.success) setMessages(json.data);
  }

  async function release() {
    if (!num) return;
    await fetch(`/api/v1/sms/numbers/${num.id}`, { method: "DELETE" });
    setNum(null);
    setMessages([]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={country} onChange={(e) => setCountry(e.target.value)} className="max-w-xs">
          <option value="">Any country</option>
          <option value="US">United States</option>
          <option value="GB">United Kingdom</option>
          <option value="PK">Pakistan</option>
        </Select>
        <Button loading={busy} onClick={provision}>
          Get a number
        </Button>
        {num ? (
          <Button variant="outline" onClick={release}>
            Release
          </Button>
        ) : null}
      </div>
      {num ? (
        <div className="rounded-2xl border bg-card p-5">
          <p className="font-mono text-xl">{num.e164}</p>
          <p className="text-xs text-muted-foreground mt-1">Expires {new Date(num.expiresAt).toLocaleString()}</p>
          <Button size="sm" variant="ghost" className="mt-3" onClick={() => load(num.id)}>
            Refresh messages
          </Button>
        </div>
      ) : null}
      <ul className="space-y-2">
        {messages.map((m) => (
          <li key={m.id} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{m.fromNumber}</p>
            <p className="mt-1">{m.body}</p>
          </li>
        ))}
        {num && messages.length === 0 ? <p className="text-sm text-muted-foreground">No SMS yet.</p> : null}
      </ul>
    </div>
  );
}
