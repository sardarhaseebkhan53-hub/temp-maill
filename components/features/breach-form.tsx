"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BreachForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function check() {
    const res = await fetch("/api/v1/tools/breach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (json.success) setResult(json.data.summary);
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void check();
      }}
    >
      <Input placeholder="Username or email" value={username} onChange={(e) => setUsername(e.target.value)} />
      <Input type="password" placeholder="Password (checked locally)" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button type="submit">Check</Button>
      {result ? <p className="text-sm rounded-xl border bg-card p-4">{result}</p> : null}
    </form>
  );
}
