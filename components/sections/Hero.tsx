"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { ArrowDown, ArrowRight } from "lucide-react";
import { studioConfig } from "@/config/studio";

export function Hero() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 700], [0, reduceMotion ? 0 : 80]);
  const mascotY = useTransform(scrollY, [0, 700], [0, reduceMotion ? 0 : -24]);

  return (
    <section className="hero" id="inicio" aria-labelledby="hero-title">
      <motion.div className="hero-media" style={{ y: imageY }}>
        <Image src="/portfolio/5073783663387938134.jpg" alt="Brazo tatuado con una composición realista realizada por el estudio" fill priority sizes="100vw" />
      </motion.div>
      <motion.div className="hero-mascot" style={{ y: mascotY }} initial={reduceMotion ? false : { opacity: 0, x: 70, scale: .94 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: .9, delay: .2, ease: [0.22, 1, 0.36, 1] }} aria-hidden="true">
        <span className="hero-mascot-glow" />
        <Image src="/brand/mascot-hero.png" alt="" width={1024} height={1536} priority sizes="(max-width: 700px) 70vw, 29vw" />
      </motion.div>
      <div className="hero-content">
        <motion.div className="hero-copy" initial={reduceMotion ? false : "hidden"} animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: .11 } } }}>
          <motion.p className="eyebrow" variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>Estudio independiente · Arte sobre piel</motion.p>
          <motion.h1 id="hero-title" className="display" variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: .72 } } }}>
            {studioConfig.name}<span>Tu historia, en tinta.</span>
          </motion.h1>
        </motion.div>
        <div className="hero-bottom">
          <div>
            <p className="lede">Diseñamos piezas únicas pensadas para ti, desde la primera idea hasta el último detalle.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#solicitud">Agendar cita <ArrowRight size={17} aria-hidden="true" /></a>
              <a className="button button-secondary" href="#trabajos">Ver trabajos</a>
            </div>
          </div>
          <a className="scroll-cue" href="#trabajos">Explorar <ArrowDown size={17} aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  );
}
