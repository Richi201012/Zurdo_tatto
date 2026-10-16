import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ArtistStorySection } from "@/components/sections/ArtistStorySection";
import { CallToAction } from "@/components/sections/CallToAction";
import { FaqSection } from "@/components/sections/FaqSection";
import { Hero } from "@/components/sections/Hero";
import { PortfolioSection } from "@/components/sections/PortfolioSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { RequestSection } from "@/components/sections/RequestSection";
import { StylesSection } from "@/components/sections/StylesSection";
import { ValuesSection } from "@/components/sections/ValuesSection";
import { portfolioRepository } from "@/lib/portfolio-repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const items = await portfolioRepository.list();
  return (
    <>
      <Header />
      <main id="contenido">
        <Hero />
        <PortfolioSection items={items} />
        <StylesSection items={items} />
        <ArtistStorySection />
        <ValuesSection />
        <ProcessSection />
        <CallToAction />
        <RequestSection />
        <FaqSection />
      </main>
      <Footer />
    </>
  );
}
