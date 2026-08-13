import { cn } from "@/lib/utils";

export function HavenMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(0,245,160,0.45)]"
        aria-hidden
      >
        <rect
          x="1"
          y="1"
          width="34"
          height="34"
          rx="10"
          className="fill-[#0c141c] stroke-[#00f5a0]/40"
          strokeWidth="1.5"
        />
        {/* Glowing shield outline */}
        <path
          d="M18 7.5L9 11.5V19C9 24.5 13 28.5 18 30C23 28.5 27 24.5 27 19V11.5L18 7.5Z"
          className="fill-[#00f5a0]/15 stroke-[#00f5a0]"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Envelope fold inside shield */}
        <path
          d="M11 13.5L18 19L25 13.5"
          className="stroke-[#00f5a0]"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function HavenWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-white select-none", className)}>
      <HavenMark className="size-8" />
      <span>Haven</span>
    </span>
  );
}
