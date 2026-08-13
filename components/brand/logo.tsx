import { cn } from "@/lib/utils";

export function HavenMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="currentColor" className="text-primary" />
      <path
        d="M8 14.2 16 9l8 5.2V23a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 8 23v-8.8Z"
        fill="none"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8 14.2 16 19l8-4.8"
        fill="none"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HavenWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight", className)}>
      <HavenMark className="size-8" />
      Haven
    </span>
  );
}
