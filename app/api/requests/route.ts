import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendTransactionalEmail } from "@/lib/email/brevo";
import { formatTattooSize } from "@/lib/booking/format";
import { saveTattooRequest } from "@/lib/request-repository";
import { imageStorage } from "@/lib/storage";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(100), whatsapp: z.string().trim().min(7).max(30), email: z.email(), idea: z.string().trim().min(15).max(2500),
  bodyPlacement: z.string().trim().min(2).max(100), approximateSize: z.string().trim().min(1).max(80).transform(formatTattooSize), colorPreference: z.string().trim().min(1).max(40),
  preferredDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), preferredTime: z.string().trim().min(1).max(80), termsVersion: z.string().trim().min(1).max(40),
  referencePortfolioItemId: z.string().trim().max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const parsed = schema.safeParse(Object.fromEntries(Array.from(formData.entries()).filter(([key]) => key !== "images")));
    if (!parsed.success) return NextResponse.json({ error: "Revisa los datos obligatorios.", issues: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
    const files = formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    if (files.length > 6) return NextResponse.json({ error: "Puedes adjuntar hasta 6 imágenes." }, { status: 400 });
    const stored = await Promise.all(files.map((file) => imageStorage().save(file)));
    const record = await saveTattooRequest({ id: randomUUID(), ...parsed.data, referenceImages: stored.map((image) => image.optimizedUrl), status: "NEW_REQUEST", createdAt: new Date().toISOString() });
    await sendTransactionalEmail({ recipient: record.email, recipientName: record.name, template: "REQUEST_RECEIVED", requestId: record.id, data: { clientName: record.name, requestFolio: record.folio, idea: record.idea, bodyPlacement: record.bodyPlacement, approximateSize: record.approximateSize, colorPreference: record.colorPreference, preferredDay: record.preferredDay }, idempotencyKey: `request-received:${record.id}` }).catch(() => undefined);
    return NextResponse.json({ ok: true, requestId: record.id, folio: record.folio }, { status: 201 });
  } catch (error) {
    console.error("No se pudo guardar la solicitud pública.", error);
    return NextResponse.json({ error: "No pudimos enviar tu solicitud en este momento. Intenta nuevamente." }, { status: 500 });
  }
}
