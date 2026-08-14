import { SeoLanding } from "@/components/features/seo-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Temporary Email for Verification Codes",
  description:
    "Receive verification emails and one-time codes in a temporary inbox. Delivery is live, messages are sanitized, and you can extend the address if a sender is slow.",
  path: "/temporary-email-for-verification",
});

export default function Page() {
  return (
    <SeoLanding
      path="/temporary-email-for-verification"
      crumbLabel="For verification"
      title="Receiving verification emails in a temporary inbox"
      lede="Most temporary addresses exist to catch exactly one message: a confirmation link or a six-digit code. Haven is built so that message arrives quickly and is safe to open."
      body={[
        {
          heading: "Live delivery, not manual refreshing",
          copy: "Messages stream to the open inbox over a server-sent event connection, so a code usually appears within a second or two of the sender dispatching it. If the stream drops, the client falls back to backed-off polling automatically.",
        },
        {
          heading: "Codes stay readable",
          copy: "Sanitization removes scripts and dangerous URIs but preserves the text you actually need. Codes and links remain selectable and copyable, and the plain-text alternative is kept when a sender provides one.",
        },
        {
          heading: "When the sender is slow",
          copy: "Some providers queue verification mail for several minutes. If the countdown is running low, extend the mailbox up to the configured maximum rather than generating a new address — a new address will never receive the message already in flight.",
        },
        {
          heading: "Verify only what is yours",
          copy: "This is for confirming accounts and services you legitimately own or are testing. Haven is not intended for defeating another operator's anti-fraud controls or registering accounts at scale, and that is set out in the acceptable use policy.",
        },
      ]}
      faqs={[
        {
          q: "Can I receive verification codes on a temporary email?",
          a: "Usually, yes. Some services maintain block lists of disposable domains and will refuse the address at signup. Haven does not attempt to disguise its domains to get around that.",
        },
        {
          q: "The code has not arrived. What should I do?",
          a: "Check that the address was pasted correctly, extend the mailbox so it does not expire while you wait, and use the refresh control. Senders can take several minutes.",
        },
        {
          q: "My address expired before the code arrived.",
          a: "The message is lost once the mailbox expires. Generate a new address, request the code again, and extend the inbox up front if you expect a slow sender.",
        },
        {
          q: "Is a verification code safe to read here?",
          a: "The message is sanitized before rendering and shown in a sandboxed frame. Treat the code as sensitive: anyone with your inbox link could read it while the mailbox is alive.",
        },
      ]}
      related={[
        { href: "/temporary-phone", label: "Temporary SMS", description: "For codes sent by text instead of email." },
        { href: "/temporary-inbox", label: "Temporary inbox", description: "How delivery and reading work." },
        { href: "/10-minute-mail", label: "10 minute mail", description: "Extending a short-lived address." },
      ]}
    />
  );
}
