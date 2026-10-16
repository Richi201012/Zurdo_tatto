import { studioConfig } from "@/config/studio";
import { formatMoney, formatStudioDateTime, formatTattooSize } from "@/lib/booking/format";

export const EMAIL_TEMPLATES = [
  "REQUEST_RECEIVED", "MISSING_INFORMATION", "QUOTE", "PAYMENT_REPORTED", "PAYMENT_REJECTED",
  "DEPOSIT_CONFIRMED", "APPOINTMENT_CONFIRMED", "APPOINTMENT_REMINDER", "APPOINTMENT_RESCHEDULED",
  "CANCELLED_BY_CLIENT", "CANCELLED_BY_STUDIO", "APPOINTMENT_COMPLETED", "NO_SHOW", "FOLLOW_UP", "CUSTOM",
] as const;

export type EmailTemplateName = typeof EMAIL_TEMPLATES[number];

export interface EmailTemplateInput {
  clientName?: string; requestFolio?: string; appointmentFolio?: string; idea?: string; bodyPlacement?: string; approximateSize?: string; colorPreference?: string; preferredDay?: string;
  minPriceCents?: number; maxPriceCents?: number; depositCents?: number; paidCents?: number; balanceCents?: number;
  estimatedMinutes?: number; sessionCount?: number; artistName?: string; appointmentAt?: string; previousAppointmentAt?: string;
  appointmentUrl?: string; paymentUrl?: string; missingInformation?: string; paymentInstructions?: string; paymentMethods?: string[]; paymentDueAt?: string;
  transferBank?: string; transferBeneficiary?: string; transferClabe?: string; transferAccount?: string;
  quoteComments?: string; paymentReason?: string; cancellationReason?: string; depositDisposition?: string; customSubject?: string; customMessage?: string;
}

type TemplateConfig = {
  subject: string;
  label: string;
  title: string;
  message: string;
  nextStep: string;
  color: string;
  soft: string;
  progress: number;
};

const CONFIG: Record<EmailTemplateName, TemplateConfig> = {
  REQUEST_RECEIVED: { subject: "Recibimos tu solicitud", label: "Solicitud recibida", title: "Ya tenemos tu idea", message: "El estudio recibió los datos de tu proyecto. El tatuador los revisará antes de preparar una propuesta.", nextStep: "Siguiente paso: recibirás tu cotización por correo.", color: "#b94331", soft: "#fff3ef", progress: 1 },
  MISSING_INFORMATION: { subject: "Necesitamos un dato más", label: "Información pendiente", title: "Completemos tu proyecto", message: "Antes de cotizar necesitamos confirmar algunos detalles de tu idea.", nextStep: "Siguiente paso: responde este correo con la información solicitada.", color: "#a46300", soft: "#fff7df", progress: 1 },
  QUOTE: { subject: "Tu cotización está lista", label: "Cotización enviada", title: "Esta es la propuesta para tu tatuaje", message: "Revisa el precio estimado, la fecha asignada y el anticipo requerido para reservar la cita.", nextStep: "Siguiente paso: realiza el anticipo dentro del plazo indicado.", color: "#9b3a2b", soft: "#fff2ee", progress: 2 },
  PAYMENT_REPORTED: { subject: "Estamos revisando tu anticipo", label: "Pago en revisión", title: "Recibimos los datos de tu pago", message: "El estudio está revisando la información del anticipo. La cita aún no está confirmada.", nextStep: "Siguiente paso: recibirás otro correo al terminar la validación.", color: "#8b6508", soft: "#fff8df", progress: 3 },
  PAYMENT_REJECTED: { subject: "No pudimos validar tu anticipo", label: "Pago no validado", title: "Necesitamos revisar tu pago", message: "La información recibida no coincide con el anticipo requerido. La cita todavía no está confirmada.", nextStep: "Siguiente paso: revisa el motivo y comunícate con el estudio.", color: "#b42318", soft: "#fff0ee", progress: 2 },
  DEPOSIT_CONFIRMED: { subject: "Anticipo confirmado", label: "Anticipo validado", title: "Tu pago quedó registrado", message: "El estudio validó correctamente el anticipo de tu proyecto.", nextStep: "Siguiente paso: revisa la confirmación de tu cita.", color: "#287a49", soft: "#eef9f2", progress: 3 },
  APPOINTMENT_CONFIRMED: { subject: "Tu cita está confirmada", label: "Cita confirmada", title: "Nos vemos en tu sesión", message: "El anticipo fue validado y tu cita quedó reservada oficialmente.", nextStep: "Siguiente paso: llega descansado y sigue las recomendaciones del estudio.", color: "#287a49", soft: "#eef9f2", progress: 4 },
  APPOINTMENT_REMINDER: { subject: "Recordatorio de tu cita", label: "Tu sesión se acerca", title: "Todo está listo para tu cita", message: "Te recordamos la fecha y hora de tu sesión de tatuaje.", nextStep: "Siguiente paso: confirma cualquier duda directamente con el estudio.", color: "#315c8f", soft: "#eef5ff", progress: 4 },
  APPOINTMENT_RESCHEDULED: { subject: "Actualizamos tu cita", label: "Cita reprogramada", title: "Esta es tu nueva fecha", message: "La fecha de tu sesión fue actualizada. Revisa a continuación el nuevo horario.", nextStep: "Siguiente paso: guarda la nueva fecha en tu calendario.", color: "#315c8f", soft: "#eef5ff", progress: 4 },
  CANCELLED_BY_CLIENT: { subject: "Tu cita fue cancelada", label: "Cita cancelada", title: "Registramos la cancelación", message: "La cita ya no continuará en la fecha programada.", nextStep: "Si deseas retomar el proyecto, comunícate con el estudio.", color: "#a63b3b", soft: "#fff0f0", progress: 0 },
  CANCELLED_BY_STUDIO: { subject: "Necesitamos ajustar tu cita", label: "Actualización de la cita", title: "La cita fue cancelada por el estudio", message: "No podremos realizar la sesión en la fecha programada. Lamentamos el inconveniente.", nextStep: "Siguiente paso: el estudio te ayudará a encontrar una nueva fecha.", color: "#a63b3b", soft: "#fff0f0", progress: 0 },
  APPOINTMENT_COMPLETED: { subject: "Gracias por confiar en el estudio", label: "Sesión realizada", title: "Tu pieza ya es parte de tu historia", message: "Gracias por confiar tu proyecto al estudio. Sigue cuidadosamente las indicaciones de curación.", nextStep: "Siguiente paso: cuida la pieza y escríbenos si tienes alguna duda.", color: "#287a49", soft: "#eef9f2", progress: 5 },
  NO_SHOW: { subject: "Seguimiento de tu cita", label: "Cita no realizada", title: "No pudimos realizar la sesión", message: "La cita quedó registrada como no realizada porque no fue posible iniciar la sesión en el horario acordado.", nextStep: "Comunícate con el estudio para revisar tu caso.", color: "#a63b3b", soft: "#fff0f0", progress: 0 },
  FOLLOW_UP: { subject: "¿Retomamos tu proyecto?", label: "Seguimiento", title: "Tu idea sigue registrada", message: "Queremos saber si todavía deseas continuar con tu proyecto de tatuaje.", nextStep: "Responde este correo para retomar el proceso.", color: "#315c8f", soft: "#eef5ff", progress: 1 },
  CUSTOM: { subject: "Mensaje del estudio", label: "Mensaje del estudio", title: "Tenemos una actualización para ti", message: "El estudio quiere compartir contigo la siguiente información.", nextStep: "Responde este correo si necesitas ayuda.", color: "#4c4b48", soft: "#f4f2ed", progress: 0 },
};

const MASCOT_BY_TEMPLATE: Record<EmailTemplateName, { file: string; alt: string }> = {
  REQUEST_RECEIVED: { file: "request-received", alt: "Mascota del estudio registrando una nueva solicitud" },
  MISSING_INFORMATION: { file: "more-information", alt: "Mascota del estudio solicitando más información" },
  QUOTE: { file: "quote-ready", alt: "Mascota del estudio presentando una cotización" },
  PAYMENT_REPORTED: { file: "deposit-request", alt: "Mascota del estudio revisando la información del anticipo" },
  PAYMENT_REJECTED: { file: "appointment-cancelled", alt: "Mascota del estudio indicando que el pago no fue validado" },
  DEPOSIT_CONFIRMED: { file: "deposit-confirmed", alt: "Mascota del estudio confirmando el anticipo" },
  APPOINTMENT_CONFIRMED: { file: "appointment-confirmed", alt: "Mascota del estudio confirmando la cita" },
  APPOINTMENT_REMINDER: { file: "appointment-reminder", alt: "Mascota del estudio recordando una cita" },
  APPOINTMENT_RESCHEDULED: { file: "appointment-rescheduled", alt: "Mascota del estudio mostrando una cita reprogramada" },
  CANCELLED_BY_CLIENT: { file: "appointment-cancelled", alt: "Mascota del estudio informando una cita cancelada" },
  CANCELLED_BY_STUDIO: { file: "appointment-cancelled", alt: "Mascota del estudio informando una cita cancelada" },
  APPOINTMENT_COMPLETED: { file: "appointment-completed", alt: "Mascota del estudio celebrando una sesión realizada" },
  NO_SHOW: { file: "appointment-cancelled", alt: "Mascota del estudio informando una cita no realizada" },
  FOLLOW_UP: { file: "availability", alt: "Mascota del estudio mostrando disponibilidad para retomar el proyecto" },
  CUSTOM: { file: "see-you-soon", alt: "Mascota del estudio celebrando una actualización" },
};

function esc(value: unknown) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function row(label: string, value?: string) {
  if (!value) return "";
  return `<tr><td style="padding:10px 0;border-bottom:1px solid #e7e3dc;color:#77716a;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${esc(label)}</td><td align="right" style="padding:10px 0;border-bottom:1px solid #e7e3dc;color:#171513;font-size:13px;font-weight:700">${esc(value)}</td></tr>`;
}

function renderProgress(config: TemplateConfig) {
  if (!config.progress) return "";
  const steps = ["Solicitud", "Cotización", "Anticipo", "Cita", "Realizado"];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px"><tr>${steps.map((step, index) => {
    const complete = index + 1 <= config.progress;
    const current = index + 1 === config.progress;
    return `<td width="20%" align="center" valign="top" style="padding:0 2px"><span style="display:block;width:26px;height:26px;margin:0 auto 7px;border-radius:50%;line-height:26px;background:${complete ? config.color : "#e7e3dc"};color:${complete ? "#fff" : "#8c877f"};font-size:11px;font-weight:800;box-shadow:${current ? `0 0 0 4px ${config.soft}` : "none"}">${complete ? "✓" : index + 1}</span><span style="display:block;color:${current ? "#171513" : "#8c877f"};font-size:9px;font-weight:${current ? "800" : "600"}">${step}</span></td>`;
  }).join("")}</tr></table>`;
}

function projectSummary(data: EmailTemplateInput) {
  const date = data.appointmentAt ? formatStudioDateTime(data.appointmentAt) : data.preferredDay;
  const content = [
    row("Idea", data.idea),
    row("Zona", data.bodyPlacement),
    row("Tamaño", formatTattooSize(data.approximateSize)),
    row("Color", data.colorPreference),
    row("Tatuador", data.artistName),
    row("Fecha y hora", date),
  ].join("");
  if (!content) return "";
  return `<tr><td class="email-pad" style="padding:24px 32px 0;background:#fff"><p style="margin:0 0 10px;color:#171513;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Resumen de tu proyecto</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e7e3dc">${content}</table></td></tr>`;
}

function quoteSummary(data: EmailTemplateInput) {
  if (data.minPriceCents === undefined && data.depositCents === undefined && data.paidCents === undefined) return "";
  const price = data.minPriceCents === undefined ? undefined : data.maxPriceCents && data.maxPriceCents !== data.minPriceCents ? `${formatMoney(data.minPriceCents)} – ${formatMoney(data.maxPriceCents)}` : formatMoney(data.minPriceCents);
  const duration = data.estimatedMinutes ? `${Math.floor(data.estimatedMinutes / 60)} h ${data.estimatedMinutes % 60 ? `${data.estimatedMinutes % 60} min` : ""}`.trim() : undefined;
  const content = [
    row("Precio estimado", price),
    row("Anticipo requerido", data.depositCents === undefined ? undefined : formatMoney(data.depositCents)),
    row("Anticipo validado", data.paidCents === undefined ? undefined : formatMoney(data.paidCents)),
    row("Saldo estimado", data.balanceCents === undefined ? undefined : formatMoney(data.balanceCents)),
    row("Sesiones", data.sessionCount ? String(data.sessionCount) : undefined),
    row("Duración estimada", duration),
    row("Límite para el anticipo", data.paymentDueAt ? formatStudioDateTime(data.paymentDueAt) : undefined),
  ].join("");
  return `<tr><td class="email-pad" style="padding:24px 32px 0;background:#fff"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ded9d1;border-radius:14px;background:#f7f5f1"><tr><td style="padding:18px 20px"><p style="margin:0 0 8px;color:#171513;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Cotización y pago</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${content}</table>${data.quoteComments ? `<p style="margin:15px 0 0;color:#5f5a54;font-size:13px;line-height:1.6">${esc(data.quoteComments)}</p>` : ""}</td></tr></table></td></tr>`;
}

function transferSummary(data: EmailTemplateInput) {
  if (!data.transferBank && !data.transferClabe && !data.transferAccount) return "";
  return `<tr><td class="email-pad" style="padding:16px 32px 0;background:#fff"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid #171513;background:#f3f0ea"><tr><td style="padding:18px 20px"><p style="margin:0 0 10px;color:#171513;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Datos para transferencia</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${row("Banco", data.transferBank)}${row("Beneficiario", data.transferBeneficiary)}${row("CLABE", data.transferClabe)}${row("Cuenta", data.transferAccount)}${row("Referencia", data.requestFolio)}</table>${data.paymentInstructions ? `<p style="margin:14px 0 0;color:#5f5a54;font-size:12px;line-height:1.55">${esc(data.paymentInstructions)}</p>` : ""}</td></tr></table></td></tr>`;
}

function notice(data: EmailTemplateInput) {
  const label = data.missingInformation ? "Información necesaria" : data.paymentReason ? "Motivo" : data.cancellationReason ? "Motivo de cancelación" : data.customMessage ? "Mensaje" : "";
  const message = data.missingInformation || data.paymentReason || data.cancellationReason || data.customMessage;
  if (!message) return "";
  return `<tr><td class="email-pad" style="padding:16px 32px 0;background:#fff"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ded9d1;border-radius:14px"><tr><td style="padding:18px 20px"><p style="margin:0 0 7px;color:#77716a;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase">${esc(label)}</p><p style="margin:0;color:#292622;font-size:14px;line-height:1.6">${esc(message)}</p></td></tr></table></td></tr>`;
}

function absolutePublicUrl(path: string) {
  const base = (process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

function absoluteLogoUrl() {
  return absolutePublicUrl(studioConfig.logo);
}

function mascotBanner(template: EmailTemplateName) {
  const mascot = MASCOT_BY_TEMPLATE[template];
  const src = absolutePublicUrl(`/email/status/${mascot.file}.jpg`);
  return `<tr><td align="center" style="padding:22px 32px 0;background:#fff"><img src="${esc(src)}" width="260" alt="${esc(mascot.alt)}" style="display:block;width:260px;max-width:100%;height:auto;border:0;border-radius:16px"></td></tr>`;
}

export function renderEmail(template: EmailTemplateName, data: EmailTemplateInput) {
  const base = CONFIG[template];
  const config = template === "CUSTOM" ? { ...base, subject: data.customSubject || base.subject, title: data.customSubject || base.title, message: data.customMessage || base.message } : base;
  const folio = data.requestFolio || data.appointmentFolio || "";
  const contact = [studioConfig.contact.email, studioConfig.contact.phone].filter(Boolean).join(" · ");
  const subject = `${config.subject}${folio ? ` · ${folio}` : ""}`;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${esc(subject)}</title><style>@media(max-width:620px){.email-shell{width:100%!important;border-radius:0!important}.email-pad{padding-left:20px!important;padding-right:20px!important}.email-title{font-size:30px!important}}</style></head><body style="margin:0;background:#eeeae3;color:#171513;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${esc(config.message)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eeeae3"><tr><td align="center" style="padding:30px 10px"><table class="email-shell" role="presentation" width="620" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;overflow:hidden;border:1px solid #d8d2c9;border-radius:18px;background:#fff;box-shadow:0 18px 50px rgba(25,20,16,.1)"><tr><td style="height:5px;background:${config.color};font-size:0">&nbsp;</td></tr><tr><td class="email-pad" style="padding:20px 32px;background:#111"><table role="presentation" width="100%"><tr><td width="48"><img src="${esc(absoluteLogoUrl())}" width="48" height="48" alt="${esc(studioConfig.name)}" style="display:block;width:48px;height:48px;border-radius:50%;object-fit:cover"></td><td style="padding-left:13px;color:#f4f0e8;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700">${esc(studioConfig.name)}</td><td align="right" style="color:#aaa49b;font-size:10px;font-weight:700;letter-spacing:.1em">${esc(folio)}</td></tr></table></td></tr>${mascotBanner(template)}<tr><td class="email-pad" style="padding:26px 32px;background:${config.soft};border-bottom:1px solid #e7e3dc"><span style="display:inline-block;padding:7px 11px;border-radius:999px;background:${config.color};color:#fff;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase">${esc(config.label)}</span><h1 class="email-title" style="margin:16px 0 10px;color:#171513;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:500;line-height:1.05">${esc(config.title)}</h1><p style="margin:0;color:#504b45;font-size:14px;line-height:1.65">Hola, <strong>${esc(data.clientName || "cliente")}</strong>. ${esc(config.message)}</p><p style="margin:14px 0 0;color:${config.color};font-size:12px;font-weight:800;line-height:1.5">${esc(config.nextStep)}</p>${renderProgress(config)}</td></tr>${notice(data)}${projectSummary(data)}${quoteSummary(data)}${transferSummary(data)}<tr><td class="email-pad" style="padding:25px 32px 30px;background:#fff"><p style="margin:0;color:#4f4a44;font-size:13px;line-height:1.65">Si necesitas aclarar algo, responde directamente a este correo.</p></td></tr><tr><td class="email-pad" align="center" style="padding:22px 32px;border-top:1px solid #e7e3dc;background:#f7f5f1"><p style="margin:0;color:#171513;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700">${esc(studioConfig.name)}</p><p style="margin:6px 0 0;color:#817b73;font-size:11px;line-height:1.55">${esc(contact || "Estudio de tatuajes")}${studioConfig.contact.address ? `<br>${esc(studioConfig.contact.address)}` : ""}</p><p style="margin:12px 0 0;color:#aaa39a;font-size:9px">Actualización automática de ${esc(folio || "tu proyecto")}.</p></td></tr></table></td></tr></table></body></html>`;
  return { subject, html };
}

export const emailTemplateCatalog = EMAIL_TEMPLATES.map((id) => ({ id, subject: CONFIG[id].subject }));
