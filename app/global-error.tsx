"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ fontFamily: "system-ui", padding: 48, textAlign: "center" }}>
        <h1>Haven hit a problem</h1>
        <button onClick={reset}>Reload</button>
      </body>
    </html>
  );
}
