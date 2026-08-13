"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function SessionList({
  sessions,
}: {
  sessions: { id: string; ip: string | null; userAgent: string | null; lastSeenAt: string }[];
}) {
  const router = useRouter();
  async function revoke(id: string) {
    await fetch(`/api/v1/sessions/${id}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <ul className="space-y-2">
      {sessions.map((s) => (
        <li key={s.id} className="rounded-xl border bg-card p-4 flex justify-between gap-3">
          <div className="text-sm">
            <p>{s.ip}</p>
            <p className="text-xs text-muted-foreground truncate max-w-md">{s.userAgent}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => revoke(s.id)}>
            Revoke
          </Button>
        </li>
      ))}
    </ul>
  );
}
