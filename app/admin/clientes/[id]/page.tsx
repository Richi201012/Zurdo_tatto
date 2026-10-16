import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { RequestStatusBadge } from "@/components/admin/AdminUi";
import { getClientDetail } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth";
import { APPOINTMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS, type AppointmentStatus, type PaymentStatus } from "@/lib/booking/statuses";
import { formatMoney, formatStudioDateTime } from "@/lib/booking/format";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getClientDetail(id);
  if (!detail) notFound();
  const paidTotal = detail.payments.reduce((total, payment) => total + payment.paidCents, 0);
  return <div className="admin-workspace request-workspace">
    <Link className="ops-back" href="/admin/clientes"><ArrowLeft aria-hidden="true" />Volver a clientes</Link>
    <header className="request-hero"><div><div className="request-hero-meta"><span>Cliente desde {formatStudioDateTime(detail.client.createdAt)}</span></div><h1>{detail.client.name}</h1><p>{detail.requests.length} solicitud(es) · {detail.appointments.length} cita(s) · {formatMoney(paidTotal)} registrado</p></div><div className="request-contact"><a href={`mailto:${detail.client.email}`}><Mail aria-hidden="true" />{detail.client.email}</a><a href={`https://wa.me/${detail.client.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><Phone aria-hidden="true" />{detail.client.whatsapp}</a></div></header>
    <div className="request-layout"><div className="request-primary">
      <section className="ops-panel"><div className="ops-panel-head"><div><p className="eyebrow">Historial comercial</p><h2>Solicitudes</h2></div></div>{detail.requests.length ? <div className="ops-action-list">{detail.requests.map((request) => <Link href={`/admin/solicitudes/${request.id}`} key={request.id}><span className="ops-action-marker" aria-hidden="true" /><span><strong>{request.idea}</strong><small>{request.folio} · {request.style || "Estilo por definir"} · {formatStudioDateTime(request.createdAt)}</small></span><RequestStatusBadge status={request.status} /></Link>)}</div> : <p className="ops-help">No hay solicitudes registradas.</p>}</section>
      <section className="ops-panel"><div className="ops-panel-head"><div><p className="eyebrow">Agenda</p><h2>Citas</h2></div></div>{detail.appointments.length ? <div className="ops-table-scroll"><table className="ops-table"><thead><tr><th>Folio</th><th>Fecha</th><th>Tatuador</th><th>Estado</th><th /></tr></thead><tbody>{detail.appointments.map((appointment) => <tr key={appointment.id}><td>{appointment.folio}</td><td>{formatStudioDateTime(appointment.startAt)}</td><td>{appointment.artistName}</td><td><span className={`ops-status ${appointment.status === "CONFIRMED" || appointment.status === "COMPLETED" ? "success" : appointment.status.startsWith("CANCELLED") || appointment.status === "NO_SHOW" ? "danger" : "warning"}`}>{APPOINTMENT_STATUS_LABELS[appointment.status as AppointmentStatus] ?? appointment.status}</span></td><td><Link className="ops-row-button" href={`/admin/solicitudes/${appointment.requestId}`}>Abrir</Link></td></tr>)}</tbody></table></div> : <p className="ops-help">No hay citas registradas.</p>}</section>
      <section className="ops-panel"><div className="ops-panel-head"><div><p className="eyebrow">Actividad</p><h2>Timeline del cliente</h2></div></div>{detail.events.length ? <ol className="timeline">{detail.events.map((event) => <li key={event.id}><span aria-hidden="true" /><div><time>{formatStudioDateTime(event.createdAt)}</time><strong>{event.title}</strong>{event.detail && <p>{event.detail}</p>}<small>{event.actor}</small></div></li>)}</ol> : <p className="ops-help">Todavía no hay eventos registrados.</p>}</section>
    </div><aside className="request-sidebar"><section className="ops-panel"><div className="ops-panel-head"><div><p className="eyebrow">Finanzas</p><h2>Pagos</h2></div></div>{detail.payments.length ? <div className="note-list">{detail.payments.map((payment) => <article key={payment.id}><div className="ops-panel-head"><strong>{formatMoney(payment.paidCents)} de {formatMoney(payment.depositRequiredCents)}</strong><span className={`ops-status ${payment.status === "PAID" ? "success" : payment.status === "FAILED" ? "danger" : "warning"}`}>{PAYMENT_STATUS_LABELS[payment.status as PaymentStatus] ?? payment.status}</span></div><small>{payment.paymentMethod || "Método pendiente"} · {formatStudioDateTime(payment.updatedAt)}</small></article>)}</div> : <p className="ops-help">No hay pagos registrados.</p>}</section></aside></div>
  </div>;
}
