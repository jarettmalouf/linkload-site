"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Create mailto link with form data
    const mailtoLink = `mailto:jarett@linkload.co?subject=${encodeURIComponent(formData.subject || "Contact Form Submission")}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nCompany: ${formData.company || "N/A"}\n\nMessage:\n${formData.message}`,
    )}`;

    window.location.href = mailtoLink;

    // Simulate submission feedback
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const inputStyles =
    "w-full px-4 py-3 rounded-lg bg-graphite border border-charcoal text-paper placeholder:text-steel/50 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal transition-colors";

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-xl mx-auto px-6">
          {isSubmitted ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-signal/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-signal"
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
              </div>
              <h1 className="text-fluid-section font-semibold text-paper tracking-tight">
                Message Sent
              </h1>
              <p className="text-fluid-subhead text-steel mt-4">
                Thanks for reaching out. We&apos;ll get back to you soon.
              </p>
              <a
                href="/"
                className="inline-block mt-8 text-signal hover:underline"
              >
                &larr; Back to Home
              </a>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h1 className="text-fluid-section font-semibold text-paper tracking-tight">
                  Contact Us
                </h1>
                <p className="text-silver mt-4 leading-relaxed">
                  Have a professional inquiry, partnership opportunity, or
                  general question? Fill out the form below and we&apos;ll get
                  back to you in 24 hours.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name & Email */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm text-steel mb-2"
                    >
                      Name <span className="text-signal">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className={inputStyles}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm text-steel mb-2"
                    >
                      Email <span className="text-signal">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={inputStyles}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Company */}
                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm text-steel mb-2"
                  >
                    Company <span className="text-steel/50">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className={inputStyles}
                    placeholder="Your company"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm text-steel mb-2"
                  >
                    Subject <span className="text-signal">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className={`${inputStyles} appearance-none cursor-pointer`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238E929A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      backgroundSize: "20px",
                    }}
                  >
                    <option value="" className="bg-graphite">
                      Select a topic
                    </option>
                    <option value="Partnership Inquiry" className="bg-graphite">
                      Partnership Inquiry
                    </option>
                    <option value="Press & Media" className="bg-graphite">
                      Press & Media
                    </option>
                    <option value="Investment" className="bg-graphite">
                      Investment
                    </option>
                    <option value="General Question" className="bg-graphite">
                      General Question
                    </option>
                    <option value="Other" className="bg-graphite">
                      Other
                    </option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm text-steel mb-2"
                  >
                    Message <span className="text-signal">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className={`${inputStyles} resize-none`}
                    placeholder="How can we help?"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-signal hover:bg-signal/90 disabled:bg-signal/50 text-void font-medium px-8 py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </button>

                <p className="text-center text-xs text-steel">
                  Or send a direct email to{" "}
                  <a
                    href="mailto:jarett@linkload.co"
                    className="text-signal hover:underline"
                  >
                    jarett@linkload.co
                  </a>
                </p>
              </form>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
