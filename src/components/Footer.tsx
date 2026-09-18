import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-void border-t border-charcoal py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.svg"
              alt="LinkLoad"
              width={28}
              height={28}
              className="w-7 h-7 flex-shrink-0 invert"
            />
            <span className="text-paper font-medium">LinkLoad</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-steel">
            <Link
              href="/our-story"
              className="hover:text-paper transition-colors"
            >
              Our Story
            </Link>
            <Link
              href="/contact"
              className="hover:text-paper transition-colors"
            >
              Contact
            </Link>
          </nav>
          <p className="text-steel text-sm">
            &copy; {new Date().getFullYear()} LinkLoad, Inc. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
