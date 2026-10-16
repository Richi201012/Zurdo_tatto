import { TattooRequestForm } from "@/components/forms/TattooRequestForm";
import { MotionReveal } from "@/components/ui/MotionReveal";

export function RequestSection() {
  return (
    <section className="section" id="solicitud" aria-labelledby="request-title">
      <div className="container request-shell">
        <MotionReveal className="request-aside"><p className="eyebrow">Empieza aquí</p><h2 id="request-title" className="section-title">Cuéntanos tu idea.</h2><p className="lede">Completa los cinco pasos, elige una fecha disponible y revisa las condiciones del anticipo antes de enviar.</p></MotionReveal>
        <TattooRequestForm />
      </div>
    </section>
  );
}
