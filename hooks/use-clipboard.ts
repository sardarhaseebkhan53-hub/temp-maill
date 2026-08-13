"use client";

import { useState } from "react";
import { toast } from "sonner";

export function useClipboard() {
  const [copied, setCopied] = useState(false);
  async function copy(text: string, ok = "Copied") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(ok);
      setTimeout(() => setCopied(false), 1500);
      return true;
    } catch {
      toast.error("Could not copy");
      return false;
    }
  }
  return { copied, copy };
}
