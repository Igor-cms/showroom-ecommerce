const SidebarBrand = () => {
  const coffeelevels = [
    "BASE",
    "TOP SHELF", 
    "COMPETITION",
    "EXOTICS",
    "HYPER-LIMITED"
  ];

  const scrollToSection = (level: string) => {
    const element = document.getElementById(level.toLowerCase().replace(' ', '-'));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <aside className="hidden lg:block sidebar-fixed pt-20">
      <div className="p-6 h-full flex flex-col">
        {/* Brand */}
        <div className="mb-8">
          <h2 className="text-3xl font-headline font-bold mb-6">NA⊥IVE</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Exclusive roastery + showroom of Diego Bermúdez. Diego is our co-owner, and a world renowned coffee producer and processor with a relentless pursuit of pushing innovation in coffee.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground mt-4">
            Our menu features a curation of the greatest coffees in the world, provided by the greatest producers in the world.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground mt-4 font-medium">
            Farm to cup—like never before.
          </p>
        </div>

        {/* Coffee Levels Navigation */}
        <div className="mb-8">
          <h3 className="text-sm text-mono mb-4 text-muted-foreground">COFFEE LEVELS :</h3>
          <nav className="space-y-2">
            {coffeelevels.map((level, index) => (
              <button
                key={level}
                onClick={() => scrollToSection(level)}
                className="block w-full text-left text-sm font-medium hover:text-accent transition-colors duration-fast"
              >
                <span className="text-mono text-xs text-muted-foreground mr-2">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                {level}
              </button>
            ))}
          </nav>
        </div>

        {/* Hand-drawn doodle placeholder */}
        <div className="mt-auto">
          <svg
            width="120"
            height="80"
            viewBox="0 0 120 80"
            className="text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              d="M10 70c20-20 40-40 60-20s40 20 40-10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="20" cy="25" r="8" strokeWidth="1" />
            <path
              d="M80 15c5 5 10 10 15 5s5-10 0-15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </aside>
  );
};

export default SidebarBrand;