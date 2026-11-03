import Image from "next/image";

const ORBIT_ITEMS = [
  { label: "IPS", angle: 0, classes: "border-accent-green/40 bg-accent-green/15 text-accent-green" },
  { label: "UPS", angle: 90, classes: "border-accent-blue/40 bg-accent-blue/15 text-accent-blue" },
  { label: "BPS", angle: 180, classes: "border-purple-400/40 bg-purple-500/15 text-purple-300" },
  { label: "XDELTA", angle: 270, classes: "border-amber-400/40 bg-amber-500/15 text-amber-300" },
] as const;

function Sparkle({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`pointer-events-none absolute h-4 w-4 sm:h-5 sm:w-5 ${className}`}
      fill="currentColor"
    >
      <path d="M12 0c.6 6.3 5.7 11.4 12 12-6.3.6-11.4 5.7-12 12-.6-6.3-5.7-11.4-12-12C6.3 11.4 11.4 6.3 12 0z" />
    </svg>
  );
}

/**
 * Decorative hero illustration: a ROM cartridge (carrying the brand mark) that gets "patched"
 * by a patch piece snapping in, while the supported formats orbit it. Pure presentation —
 * hidden from assistive tech; all animations are CSS and are disabled for reduced motion.
 */
export default function PatchHero({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`relative mx-auto aspect-square w-full max-w-[400px] select-none ${className}`}>
      {/* soft glow behind */}
      <div className="hero-glow absolute inset-[14%] rounded-full bg-gradient-to-br from-accent-green/35 via-accent-blue/25 to-accent-purple/35 blur-3xl" />

      {/* orbit ring */}
      <div className="absolute inset-[3%] rounded-full border border-dashed border-border/80" />
      <div className="hero-orbit absolute inset-[3%]">
        {ORBIT_ITEMS.map((item) => (
          <div key={item.label} className="absolute inset-0" style={{ transform: `rotate(${item.angle}deg)` }}>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
              <div style={{ transform: `rotate(-${item.angle}deg)` }}>
                <span
                  className={`hero-orbit-chip flex h-6 w-12 items-center justify-center rounded-md border text-[10px] font-bold tracking-wide shadow-[0_3px_0_0_rgba(0,0,0,0.35)] backdrop-blur-sm sm:h-7 sm:w-14 sm:text-xs ${item.classes}`}
                >
                  {item.label}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* cartridge */}
      <div className="hero-float absolute inset-[22%] flex items-center justify-center">
        <svg viewBox="0 0 200 240" className="h-full w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.5)]">
          <defs>
            <linearGradient id="hc-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#5b46c7" />
              <stop offset="1" stopColor="#2b2072" />
            </linearGradient>
            <linearGradient id="hc-edge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="hc-pins" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4cc9f0" />
              <stop offset="1" stopColor="#39e07f" />
            </linearGradient>
          </defs>

          {/* body with top notch */}
          <path
            d="M24 8h152a12 12 0 0 1 12 12v176a12 12 0 0 1-12 12h-14v14a6 6 0 0 1-6 6H44a6 6 0 0 1-6-6v-14H24a12 12 0 0 1-12-12V20A12 12 0 0 1 24 8z"
            fill="url(#hc-body)"
            stroke="#120d3a"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path d="M24 12h152a8 8 0 0 1 8 8v26H16V20a8 8 0 0 1 8-8z" fill="url(#hc-edge)" />

          {/* grip ridges */}
          <g stroke="#120d3a" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round">
            <line x1="40" y1="24" x2="160" y2="24" />
            <line x1="40" y1="32" x2="160" y2="32" />
          </g>

          {/* label window */}
          <rect x="30" y="50" width="140" height="118" rx="10" fill="#0b0d26" stroke="#39e07f" strokeOpacity="0.55" strokeWidth="2.5" />

          {/* connector pins */}
          <g fill="url(#hc-pins)">
            {Array.from({ length: 9 }).map((_, i) => (
              <rect key={i} x={50 + i * 11} y="214" width="6" height="14" rx="1.5" />
            ))}
          </g>
        </svg>

        {/* brand mark on the label */}
        <div className="absolute left-[15%] top-[21%] flex h-[49%] w-[70%] items-center justify-center">
          <Image
            src="/brand/icon-512.webp"
            alt=""
            width={512}
            height={512}
            className="h-[88%] w-auto drop-shadow-[0_0_14px_rgba(57,224,127,0.55)]"
          />
        </div>

        {/* patch piece snapping in */}
        <div className="hero-patch absolute bottom-[26%] right-[2%] h-[26%] w-[34%]">
          <svg viewBox="0 0 80 60" className="h-full w-full drop-shadow-[0_6px_14px_rgba(57,224,127,0.55)]">
            <defs>
              <linearGradient id="hp-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#39e07f" />
                <stop offset="1" stopColor="#4cc9f0" />
              </linearGradient>
            </defs>
            <g transform="rotate(-18 40 30)">
              <rect x="6" y="14" width="68" height="32" rx="9" fill="url(#hp-grad)" stroke="#0a0b1c" strokeWidth="3" />
              <rect x="26" y="14" width="28" height="32" fill="#ffffff" fillOpacity="0.28" />
              <g fill="#0a0b1c" fillOpacity="0.55">
                <circle cx="14" cy="22" r="1.8" />
                <circle cx="14" cy="30" r="1.8" />
                <circle cx="14" cy="38" r="1.8" />
                <circle cx="66" cy="22" r="1.8" />
                <circle cx="66" cy="30" r="1.8" />
                <circle cx="66" cy="38" r="1.8" />
              </g>
            </g>
          </svg>
        </div>

        {/* snap flash */}
        <div className="hero-flash absolute bottom-[30%] right-[8%] h-[22%] w-[22%] rounded-full border-2 border-accent-green" />
      </div>

      <Sparkle className="hero-twinkle left-[8%] top-[22%] text-accent-green" />
      <Sparkle className="hero-twinkle-b right-[6%] top-[12%] text-accent-blue" />
      <Sparkle className="hero-twinkle-c bottom-[14%] left-[16%] text-accent-purple" />
      <Sparkle className="hero-twinkle right-[12%] bottom-[8%] text-accent-green" />
    </div>
  );
}
