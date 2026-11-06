import type { ReactNode } from "react";

export type PlatformKey = "gba" | "nds" | "gbc" | "nes" | "snes";

const GREEN = "#39e07f";
const BLUE = "#4cc9f0";
const PURPLE = "#a78bfa";
const AMBER = "#fbbf24";
const ROSE = "#fb7185";
const INK = "#0a0b1c";
const SCREEN = "#0b0d26";

function Sparkles({ a = PURPLE, b = GREEN }: { a?: string; b?: string }) {
  return (
    <>
      <circle cx="30" cy="26" r="3" fill={b} opacity="0.7" />
      <circle cx="212" cy="92" r="4" fill={BLUE} opacity="0.7" />
      <path d="M206 22l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill={a} opacity="0.85" />
      <path d="M34 88l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill={b} opacity="0.85" />
    </>
  );
}

function DPad({ x, y, s = 7 }: { x: number; y: number; s?: number }) {
  return (
    <g fill={INK} fillOpacity="0.8">
      <rect x={x - s * 1.5} y={y - s * 0.5} width={s * 3} height={s} rx="1.5" />
      <rect x={x - s * 0.5} y={y - s * 1.5} width={s} height={s * 3} rx="1.5" />
    </g>
  );
}

/** Distinct, cohesive silhouettes (same 240x120 box, ink outline and palette as CardArt). */
function Art({ platform }: { platform: PlatformKey }): ReactNode {
  switch (platform) {
    case "gba":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <defs>
            <linearGradient id="pa-gba" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7a63ea" />
              <stop offset="1" stopColor="#2b2072" />
            </linearGradient>
          </defs>
          <rect x="46" y="24" width="148" height="76" rx="22" fill="url(#pa-gba)" stroke={INK} strokeWidth="3" />
          <rect x="54" y="16" width="30" height="10" rx="4" fill="#4b3aa8" stroke={INK} strokeWidth="2.5" />
          <rect x="156" y="16" width="30" height="10" rx="4" fill="#4b3aa8" stroke={INK} strokeWidth="2.5" />
          <rect x="82" y="34" width="76" height="52" rx="6" fill={SCREEN} stroke={GREEN} strokeOpacity="0.7" strokeWidth="2" />
          <path d="M92 70l10-12 8 8 10-14 12 18z" fill={GREEN} fillOpacity="0.35" />
          <DPad x={64} y={62} />
          <circle cx="172" cy="56" r="6" fill={ROSE} stroke={INK} strokeWidth="2" />
          <circle cx="184" cy="68" r="6" fill={AMBER} stroke={INK} strokeWidth="2" />
          <Sparkles />
        </svg>
      );
    case "nds":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <defs>
            <linearGradient id="pa-nds" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#6fd3f5" />
              <stop offset="1" stopColor="#1f5f86" />
            </linearGradient>
          </defs>
          <rect x="78" y="6" width="84" height="48" rx="9" fill="url(#pa-nds)" stroke={INK} strokeWidth="3" />
          <rect x="88" y="12" width="64" height="36" rx="4" fill={SCREEN} stroke={BLUE} strokeOpacity="0.8" strokeWidth="2" />
          <rect x="108" y="54" width="24" height="6" fill="#16445f" stroke={INK} strokeWidth="2" />
          <rect x="78" y="60" width="84" height="54" rx="9" fill="url(#pa-nds)" stroke={INK} strokeWidth="3" />
          <rect x="102" y="66" width="36" height="34" rx="4" fill={SCREEN} stroke={BLUE} strokeOpacity="0.8" strokeWidth="2" />
          <DPad x={90} y={86} s={5} />
          <circle cx="150" cy="82" r="4" fill={ROSE} stroke={INK} strokeWidth="1.5" />
          <circle cx="146" cy="94" r="4" fill={AMBER} stroke={INK} strokeWidth="1.5" />
          <path d="M44 100l26-34" stroke={AMBER} strokeWidth="4" strokeLinecap="round" />
          <Sparkles a={BLUE} b={PURPLE} />
        </svg>
      );
    case "gbc":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <defs>
            <linearGradient id="pa-gbc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#59e59a" />
              <stop offset="1" stopColor="#157a46" />
            </linearGradient>
          </defs>
          <path d="M88 8h64a8 8 0 0 1 8 8v78a14 14 0 0 1-14 14H94a14 14 0 0 1-14-14V16a8 8 0 0 1 8-8z" fill="url(#pa-gbc)" stroke={INK} strokeWidth="3" />
          <rect x="92" y="16" width="56" height="42" rx="6" fill="#16213a" stroke={INK} strokeWidth="2.5" />
          <rect x="98" y="22" width="44" height="30" rx="3" fill={SCREEN} stroke={GREEN} strokeOpacity="0.7" strokeWidth="1.8" />
          <g>
            <rect x="104" y="28" width="9" height="9" fill={ROSE} />
            <rect x="115" y="28" width="9" height="9" fill={AMBER} />
            <rect x="126" y="28" width="9" height="9" fill={BLUE} />
            <rect x="104" y="39" width="9" height="9" fill={PURPLE} />
            <rect x="115" y="39" width="9" height="9" fill={GREEN} />
          </g>
          <DPad x={102} y={80} s={6} />
          <circle cx="132" cy="78" r="5.5" fill={ROSE} stroke={INK} strokeWidth="2" />
          <circle cx="144" cy="70" r="5.5" fill={ROSE} stroke={INK} strokeWidth="2" />
          <Sparkles a={GREEN} b={AMBER} />
        </svg>
      );
    case "nes":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <rect x="40" y="30" width="160" height="62" rx="6" fill="#d8d3c8" stroke={INK} strokeWidth="3" />
          <rect x="48" y="38" width="144" height="46" rx="3" fill="#3b3b44" stroke={INK} strokeWidth="2.5" />
          <DPad x={76} y={61} s={8} />
          <rect x="104" y="58" width="16" height="6" rx="3" fill="#8b8b95" stroke={INK} strokeWidth="1.5" />
          <rect x="126" y="58" width="16" height="6" rx="3" fill="#8b8b95" stroke={INK} strokeWidth="1.5" />
          <circle cx="164" cy="62" r="8" fill={ROSE} stroke={INK} strokeWidth="2.5" />
          <circle cx="184" cy="62" r="8" fill={ROSE} stroke={INK} strokeWidth="2.5" />
          <text x="104" y="52" fontSize="6" fontWeight="700" fill="#c9c9d3">SELECT</text>
          <text x="127" y="52" fontSize="6" fontWeight="700" fill="#c9c9d3">START</text>
          <rect x="40" y="30" width="160" height="6" rx="3" fill={ROSE} fillOpacity="0.9" />
          <Sparkles a={ROSE} b={AMBER} />
        </svg>
      );
    case "snes":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <path d="M62 34h116c14 0 26 10 26 24s-12 30-26 30c-8 0-12-6-18-6H80c-6 0-10 6-18 6-14 0-26-16-26-30s12-24 26-24z" fill="#d9d6e6" stroke={INK} strokeWidth="3" />
          <DPad x={72} y={60} s={8} />
          <rect x="102" y="62" width="14" height="6" rx="3" fill="#8b8b9a" stroke={INK} strokeWidth="1.5" transform="rotate(-20 109 65)" />
          <rect x="122" y="62" width="14" height="6" rx="3" fill="#8b8b9a" stroke={INK} strokeWidth="1.5" transform="rotate(-20 129 65)" />
          <circle cx="168" cy="52" r="6" fill={GREEN} stroke={INK} strokeWidth="2" />
          <circle cx="156" cy="62" r="6" fill={BLUE} stroke={INK} strokeWidth="2" />
          <circle cx="180" cy="62" r="6" fill={ROSE} stroke={INK} strokeWidth="2" />
          <circle cx="168" cy="72" r="6" fill={AMBER} stroke={INK} strokeWidth="2" />
          <Sparkles a={PURPLE} b={ROSE} />
        </svg>
      );
  }
}

export default function PlatformArt({ platform }: { platform: PlatformKey }) {
  return (
    <div className="relative h-full w-full max-w-[260px] p-2 drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]">
      <Art platform={platform} />
    </div>
  );
}
