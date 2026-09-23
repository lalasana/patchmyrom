export type GbaPlayIconSize = 48 | 64 | 96 | 160;

/**
 * The real GBA Play launcher icon (from the Android app's v1.0.0 adaptive icon: black background +
 * neon badge). Files live in /public/gba-play/icon-{size}.webp; each size has a 2x sibling
 * (48→96, 64→128, 96→192, 160→320) so it stays sharp on high-DPI screens.
 * Fixed width/height + aspect-square = no stretching and no layout shift. Plain <img> because the
 * site is a static export with unoptimized images.
 */
export default function GbaPlayIcon({
  size = 48,
  alt = "",
  priority = false,
  className = "",
}: {
  size?: GbaPlayIconSize;
  /** Leave empty when the app name is already in the adjacent text; use a description on its own. */
  alt?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/gba-play/icon-${size}.webp`}
      srcSet={`/gba-play/icon-${size}.webp 1x, /gba-play/icon-${size * 2}.webp 2x`}
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
