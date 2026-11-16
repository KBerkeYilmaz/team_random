// PROTOTYPE, never merge. Liquid Pour workshop: what shows when WebGL2 is unavailable or
// the context is lost (also forced with ?lwfallback=1). Static radial glow + SVG grain.
export default function LiquidFallback() {
  return (
    <div className="lw-fallback absolute inset-0">
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07]"
        aria-hidden="true"
      >
        <filter id="lw-fallback-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#lw-fallback-grain)" />
      </svg>
    </div>
  );
}
