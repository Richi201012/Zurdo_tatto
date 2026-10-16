import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/db";
import { artists, auditLogs, availabilityExceptions, availabilityRules } from "@/db/schema";
import { authorizeMutation } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ARTIST"), name: z.string().trim().min(2).max(100) }),
  z.object({ type: z.literal("RULE"), artistId: z.string().uuid(), weekday: z.number().int().min(0).max(6), startTime: z.string().regex(/^\d{2}:\d{2}$/), endTime: z.string().regex(/^\d{2}:\d{2}$/), breakStartTime: z.string().optional(), breakEndTime: z.string().optional(), minimumMinutes: z.number().int().min(30).max(720), bufferMinutes: z.number().int().min(0).max(240), isActive: z.boolean().default(true) }),
  z.object({ type: z.literal("EXCEPTION"), artistId: z.string().uuid(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), startTime: z.string().optional(), endTime: z.string().optional(), kind: z.enum(["BLOCKED", "SPECIAL_HOURS", "VACATION", "EVENT", "PERSONAL"]), reason: z.string().trim().min(2).max(500) }),
]);

export async function POST(request: Request) {
  const session = await authorizeMutation(request, ["ADMIN", "RECEPTION"]);
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos de disponibilidad." }, { status: 400 });
  if (parsed.data.type !== "EXCEPTION" && session.role !== "ADMIN") return NextResponse.json({ error: "Solo un administrador puede modificar horarios base y tatuadores." }, { status: 403 });
  const now = new Date().toISOString();
  try {
    const result = await getDatabase().transaction(async (tx) => {
      let record: unknown;
      if (parsed.data.type === "ARTIST") {
        [record] = await tx.insert(artists).values({ name: parsed.data.name, slug: `${slugify(parsed.data.name)}-${Date.now().toString(36)}`, createdAt: now, updatedAt: now }).returning();
      } else if (parsed.data.type === "RULE") {
        const { type: _, ...values } = parsed.data;
        [record] = await tx.insert(availabilityRules).values({ ...values, breakStartTime: values.breakStartTime || null, breakEndTime: values.breakEndTime || null, createdAt: now, updatedAt: now }).onConflictDoUpdate({ target: [availabilityRules.artistId, availabilityRules.weekday], set: { startTime: values.startTime, endTime: values.endTime, breakStartTime: values.breakStartTime || null, breakEndTime: values.breakEndTime || null, minimumMinutes: values.minimumMinutes, bufferMinutes: values.bufferMinutes, isActive: values.isActive, updatedAt: now } }).returning();
      } else {
        const { type: _, ...values } = parsed.data;
        [record] = await tx.insert(availabilityExceptions).values({ ...values, startTime: values.startTime || null, endTime: values.endTime || null, createdBy: session.email, createdAt: now }).returning();
      }
      await tx.insert(auditLogs).values({ userEmail: session.email, action: `AVAILABILITY_${parsed.data.type}_SAVED`, entityType: parsed.data.type, entityId: (record as { id: string }).id, metadata: {}, createdAt: now });
      return record;
    });
    return NextResponse.json({ record: result }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar." }, { status: 400 }); }
}

