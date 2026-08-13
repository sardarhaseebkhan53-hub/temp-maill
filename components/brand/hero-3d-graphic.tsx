"use client";

import { cn } from "@/lib/utils";

export function Hero3DGraphic({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full max-w-[280px] sm:max-w-[320px] aspect-square flex items-center justify-center select-none pointer-events-none", className)}>
      {/* Background radial ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#00f5a0]/20 via-[#6366f1]/15 to-[#8b5cf6]/20 blur-3xl rounded-full transform -translate-y-2 scale-90" />

      {/* SVG 3D Isometric Composition */}
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 animate-float-slow"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="cubeTop" x1="200" y1="90" x2="310" y2="155" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00f5a0" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="cubeLeft" x1="90" y1="155" x2="200" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#061224" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="cubeRight" x1="310" y1="155" x2="200" y2="280" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0a0f1d" stopOpacity="0.85" />
          </linearGradient>

          <linearGradient id="neonTeal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f5a0" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f5a0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
          </linearGradient>

          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Isometric Glass Cube Faces */}
        {/* Top Face */}
        <polygon
          points="200,85 315,150 200,215 85,150"
          fill="url(#cubeTop)"
          stroke="url(#neonTeal)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="opacity-80"
        />

        {/* Left Face */}
        <polygon
          points="85,150 200,215 200,345 85,280"
          fill="url(#cubeLeft)"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeOpacity="0.6"
          strokeLinejoin="round"
        />

        {/* Right Face */}
        <polygon
          points="315,150 200,215 200,345 315,280"
          fill="url(#cubeRight)"
          stroke="#818cf8"
          strokeWidth="1.5"
          strokeOpacity="0.6"
          strokeLinejoin="round"
        />

        {/* Internal Isometric Grid & Wireframe */}
        <line x1="200" y1="85" x2="200" y2="215" stroke="#00f5a0" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.5" />
        <line x1="85" y1="150" x2="315" y2="150" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.4" />

        {/* Internal Floating Glowing 3D Envelope */}
        <g transform="translate(145, 175)" filter="url(#neonGlow)">
          {/* Envelope Body */}
          <rect
            x="0"
            y="0"
            width="110"
            height="72"
            rx="8"
            fill="#091424"
            stroke="#00f5a0"
            strokeWidth="2.5"
          />
          {/* Envelope Flap Lines */}
          <path
            d="M0 0 L55 42 L110 0"
            stroke="#00f5a0"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M0 72 L42 34"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeOpacity="0.7"
            strokeLinecap="round"
          />
          <path
            d="M110 72 L68 34"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeOpacity="0.7"
            strokeLinecap="round"
          />
        </g>

        {/* Floating Glowing Shield with Keyhole on the lower-right */}
        <g transform="translate(290, 270)" filter="url(#neonGlow)">
          {/* Shield Base */}
          <path
            d="M25 0 L5 8 V24 C5 36 14 46 25 50 C36 46 45 36 45 24 V8 L25 0 Z"
            fill="#0c1729"
            stroke="#00f5a0"
            strokeWidth="2.5"
          />
          {/* Keyhole */}
          <circle cx="25" cy="20" r="4.5" fill="#00f5a0" />
          <path d="M23 23 L27 23 L28 32 L22 32 Z" fill="#00f5a0" />
        </g>

        {/* Floating Neon Particles & Cyan/Teal Glowing Diamonds */}
        {/* Top left diamond */}
        <g transform="translate(110, 80)" filter="url(#softGlow)">
          <polygon points="12,0 24,12 12,24 0,12" fill="#00f5a0" opacity="0.8" />
        </g>
        {/* Top right particle */}
        <circle cx="330" cy="95" r="4" fill="#38bdf8" filter="url(#softGlow)" />
        {/* Bottom left dot */}
        <circle cx="65" cy="240" r="3.5" fill="#00f5a0" opacity="0.7" />
        {/* Right particle */}
        <circle cx="360" cy="210" r="5" fill="#818cf8" filter="url(#softGlow)" />
        {/* Cube Corner Glow Vertices */}
        <circle cx="200" cy="85" r="4" fill="#00f5a0" filter="url(#softGlow)" />
        <circle cx="315" cy="150" r="3.5" fill="#38bdf8" filter="url(#softGlow)" />
        <circle cx="85" cy="150" r="3.5" fill="#38bdf8" filter="url(#softGlow)" />
        <circle cx="200" cy="345" r="4" fill="#818cf8" filter="url(#softGlow)" />
      </svg>
    </div>
  );
}
