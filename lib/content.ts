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
