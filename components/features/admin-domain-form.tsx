"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function DomainForm() {
  const router = useRouter();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/v1/admin/domains", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        domain: fd.get("domain"),
        eligibility: fd.get("eligibility"),
        weight: Number(fd.get("weight") || 10),
      }),
    });
    const json = await res.json();
    if (!json.success) toast.error(json.error?.message || "Failed");
    else {
      toast.success("Domain added");
      router.refresh();
    }
  }
  return (
    <form className="flex flex-wrap gap-2" onSubmit={onSubmit}>
      <Input name="domain" placeholder="new.haven.test" className="max-w-xs" required />
      <Select name="eligibility" defaultValue="FREE">
        <option value="FREE">FREE</option>
        <option value="PREMIUM_ONLY">PREMIUM_ONLY</option>
        <option value="BUSINESS_ONLY">BUSINESS_ONLY</option>
      </Select>
      <Input name="weight" type="number" defaultValue={10} className="w-24" />
      <Button type="submit">Add domain</Button>
    </form>
  );
}
