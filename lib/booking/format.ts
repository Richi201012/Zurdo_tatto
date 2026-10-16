const TIME_ZONE = process.env.STUDIO_TIMEZONE || "America/Mexico_City";

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(cents / 100);
}

export function formatStudioDate(value: string | Date, options: Intl.DateTimeFormatOptions = {}) {
  const dateOptions: Intl.DateTimeFormatOptions = Object.keys(options).length ? options : { dateStyle: "medium" };
  return new Intl.DateTimeFormat("es-MX", { timeZone: TIME_ZONE, ...dateOptions }).format(new Date(value));
}

export function formatStudioDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("es-MX", { timeZone: TIME_ZONE, dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function formatStudioTime(value: string | Date) {
  return new Intl.DateTimeFormat("es-MX", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function formatTattooSize(value?: string | null) {
  const size = value?.trim() ?? "";
  if (!size) return "";
  if (/\b(?:cm|mm|m|pulgadas?|in(?:ch(?:es)?)?)\b/i.test(size)) return size;
  if (/^\d+(?:[.,]\d+)?(?:\s*[x×]\s*\d+(?:[.,]\d+)?)?$/.test(size)) return `${size} cm`;
  return size;
}

export function minutesBetween(start: string | Date, end: string | Date) {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

export const studioTimeZone = TIME_ZONE;

