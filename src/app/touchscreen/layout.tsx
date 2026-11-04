import type { Metadata } from "next";
import "./touchscreen.css";

// Public but unlisted: reachable only by link. Not in the sitemap, not indexed.
export const metadata: Metadata = {
  title: "Touchscreen",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: null },
};

export default function TouchscreenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
