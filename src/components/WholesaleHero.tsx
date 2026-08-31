import wholesaleHeroBg from "../assets/wholesale-hero-new.webp";
import { format } from "date-fns";

const WholesaleHero = () => {
  return (
    <section className="relative h-80 bg-black overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={wholesaleHeroBg}
          alt="Coffee packaging on sand"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative h-full">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 text-right" style={{ color: '#fffbe6' }}>
          <h1 className="text-sm font-bold tracking-wider">
            NATIVE WHOLESALE
          </h1>
          <p className="text-xs font-normal tracking-wider">{format(new Date(), "MMMM yy").toUpperCase() + "'"}</p>
        </div>
      </div>
    </section>
  );
};

export default WholesaleHero;