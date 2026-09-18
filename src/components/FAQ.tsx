"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How does automated transfer work?",
    answer:
      "LinkLoad leverages a split-drum architecture and vertical chute to move clothes through the drums without manual intervention. Independent drum segments decouple and retract in sync, creating a full-diameter chute for clothes to pass through.",
  },
  {
    question: "How many loads can I start at once?",
    answer:
      "Two! Put the first load in the washer and the second in the Queue above. The second follows the first through the cycles, while the first ultimately finishes in the Done Drawer below the dryer.",
  },
  {
    question: "What if I have clothes to hang-dry?",
    answer:
      "We got you covered. A dedicated hang-dry net allows users to separate clothes that are not meant for machine-dry. These clothes do not transfer to the dryer and can be removed at the user's leisure. Further, the washer and dryer can operate independently when transfer isn't desired.",
  },
  {
    question: "How is this different from 2-in-1s?",
    answer:
      "LinkLoad uses two independently optimized units in a stacked footprint. It retains the specialized functionality of traditional independent washers and dryers, and avoids the pitfalls of 2-in-1s: forced serialization, forced drying, longer wait times, lower heat caps, and lower drum capacity.",
  },
  {
    question: "How do you make sure clothes don't get stuck?",
    answer:
      "Three engineering features ensure reliable transfer: (1) a full-diameter transfer chute with bounded fabric guardrails, (2) dislodgement, load-balancing, and load-sensing mechanisms that ensure all items transfer successfully, and (3) ingress guards that peel items gently adhered to the walls.",
  },
];

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-steel transition-transform duration-300 ${
        isOpen ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="section bg-void">
      <div className="max-w-3xl mx-auto w-full">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-fluid-section font-semibold text-paper tracking-tight">
            Let's talk socks
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-charcoal bg-void overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-graphite/50 transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="text-paper font-medium pr-4">
                  {faq.question}
                </span>
                <ChevronIcon isOpen={openIndex === index} />
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  openIndex === index
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 text-silver leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
