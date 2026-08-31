const WholesaleInfoCards = () => {
  const infoCards = [
    {
      number: "1.0",
      title: "ROASTING",
      description: "PROFILES ARE MORE IN LINE WITH PROGRESSIVE LIGHT ROASTING STYLES. WE LIKE LIGHT (YET PROPERLY DEVELOPED) COFFEE THAT ACCENTUATES SWEETNESS AND CLARITY WITHOUT TASTING ANY ROAST."
    },
    {
      number: "2.0", 
      title: "FRESH GREEN",
      description: "WE ROAST AT ORIGIN (COLOMBIA), ONE OF THE ONLY PLACES IN THE WORLD THAT IS HARVESTING CHERRIES EVERY 15 DAYS. ALL COFFEES ARE ROASTED WITHIN A MONTH OF BEING PICKED AND PROCESSED - THE MOST VIBRANT COFFEES POSSIBLE."
    },
    {
      number: "3.0",
      title: "RESTING COFFEES", 
      description: "OUR COFFEES TYPICALLY NEED A MINIMUM OF 3-4 WEEKS REST BEFORE USING (TO TASTE AS THEY SHOULD). THEY PEAK FROM 5-6 WEEKS AND DO NOT LOSE QUALITY UNTIL AFTER 7 WEEKS."
    },
    {
      number: "4.0",
      title: "FREE SHIPPING",
      description: "FREE SHIPPING ON ORDERS OVER $1000 WORLDWIDE & ON ORDERS $750 USD OR MORE IN THE US"
    }
  ];

  return (
    <section className="w-full" style={{ backgroundColor: '#ece7d0' }}>
      {/* Top line */}
      <div className="w-full h-px" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}></div>
      
      <div className="mx-auto w-full max-w-[1536px] px-4 sm:px-6 lg:px-10 py-3 sm:py-4">
        <h2 className="text-xs sm:text-sm font-bold text-wholesale-primary mb-2 sm:mb-3.5" style={{ letterSpacing: '-0.2px' }}>NATIVE WHOLESALE</h2>
        
        <div className="space-y-2 sm:space-y-2.5">
          {infoCards.map((card) => (
            <div key={card.number} className="flex flex-wrap items-start gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <span className="font-bold text-wholesale-primary whitespace-nowrap">{card.number}</span>
              <span className="font-bold text-wholesale-primary whitespace-nowrap">{card.title}</span>
              <span className="text-wholesale-primary">-</span>
              <p className="text-wholesale-secondary flex-1 min-w-0">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom line */}
      <div className="w-full h-px" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}></div>
    </section>
  );
};

export default WholesaleInfoCards;