import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { MotionReveal } from "@/components/ui/MotionReveal";
import { studioConfig } from "@/config/studio";

export function ArtistStorySection() {
  const { artist } = studioConfig;

  return (
    <section className="section artist-story" id="nosotros" aria-labelledby="artist-story-title">
      <div className="container">
        <div className="artist-story-intro">
          <MotionReveal>
            <p className="eyebrow">{artist.eyebrow}</p>
            <h2 className="section-title" id="artist-story-title">{artist.headline}</h2>
          </MotionReveal>

          <MotionReveal className="artist-story-copy" delay={0.08}>
            {artist.biography.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </MotionReveal>
        </div>

        <MotionReveal className="artist-facts" delay={0.12}>
          {artist.facts.map((fact) => (
            <div className="artist-fact" key={fact.label}>
              <strong>{fact.value}</strong>
              <span>{fact.label}</span>
            </div>
          ))}
        </MotionReveal>

        <div className="credentials-heading">
          <MotionReveal>
            <p className="eyebrow">Formación y trayectoria documentadas</p>
            <h3>El oficio también se construye con preparación.</h3>
          </MotionReveal>
          <MotionReveal delay={0.06}>
            <p>Documentos obtenidos durante su etapa profesional en California. Abre cada imagen para verla completa.</p>
          </MotionReveal>
        </div>

        <div className="credentials-grid">
          {artist.credentials.map((credential, index) => (
            <MotionReveal className="credential-card" delay={index * 0.06} key={credential.image}>
              <a href={credential.image} target="_blank" rel="noreferrer" aria-label={`Abrir imagen completa: ${credential.title}`}>
                <span className={`credential-image${credential.kind === "photo" ? " credential-image-photo" : ""}`}>
                  <Image
                    src={credential.image}
                    alt={credential.alt}
                    fill
                    sizes="(max-width: 720px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </span>
                <span className="credential-meta">
                  <span>
                    <small>{credential.kicker}</small>
                    <strong>{credential.title}</strong>
                  </span>
                  <ArrowUpRight aria-hidden="true" size={20} />
                </span>
              </a>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
