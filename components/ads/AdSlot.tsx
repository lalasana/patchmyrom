type AdSlotProps = {
  label?: string;
  className?: string;
};

/**
 * Disabled ad placeholder. No ad network script is loaded anywhere in the
 * app. This component only reserves layout space for Phase 4+ once the
 * site is approved for a real ad network.
 */
export default function AdSlot({ label = "Ad space", className = "" }: AdSlotProps) {
  return (
    <div
      className={`card flex min-h-24 items-center justify-center border-dashed text-xs text-muted ${className}`}
      aria-hidden="true"
      data-ad-status="disabled"
    >
      {label} (disabled)
    </div>
  );
}
