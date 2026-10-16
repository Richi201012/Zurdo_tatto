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
import type { PortfolioItem } from "@/types/portfolio";

export const dynamic = "force-dynamic";

async function loadPortfolio() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!backendUrl) return portfolioRepository.list();

  const response = await fetch(`${backendUrl}/api/portfolio`, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo consultar el portafolio desde el backend.");
  const payload = await response.json() as { items: PortfolioItem[] };
  return payload.items;
}

export default async function HomePage() {
  const items = await loadPortfolio();
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
