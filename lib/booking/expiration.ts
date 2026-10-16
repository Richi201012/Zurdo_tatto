import { and, eq, inArray, isNotNull, lte, or } from "drizzle-orm";
import { getDatabase } from "@/db";
import { appointmentHistory, appointments, payments, tattooRequests, timelineEvents } from "@/db/schema";

export async function expireUnpaidAppointments(now = new Date()) {
  const db = getDatabase();
  const expired = await db.select({ paymentId: payments.id, paymentStatus: payments.status, requestId: payments.requestId, clientId: payments.clientId, appointmentId: appointments.id, appointmentStartAt: appointments.startAt, appointmentEndAt: appointments.endAt })
    .from(payments).innerJoin(appointments, eq(payments.appointmentId, appointments.id)).where(and(eq(appointments.status, "TENTATIVE"), or(eq(payments.status, "FAILED"), and(inArray(payments.status, ["PENDING", "REPORTED", "UNDER_REVIEW"]), isNotNull(payments.dueAt), lte(payments.dueAt, now.toISOString())))));
  for (const item of expired) {
    await db.transaction(async (tx) => {
      const changedAt = now.toISOString();
      const [updated] = await tx.update(appointments).set({ status: "EXPIRED", updatedAt: changedAt }).where(and(eq(appointments.id, item.appointmentId), eq(appointments.status, "TENTATIVE"))).returning({ id: appointments.id });
      if (!updated) return;
      await tx.update(payments).set({ status: "FAILED", updatedAt: changedAt }).where(eq(payments.id, item.paymentId));
      await tx.update(tattooRequests).set({ status: "WAITING_AVAILABILITY_SELECTION", nextAction: "Horario liberado por falta de anticipo", lastInteractionAt: changedAt, updatedAt: changedAt }).where(eq(tattooRequests.id, item.requestId));
      const rejection = item.paymentStatus === "FAILED";
      await tx.insert(appointmentHistory).values({ appointmentId: item.appointmentId, previousStartAt: item.appointmentStartAt, previousEndAt: item.appointmentEndAt, action: "EXPIRED", reason: rejection ? "El anticipo no fue validado y el horario se liberó." : "No se validó el anticipo dentro de las 2 horas posteriores a la cotización.", changedBy: "Sistema", createdAt: changedAt });
      await tx.insert(timelineEvents).values({ clientId: item.clientId, requestId: item.requestId, appointmentId: item.appointmentId, type: "APPOINTMENT_EXPIRED", title: "Horario liberado", detail: rejection ? "El pago no fue validado; la cita tentativa se retiró." : "El plazo de 2 horas para validar el anticipo terminó.", actor: "Sistema", createdAt: changedAt });
    });
  }
  return expired;
}
