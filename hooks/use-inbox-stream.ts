"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicMessage } from "@/types";

interface MessagePageResponse {
  success: boolean;
  data?: { items?: PublicMessage[] };
}

export function useInboxStream(mailboxId: string | undefined, token: string | undefined) {
  const [events, setEvents] = useState<PublicMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const backoff = useRef(1000);

  useEffect(() => {
    if (!mailboxId || !token) return;

    let eventSource: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    const knownIds = new Set<string>();

    const recordIncoming = (incoming: PublicMessage[]) => {
      const fresh = incoming.filter((message) => !knownIds.has(message.id));
      for (const message of incoming) knownIds.add(message.id);
      if (fresh.length > 0) {
        setEvents((current) => [
          ...fresh,
          ...current.filter((message) => !fresh.some((item) => item.id === message.id)),
        ].slice(0, 100));
      }
    };

    const fetchCurrentMessages = async (announceNew: boolean) => {
      try {
        const res = await fetch(`/api/v1/messages?mailboxId=${mailboxId}&token=${token}&limit=100`, {
          cache: "no-store",
        });
        const json = (await res.json()) as MessagePageResponse;
        if (!res.ok || !json.success || !json.data?.items) return;
        if (announceNew) {
          recordIncoming(json.data.items);
        } else {
          for (const message of json.data.items) knownIds.add(message.id);
        }
      } catch {
        // The generator has a manual refresh action when the connection is unavailable.
      }
    };

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        void fetchCurrentMessages(true);
      }, 12_000);
    };

    const startSse = () => {
      if (stopped) return;
      eventSource = new EventSource(`/api/v1/inbox/stream?mailboxId=${mailboxId}&token=${token}`);
      eventSource.onopen = () => {
        setConnected(true);
        backoff.current = 1000;
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      };
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { type?: string; message?: PublicMessage };
          if (data.type === "message.received" && data.message) {
            recordIncoming([data.message]);
          }
        } catch {
          // Ignore malformed events and heartbeat payloads.
        }
      };
      eventSource.onerror = () => {
        setConnected(false);
        eventSource?.close();
        if (stopped) return;
        startPolling();
        const wait = Math.min(15_000, backoff.current);
        backoff.current = Math.min(15_000, backoff.current * 1.6);
        reconnectTimer = setTimeout(startSse, wait);
      };
    };

    setEvents([]);
    setConnected(false);
    void fetchCurrentMessages(false);
    startSse();

    return () => {
      stopped = true;
      eventSource?.close();
      if (pollTimer) clearInterval(pollTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [mailboxId, token]);

  return { events, connected };
}
