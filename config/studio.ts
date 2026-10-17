export const STUDIO_NAME = "Zurdo Tattoo";

export const studioConfig = {
  name: STUDIO_NAME,
  shortName: "Zurdo",
  tagline: "Tatuajes que cuentan tu historia.",
  description: "Piezas personalizadas creadas con oficio, criterio y atención a cada detalle.",
  logo: "/brand/zurdo-logo.jpg",
  contact: {
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    hours: "",
  },
  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
  },
  artist: {
    displayName: "Zurdo",
    eyebrow: "Conoce al tatuador",
    headline: "Once años convirtiendo historias en piezas únicas.",
    biography: [
      "Zurdo lleva 11 años dedicado al tatuaje. Su trabajo parte de escuchar cada idea, entender lo que representa para la persona y transformarla en una composición pensada para su piel, no en un diseño repetido.",
      "Durante dos años trabajó en Estados Unidos, una etapa que amplió su experiencia técnica y reforzó su preparación en prácticas responsables para el arte corporal. En California completó formación especializada y obtuvo su registro para ejercer en el condado de Kern.",
      "Hoy combina esa experiencia con un trato directo y honesto: cada proyecto se desarrolla con paciencia, criterio visual y atención al detalle, desde el primer boceto hasta los cuidados posteriores.",
    ],
    facts: [
      { value: "11 años", label: "de experiencia tatuando" },
      { value: "2 años", label: "de trayectoria en Estados Unidos" },
      { value: "California", label: "formación profesional" },
    ],
    credentials: [
      {
        image: "/certifications/california-certificates-studio.jpg",
        kicker: "Trayectoria internacional",
        title: "Formación realizada en California",
        alt: "Certificados de formación y registro de arte corporal colocados en el estudio de California",
        kind: "photo",
      },
      {
        image: "/certifications/california-bloodborne-pathogens.jpg",
        kicker: "California · 2024",
        title: "Capacitación para artistas corporales",
        alt: "Certificado de capacitación de California sobre patógenos transmitidos por sangre para artistas corporales",
        kind: "document",
      },
      {
        image: "/certifications/kern-county-body-art-registration.jpg",
        kicker: "Kern County · California",
        title: "Registro de arte corporal",
        alt: "Certificado de registro para la práctica de arte corporal del condado de Kern",
        kind: "document",
      },
    ],
  },
  booking: {
    dailyStartTime: "11:00",
    dailyEndTime: "19:00",
    paymentWindowHours: 2,
    minimumAdvanceMinutes: 120,
  },
  policies: {
    privacyUrl: "",
    availabilityHoldHours: 2,
    rescheduleNoticeHours: 48,
    cancellationNoticeHours: 48,
    bookingTermsVersion: "2026-10",
    bookingTerms: [
      "El día elegido es una preferencia. La fecha y hora propuestas se indicarán en la cotización.",
      "Los cambios de fecha deben solicitarse con al menos 48 horas de anticipación y están sujetos a disponibilidad.",
      "Las cancelaciones deben avisarse con al menos 48 horas de anticipación. El estudio confirmará por escrito qué sucede con el anticipo según el caso.",
      "Una vez enviada la cotización tienes 2 horas para realizar el anticipo. Si el estudio no puede validarlo dentro de ese plazo, el horario se libera automáticamente.",
    ],
  },
} as const;

export type StudioConfig = typeof studioConfig;
