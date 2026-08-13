import { SeoLanding } from "@/components/features/seo-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Temp Mail — Fast Disposable Inbox",
  description: "A fast temp mail inbox with live delivery, copy, QR, and a countdown that reflects server state.",
  path: "/temp-mail",
});

export default function Page() {
  return (
    <SeoLanding
      path="/temp-mail"
      title="Temp mail without the waiting room"
      lede="Some temp-mail tools hide the address behind a button or a captcha wall. Haven issues an inbox as the page loads and keeps the actions — copy, refresh, extend — on the same card."
      body={[
        {
          heading: "Live, not polled to death",
          copy: "New messages arrive over a server-sent event stream. If the stream drops, the client falls back to capped, backed-off polling.",
        },
        {
          heading: "A clock you can trust",
          copy: "The badge turns amber and red from server state, not from a guess in the browser. When the job expires a box, the UI follows.",
        },
        {
          heading: "Share when you must",
          copy: "Copy, native share, or a QR code with a proper quiet zone. Useful for moving an address to another device you control.",
        },
        {
          heading: "What we will not say",
          copy: "This is not untraceable mail. It is a disposable inbox with short retention and honest copy.",
        },
      ]}
      faqs={[
        { q: "Why did my address change?", a: "Refreshing issues a new mailbox. The old one is purged so it cannot keep receiving." },
        { q: "Can I keep it longer?", a: "Extend up to the configured maximum, or use a paid plan with a longer default TTL." },
      ]}
    />
  );
}
