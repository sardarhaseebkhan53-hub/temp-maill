// Shared "is this a real secret, or just an obvious placeholder?" check.
// Used by health checks, readiness reporting, and the seed so the UI never
// claims a provider is ready when the operator has only copy-pasted the
// .env example.
export function isMeaningfulSecret(value: string | undefined | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < 8) return false;
  return !/^REPLACE[_-]WITH[_-]/i.test(trimmed) && !/^your[-_]?domain/i.test(trimmed);
}
