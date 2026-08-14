// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MobileMessageReader } from "@/components/features/mobile-message-reader";
import { InboxGenerator } from "@/components/features/generator";
import type { PublicMessageDetail } from "@/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: vi.fn(), resolvedTheme: "dark" }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  Toaster: () => null,
}));

// jsdom has no EventSource; stub it so the inbox stream hook can mount.
class StubEventSource {
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public url: string) {}
  close() {}
}

const sampleDetail: PublicMessageDetail = {
  id: "m1",
  fromAddress: "sender@example.org",
  fromName: "Sender",
  toAddress: "user@haven.test",
  subject: "Your code",
  snippet: "123456",
  receivedAt: new Date().toISOString(),
  read: true,
  hasAttachments: false,
  spamFlag: false,
  sizeBytes: 1024,
  textBody: "Your verification code is 123456",
  htmlSafe: "<p>Your verification code is 123456</p>",
  attachments: [],
};

beforeEach(() => {
  Object.assign(globalThis, { EventSource: StubEventSource });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.style.overflow = "";
});

describe("mobile navigation", () => {
  it("opens an accessible drawer with login and register actions", () => {
    render(<Navbar user={null} locale="en" />);
    const toggle = screen.getByRole("button", { name: /open menu/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    const menu = document.getElementById("mobile-menu");
    expect(menu).toBeTruthy();
    const drawer = screen.getByRole("navigation", { name: "Mobile" });
    expect(drawer).toBeInTheDocument();
    for (const label of ["Home", "Temp Email", "SMS", "API", "Pricing", "Tools", "Blog"]) {
      expect(within(drawer).getByText(label)).toBeInTheDocument();
    }
    // The drawer itself carries the auth actions (the desktop buttons also
    // exist in the DOM, hidden by CSS that jsdom does not apply).
    const menuRoot = document.getElementById("mobile-menu") as HTMLElement;
    expect(within(menuRoot).getByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(within(menuRoot).getByRole("link", { name: "Create account" })).toBeInTheDocument();
    // An open drawer must lock page scroll behind it.
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("closes on Escape and restores scroll", () => {
    render(<Navbar user={null} locale="en" />);
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));
    expect(document.getElementById("mobile-menu")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.getElementById("mobile-menu")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("footer", () => {
  it("renders collapsible accordion sections for mobile", () => {
    const { container } = render(<Footer />);
    const details = container.querySelectorAll("details");
    expect(details.length).toBeGreaterThanOrEqual(6);
    for (const title of ["Product", "Privacy", "Tools", "Resources", "Company", "Legal"]) {
      expect(screen.getAllByText(title).length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("form controls", () => {
  it("uses 16px+ text on mobile so iOS Safari never zooms on focus", () => {
    const { container: inputContainer } = render(<Input aria-label="field" />);
    expect(inputContainer.querySelector("input")).toHaveClass("text-base");

    const { container: selectContainer } = render(
      <Select aria-label="choice">
        <option>a</option>
      </Select>,
    );
    expect(selectContainer.querySelector("select")).toHaveClass("text-base");
  });
});

describe("mobile message reader", () => {
  it("renders a dedicated full-screen reader with a labelled back action", () => {
    const onBack = vi.fn();
    render(
      <MobileMessageReader
        message={sampleDetail}
        mailboxToken="tok"
        onBack={onBack}
        onDelete={vi.fn()}
        onUnread={vi.fn()}
        onReport={vi.fn()}
        onBlock={vi.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    const back = screen.getByRole("button", { name: /back to inbox/i });
    expect(back).toBeInTheDocument();
    fireEvent.click(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape and locks body scroll while open", () => {
    const onBack = vi.fn();
    const { unmount } = render(
      <MobileMessageReader
        message={sampleDetail}
        mailboxToken="tok"
        onBack={onBack}
        onDelete={vi.fn()}
        onUnread={vi.fn()}
        onReport={vi.fn()}
        onBlock={vi.fn()}
      />,
    );
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onBack).toHaveBeenCalled();
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("temporary inbox", () => {
  it("shows an empty, ready inbox — never fake or sample emails", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/messages")) {
        return new Response(JSON.stringify({ success: true, data: { items: [], nextCursor: null } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      if (url.includes("/api/v1/mailboxes/")) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              id: "box1",
              address: "user@haven.test",
              localPart: "user",
              domain: "haven.test",
              state: "ACTIVE",
              expiresAt: new Date(Date.now() + 600_000).toISOString(),
              createdAt: new Date().toISOString(),
              messageCount: 0,
              unreadCount: 0,
              custom: false,
              publicToken: "tok",
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ success: true, data: {} }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <InboxGenerator
        initialMailbox={{
          id: "box1",
          address: "user@haven.test",
          localPart: "user",
          domain: "haven.test",
          state: "ACTIVE",
          expiresAt: new Date(Date.now() + 600_000).toISOString(),
          createdAt: new Date().toISOString(),
          messageCount: 0,
          unreadCount: 0,
          custom: false,
          publicToken: "tok",
        }}
        domains={[{ id: "d1", domain: "haven.test", eligibility: "FREE" }]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/your inbox is ready/i)).toBeInTheDocument();
    });
    // No message rows are fabricated for known brands or anything else.
    for (const brand of ["GitHub", "Netflix", "Discord", "Amazon", "Microsoft"]) {
      expect(screen.queryByText(new RegExp(brand, "i"))).not.toBeInTheDocument();
    }
  });
});
