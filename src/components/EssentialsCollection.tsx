const EssentialsCollection = () => {
  const essentialsPoints = [
    "THESE BLENDS USE THE FAMED CASTILLO DOUBLE ANAEROBIC THERMAL SHOCK PROFILES FROM FINCA EL PARAISO (WHICH ARE VERY NATURALLY SWEET AND APPROACHABLE) AND A SWEET AND SOFT WASHED CASTILLO FROM DIEGO BERMUDEZ",
    "MADE FOR ANY CUSTOMER YET FUN FOR THOSE OF US WHO AREN'T WANTING JUST A BASIC / TRADITIONAL BLEND WITH MILK",
    "CREATED TO PERFORM WELL ON FILTER / BLACK AND ESPRESSO / WITH MILK",
    "THESE COFFEES WILL CHALLENGE YOUR PERCEPTION ABOUT BLENDS. BLENDS SHOULDN'T BE A WAY TO SETTLE, BUT TO CREATE SOMETHING THAT'S BETTER THAN THE SUM OF IT'S PARTS. THESE COFFEES ARE PRACTICAL BUT JUST A LITTLE BIT MAGICAL TOO - AND THAT'S WHAT WE LOVE ABOUT THEM."
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="border-2 border-wholesale-accent rounded-lg p-8 bg-white shadow-wholesale">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold text-wholesale-primary">ESSENTIALS</h2>
          <span className="text-lg text-wholesale-secondary">COLLECTION</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {essentialsPoints.map((point, index) => (
            <div key={index} className="space-y-2">
              <div className="w-2 h-2 bg-wholesale-accent rounded-full"></div>
              <p className="text-sm text-wholesale-secondary leading-relaxed">
                {point}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EssentialsCollection;