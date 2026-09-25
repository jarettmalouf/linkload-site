"use client";

import { useState, useRef, useEffect } from "react";

export default function Hero() {
  const [desktopVideoReady, setDesktopVideoReady] = useState(false);
  const [mobileVideoReady, setMobileVideoReady] = useState(false);
  const [showDesktopVideo, setShowDesktopVideo] = useState(false);
  const [showMobileVideo, setShowMobileVideo] = useState(false);
  const desktopVideoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);

  const handleDesktopCanPlay = () => {
    setDesktopVideoReady(true);
  };

  const handleMobileCanPlay = () => {
    setMobileVideoReady(true);
  };

  // When desktop video is ready, fade out still and cross-fade to video
  useEffect(() => {
    if (desktopVideoReady) {
      const timer = setTimeout(() => {
        setShowDesktopVideo(true);
        desktopVideoRef.current?.play();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [desktopVideoReady]);

  // When mobile video is ready, fade out still and cross-fade to video
  useEffect(() => {
    if (mobileVideoReady) {
      const timer = setTimeout(() => {
        setShowMobileVideo(true);
        mobileVideoRef.current?.play();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mobileVideoReady]);

  return (
    <section className="hero-section relative pt-20 overflow-hidden">
      {/* Background - matches page background */}
      <div className="absolute inset-0 bg-void" />

      {/* Video background - right half on desktop, behind content on mobile */}
      <div className="absolute inset-0 lg:left-[45%] lg:w-[55%]">
        {/* Desktop still image */}
        <div
          className={`hidden lg:block absolute inset-0 transition-opacity duration-[2000ms] ease-out ${
            !desktopVideoReady ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src="/images/hero-poster.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Desktop video */}
        <video
          ref={desktopVideoRef}
          src="/images/canvas.mp4"
          muted
          loop
          playsInline
          preload="auto"
          onCanPlayThrough={handleDesktopCanPlay}
          className={`hidden lg:block w-full h-full object-cover transition-opacity duration-[1500ms] ease-out ${
            showDesktopVideo ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Mobile still image */}
        <div
          className={`lg:hidden absolute inset-0 transition-opacity duration-[2000ms] ease-out ${
            !mobileVideoReady ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src="/images/hero-poster.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        {/* Mobile video (trimmed to avoid text conflict) */}
        <video
          ref={mobileVideoRef}
          src="/images/canvas-mobile.mp4"
          muted
          loop
          playsInline
          preload="auto"
          onCanPlayThrough={handleMobileCanPlay}
          className={`lg:hidden w-full h-full object-cover transition-opacity duration-[1500ms] ease-out ${
            showMobileVideo ? "opacity-100" : "opacity-0"
          }`}
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
