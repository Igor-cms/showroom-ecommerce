// Full-screen loading state for the wholesale portal. Shown while the hero
// background image and main page elements are still loading. Dark backdrop
// (matching the site's ink/hero tone) with cream-colored bouncing dots.
const WholesaleLoadingScreen = () => {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-wholesale-primary"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-3 w-3 rounded-full bg-bg-cream animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default WholesaleLoadingScreen;
