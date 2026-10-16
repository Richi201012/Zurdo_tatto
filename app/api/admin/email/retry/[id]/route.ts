import { NextResponse } from "next/server";
import { authorizeMutation } from "@/lib/auth";
import { retryEmailLog } from "@/lib/email/brevo";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeMutation(request); if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try { return NextResponse.json({ log: await retryEmailLog((await params).id) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo reintentar." }, { status: 400 }); }
}
