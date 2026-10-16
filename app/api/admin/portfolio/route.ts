import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/auth";
import { portfolioRepository } from "@/lib/portfolio-repository";
import { imageStorage } from "@/lib/storage";
import { slugify } from "@/lib/utils";
import { TATTOO_STYLES, type ColorType, type PortfolioImage, type TattooStyle } from "@/types/portfolio";

export const runtime = "nodejs";

const createSchema = z.object({
  title: z.string().trim().max(140).optional().default("Trabajo sin título"),
  description: z.string().trim().max(1200).optional().default(""),
  style: z.enum(TATTOO_STYLES),
  artist: z.string().trim().max(100).optional().default(""),
  bodyPlacement: z.string().trim().max(100).optional().default(""),
  size: z.string().trim().max(80).optional().default(""),
  colorType: z.enum(["color", "black-and-grey"]).optional().default("black-and-grey"),
  performedAt: z.string().trim().optional().default(""),
  tags: z.string().trim().optional().default(""),
  isFeatured: z.enum(["true", "false"]).default("false"),
  isPublished: z.enum(["true", "false"]),
});

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  return NextResponse.json({ items: await portfolioRepository.list({ includeHidden: true }) });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const formData = await request.formData();
    const parsed = createSchema.safeParse(Object.fromEntries(Array.from(formData.entries()).filter(([key]) => key !== "images")));
    if (!parsed.success) return NextResponse.json({ error: "Revisa los datos del trabajo.", issues: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
    const files = formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    if (!files.length) return NextResponse.json({ error: "Agrega por lo menos una imagen." }, { status: 400 });
    if (files.length > 8) return NextResponse.json({ error: "Puedes cargar hasta 8 imágenes por trabajo." }, { status: 400 });
    const stored = await Promise.all(files.map((file) => imageStorage().save(file)));
    const id = randomUUID();
    const now = new Date().toISOString();
    const title = parsed.data.title || "Trabajo sin título";
    const images: PortfolioImage[] = stored.map((image, index) => ({ id: randomUUID(), imageUrl: image.originalUrl, optimizedUrl: image.optimizedUrl, thumbnailUrl: image.thumbnailUrl, alt: `${title}${parsed.data.bodyPlacement ? ` en ${parsed.data.bodyPlacement}` : ""}`, sortOrder: index, isCover: index === 0 }));
    const current = await portfolioRepository.list({ includeHidden: true });
    const item = await portfolioRepository.create({
      id, title, slug: `${slugify(title)}-${id.slice(0, 8)}`, description: parsed.data.description, style: parsed.data.style as TattooStyle, artist: parsed.data.artist, bodyPlacement: parsed.data.bodyPlacement, size: parsed.data.size, colorType: parsed.data.colorType as ColorType, performedAt: parsed.data.performedAt || null, tags: parsed.data.tags.split(",").map((tag) => tag.trim()).filter(Boolean), isFeatured: parsed.data.isFeatured === "true", isPublished: parsed.data.isPublished === "true", sortOrder: current.length, images, createdAt: now, updatedAt: now, deletedAt: null,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo publicar el trabajo." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null) as { ids?: string[] } | null;
  if (!body?.ids?.length) return NextResponse.json({ error: "Orden inválido." }, { status: 400 });
  await portfolioRepository.reorder(body.ids);
  return NextResponse.json({ ok: true });
}
