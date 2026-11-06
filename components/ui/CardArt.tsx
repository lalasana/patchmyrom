import Image from "next/image";
import type { ReactNode } from "react";

export type CardArtName =
  | "cartridge"
  | "patch"
  | "download"
  | "checksum"
  | "wrongrom"
  | "whitescreen"
  | "unsupported"
  | "warning"
  | "guide"
  | "controller"
  | "formats"
  | "troubleshoot"
  | "shield"
  | "mail"
  | "legal"
  | "changelog"
  | "ips"
  | "ups"
  | "bps"
  | "xdelta";

export type CardArtAccent = "green" | "blue" | "purple" | "amber" | "rose";

const GREEN = "#39e07f";
const BLUE = "#4cc9f0";
const PURPLE = "#a78bfa";
const AMBER = "#fbbf24";
const ROSE = "#fb7185";
const INK = "#0a0b1c";

/** Small reusable cartridge shape (drawn at x,y with width w). */
function Cartridge({ x, y, w = 56, tone = PURPLE, label = true }: { x: number; y: number; w?: number; tone?: string; label?: boolean }) {
  const h = w * 1.3;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx={w * 0.12} fill={tone} fillOpacity="0.9" stroke={INK} strokeWidth="3" />
      <rect x={w * 0.08} y={h * 0.06} width={w * 0.84} height={h * 0.1} rx="2" fill="#fff" fillOpacity="0.18" />
      {label && <rect x={w * 0.14} y={h * 0.24} width={w * 0.72} height={h * 0.42} rx={w * 0.07} fill="#0b0d26" stroke={GREEN} strokeOpacity="0.6" strokeWidth="1.5" />}
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={w * 0.2 + i * (w * 0.1)} y={h * 0.8} width={w * 0.06} height={h * 0.12} rx="1" fill={BLUE} />
      ))}
    </g>
  );
}

function Art({ name }: { name: CardArtName }): ReactNode {
  switch (name) {
    case "cartridge":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <defs>
            <linearGradient id="ca-cart" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#6d56e0" />
              <stop offset="1" stopColor="#2b2072" />
            </linearGradient>
          </defs>
          <g>
            <rect x="82" y="10" width="76" height="100" rx="10" fill="url(#ca-cart)" stroke={INK} strokeWidth="3" />
            <rect x="90" y="14" width="60" height="6" rx="3" fill="#fff" fillOpacity="0.2" />
            <rect x="92" y="26" width="56" height="46" rx="6" fill="#0b0d26" stroke={GREEN} strokeOpacity="0.65" strokeWidth="1.8" />
            <image href="/brand/icon-192.webp" x="102" y="30" width="36" height="38" preserveAspectRatio="xMidYMid meet" />
            {Array.from({ length: 7 }).map((_, i) => (
              <rect key={i} x={94 + i * 8} y="92" width="5" height="12" rx="1" fill={BLUE} />
            ))}
          </g>
          <circle cx="40" cy="30" r="3" fill={GREEN} opacity="0.7" />
          <circle cx="198" cy="84" r="4" fill={BLUE} opacity="0.7" />
          <path d="M196 24l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill={PURPLE} opacity="0.85" />
          <path d="M44 86l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill={GREEN} opacity="0.85" />
        </svg>
      );
    case "patch":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <defs>
            <linearGradient id="ca-patch" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={GREEN} />
              <stop offset="1" stopColor={BLUE} />
            </linearGradient>
          </defs>
          <path d="M60 14h40l18 18v70a6 6 0 0 1-6 6H60a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6z" fill="#15183a" stroke={BLUE} strokeOpacity="0.7" strokeWidth="2" />
          <path d="M100 14v14a4 4 0 0 0 4 4h14" fill="none" stroke={BLUE} strokeOpacity="0.7" strokeWidth="2" />
          <g stroke={BLUE} strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round">
            <line x1="64" y1="48" x2="108" y2="48" />
            <line x1="64" y1="60" x2="100" y2="60" />
            <line x1="64" y1="72" x2="108" y2="72" />
            <line x1="64" y1="84" x2="92" y2="84" />
          </g>
          <g transform="rotate(-22 158 62)">
            <rect x="122" y="46" width="76" height="32" rx="10" fill="url(#ca-patch)" stroke={INK} strokeWidth="3" />
            <rect x="148" y="46" width="24" height="32" fill="#fff" fillOpacity="0.28" />
            <g fill={INK} fillOpacity="0.55">
              <circle cx="132" cy="56" r="2" />
              <circle cx="132" cy="62" r="2" />
              <circle cx="132" cy="68" r="2" />
              <circle cx="188" cy="56" r="2" />
              <circle cx="188" cy="62" r="2" />
              <circle cx="188" cy="68" r="2" />
            </g>
          </g>
          <path d="M200 20l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill={GREEN} opacity="0.9" />
        </svg>
      );
    case "download":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <defs>
            <linearGradient id="ca-dl" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={GREEN} />
              <stop offset="1" stopColor={BLUE} />
            </linearGradient>
          </defs>
          <circle cx="120" cy="46" r="30" fill="url(#ca-dl)" stroke={INK} strokeWidth="3" />
          <path d="M120 30v26M108 46l12 12 12-12" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M70 84h100a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H70a6 6 0 0 1-6-6v-8a6 6 0 0 1 6-6z" fill="#15183a" stroke={BLUE} strokeOpacity="0.6" strokeWidth="2" />
          <rect x="72" y="90" width="78" height="8" rx="4" fill="url(#ca-dl)" />
          <g transform="translate(184 30)">
            <path d="M0 10l12-6 12 6v12c0 8-6 14-12 17-6-3-12-9-12-17z" fill="#15183a" stroke={GREEN} strokeWidth="2" />
            <path d="M6 20l5 5 9-10" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <circle cx="50" cy="40" r="3" fill={BLUE} opacity="0.7" />
          <circle cx="206" cy="92" r="3" fill={GREEN} opacity="0.7" />
        </svg>
      );
    case "checksum":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <g>
            {Array.from({ length: 9 }).map((_, i) => (
              <rect key={`a${i}`} x={44 + i * 17} y="26" width="13" height="18" rx="3" fill={GREEN} fillOpacity={0.35 + (i % 3) * 0.18} stroke={GREEN} strokeOpacity="0.5" />
            ))}
            {Array.from({ length: 9 }).map((_, i) => (
              <rect
                key={`b${i}`}
                x={44 + i * 17}
                y="72"
                width="13"
                height="18"
                rx="3"
                fill={i === 5 ? ROSE : GREEN}
                fillOpacity={i === 5 ? 0.9 : 0.35 + (i % 3) * 0.18}
                stroke={i === 5 ? ROSE : GREEN}
                strokeOpacity="0.6"
              />
            ))}
          </g>
          <g transform="translate(120 58)">
            <circle r="12" fill="#15183a" stroke={ROSE} strokeWidth="2.5" />
            <path d="M-5 -5l10 10M5 -5l-10 10" stroke={ROSE} strokeWidth="3" strokeLinecap="round" />
          </g>
          <path d="M44 56h24M172 56h24" stroke="#fff" strokeOpacity="0.15" strokeWidth="2" strokeDasharray="3 4" />
        </svg>
      );
    case "wrongrom":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <Cartridge x={44} y={14} w={62} tone={BLUE} />
          <Cartridge x={134} y={14} w={62} tone={PURPLE} />
          <g transform="translate(120 56)">
            <circle r="13" fill="#15183a" stroke={AMBER} strokeWidth="2.5" />
            <path d="M-6 -3h12M-6 3h12M-4 8l8-16" stroke={AMBER} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </svg>
      );
    case "whitescreen":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <defs>
            <linearGradient id="ca-ws" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f4f7ff" />
              <stop offset="1" stopColor="#c9d3f5" />
            </linearGradient>
          </defs>
          <rect x="62" y="12" width="116" height="78" rx="10" fill="#15183a" stroke={BLUE} strokeOpacity="0.55" strokeWidth="2.5" />
          <rect x="70" y="20" width="100" height="62" rx="5" fill="url(#ca-ws)" />
          <g stroke="#8b9ad6" strokeOpacity="0.5" strokeWidth="2">
            <line x1="70" y1="40" x2="170" y2="40" />
            <line x1="70" y1="60" x2="170" y2="60" strokeDasharray="6 5" />
          </g>
          <rect x="100" y="96" width="40" height="6" rx="3" fill="#15183a" stroke={BLUE} strokeOpacity="0.5" />
          <rect x="88" y="102" width="64" height="6" rx="3" fill="#15183a" stroke={BLUE} strokeOpacity="0.5" />
          <g transform="translate(176 22)">
            <path d="M0 24L14 0l14 24z" fill={AMBER} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M14 8v8" stroke={INK} strokeWidth="3" strokeLinecap="round" />
            <circle cx="14" cy="20" r="1.8" fill={INK} />
          </g>
        </svg>
      );
    case "unsupported":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <path d="M84 12h44l20 20v66a6 6 0 0 1-6 6H84a6 6 0 0 1-6-6V18a6 6 0 0 1 6-6z" fill="#15183a" stroke={PURPLE} strokeOpacity="0.7" strokeWidth="2" />
          <path d="M128 12v14a4 4 0 0 0 4 4h16" fill="none" stroke={PURPLE} strokeOpacity="0.7" strokeWidth="2" />
          <path d="M100 56a14 14 0 1 1 20 12c-6 4-8 6-8 14" fill="none" stroke={AMBER} strokeWidth="5" strokeLinecap="round" />
          <circle cx="112" cy="94" r="3.5" fill={AMBER} />
          <g>
            <rect x="26" y="26" width="34" height="14" rx="7" fill={GREEN} fillOpacity="0.2" stroke={GREEN} strokeOpacity="0.5" />
            <rect x="26" y="48" width="34" height="14" rx="7" fill={BLUE} fillOpacity="0.2" stroke={BLUE} strokeOpacity="0.5" />
            <rect x="26" y="70" width="34" height="14" rx="7" fill={ROSE} fillOpacity="0.2" stroke={ROSE} strokeOpacity="0.6" />
            <path d="M34 72l18 10" stroke={ROSE} strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <circle cx="196" cy="34" r="4" fill={PURPLE} opacity="0.7" />
          <circle cx="204" cy="82" r="3" fill={BLUE} opacity="0.7" />
        </svg>
      );
    case "warning":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <path d="M120 14l44 76H76z" fill="#15183a" stroke={AMBER} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M120 40v26" stroke={AMBER} strokeWidth="6" strokeLinecap="round" />
          <circle cx="120" cy="78" r="4" fill={AMBER} />
          <circle cx="56" cy="32" r="3" fill={AMBER} opacity="0.6" />
          <circle cx="188" cy="86" r="4" fill={ROSE} opacity="0.6" />
          <path d="M190 24l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill={AMBER} opacity="0.85" />
        </svg>
      );
    case "guide":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <defs>
            <linearGradient id="ca-book" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={BLUE} />
              <stop offset="1" stopColor={GREEN} />
            </linearGradient>
          </defs>
          <path d="M120 24C102 14 78 14 58 20v72c20-6 44-6 62 4z" fill="#15183a" stroke="url(#ca-book)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M120 24c18-10 42-10 62-4v72c-20-6-44-6-62 4z" fill="#1a1e46" stroke="url(#ca-book)" strokeWidth="3" strokeLinejoin="round" />
          <g stroke={BLUE} strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round">
            <line x1="72" y1="38" x2="106" y2="42" />
            <line x1="72" y1="52" x2="106" y2="56" />
            <line x1="72" y1="66" x2="98" y2="69" />
          </g>
          <g stroke={GREEN} strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round">
            <line x1="134" y1="42" x2="168" y2="38" />
            <line x1="134" y1="56" x2="168" y2="52" />
          </g>
          <path d="M150 22v26l8-6 8 6V19" fill={ROSE} fillOpacity="0.9" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "controller":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <defs>
            <linearGradient id="ca-ctl" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#6d56e0" />
              <stop offset="1" stopColor="#2b2072" />
            </linearGradient>
          </defs>
          <path d="M70 34h100a26 26 0 0 1 26 26l6 22a14 14 0 0 1-24 12l-12-14H74L62 94a14 14 0 0 1-24-12l6-22a26 26 0 0 1 26-26z" fill="url(#ca-ctl)" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M82 52v22M71 63h22" stroke="#fff" strokeOpacity="0.9" strokeWidth="6" strokeLinecap="round" />
          <circle cx="160" cy="58" r="7" fill={GREEN} stroke={INK} strokeWidth="2.5" />
          <circle cx="178" cy="68" r="7" fill={BLUE} stroke={INK} strokeWidth="2.5" />
          <rect x="108" y="56" width="10" height="4" rx="2" fill="#fff" fillOpacity="0.5" />
          <rect x="124" y="56" width="10" height="4" rx="2" fill="#fff" fillOpacity="0.5" />
        </svg>
      );
    case "formats":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <rect x="44" y="14" width="152" height="92" rx="10" fill="#15183a" stroke={BLUE} strokeOpacity="0.5" strokeWidth="2" />
          <g>
            <rect x="58" y="28" width="10" height="10" rx="2" fill={GREEN} fillOpacity="0.9" />
            <rect x="74" y="31" width="80" height="4" rx="2" fill={GREEN} fillOpacity="0.5" />
            <rect x="58" y="46" width="10" height="10" rx="2" fill={ROSE} fillOpacity="0.9" />
            <rect x="74" y="49" width="56" height="4" rx="2" fill={ROSE} fillOpacity="0.5" />
            <rect x="58" y="64" width="10" height="10" rx="2" fill={GREEN} fillOpacity="0.9" />
            <rect x="74" y="67" width="96" height="4" rx="2" fill={GREEN} fillOpacity="0.5" />
            <rect x="58" y="82" width="10" height="10" rx="2" fill={BLUE} fillOpacity="0.9" />
            <rect x="74" y="85" width="64" height="4" rx="2" fill={BLUE} fillOpacity="0.5" />
          </g>
          <path d="M186 20l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill={PURPLE} opacity="0.9" />
        </svg>
      );
    case "troubleshoot":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <defs>
            <linearGradient id="ca-ts" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={AMBER} />
              <stop offset="1" stopColor={ROSE} />
            </linearGradient>
          </defs>
          <g transform="rotate(-35 120 60)">
            <rect x="106" y="22" width="28" height="78" rx="12" fill="#15183a" stroke="url(#ca-ts)" strokeWidth="3.5" />
            <circle cx="120" cy="30" r="14" fill="none" stroke="url(#ca-ts)" strokeWidth="6" />
          </g>
          <circle cx="56" cy="84" r="3" fill={AMBER} opacity="0.7" />
          <circle cx="186" cy="34" r="4" fill={ROSE} opacity="0.7" />
          <path d="M190 78l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill={AMBER} opacity="0.85" />
        </svg>
      );
    case "mail":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <defs>
            <linearGradient id="ca-mail" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={BLUE} />
              <stop offset="1" stopColor={GREEN} />
            </linearGradient>
          </defs>
          <rect x="60" y="26" width="120" height="76" rx="10" fill="#15183a" stroke="url(#ca-mail)" strokeWidth="3.5" />
          <path d="M64 32l56 40 56-40" fill="none" stroke="url(#ca-mail)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="182" cy="30" r="12" fill={GREEN} stroke={INK} strokeWidth="2.5" />
          <path d="M176 30l4 4 7-8" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="44" cy="40" r="3" fill={BLUE} opacity="0.7" />
          <circle cx="204" cy="92" r="3" fill={GREEN} opacity="0.7" />
        </svg>
      );
    case "legal":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <path d="M78 12h64l22 22v70a6 6 0 0 1-6 6H78a6 6 0 0 1-6-6V18a6 6 0 0 1 6-6z" fill="#15183a" stroke={PURPLE} strokeOpacity="0.8" strokeWidth="2.5" />
          <path d="M142 12v16a6 6 0 0 0 6 6h16" fill="none" stroke={PURPLE} strokeOpacity="0.8" strokeWidth="2.5" />
          <g stroke={PURPLE} strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round">
            <line x1="86" y1="48" x2="150" y2="48" />
            <line x1="86" y1="60" x2="150" y2="60" />
            <line x1="86" y1="72" x2="126" y2="72" />
          </g>
          <circle cx="146" cy="90" r="14" fill={AMBER} stroke={INK} strokeWidth="3" />
          <path d="M139 98l-3 14 10-5 10 5-3-14" fill={ROSE} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="146" cy="90" r="6" fill="none" stroke={INK} strokeOpacity="0.5" strokeWidth="2" />
        </svg>
      );
    case "changelog":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <line x1="70" y1="18" x2="70" y2="104" stroke={BLUE} strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
          {[28, 60, 92].map((y, i) => (
            <g key={y}>
              <circle cx="70" cy={y} r="8" fill="#15183a" stroke={i === 0 ? GREEN : BLUE} strokeWidth="3" />
              {i === 0 && <circle cx="70" cy={y} r="3.5" fill={GREEN} />}
              <rect x="90" y={y - 12} width={92 - i * 14} height="24" rx="7" fill="#15183a" stroke={i === 0 ? GREEN : BLUE} strokeOpacity="0.55" strokeWidth="2" />
              <rect x="100" y={y - 4} width={52 - i * 8} height="4" rx="2" fill={i === 0 ? GREEN : BLUE} fillOpacity="0.6" />
              <rect x="100" y={y + 3} width={32 - i * 4} height="3" rx="1.5" fill="#fff" fillOpacity="0.25" />
            </g>
          ))}
          <path d="M196 26l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill={PURPLE} opacity="0.9" />
        </svg>
      );
    case "ips":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <defs>
            <linearGradient id="ca-ips" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#4ade80" />
              <stop offset="1" stopColor="#16a34a" />
            </linearGradient>
          </defs>
          {/* floppy disk: the classic, original patch format */}
          <path d="M30 20h56l14 14v64a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6V26a6 6 0 0 1 6-6z" fill="#15183a" stroke="url(#ca-ips)" strokeWidth="3.5" strokeLinejoin="round" />
          <rect x="38" y="20" width="36" height="22" rx="3" fill="url(#ca-ips)" fillOpacity="0.9" />
          <rect x="62" y="24" width="7" height="14" rx="2" fill="#15183a" />
          <rect x="36" y="60" width="52" height="34" rx="4" fill="#e8fff1" fillOpacity="0.92" />
          <g stroke="#16a34a" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round">
            <line x1="42" y1="70" x2="78" y2="70" />
            <line x1="42" y1="78" x2="70" y2="78" />
            <line x1="42" y1="86" x2="80" y2="86" />
          </g>
          <text x="112" y="70" fontSize="46" fontWeight="800" fill="url(#ca-ips)" stroke={INK} strokeWidth="1.5" paintOrder="stroke" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif", letterSpacing: "-1px" }}>
            IPS
          </text>
          <g>
            <rect x="114" y="82" width="9" height="9" rx="2" fill={GREEN} />
            <rect x="128" y="85" width="56" height="4" rx="2" fill={GREEN} fillOpacity="0.55" />
            <rect x="114" y="96" width="9" height="9" rx="2" fill={ROSE} />
            <rect x="128" y="99" width="38" height="4" rx="2" fill={ROSE} fillOpacity="0.55" />
          </g>
        </svg>
      );
    case "ups":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <defs>
            <linearGradient id="ca-ups" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7dd3fc" />
              <stop offset="1" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          {/* shield: checksum-verified */}
          <path d="M58 14l34 13v26c0 24-15 40-34 48-19-8-34-24-34-48V27z" fill="#15183a" stroke="url(#ca-ups)" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M43 56l11 11 20-24" fill="none" stroke="url(#ca-ups)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="112" y="68" fontSize="46" fontWeight="800" fill="url(#ca-ups)" stroke={INK} strokeWidth="1.5" paintOrder="stroke" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif", letterSpacing: "-1px" }}>
            UPS
          </text>
          <g>
            {Array.from({ length: 8 }).map((_, i) => (
              <rect key={i} x={114 + i * 14} y="82" width="10" height="14" rx="2.5" fill={BLUE} fillOpacity={0.3 + (i % 3) * 0.2} stroke={BLUE} strokeOpacity="0.6" />
            ))}
            <path d="M114 106h104" stroke={BLUE} strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 6" />
          </g>
        </svg>
      );
    case "bps":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <defs>
            <linearGradient id="ca-bps" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#c4b5fd" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          {/* stacked layers: modern, efficient diffs */}
          <g strokeLinejoin="round" strokeWidth="3">
            <path d="M58 78l34-16-34-16-34 16z" fill="#2b2072" stroke={INK} />
            <path d="M24 78v10l34 16 34-16V78l-34 16z" fill="#1d1650" stroke={INK} />
            <path d="M58 62l34-16-34-16-34 16z" fill="#4c3aa6" stroke={INK} />
            <path d="M58 46l34-16-34-16-34 16z" fill="url(#ca-bps)" stroke={INK} />
          </g>
          <path d="M96 14l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill={GREEN} />
          <text x="112" y="70" fontSize="46" fontWeight="800" fill="url(#ca-bps)" stroke={INK} strokeWidth="1.5" paintOrder="stroke" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif", letterSpacing: "-1px" }}>
            BPS
          </text>
          <g>
            <rect x="114" y="82" width="104" height="8" rx="4" fill="#15183a" stroke={PURPLE} strokeOpacity="0.6" />
            <rect x="116" y="84" width="76" height="4" rx="2" fill="url(#ca-bps)" />
            <rect x="114" y="98" width="62" height="4" rx="2" fill={PURPLE} fillOpacity="0.4" />
          </g>
        </svg>
      );
    case "xdelta":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <defs>
            <linearGradient id="ca-xd" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fde68a" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          {/* delta triangle over a big file stack: large ROMs */}
          <rect x="26" y="70" width="64" height="30" rx="6" fill="#15183a" stroke={AMBER} strokeOpacity="0.5" strokeWidth="2.5" />
          <rect x="30" y="58" width="56" height="30" rx="6" fill="#1a1e46" stroke={AMBER} strokeOpacity="0.7" strokeWidth="2.5" />
          <path d="M58 14l30 50H28z" fill="#15183a" stroke="url(#ca-xd)" strokeWidth="4" strokeLinejoin="round" />
          <path d="M58 30l13 22H45z" fill="url(#ca-xd)" fillOpacity="0.85" />
          <circle cx="40" cy="79" r="2.5" fill={AMBER} />
          <circle cx="40" cy="92" r="2.5" fill={AMBER} fillOpacity="0.6" />
          <text x="104" y="66" fontSize="33" fontWeight="800" fill="url(#ca-xd)" stroke={INK} strokeWidth="1.5" paintOrder="stroke" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif", letterSpacing: "-1px" }}>
            xdelta
          </text>
          <g>
            <rect x="106" y="80" width="116" height="8" rx="4" fill="#15183a" stroke={AMBER} strokeOpacity="0.6" />
            <rect x="108" y="82" width="104" height="4" rx="2" fill="url(#ca-xd)" />
            <path d="M106 100h60" stroke={AMBER} strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 6" />
          </g>
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 240 120" className="h-full w-full">
          <path d="M120 10l40 16v28c0 28-18 46-40 56-22-10-40-28-40-56V26z" fill="#15183a" stroke={GREEN} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M104 56l12 12 22-26" fill="none" stroke={GREEN} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

const ACCENTS: Record<CardArtAccent, string> = {
  green: "from-accent-green/20 via-accent-blue/10 to-accent-purple/10",
  blue: "from-accent-blue/20 via-accent-purple/10 to-accent-green/10",
  purple: "from-accent-purple/25 via-accent-blue/10 to-accent-green/10",
  amber: "from-amber-400/20 via-rose-400/10 to-accent-purple/10",
  rose: "from-rose-400/20 via-accent-purple/10 to-accent-blue/10",
};

export { ACCENTS as CARD_ART_ACCENTS };

/**
 * Decorative illustration band for the top of a card. Hidden from assistive tech; carries no
 * text, so it never changes the page's content or SEO.
 */
export default function CardArt({
  name,
  accent = "green",
  className = "h-28",
}: {
  name: CardArtName;
  accent?: CardArtAccent;
  className?: string;
}) {
  return (
    <div aria-hidden className={`card-art relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${ACCENTS[accent]} ${className}`}>
      <div className="relative h-full w-full max-w-[260px] p-2 drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)]">
        <Art name={name} />
      </div>
    </div>
  );
}

/** Brand-mark variant used for the call-to-action cards. */
export function BrandArt({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <Image
      aria-hidden
      src="/brand/icon-192.webp"
      alt=""
      width={192}
      height={192}
      className={`${className} drop-shadow-[0_8px_24px_rgba(57,224,127,0.35)]`}
    />
  );
}
