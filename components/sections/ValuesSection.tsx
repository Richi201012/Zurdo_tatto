import { MotionReveal } from "@/components/ui/MotionReveal";

const values = [
  { title: "Diseño personal", text: "Tu idea no entra en una plantilla. La escuchamos, la refinamos y la convertimos en una pieza propia." },
  { title: "Acompañamiento", text: "Te guiamos con claridad desde las referencias hasta los cuidados posteriores." },
  { title: "Proceso profesional", text: "Priorizamos preparación, higiene, materiales adecuados y decisiones responsables." },
];

export function ValuesSection() {
  return (
    <section className="section" aria-labelledby="values-title">
      <div className="container values-grid">
        <MotionReveal className="value-intro"><p className="eyebrow">Nuestra forma de trabajar</p><h2 id="values-title" className="section-title">Una pieza que se sienta tuya.</h2></MotionReveal>
        {values.map((value, index) => <MotionReveal className="value" delay={index * .06} key={value.title}><span className="process-number">0{index + 1}</span><h3>{value.title}</h3><p>{value.text}</p></MotionReveal>)}
      </div>
    </section>
  );
}
