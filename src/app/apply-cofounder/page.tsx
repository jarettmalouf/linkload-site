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

export default function ApplyCofounderPage() {
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

  const requiresSchool = formData.currentStatus !== "Industry / not in school" && formData.currentStatus !== "";

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
              Thank you for applying. I&apos;ll take a look, and if it seems like a
              good fit, I&apos;ll get back to you within 24 hours to schedule a
              call.
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
        <div className="max-w-lg mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-paper tracking-tight">
              Mechanical Co-Founder
            </h1>
            <a
              href="/cofounder-role.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-signal hover:underline mt-3 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View full job description (PDF)
            </a>
          </div>

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
                <svg className="w-5 h-5 text-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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
      </main>
    </div>
  );
}
