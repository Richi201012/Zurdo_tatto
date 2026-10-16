import { portfolioSeed } from "@/data/portfolio-seed";
import { TATTOO_STYLES } from "@/types/portfolio";
import { loadEnvConfig } from "@next/env";
import { closeDatabase, getDatabase } from "./index";
import { portfolioImages, portfolioItems, tattooStyles } from "./schema";

loadEnvConfig(process.cwd());

async function main() {
  const db = getDatabase();
  await db.insert(tattooStyles).values(TATTOO_STYLES.map((name) => ({ id: name, name, slug: name.toLowerCase().replaceAll(" & ", "-").replaceAll(" ", "-") }))).onConflictDoNothing();
  for (const item of portfolioSeed) {
    await db.insert(portfolioItems).values({
      id: item.id, title: item.title, slug: item.slug, description: item.description, styleId: item.style, artistName: item.artist, bodyPlacement: item.bodyPlacement, size: item.size, colorType: item.colorType, performedAt: item.performedAt, tags: item.tags, isFeatured: item.isFeatured, isPublished: item.isPublished, sortOrder: item.sortOrder, createdAt: item.createdAt, updatedAt: item.updatedAt, deletedAt: item.deletedAt,
    }).onConflictDoNothing();
    await db.insert(portfolioImages).values(item.images.map((image) => ({ id: image.id, portfolioItemId: item.id, imageUrl: image.imageUrl, optimizedUrl: image.optimizedUrl, thumbnailUrl: image.thumbnailUrl, alt: image.alt, sortOrder: image.sortOrder, isCover: image.isCover }))).onConflictDoNothing();
  }
  await closeDatabase();
  console.log(`Seed completado: ${portfolioSeed.length} trabajos iniciales.`);
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await closeDatabase();
  process.exit(1);
});
