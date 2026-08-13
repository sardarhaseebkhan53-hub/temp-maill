"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicMessage } from "@/types";

export function useInboxStream(mailboxId: string | undefined, token: string | undefined) {
  const [events, setEvents] = useState<PublicMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const backoff = useRef(1000);

  useEffect(() => {
    if (!mailboxId || !token) return;
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    const startSse = () => {
      es = new EventSource(`/api/v1/inbox/stream?mailboxId=${mailboxId}&token=${token}`);
      es.onopen = () => {
        setConnected(true);
        backoff.current = 1000;
      };
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as { type?: string; message?: PublicMessage };
          if (data.type === "message.received" && data.message) {
            setEvents((prev) => [data.message!, ...prev.filter((m) => m.id !== data.message!.id)]);
          }
        } catch {
          /* heartbeat */
        }
      };
      es.onerror = () => {
        setConnected(false);
        es?.close();
        if (stopped) return;
        const wait = Math.min(15_000, backoff.current);
        backoff.current *= 1.6;
        setTimeout(startSse, wait);
        if (!poll) {
          poll = setInterval(async () => {
            const res = await fetch(`/api/v1/messages?mailboxId=${mailboxId}&token=${token}&limit=10`);
            const json = await res.json();
            if (json.success) setEvents(json.data.items);
          }, Math.min(20_000, backoff.current * 4));
        }
      };
    };

    startSse();
    return () => {
      stopped = true;
      es?.close();
      if (poll) clearInterval(poll);
    };
  }, [mailboxId, token]);

  return { events, connected };
}
