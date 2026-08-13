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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

export function randomLocalPart(): string {
  const n = Math.floor(100 + Math.random() * 900);
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
