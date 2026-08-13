import { SeoLanding } from "@/components/features/seo-landing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "10 Minute Mail — Short-Lived Inbox",
  description: "A ten-minute-style disposable inbox. The default lifetime is a system setting, not a slogan.",
  path: "/10-minute-mail",
});

export default function Page() {
  return (
    <SeoLanding
      path="/10-minute-mail"
      title="Ten minutes, unless you ask for more"
      lede="The classic 10-minute mailbox is a good default for a confirmation link. Haven ships with that default as a setting, so operators can change it without shipping code."
      body={[
        {
          heading: "The timer is real",
          copy: "Expiry is written on the mailbox row and enforced by a job. The UI only reflects that state — it never decides an address is dead on its own.",
        },
        {
          heading: "Extend when the link is slow",
          copy: "If a vendor takes more than ten minutes, extend up to the configured maximum. Paid plans start with a longer default.",
        },
        {
          heading: "After the clock",
          copy: "Expired boxes stop accepting mail. Retention settings then purge bodies and attachments so leftovers do not sit around.",
        },
        {
          heading: "Keep the tab open",
          copy: "Delivery is streamed. You do not need to mash refresh unless the connection drops.",
        },
      ]}
      faqs={[
        { q: "Is it always exactly ten minutes?", a: "The seeded default is ten. Your operator may have chosen another value." },
        { q: "What happens at zero?", a: "The mailbox becomes EXPIRED, inbound mail is rejected, and a later job purges content." },
      ]}
    />
  );
}
