import { and, eq, gte, isNull, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDatabase } from "@/db";
import { appointments, artists, clients, payments, tattooRequests } from "@/db/schema";
import { sendTransactionalEmail } from "@/lib/email/brevo";
import { expireUnpaidAppointments } from "@/lib/booking/expiration";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const expired = await expireUnpaidAppointments();
  const now = new Date();
  const windows = [
    { key: "48h", from: new Date(now.getTime() + 47 * 3600000), to: new Date(now.getTime() + 49 * 3600000), column: appointments.reminder48hSentAt },
    { key: "24h", from: new Date(now.getTime() + 23 * 3600000), to: new Date(now.getTime() + 25 * 3600000), column: appointments.reminder24hSentAt },
  ] as const;
  let processed = 0;
  for (const window of windows) {
    const rows = await getDatabase().select({ id: appointments.id, folio: appointments.folio, requestId: appointments.requestId, clientId: appointments.clientId, startAt: appointments.startAt, clientName: clients.name, email: clients.email, requestFolio: tattooRequests.folio, artistName: artists.name, paidCents: payments.paidCents, totalCents: payments.totalCents }).from(appointments).innerJoin(clients, eq(appointments.clientId, clients.id)).innerJoin(tattooRequests, eq(appointments.requestId, tattooRequests.id)).innerJoin(artists, eq(appointments.artistId, artists.id)).leftJoin(payments, eq(payments.appointmentId, appointments.id)).where(and(eq(appointments.status, "CONFIRMED"), gte(appointments.startAt, window.from.toISOString()), lte(appointments.startAt, window.to.toISOString()), isNull(window.column)));
    for (const item of rows) {
      const log = await sendTransactionalEmail({ recipient: item.email, recipientName: item.clientName, requestId: item.requestId, clientId: item.clientId, appointmentId: item.id, template: "APPOINTMENT_REMINDER", data: { clientName: item.clientName, requestFolio: item.requestFolio, appointmentFolio: item.folio, appointmentAt: item.startAt, artistName: item.artistName, paidCents: item.paidCents ?? 0, balanceCents: Math.max(0, (item.totalCents ?? 0) - (item.paidCents ?? 0)) }, idempotencyKey: `reminder-${window.key}:${item.id}` });
      if (["SENT", "DELIVERED"].includes(log.status)) { await getDatabase().update(appointments).set(window.key === "48h" ? { reminder48hSentAt: new Date().toISOString() } : { reminder24hSentAt: new Date().toISOString() }).where(eq(appointments.id, item.id)); processed += 1; }
    }
  }
  return NextResponse.json({ ok: true, processed, expired: expired.length });
}
