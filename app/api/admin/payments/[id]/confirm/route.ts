import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmDeposit, rejectDeposit } from "@/lib/admin/operations";
import { getRequestDetail } from "@/lib/admin/data";
import { authorizeMutation } from "@/lib/auth";
import { sendTransactionalEmail } from "@/lib/email/brevo";

const schema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("APPROVE"), amountCents: z.number().int().positive(), paymentMethod: z.string().trim().min(2).max(80), externalReference: z.string().trim().max(160).optional(), notes: z.string().trim().max(1000).optional(), idempotencyKey: z.string().min(8).max(120).optional() }),
  z.object({ decision: z.literal("REJECT"), reason: z.string().trim().min(5).max(1000), idempotencyKey: z.string().min(8).max(120).optional() }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeMutation(request, ["ADMIN", "RECEPTION"]);
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos del pago." }, { status: 400 });
  try {
    const paymentId = (await params).id;
    const transaction = parsed.data.decision === "APPROVE"
      ? await confirmDeposit({ paymentId, amountCents: parsed.data.amountCents, paymentMethod: parsed.data.paymentMethod, externalReference: parsed.data.externalReference, notes: parsed.data.notes, idempotencyKey: parsed.data.idempotencyKey ?? randomUUID() }, session)
      : await rejectDeposit({ paymentId, reason: parsed.data.reason, idempotencyKey: parsed.data.idempotencyKey ?? randomUUID() }, session);
    const detail = await getRequestDetail(transaction.requestId);
    if (detail) {
      const base = { recipient: detail.email, recipientName: detail.name, requestId: detail.id, clientId: detail.clientId, appointmentId: detail.appointment?.id };
      if (parsed.data.decision === "APPROVE" && detail.appointment) await sendTransactionalEmail({ ...base, template: "APPOINTMENT_CONFIRMED", data: { clientName: detail.name, requestFolio: detail.folio, appointmentFolio: detail.appointment.folio, idea: detail.idea, bodyPlacement: detail.bodyPlacement, approximateSize: detail.approximateSize, appointmentAt: detail.appointment.startAt, artistName: detail.appointment.artistName ?? undefined, depositCents: detail.payment?.depositRequiredCents, paidCents: detail.payment?.paidCents ?? transaction.amountCents, balanceCents: Math.max(0, (detail.payment?.totalCents ?? 0) - (detail.payment?.paidCents ?? transaction.amountCents)) }, idempotencyKey: `appointment-confirmed:${transaction.id}` });
      if (parsed.data.decision === "REJECT") await sendTransactionalEmail({ ...base, template: "PAYMENT_REJECTED", data: { clientName: detail.name, requestFolio: detail.folio, appointmentFolio: detail.appointment?.folio, appointmentAt: detail.appointment?.startAt, depositCents: detail.payment?.depositRequiredCents, paymentReason: parsed.data.reason }, idempotencyKey: `payment-rejected:${transaction.id}` });
    }
    return NextResponse.json({ transaction, decision: parsed.data.decision });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo confirmar el pago." }, { status: 409 }); }
}

