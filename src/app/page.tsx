import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ValueProps from "@/components/ValueProps";
import ComparisonTable from "@/components/ComparisonTable";
import FilmSection from "@/components/FilmSection";
import FAQ from "@/components/FAQ";
import WaitlistForm from "@/components/WaitlistForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="snap-container">
      <Header />
      <Hero />
      <ValueProps />
      <ComparisonTable />
      <FilmSection />
      <FAQ />
      <WaitlistForm />
      <Footer />
    </div>
  );
}
