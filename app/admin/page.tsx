import { AlertTriangle, CalendarCheck, CalendarClock, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, Inbox, RefreshCcw, UserRoundX } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader, EmptyState, RequestStatusBadge } from "@/components/admin/AdminUi";
import { getDashboardData } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth";
import { formatMoney, formatStudioDateTime, minutesBetween } from "@/lib/booking/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const { metrics, upcoming, pendingActions } = await getDashboardData();
  const cards = [
    ["Solicitudes nuevas", metrics.newRequests, Inbox, "/admin/solicitudes?estado=NEW_REQUEST", "info"],
    ["Esperando cotización", metrics.waitingQuote, Clock3, "/admin/solicitudes?estado=UNDER_REVIEW", "warning"],
    ["Esperando anticipo", metrics.waitingDeposit, CircleDollarSign, "/admin/pagos?estado=PENDING", "warning"],
    ["Anticipos pagados", metrics.depositsPaid, CheckCircle2, "/admin/pagos?estado=PAID", "success"],
    ["Citas confirmadas", metrics.confirmedAppointments, CalendarCheck, "/admin/citas?estado=CONFIRMED", "success"],
    ["Citas de hoy", metrics.todayAppointments, CalendarDays, "/admin/calendario?vista=dia", "info"],
    ["Citas próximas", metrics.upcomingAppointments, CalendarClock, "/admin/citas", "neutral"],
    ["Reprogramaciones", metrics.pendingReschedules, RefreshCcw, "/admin/solicitudes?estado=RESCHEDULE_REQUESTED", "warning"],
    ["Cancelaciones", metrics.cancellations, AlertTriangle, "/admin/citas?estado=canceladas", "danger"],
    ["Sin respuesta", metrics.unanswered, UserRoundX, "/admin/solicitudes?filtro=sin-respuesta", "danger"],
  ] as const;
  return <div className="admin-workspace"><AdminPageHeader eyebrow="Hoy en el estudio" title="Centro de operaciones" description="Lo importante primero: solicitudes que requieren respuesta, pagos por validar y las próximas sesiones." />
    <section className="ops-metric-grid" aria-label="Resumen operativo">{cards.map(([label, value, Icon, href, tone]) => <Link href={href} className={`ops-metric ${tone}`} key={label}><span><Icon aria-hidden="true" />{label}</span><strong>{value}</strong></Link>)}</section>
    <div className="ops-dashboard-grid"><section className="ops-panel ops-upcoming"><div className="ops-panel-head"><div><p className="eyebrow">Agenda</p><h2>Próximas citas</h2></div><Link href="/admin/calendario">Abrir calendario</Link></div>{upcoming.length ? <div className="ops-table-scroll"><table className="ops-table"><thead><tr><th>Cliente</th><th>Fecha</th><th>Tatuador</th><th>Sesión</th><th>Anticipo</th><th>Saldo</th></tr></thead><tbody>{upcoming.map((item) => <tr key={item.id}><td><strong>{item.clientName}</strong><small>{item.folio}</small></td><td>{formatStudioDateTime(item.startAt)}</td><td>{item.artistName}</td><td>{minutesBetween(item.startAt, item.endAt)} min</td><td>{formatMoney(item.paidCents)} / {formatMoney(item.depositCents)}</td><td>{formatMoney(item.balanceCents)}</td></tr>)}</tbody></table></div> : <EmptyState title="No tienes citas próximas" description="Cuando un cliente elija horario y confirme su anticipo, la cita aparecerá aquí." />}</section>
      <section className="ops-panel"><div className="ops-panel-head"><div><p className="eyebrow">Seguimiento</p><h2>Acciones pendientes</h2></div><Link href="/admin/solicitudes">Ver todas</Link></div>{pendingActions.length ? <div className="ops-action-list">{pendingActions.map((item) => <Link href={`/admin/solicitudes/${item.id}`} key={item.id}><span className="ops-action-marker" aria-hidden="true" /><span><strong>{item.nextAction}</strong><small>{item.clientName} · {item.folio}</small></span><RequestStatusBadge status={item.status} /></Link>)}</div> : <EmptyState title="Todo al día" description="No hay solicitudes con acciones pendientes en este momento." />}</section>
    </div>
  </div>;
}
