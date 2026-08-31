const HeroFeaturedProduct = () => {
  return (
    <section
      className="relative w-full overflow-hidden bg-background hero-section"
      style={{ height: "100vh" }}
    >
      <video
        src="/hero-video.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <style>{`
        @media (max-width: 1100px) {
          .hero-section {
            height: auto !important;
            aspect-ratio: 1520 / 576;
          }
        }
        /* Mobile: the client asks for the video "full bleed (center video)"
           (Iteration 2 PDF p14). The 1520/576 above is the SOURCE FILE's aspect,
           which letterboxes it — at 320 wide it left the hero 122 tall against
           the reference's 430, and the page read as a thin strip under the
           header. Readymag draws it as a 900-wide element on the 320 canvas at
           x -290.2, i.e. overflowing both edges and centred (-290.2 + 900/2 =
           159.8 ≈ the canvas centre), 430 tall. A 320/430 box with the video
           already on object-cover reproduces exactly that: full width, source
           cropped left and right, centred.

           Scoped to the mobile breakpoint and placed after the rule above so it
           wins there — 320/430 is portrait, and letting it run to 1100px would
           make a 1024-wide tablet 1376px tall.

           max-height caps it at the 430px-wide equivalent (430 × 430/320), the
           same ceiling the other mobile values use. A portrait aspect with no
           cap keeps growing with width: at 767 the hero came out 1030 tall,
           taller than the viewport it sits in. Below 430 the aspect drives the
           height and the design scales exactly as Readymag's canvas does; above
           it the box stops growing and object-cover crops instead. */
        @media (max-width: 767px) {
          .hero-section {
            height: auto !important;
            aspect-ratio: 320 / 430;
            max-height: 578px;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroFeaturedProduct;
