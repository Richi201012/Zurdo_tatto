"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { TATTOO_STYLES, type PortfolioItem } from "@/types/portfolio";

type StyleGroup = {
  style: string;
  items: PortfolioItem[];
};

function StyleCarousel({ group, onSelect }: { group: StyleGroup; onSelect: (item: PortfolioItem) => void }) {
  const trackRef = useRef<HTMLOListElement>(null);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const headingId = useId();
  const lastIndex = group.items.length - 1;

  const updateActiveIndex = () => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.children) as HTMLElement[];
    if (!cards.length) return;
    const nearestIndex = cards.reduce((nearest, card, index) => (
      Math.abs(card.offsetLeft - track.scrollLeft) < Math.abs(cards[nearest].offsetLeft - track.scrollLeft) ? index : nearest
    ), 0);
    setActiveIndex(nearestIndex);
  };

  const handleScroll = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(updateActiveIndex);
  };

  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.children) as HTMLElement[];
    const nextIndex = Math.min(Math.max(activeIndex + direction, 0), lastIndex);
    cards[nextIndex]?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest", inline: "start" });
  };

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <section className="style-carousel" aria-labelledby={headingId} aria-roledescription="carrusel">
      <div className="style-carousel-head">
        <div>
          <p className="style-carousel-kicker">Estilo</p>
          <h3 id={headingId}>{group.style}</h3>
        </div>
        <div className="style-carousel-nav">
          <span className="style-carousel-count" aria-live="polite">
            {String(activeIndex + 1).padStart(2, "0")} / {String(group.items.length).padStart(2, "0")}
          </span>
          <button type="button" className="carousel-control" onClick={() => move(-1)} disabled={activeIndex === 0} aria-label={`Trabajo anterior de ${group.style}`}>
            <ArrowLeft aria-hidden="true" />
          </button>
          <button type="button" className="carousel-control" onClick={() => move(1)} disabled={activeIndex === lastIndex} aria-label={`Siguiente trabajo de ${group.style}`}>
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>

      <ol ref={trackRef} className="carousel-track" onScroll={handleScroll} aria-label={`Trabajos de ${group.style}`}>
        {group.items.map((item, index) => {
          const cover = item.images.find((image) => image.isCover) ?? item.images[0];
          if (!cover) return null;
          return (
            <motion.li className="carousel-slide" key={item.id} initial={reduceMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ delay: Math.min(index, 3) * .04 }}>
              <button className="gallery-item" type="button" onClick={() => onSelect(item)} aria-label={`Ver detalle: ${item.title}`}>
                <span className="gallery-image">
                  <Image src={cover.optimizedUrl ?? cover.imageUrl} alt={cover.alt} fill sizes="(max-width: 700px) 82vw, (max-width: 980px) 44vw, 29vw" />
                </span>
                <span className="gallery-meta"><strong>{item.title}</strong><span>{item.bodyPlacement || item.style}</span></span>
              </button>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}

export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  const [selected, setSelected] = useState<PortfolioItem | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const groups = useMemo<StyleGroup[]>(() => {
    const knownGroups = TATTOO_STYLES.map((style) => ({ style, items: items.filter((item) => item.style === style) })).filter((group) => group.items.length > 0);
    const knownStyles = new Set<string>(TATTOO_STYLES);
    const additionalStyles = Array.from(new Set(items.map((item) => item.style)))
      .filter((style) => !knownStyles.has(style))
      .map((style) => ({ style, items: items.filter((item) => item.style === style) }));
    return [...knownGroups, ...additionalStyles];
  }, [items]);

  useEffect(() => {
    if (!selected) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); previous?.focus(); };
  }, [selected]);

  return (
    <>
      <div className="portfolio-groups">
        {groups.map((group) => <StyleCarousel key={group.style} group={group} onSelect={setSelected} />)}
      </div>
      <AnimatePresence>
        {selected && (() => {
          const cover = selected.images.find((image) => image.isCover) ?? selected.images[0];
          if (!cover) return null;
          return (
            <motion.div className="lightbox" role="dialog" aria-modal="true" aria-labelledby="work-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
              <motion.div className="lightbox-panel" initial={reduceMotion ? false : { opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .985 }}>
                <button ref={closeRef} className="icon-button lightbox-close" type="button" aria-label="Cerrar detalle" onClick={() => setSelected(null)}><X aria-hidden="true" /></button>
                {selected.images.length > 1 ? (
                  <div className="lightbox-media lightbox-media-comparison" aria-label="Comparación del cover up antes y después">
                    {selected.images.map((image, index) => (
                      <figure key={image.id}>
                        <div className="comparison-image">
                          <Image src={image.optimizedUrl ?? image.imageUrl} alt={image.alt} fill sizes="(max-width: 700px) 50vw, 34vw" />
                        </div>
                        <figcaption>{index === 0 ? "Antes" : "Después"}</figcaption>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <div className="lightbox-media"><Image src={cover.optimizedUrl ?? cover.imageUrl} alt={cover.alt} width={1200} height={1500} sizes="(max-width: 700px) 100vw, 65vw" /></div>
                )}
                <div className="lightbox-copy">
                  <p className="eyebrow">Trabajo realizado</p>
                  <h3 id="work-title">{selected.title}</h3>
                  <p className="muted">{selected.description}</p>
                  <dl className="detail-list">
                    <div><small>Estilo</small><span>{selected.style}</span></div>
                    <div><small>Zona</small><span>{selected.bodyPlacement || "Por confirmar"}</span></div>
                  </dl>
                  <a className="button button-primary" href={`/?referencia=${selected.id}#solicitud`} onClick={() => setSelected(null)}>Quiero algo similar <ArrowRight size={17} aria-hidden="true" /></a>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}
