import { AdminPageHeader } from "@/components/admin/AdminUi";
import { AvailabilityManager } from "@/components/admin/AvailabilityManager";
import { studioConfig } from "@/config/studio";
import { getAvailabilityData } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth";
import { getPublicBookingSlots } from "@/lib/booking/public-availability";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const session = await requireAdmin(); await getPublicBookingSlots(1); const data = await getAvailabilityData();
  return <div className="admin-workspace">
    <AdminPageHeader eyebrow="Agenda automática" title="Disponibilidad" description="Todos los días se ofrecen automáticamente. Un horario desaparece cuando existe una cita activa y vuelve a liberarse si el anticipo no se valida a tiempo." />
    <div className="availability-layout"><div>
      <section className="ops-panel"><div className="ops-panel-head"><div><p className="eyebrow">Disponibilidad permanente</p><h2>Agenda abierta todos los días</h2></div></div><div className="payment-summary"><div><span>Horario diario</span><strong>{studioConfig.booking.dailyStartTime} — {studioConfig.booking.dailyEndTime}</strong></div><div><span>Anticipación mínima</span><strong>{studioConfig.booking.minimumAdvanceMinutes / 60} horas</strong></div><div><span>Plazo de anticipo</span><strong>{studioConfig.booking.paymentWindowHours} horas</strong></div><div><span>Regla</span><strong>Solo citas y bloqueos</strong></div></div><p className="ops-help">No necesitas activar cada día. Las citas tentativas, confirmadas o en sesión bloquean su horario. Una cita tentativa vence dos horas después de enviar la cotización si el pago no fue validado.</p></section>
      <section className="ops-panel"><div className="ops-panel-head"><div><p className="eyebrow">Bloqueos manuales</p><h2>Excepciones próximas</h2></div></div>{data.exceptions.length ? <div className="availability-rule-list">{data.exceptions.map((item) => <article key={item.id}><div><strong>{item.artistName}</strong><span>{item.kind}</span></div><b>{item.date}</b><small>{item.reason}{item.startTime ? ` · ${item.startTime.slice(0, 5)}–${item.endTime?.slice(0, 5)}` : " · día completo"}</small></article>)}</div> : <p className="ops-help">No hay vacaciones ni bloqueos próximos; todos los días permanecen disponibles.</p>}</section>
    </div><AvailabilityManager artists={data.artists} isAdmin={session.role === "ADMIN"} /></div>
  </div>;
}
