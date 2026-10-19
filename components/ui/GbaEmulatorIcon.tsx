export type GbaEmulatorIconSize = 48 | 64 | 96 | 160;

/**
 * The app's real Google Play icon. Files live in /public/gba-emulator/icon-{size}.webp; each size
 * has a 2x sibling (48→96, 64→128, 96→192, 160→320) so it stays sharp on high-DPI screens.
 * Fixed width/height + aspect-square = no stretching and no layout shift. Plain <img> because the
 * site is a static export with unoptimized images.
 */
export default function GbaEmulatorIcon({
  size = 48,
  alt = "",
  priority = false,
  className = "",
}: {
  size?: GbaEmulatorIconSize;
  /** Leave empty when the app name is already in the adjacent text; use a description on its own. */
  alt?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/gba-emulator/icon-${size}.webp`}
      srcSet={`/gba-emulator/icon-${size}.webp 1x, /gba-emulator/icon-${size * 2}.webp 2x`}
      width={size}
      height={size}
      alt={alt}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      loading={priority ? "eager" : "lazy"}
      className={`aspect-square flex-none rounded-[22%] object-cover ring-1 ring-accent-blue/30 shadow-lg shadow-accent-blue/20 ${className}`}
    />
  );
}
