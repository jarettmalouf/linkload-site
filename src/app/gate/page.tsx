"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const ACCESS_CODE = "link";

export default function GatePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (code.toLowerCase().trim() !== ACCESS_CODE) {
      setError("Invalid access code");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toLowerCase().trim() }),
      });

      if (!response.ok) {
        setError("Something went wrong");
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <Image
            src="/images/logo.png"
            alt="LinkLoad"
            width={180}
            height={40}
            priority
            className="h-10 w-auto"
          />
        </div>

        {/* Gate form */}
        <div className="bg-graphite rounded-2xl p-8 border border-charcoal">
          <h1 className="text-2xl font-semibold text-paper text-center mb-2">
            Private Preview
          </h1>
          <p className="text-steel text-center mb-8">
            Enter the access code to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 rounded-lg bg-charcoal border border-charcoal text-paper placeholder-steel focus:outline-none focus:ring-2 focus:ring-signal focus:border-transparent transition-all text-center tracking-wider"
                placeholder="Enter code"
              />
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 rounded-lg bg-signal text-paper font-medium hover:bg-signal/90 focus:outline-none focus:ring-2 focus:ring-signal focus:ring-offset-2 focus:ring-offset-graphite disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? "..." : "Enter"}
            </button>
          </form>
        </div>

        <p className="text-steel text-sm text-center mt-8">
          Need access?{" "}
          <a
            href="mailto:jarett@linkload.co"
            className="text-signal hover:underline"
          >
            jarett@linkload.co
          </a>
        </p>
      </div>
    </div>
  );
}
