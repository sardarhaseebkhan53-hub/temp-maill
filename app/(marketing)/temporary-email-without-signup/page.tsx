import { SeoLanding } from "@/components/features/seo-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Temporary Email Without Signup — No Account Needed",
  description:
    "Get a temporary email address without registering. No account, no password, no verification loop — the disposable inbox is ready the moment the page loads.",
  path: "/temporary-email-without-signup",
});

export default function Page() {
  return (
    <SeoLanding
      path="/temporary-email-without-signup"
      crumbLabel="Without signup"
      title="Temporary email without signing up"
      lede="Asking someone to create an account in order to avoid creating an account is absurd. Haven issues a working inbox before it knows anything about you."
      body={[
        {
          heading: "No registration loop",
          copy: "There is no form, no password, and no confirmation email standing between you and an address. The mailbox on this page already exists and is already accepting mail.",
        },
        {
          heading: "How it works without an account",
          copy: "Your browser holds a signed guest cookie that identifies the mailbox and nothing else. It carries no name, no email address, and no profile — just enough to show you the same inbox when you return.",
        },
        {
          heading: "What we do not collect",
          copy: "No signup means no name, no password, and no permanent email on file. Server logs capture the coarse operational data any web service needs to run and defend itself, and nothing is sold.",
        },
        {
          heading: "An account is optional, and additive",
          copy: "Registering never becomes mandatory. It exists for people who want saved inboxes across devices, aliases, API keys, or billing — the anonymous path keeps working exactly as it does today.",
        },
      ]}
      faqs={[
        {
          q: "Do I need to register to receive email?",
          a: "No. The inbox on this page receives mail immediately with no account of any kind.",
        },
        {
          q: "Will I lose my inbox if I close the tab?",
          a: "Not immediately. A guest cookie reconnects you to the same mailbox until it expires. Clearing cookies or switching browsers will lose the reference.",
        },
        {
          q: "Why would I create an account at all?",
          a: "For saved mailboxes across devices, aliases, API keys, longer retention, and billing. None of it is required for the temporary inbox itself.",
        },
        {
          q: "Is the guest cookie tracking me?",
          a: "It identifies a mailbox, not a person. It carries no advertising identifier and is not used to build a profile.",
        },
      ]}
      related={[
        { href: "/free-temporary-email", label: "Free temporary email", description: "What the free tier includes." },
        { href: "/private-email", label: "Private email", description: "What privacy does and does not mean here." },
        { href: "/temporary-inbox", label: "Temporary inbox", description: "How the inbox itself behaves." },
      ]}
    />
  );
}
