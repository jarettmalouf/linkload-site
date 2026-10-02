"use client";

import { useState, useRef } from "react";
import Image from "next/image";

const STATUS_OPTIONS = [
  "Undergraduate student",
  "Master's student",
  "PhD student",
  "Postdoc",
  "Recent alum (within ~5 years)",
  "Industry / not in school",
];

const SECTIONS = [
  {
    title: "The Problem",
    content:
      "Laundry today is a broken workflow. Washing and drying are two disconnected systems that require minimal human intervention at a high opportunity cost. Most attempts to fix this remove the need for manual transfer, but introduce tradeoffs that have kneecapped meaningful adoption, especially in the US.",
  },
  {
    title: "Our Solution",
    content:
      "LinkLoad offers an automated laundry system that eliminates manual transfer through mechanical automation and a split-drum architecture. The system redefines laundry as an autonomous, two-load flow, delivering the coveted single-touchpoint UX while preserving the performance of traditional setups. LinkLoad is not merely a product; it's a next-generation home technology company building systems for an increasingly automated and time-constrained world.",
  },
  {
    title: "Current Stage",
    content:
      "The core architecture is legally protected and the build approach is largely defined. What remains is the hands-on work: motor selection and mechanism validation through fabrication, assembly, and testing, followed by production-grade questions like DFM, stabilization, and sealing that sit outside the first build. Initial field work has included interfacing with operators across industrial, commercial, and residential environments, which has narrowed the focus on where this problem is most acutely felt and clarified what kind of user to engineer the product around. We are now embarking on DV1, where the immediate goal is to build a system that demonstrates reliable transfer under realistic load conditions.",
  },
  {
    title: "The Role",
    content: `I'm looking for a hands-on co-founder with 6+ years of mechanical engineering education and experience (or exceptional ability that puts you in that league), ideally spanning the full product development cycle, to co-own product engineering with me: be our in-house technical authority, make engineering calls alongside me, lead our side of the work with our engineering partner as we design to our specs, and own the product beyond that relationship as we grow and build out the engineering team.

Specifically, you will:
• Design and iterate on motion systems (actuators, rotating assemblies, low-tolerance interfaces)
• Identify and solve failure modes (radial misalignment, jamming, wear-and-tear, etc.)
• Drive the system toward reliability/manufacturability (material selection, ID/EE/ME, etc.)
• Co-own the product engineering vertical as the company scales

The ideal candidate:
• Has 6+ years of mechanical engineering education and experience, preferably with motion systems
• Has experience building and iterating on physical prototypes (sourcing, fabrication, assembly, testing)
• Is energized, not discouraged, by working through problems no one has solved before`,
  },
];

function Accordion({
  title,
  content,
  isOpen,
  onToggle,
}: {
  title: string;
  content: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-charcoal">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-lg font-medium text-paper group-hover:text-signal transition-colors">
          {title}
        </span>
        <svg
          className={`w-5 h-5 text-steel transition-transform duration-200 ${
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
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-[800px] pb-6" : "max-h-0"
        }`}
      >
        <p className="text-silver leading-relaxed whitespace-pre-line">
          {content}
        </p>
      </div>
    </div>
  );
}

export default function ApplyCofounderPage() {
  const [openSection, setOpenSection] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = (index: number) => {
    if (isAnimating) return;

    if (openSection === index) {
      // Closing the same section
      setOpenSection(null);
    } else if (openSection !== null) {
      // Switching sections: close first, then open
      setIsAnimating(true);
      setOpenSection(null);
      setTimeout(() => {
        setOpenSection(index);
        setIsAnimating(false);
      }, 300);
    } else {
      // Opening when none are open
      setOpenSection(index);
    }
  };
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    currentStatus: "",
    schoolInstitution: "",
    majorField: "",
    linkedinUrl: "",
    websiteUrl: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiresSchool =
    formData.currentStatus !== "Industry / not in school" &&
    formData.currentStatus !== "";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File must be under 10MB");
        return;
      }
      setCvFile(file);
      setError("");
    }
  };

  const validateLinkedIn = (url: string) => {
    return url.includes("linkedin.com");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateLinkedIn(formData.linkedinUrl)) {
      setError("Please enter a valid LinkedIn URL");
      return;
    }

    if (requiresSchool && !formData.schoolInstitution) {
      setError("School/institution is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("fullName", formData.fullName);
      submitData.append("email", formData.email);
      submitData.append("currentStatus", formData.currentStatus);
      submitData.append("schoolInstitution", formData.schoolInstitution);
      submitData.append("majorField", formData.majorField);
      submitData.append("linkedinUrl", formData.linkedinUrl);
      submitData.append("websiteUrl", formData.websiteUrl);
      if (cvFile) {
        submitData.append("cv", cvFile);
      }

      const response = await fetch("/api/apply-cofounder", {
        method: "POST",
        body: submitData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Something went wrong");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyles =
    "w-full px-4 py-3 rounded-lg bg-graphite border border-charcoal text-paper placeholder:text-steel/50 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal transition-colors text-base";

  const labelStyles = "block text-sm text-silver mb-2";

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-void flex flex-col">
        <header className="p-6">
          <Image
            src="/images/logo.png"
            alt="LinkLoad"
            width={120}
            height={28}
            className="h-7 w-auto"
          />
        </header>
        <main className="flex-1 flex items-center justify-center px-6 pb-16">
          <div className="max-w-md text-center">
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
            <p className="text-xl text-silver leading-relaxed">
              Thank you for applying. I&apos;ll take a look, and if it seems
              like a good fit, I&apos;ll get back to you within 24 hours to
              schedule a call.
            </p>
            <p className="text-silver mt-4">— Jarett</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <header className="p-6">
        <Image
          src="/images/logo.png"
          alt="LinkLoad"
          width={120}
          height={28}
          className="h-7 w-auto"
        />
      </header>

      <main className="flex-1 px-6 pb-16">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-semibold text-paper tracking-tight mb-8">
            Mechanical Co-Founder Application
          </h1>

          {/* Mobile sketch - after title, before dropdowns */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/images/cofounder-sketch.png"
              alt="LinkLoad front elevation sketch"
              width={140}
              height={220}
              className="w-36 h-auto opacity-90"
            />
          </div>

          {/* Accordion sections with sketch */}
          <div className="flex gap-8 mb-12">
            <div className="flex-1 border-t border-charcoal">
              {SECTIONS.map((section, index) => (
                <Accordion
                  key={section.title}
                  title={section.title}
                  content={section.content}
                  isOpen={openSection === index}
                  onToggle={() => handleToggle(index)}
                />
              ))}
            </div>
            {/* Desktop sketch - flex centered, doesn't add height */}
            <div className="hidden lg:flex w-36 flex-shrink-0 items-center justify-center self-stretch">
              <Image
                src="/images/cofounder-sketch.png"
                alt="LinkLoad front elevation sketch"
                width={140}
                height={220}
                className="w-full h-auto opacity-90 max-h-full object-contain"
              />
            </div>
          </div>

          {/* Application Form */}
          <div>
            <h2 className="text-2xl font-semibold text-paper tracking-tight mb-6">
              Apply
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Honeypot */}
              <input
                type="text"
                name="website_url_confirm"
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
              />

              <div>
                <label htmlFor="fullName" className={labelStyles}>
                  Full name <span className="text-signal">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className={inputStyles}
                />
              </div>

              <div>
                <label htmlFor="email" className={labelStyles}>
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
                />
              </div>

              <div>
                <label htmlFor="currentStatus" className={labelStyles}>
                  Current status <span className="text-signal">*</span>
                </label>
                <select
                  id="currentStatus"
                  name="currentStatus"
                  required
                  value={formData.currentStatus}
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
                    Select...
                  </option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option} className="bg-graphite">
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {requiresSchool && (
                <div>
                  <label htmlFor="schoolInstitution" className={labelStyles}>
                    School or institution <span className="text-signal">*</span>
                  </label>
                  <input
                    type="text"
                    id="schoolInstitution"
                    name="schoolInstitution"
                    required={requiresSchool}
                    value={formData.schoolInstitution}
                    onChange={handleChange}
                    className={inputStyles}
                  />
                </div>
              )}

              {formData.currentStatus === "Industry / not in school" && (
                <div>
                  <label htmlFor="schoolInstitution" className={labelStyles}>
                    School or institution (if applicable)
                  </label>
                  <input
                    type="text"
                    id="schoolInstitution"
                    name="schoolInstitution"
                    value={formData.schoolInstitution}
                    onChange={handleChange}
                    className={inputStyles}
                  />
                </div>
              )}

              <div>
                <label htmlFor="majorField" className={labelStyles}>
                  Major / field of study <span className="text-signal">*</span>
                </label>
                <input
                  type="text"
                  id="majorField"
                  name="majorField"
                  required
                  value={formData.majorField}
                  onChange={handleChange}
                  className={inputStyles}
                  placeholder="Current or past"
                />
              </div>

              <div>
                <label htmlFor="linkedinUrl" className={labelStyles}>
                  LinkedIn URL <span className="text-signal">*</span>
                </label>
                <input
                  type="url"
                  id="linkedinUrl"
                  name="linkedinUrl"
                  required
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  className={inputStyles}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div>
                <label htmlFor="websiteUrl" className={labelStyles}>
                  Personal website or portfolio
                </label>
                <input
                  type="url"
                  id="websiteUrl"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  className={inputStyles}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label htmlFor="cv" className={labelStyles}>
                  CV / Resume (PDF, max 10MB)
                </label>
                <input
                  type="file"
                  id="cv"
                  name="cv"
                  accept=".pdf,application/pdf"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`${inputStyles} text-left flex items-center justify-between`}
                >
                  <span className={cvFile ? "text-paper" : "text-steel/50"}>
                    {cvFile ? cvFile.name : "Choose file..."}
                  </span>
                  <svg
                    className="w-5 h-5 text-steel"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </button>
                {cvFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setCvFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-sm text-steel hover:text-signal mt-2"
                  >
                    Remove file
                  </button>
                )}
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-signal hover:bg-signal/90 disabled:bg-signal/50 text-void font-medium px-8 py-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-base"
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
                  "Submit application"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
