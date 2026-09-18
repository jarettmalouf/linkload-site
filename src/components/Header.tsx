import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-void/80 backdrop-blur-md border-b border-charcoal">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/logo.svg"
            alt="LinkLoad"
            width={32}
            height={32}
            className="w-8 h-8 flex-shrink-0 invert"
          />
          <span className="text-paper font-medium text-lg tracking-tight">
            LinkLoad
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="/"
            className="text-steel hover:text-paper transition-colors text-sm uppercase tracking-wider"
          >
            Home
          </a>
          <a
            href="/our-story"
            className="text-steel hover:text-paper transition-colors text-sm uppercase tracking-wider"
          >
            Our Story
          </a>
          <a
            href="/contact"
            className="text-steel hover:text-paper transition-colors text-sm uppercase tracking-wider"
          >
            Contact
          </a>
        </nav>
        <a
          href="/#waitlist"
          className="bg-signal hover:bg-signal/90 text-void font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          Apply to Pre-Order
        </a>
      </div>
    </header>
  );
}
