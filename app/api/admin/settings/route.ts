import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/db";
import { auditLogs, studioSettings } from "@/db/schema";
import { authorizeMutation } from "@/lib/auth";

const optionalMexicanBankNumber = (digits: number, label: string) => z.string().trim().refine(
  (value) => value === "" || new RegExp(`^\\d{${digits}}$`).test(value),
  `${label} debe contener exactamente ${digits} dígitos.`,
);

const schema = z.object({ defaultDurationMinutes: z.number().int().min(30).max(1440), bufferMinutes: z.number().int().min(0).max(240), depositDueHours: z.literal(2), holdHours: z.literal(2), depositType: z.enum(["FIXED", "PERCENTAGE"]), depositValue: z.number().int().min(0), paymentInstructions: z.string().max(4000), transferBank: z.string().trim().max(120), transferBeneficiary: z.string().trim().max(160), transferClabe: optionalMexicanBankNumber(18, "La CLABE"), transferAccount: optionalMexicanBankNumber(16, "El número de cuenta o tarjeta"), acceptedPaymentMethods: z.array(z.string().max(80)).max(20), notificationSettings: z.record(z.string(), z.boolean()) });

export async function POST(request: Request) {
  const session = await authorizeMutation(request, ["ADMIN"]); if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const fields = z.flattenError(parsed.error).fieldErrors;
    const firstError = Object.values(fields).flat()[0];
    return NextResponse.json({ error: firstError ?? "Revisa la configuración.", fields }, { status: 400 });
  }
  const now = new Date().toISOString();
  const [settings] = await getDatabase().insert(studioSettings).values({ id: "default", ...parsed.data, updatedAt: now }).onConflictDoUpdate({ target: studioSettings.id, set: { ...parsed.data, updatedAt: now } }).returning();
  await getDatabase().insert(auditLogs).values({ userEmail: session.email, action: "SETTINGS_UPDATED", entityType: "StudioSettings", entityId: "default", metadata: {}, createdAt: now });
  return NextResponse.json({ settings });
}

