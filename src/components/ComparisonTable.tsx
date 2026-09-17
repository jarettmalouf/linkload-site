const features = [
  {
    name: "Automated transfer",
    pair: false,
    combo: true,
    linkload: true,
  },
  {
    name: "Load parallelization (wash #2 while #1 dries)",
    pair: true,
    combo: false,
    linkload: true,
  },
  {
    name: "Specialized wash & dry performance",
    pair: true,
    combo: false,
    linkload: true,
  },
  {
    name: "Hang-dry separation",
    pair: true,
    combo: false,
    linkload: true,
  },
  {
    name: "Two loads, one touch",
    pair: false,
    combo: false,
    linkload: true,
    highlight: true,
  },
];

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-signal"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="w-5 h-5 text-steel/50"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export default function ComparisonTable() {
  return (
    <section className="snap-section py-12 bg-graphite">
      <div className="max-w-6xl mx-auto px-6 flex flex-col justify-center h-full">
        <div className="text-center mb-8">
          <h2 className="text-fluid-section font-semibold text-paper tracking-tight">
            How LinkLoad Stacks Up
          </h2>
          <p className="text-fluid-subhead text-steel mt-3 max-w-2xl mx-auto">
            The best of both worlds: the performance of premium pairs, with the
            convenience of fully automated laundry.
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-charcoal">
          <table className="w-full text-lg">
            <thead>
              <tr className="bg-void">
                <th className="text-left py-6 px-8 text-steel font-medium text-base uppercase tracking-wider">
                  Feature
                </th>
                <th className="py-6 px-8 text-center">
                  <span className="text-steel font-medium text-lg">Separate Pair</span>
                </th>
                <th className="py-6 px-8 text-center">
                  <span className="text-steel font-medium text-lg">2-in-1 Combo</span>
                </th>
                <th className="py-6 px-8 text-center">
                  <span className="text-signal font-semibold text-lg">LinkLoad</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr
                  key={index}
                  className={`border-t border-charcoal ${
                    feature.highlight
                      ? "bg-signal/10"
                      : index % 2 === 0
                        ? "bg-graphite"
                        : "bg-graphite/50"
                  }`}
                >
                  <td
                    className={`py-5 px-8 ${feature.highlight ? "text-paper font-medium" : "text-silver"}`}
                  >
                    {feature.name}
                  </td>
                  <td className="py-5 px-8 text-center">
                    <div className="flex justify-center">
                      {feature.pair ? <CheckIcon /> : <XIcon />}
                    </div>
                  </td>
                  <td className="py-5 px-8 text-center">
                    <div className="flex justify-center">
                      {feature.combo ? <CheckIcon /> : <XIcon />}
                    </div>
                  </td>
                  <td className="py-5 px-8 text-center">
                    <div className="flex justify-center">
                      {feature.linkload ? <CheckIcon /> : <XIcon />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {["Separate Pair", "2-in-1 Combo", "LinkLoad"].map(
            (product, productIndex) => (
              <div
                key={product}
                className={`rounded-2xl border ${
                  productIndex === 2
                    ? "border-signal bg-void"
                    : "border-charcoal bg-graphite/50"
                } p-6`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    productIndex === 2 ? "text-signal" : "text-steel"
                  }`}
                >
                  {product}
                </h3>
                <ul className="space-y-3">
                  {features.map((feature, featureIndex) => {
                    const hasFeature =
                      productIndex === 0
                        ? feature.pair
                        : productIndex === 1
                          ? feature.combo
                          : feature.linkload;
                    return (
                      <li
                        key={featureIndex}
                        className="flex items-center gap-3"
                      >
                        {hasFeature ? <CheckIcon /> : <XIcon />}
                        <span
                          className={
                            hasFeature ? "text-silver" : "text-steel/50"
                          }
                        >
                          {feature.name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
