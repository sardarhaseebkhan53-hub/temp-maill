/**
 * Editorial seed content for the Haven blog.
 *
 * These are real, hand-written explainers, not generated filler. Each answers a
 * distinct search intent so the articles do not compete with one another, and
 * each links to the relevant product page rather than repeating its copy.
 */

export interface SeedCategory {
  slug: string;
  name: string;
  description: string;
}

export interface SeedPost {
  slug: string;
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  category: string;
  html: string;
}

export const blogCategories: SeedCategory[] = [
  {
    slug: "temporary-email",
    name: "Temporary Email",
    description: "How disposable inboxes work and when to reach for one.",
  },
  {
    slug: "privacy",
    name: "Online Privacy",
    description: "Practical privacy notes without magical thinking.",
  },
  {
    slug: "email-security",
    name: "Email Security",
    description: "Phishing, tracking pixels, attachments, and safer reading habits.",
  },
  {
    slug: "developer-tools",
    name: "Developer Tools",
    description: "Using temporary email in testing, QA, and automation.",
  },
];

export const blogPosts: SeedPost[] = [
  {
    slug: "what-is-temporary-email",
    title: "What is temporary email and how does it work?",
    excerpt:
      "A plain explanation of disposable inboxes: what happens between a sender pressing send and a message appearing on your screen, and what expiry actually does.",
    seoTitle: "What Is Temporary Email and How Does It Work?",
    seoDescription:
      "A clear explanation of how temporary email works: how addresses are created, how mail is routed and sanitized, and what really happens when a disposable inbox expires.",
    category: "temporary-email",
    html: `<p>A temporary email address is a mailbox that is created on demand, used briefly, and deleted automatically. It behaves like any other address from the sender's point of view — mail is delivered normally — but it carries an expiry date from the moment it exists.</p>

<h2>How an address is created</h2>
<p>When you open a temporary email service, the server picks a local part (the portion before the <code>@</code>), pairs it with a domain it controls, and writes a mailbox row to its database. That row records the address, an expiry timestamp, and a token that authorises whoever holds it to read the mail.</p>
<p>Two details matter here. The address is generated on the server, not in your browser, so two visitors cannot be handed the same one. And the expiry is stored alongside the address, which means it is enforced by the service rather than by a countdown drawn on the page.</p>

<h2>How mail actually arrives</h2>
<p>The domain's MX records point at the provider's mail infrastructure. When someone sends a message, their server looks up those records and delivers it. The provider then does the work that makes a disposable inbox usable:</p>
<ul>
<li><strong>Parse the MIME structure.</strong> An email is a tree of parts — plain text, HTML, inline images, attachments. Each is extracted separately.</li>
<li><strong>Match the recipient.</strong> If no live mailbox matches the address, the message is rejected. Mail sent to an expired address does not sit in a queue waiting for you.</li>
<li><strong>Sanitize the HTML.</strong> Scripts, event handlers, and dangerous URI schemes are removed against an allowlist. This is not optional: disposable addresses attract hostile mail.</li>
<li><strong>Store and notify.</strong> The cleaned message is written to the database and pushed to any open browser session.</li>
</ul>

<h2>Why the inbox updates without refreshing</h2>
<p>Most services keep a long-lived connection open from your browser — usually server-sent events — so the server can push a notification the instant a message lands. If that connection drops, a well-built client falls back to polling on a backoff rather than hammering the server every second.</p>
<p>This is why a verification code typically appears within a second or two of the sender dispatching it. The delay you sometimes feel is almost always the sender's queue, not the inbox.</p>

<h2>What expiry really does</h2>
<p>Expiry is a database event, not a visual effect. When the timestamp passes, a scheduled job marks the mailbox expired and the mail server begins rejecting messages for that address. A later retention job removes stored bodies and attachments.</p>
<p>The practical consequence: once your address has expired, a message already in flight will not reach you, and generating a new address will not recover it. If a sender is slow, extend the existing mailbox instead.</p>

<h2>What it does not do</h2>
<p>A temporary address separates a signup from your primary identity. It does not make you anonymous. Mail passes through the provider's servers in a readable form, so it is not end-to-end encrypted and is not appropriate for confidential material. Server logs and the sender's own records still exist.</p>
<p>Treat it as what it is — a mailbox with a short memory — and it is a genuinely useful tool. Treat it as a cloak and you will be disappointed.</p>

<h2>Try it</h2>
<p>Haven creates an address as soon as you open the <a href="/">homepage</a>, with no signup. If you want to choose the name or domain, use the <a href="/temporary-email-generator">temporary email generator</a>.</p>`,
  },

  {
    slug: "temporary-email-vs-disposable-email",
    title: "Temporary email vs disposable email: is there a difference?",
    excerpt:
      "Temporary, disposable, burner, throwaway, 10-minute. Five names, one mechanism — and a few genuine distinctions worth knowing about.",
    seoTitle: "Temporary Email vs Disposable Email — What's the Difference?",
    seoDescription:
      "Temporary, disposable, burner and throwaway email are largely the same thing. Here is what each term emphasises, plus the real distinctions between aliases and temporary inboxes.",
    category: "temporary-email",
    html: `<p>Search for a short-lived inbox and you will meet at least five names for it. They mostly describe the same mechanism from different angles, but a couple of genuine distinctions are worth knowing.</p>

<h2>The terms that mean the same thing</h2>
<ul>
<li><strong>Temporary email</strong> emphasises the clock: the address exists for a defined window.</li>
<li><strong>Disposable email</strong> emphasises single use: you take it, use it once, and drop it.</li>
<li><strong>Burner email</strong> borrows from prepaid phones — cheap, brief, discarded.</li>
<li><strong>Throwaway email</strong> is the same idea in plainer words.</li>
<li><strong>10 minute mail</strong> names a specific default lifetime that became a generic label.</li>
</ul>
<p>Functionally, these describe one thing: a mailbox created on demand that deletes itself. Choosing between them is a matter of emphasis, not capability.</p>

<h2>The distinction that does matter: aliases</h2>
<p>An <strong>alias</strong> is a permanent forwarding address. Mail sent to it is relayed to your real inbox, and you keep it indefinitely — often turning it off if it starts attracting spam.</p>
<p>A <strong>temporary inbox</strong> is a destination in its own right. Mail arrives there, you read it there, and both the address and the messages disappear.</p>
<p>They solve different problems:</p>
<ul>
<li>Use an <strong>alias</strong> for a service you intend to keep, where you may need password resets later, but you do not want to hand over your primary address.</li>
<li>Use a <strong>temporary inbox</strong> for a service you will never return to, where you need to receive exactly one message.</li>
</ul>
<p>The failure mode is using a temporary inbox for something in the first category. When the mailbox expires, you cannot receive a reset link, and the local part may eventually be reissued to someone else.</p>

<h2>Also different: masked and relay addresses</h2>
<p>Some privacy suites offer masked addresses — permanent, per-service relays with reply support, usually tied to a paid account. These are aliases with better tooling, not temporary inboxes. They keep your real address hidden but the relationship intact.</p>

<h2>Picking the right one</h2>
<table>
<thead><tr><th>Situation</th><th>Use</th></tr></thead>
<tbody>
<tr><td>One-off download or trial</td><td>Temporary inbox</td></tr>
<tr><td>Marketplace listing</td><td>Temporary inbox</td></tr>
<tr><td>Testing your own signup flow</td><td>Temporary inbox, one per test run</td></tr>
<tr><td>A shop you will order from again</td><td>Alias</td></tr>
<tr><td>Anything with money or identity attached</td><td>Your real address</td></tr>
</tbody>
</table>

<p>Haven provides <a href="/temporary-email">temporary inboxes</a> to everyone and <a href="/pricing">aliases</a> to registered users on paid plans, because the two genuinely serve different needs.</p>`,
  },

  {
    slug: "temporary-email-for-software-testing",
    title: "Using temporary email for software testing",
    excerpt:
      "How to wire disposable inboxes into a test suite so signup, verification, and password-reset flows can be asserted without a shared mailbox.",
    seoTitle: "Temporary Email for Software Testing and QA Automation",
    seoDescription:
      "A practical guide to using temporary email in automated tests: isolate inboxes per run, assert on delivered mail, avoid flaky polling, and tear everything down cleanly.",
    category: "developer-tools",
    html: `<p>Any application that sends email eventually needs tests that receive it. Signup confirmation, password reset, invoices, invitations — all of them are only half-tested if you stop at "we called the mail provider".</p>

<h2>Why a shared test inbox breaks down</h2>
<p>The usual first attempt is one mailbox, reused by every test. It works until it does not:</p>
<ul>
<li>Two pipeline runs execute concurrently and each sees the other's confirmation email.</li>
<li>A test asserts on "the latest message" and picks up a leftover from yesterday.</li>
<li>Someone deletes the inbox contents mid-run to debug something.</li>
</ul>
<p>Every one of these produces a flaky test that passes for the wrong reason — the worst kind, because it erodes trust in the whole suite.</p>

<h2>One inbox per test</h2>
<p>The fix is isolation. Create a mailbox in setup, use it, delete it in teardown:</p>
<pre><code>// setup
const res = await fetch("https://example.com/api/v1/mailboxes", {
  method: "POST",
  headers: { Authorization: \`Bearer \${process.env.HAVEN_KEY}\` },
});
const { data: mailbox } = await res.json();

// ... drive the signup flow with mailbox.address ...

// teardown
await fetch(\`https://example.com/api/v1/mailboxes/\${mailbox.id}\`, {
  method: "DELETE",
  headers: { Authorization: \`Bearer \${process.env.HAVEN_KEY}\` },
});</code></pre>
<p>Now each test owns its mailbox. Concurrency stops mattering and leftovers cannot exist.</p>

<h2>Waiting for mail without flakiness</h2>
<p>Mail is asynchronous, so tests must wait — but a fixed <code>sleep(5000)</code> is both slow and unreliable. Poll with a timeout instead:</p>
<pre><code>async function waitForMessage(mailbox, matcher, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() &lt; deadline) {
    const res = await fetch(
      \`/api/v1/messages?mailboxId=\${mailbox.id}&token=\${mailbox.publicToken}\`
    );
    const { data } = await res.json();
    const hit = data.items.find(matcher);
    if (hit) return hit;
    await new Promise((r) =&gt; setTimeout(r, 1000));
  }
  throw new Error("Timed out waiting for message");
}</code></pre>
<p>A one-second interval with a thirty-second ceiling is a reasonable default. Be aware that API keys are rate-limited, so do not poll in a tight loop.</p>

<h2>Assert on text, not rendered HTML</h2>
<p>Extract codes and links from the plain-text body where possible. HTML templates change constantly — marketing tweaks a button, a wrapper div appears — and selector-based assertions break for reasons that have nothing to do with your application.</p>
<pre><code>const code = message.text.match(/\\b(\\d{6})\\b/)?.[1];
expect(code).toBeDefined();</code></pre>

<h2>Prefer webhooks in CI</h2>
<p>If your runner can accept an inbound HTTP request, subscribe a webhook to <code>message.received</code> instead of polling. Deliveries are signed, so the runner can verify the request genuinely came from the provider. This removes polling latency and the rate-limit question entirely.</p>

<h2>Keep test and live traffic separate</h2>
<p>Use test-mode API keys — Haven prefixes them <code>tmp_test_</code> — so test activity is distinguishable from production in logs and audit records. If your operator has configured a sandbox domain, point test mailboxes at it.</p>

<p>Full endpoint documentation is on the <a href="/temporary-email-api">temporary email API</a> page, with runnable examples in the <a href="/developer-api">developer documentation</a>.</p>`,
  },

  {
    slug: "how-temporary-email-protects-your-inbox",
    title: "How temporary email protects your primary inbox",
    excerpt:
      "Your main address accumulates spam, tracking, and credential-stuffing risk over years. Here is the specific damage a disposable address prevents.",
    seoTitle: "How Temporary Email Protects Your Primary Inbox",
    seoDescription:
      "Spam, tracking pixels, data-breach exposure and credential stuffing all target your primary address. Here is exactly what a temporary email address prevents, and what it does not.",
    category: "privacy",
    html: `<p>Most people have used the same email address for a decade or more. It is attached to their bank, their employer, their family, and roughly four hundred services they signed up to once and forgot. That accumulation carries specific, compounding costs.</p>

<h2>Cost one: the address becomes a permanent identifier</h2>
<p>An email address is one of the most reliable identity keys on the internet. Data brokers use it to join records across services. When two companies compare customer lists, a matching address links the profiles.</p>
<p>Using a different disposable address per throwaway signup breaks those joins. There is no shared key to match on.</p>

<h2>Cost two: breaches are cumulative</h2>
<p>Every service holding your address is a place it can leak. Once it appears in a breach corpus it is permanently in circulation, and you cannot recall it.</p>
<p>The damage is not only spam. Credential stuffing takes an address and password from one breach and replays them against other services. Knowing an address is valid is itself the first step in a targeted phishing attempt.</p>
<p>A disposable address that expired months ago is worthless in a breach dump. There is no live mailbox behind it.</p>

<h2>Cost three: unsubscribing does not really work</h2>
<p>The unsubscribe link handles legitimate senders. It does nothing about the list your address was sold to, the affiliate who scraped it, or the "partners" buried in a privacy policy you did not read.</p>
<p>Expiry is a stronger mechanism than unsubscribing because it does not require the sender's cooperation. The address simply stops existing.</p>

<h2>Cost four: tracking pixels</h2>
<p>Marketing email routinely embeds a one-pixel image with a unique URL. Loading it tells the sender you opened the message, roughly when, and approximately where.</p>
<p>Reading that message in a temporary inbox that proxies or blocks remote images means the pixel reports on the provider's infrastructure, not on you.</p>

<h2>A practical split</h2>
<ul>
<li><strong>Primary address:</strong> bank, employer, government, doctor, close contacts. Nothing else.</li>
<li><strong>Alias or secondary:</strong> shops and services you genuinely use and may need to recover.</li>
<li><strong>Temporary address:</strong> one-off downloads, trials, forums, wifi portals, marketplace listings, anything demanding an address purely as a gate.</li>
</ul>
<p>The third category is far larger than most people expect, and it is where nearly all the accumulation comes from.</p>

<h2>Being honest about the limits</h2>
<p>A temporary address does not encrypt anything, does not hide your IP, and does not protect you if you hand over your real details in the body of a form. It solves one problem — the permanent identifier — and solves it well.</p>

<p>Haven issues an address instantly with no signup on the <a href="/">homepage</a>. If you want to understand the boundaries first, read <a href="/private-email">what private email honestly means</a>.</p>`,
  },

  {
    slug: "reading-untrusted-email-safely",
    title: "How to read untrusted email safely",
    excerpt:
      "Disposable inboxes attract hostile mail by design. What actually makes a message dangerous, and what a well-built inbox does about it.",
    seoTitle: "How to Read Untrusted Email Safely — Email Security Basics",
    seoDescription:
      "Phishing, tracking pixels, malicious attachments and HTML-based attacks explained, plus the specific defences a temporary inbox should apply before showing you a message.",
    category: "email-security",
    html: `<p>A disposable address gets handed to services you do not trust, which means the inbox receives mail you should not assume is friendly. That is fine — provided the inbox is built for it and you know what to look for.</p>

<h2>What makes an email dangerous</h2>
<h3>Active content in HTML</h3>
<p>Email is frequently HTML, and HTML can carry scripts, event handlers, and dangerous URI schemes. Rendered naively in a browser, a hostile message could read page state or act on your behalf. Any competent mail client strips this against an allowlist rather than a blocklist — allowlists fail closed when someone invents a new trick.</p>

<h3>Remote content</h3>
<p>Images, fonts, and stylesheets loaded from the sender's server report back: your IP, approximate location, client, and the moment you opened the message. The one-pixel tracking image is the classic case. Proxying remote images through the provider, or blocking them until asked, removes the signal.</p>

<h3>Attachments</h3>
<p>The genuinely dangerous file types are executables, scripts, and documents carrying macros. A safe inbox uses an allowlist of extensions and MIME types, verifies the declared type against the actual bytes, and never serves an attachment with a content type that lets the browser execute it.</p>

<h3>Deceptive links</h3>
<p>Anchor text can say anything. <code>&lt;a href="https://evil.example"&gt;https://yourbank.example&lt;/a&gt;</code> is a valid link that lies about its destination. Look-alike domains using similar characters compound the problem.</p>

<h2>What a well-built inbox does</h2>
<ul>
<li><strong>Parses defensively.</strong> Malformed MIME is rejected rather than guessed at.</li>
<li><strong>Sanitizes against an allowlist.</strong> Only known-safe tags and attributes survive.</li>
<li><strong>Renders in a sandbox.</strong> The message body is displayed in an isolated frame with scripting disabled, so it cannot reach the surrounding application.</li>
<li><strong>Proxies remote images.</strong> The sender learns the provider fetched an image, not that you opened the mail from a particular network.</li>
<li><strong>Allowlists attachments.</strong> Unknown or executable types are not offered for download.</li>
<li><strong>Caps sizes.</strong> Oversized messages and attachments are rejected before they can be used to exhaust resources.</li>
</ul>

<h2>What remains your judgement</h2>
<p>No sanitizer stops you from typing a password into a convincing fake login page. Sanitization protects the rendering; it cannot protect a decision.</p>
<ul>
<li>Check where a link actually goes before following it.</li>
<li>Be sceptical of urgency — "your account will be closed in 24 hours" is the oldest lever there is.</li>
<li>Never enter credentials on a page you arrived at from an email. Navigate to the service yourself.</li>
<li>Remember a temporary inbox is readable by anyone holding its link while it is alive. Do not treat contents as confidential.</li>
</ul>

<h2>Reporting abuse</h2>
<p>If something arrives that looks like phishing or a malware attempt, report it from the message view. Reports feed a moderation queue that operators use to block senders and protect the domains' reputation.</p>

<p>Haven applies every defence above by default. The specifics are in our <a href="/security">security notes</a>, and the boundaries are set out in the <a href="/acceptable-use">acceptable use policy</a>.</p>`,
  },

  {
    slug: "when-not-to-use-a-temporary-email",
    title: "When not to use a temporary email address",
    excerpt:
      "The most useful thing a temporary email provider can tell you is when to close the tab and use your real address instead.",
    seoTitle: "When You Should Not Use a Temporary Email Address",
    seoDescription:
      "Temporary email is the wrong tool for banking, government services, work accounts, and anything needing recovery. A clear guide to when to use your real address instead.",
    category: "temporary-email",
    html: `<p>Most articles about temporary email are trying to persuade you to use one. This one is about the cases where you should not, because using a disposable address in the wrong place causes real, avoidable damage.</p>

<h2>Anything you may need to recover</h2>
<p>This is the big one. Account recovery runs through email. If the mailbox no longer exists when you need a reset link, the account is gone — and support cannot help, because you cannot prove you control the address on file.</p>
<p>Worse, local parts can be reissued after a mailbox is purged. In principle a future holder of that address could receive a reset link for your account. Never use a temporary address for anything you intend to keep.</p>

<h2>Money, identity, and health</h2>
<p>Banking, payment services, insurance, tax and government portals, medical records. These carry legal and financial consequences, often require a verifiable address on file, and generate documents you may need years later.</p>

<h2>Work and study</h2>
<p>Employment, university enrolment, professional certification. Beyond needing continuity, using a throwaway address here often breaches an acceptable use policy and looks evasive.</p>

<h2>Anything confidential</h2>
<p>Mail arriving at a temporary inbox is stored in a readable form on the provider's servers. It is not end-to-end encrypted. Anyone holding the inbox link can read it while the mailbox is alive. Contracts, legal correspondence, medical results, and credentials do not belong there.</p>

<h2>Services that have said no</h2>
<p>Many services maintain block lists of known disposable domains. If a signup is refused, that is the operator's decision about their own platform. Hunting for a domain that slips past is a bad use of your time and, at scale, is abuse.</p>

<h2>Evading a ban or moderation</h2>
<p>Creating a new account to get around a suspension is prohibited by essentially every platform, and by <a href="/acceptable-use">our acceptable use policy</a>. So is bulk account creation, harassment, and defeating another operator's anti-fraud controls. Haven cooperates with legitimate abuse reports.</p>

<h2>A simple test</h2>
<p>Ask: <em>will I care about this in a month?</em></p>
<ul>
<li><strong>No</strong> — a one-time download, a trial, a wifi portal, a forum for a single question. Temporary address is ideal.</li>
<li><strong>Maybe</strong> — a shop you might order from again. Use an alias.</li>
<li><strong>Yes</strong> — anything with money, identity, employment, or health attached. Use your real address.</li>
</ul>

<p>Haven exists for the first category and is deliberately honest about the other two. If an alias fits better, that is a <a href="/pricing">paid plan feature</a> — and if your real address is the right answer, use it.</p>`,
  },
];
