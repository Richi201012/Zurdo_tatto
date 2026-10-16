import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestDetail } from "@/lib/admin/data";
import { scheduleRequestAppointment } from "@/lib/admin/operations";
import { authorizeMutation } from "@/lib/auth";
import { getBookingSettings, localDateTimeToIso } from "@/lib/booking/public-availability";
import { sendTransactionalEmail } from "@/lib/email/brevo";

const schema = z.object({ requestId: z.string().uuid(), artistId: z.string().uuid(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/), durationMinutes: z.number().int().min(30).max(1440) });

export async function POST(request: Request) {
  const session = await authorizeMutation(request, ["ADMIN", "RECEPTION", "ARTIST"]);
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa la fecha, hora, duración y tatuador." }, { status: 400 });
  try {
    const previous = await getRequestDetail(parsed.data.requestId);
    const previousAppointment = previous?.appointment;
    const settings = await getBookingSettings();
    const startAt = localDateTimeToIso(parsed.data.date, parsed.data.time, settings.timezone);
    const endAt = new Date(new Date(startAt).getTime() + parsed.data.durationMinutes * 60000).toISOString();
    const appointment = await scheduleRequestAppointment({ requestId: parsed.data.requestId, artistId: parsed.data.artistId, startAt, endAt }, session);
    const detail = await getRequestDetail(parsed.data.requestId);
    const shouldNotifyReschedule = previousAppointment && previousAppointment.startAt !== appointment.startAt && previous?.quote?.status === "SENT" && detail;
    if (shouldNotifyReschedule && detail) {
      await sendTransactionalEmail({
        recipient: detail.email,
        recipientName: detail.name,
        requestId: detail.id,
        clientId: detail.clientId,
        appointmentId: appointment.id,
        template: "APPOINTMENT_RESCHEDULED",
        data: {
          clientName: detail.name,
          requestFolio: detail.folio,
          appointmentFolio: appointment.folio,
          idea: detail.idea,
          bodyPlacement: detail.bodyPlacement,
          approximateSize: detail.approximateSize,
          artistName: detail.appointment?.artistName ?? undefined,
          previousAppointmentAt: previousAppointment.startAt,
          appointmentAt: appointment.startAt,
        },
        idempotencyKey: `appointment-rescheduled:${appointment.id}:${appointment.startAt}`,
      });
    }
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo asignar el horario." }, { status: 409 }); }
}
