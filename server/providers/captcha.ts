import { getEnv } from "@/config/env";

export interface CaptchaProvider {
  readonly key: string;
  siteKey(): string | null;
  verify(token: string, ip?: string): Promise<boolean>;
}

class NoneCaptcha implements CaptchaProvider {
  readonly key = "none";
  siteKey() {
    return null;
  }
  async verify() {
    return true;
  }
}

class TurnstileCaptcha implements CaptchaProvider {
  readonly key = "turnstile";
  siteKey() {
    return getEnv().TURNSTILE_SITE_KEY || null;
  }
  async verify(token: string, ip?: string) {
    const env = getEnv();
    if (!env.TURNSTILE_SECRET_KEY) return false;
    const body = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
    });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const json = (await res.json()) as { success?: boolean };
    return Boolean(json.success);
  }
}

class HCaptcha implements CaptchaProvider {
  readonly key = "hcaptcha";
  siteKey() {
    return getEnv().HCAPTCHA_SITE_KEY || null;
  }
  async verify(token: string, ip?: string) {
    const env = getEnv();
    if (!env.HCAPTCHA_SECRET_KEY) return false;
    const body = new URLSearchParams({
      secret: env.HCAPTCHA_SECRET_KEY,
      response: token,
    });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://hcaptcha.com/siteverify", { method: "POST", body });
    const json = (await res.json()) as { success?: boolean };
    return Boolean(json.success);
  }
}

export function getCaptchaProvider(): CaptchaProvider {
  const env = getEnv();
  if (env.CAPTCHA_PROVIDER === "turnstile") return new TurnstileCaptcha();
  if (env.CAPTCHA_PROVIDER === "hcaptcha") return new HCaptcha();
  return new NoneCaptcha();
}

export async function maybeVerifyCaptcha(token: string | undefined, risk: number, ip?: string) {
  if (risk < 0.7) return true;
  const provider = getCaptchaProvider();
  if (provider.key === "none") return true;
  if (!token) return false;
  return provider.verify(token, ip);
}
