import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LinkLoad – The Washer-Dryer That Transfers Clothes for You",
    template: "%s | LinkLoad",
  },
  description:
    "LinkLoad is the first automated laundry system that moves your clothes from washer to dryer. Start two loads, walk away. No manual transfer required.",
  keywords: [
    "LinkLoad",
    "automated laundry",
    "washer dryer",
    "automatic clothes transfer",
    "smart laundry",
    "laundry automation",
    "washer dryer combo",
    "home appliance",
  ],
  authors: [{ name: "LinkLoad" }],
  creator: "LinkLoad",
  publisher: "LinkLoad",
  metadataBase: new URL("https://linkload.co"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://linkload.co",
    siteName: "LinkLoad",
    title: "LinkLoad – The Washer-Dryer That Transfers Clothes for You",
    description:
      "The first automated laundry system that moves your clothes from washer to dryer. Start two loads, walk away.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "LinkLoad - Automated Laundry System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkLoad – The Washer-Dryer That Transfers Clothes for You",
    description:
      "The first automated laundry system that moves your clothes from washer to dryer.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
