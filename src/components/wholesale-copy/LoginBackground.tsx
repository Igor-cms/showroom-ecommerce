import type { CSSProperties } from "react";
import { samuelRunningLqip } from "@/assets/samuel-running-lqip";

// Shared background for every wholesale login-flow step (password gate, purchase
// question, email lookup, no-account). Centralizing it guarantees all steps load
// the SAME optimized WebP — so the browser reuses the cached, already-decoded
// image when moving between steps instead of re-fetching a heavier JPG.
//
// The files live in public/ rather than src/assets/ on purpose: Vite content-
// hashes bundled assets, so their final URL is unknowable at author time and
// index.html cannot preload them. A stable path is what lets the boot script
// there start the download in parallel with the JS bundle instead of after it.
const BG_WEBP = "/login/samuel-running.webp";
const BG_JPG = "/login/samuel-running.jpg";

/* No fade-in here on purpose. The boot screen (index.html + useLoginBootGate)
   already holds the whole page back until this photo has DECODED, so by the
   time any of this is visible the image is complete. Fading it in as well
   would re-introduce the staged reveal the boot screen exists to remove.
   The blurred LQIP below stays as a backstop for the one case the gate can't
   cover: its safety timeout firing on a very slow connection. */
const LoginBackground = () => {
  return (
    <div className="absolute inset-0 flex items-center lg:items-start justify-center overflow-hidden bg-[#F8F5E4]">
      {/* The box always keeps the photo's own 16:9 frame — the person labels are
          positioned as % of THIS box, so they follow it automatically and the
          composition stays balanced at any size. Only how the box is sized
          changes with the viewport:

          lg and up — max(): the SMALLEST 16:9 box that still COVERS the
          viewport, so the photo is full bleed with no colored bars. Anchored to
          the top (lg:items-start) so the crop is taken off the bottom only; a
          centred box would eat more of the top the shorter the window gets.

          Below lg (phones and tablets) — min(): the LARGEST 16:9 box that FITS
          INSIDE the viewport, i.e. contain. A 16:9 photo against a portrait
          screen loses most of its width to cover, which is what buried the
          people in it; fitting it keeps the whole frame visible and lets the
          #F8F5E4 above and below take the leftover space. Centred vertically
          (items-center) so that leftover is split evenly.

          Both rules are pure viewport ratios — no fixed pixel sizes — so the
          photo scales continuously instead of stepping at a breakpoint. */}
      <div
        /* container-type makes this box a container-query context, so the
           labels below can size themselves against ITS width (cqw) rather than
           the viewport's. That is what keeps them in proportion once the box
           stops filling the screen: at 9px against a 1600px-wide box the names
           read as fine print, but the same 9px against a 375px box is over four
           times bigger relative to the photo, which is what made them shout on
           a phone. */
        className="relative shrink-0 [container-type:inline-size]
                   w-[calc(var(--fit-w)*1.35)] h-[calc(var(--fit-h)*1.35)]
                   translate-x-[4%] translate-y-[14%]
                   lg:w-[max(100vw,calc(100vh*16/9))] lg:h-[max(100vh,calc(100vw*9/16))]
                   lg:translate-x-0 lg:translate-y-0"
        style={{
          /* Below lg the frame is the fitted 16:9 box (--fit-*) enlarged 1.35x.
             Fitting it whole left the people small and pushed the child's face
             straight under the password pill; the extra 35% trades the side
             margins — the only part of the frame with nothing in it — for a
             readable scale. The offsets then aim the crop:

             +4% X — the three of them sit around 41% across, left of the
               frame's own centre, so nudging the picture right brings the group
               back to the middle of the screen.
             +14% Y — the child's face sits at ~45% of the frame's height, which
               is exactly the band the pill occupies (~32-50%). This drops it
               clear below the pill while the two men, at ~8% and ~12%, stay
               well above it.

             Percentages of the element, not pixels, so the framing holds at any
             phone size. lg resets both and keeps the desktop cover untouched. */
          "--fit-w": "min(100vw, calc(100vh*16/9))",
          "--fit-h": "min(100vh, calc(100vw*9/16))",
          backgroundImage: `url(${samuelRunningLqip})`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        } as CSSProperties}
      >
        <picture>
          <source srcSet={BG_WEBP} type="image/webp" />
          <img
            src={BG_JPG}
            alt=""
            aria-hidden="true"
            // React 18's DOM only knows the lowercase attribute; the camelCase
            // prop triggers an "unknown prop" warning on every render.
            {...({ fetchpriority: "high" } as Record<string, string>)}
            decoding="async"
            className="absolute inset-0 w-full h-full object-contain select-none"
          />
        </picture>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Person labels — positioned next to each person inside the image.
            Sizes scale with the BOX (cqw), clamped so they never fall below
            legible on a phone nor grow past the 9px/8px the desktop design
            uses. lg pins them back to those exact values, so the desktop
            composition is byte-for-byte what it was. */}
        <div
          className="absolute inset-0 pointer-events-none text-[#F8F5E4]
                     [--name-size:clamp(5.5px,0.95cqw,9px)] [--role-size:clamp(5px,0.85cqw,8px)]
                     lg:[--name-size:9px] lg:[--role-size:8px]"
        >
          {/* Luke — left adult. items-start + the divider nudged down ~half a
              name-line so the connector sits level with the NAME (top line),
              not centered on the whole two-line block. */}
          {/* Horizontal placements are pulled inward below lg: the zoomed frame
              runs wider than the screen, so only ~9%-83% of it is on view and
              the original percentages put these names past the edge. lg restores
              the exact design values. */}
          <div className="absolute flex items-start gap-3 top-[22%] left-[12%] w-[18%] lg:left-[10%]">
            <div className="text-right whitespace-nowrap">
              <div className="text-[length:var(--name-size)] font-medium tracking-[0.06em]">LUKE JACKSON</div>
              <div className="text-[length:var(--role-size)] tracking-[0.12em] opacity-80">NATIVE CO-FOUNDER</div>
            </div>
            <div className="flex-1 h-px bg-[#F8F5E4] mt-[5px]" />
          </div>

          {/* Nathaniel — right adult */}
          <div className="absolute flex items-start gap-3 top-[20%] left-[62%] right-[19%] lg:right-[16%]">
            <div className="flex-1 h-px bg-[#F8F5E4] mt-[5px]" />
            <div className="text-left whitespace-nowrap">
              <div className="text-[length:var(--name-size)] font-medium tracking-[0.06em]">NATHANIEL SLADKY</div>
              <div className="text-[length:var(--role-size)] tracking-[0.12em] opacity-80">NATIVE HEAD OF COFFEE</div>
            </div>
          </div>

          {/* Samuel — child */}
          <div className="absolute flex items-start gap-2 top-[55%] left-[11%] w-[16%] lg:left-[5%]">
            <div className="text-right whitespace-nowrap">
              <div className="text-[length:var(--name-size)] font-medium tracking-[0.06em]">SAMUEL BERMUDEZ</div>
              <div className="text-[length:var(--role-size)] tracking-[0.12em] opacity-80">DIEGO BERMUDEZ'S SON</div>
            </div>
            <div className="flex-1 h-px bg-[#F8F5E4] mt-[5px]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginBackground;
