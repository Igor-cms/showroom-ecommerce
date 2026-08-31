const TopMetaRibbon = () => {
  return (
    <div className="hidden xl:block border-b border-border bg-background">
      <div className="container-main px-6">
        <div className="flex items-center justify-between py-3 text-xs">
          <div>ROASTERY / SHOWROOM — BY DIEGO BERMÚDEZ</div>
          <div>MEDELLIN, COLOMBIA — CAUCA (HACHI)</div>
          <div className="text-right space-y-0.5 font-body normal-case tracking-normal font-normal">
            <div>6.2476° N, 75.5658° W</div>
            <div>32.7767° N, 96.7970° W</div>
            <div>8.3667° N, 82.2901° W</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopMetaRibbon;