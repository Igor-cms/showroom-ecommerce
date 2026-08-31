import companyLogo from "@/assets/company-logo.webp";

/**
 * ReducedLogo — the site's standard compact ("reduced") logo lockup:
 * the company mark image alongside the ROASTERY + / SHOWROOM subline.
 *
 * This is the single source of truth for the reduced logo. It first shipped
 * on the Wholesale Request header and is now reused in every place that shows
 * a reduced logo (ShopHeader, the homepage Header's compact state, etc.) so
 * the mark stays identical everywhere.
 */
const ReducedLogo = ({
  className = "",
  compact = false,
}: {
  className?: string;
  /** Slightly smaller mark + subline (used on the /wholesale-request header). */
  compact?: boolean;
}) => (
  <div className={`flex items-start ${compact ? "gap-2.5" : "gap-3.5"} flex-shrink-0 ${className}`}>
    <img
      src={companyLogo}
      alt="Company Logo"
      /* Compact: RM-exact — the ⊥ mark is 22×27 at the 1024 design stage
         ⇒ ~42px tall at our 1600 reference (was a 48px square). */
      className={`${compact ? "h-[42px] w-auto" : "w-14 h-14"} object-contain`}
    />
    <div className="text-wholesale-primary">
      {/* Compact: RM subline is 6px/+0.6px at 1024 ⇒ 9.5px/+0.9px here. */}
      <div className={`${compact ? "text-[9.5px] tracking-[0.9px] leading-[11px]" : "text-sm tracking-tight leading-tight"} font-normal`}>ROASTERY +</div>
      <div className={`${compact ? "text-[9.5px] tracking-[0.9px] leading-[11px]" : "text-sm tracking-tight leading-tight"} font-normal`}>SHOWROOM</div>
    </div>
  </div>
);

export default ReducedLogo;
