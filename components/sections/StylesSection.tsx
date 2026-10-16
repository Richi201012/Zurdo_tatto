import type { PortfolioItem } from "@/types/portfolio";
import { MotionReveal } from "@/components/ui/MotionReveal";

export function StylesSection({ items }: { items: PortfolioItem[] }) {
  const styles = Array.from(new Set(items.map((item) => item.style))).map((style) => ({ style, count: items.filter((item) => item.style === style).length }));
  return (
    <section className="section styles-band" id="estilos" aria-labelledby="styles-title">
      <div className="container">
        <MotionReveal><p className="eyebrow">Lenguajes visuales</p><h2 id="styles-title" className="section-title">Estilos presentes en nuestro trabajo.</h2></MotionReveal>
        <div className="style-list">
          {styles.map((item, index) => <MotionReveal key={item.style} delay={index * .035} className="style-row"><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.style}</h3><b>{item.count} {item.count === 1 ? "pieza" : "piezas"}</b></MotionReveal>)}
        </div>
      </div>
    </section>
  );
}
