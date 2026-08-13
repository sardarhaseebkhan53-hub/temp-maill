"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8">
      <h1 className="font-display text-3xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground mt-2">Please try again. No internal details are shown here.</p>
      <button onClick={reset} className="mt-6 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm">
        Try again
      </button>
    </div>
  );
}
