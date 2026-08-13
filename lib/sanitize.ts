import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "caption",
  "code",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
];

const ALLOWED_ATTR: Record<string, string[]> = {
  a: ["href", "name", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
  "*": ["class"],
};

const SAFE_IMAGE = /^(https?:\/\/|cid:|data:image\/(png|jpe?g|gif|webp);base64,)/i;

export function sanitizeEmailHtml(dirty: string): string {
  if (!dirty) return "";
  const strippedScripts = dirty
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/vbscript\s*:/gi, "");

  return sanitizeHtml(strippedScripts, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTR,
    allowedSchemes: ["http", "https", "mailto", "cid"],
    allowedSchemesByTag: {
      img: ["http", "https", "cid", "data"],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || "";
        if (/^\s*javascript:/i.test(href) || /^\s*data:/i.test(href)) {
          return { tagName: "span" as const, attribs: {} as Record<string, string> };
        }
        return {
          tagName,
          attribs: {
            href,
            target: "_blank",
            rel: "nofollow noopener noreferrer",
          },
        };
      },
      img: (tagName, attribs) => {
        const src = attribs.src || "";
        if (!SAFE_IMAGE.test(src) && !src.startsWith("/api/v1/proxy/image")) {
          return { tagName: "span", attribs: {} };
        }
        if (/^data:/i.test(src) && !/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(src)) {
          return { tagName: "span", attribs: {} };
        }
        return {
          tagName,
          attribs: {
            src,
            alt: attribs.alt || "",
            ...(attribs.width ? { width: attribs.width } : {}),
            ...(attribs.height ? { height: attribs.height } : {}),
          },
        };
      },
    },
    exclusiveFilter: (frame) => {
      if (frame.tag === "a" && !frame.attribs.href) return false;
      return false;
    },
    textFilter: (text) => text,
  } as sanitizeHtml.IOptions);
}

export function extractSnippet(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function rewriteRemoteImages(html: string, enabled: boolean): string {
  if (!enabled) {
    return html.replace(/<img\b[^>]*src=["']https?:\/\/[^"']+["'][^>]*>/gi, (match) => {
      return `<span data-blocked-image="1" class="blocked-image">${match.replace(/</g, "&lt;")}</span>`;
    });
  }
  return html.replace(/<img\b([^>]*?)src=["'](https?:\/\/[^"']+)["']([^>]*)>/gi, (_m, pre, src, post) => {
    const proxied = `/api/v1/proxy/image?u=${encodeURIComponent(src)}`;
    return `<img${pre}src="${proxied}"${post}>`;
  });
}

const EXECUTABLE_EXT = new Set([
  "exe",
  "bat",
  "cmd",
  "com",
  "msi",
  "scr",
  "pif",
  "cpl",
  "jar",
  "js",
  "vbs",
  "ps1",
  "sh",
  "dmg",
  "pkg",
  "apk",
  "dll",
  "so",
]);

const ALLOWED_MIME = new Set([
  "application/pdf",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/zip",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
]);

export function classifyAttachment(filename: string, mimeType: string): { blocked: boolean; reason?: string } {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (EXECUTABLE_EXT.has(ext)) {
    return { blocked: true, reason: "Executable files are blocked." };
  }
  const mime = mimeType.toLowerCase().split(";")[0]?.trim() || "";
  if (mime.includes("javascript") || mime.includes("x-msdownload") || mime.includes("x-executable")) {
    return { blocked: true, reason: "Unsafe MIME type." };
  }
  if (mime && !ALLOWED_MIME.has(mime) && !mime.startsWith("image/") && !mime.startsWith("text/")) {
    return { blocked: true, reason: "This file type is not on the allowlist." };
  }
  return { blocked: false };
}

export function isSafeImageMime(mime: string): boolean {
  return ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(mime.toLowerCase());
}
