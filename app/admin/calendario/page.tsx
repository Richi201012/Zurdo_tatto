import { Ban, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader, EmptyState } from "@/components/admin/AdminUi";
import { getAdminCalendarData } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth";
import { formatStudioTime } from "@/lib/booking/format";

export const dynamic = "force-dynamic";

const zoneOffset = "-06:00";
const dayKey = (value: string | Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date(value));
function isoDate(date: Date) { return date.toISOString().slice(0, 10); }
function localStart(day: string) { return new Date(`${day}T00:00:00${zoneOffset}`); }
function addDays(date: Date, days: number) { const next = new Date(date); next.setUTCDate(next.getUTCDate() + days); return next; }

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const view = typeof params.vista === "string" && ["dia", "semana", "mes"].includes(params.vista) ? params.vista : "semana";
  const dateValue = typeof params.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.fecha) ? params.fecha : dayKey(new Date());
  const selected = localStart(dateValue);
  let start = selected; let end = addDays(selected, 1); let columns = 1;
  if (view === "semana") { const weekday = (selected.getUTCDay() + 6) % 7; start = addDays(selected, -weekday); end = addDays(start, 7); columns = 7; }
  if (view === "mes") { start = new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1, 6)); const gridOffset = (start.getUTCDay() + 6) % 7; start = addDays(start, -gridOffset); end = addDays(start, 42); columns = 7; }
  const data = await getAdminCalendarData(start.toISOString(), end.toISOString());
  const days = Array.from({ length: Math.round((end.getTime() - start.getTime()) / 86400000) }, (_, index) => addDays(start, index));
  const step = view === "dia" ? 1 : view === "semana" ? 7 : 28;
  return <div className="admin-workspace"><AdminPageHeader eyebrow="Agenda visual" title="Calendario" description="Disponibilidad base, apartados temporales, bloqueos y citas en la zona America/Mexico_City." />
    <div className="admin-calendar-legend"><span><i className="workday" />Horario disponible</span><span><i className="held" />Horario apartado</span><span><i className="confirmed" />Cita confirmada</span><span><i className="blocked" />Bloqueo o descanso</span></div>
    <div className="calendar-toolbar"><div className="calendar-views">{[["dia", "Día"], ["semana", "Semana"], ["mes", "Mes"]].map(([value, label]) => <Link className={view === value ? "active" : ""} href={`/admin/calendario?vista=${value}&fecha=${dateValue}`} key={value}>{label}</Link>)}</div><div className="calendar-pager"><Link aria-label="Periodo anterior" href={`/admin/calendario?vista=${view}&fecha=${isoDate(addDays(selected, -step))}`}><ChevronLeft aria-hidden="true" /></Link><strong>{new Intl.DateTimeFormat("es-MX", { dateStyle: view === "mes" ? "long" : "medium", timeZone: "America/Mexico_City" }).format(selected)}</strong><Link aria-label="Periodo siguiente" href={`/admin/calendario?vista=${view}&fecha=${isoDate(addDays(selected, step))}`}><ChevronRight aria-hidden="true" /></Link></div></div>
    <div className={`calendar-grid view-${view}`} style={{ "--calendar-columns": columns } as React.CSSProperties}>{days.map((day) => {
      const key = isoDate(day);
      const weekday = day.getUTCDay();
      const appointments = data.appointments.filter((row) => dayKey(row.startAt) === key);
      const offers = data.heldOffers.filter((row) => dayKey(row.startAt) === key);
      const exceptions = data.exceptions.filter((row) => row.date === key);
      const rules = data.rules.filter((row) => row.weekday === weekday);
      const isBlocked = exceptions.some((item) => !item.startTime || ["BLOCKED", "VACATION", "PERSONAL"].includes(item.kind));
      const available = rules.length > 0 && !isBlocked;
      return <section className={`${key === dateValue ? "calendar-day selected" : "calendar-day"}${available ? " is-workday" : " is-unavailable"}`} key={key}><header><span>{new Intl.DateTimeFormat("es-MX", { weekday: "short", timeZone: "America/Mexico_City" }).format(day)}</span><strong>{day.getUTCDate()}</strong></header><div className="calendar-day-status">{available ? <><Clock3 aria-hidden="true" /><span>{rules.map((rule) => `${rule.artistName} ${rule.startTime.slice(0, 5)}–${rule.endTime.slice(0, 5)}`).join(" · ")}</span></> : <><Ban aria-hidden="true" /><span>No disponible</span></>}</div><div>
        {exceptions.map((item) => <article className="calendar-event calendar-block" key={item.id}><time>{item.startTime ? `${item.startTime.slice(0, 5)}–${item.endTime?.slice(0, 5)}` : "Todo el día"}</time><strong>{item.reason || item.kind}</strong><span>{item.artistName}</span></article>)}
        {offers.map((offer) => <Link className="calendar-event calendar-held" href={`/admin/solicitudes/${offer.requestId}`} key={offer.id}><time>{formatStudioTime(offer.startAt)}</time><strong>Apartado · {offer.clientName}</strong><span>{offer.artistName}</span></Link>)}
        {appointments.map((appointment) => <Link className={`calendar-event status-${appointment.status.toLowerCase()}`} href={`/admin/solicitudes/${appointment.requestId}`} key={appointment.id}><time>{formatStudioTime(appointment.startAt)}</time><strong>{appointment.clientName}</strong><span>{appointment.artistName} · {appointment.status === "TENTATIVE" ? "Pendiente de anticipo" : appointment.status}</span></Link>)}
        {appointments.length === 0 && offers.length === 0 && exceptions.length === 0 && view === "dia" && <EmptyState title={available ? "Horario disponible" : "Día no disponible"} description={available ? "No hay citas ni apartados para este día." : "Configura una regla o excepción desde Disponibilidad."} />}
      </div></section>;
    })}</div>
  </div>;
}
