type IconProps = {
  className?: string;
};

const base = "1.5" as const;

export function IconCartridge({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 3.5h8l4 4.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 19V5A1.5 1.5 0 0 1 3.5 3.5H6Z"
        stroke="currentColor"
        strokeWidth={base}
        strokeLinejoin="round"
      />
      <path d="M8 3.5V8h5V3.5" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
      <rect x="6" y="11.5" width="12" height="5.5" rx="1" stroke="currentColor" strokeWidth={base} />
    </svg>
  );
}

export function IconPatchFile({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 2.75h7l4 4v12.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3.75a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth={base}
        strokeLinejoin="round"
      />
      <path d="M14 2.75v4h4" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
      <path d="M9.5 13h5M12 10.5v5" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
    </svg>
  );
}

export function IconDownloadTray({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3v11.5M12 14.5 8 10.5M12 14.5l4-4" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-3.5" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconShieldCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3 5 5.5V11c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V5.5L12 3Z"
        stroke="currentColor"
        strokeWidth={base}
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4.5" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconBolt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 2.5 5 13.5h5.5L11 21.5l7.5-11.5H13l-0.5-7.5Z" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
    </svg>
  );
}

export function IconCloudOff({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 17.5h10a3.5 3.5 0 0 0 .6-6.95A5 5 0 0 0 8.1 8.6 4 4 0 0 0 7 17.5Z"
        stroke="currentColor"
        strokeWidth={base}
        strokeLinejoin="round"
      />
      <path d="M3.5 3.5l17 17" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
    </svg>
  );
}

export function IconSmartphone({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="6.5" y="2.5" width="11" height="19" rx="2" stroke="currentColor" strokeWidth={base} />
      <path d="M10.5 18.5h3" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
    </svg>
  );
}

export function IconGamepad({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6.5 7.5h11a4 4 0 0 1 4 4.5l-.7 4a2.3 2.3 0 0 1-4.1 1.1L15 15.5H9l-1.7 1.6a2.3 2.3 0 0 1-4.1-1.1l-.7-4a4 4 0 0 1 4-4.5Z"
        stroke="currentColor"
        strokeWidth={base}
        strokeLinejoin="round"
      />
      <path d="M8 10v3M6.5 11.5h3" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
      <circle cx="16" cy="10.5" r="0.9" fill="currentColor" />
      <circle cx="18" cy="12.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function IconAlertTriangle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3.5 21 19.5H3L12 3.5Z" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
      <path d="M12 9.5v4.5" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
      <circle cx="12" cy="16.75" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function IconDatabase({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <ellipse cx="12" cy="5.5" rx="7" ry="2.5" stroke="currentColor" strokeWidth={base} />
      <path d="M5 5.5V18.5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5.5" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
      <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
    </svg>
  );
}

export function IconMonitorX({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth={base} />
      <path d="M9 20.5h6M12 16.5v4" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
      <path d="M9.5 8l5 5M14.5 8l-5 5" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
    </svg>
  );
}

export function IconFileQuestion({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 2.75h7l4 4v12.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3.75a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth={base}
        strokeLinejoin="round"
      />
      <path d="M14 2.75v4h4" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
      <path d="M10.3 11.2a1.7 1.7 0 1 1 2.4 1.55c-.6.3-.9.6-.9 1.25" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function IconArrowRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4.5 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconInfo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={base} />
      <path d="M12 11v5.5" stroke="currentColor" strokeWidth={base} strokeLinecap="round" />
      <circle cx="12" cy="7.75" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function IconLayers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3 3 8l9 5 9-5-9-5Z" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
      <path d="M3 12l9 5 9-5M3 16l9 5 9-5" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
    </svg>
  );
}

export function IconUpload({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 15.5V4M12 4 8 8M12 4l4 4" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-3.5" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCopy({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
      <path d="M15.5 8.5V5.5A1.5 1.5 0 0 0 14 4H5.5A1.5 1.5 0 0 0 4 5.5V14a1.5 1.5 0 0 0 1.5 1.5h3" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronDown({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={base} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPlay({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth={base} />
      <path d="M10 8.5v7l5.5-3.5L10 8.5Z" fill="currentColor" stroke="currentColor" strokeWidth={base} strokeLinejoin="round" />
    </svg>
  );
}
