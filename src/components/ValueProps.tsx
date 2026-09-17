const valueProps = [
  {
    title: "No Manual Transfer Required",
    description:
      "LinkLoad automatically moves clothes from the washer to the dryer through its transfer architecture, eliminating the manual handoff between cycles.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    ),
  },
  {
    title: "No Performance Compromise",
    description:
      "Two full-capacity, independently optimized units in a compact stacked footprint. Faster cycles, better drying, none of the compromises of 2-in-1s.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: "Two Loads, One Touch",
    description:
      "Place the first load in the washer and a second in the Queue Drawer above. Both follow through the system automatically.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
];

export default function ValueProps() {
  return (
    <section id="why-linkload" className="snap-section py-12 bg-void">
      <div className="max-w-7xl mx-auto px-6 flex flex-col justify-center h-full">
        <div className="text-center mb-8">
          <h2 className="text-fluid-section font-semibold text-paper tracking-tight">
            Why LinkLoad
          </h2>
          <p className="text-fluid-subhead text-steel mt-3 max-w-2xl mx-auto">
            The performance of separate premium machines,
            <br className="hidden sm:block" />
            with the convenience of fully automated laundry.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
          {valueProps.map((prop, index) => (
            <div
              key={index}
              className="group p-8 lg:p-10 rounded-2xl bg-graphite border border-charcoal hover:border-steel/50 transition-colors"
            >
              <div className="text-signal mb-5">{prop.icon}</div>
              <h3 className="text-xl lg:text-2xl font-medium text-paper mb-3">
                {prop.title}
              </h3>
              <p className="text-silver leading-relaxed text-base lg:text-lg">{prop.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
