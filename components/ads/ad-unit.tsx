"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

interface AdUnitProps {
  network: string;
  unitId: string | null;
  clientId: string | null;
  responsive: boolean;
  width: number;
  height: number;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Renders a real ad unit for the configured network.
 *
 * The unit is pushed exactly once per mount: Haven never re-requests a slot on
 * a timer, so no impression is generated that the visitor did not actually see.
 *
 * AdSense units always render as responsive `data-ad-format="auto"`: a fixed
 * 300px or 728px creative would be cropped (or worse, trigger horizontal
 * scrolling) inside a 320px-class viewport. The parent container reserves the
 * slot's intrinsic height, so letting the creative size itself to the actual
 * container width keeps both CLS protection and a zero-overflow guarantee.
 */
export function AdUnit({ network, unitId, clientId, responsive, width, height }: AdUnitProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (network !== "adsense" || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // A blocked or unavailable ad script must never break the page.
    }
  }, [network]);

  if (!unitId) return null;

  if (network === "adsense") {
    if (!clientId) return null;
    return (
      <>
        <Script
          id="adsbygoogle-init"
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`}
          crossOrigin="anonymous"
        />
        <ins
          className="adsbygoogle mx-auto block max-w-full"
          style={{ display: "block", width: "100%" }}
          data-ad-client={clientId}
          data-ad-slot={unitId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </>
    );
  }

  // Generic network: the container is provided, the network's own loader
  // (configured in the admin panel) fills it. Width is capped at the
  // container so fixed-size third-party tags can never overflow mobile.
  return (
    <div
      className="haven-ad mx-auto w-full max-w-full"
      data-ad-network={network}
      data-ad-slot={unitId}
      style={responsive ? undefined : { maxWidth: width, minHeight: height }}
    />
  );
}
