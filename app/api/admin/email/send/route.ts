import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeMutation } from "@/lib/auth";
import { sendTransactionalEmail } from "@/lib/email/brevo";
import { EMAIL_TEMPLATES } from "@/lib/email/templates";

const schema = z.object({ recipient: z.email(), template: z.enum(EMAIL_TEMPLATES), data: z.record(z.string(), z.unknown()).default({}), requestId: z.string().uuid().optional(), clientId: z.string().uuid().optional(), appointmentId: z.string().uuid().optional() });

export async function POST(request: Request) {
  const session = await authorizeMutation(request); if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Revisa el correo y la plantilla." }, { status: 400 });
  const log = await sendTransactionalEmail({ ...parsed.data, data: parsed.data.data, idempotencyKey: undefined });
  return NextResponse.json({ log }, { status: log.status === "FAILED" ? 503 : 201 });
}

