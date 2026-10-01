import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Image from "next/image";

const CONCEPT_VIDEO_ID = "_igGh-44tT4";

const sketches = [
  {
    src: "/images/sketches/linkload-sketch-ink-white.png",
    top: 500,
    scale: 1,
  },
  {
    src: "/images/sketches/linkload-sketch-2-ink-white.png",
    top: 950,
    scale: 1,
  },
  {
    src: "/images/sketches/linkload-sketch-3-ink-white.png",
    top: 1400,
    scale: 1,
  },
  {
    src: "/images/sketches/linkload-sketch-4-ink-white.png",
    top: 1850,
    scale: 1,
  },
  {
    src: "/images/sketches/linkload_sketch_01_commercial-subsegments_white-ink.png",
    top: 2300,
    scale: 1.2,
  },
  {
    src: "/images/sketches/linkload_sketch_02_post-queue-drawer_white-ink.png",
    top: 2750,
    scale: 1,
  },
];

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-void flex flex-col overflow-y-auto">
      <Header />

      <main className="flex-1 pt-24 pb-20">
        {/* Article width narrows when sketches are visible to make room for them */}
        <article className="max-w-4xl xl:max-w-2xl 2xl:max-w-3xl mx-auto px-6 relative">
          {/* Margin sketches - visible on xl+ screens (1280px+) */}
          {sketches.map((sketch, index) => {
            const isLeft = index % 2 === 0;
            const isLast = index === sketches.length - 1;
            return (
              <div
                key={sketch.src}
                className={`hidden xl:block absolute sketch-fade-in ${
                  isLeft ? "sketch-left" : "sketch-right"
                }`}
                style={isLast ? { bottom: "18rem" } : { top: `${sketch.top}px` }}
              >
                <img
                  src={sketch.src}
                  alt={`Original LinkLoad sketch ${index + 1}`}
                  className="sketch-image"
                />
              </div>
            );
          })}

          {/* Title */}
          <header className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-paper tracking-tight">
              Our Story
            </h1>
            <p className="text-xl md:text-2xl text-steel mt-6 font-light italic">
              How the modern state of laundry drove me over the edge
            </p>
          </header>

          {/* Concept Video */}
          <section className="mb-16">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-graphite border border-charcoal">
              <iframe
                src={`https://www.youtube.com/embed/${CONCEPT_VIDEO_ID}?rel=0&modestbranding=1`}
                title="LinkLoad first concept video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <p className="text-center text-steel text-sm mt-4 italic">
              Our first-ever concept video
            </p>
          </section>

          {/* Essay */}
          <section className="mb-12">
            <h2 className="text-3xl md:text-4xl font-medium text-paper mb-8 tracking-tight">
              One Rainy Night in Seattle
            </h2>
            <div className="space-y-8 text-lg md:text-xl text-silver leading-relaxed font-light">
              <p>
                While working as a software engineer in Seattle, I lived in a
                small one-bedroom apartment with a stacked washer and dryer.
                About once a week, after a long day of work, I&apos;d come home,
                change into workout clothes, hit the gym up the road, and return
                by 7 or 8 p.m. to start a load of laundry. While it ran,
                I&apos;d do some combination of showering, making dinner,
                watching tennis highlights, and FaceTiming friends.
              </p>
              <p>
                Too subsumed by a conversation, too cozy after a shower, or too
                full after a third helping of spaghetti and meatballs, nearly
                half the time I&apos;d forget the load entirely. (It didn&apos;t
                help that the machines lived in a soundproof closet, down a long
                corridor from the carpeted bedroom.) I&apos;d wake the next
                morning vexed, my clothes now wet, mildewy, and in need of a
                second wash — a realization that always arrived right before
                work, when I didn&apos;t have an hour to stick around and rerun
                them. So I&apos;d acquiesce to the compounding mildew and wait
                until that night to try again.
              </p>

              {/* Mobile sketch 1 */}
              <div className="xl:hidden flex justify-center py-4">
                <img
                  src="/images/sketches/linkload-sketch-ink-white.png"
                  alt="LinkLoad sketch"
                  className="w-40 h-auto opacity-80"
                />
              </div>

              <p>
                One twice-forgotten load, on a rainy Thursday in April 2025,
                broke me. I needed a few important sets of clothes for a weekend
                trip to Lopez Island, where a friend of a friend worked as a
                cartographer. The night before, I&apos;d started the load after
                getting home past 11 p.m. — a rarity, but not a novelty — and,
                true to form, forgot it, waking to the smell of damp cotton in
                the corridor. The next night I got home even later, having spent
                an exhausting day trying to ship a project we&apos;d been
                finalizing for weeks. I reran the wash, warmed up a Trader
                Joe&apos;s frozen dinner, and helplessly dozed on the couch
                while babysitting the deployment.
              </p>
              <p>
                When I woke at 1 a.m. with a start, I shout-grunted into my
                empty apartment and transferred the clothes, accepting the
                low-level mildew at this point. I stood in front of the
                machines, livid, reckoning with a task that required so much of
                me yet so little at the same time. I enumerated the steps on my
                fingers: (1) open the washer and dryer doors, (2) gather three
                to five wet armfuls of clothes and hoist them to the dryer three
                feet away, (3) pick up and brush off the loose socks that
                inevitably fall in transit, (4) close the doors, (5) toss in a
                dryer sheet, (6) select the settings, and (7) press Start.
              </p>

              {/* Mobile sketch 2 */}
              <div className="xl:hidden flex justify-center py-4">
                <img
                  src="/images/sketches/linkload-sketch-2-ink-white.png"
                  alt="LinkLoad sketch"
                  className="w-40 h-auto opacity-80"
                />
              </div>

              <p>
                I had already spent a comical amount of my life thinking about
                the sock problem. Every time a sock hits the floor, it bonds to
                dust and dirt at the worst possible juncture: when it is both
                cleanest and wettest. As the dryer spun before me that late
                April night, my eyes drifted to the corners of the machines.
                Perhaps a result of my sleep-deprived stupor, the borders
                between the machines faded and my imagination took over.
              </p>
              <p>
                <i>
                  What if it were one tall enclosure, so the clothes never had
                  to exit and re-enter between wash and dry?
                </i>{" "}
                That alone would fix the sock problem. Then:{" "}
                <i>
                  What if the washer sat above the dryer, so gravity could do
                  the transfer?
                </i>{" "}
                Then:{" "}
                <i>
                  What if the drums were built from couplable semi-cylinders,
                  allowing both a closed high-velocity spin and a full-diameter
                  opening? What if a clever plastic guard could peel stuck
                  clothes off the drum wall? What if a mesh net separated the
                  clothes you wanted machine-dried from the ones you
                  didn&apos;t? What if compartments above and below let you
                  queue a second autonomous load?
                </i>
              </p>

              {/* Mobile sketch 3 */}
              <div className="xl:hidden flex justify-center py-4">
                <img
                  src="/images/sketches/linkload-sketch-3-ink-white.png"
                  alt="LinkLoad sketch"
                  className="w-40 h-auto opacity-80"
                />
              </div>

              <p>
                Standing before the machine with a black Pilot G2 and a Rollbahn
                notebook, I started drawing. By 3 a.m., I had filled seven or
                eight pages of sketches and musings under a scribbled header:
                &ldquo;LinkLoad.&rdquo;
              </p>
              <p>
                When I got back from Lopez Island, I missed two consecutive days
                of work to produce a manifesto perforated with colorful Figma
                diagrams — thirty-some-odd hours of uninterrupted me-at-my-desk
                time. What emerged was a hardware system with a software ethos:
                everything that was formerly assigned to the user, methodically
                abstracted away.
              </p>

              {/* Mobile sketch 4 */}
              <div className="xl:hidden flex justify-center py-4">
                <img
                  src="/images/sketches/linkload-sketch-4-ink-white.png"
                  alt="LinkLoad sketch"
                  className="w-40 h-auto opacity-80"
                />
              </div>

              <p>
                The substrate under every design and product decision could be
                summed up in one word, a word I must have written north of
                twenty times in that initial design document:{" "}
                <em className="text-paper not-italic">unburden</em>. Driving the
                design was this one singular goal, which served many flavors of
                laundry-user: liberate multi-child households from full days of
                trivial labor; reduce friction between roommates; let the
                exhausted workhorses sleep after a long day.
              </p>
              <p>
                That 1 a.m. frustration is where LinkLoad traces its origins.
                But my story isn&apos;t unusual; it&apos;s ubiquitous, and
                that&apos;s the founding principle. Every laundry user lives
                some version of it every time they do laundry.
              </p>

              {/* Mobile sketch 5 */}
              <div className="xl:hidden flex justify-center py-4">
                <img
                  src="/images/sketches/linkload_sketch_01_commercial-subsegments_white-ink.png"
                  alt="LinkLoad sketch"
                  className="w-48 h-auto opacity-80"
                />
              </div>

              <p>
                People misconceive that the problem with laundry is the two
                minutes it takes to move the clothes and start the dryer. The
                real problem is the time around it, the forsaken bookends. This
                two-minute activity is not a two-minute activity; it&apos;s
                multiple hours of overhead and overhang. Sometimes it even feels
                like, or proves to be, a multi-day battle, getting a load or two
                fully cleaned and back in the drawers (or maybe that&apos;s just
                me).
              </p>

              {/* Mobile sketch 6 */}
              <div className="xl:hidden flex justify-center py-4">
                <img
                  src="/images/sketches/linkload_sketch_02_post-queue-drawer_white-ink.png"
                  alt="LinkLoad sketch"
                  className="w-40 h-auto opacity-80"
                />
              </div>

              <p>
                But while the industry incrementally improves the tech year
                after year, it becomes clear that nobody is making it their
                mission to optimize the workflow. Which is why a company built
                for exactly this problem, small and obsessed by design,
                untethered to established paradigms, is the natural author of
                its solution.
              </p>
            </div>
          </section>

          {/* Author Attribution */}
          <footer className="border-t border-charcoal pt-8 sm:pt-16 pb-4 sm:pb-0">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0">
                <Image
                  src="/images/founder.png"
                  alt="Jarett Malouf"
                  fill
                  className="object-cover rounded-full"
                />
                {/* Subtle blend overlay */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-void/20 to-transparent" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-paper font-medium text-xl">Jarett Malouf</p>
                <p className="text-steel">Founder & CEO</p>
                <a
                  href="mailto:jarett@linkload.co"
                  className="text-signal hover:underline mt-2 inline-block"
                >
                  jarett@linkload.co
                </a>
              </div>
            </div>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}
