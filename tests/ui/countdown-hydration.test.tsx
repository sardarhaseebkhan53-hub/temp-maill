// @vitest-environment jsdom

import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MailboxCard } from "@/components/features/mailbox-card";
import { ExpiryTimer } from "@/components/features/expiry-timer";
import type { PublicMailbox } from "@/types";

const mailbox: PublicMailbox = {
  id: "box-hydration",
  address: "timer@mail.haven.test",
  localPart: "timer",
  domain: "mail.haven.test",
  state: "ACTIVE",
  expiresAt: "2026-08-15T12:10:00.000Z",
  createdAt: "2026-08-15T12:00:00.000Z",
  custom: false,
  publicToken: "token",
  messageCount: 0,
  unreadCount: 0,
  deliveryReady: false,
  deliveryStatus: "DEVELOPMENT",
  deliveryProvider: "mock",
  deliveryDetail: "Development test mode",
};

function card() {
  return (
    <MailboxCard
      mailbox={mailbox}
      onRefresh={async () => undefined}
      onDelete={async () => undefined}
      onExtend={async () => undefined}
    />
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("countdown hydration", () => {
  it("renders a deterministic mailbox-card first frame across different clocks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T12:00:00.100Z"));
    const server = renderToString(card());
    vi.setSystemTime(new Date("2026-08-15T12:00:01.900Z"));
    const browser = renderToString(card());

    expect(server).toBe(browser);
    expect(server).toContain("Expires in --:--");
  });

  it("hydrates both countdown components without a mismatch", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T12:00:00.100Z"));
    const markup = renderToString(
      <div>
        {card()}
        <ExpiryTimer expiresAt={mailbox.expiresAt} state="ACTIVE" />
      </div>,
    );
    const container = document.createElement("div");
    container.innerHTML = markup;
    document.body.appendChild(container);
    vi.setSystemTime(new Date("2026-08-15T12:00:01.900Z"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(
        container,
        <div>
          {card()}
          <ExpiryTimer expiresAt={mailbox.expiresAt} state="ACTIVE" />
        </div>,
      );
    });

    const errors = consoleError.mock.calls.flat().join(" ");
    expect(errors).not.toMatch(/hydration|didn't match|server rendered/i);
    expect(container.textContent).toContain("09:58");

    await act(async () => root?.unmount());
    container.remove();
  });
});
