"use client";

import { CheckCircle2, FileText, LoaderCircle, MailCheck, RotateCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";

interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  template: string;
  status: string;
  error: string;
  createdAt: string;
}

const flow = [
  { icon: FileText, title: "Solicitud recibida", text: "Se confirma automáticamente que la idea llegó al estudio." },
  { icon: MailCheck, title: "Cotización enviada", text: "Al enviar la propuesta, el cliente recibe precio, fecha, anticipo y datos bancarios." },
  { icon: ShieldCheck, title: "Anticipo revisado", text: "Al aprobar o rechazar el pago se envía el resultado automáticamente." },
  { icon: CheckCircle2, title: "Cita actualizada", text: "Confirmaciones, cambios y cancelaciones notifican al cliente según el estado." },
];

export function NotificationHistory({ logs }: { logs: EmailLog[] }) {
  const [busy, setBusy] = useState("");
  const [feedback, setFeedback] = useState("");

  async function retry(id: string) {
    setBusy(id);
    setFeedback("");
    const response = await fetch(`/api/admin/email/retry/${id}`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    setBusy("");
    setFeedback(response.ok ? "El correo se procesó nuevamente." : body.error ?? "No se pudo reintentar el envío.");
  }

  return (
    <div className="notification-page-layout">
      <section className="ops-panel">
        <div className="ops-panel-head"><div><p className="eyebrow">Flujo automático</p><h2>Un cambio, un correo claro</h2></div><MailCheck aria-hidden="true" /></div>
        <p className="ops-help">No necesitas elegir plantillas ni redactar mensajes. El sistema informa al cliente cuando realizas una acción importante en su solicitud.</p>
        <ol className="notification-flow">
          {flow.map(({ icon: Icon, title, text }, index) => <li key={title}><span>{index + 1}</span><Icon aria-hidden="true" /><div><strong>{title}</strong><p>{text}</p></div></li>)}
        </ol>
      </section>

      <section className="ops-panel">
        <div className="ops-panel-head"><div><p className="eyebrow">Registro de envíos</p><h2>Notificaciones recientes</h2></div></div>
        {feedback && <div className="ops-feedback" role="status">{feedback}</div>}
        {logs.length ? <div className="ops-table-scroll"><table className="ops-table"><thead><tr><th>Cliente</th><th>Mensaje</th><th>Estado</th><th>Fecha</th><th /></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td>{log.recipient}</td><td><strong>{log.subject}</strong><small>{friendlyTemplate(log.template)}</small></td><td><span className={`ops-status ${["SENT", "DELIVERED"].includes(log.status) ? "success" : ["FAILED", "BOUNCED", "BLOCKED"].includes(log.status) ? "danger" : "warning"}`}>{friendlyStatus(log.status)}</span>{log.error && <small className="field-error">{log.error}</small>}</td><td>{new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short" }).format(new Date(log.createdAt))}</td><td>{log.status === "FAILED" && <button className="ops-row-button" type="button" disabled={Boolean(busy)} onClick={() => retry(log.id)}>{busy === log.id ? <LoaderCircle className="spin" aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}Reintentar</button>}</td></tr>)}</tbody></table></div> : <p className="ops-help">Todavía no se han enviado notificaciones.</p>}
      </section>
    </div>
  );
}

function friendlyStatus(status: string) {
  return ({ QUEUED: "En proceso", SENT: "Enviado", DELIVERED: "Entregado", FAILED: "Falló", BOUNCED: "Rebotado", BLOCKED: "Bloqueado", SPAM: "Spam" } as Record<string, string>)[status] ?? status;
}

function friendlyTemplate(template: string) {
  return ({ REQUEST_RECEIVED: "Solicitud recibida", QUOTE: "Cotización", PAYMENT_REJECTED: "Pago no validado", APPOINTMENT_CONFIRMED: "Cita confirmada", APPOINTMENT_REMINDER: "Recordatorio", APPOINTMENT_RESCHEDULED: "Cita reprogramada", CANCELLED_BY_CLIENT: "Cancelación", CANCELLED_BY_STUDIO: "Cancelación", APPOINTMENT_COMPLETED: "Sesión realizada", NO_SHOW: "Cita no realizada" } as Record<string, string>)[template] ?? "Actualización del proyecto";
}
