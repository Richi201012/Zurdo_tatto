import { ArrowRight } from "lucide-react";
import { MotionReveal } from "@/components/ui/MotionReveal";

export function CallToAction() {
  return (
    <section className="cta-section" aria-labelledby="cta-title">
      <MotionReveal className="cta-content"><p className="eyebrow">¿Tienes una idea?</p><h2 id="cta-title">Hagámosla realidad.</h2><a className="button button-primary" href="#solicitud">Comenzar mi tatuaje <ArrowRight size={17} aria-hidden="true" /></a></MotionReveal>
    </section>
  );
}
