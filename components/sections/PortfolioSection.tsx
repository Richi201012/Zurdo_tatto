import type { PortfolioItem } from "@/types/portfolio";
import { PortfolioGallery } from "@/components/gallery/PortfolioGallery";
import { MotionReveal } from "@/components/ui/MotionReveal";

export function PortfolioSection({ items }: { items: PortfolioItem[] }) {
  return (
    <section className="section" id="trabajos" aria-labelledby="works-title">
      <div className="container">
        <div className="section-head">
          <MotionReveal><p className="eyebrow">Portafolio / trabajos reales</p><h2 id="works-title" className="section-title">La piel como lienzo.</h2></MotionReveal>
          <MotionReveal delay={.08}><p className="lede">Explora los trabajos por estilo. Desliza cada colección para descubrir piezas con una composición visual uniforme.</p></MotionReveal>
        </div>
        <PortfolioGallery items={items} />
      </div>
    </section>
  );
}
