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
                style={
                  isLast ? { bottom: "18rem" } : { top: `${sketch.top}px` }
                }
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
              How a bad back made me fix laundry
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
              One Chilly Seattle Morning...
            </h2>
            <div className="space-y-8 text-lg md:text-xl text-silver leading-relaxed font-light">
              <p>
                In early 2025, I suffered a debilitating back injury while
                playing tennis. An overly ambitious, overly pronated serve, my
                first of the day on a chilly Seattle morning, left me doubled
                over and yelping on the dewy baseline. I had slipped the disc
                between my L5 and S1 vertebrae and torn a muscle in my lower
                back. The pain was excruciating, and the months that followed
                were eye-opening.
              </p>
              <p>
                Chores were a pain, and none more than laundry. Repeatedly
                hunching down into my top-load washer and heaving wet clothes
                into the dryer above was exactly the kind of activity my back
                wouldn&apos;t abide. On top of the physical challenge, the task
                proved logistically cumbersome. I had to ask my roommates, or
                occasionally my parents, to assist at a time when they would be
                around for several uninterrupted hours. Before we&apos;d found a
                groove, there were many weeks I&apos;d quietly re-wear a pair of
                dirty socks or underwear.
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
                This indignity was not my first gripe with laundry. As a clean
                freak growing up, I resented how the manual transfer step would
                invariably lead to a dropped sock or two, at its wettest and
                cleanest, onto the dusty floor. I&apos;m also a comically
                forgetful person, a couple standard deviations above the mean. I
                couldn&apos;t count on ten hands the number of times I&apos;ve
                forgotten to transfer my wet laundry and woken to the painful
                realization that I&apos;d need to rerun the wash to get rid of
                the mildew that had accumulated overnight.
              </p>
              <p>
                One night, lying in bed with a heating pad under my lumbar, I
                heard my wash finish. My roommate had already fallen asleep, and
                feeling guilty at the idea of waking him after his fourteen-hour
                workday, I strained to move the load myself. Sweating through my
                shirt, I felt a compensatory twinge between my shoulder blades.
                I couldn&apos;t even start the dryer; I needed to lie back down
                immediately.
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
                Humiliated, furious, and incredulous at the state of modern
                laundry machines, which sit a few feet from our automatic coffee
                maker and in the same closet as our robot vacuum, I pulled out
                my Rollbahn notebook and started ideating on the obvious
                solution: an auto-transfer washer-dryer.
              </p>
              <p>
                I wrote,{" "}
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
                Energized by a solution that might cure my indignity, I missed
                two consecutive days of work to produce a manifesto perforated
                with colorful Figma diagrams. What emerged was a hardware system
                with a software ethos: everything that was formerly assigned to
                the user, methodically abstracted away.
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
                design was this singular goal, which served all flavors of
                laundry-doer, from multi-child parents to appliance-sharing
                roommates to invalids like myself.
              </p>
              <p>
                My injury is where LinkLoad traces its origins. But the
                frustration behind it isn&apos;t unusual; it&apos;s ubiquitous,
                and also the founding principle. Every laundry user lives some
                version of it every time they do laundry.
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
                People assume the opportunity cost is the minute or two it takes
                to move the clothes and start the dryer. The real cost, however,
                is the time around it, the forsaken bookends. This two-minute
                activity is not a two-minute activity; it&apos;s multiple hours
                of passive attention and logistical overhead. Sometimes it even
                feels like, or proves to be, a multi-day battle to get a load or
                two fully washed, dried, and back in the drawers.
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
                The industry incrementally improves the chemistry and the
                internals year after year, but nobody is making it their mission
                to optimize the workflow. That&apos;s why a company built for
                exactly this problem, small and obsessed by design, untethered
                to established paradigms, is the natural author of its solution.
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
