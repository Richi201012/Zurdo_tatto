import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestDetail } from "@/lib/admin/data";
import { saveQuote } from "@/lib/admin/operations";
import { authorizeMutation } from "@/lib/auth";
import { getBookingSettings } from "@/lib/booking/public-availability";
import { sendTransactionalEmail } from "@/lib/email/brevo";

const schema = z.object({ estimatedPriceCents: z.number().int().positive(), depositRequiredCents: z.number().int().positive(), estimatedMinutes: z.number().int().min(30).max(1440), sessionCount: z.number().int().min(1).max(20), artistId: z.string().uuid().nullable().optional(), comments: z.string().max(2000).optional(), send: z.boolean().optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeMutation(request, ["ADMIN", "RECEPTION", "ARTIST"]);
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos de la cotización." }, { status: 400 });
  try {
    const settings = await getBookingSettings();
    if (parsed.data.send && !settings.transferClabe && !settings.transferAccount) return NextResponse.json({ error: "Configura la CLABE o cuenta de transferencia antes de enviar la cotización." }, { status: 400 });
    const currentDetail = await getRequestDetail((await params).id);
    if (parsed.data.send && !currentDetail?.appointment) return NextResponse.json({ error: "El tatuador debe asignar la fecha y hora antes de enviar la cotización." }, { status: 400 });
    const { estimatedPriceCents, ...quoteData } = parsed.data;
    const result = await saveQuote({ requestId: currentDetail?.id ?? (await params).id, minPriceCents: estimatedPriceCents, maxPriceCents: estimatedPriceCents, ...quoteData }, session);
    if (parsed.data.send) {
      const detail = await getRequestDetail(result.request.id);
      await sendTransactionalEmail({ recipient: result.request.email, recipientName: result.request.name, requestId: result.request.id, clientId: result.request.clientId, appointmentId: detail?.appointment?.id, template: "QUOTE", data: {
        clientName: result.request.name, requestFolio: result.request.folio, appointmentFolio: detail?.appointment?.folio, idea: result.request.idea,
        bodyPlacement: result.request.bodyPlacement, approximateSize: result.request.approximateSize, colorPreference: result.request.colorPreference,
        minPriceCents: result.quote.minPriceCents, maxPriceCents: result.quote.maxPriceCents, depositCents: result.quote.depositRequiredCents,
        estimatedMinutes: result.quote.estimatedMinutes, sessionCount: result.quote.sessionCount, artistName: detail?.appointment?.artistName ?? detail?.artistName,
        appointmentAt: detail?.appointment?.startAt, paymentDueAt: detail?.payment?.dueAt ?? undefined, quoteComments: result.quote.comments,
        paymentInstructions: settings.paymentInstructions, paymentMethods: settings.acceptedPaymentMethods, transferBank: settings.transferBank,
        transferBeneficiary: settings.transferBeneficiary, transferClabe: settings.transferClabe, transferAccount: settings.transferAccount,
      }, idempotencyKey: `quote:${result.quote.id}` });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar la cotización." }, { status: 400 }); }
}
