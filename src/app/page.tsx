import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ValueProps from "@/components/ValueProps";
import ComparisonTable from "@/components/ComparisonTable";
import FilmSection from "@/components/FilmSection";
import FAQ from "@/components/FAQ";
import WaitlistForm from "@/components/WaitlistForm";
import Footer from "@/components/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://linkload.co/#organization",
      name: "LinkLoad",
      url: "https://linkload.co",
      logo: {
        "@type": "ImageObject",
        url: "https://linkload.co/images/logo.png",
      },
      description:
        "LinkLoad is building the first automated laundry system that transfers clothes from washer to dryer automatically.",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": "https://linkload.co/#website",
      url: "https://linkload.co",
      name: "LinkLoad",
      publisher: {
        "@id": "https://linkload.co/#organization",
      },
    },
    {
      "@type": "Product",
      "@id": "https://linkload.co/#product",
      name: "LinkLoad Automated Laundry System",
      description:
        "The first washer-dryer that automatically transfers clothes from washer to dryer. Start two loads, walk away.",
      brand: {
        "@type": "Brand",
        name: "LinkLoad",
      },
      manufacturer: {
        "@id": "https://linkload.co/#organization",
      },
      category: "Home Appliances",
    },
    {
      "@type": "SiteNavigationElement",
      "@id": "https://linkload.co/#navigation",
      name: "Main Navigation",
      hasPart: [
        {
          "@type": "SiteNavigationElement",
          name: "Watch the Demo",
          url: "https://linkload.co/#how-it-works",
        },
        {
          "@type": "SiteNavigationElement",
          name: "Our Story",
          url: "https://linkload.co/our-story",
        },
        {
          "@type": "SiteNavigationElement",
          name: "Contact Us",
          url: "https://linkload.co/contact",
        },
        {
          "@type": "SiteNavigationElement",
          name: "Join the Queue",
          url: "https://linkload.co/#waitlist",
        },
      ],
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="home-container">
        <Header />
        <Hero />
        <div className="content-sections">
          <FilmSection />
          <ValueProps />
          <ComparisonTable />
          <FAQ />
          <WaitlistForm />
          <Footer />
        </div>
      </div>
    </>
  );
}
