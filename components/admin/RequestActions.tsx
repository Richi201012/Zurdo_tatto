"use client";

import { CalendarCheck2, CircleDollarSign, FileText, LoaderCircle, Send, ShieldCheck, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from "@/lib/booking/statuses";
import { formatStudioDateTime } from "@/lib/booking/format";

interface Artist { id: string; name: string }
type Quote = { minPriceCents: number; maxPriceCents: number; depositRequiredCents: number; estimatedMinutes: number; sessionCount: number; artistId: string | null; comments: string } | null;
type Payment = { id: string; depositRequiredCents: number; paidCents: number; status: string; dueAt: string | null } | null;
type Appointment = { id: string; artistId: string; startAt: string; endAt: string; status: AppointmentStatus } | null;
const editableStatuses: AppointmentStatus[] = ["TENTATIVE", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED_BY_CLIENT", "CANCELLED_BY_STUDIO", "NO_SHOW"];

async function jsonRequest(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "No se pudo completar la acción.");
  return body;
}

export function RequestActions({ requestId, preferredDay, quote, payment, appointment, artists }: { requestId: string; preferredDay: string; quote: Quote; payment: Payment; appointment: Appointment; artists: Artist[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const paymentExpired = Boolean(payment?.dueAt && new Date(payment.dueAt) <= new Date() && payment.status !== "PAID");
  const appointmentDate = appointment ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(appointment.startAt)) : preferredDay;
  const appointmentTime = appointment ? new Intl.DateTimeFormat("en-GB", { timeZone: "America/Mexico_City", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(appointment.startAt)) : "11:00";
  const appointmentDuration = appointment ? Math.round((new Date(appointment.endAt).getTime() - new Date(appointment.startAt).getTime()) / 60000) : quote?.estimatedMinutes ?? 120;
  async function run(key: string, task: () => Promise<unknown>, success: string) { setBusy(key); setMessage(""); setError(""); try { await task(); setMessage(success); router.refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Ocurrió un error."); } finally { setBusy(""); } }
  function quotePayload(form: FormData) { const pesos = (name: string) => Math.round(Number(form.get(name) || 0) * 100); return { estimatedPriceCents: pesos("estimatedPrice"), depositRequiredCents: pesos("deposit"), estimatedMinutes: Number(form.get("estimatedMinutes")), sessionCount: Number(form.get("sessionCount")), comments: String(form.get("comments") || ""), send: true }; }

  return <div className="request-actions-stack">
    {(message || error) && <div className={error ? "ops-feedback error" : "ops-feedback success"} role={error ? "alert" : "status"}>{error || message}</div>}
    <section className="ops-panel">
      <div className="ops-panel-head"><div><p className="eyebrow">Agenda del estudio</p><h2>Fecha y hora de la cita</h2></div><CalendarCheck2 aria-hidden="true" /></div>
      <p className="ops-help">El cliente indicó como preferencia: <strong>{preferredDay || "sin fecha"}</strong>. El tatuador define aquí la hora definitiva.</p>
      <form className="ops-form-grid" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); run("schedule", () => jsonRequest("/api/admin/appointments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ requestId, artistId: form.get("artistId"), date: form.get("date"), time: form.get("time"), durationMinutes: Number(form.get("durationMinutes")) }) }), appointment ? "Horario de la cita actualizado." : "Horario asignado por el tatuador."); }}>
        <label><span>Tatuador</span><select name="artistId" defaultValue={appointment?.artistId ?? quote?.artistId ?? artists[0]?.id ?? ""} required>{artists.map((artist) => <option value={artist.id} key={artist.id}>{artist.name}</option>)}</select></label>
        <label><span>Fecha</span><input name="date" type="date" defaultValue={appointmentDate} required /></label>
        <label><span>Hora</span><input name="time" type="time" defaultValue={appointmentTime} required /></label>
        <label><span>Duración (min)</span><input name="durationMinutes" type="number" step="any" defaultValue={appointmentDuration} required /></label>
        <button className="button button-primary span-2" disabled={Boolean(busy) || !artists.length}>{busy === "schedule" && <LoaderCircle className="spin" aria-hidden="true" />}{appointment ? "Actualizar fecha y hora" : "Asignar fecha y hora"}</button>
      </form>
      {appointment && <form className="ops-form-grid appointment-status-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); run("appointment", () => jsonRequest(`/api/admin/appointments/${appointment.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: form.get("status"), reason: form.get("reason") }) }), "Estado actualizado. Si corresponde, el cliente fue notificado automáticamente."); }}>
        <label className="span-2"><span>Estado de la cita</span><select name="status" defaultValue={appointment.status}>{editableStatuses.map((status) => <option value={status} key={status}>{APPOINTMENT_STATUS_LABELS[status]}</option>)}</select></label>
        <label className="span-2"><span>Motivo o nota para el cliente</span><textarea name="reason" placeholder="Solo es necesario para cambios, cancelaciones o aclaraciones." /></label>
        <p className="ops-help span-2">Al guardar un estado que afecta al cliente, el sistema envía automáticamente el correo correspondiente. La cita solo puede confirmarse después de validar el anticipo.</p>
        <button className="button button-secondary span-2" disabled={Boolean(busy)}>{busy === "appointment" && <LoaderCircle className="spin" aria-hidden="true" />}Actualizar estado y notificar</button>
      </form>}
    </section>

    <section className="ops-panel">
      <div className="ops-panel-head"><div><p className="eyebrow">Cotización</p><h2>Propuesta para el cliente</h2></div><FileText aria-hidden="true" /></div>
      <p className="ops-help">El correo incluirá idea, zona, tamaño, fecha, tatuador, precio, sesiones, duración, anticipo e instrucciones de pago.</p>
      <form className="ops-form-grid" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); run("quote", () => jsonRequest(`/api/admin/requests/${requestId}/quote`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(quotePayload(form)) }), "Estado actualizado a espera de anticipo y cliente notificado."); }}>
        <label><span>Precio estimado (MXN)</span><input name="estimatedPrice" type="number" step="any" defaultValue={(quote?.maxPriceCents || quote?.minPriceCents || 0) / 100} required /></label>
        <label><span>Anticipo requerido (MXN)</span><input name="deposit" type="number" step="any" defaultValue={(quote?.depositRequiredCents ?? 0) / 100} required /></label>
        <label><span>Duración estimada (min)</span><input name="estimatedMinutes" type="number" step="any" defaultValue={quote?.estimatedMinutes ?? 120} required /></label>
        <label><span>Número de sesiones</span><input name="sessionCount" type="number" step="any" defaultValue={quote?.sessionCount ?? 1} required /></label>
        <label className="span-2"><span>Notas para el cliente</span><textarea name="comments" defaultValue={quote?.comments ?? ""} placeholder="Alcance de la pieza, consideraciones del diseño o la sesión." /></label>
        <button className="button button-primary span-2" disabled={Boolean(busy)}>{busy === "quote" ? <LoaderCircle className="spin" aria-hidden="true" /> : <Send aria-hidden="true" />}Guardar cotización y notificar</button>
      </form>
    </section>

    {payment && payment.status !== "FAILED" && <section className="ops-panel">
      <div className="ops-panel-head"><div><p className="eyebrow">Anticipo</p><h2>Validar pago</h2></div><CircleDollarSign aria-hidden="true" /></div>
      <p className="ops-help">{payment?.dueAt ? `Plazo: ${formatStudioDateTime(payment.dueAt)}. ` : ""}Aprueba el pago para confirmar la cita o recházalo para mantenerla tentativa.</p>
      {paymentExpired && <div className="ops-feedback error">El plazo venció. El horario fue liberado y este pago ya no puede confirmar la cita.</div>}
      <form className="ops-form-grid" onSubmit={(event) => { event.preventDefault(); if (!window.confirm("¿El pago coincide y puede confirmarse la cita?")) return; const form = new FormData(event.currentTarget); run("approve", () => jsonRequest(`/api/admin/payments/${payment.id}/confirm`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision: "APPROVE", amountCents: Math.round(Number(form.get("amount")) * 100), paymentMethod: form.get("method"), externalReference: form.get("reference"), notes: form.get("notes"), idempotencyKey: `approve-${payment.id}-${form.get("reference") || Date.now()}` }) }), "Pago validado, cita confirmada y correo enviado."); }}>
        <label><span>Monto recibido (MXN)</span><input name="amount" type="number" step="any" defaultValue={Math.max(0, payment.depositRequiredCents - payment.paidCents) / 100} required /></label>
        <label><span>Método</span><select name="method" required><option value="Transferencia">Transferencia</option><option value="Efectivo">Efectivo</option><option value="Tarjeta">Tarjeta</option><option value="Otro">Otro</option></select></label>
        <label><span>Referencia</span><input name="reference" /></label><label><span>Notas internas</span><input name="notes" /></label>
        <button className="button button-primary span-2" disabled={Boolean(busy) || payment.status === "PAID" || paymentExpired}>{busy === "approve" ? <LoaderCircle className="spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}{payment.status === "PAID" ? "Pago validado · cita confirmada" : paymentExpired ? "Plazo vencido" : "Validar pago y confirmar cita"}</button>
      </form>
      {payment.status !== "PAID" && <div className="ops-form-grid payment-rejection"><label className="span-2"><span>Motivo si no se valida</span><textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Ej. El importe no coincide o no fue posible localizar la transferencia." /></label><button type="button" className="button button-secondary span-2" disabled={Boolean(busy) || rejectionReason.trim().length < 5} onClick={() => run("reject", () => jsonRequest(`/api/admin/payments/${payment.id}/confirm`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision: "REJECT", reason: rejectionReason, idempotencyKey: `reject-${payment.id}-${Date.now()}` }) }), "Pago no validado; se avisó al cliente y el horario quedó liberado.")}>{busy === "reject" ? <LoaderCircle className="spin" aria-hidden="true" /> : <XCircle aria-hidden="true" />}No validar pago</button></div>}
    </section>}
  </div>;
}
