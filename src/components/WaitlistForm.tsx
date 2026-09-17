"use client";

import { useState } from "react";
import PrivacyModal from "./PrivacyModal";

const roles = [
  { value: "renter", label: "Renter" },
  { value: "homeowner", label: "Homeowner" },
  { value: "property_manager", label: "Property Manager" },
  { value: "operator", label: "Laundromat or Route Operator" },
  { value: "investor", label: "Investor" },
  { value: "other", label: "Other" },
];

const setups = [
  { value: "stacked", label: "Stacked pair" },
  { value: "side_by_side", label: "Side-by-side" },
  { value: "combo", label: "2-in-1 combo" },
  { value: "shared", label: "Shared laundry room" },
  { value: "laundromat", label: "Laundromat" },
];

const ageRanges = [
  { value: "18-24", label: "18–24" },
  { value: "25-34", label: "25–34" },
  { value: "35-44", label: "35–44" },
  { value: "45-54", label: "45–54" },
  { value: "55+", label: "55+" },
];

const genders = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not", label: "Prefer not to say" },
];

export default function WaitlistForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    cityZip: "",
    setup: "",
    ageRange: "",
    gender: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate submission - will be wired up later
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (isSubmitted) {
    return (
      <section id="waitlist" className="snap-section py-12 bg-void">
        <div className="max-w-xl mx-auto px-6 text-center">
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
          <h2 className="text-fluid-section font-semibold text-paper tracking-tight">
            Application received
          </h2>
          <p className="text-fluid-subhead text-steel mt-4">
            We review every application personally. Expect to hear from us soon.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="waitlist" className="snap-section py-12 bg-void">
      <div className="max-w-xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-fluid-section font-semibold text-paper tracking-tight">
            Apply to Pre-Order
          </h2>
          <p className="text-fluid-subhead text-steel mt-4">
            Limited early access. We review every application.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full px-4 py-3 rounded-lg bg-graphite border border-charcoal text-paper placeholder:text-steel/50 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal transition-colors"
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
                className="w-full px-4 py-3 rounded-lg bg-graphite border border-charcoal text-paper placeholder:text-steel/50 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm text-steel mb-2">
              I am a... <span className="text-signal">*</span>
            </label>
            <select
              id="role"
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-graphite border border-charcoal text-paper focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal transition-colors appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238E929A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                backgroundSize: "20px",
              }}
            >
              <option value="" className="bg-graphite">
                Select one
              </option>
              {roles.map((role) => (
                <option key={role.value} value={role.value} className="bg-graphite">
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* City/ZIP */}
          <div>
            <label
              htmlFor="cityZip"
              className="block text-sm text-steel mb-2"
            >
              City or ZIP code <span className="text-signal">*</span>
            </label>
            <input
              type="text"
              id="cityZip"
              name="cityZip"
              required
              value={formData.cityZip}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-graphite border border-charcoal text-paper placeholder:text-steel/50 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal transition-colors"
              placeholder="Los Angeles or 90210"
            />
          </div>

          {/* Current Setup */}
          <div>
            <label htmlFor="setup" className="block text-sm text-steel mb-2">
              Current laundry setup <span className="text-signal">*</span>
            </label>
            <select
              id="setup"
              name="setup"
              required
              value={formData.setup}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-graphite border border-charcoal text-paper focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal transition-colors appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238E929A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                backgroundSize: "20px",
              }}
            >
              <option value="" className="bg-graphite">
                Select one
              </option>
              {setups.map((setup) => (
                <option key={setup.value} value={setup.value} className="bg-graphite">
                  {setup.label}
                </option>
              ))}
            </select>
          </div>

          {/* Age Range & Gender */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ageRange"
                className="block text-sm text-steel mb-2"
              >
                Age range <span className="text-signal">*</span>
              </label>
              <select
                id="ageRange"
                name="ageRange"
                required
                value={formData.ageRange}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-graphite border border-charcoal text-paper focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238E929A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  backgroundSize: "20px",
                }}
              >
                <option value="" className="bg-graphite">
                  Select one
                </option>
                {ageRanges.map((age) => (
                  <option key={age.value} value={age.value} className="bg-graphite">
                    {age.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="gender"
                className="block text-sm text-steel mb-2"
              >
                Gender <span className="text-steel/50">(optional)</span>
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-graphite border border-charcoal text-paper focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238E929A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  backgroundSize: "20px",
                }}
              >
                <option value="" className="bg-graphite">
                  Select one
                </option>
                {genders.map((g) => (
                  <option key={g.value} value={g.value} className="bg-graphite">
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Privacy notice */}
          <p className="text-xs text-steel">
            By submitting, you agree to our{" "}
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="text-signal hover:underline"
            >
              Privacy Policy
            </button>
            .
          </p>

          <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />

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
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
