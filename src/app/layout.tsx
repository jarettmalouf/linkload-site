import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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
      className={`${inter.variable} antialiased`}
    >
      <body className="min-h-screen bg-void text-silver">{children}</body>
    </html>
  );
}
