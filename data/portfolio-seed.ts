import type { ColorType, PortfolioItem, TattooStyle } from "@/types/portfolio";

type Seed = [string, string, TattooStyle, string, ColorType];

const seeds: Seed[] = [
  ["8115", "Composición geométrica", "Lettering", "Antebrazo", "color"],
  ["8116", "Retrato devocional", "Realismo", "Brazo", "black-and-grey"],
  ["8117", "Araña ornamental", "Minimalista", "Abdomen", "black-and-grey"],
  ["8118", "Toro ilustrado", "Black & grey", "Pecho", "black-and-grey"],
  ["8119", "Escorpión", "Black & grey", "Costado", "black-and-grey"],
  ["8120", "Lettering personalizado", "Lettering", "Cuello", "black-and-grey"],
  ["8121", "Manga narrativa", "Realismo", "Brazo", "black-and-grey"],
  ["8122", "Retrato y lettering", "Realismo", "Antebrazo", "black-and-grey"],
  ["8123", "Lettering de familia", "Lettering", "Antebrazo", "black-and-grey"],
  ["8125", "Retrato realista", "Realismo", "Antebrazo", "black-and-grey"],
  ["8126", "Retrato black & grey", "Realismo", "Antebrazo", "black-and-grey"],
  ["8127", "Ornamental floral", "Black & grey", "Antebrazo", "black-and-grey"],
  ["8128", "Frase de trazo fino", "Lettering", "Antebrazo", "black-and-grey"],
  ["8129", "San Judas Tadeo", "Realismo", "Antebrazo", "black-and-grey"],
  ["8130", "Ojo realista", "Realismo", "Antebrazo", "black-and-grey"],
  ["8131", "Composición fantástica", "Color", "Antebrazo", "color"],
  ["8132", "Retrato con flores", "Color", "Muslo", "color"],
  ["8133", "León black & grey", "Realismo", "Antebrazo", "black-and-grey"],
  ["8134", "Manga de retratos", "Realismo", "Brazo", "black-and-grey"],
  ["8135", "Calavera y humo", "Black & grey", "Antebrazo", "black-and-grey"],
  ["8136", "Manga oscura", "Black & grey", "Brazo", "black-and-grey"],
  ["8137", "Ilustración tradicional", "Color", "Pecho", "color"],
  ["8138", "Composición realista", "Realismo", "Brazo", "black-and-grey"],
  ["8139", "Lettering de mano", "Lettering", "Mano y antebrazo", "black-and-grey"],
  ["8140", "Mirada con fecha", "Realismo", "Antebrazo", "black-and-grey"],
  ["8141", "Lettering rojo", "Lettering", "Antebrazo", "color"],
  ["8142", "Cover up: rosas a color", "Color", "Costado", "color"],
  ["8143", "Rosa y lettering", "Color", "Antebrazo", "color"],
  ["8144", "Retrato en manga", "Realismo", "Brazo", "black-and-grey"],
  ["8145", "Retrato sobre mano", "Realismo", "Mano", "black-and-grey"],
  ["8146", "Rosa minimalista", "Color", "Cuello", "color"],
  ["8156", "Golondrinas en vuelo", "Minimalista", "Clavícula", "black-and-grey"],
  ["8157", "Recuerdo de mascota", "Color", "Hombro", "color"],
  ["8158", "Cristo crucificado", "Realismo", "Antebrazo", "black-and-grey"],
  ["8159", "Composición de fe", "Black & grey", "Antebrazo", "black-and-grey"],
  ["8160", "Why so serious", "Lettering", "Antebrazo", "color"],
  ["8161", "Mariposa ornamental azul", "Color", "Antebrazo", "color"],
  ["8162", "Lettering caligráfico", "Lettering", "Cuello y hombro", "black-and-grey"],
  ["8163", "Mariposa sombreada", "Black & grey", "Muslo", "black-and-grey"],
  ["8164", "Colibrí acuarela", "Color", "Clavícula", "color"],
  ["8165", "Virgen y rosa", "Realismo", "Brazo", "black-and-grey"],
  ["8166", "Mariposas magenta", "Color", "Antebrazo", "color"],
  ["8167", "Cover up: manos y rosario", "Realismo", "Antebrazo", "black-and-grey"],
  ["8169", "Trío de mariposas", "Minimalista", "Antebrazo", "black-and-grey"],
  ["8170", "Colibrí esmeralda", "Color", "Espalda alta", "color"],
  ["8171", "Colibrí azul", "Color", "Hombro", "color"],
  ["8172", "Corazón tradicional", "Color", "Antebrazo", "color"],
  ["8173", "Latido en acuarela", "Color", "Brazo", "color"],
  ["8174", "Nombre en gótico", "Lettering", "Pecho", "black-and-grey"],
  ["8175", "Panda ilustrado", "Color", "Antebrazo", "color"],
  ["8176", "Ángel de línea fina", "Black & grey", "Pecho", "black-and-grey"],
  ["8177", "Mariposas delicadas", "Minimalista", "Muslo", "black-and-grey"],
  ["8178", "Símbolo biohazard", "Black & grey", "Cuello", "black-and-grey"],
  ["8179", "Cruz ornamental", "Black & grey", "Cuello", "black-and-grey"],
  ["8180", "Flor y trazo continuo", "Minimalista", "Antebrazo", "color"],
  ["8181", "Calaveras en pareja", "Black & grey", "Antebrazos", "black-and-grey"],
  ["8182", "Corazón anatómico lineal", "Black & grey", "Pecho", "black-and-grey"],
  ["8183", "Flores y mariposa", "Color", "Antebrazo", "color"],
  ["8184", "Corazón de línea", "Minimalista", "Antebrazo", "black-and-grey"],
  ["8185", "Nombres caligráficos", "Lettering", "Antebrazo", "black-and-grey"],
  ["8186", "Rosa y flecha", "Black & grey", "Antebrazo", "black-and-grey"],
  ["8187", "Pistola personalizada", "Realismo", "Antebrazo", "black-and-grey"],
  ["8188", "Rosas de hombro", "Color", "Hombro", "color"],
  ["8189", "Dragón oriental", "Black & grey", "Pantorrilla", "black-and-grey"],
  ["8190", "Rostro entre flores", "Black & grey", "Antebrazo", "black-and-grey"],
  ["8191", "Dios por delante", "Lettering", "Antebrazo", "black-and-grey"],
  ["8192", "Brújula y ancla", "Black & grey", "Antebrazo", "black-and-grey"],
  ["8193", "Balón de fútbol", "Black & grey", "Muslo", "black-and-grey"],
  ["8194", "Máscara de hockey", "Color", "Antebrazo", "color"],
  ["8195", "Manga religiosa", "Realismo", "Antebrazo", "black-and-grey"],
  ["8196", "Familia y latido", "Lettering", "Antebrazo", "color"],
  ["8197", "Nombres enlazados", "Lettering", "Antebrazo", "black-and-grey"],
  ["8198", "Nombre Graciela", "Lettering", "Brazo", "black-and-grey"],
];

const now = "2026-10-12T00:00:00.000Z";

export const portfolioSeed: PortfolioItem[] = seeds.map(
  ([suffix, title, style, bodyPlacement, colorType], index) => {
    const file = `507378366338793${suffix}.jpg`;
    const id = `work-${suffix}`;
    const isHandsCoverUp = suffix === "8167";
    const isRosesCoverUp = suffix === "8142";
    return {
      id,
      title,
      slug: `${title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${suffix}`,
      description: isHandsCoverUp
        ? "Cover up realizado sobre un tatuaje existente. La nueva composición de manos y rosario transforma la pieza original con mayor profundidad, detalle y contraste."
        : isRosesCoverUp
          ? "Cover up realizado sobre un tatuaje existente. La composición floral a color cubre la pieza original y transforma por completo el costado."
        : "Trabajo real realizado por el estudio. Consulta para desarrollar una pieza personalizada inspirada en este estilo.",
      style,
      artist: "",
      bodyPlacement,
      size: "",
      colorType,
      performedAt: null,
      tags: [style, bodyPlacement],
      isFeatured: [0, 1, 4, 9, 14, 18].includes(index),
      isPublished: true,
      sortOrder: index,
      images: isHandsCoverUp
        ? [
            { id: `${id}-before`, imageUrl: "/portfolio/5073783663387938167.jpg", alt: "Antes del cover up: tatuaje original de manos en oración", sortOrder: 0, isCover: false },
            { id: `${id}-after`, imageUrl: "/portfolio/5073783663387938168.jpg", alt: "Después del cover up: manos en oración con rosario", sortOrder: 1, isCover: true },
          ]
        : isRosesCoverUp
          ? [
              { id: `${id}-before`, imageUrl: "/portfolio/5073783663387938142.jpg", alt: "Antes del cover up: tatuaje pequeño de arma", sortOrder: 0, isCover: false },
              { id: `${id}-after`, imageUrl: "/portfolio/5073783663387938124.jpg", alt: "Después del cover up: composición de rosas a color", sortOrder: 1, isCover: true },
            ]
        : [{ id: `${id}-cover`, imageUrl: `/portfolio/${file}`, alt: `${title}, tatuaje en ${bodyPlacement.toLowerCase()}`, sortOrder: 0, isCover: true }],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  },
);
