import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { emailLogs, timelineEvents } from "@/db/schema";
import { studioConfig } from "@/config/studio";
import { renderEmail, type EmailTemplateInput, type EmailTemplateName } from "./templates";

interface SendEmailOptions {
  recipient: string;
  recipientName?: string;
  template: EmailTemplateName;
  data: EmailTemplateInput;
  requestId?: string;
  clientId?: string;
  appointmentId?: string;
  idempotencyKey?: string;
}

async function deliverEmail(log: typeof emailLogs.$inferSelect, options: SendEmailOptions) {
  const rendered = renderEmail(options.template, options.data);
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || studioConfig.contact.email;
  const senderName = process.env.BREVO_SENDER_NAME || studioConfig.name;
  if (!apiKey || !senderEmail) {
    const [failed] = await getDatabase().update(emailLogs).set({ status: "FAILED", error: "Brevo no está configurado.", updatedAt: new Date().toISOString() }).where(eq(emailLogs.id, log.id)).returning();
    return failed;
  }
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ sender: { email: senderEmail, name: senderName }, to: [{ email: options.recipient, name: options.recipientName }], subject: rendered.subject, htmlContent: rendered.html, headers: { "X-Mailin-custom": JSON.stringify({ emailLogId: log.id }) } }) });
    const body = await response.json().catch(() => ({})) as { messageId?: string; message?: string };
    if (!response.ok) throw new Error(body.message || `Brevo respondió ${response.status}.`);
    const [sent] = await getDatabase().update(emailLogs).set({ status: "SENT", providerMessageId: body.messageId ?? null, error: "", sentAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).where(eq(emailLogs.id, log.id)).returning();
    if (options.requestId) await getDatabase().insert(timelineEvents).values({ clientId: options.clientId, requestId: options.requestId, appointmentId: options.appointmentId, type: "EMAIL_SENT", title: `Correo enviado: ${rendered.subject}`, detail: options.recipient, actor: "Sistema" });
    return sent;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido de Brevo.";
    const [failed] = await getDatabase().update(emailLogs).set({ status: "FAILED", error: message.slice(0, 1000), updatedAt: new Date().toISOString() }).where(eq(emailLogs.id, log.id)).returning();
    return failed;
  }
}

export async function sendTransactionalEmail(options: SendEmailOptions) {
  const rendered = renderEmail(options.template, options.data);
  const now = new Date().toISOString();
  if (options.idempotencyKey) {
    const [existing] = await getDatabase().select().from(emailLogs).where(eq(emailLogs.idempotencyKey, options.idempotencyKey)).limit(1);
    if (existing && ["QUEUED", "SENT", "DELIVERED"].includes(existing.status)) return existing;
  }
  const [log] = await getDatabase().insert(emailLogs).values({ clientId: options.clientId, requestId: options.requestId, appointmentId: options.appointmentId, recipient: options.recipient, template: options.template, subject: rendered.subject, status: "QUEUED", idempotencyKey: options.idempotencyKey, payload: options.data as Record<string, unknown>, attemptCount: 1, createdAt: now, updatedAt: now }).returning();
  return deliverEmail(log, options);
}

export async function retryEmailLog(id: string) {
  const [log] = await getDatabase().select().from(emailLogs).where(and(eq(emailLogs.id, id), eq(emailLogs.status, "FAILED"))).limit(1);
  if (!log || log.attemptCount >= 3) throw new Error("Este correo no puede reintentarse.");
  const [queued] = await getDatabase().update(emailLogs).set({ status: "QUEUED", error: "", attemptCount: log.attemptCount + 1, updatedAt: new Date().toISOString() }).where(eq(emailLogs.id, id)).returning();
  const data = log.payload as EmailTemplateInput;
  return deliverEmail(queued, { recipient: log.recipient, template: log.template as EmailTemplateName, data, requestId: log.requestId ?? undefined, clientId: log.clientId ?? undefined, appointmentId: log.appointmentId ?? undefined });
}
