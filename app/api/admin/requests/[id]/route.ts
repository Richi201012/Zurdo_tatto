import { NextResponse } from "next/server";
import { z } from "zod";
import { addInternalNote, updateRequestState } from "@/lib/admin/operations";
import { authorizeMutation } from "@/lib/auth";

const stateSchema = z.object({ status: z.string(), nextAction: z.string().trim().max(240).optional() });
const noteSchema = z.object({ content: z.string().trim().min(2).max(2000) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeMutation(request);
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = stateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  try { return NextResponse.json({ request: await updateRequestState({ requestId: (await params).id, ...parsed.data }, session) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo actualizar." }, { status: 400 }); }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorizeMutation(request);
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = noteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Escribe una nota válida." }, { status: 400 });
  try { return NextResponse.json({ note: await addInternalNote({ requestId: (await params).id, content: parsed.data.content }, session) }, { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo guardar." }, { status: 400 }); }
}

