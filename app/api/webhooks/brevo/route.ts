import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { emailLogs } from "@/db/schema";

const statusMap: Record<string, string> = { delivered: "DELIVERED", hard_bounce: "BOUNCED", soft_bounce: "BOUNCED", blocked: "BLOCKED", spam: "SPAM", opened: "DELIVERED", click: "DELIVERED" };

export async function POST(request: Request) {
  const secret = process.env.BREVO_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-webhook-secret") !== secret) return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  const body = await request.json().catch(() => null) as { event?: string; "message-id"?: string } | null;
  if (!body?.event || !body["message-id"] || !statusMap[body.event]) return NextResponse.json({ ok: true, ignored: true });
  await getDatabase().update(emailLogs).set({ status: statusMap[body.event], updatedAt: new Date().toISOString() }).where(eq(emailLogs.providerMessageId, body["message-id"]));
  return NextResponse.json({ ok: true });
}
