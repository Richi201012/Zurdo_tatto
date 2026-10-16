import Link from "next/link";
import { AdminPageHeader, EmptyState } from "@/components/admin/AdminUi";
import { listAppointments } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth";
import { formatMoney, formatStudioDateTime, minutesBetween } from "@/lib/booking/format";
import { APPOINTMENT_STATUSES, APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from "@/lib/booking/statuses";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin(); const params = await searchParams; const status = typeof params.estado === "string" ? params.estado : undefined; const rows = await listAppointments({ status });
  return <div className="admin-workspace"><AdminPageHeader eyebrow="Agenda" title="Citas" description="Consulta sesiones próximas, realizadas, canceladas, reprogramadas y no shows." /><form className="ops-filters compact"><label><span>Estado</span><select name="estado" defaultValue={status ?? "ALL"}><option value="ALL">Todas</option>{APPOINTMENT_STATUSES.map((item) => <option value={item} key={item}>{APPOINTMENT_STATUS_LABELS[item]}</option>)}</select></label><button className="button button-secondary">Filtrar</button></form>{rows.length ? <div className="ops-table-scroll"><table className="ops-table"><thead><tr><th>Cita / cliente</th><th>Fecha y hora</th><th>Tatuador</th><th>Duración</th><th>Estado</th><th>Pago</th><th>Detalle</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.clientName}</strong><small>{row.folio}</small></td><td>{formatStudioDateTime(row.startAt)}</td><td>{row.artistName}</td><td>{minutesBetween(row.startAt, row.endAt)} min</td><td><span className={`ops-status ${row.status === "CONFIRMED" || row.status === "COMPLETED" ? "success" : row.status.startsWith("CANCELLED") || row.status === "NO_SHOW" ? "danger" : "warning"}`}>{APPOINTMENT_STATUS_LABELS[row.status as AppointmentStatus] ?? row.status}</span></td><td>{row.paymentStatus ?? "Sin registro"}<small>{formatMoney(row.paidCents ?? 0)} / {formatMoney(row.depositCents ?? 0)}</small></td><td><Link className="ops-row-button" href={`/admin/solicitudes/${row.requestId}`}>Abrir</Link></td></tr>)}</tbody></table></div> : <EmptyState title="No hay citas en esta vista" description="Las citas aparecerán cuando un cliente elija fecha y hora dentro del formulario público." href="/admin/solicitudes" action="Ver solicitudes" />}</div>;
}

