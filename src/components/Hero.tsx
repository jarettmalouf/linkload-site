export default function Hero() {
  return (
    <section className="hero-section relative pt-20 overflow-hidden">
      {/* Background - matches page background */}
      <div className="absolute inset-0 bg-void" />

      {/* Video background - right half on desktop, behind content on mobile */}
      <div className="absolute inset-0 lg:left-[45%] lg:w-[55%]">
        {/* Desktop video */}
        <video
          src="/images/canvas.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="hidden lg:block w-full h-full object-cover"
        />
        {/* Mobile video (trimmed to avoid text conflict) */}
        <video
          src="/images/canvas-mobile.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="lg:hidden w-full h-full object-cover"
        />
        {/* Subtle gradient overlay - fades to page background, narrow fade width */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, var(--void) 0%, transparent 15%)",
          }}
        />
      </div>

      {/* Hero content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="lg:pl-[8%] px-6 py-[clamp(2rem,8vh,6rem)] w-full">
          <div className="lg:w-[40%]">
            {/* Text content */}
            <div className="text-center lg:text-left">
              <h1 className="text-fluid-hero font-semibold text-paper tracking-tight">
                Laundry,
                <br />
                automated.
                <br />
                <span className="text-steel">
                  Life,
                  <br />
                  uninterrupted.
                </span>
              </h1>
              <p className="text-fluid-subhead text-silver mt-[clamp(1rem,3vh,1.5rem)] lg:whitespace-nowrap">
                The washer-dryer that moves your clothes for you.
              </p>
              <p className="text-fluid-subhead text-silver mt-1">
                Start two loads and walk away.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-[clamp(1.5rem,5vh,2.5rem)] justify-center lg:justify-start">
                <a
                  href="#how-it-works"
                  className="bg-paper hover:bg-paper/90 text-void font-medium px-6 py-3 sm:px-8 sm:py-4 rounded-lg transition-colors text-center text-sm sm:text-base"
                >
                  Watch the Demo
                </a>
                <a
                  href="#waitlist"
                  className="border border-charcoal hover:border-steel text-paper font-medium px-6 py-3 sm:px-8 sm:py-4 rounded-lg transition-colors text-center text-sm sm:text-base"
                >
                  Apply to Pre-Order
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
