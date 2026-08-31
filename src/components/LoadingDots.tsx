interface LoadingDotsProps {
  /** When true the overlay fades out and stops intercepting pointer events. */
  ready: boolean;
  /** Backdrop fill. Defaults to the site cream so it matches the retail pages. */
  background?: string;
  /** Dot fill. Defaults to ink, which reads on the cream backdrop. */
  dotColor?: string;
}

/**
 * Full-screen three-dot loading overlay — the same mark the wholesale portal
 * and /producers already use, extracted so every page shows one loading state
 * rather than each rolling its own.
 *
 * It is held over a page while that page's imagery preloads, then fades (never
 * unmounts abruptly) once `ready` flips, so the page appears complete instead
 * of tile by tile. It sits above a fixed header at z-100; the page renders
 * underneath the whole time, so when the overlay lifts the finished page is
 * already there.
 */
const LoadingDots = ({
  ready,
  background = "#F8F5E4",
  dotColor = "#0E0E0E",
}: LoadingDotsProps) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center"
    style={{
      background,
      opacity: ready ? 0 : 1,
      pointerEvents: ready ? "none" : "auto",
      transition: "opacity 500ms ease",
    }}
    role="status"
    aria-live="polite"
    aria-label="Loading"
    aria-hidden={ready}
  >
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-3 w-3 rounded-full animate-bounce"
          style={{ background: dotColor, animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </div>
);

export default LoadingDots;
