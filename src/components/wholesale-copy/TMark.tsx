import tMark from "@/assets/t-cream.png";

// The upside-down-T brand mark, recolored to the site cream (#F8F5E4) so it
// matches the rest of the login-flow chrome exactly, instead of the near-white
// baked into the PNG. Recoloring a raster asset is done with a CSS mask: the
// PNG's alpha becomes the mask and a solid #F8F5E4 fill shows through it. The
// source art is square, so width == height.
const TMark = () => (
  <div
    aria-hidden="true"
    /* The fill has to follow whatever ends up behind the mark. On lg and up the
       photo is full bleed and the mark sits on it, so it stays cream. Below lg
       the photo is fitted rather than cropped, which leaves #F8F5E4 above and
       below it — and the mark lands on that band, where a cream fill is cream
       on cream and simply disappears. `bg-ink` is the same tone the rest of the
       page uses against that background. */
    className="absolute bottom-28 left-1/2 -translate-x-1/2 h-12 w-12 sm:h-16 sm:w-16 pointer-events-none select-none bg-ink lg:bg-[#F8F5E4]"
    style={{
      maskImage: `url(${tMark})`,
      WebkitMaskImage: `url(${tMark})`,
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskPosition: "center",
      maskSize: "contain",
      WebkitMaskSize: "contain",
    }}
  />
);

export default TMark;
