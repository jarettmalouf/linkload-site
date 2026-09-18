"use client";

import { useEffect } from "react";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-void/90 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-graphite border border-charcoal rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-graphite border-b border-charcoal px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-paper">Privacy Policy</h2>
          <button
            onClick={onClose}
            className="text-steel hover:text-paper transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6 text-silver text-sm leading-relaxed">
          <p className="text-steel text-xs">Last updated: September 2026</p>

          <section>
            <h3 className="text-paper font-medium mb-2">Information We Collect</h3>
            <p>
              When you apply to pre-order or contact us, we collect information you provide directly, including your name, email address, location, and any other details you choose to share. We also automatically collect certain technical information when you visit our website, such as your IP address, browser type, and pages viewed.
            </p>
          </section>

          <section>
            <h3 className="text-paper font-medium mb-2">How We Use Your Information</h3>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-silver/90">
              <li>Process and manage your pre-order application</li>
              <li>Communicate with you about LinkLoad products and updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h3 className="text-paper font-medium mb-2">Information Sharing</h3>
            <p>
              We do not sell, rent, or trade your personal information to third parties. We may share your information with service providers who assist us in operating our website and conducting our business, subject to confidentiality agreements. We may also disclose information when required by law or to protect our rights.
            </p>
          </section>

          <section>
            <h3 className="text-paper font-medium mb-2">Data Security</h3>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h3 className="text-paper font-medium mb-2">Your Rights</h3>
            <p>
              You have the right to access, correct, or delete your personal information. You may also opt out of receiving marketing communications at any time. To exercise these rights, please contact us at{" "}
              <a href="mailto:jarett@linkload.co" className="text-signal hover:underline">
                jarett@linkload.co
              </a>.
            </p>
          </section>

          <section>
            <h3 className="text-paper font-medium mb-2">Cookies</h3>
            <p>
              Our website may use cookies and similar technologies to enhance your experience. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h3 className="text-paper font-medium mb-2">Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h3 className="text-paper font-medium mb-2">Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:jarett@linkload.co" className="text-signal hover:underline">
                jarett@linkload.co
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
