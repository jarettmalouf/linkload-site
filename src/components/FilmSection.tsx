"use client";

import { useState } from "react";
import Image from "next/image";

const YOUTUBE_VIDEO_ID = "BeLTB3nu2bY";

export default function FilmSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="how-it-works" className="snap-section py-16 md:py-24 bg-void min-h-screen flex items-center justify-center">
      <div className="w-full max-w-[90vw] xl:max-w-7xl mx-auto px-6">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-fluid-section font-semibold text-paper tracking-tight">
            How It Works
          </h2>
          <p className="text-fluid-subhead text-steel mt-3 max-w-2xl mx-auto">
            Watch LinkLoad in action.
          </p>
        </div>

        <div className="relative aspect-video rounded-2xl overflow-hidden bg-graphite border border-charcoal">
          {!isPlaying ? (
            <>
              {/* Poster/Thumbnail */}
              <Image
                src={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`}
                alt="LinkLoad product film"
                fill
                className="object-cover"
              />

              {/* Play button overlay */}
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-void/40 hover:bg-void/30 transition-colors group"
                aria-label="Play video"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-signal flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-signal/30">
                  <svg
                    className="w-8 h-8 md:w-10 md:h-10 text-void ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            </>
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
              title="LinkLoad product film"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          )}
        </div>
      </div>
    </section>
  );
}
