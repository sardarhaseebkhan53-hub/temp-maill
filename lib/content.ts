/**
 * Build a meta description from stored HTML when no explicit SEO description
 * exists. Echoing the title instead produces a uselessly short snippet.
 *
 * Trims on a word boundary so the description never ends mid-word.
 */
export function summarizeHtml(html: string, fallback: string, maxLength = 155): string {
  const text = (html || "")
    .replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length < 40) return fallback;
  if (text.length <= maxLength) return text;

  const clipped = text.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > 60 ? clipped.slice(0, lastSpace) : clipped).replace(/[,;:.\s]+$/, "")}…`;
}

/**
 * Remove a leading `<h1>` from stored CMS/article HTML.
 *
 * The page shell already renders the title as the single document `<h1>`, so
 * leaving one in the body produces two H1s and a muddled heading hierarchy.
 * Only the first heading is removed, and only if it appears before any other
 * visible content.
 */
export function stripLeadingH1(html: string): string {
  if (!html) return "";
  return html.replace(
    /^(\s*(?:<(?:article|section|div|main)\b[^>]*>\s*)*)<h1\b[^>]*>[\s\S]*?<\/h1>/i,
    "$1",
  );
}

/**
 * Split stored article HTML into two halves at a top-level paragraph boundary
 * so an in-content ad can sit between them without ever breaking markup.
 *
 * Returns `[html, ""]` for short articles, which keeps a single ad from
 * dominating a two-paragraph post.
 */
export function splitHtmlForInContentAd(html: string, minBlocks = 4): [string, string] {
  if (!html) return ["", ""];

  const boundaries: number[] = [];
  const closingParagraph = /<\/(p|h2|h3|ul|ol|blockquote|pre)>/gi;
  let match: RegExpExecArray | null;

  while ((match = closingParagraph.exec(html)) !== null) {
    boundaries.push(match.index + match[0].length);
  }

  if (boundaries.length < minBlocks) return [html, ""];

  const splitAt = boundaries[Math.floor(boundaries.length / 2) - 1];
  if (splitAt === undefined) return [html, ""];

  return [html.slice(0, splitAt), html.slice(splitAt)];
}
