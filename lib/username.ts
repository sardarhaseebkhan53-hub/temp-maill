const BLOCKLIST = new Set(
  [
    "admin",
    "administrator",
    "root",
    "postmaster",
    "webmaster",
    "hostmaster",
    "abuse",
    "security",
    "support",
    "help",
    "noreply",
    "no-reply",
    "mailer-daemon",
    "ssl-admin",
    "billing",
    "invoice",
    "payment",
    "official",
    "haven",
    "havenmail",
    "system",
    "api",
    "null",
    "undefined",
    "test",
    "ssl",
    "www",
    "ftp",
    "mail",
    "email",
    "contact",
    "info",
    "sales",
    "ceo",
    "owner",
    "staff",
    "moderator",
    "mod",
    "god",
    "sex",
    "porn",
    "xxx",
    "rape",
    "nazi",
    "hitler",
    "fuck",
    "shit",
    "bitch",
    "asshole",
    "cunt",
    "nigger",
    "faggot",
  ].map((s) => s.toLowerCase()),
);

const PROFANITY = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "nigger",
  "faggot",
  "rape",
  "porn",
  "xxx",
  "slut",
  "whore",
  "dick",
  "pussy",
];

const ADJECTIVES = [
  "quiet",
  "swift",
  "calm",
  "bright",
  "noble",
  "clear",
  "silent",
  "amber",
  "cedar",
  "coral",
  "ivory",
  "maple",
  "olive",
  "pearl",
  "sable",
  "slate",
  "steel",
  "tide",
  "willow",
  "amber",
  "cobalt",
  "ember",
  "flint",
  "grove",
  "haven",
  "lumen",
  "meadow",
  "north",
  "pine",
  "river",
  "silver",
  "stone",
  "vale",
  "wren",
];

const NOUNS = [
  "harbor",
  "cove",
  "inlet",
  "brook",
  "cinder",
  "dune",
  "finch",
  "glade",
  "haven",
  "islet",
  "jasper",
  "kestrel",
  "lagoon",
  "marble",
  "nest",
  "orchard",
  "pebble",
  "quarry",
  "reef",
  "spruce",
  "thicket",
  "umbra",
  "verve",
  "willow",
  "yarn",
  "zephyr",
  "anchor",
  "beacon",
  "canvas",
  "drift",
];

/**
 * Cryptographically secure uniform pick in [0, max) for any positive max —
 * 32-bit rejection sampling, no modulo bias. (A single byte only works for
 * max ≤ 256; usernames draw from larger ranges such as the 3-digit suffix.)
 */
function secureIndex(max: number): number {
  if (!Number.isInteger(max) || max <= 0) throw new RangeError("secureIndex: max must be a positive integer");
  const RANGE = 0x100000000; // 2^32
  const limit = Math.floor(RANGE / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0]! < limit) return buf[0]! % max;
  }
}

function pick<T>(arr: T[]): T {
  return arr[secureIndex(arr.length)] as T;
}

export function randomLocalPart(): string {
  const n = 100 + secureIndex(900);
  return `${pick(ADJECTIVES)}${pick(NOUNS)}${n}`.toLowerCase();
}

export function normalizeLocalPart(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateLocalPart(raw: string): { ok: true; value: string } | { ok: false; reason: string } {
  const value = normalizeLocalPart(raw);
  if (value.length < 3 || value.length > 32) {
    return { ok: false, reason: "Usernames must be 3–32 characters." };
  }
  if (!/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])$/.test(value)) {
    return { ok: false, reason: "Use letters, numbers, dots, hyphens, or underscores." };
  }
  if (value.includes("..") || value.includes("--") || value.includes("__")) {
    return { ok: false, reason: "Avoid repeated separators." };
  }
  if (BLOCKLIST.has(value)) {
    return { ok: false, reason: "That username is reserved." };
  }
  const compact = value.replace(/[^a-z]/g, "");
  for (const word of PROFANITY) {
    if (compact.includes(word)) {
      return { ok: false, reason: "That username is not allowed." };
    }
  }
  return { ok: true, value };
}

export function isReservedLocalPart(raw: string): boolean {
  return BLOCKLIST.has(normalizeLocalPart(raw));
}
