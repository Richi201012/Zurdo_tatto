import { NextResponse } from "next/server";
import { z } from "zod";
import { setAppointmentStatus } from "@/lib/admin/operations";
import { getRequestDetail } from "@/lib/admin/data";
import { authorizeMutation } from "@/lib/auth";
import { sendTransactionalEmail } from "@/lib/email/brevo";

const schema = z.object({ status: z.enum(["TENTATIVE", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED_BY_CLIENT", "CANCELLED_BY_STUDIO", "NO_SHOW"]), reason: z.string().trim().max(1000).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeMutation(request, ["ADMIN", "RECEPTION"]);
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Acción de cita inválida." }, { status: 400 });
  try {
    const appointment = await setAppointmentStatus({ appointmentId: (await params).id, ...parsed.data }, session);
    const detail = await getRequestDetail(appointment.requestId);
    if (detail) {
      const templates = { CONFIRMED: "APPOINTMENT_CONFIRMED", COMPLETED: "APPOINTMENT_COMPLETED", CANCELLED_BY_CLIENT: "CANCELLED_BY_CLIENT", CANCELLED_BY_STUDIO: "CANCELLED_BY_STUDIO", NO_SHOW: "NO_SHOW" } as const;
      const template = templates[parsed.data.status as keyof typeof templates];
      if (template) await sendTransactionalEmail({ recipient: detail.email, recipientName: detail.name, requestId: detail.id, clientId: detail.clientId, appointmentId: appointment.id, template, data: { clientName: detail.name, requestFolio: detail.folio, appointmentFolio: appointment.folio, idea: detail.idea, bodyPlacement: detail.bodyPlacement, approximateSize: detail.approximateSize, appointmentAt: appointment.startAt, artistName: detail.appointment?.artistName ?? undefined, cancellationReason: parsed.data.reason, paidCents: detail.payment?.paidCents, balanceCents: detail.payment ? Math.max(0, detail.payment.totalCents - detail.payment.paidCents) : undefined }, idempotencyKey: `${template.toLowerCase()}:${appointment.id}:${new Date().toISOString().slice(0, 16)}` });
    }
    return NextResponse.json({ appointment });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo actualizar la cita." }, { status: 409 }); }
}
