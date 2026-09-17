"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How does automated transfer work?",
    answer:
      "LinkLoad uses a retractable drum architecture and vertical chute to move clothes directly from the washer into the dryer without manual handling. The washer drum segments retract, allowing clothes to drop through a full-diameter transfer chute into the dryer below.",
  },
  {
    question: "How many loads can I start at once?",
    answer:
      "Two. Put the first load in the washer and the second in the Queue Drawer above. The second follows the first through the cycles, while the first ultimately finishes in the Done Drawer below the dryer.",
  },
  {
    question: "What if I have clothes to hang-dry?",
    answer:
      "The washer and dryer can operate independently when automatic transfer isn't desired. A dedicated hang-dry mesh system allows selected garments to be separated from the automated transfer and drying workflow.",
  },
  {
    question: "How is this different from 2-in-1s?",
    answer:
      "LinkLoad uses two full-capacity, independently optimized units in a compact stacked footprint, delivering faster cycles, better drying, and none of the compromises of 2-in-1s. It retains the parallelization and specialized functions of traditional independent washers and dryers.",
  },
  {
    question: "How do you make sure clothes don't get stuck?",
    answer:
      "Three engineering features ensure reliable transfer: a full-diameter transfer chute that matches the drum opening, dislodgement and load-balancing mechanisms that ensure all items release from the drum, and ingress guards that prevent items from catching on edges during the drop.",
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
    <section id="faq" className="snap-section py-12 bg-graphite">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-fluid-section font-semibold text-paper tracking-tight">
            Questions & Answers
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
