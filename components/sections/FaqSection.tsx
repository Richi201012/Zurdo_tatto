"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { faqItems } from "@/data/faq";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();
  return (
    <section className="section" id="preguntas" aria-labelledby="faq-title">
      <div className="container">
        <p className="eyebrow">Antes de comenzar</p><h2 id="faq-title" className="section-title">Preguntas frecuentes.</h2>
        <div className="faq-list">
          {faqItems.map((item, index) => {
            const open = openIndex === index;
            return <div className="faq-item" key={item.question}>
              <h3><button type="button" aria-expanded={open} aria-controls={`faq-${index}`} onClick={() => setOpenIndex(open ? null : index)}><span>{item.question}</span>{open ? <Minus aria-hidden="true" /> : <Plus aria-hidden="true" />}</button></h3>
              <AnimatePresence initial={false}>{open && <motion.div className="faq-answer" id={`faq-${index}`} initial={reduceMotion ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}><p>{item.answer}</p></motion.div>}</AnimatePresence>
            </div>;
          })}
        </div>
      </div>
    </section>
  );
}
