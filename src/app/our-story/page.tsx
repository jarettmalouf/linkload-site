import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Image from "next/image";

const CONCEPT_VIDEO_ID = "_igGh-44tT4";

const sketches = [
  {
    src: "/images/sketches/linkload-sketch-ink-white.png",
    top: 600,
    scale: 1,
  },
  {
    src: "/images/sketches/linkload-sketch-2-ink-white.png",
    top: 2000,
    scale: 1,
  },
  {
    src: "/images/sketches/linkload-sketch-3-ink-white.png",
    top: 3400,
    scale: 1,
  },
  {
    src: "/images/sketches/linkload-sketch-4-ink-white.png",
    top: 4800,
    scale: 1,
  },
  {
    src: "/images/sketches/linkload_sketch_01_commercial-subsegments_white-ink.png",
    top: 6200,
    scale: 1.2,
  },
  {
    src: "/images/sketches/linkload_sketch_02_post-queue-drawer_white-ink.png",
    top: 7800,
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
                style={isLast ? { bottom: "20rem" } : { top: `${sketch.top}px` }}
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

          {/* Section 1 */}
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
                watching tennis highlights, and FaceTiming friends. Too subsumed
                by a conversation, too cozy after a shower, or too full after a
                third helping of spaghetti and meatballs, nearly half the time
                I&apos;d forget the load entirely. (It didn&apos;t help that the
                machines lived in a soundproof closet, down a long corridor from
                the carpeted bedroom.) I&apos;d wake the next morning vexed, my
                clothes now wet, mildewy, and in need of a second wash — a
                realization that always arrived right before work, when I
                didn&apos;t have an hour to stick around and rerun them. So
                I&apos;d acquiesce to the compounding mildew and wait until that
                night to try again.
              </p>
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
                low-level mildew at this point. (I needed them for a Friday
                afternoon departure and couldn&apos;t risk another 24-hour
                delay.) I stood in front of the machines, livid, reckoning with
                a task that required so much of me yet so little at the same
                time. I enumerated the steps on my fingers: (1) open the washer
                and dryer doors, (2) gather three to five wet armfuls of clothes
                and hoist them to the dryer three feet away, (3) pick up and
                brush off the loose socks that inevitably fall in transit, (4)
                close the doors, (5) toss in a dryer sheet, (6) select the
                settings, and (7) press Start.
              </p>
              <p>
                I had already spent a comical amount of my life thinking about
                the sock problem. Every time a sock hits the floor, it bonds to
                dust and dirt at the worst possible juncture: when it is both
                cleanest and wettest. As the dryer spun before me that late
                December night, my eyes drifted to the corners of the machines.
                I considered the two units of identical depth and width,
                satisfyingly uniform in their stacked profile. Perhaps a result
                of my sleep-deprived stupor, the borders between the machines
                faded and my imagination took over.{" "}
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
                abstracted away. The substrate under every design and product
                decision could be summed up in one word, a word I must have
                written north of twenty times in that initial design document:{" "}
                <em className="text-paper not-italic">unburden</em>. Driving the
                design was this one singular goal, which served many flavors of
                laundry-user: liberate multi-child households from full days of
                trivial labor; reduce friction between roommates; let the
                exhausted workhorses sleep after a long day.
              </p>
              <p>
                That 1am frustration is where LinkLoad traces its origins. But
                my story isn&apos;t unusual; it&apos;s ubiquitous, and
                that&apos;s the founding principle. Every laundry user lives
                some version of it every time they do laundry.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-12">
            <h2 className="text-3xl md:text-4xl font-medium text-paper mb-8 tracking-tight">
              The Outsized Opportunity Cost of Laundry
            </h2>
            <div className="space-y-8 text-lg md:text-xl text-silver leading-relaxed font-light">
              <p>
                People misconceive the problem with laundry as the two minutes
                it takes to move the clothes and start the dryer. The real
                problem is the time around it. You don&apos;t have to be home
                for a two-minute activity; you have to be home for several
                hours. Further, you carry the load mentally the entire time it
                is running — whether listening for the &ldquo;done&rdquo;
                jingle, setting a timer, or trying to absentmindedly gauge when
                an hour has passed while you work in the other room. That
                back-of-mind overhang isn&apos;t carefree; it is a tax on
                productivity and peace of mind. And by the time you move the
                clothes, you&apos;re already at the midpoint of the task, so you
                feel like you might as well stay.
              </p>
              <p>
                Here&apos;s the crucial asymmetry: three hours is enough time to
                truly do a significant errand or two — go to the grocery store
                and the post office, attend a child&apos;s soccer game, or enjoy
                a leisurely dinner out — and it&apos;s no tragedy if dry clothes
                sit in the dryer afterward. However, one hour is insufficient to
                do any such errand, and it <i>is</i> problematic to leave wet
                clothes in the washer. The tether increases its constraint with
                multiple loads: two required transfers and machine-starts across
                a four- or five-hour stretch.
              </p>
              <p>
                The same asymmetry governs meaningful work. Any creative or
                administrative labor requires not just its nominal duration but
                buffers on the front- and backend to ramp up and cool down;
                laundry&apos;s trivial interruption at the midpoint steals much
                more than its two active minutes — it passively disrupts a
                multi-hour block. And from this, we derive a subtler but more
                intrusive theft. Imagine you need to start a multi-hour
                undertaking, as we all often do — something for work you&apos;ve
                been putting off, a blog post you&apos;ve been meaning to write,
                finances you&apos;ve been meaning to get in order — the kind of
                thing that demands a three-to-four-hour chunk to really sink
                into. On the one day a week you could do it, laundry shrinks
                that window of uninterrupted time below the threshold at which
                you&apos;d start it. So you don&apos;t start it, and it withers
                away in the backlog. That&apos;s what&apos;s actually being
                taken — not time, but{" "}
                <em className="text-paper not-italic">uninterrupted time</em>.
                If the transfer were handled, you&apos;d have the entire day to
                go off and live. Three to five waking hours per week of freedom
                from responsibility and mental overhead certainly adds up.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-12">
            <h2 className="text-3xl md:text-4xl font-medium text-paper mb-8 tracking-tight">
              Why Do I Hate Laundry So Much?
            </h2>
            <div className="space-y-8 text-lg md:text-xl text-silver leading-relaxed font-light">
              <p>
                I&apos;m an irritable guy, and always have been. I have little
                patience for operational inefficiencies. I hate it, for example,
                when restaurants have no effective way to alert patrons their
                food is ready, so someone wanders the space calling out a name
                to a person who has apparently, in the last two minutes, left
                the café altogether or gone deaf. I could name a million things
                I hate in this way. I identify with the kvetchings of Larry
                David to a sometimes unflattering extent.
              </p>
              <p>
                I know precisely what laundry costs, because it costs me the
                thing I value most. I&apos;m a software engineer and also a
                writer and editor — screenplays, stage plays, music videos,
                articles, op-eds — and my best work requires serious stretches
                of uninterrupted computer time, where nothing can reach me. One
                of those stretches looks like me at my desk, head bobbing to
                upbeat instrumental electronica, warm yellow lamplight, a
                mini-fridge with a carton of lemonade, hummus and pita chips —
                just me, my keyboard, a couple of notebooks, and a maze of
                thoughts.
              </p>
              <p>
                I need about an hour to organize myself and reach a flow state,
                at which point I can take off, weightless, for double-digit
                hours. It feels not unlike catching the speed slot three miles
                into a ten-mile run, when your legs stop hurting. Laundry turns
                a three-hour stretch into two one-hour blips, each too short for
                me to meaningfully reach flow, haunted both by the impending
                obligation and the fear of forgetting.
              </p>
              <p>
                The other half of my gripe with laundry — the more confessional
                half — is that I&apos;m forgetful. It&apos;s perhaps my greatest
                cognitive weakness. I have a great memory for some things: names
                and faces, song lyrics, professional tennis results dating to
                antiquity. For domestic chores, however, I&apos;m terrible. I
                forget with embarrassing frequency whether I&apos;ve already
                shampooed; I&apos;d bet I&apos;ve double-shampooed more than
                anyone you&apos;ve met without a diagnosed neurodegenerative
                disorder.
              </p>
              <p>
                So take the measure of me: a forgetful guy who values nothing
                more than his uninterrupted flow states, and an irritable
                curmudgeon who cannot understand why such a glaring inefficiency
                persists in such a frequent workflow — the software engineer in
                me screaming, <i>Refactor! Abstract!</i> — and who refuses to
                believe the market won&apos;t solve it within our lifetimes. I
                am the kind of person that the existing laundry paradigm
                irritates the most, and thus the person most motivated to
                improve it.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-12">
            <h2 className="text-3xl md:text-4xl font-medium text-paper mb-8 tracking-tight">
              How LinkLoad Sees Itself
            </h2>
            <div className="space-y-8 text-lg md:text-xl text-silver leading-relaxed font-light">
              <p>
                Ending the inefficiency of laundry is not a small or eccentric
                pet project. The history of civilization is a history of
                abstraction: unburdening humans of busywork so the saved time
                flows to more important thinking, to meaningful advancement, and
                to the sentimental matters that actually define a life — family,
                friends, the things we love. We are, as a civilization,
                perpetually rewriting the things we have to do to leave more
                blue sky for the things we want to do. Humans weren&apos;t meant
                to screw caps onto tubes of toothpaste, as{" "}
                <i>Charlie and the Chocolate Factory</i> taught us. We
                weren&apos;t meant to run everywhere, or crash cars, or carry
                water from the well each time we are thirsty. And in our
                increasingly automated world, we&apos;re certainly not meant to
                spend hours of our weeks moving clothes three feet and pushing a
                button.
              </p>
              <p>
                LinkLoad was founded to carry that project into the laundry
                room. It is not merely an upscale laundry machine; it is a
                premium home technology company, built not just to move your
                clothes from washer to dryer, but to permanently eliminate the
                mental overhead of laundry — to redefine the standard of laundry
                in the American household. It targets not just the burden of
                sacrificing your day, remembering the transfer, moving the
                clothes, and starting the dry, but of loading the materials,
                leaving the house to buy those materials, running a second load,
                and emptying the dryer to make room for it. (Everything, in
                other words.) Where today, laundry presents as an all-afternoon
                — or with multiple loads, all-day — activity, LinkLoad enables a
                comprehensive user experience in which laundry is a background,
                one-touch task, like running the dishwasher.
              </p>
              <p>
                The standard I hold it to is luxury, and I maintain a specific
                definition of the term. Luxury is not simply having everything
                you want taken care of; it&apos;s having the things you
                didn&apos;t think to ask for taken care of — and realizing, as a
                consequence, how much they matter. Luxury is not crossing your
                fingers and hoping something gets handled; it&apos;s never
                having to cross your fingers. It&apos;s arriving at the hotel
                room to find chocolate kisses on the pillows, a channel guide on
                each nightstand, a stocked pen in the drawer, an abundance of
                towels, a one-ring answer from concierge, two robes behind the
                bathroom door, extra toilet paper under the sink, light switches
                exactly where you would expect them.
              </p>
              <p>
                For LinkLoad, automatic transfer is the intuitable part. Luxury
                is the answer to every follow-up question: the hang-dry net; the
                queue system, doubling a proposition you&apos;d never imagined;
                the home-delivery system that proactively delivers your
                preferred detergent and softener; the preemptive Care+
                check-ups; the sub-24-hour service requests; the app with
                presets, remote check-ins, and annual analytics. Each feature
                removes a thought you didn&apos;t know you were carrying. That
                is why luxury products sell: not merely for status, but for the
                welcome alleviation of a burden the owner has long quietly
                resented.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-12">
            <h2 className="text-3xl md:text-4xl font-medium text-paper mb-8 tracking-tight">
              Why a Startup Builds This
            </h2>
            <div className="space-y-8 text-lg md:text-xl text-silver leading-relaxed font-light">
              <p>
                So why doesn&apos;t this machine exist, and why will a small
                company build it rather than a giant? Through a broad analysis
                of the competitive landscape across market sectors (industrial,
                commercial, and residential), prior utility patents, and
                conversations with former executives at incumbent appliance
                giants, the emergent hypothesis boils down to industry
                incentives.
              </p>
              <p>
                White goods is a safe, thin-margin industry that prefers
                incremental updates to large-scale rethinks. It is
                understandably risk-averse and comfortable in its shared
                dominance. The incumbents profit from the two-machine paradigm
                and have little appetite for cannibalizing it with a new design.
                They swear by, above all, cost efficiency and mechanical
                reliability, and spend the majority of their time crafting
                beautiful and highly functional technology. However, they spend
                proportionally little time thinking about their end-customers as
                people: multi-child parents shuttling kids to practice, handfuls
                of roommates sharing singular machines, employees coming home
                exhausted from ten-hour days. The industry optimizes the
                technology, boasting each year of marginal gains in energy
                efficiency, but nobody has made it their mission to optimize the
                workflow. A company built for exactly this problem, small and
                obsessed by design, untethered to established paradigms, is the
                natural author of its solution.
              </p>
              <p>
                I sometimes picture driving past a billboard for a machine that
                solves automated transfer, and knowing instantly that it will
                win, because it solves a real problem in every household. That
                thought, ineradicable and urgent, doesn&apos;t haunt me;
                it&apos;s the clearest gut indication I have that this is worth
                building, and the reason I&apos;m spending years of my life on
                it.
              </p>
            </div>
          </section>

          {/* Author Attribution */}
          <footer className="border-t border-charcoal pt-16">
            <div className="flex flex-col sm:flex-row items-center gap-8">
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
