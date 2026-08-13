"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function UserActions({ id, status, notes }: { id: string; status: string; notes: string }) {
  const router = useRouter();
  async function act(action: string) {
    const res = await fetch(`/api/v1/admin/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    if (!json.success) toast.error(json.error?.message || "Denied");
    else {
      toast.success("Updated");
      router.refresh();
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => act(status === "SUSPENDED" ? "unsuspend" : "suspend")}>
        {status === "SUSPENDED" ? "Unsuspend" : "Suspend"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => act(status === "BANNED" ? "unban" : "ban")}>
        {status === "BANNED" ? "Unban" : "Ban"}
      </Button>
      <p className="text-xs text-muted-foreground w-full mt-2">Internal notes: {notes || "—"}</p>
    </div>
  );
}
