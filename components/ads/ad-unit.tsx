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
          className="adsbygoogle block"
          style={
            responsive
              ? { display: "block", width: "100%" }
              : { display: "inline-block", width, height }
          }
          data-ad-client={clientId}
          data-ad-slot={unitId}
          {...(responsive ? { "data-ad-format": "auto", "data-full-width-responsive": "true" } : {})}
        />
      </>
    );
  }

  // Generic network: the container is provided, the network's own loader
  // (configured in the admin panel) fills it.
  return (
    <div
      className="haven-ad w-full"
      data-ad-network={network}
      data-ad-slot={unitId}
      style={responsive ? { width: "100%" } : { width, height }}
    />
  );
}
