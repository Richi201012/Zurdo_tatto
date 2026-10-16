import { processSteps } from "@/data/process";
import { MotionReveal } from "@/components/ui/MotionReveal";

export function ProcessSection() {
  return (
    <section className="section" id="proceso" aria-labelledby="process-title">
      <div className="container">
        <div className="section-head"><MotionReveal><p className="eyebrow">De la idea a la cita</p><h2 id="process-title" className="section-title">Sin saltarnos lo importante.</h2></MotionReveal><MotionReveal><p className="lede">Indica tu día preferido desde el formulario. El tatuador asigna la hora y el estudio la confirma al validar el anticipo.</p></MotionReveal></div>
        <div className="process-list">
          {processSteps.map((step, index) => <MotionReveal className="process-item" delay={index * .035} key={step.number}><span className="process-number">{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></MotionReveal>)}
        </div>
      </div>
    </section>
  );
}
