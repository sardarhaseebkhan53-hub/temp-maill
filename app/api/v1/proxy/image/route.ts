import { Errors } from "@/lib/errors";
import { fail } from "@/lib/http";
import { isSafeImageMime } from "@/lib/sanitize";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254",
  "metadata.google.internal",
]);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const target = url.searchParams.get("u") || "";
    let parsed: URL;
    try {
      parsed = new URL(target);
    } catch {
      throw Errors.validation("Invalid image URL");
    }
    if (!["http:", "https:"].includes(parsed.protocol)) throw Errors.forbidden();
    if (BLOCKED_HOSTS.has(parsed.hostname) || parsed.hostname.endsWith(".local") || parsed.hostname.endsWith(".internal")) {
      throw Errors.forbidden();
    }
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(parsed.hostname)) throw Errors.forbidden();
    const res = await fetch(parsed.toString(), {
      redirect: "error",
      headers: { Accept: "image/*" },
      signal: AbortSignal.timeout(5000),
    });
    const mime = res.headers.get("content-type") || "";
    if (!isSafeImageMime(mime.split(";")[0] || "")) throw Errors.unsupportedMedia();
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 2_000_000) throw Errors.payloadTooLarge();
    return new Response(buf, {
      headers: {
        "Content-Type": mime,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    return fail(e, req);
  }
}
