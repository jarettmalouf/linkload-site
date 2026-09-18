import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkLoad – The Washer-Dryer That Transfers Clothes for You",
  description:
    "A one-touch washer-dryer system with automatic transfer, queue-ready loading, and full appliance-grade performance. Start two loads at once and come back when everything's done.",
  openGraph: {
    title: "LinkLoad – The Washer-Dryer That Transfers Clothes for You",
    description:
      "A one-touch washer-dryer system with automatic transfer, queue-ready loading, and full appliance-grade performance.",
    url: "https://linkload.co",
    siteName: "LinkLoad",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkLoad – The Washer-Dryer That Transfers Clothes for You",
    description:
      "A one-touch washer-dryer system with automatic transfer, queue-ready loading, and full appliance-grade performance.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-void text-silver">{children}</body>
    </html>
  );
}
