import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/auth";
import { portfolioRepository } from "@/lib/portfolio-repository";
import { TATTOO_STYLES } from "@/types/portfolio";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  description: z.string().trim().max(1200).optional(),
  style: z.enum(TATTOO_STYLES).optional(),
  artist: z.string().trim().max(100).optional(),
  bodyPlacement: z.string().trim().max(100).optional(),
  size: z.string().trim().max(80).optional(),
  colorType: z.enum(["color", "black-and-grey"]).optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  coverImageId: z.string().optional(),
  removeImageIds: z.array(z.string()).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  const id = (await params).id;
  const existing = await portfolioRepository.find(id);
  if (!existing) return NextResponse.json({ error: "Trabajo no encontrado." }, { status: 404 });
  const { coverImageId, removeImageIds = [], ...changes } = parsed.data;
  const remainingImages = existing.images.filter((image) => !removeImageIds.includes(image.id));
  if (!remainingImages.length) return NextResponse.json({ error: "El trabajo debe conservar al menos una imagen." }, { status: 400 });
  const selectedCover = remainingImages.some((image) => image.id === coverImageId) ? coverImageId : remainingImages.find((image) => image.isCover)?.id ?? remainingImages[0].id;
  const images = remainingImages.map((image, index) => ({ ...image, sortOrder: index, isCover: image.id === selectedCover }));
  const item = await portfolioRepository.update(id, { ...changes, images });
  if (!item) return NextResponse.json({ error: "Trabajo no encontrado." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const item = await portfolioRepository.softDelete((await params).id);
  if (!item) return NextResponse.json({ error: "Trabajo no encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
