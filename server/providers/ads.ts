export interface AdRenderContext {
  zone: string;
  premium: boolean;
  device: "mobile" | "desktop";
  country?: string;
}

export interface AdCreative {
  placementKey: string;
  network: string;
  html: string;
  slotId?: string;
}

export interface AdProvider {
  readonly key: string;
  render(ctx: AdRenderContext, placement: { slotId?: string | null; key: string }): AdCreative | null;
}

class NoneAdProvider implements AdProvider {
  readonly key = "none";
  render() {
    return null;
  }
}

class AdSenseProvider implements AdProvider {
  readonly key = "adsense";
  render(ctx: AdRenderContext, placement: { slotId?: string | null; key: string }) {
    if (!placement.slotId) return null;
    const client = process.env.ADSENSE_CLIENT_ID || "";
    const html = `<ins class="adsbygoogle" style="display:block" data-ad-client="${escapeHtml(client)}" data-ad-slot="${escapeHtml(placement.slotId)}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    return { placementKey: placement.key, network: "adsense", html, slotId: placement.slotId };
  }
}

class GenericNetworkProvider implements AdProvider {
  readonly key = "generic";
  render(_ctx: AdRenderContext, placement: { slotId?: string | null; key: string }) {
    if (!placement.slotId) return null;
    return {
      placementKey: placement.key,
      network: "generic",
      html: `<div data-ad-slot="${escapeHtml(placement.slotId)}" class="haven-ad"></div>`,
      slotId: placement.slotId,
    };
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
}

const registry: Record<string, AdProvider> = {
  none: new NoneAdProvider(),
  adsense: new AdSenseProvider(),
  generic: new GenericNetworkProvider(),
};

export function getAdProvider(key?: string): AdProvider {
  const k = (key || process.env.ADS_PROVIDER || "none").toLowerCase();
  return registry[k] ?? registry.none!;
}
