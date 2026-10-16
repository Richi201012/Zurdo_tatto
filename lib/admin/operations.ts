import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, inArray, lt, ne, sql } from "drizzle-orm";
import { studioConfig } from "@/config/studio";
import { getDatabase } from "@/db";
import {
  appointmentHistory,
  appointments,
  auditLogs,
  internalNotes,
  payments,
  paymentTransactions,
  quotes,
  tattooRequests,
  timelineEvents,
} from "@/db/schema";
import type { AdminSession } from "@/lib/auth";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUSES,
  isRequestStatus,
  type AppointmentStatus,
  type RequestStatus,
} from "@/lib/booking/statuses";
import { expireUnpaidAppointments } from "@/lib/booking/expiration";
function actor(session: AdminSession) {
  return `${session.name} (${session.email})`;
}

export async function updateRequestState(
  input: { requestId: string; status: string; nextAction?: string },
  session: AdminSession,
) {
  if (!isRequestStatus(input.status))
    throw new Error("Estado de solicitud inválido.");
  const now = new Date().toISOString();
  return getDatabase().transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(tattooRequests)
      .where(eq(tattooRequests.id, input.requestId))
      .limit(1);
    if (!current) throw new Error("Solicitud no encontrada.");
    const [updated] = await tx
      .update(tattooRequests)
      .set({
        status: input.status,
        nextAction: input.nextAction ?? current.nextAction,
        lastInteractionAt: now,
        updatedAt: now,
      })
      .where(eq(tattooRequests.id, input.requestId))
      .returning();
    await tx
      .insert(timelineEvents)
      .values({
        clientId: current.clientId,
        requestId: current.id,
        type: "REQUEST_STATUS_CHANGED",
        title: `Estado: ${input.status}`,
        detail: input.nextAction ?? "",
        actor: actor(session),
        createdAt: now,
      });
    await tx
      .insert(auditLogs)
      .values({
        userEmail: session.email,
        action: "REQUEST_STATUS_CHANGED",
        entityType: "TattooRequest",
        entityId: current.id,
        metadata: { from: current.status, to: input.status },
        createdAt: now,
      });
    return updated;
  });
}

export async function addInternalNote(
  input: { requestId: string; content: string },
  session: AdminSession,
) {
  const content = input.content.trim();
  if (content.length < 2 || content.length > 2000)
    throw new Error("La nota debe tener entre 2 y 2000 caracteres.");
  const now = new Date().toISOString();
  return getDatabase().transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(tattooRequests)
      .where(eq(tattooRequests.id, input.requestId))
      .limit(1);
    if (!request) throw new Error("Solicitud no encontrada.");
    const [note] = await tx
      .insert(internalNotes)
      .values({
        requestId: request.id,
        clientId: request.clientId,
        content,
        author: actor(session),
        createdAt: now,
      })
      .returning();
    await tx
      .insert(timelineEvents)
      .values({
        requestId: request.id,
        clientId: request.clientId,
        type: "INTERNAL_NOTE_ADDED",
        title: "Nota interna agregada",
        detail: "Visible solamente para el equipo.",
        actor: actor(session),
        createdAt: now,
      });
    return note;
  });
}

export async function saveQuote(
  input: {
    requestId: string;
    minPriceCents: number;
    maxPriceCents: number;
    depositRequiredCents: number;
    estimatedMinutes: number;
    sessionCount: number;
    artistId?: string | null;
    comments?: string;
    send?: boolean;
  },
  session: AdminSession,
) {
  const now = new Date().toISOString();
  return getDatabase().transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(tattooRequests)
      .where(eq(tattooRequests.id, input.requestId))
      .limit(1);
    if (!request) throw new Error("Solicitud no encontrada.");
    const [requestAppointment] = await tx.select({ id: appointments.id }).from(appointments).where(eq(appointments.requestId, request.id)).limit(1);
    const [quote] = await tx
      .insert(quotes)
      .values({
        requestId: request.id,
        minPriceCents: input.minPriceCents,
        maxPriceCents: input.maxPriceCents,
        depositRequiredCents: input.depositRequiredCents,
        estimatedMinutes: input.estimatedMinutes,
        sessionCount: input.sessionCount,
        artistId: input.artistId || null,
        comments: input.comments ?? "",
        status: input.send ? "SENT" : "DRAFT",
        sentAt: input.send ? now : null,
        createdBy: actor(session),
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    const [existingPayment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.requestId, request.id))
      .orderBy(desc(payments.createdAt))
      .limit(1);
    if (existingPayment) {
      await tx
        .update(payments)
        .set({
          totalCents: input.maxPriceCents || input.minPriceCents,
          depositRequiredCents: input.depositRequiredCents,
          appointmentId: requestAppointment?.id ?? existingPayment.appointmentId,
          status: existingPayment.status === "PAID" ? "PAID" : "PENDING",
          dueAt: input.send ? new Date(Date.now() + studioConfig.booking.paymentWindowHours * 3600000).toISOString() : existingPayment.dueAt,
          updatedAt: now,
        })
        .where(eq(payments.id, existingPayment.id));
    } else {
      await tx
        .insert(payments)
        .values({
          requestId: request.id,
          appointmentId: requestAppointment?.id ?? null,
          clientId: request.clientId,
          totalCents: input.maxPriceCents || input.minPriceCents,
          depositRequiredCents: input.depositRequiredCents,
          status: "PENDING",
          dueAt: input.send ? new Date(Date.now() + studioConfig.booking.paymentWindowHours * 3600000).toISOString() : null,
          createdAt: now,
          updatedAt: now,
        });
    }
    const status: RequestStatus = input.send ? "WAITING_DEPOSIT" : "UNDER_REVIEW";
    await tx
      .update(tattooRequests)
      .set({
        status,
        artistId: input.artistId || request.artistId,
        nextAction: input.send
          ? "Validar anticipo"
          : "Finalizar y enviar cotización",
        lastInteractionAt: now,
        updatedAt: now,
      })
      .where(eq(tattooRequests.id, request.id));
    await tx
      .insert(timelineEvents)
      .values({
        requestId: request.id,
        clientId: request.clientId,
        type: input.send ? "QUOTE_SENT" : "QUOTE_SAVED",
        title: input.send ? "Cotización enviada" : "Cotización guardada",
        detail: `Anticipo requerido: ${input.depositRequiredCents / 100} MXN`,
        actor: actor(session),
        createdAt: now,
      });
    await tx
      .insert(auditLogs)
      .values({
        userEmail: session.email,
        action: input.send ? "QUOTE_SENT" : "QUOTE_SAVED",
        entityType: "Quote",
        entityId: quote.id,
        metadata: { requestId: request.id },
        createdAt: now,
      });
    return { quote, request };
  });
}

export async function scheduleRequestAppointment(
  input: { requestId: string; artistId: string; startAt: string; endAt: string },
  session: AdminSession,
) {
  if (new Date(input.endAt) <= new Date(input.startAt)) throw new Error("La fecha y duración no son válidas.");
  const now = new Date().toISOString();
  return getDatabase().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`artist:${input.artistId}`}))`);
    const [request] = await tx.select().from(tattooRequests).where(eq(tattooRequests.id, input.requestId)).limit(1);
    if (!request) throw new Error("Solicitud no encontrada.");
    const [current] = await tx.select().from(appointments).where(eq(appointments.requestId, request.id)).limit(1);
    const conflict = await tx.select({ id: appointments.id }).from(appointments).where(and(
      current ? ne(appointments.id, current.id) : sql`true`, eq(appointments.artistId, input.artistId),
      inArray(appointments.status, ["TENTATIVE", "CONFIRMED", "RESCHEDULED", "IN_PROGRESS"]), lt(appointments.startAt, input.endAt), gt(appointments.endAt, input.startAt),
    )).limit(1);
    if (conflict.length) throw new Error("Ese horario ya está ocupado. Elige otro.");
    let appointment;
    if (current) {
      [appointment] = await tx.update(appointments).set({ artistId: input.artistId, startAt: input.startAt, endAt: input.endAt, status: "TENTATIVE", updatedAt: now }).where(eq(appointments.id, current.id)).returning();
      await tx.insert(appointmentHistory).values({ appointmentId: current.id, previousStartAt: current.startAt, previousEndAt: current.endAt, newStartAt: input.startAt, newEndAt: input.endAt, action: "SCHEDULED_BY_STUDIO", reason: "Fecha y hora asignadas desde el backoffice.", changedBy: actor(session), createdAt: now });
    } else {
      const appointmentId = randomUUID(); const folio = `CIT-${new Date(now).getFullYear()}-${appointmentId.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
      [appointment] = await tx.insert(appointments).values({ id: appointmentId, folio, requestId: request.id, clientId: request.clientId, artistId: input.artistId, startAt: input.startAt, endAt: input.endAt, status: "TENTATIVE", summary: request.idea.slice(0, 180), location: studioConfig.contact.address, createdAt: now, updatedAt: now }).returning();
      await tx.insert(appointmentHistory).values({ appointmentId, newStartAt: input.startAt, newEndAt: input.endAt, action: "SCHEDULED_BY_STUDIO", reason: "Fecha y hora asignadas desde el backoffice.", changedBy: actor(session), createdAt: now });
    }
    await tx.update(payments).set({ appointmentId: appointment.id, updatedAt: now }).where(eq(payments.requestId, request.id));
    await tx.update(tattooRequests).set({ artistId: input.artistId, status: "UNDER_REVIEW", nextAction: "Preparar y enviar cotización", lastInteractionAt: now, updatedAt: now }).where(eq(tattooRequests.id, request.id));
    await tx.insert(timelineEvents).values({ clientId: request.clientId, requestId: request.id, appointmentId: appointment.id, type: "APPOINTMENT_SCHEDULED", title: "Horario asignado por el estudio", detail: `${input.startAt} — ${input.endAt}`, actor: actor(session), createdAt: now });
    await tx.insert(auditLogs).values({ userEmail: session.email, action: "APPOINTMENT_SCHEDULED", entityType: "Appointment", entityId: appointment.id, metadata: { startAt: input.startAt, endAt: input.endAt, artistId: input.artistId }, createdAt: now });
    return appointment;
  });
}

export async function confirmDeposit(
  input: {
    paymentId: string;
    amountCents: number;
    paymentMethod: string;
    externalReference?: string;
    notes?: string;
    idempotencyKey: string;
  },
  session: AdminSession,
) {
  await expireUnpaidAppointments();
  const now = new Date().toISOString();
  return getDatabase().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`payment:${input.paymentId}`}))`,
    );
    const [existingTransaction] = await tx
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (existingTransaction) return existingTransaction;
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, input.paymentId))
      .limit(1);
    if (!payment) throw new Error("Pago no encontrado.");
    if (payment.dueAt && new Date(payment.dueAt) <= new Date(now)) throw new Error("El plazo de 2 horas venció y el horario ya fue liberado.");
    const [transaction] = await tx
      .insert(paymentTransactions)
      .values({
        paymentId: payment.id,
        appointmentId: payment.appointmentId,
        requestId: payment.requestId,
        clientId: payment.clientId,
        type: "DEPOSIT",
        amountCents: input.amountCents,
        status: "PAID",
        paymentMethod: input.paymentMethod,
        externalReference: input.externalReference ?? "",
        notes: input.notes ?? "",
        idempotencyKey: input.idempotencyKey,
        confirmedAt: now,
        confirmedBy: actor(session),
        createdAt: now,
      })
      .returning();
    const paidCents = payment.paidCents + input.amountCents;
    await tx
      .update(payments)
      .set({
        paidCents,
        status: "PAID",
        paymentMethod: input.paymentMethod,
        externalReference: input.externalReference ?? payment.externalReference,
        confirmedAt: now,
        confirmedBy: actor(session),
        updatedAt: now,
      })
      .where(eq(payments.id, payment.id));
    if (payment.appointmentId)
      await tx
        .update(appointments)
        .set({ status: "CONFIRMED", updatedAt: now })
        .where(eq(appointments.id, payment.appointmentId));
    await tx
      .update(tattooRequests)
      .set({
        status: payment.appointmentId
          ? "APPOINTMENT_CONFIRMED"
          : "DEPOSIT_PAID",
        nextAction: payment.appointmentId
          ? "Preparar cita y recordatorio"
          : "Confirmar horario",
        lastInteractionAt: now,
        updatedAt: now,
      })
      .where(eq(tattooRequests.id, payment.requestId));
    await tx
      .insert(timelineEvents)
      .values({
        requestId: payment.requestId,
        clientId: payment.clientId,
        appointmentId: payment.appointmentId,
        type: "PAYMENT_CONFIRMED",
        title: "Anticipo confirmado",
        detail: `${input.amountCents / 100} MXN · ${input.paymentMethod}`,
        actor: actor(session),
        createdAt: now,
      });
    await tx
      .insert(auditLogs)
      .values({
        userEmail: session.email,
        action: "PAYMENT_CONFIRMED",
        entityType: "Payment",
        entityId: payment.id,
        metadata: {
          amountCents: input.amountCents,
          transactionId: transaction.id,
        },
        createdAt: now,
      });
    return transaction;
  });
}

export async function rejectDeposit(
  input: { paymentId: string; reason: string; idempotencyKey: string },
  session: AdminSession,
) {
  const now = new Date().toISOString();
  const reason = input.reason.trim();
  if (reason.length < 5) throw new Error("Indica por qué no se pudo validar el pago.");
  return getDatabase().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`payment:${input.paymentId}`}))`);
    const [existingTransaction] = await tx.select().from(paymentTransactions).where(eq(paymentTransactions.idempotencyKey, input.idempotencyKey)).limit(1);
    if (existingTransaction) return existingTransaction;
    const [payment] = await tx.select().from(payments).where(eq(payments.id, input.paymentId)).limit(1);
    if (!payment) throw new Error("Pago no encontrado.");
    const [transaction] = await tx.insert(paymentTransactions).values({
      paymentId: payment.id,
      appointmentId: payment.appointmentId,
      requestId: payment.requestId,
      clientId: payment.clientId,
      type: "DEPOSIT_VALIDATION",
      amountCents: 0,
      status: "FAILED",
      notes: reason,
      idempotencyKey: input.idempotencyKey,
      confirmedAt: now,
      confirmedBy: actor(session),
      createdAt: now,
    }).returning();
    await tx.update(payments).set({ status: "FAILED", confirmedAt: now, confirmedBy: actor(session), updatedAt: now }).where(eq(payments.id, payment.id));
    if (payment.appointmentId) {
      const [appointment] = await tx.select().from(appointments).where(eq(appointments.id, payment.appointmentId)).limit(1);
      if (appointment) {
        await tx.update(appointments).set({ status: "EXPIRED", updatedAt: now }).where(eq(appointments.id, appointment.id));
        await tx.insert(appointmentHistory).values({ appointmentId: appointment.id, previousStartAt: appointment.startAt, previousEndAt: appointment.endAt, action: "PAYMENT_REJECTED", reason, changedBy: actor(session), createdAt: now });
      }
    }
    await tx.update(tattooRequests).set({ status: "WAITING_AVAILABILITY_SELECTION", nextAction: "Horario liberado; asignar uno nuevo si el cliente continúa", lastInteractionAt: now, updatedAt: now }).where(eq(tattooRequests.id, payment.requestId));
    await tx.insert(timelineEvents).values({ requestId: payment.requestId, clientId: payment.clientId, appointmentId: payment.appointmentId, type: "PAYMENT_REJECTED", title: "Anticipo no validado · horario liberado", detail: reason, actor: actor(session), createdAt: now });
    await tx.insert(auditLogs).values({ userEmail: session.email, action: "PAYMENT_REJECTED", entityType: "Payment", entityId: payment.id, metadata: { reason, transactionId: transaction.id }, createdAt: now });
    return transaction;
  });
}

export async function setAppointmentStatus(
  input: { appointmentId: string; status: AppointmentStatus; reason?: string },
  session: AdminSession,
) {
  if (!APPOINTMENT_STATUSES.includes(input.status)) throw new Error("Estado de cita inválido.");
  const now = new Date().toISOString();
  return getDatabase().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`appointment:${input.appointmentId}`}))`);
    const [appointment] = await tx.select().from(appointments).where(eq(appointments.id, input.appointmentId)).limit(1);
    if (!appointment) throw new Error("Cita no encontrada.");
    const [payment] = await tx.select().from(payments).where(eq(payments.appointmentId, appointment.id)).orderBy(desc(payments.createdAt)).limit(1);
    if (input.status === "CONFIRMED" && payment?.status !== "PAID") throw new Error("La cita solo se confirma después de validar el anticipo.");
    const requestStatus: RequestStatus = ({
      TENTATIVE: "WAITING_DEPOSIT",
      CONFIRMED: "APPOINTMENT_CONFIRMED",
      IN_PROGRESS: "IN_PROGRESS",
      COMPLETED: "COMPLETED",
      RESCHEDULED: "RESCHEDULED",
      CANCELLED_BY_CLIENT: "CANCELLED_BY_CLIENT",
      CANCELLED_BY_STUDIO: "CANCELLED_BY_STUDIO",
      NO_SHOW: "NO_SHOW",
      EXPIRED: "WAITING_AVAILABILITY_SELECTION",
    } as const)[input.status];
    const [updated] = await tx.update(appointments).set({ status: input.status, updatedAt: now }).where(eq(appointments.id, appointment.id)).returning();
    await tx.update(tattooRequests).set({ status: requestStatus, nextAction: APPOINTMENT_STATUS_LABELS[input.status], lastInteractionAt: now, updatedAt: now }).where(eq(tattooRequests.id, appointment.requestId));
    await tx.insert(appointmentHistory).values({ appointmentId: appointment.id, previousStartAt: appointment.startAt, previousEndAt: appointment.endAt, action: "STATUS_CHANGED", reason: input.reason ?? "", changedBy: actor(session), createdAt: now });
    await tx.insert(timelineEvents).values({ requestId: appointment.requestId, clientId: appointment.clientId, appointmentId: appointment.id, type: "APPOINTMENT_STATUS_CHANGED", title: `Cita: ${APPOINTMENT_STATUS_LABELS[input.status]}`, detail: input.reason ?? "", actor: actor(session), createdAt: now });
    await tx.insert(auditLogs).values({ userEmail: session.email, action: "APPOINTMENT_STATUS_CHANGED", entityType: "Appointment", entityId: appointment.id, metadata: { from: appointment.status, to: input.status }, createdAt: now });
    return updated;
  });
}

export async function updateAppointment(
  input: {
    appointmentId: string;
    action:
      | "RESCHEDULE"
      | "CANCEL_CLIENT"
      | "CANCEL_STUDIO"
      | "COMPLETE"
      | "NO_SHOW";
    startAt?: string;
    endAt?: string;
    reason?: string;
    depositDisposition?: string;
  },
  session: AdminSession,
) {
  const now = new Date().toISOString();
  return getDatabase().transaction(async (tx) => {
    const [appointment] = await tx
      .select()
      .from(appointments)
      .where(eq(appointments.id, input.appointmentId))
      .limit(1);
    if (!appointment) throw new Error("Cita no encontrada.");
    let status = appointment.status;
    let requestStatus: RequestStatus = "APPOINTMENT_CONFIRMED";
    if (input.action === "RESCHEDULE") {
      if (
        !input.startAt ||
        !input.endAt ||
        new Date(input.endAt) <= new Date(input.startAt)
      )
        throw new Error("La nueva fecha no es válida.");
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`artist:${appointment.artistId}`}))`,
      );
      const conflict = await tx
        .select({ id: appointments.id })
        .from(appointments)
        .where(
          and(
            ne(appointments.id, appointment.id),
            eq(appointments.artistId, appointment.artistId),
            inArray(appointments.status, [
              "TENTATIVE",
              "CONFIRMED",
              "RESCHEDULED",
              "IN_PROGRESS",
            ]),
            lt(appointments.startAt, input.endAt),
            gt(appointments.endAt, input.startAt),
          ),
        )
        .limit(1);
      if (conflict.length)
        throw new Error("El tatuador ya tiene una cita en ese horario.");
      status = "RESCHEDULED";
      requestStatus = "RESCHEDULED";
      await tx
        .update(appointments)
        .set({
          startAt: input.startAt,
          endAt: input.endAt,
          status,
          updatedAt: now,
        })
        .where(eq(appointments.id, appointment.id));
    } else {
      const map = {
        CANCEL_CLIENT: ["CANCELLED_BY_CLIENT", "CANCELLED_BY_CLIENT"],
        CANCEL_STUDIO: ["CANCELLED_BY_STUDIO", "CANCELLED_BY_STUDIO"],
        COMPLETE: ["COMPLETED", "COMPLETED"],
        NO_SHOW: ["NO_SHOW", "NO_SHOW"],
      } as const;
      [status, requestStatus] = map[input.action];
      await tx
        .update(appointments)
        .set({ status, updatedAt: now })
        .where(eq(appointments.id, appointment.id));
    }
    await tx
      .update(tattooRequests)
      .set({
        status: requestStatus,
        nextAction:
          input.action === "COMPLETE"
            ? "Seguimiento y posible portafolio"
            : input.action === "RESCHEDULE"
              ? "Confirmar nueva fecha"
              : "Revisar cierre",
        lastInteractionAt: now,
        updatedAt: now,
      })
      .where(eq(tattooRequests.id, appointment.requestId));
    await tx
      .insert(appointmentHistory)
      .values({
        appointmentId: appointment.id,
        previousStartAt: appointment.startAt,
        previousEndAt: appointment.endAt,
        newStartAt: input.startAt ?? null,
        newEndAt: input.endAt ?? null,
        action: input.action,
        reason: input.reason ?? "",
        depositDisposition: input.depositDisposition ?? "NOT_APPLICABLE",
        changedBy: actor(session),
        createdAt: now,
      });
    await tx
      .insert(timelineEvents)
      .values({
        requestId: appointment.requestId,
        clientId: appointment.clientId,
        appointmentId: appointment.id,
        type: `APPOINTMENT_${input.action}`,
        title:
          input.action === "RESCHEDULE"
            ? "Cita reprogramada"
            : input.action === "COMPLETE"
              ? "Cita realizada"
              : input.action === "NO_SHOW"
                ? "Cliente no se presentó"
                : "Cita cancelada",
        detail: input.reason ?? "",
        actor: actor(session),
        createdAt: now,
      });
    await tx
      .insert(auditLogs)
      .values({
        userEmail: session.email,
        action: `APPOINTMENT_${input.action}`,
        entityType: "Appointment",
        entityId: appointment.id,
        metadata: {
          reason: input.reason,
          depositDisposition: input.depositDisposition,
        },
        createdAt: now,
      });
    return {
      ...appointment,
      status,
      startAt: input.startAt ?? appointment.startAt,
      endAt: input.endAt ?? appointment.endAt,
    };
  });
}
