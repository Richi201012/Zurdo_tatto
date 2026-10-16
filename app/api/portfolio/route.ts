import { NextResponse } from "next/server";
import { portfolioRepository } from "@/lib/portfolio-repository";
import type { PortfolioImage } from "@/types/portfolio";

export const dynamic = "force-dynamic";

function publicImageUrl(value: string | undefined, origin: string) {
  if (!value || !value.startsWith("/uploads/")) return value;
  return new URL(value, origin).toString();
}

function publicImage(image: PortfolioImage, origin: string): PortfolioImage {
  return {
    ...image,
    imageUrl: publicImageUrl(image.imageUrl, origin) ?? image.imageUrl,
    optimizedUrl: publicImageUrl(image.optimizedUrl, origin),
    thumbnailUrl: publicImageUrl(image.thumbnailUrl, origin),
  };
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const items = (await portfolioRepository.list()).map((item) => ({
    ...item,
    images: item.images.map((image) => publicImage(image, origin)),
  }));

  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
