import { cn } from "@/lib/utils";

export function Crystal3DIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative size-12 flex items-center justify-center select-none", className)}>
      <div className="absolute inset-0 bg-[#00f5a0]/25 blur-xl rounded-full" />
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full relative z-10">
        <defs>
          <linearGradient id="crystalTop" x1="32" y1="6" x2="48" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f5a0" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="crystalLeft" x1="12" y1="24" x2="32" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="crystalRight" x1="52" y1="24" x2="32" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
        </defs>
        {/* Diamond / Crystal facet structure */}
        <polygon points="32,6 48,22 32,32 16,22" fill="url(#crystalTop)" fillOpacity="0.85" stroke="#00f5a0" strokeWidth="1.2" />
        <polygon points="16,22 32,32 32,58 12,28" fill="url(#crystalLeft)" fillOpacity="0.8" stroke="#00f5a0" strokeWidth="1" />
        <polygon points="48,22 32,32 32,58 52,28" fill="url(#crystalRight)" fillOpacity="0.9" stroke="#38bdf8" strokeWidth="1" />
      </svg>
    </div>
  );
}

export function Crown3DIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative size-12 flex items-center justify-center select-none", className)}>
      <div className="absolute inset-0 bg-[#8b5cf6]/30 blur-xl rounded-full" />
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full relative z-10">
        <defs>
          <linearGradient id="crownGrad" x1="8" y1="12" x2="56" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="jewelGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00f5a0" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        {/* 3D Crown body */}
        <path
          d="M10 44L14 20L25 34L32 14L39 34L50 20L54 44H10Z"
          fill="url(#crownGrad)"
          stroke="#e9d5ff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M10 44C10 48 20 52 32 52C44 52 54 48 54 44L50 44C50 47 42 49 32 49C22 49 14 47 14 44H10Z"
          fill="#7c3aed"
        />
        {/* Jewels */}
        <circle cx="14" cy="19" r="3" fill="url(#jewelGrad)" stroke="#fff" strokeWidth="0.8" />
        <circle cx="32" cy="13" r="3.5" fill="url(#jewelGrad)" stroke="#fff" strokeWidth="0.8" />
        <circle cx="50" cy="19" r="3" fill="url(#jewelGrad)" stroke="#fff" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

export function Vault3DIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative size-12 flex items-center justify-center select-none", className)}>
      <div className="absolute inset-0 bg-[#38bdf8]/25 blur-xl rounded-full" />
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full relative z-10">
        <defs>
          <linearGradient id="vaultGrad" x1="10" y1="12" x2="54" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>
        <rect x="12" y="14" width="40" height="38" rx="7" fill="url(#vaultGrad)" stroke="#7dd3fc" strokeWidth="1.5" />
        {/* Vault Wheel */}
        <circle cx="32" cy="33" r="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
        <circle cx="32" cy="33" r="4" fill="#38bdf8" />
        <path d="M32 23V27M32 39V43M22 33H26M38 33H42" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function CubePremium3DIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative size-10 flex items-center justify-center select-none", className)}>
      <div className="absolute inset-0 bg-[#8b5cf6]/35 blur-lg rounded-full" />
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full relative z-10">
        <polygon points="24,6 40,15 24,24 8,15" fill="#8b5cf6" fillOpacity="0.7" stroke="#c084fc" strokeWidth="1.2" />
        <polygon points="8,15 24,24 24,42 8,33" fill="#6d28d9" fillOpacity="0.8" stroke="#a855f7" strokeWidth="1" />
        <polygon points="40,15 24,24 24,42 40,33" fill="#4c1d95" fillOpacity="0.9" stroke="#c084fc" strokeWidth="1" />
        <circle cx="24" cy="24" r="3" fill="#00f5a0" />
      </svg>
    </div>
  );
}
