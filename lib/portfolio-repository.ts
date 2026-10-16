import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { getDatabase } from "@/db";
import { portfolioImages, portfolioItems } from "@/db/schema";
import type { ColorType, PortfolioImage, PortfolioItem, TattooStyle } from "@/types/portfolio";

type ItemRow = typeof portfolioItems.$inferSelect;
type ImageRow = typeof portfolioImages.$inferSelect;

function toPortfolioImage(row: ImageRow): PortfolioImage {
  return { id: row.id, imageUrl: row.imageUrl, optimizedUrl: row.optimizedUrl ?? undefined, thumbnailUrl: row.thumbnailUrl ?? undefined, alt: row.alt, sortOrder: row.sortOrder, isCover: row.isCover };
}

function toPortfolioItem(row: ItemRow, images: ImageRow[]): PortfolioItem {
  return {
    id: row.id, title: row.title, slug: row.slug, description: row.description, style: row.styleId as TattooStyle, artist: row.artistName, bodyPlacement: row.bodyPlacement, size: row.size, colorType: row.colorType as ColorType, performedAt: row.performedAt, tags: row.tags, isFeatured: row.isFeatured, isPublished: row.isPublished, sortOrder: row.sortOrder, images: images.filter((image) => image.portfolioItemId === row.id).sort((a, b) => a.sortOrder - b.sortOrder).map(toPortfolioImage), createdAt: row.createdAt, updatedAt: row.updatedAt, deletedAt: row.deletedAt,
  };
}

async function hydrate(rows: ItemRow[]) {
  if (!rows.length) return [];
  const images = await getDatabase().select().from(portfolioImages).where(inArray(portfolioImages.portfolioItemId, rows.map((row) => row.id))).orderBy(asc(portfolioImages.sortOrder));
  return rows.map((row) => toPortfolioItem(row, images));
}

function itemValues(item: PortfolioItem) {
  return {
    id: item.id, title: item.title, slug: item.slug, description: item.description, styleId: item.style, artistName: item.artist, bodyPlacement: item.bodyPlacement, size: item.size, colorType: item.colorType, performedAt: item.performedAt, tags: item.tags, isFeatured: item.isFeatured, isPublished: item.isPublished, sortOrder: item.sortOrder, createdAt: item.createdAt, updatedAt: item.updatedAt, deletedAt: item.deletedAt,
  };
}

function imageValues(itemId: string, images: PortfolioImage[]) {
  return images.map((image) => ({ id: image.id, portfolioItemId: itemId, imageUrl: image.imageUrl, optimizedUrl: image.optimizedUrl ?? null, thumbnailUrl: image.thumbnailUrl ?? null, alt: image.alt, sortOrder: image.sortOrder, isCover: image.isCover }));
}

export const portfolioRepository = {
  async list({ includeHidden = false } = {}) {
    const visibility = includeHidden ? isNull(portfolioItems.deletedAt) : and(isNull(portfolioItems.deletedAt), eq(portfolioItems.isPublished, true));
    const rows = await getDatabase().select().from(portfolioItems).where(visibility).orderBy(asc(portfolioItems.sortOrder));
    return hydrate(rows);
  },
  async find(id: string) {
    const [row] = await getDatabase().select().from(portfolioItems).where(and(eq(portfolioItems.id, id), isNull(portfolioItems.deletedAt))).limit(1);
    if (!row) return null;
    return (await hydrate([row]))[0];
  },
  async create(item: PortfolioItem) {
    await getDatabase().transaction(async (tx) => {
      await tx.insert(portfolioItems).values(itemValues(item));
      if (item.images.length) await tx.insert(portfolioImages).values(imageValues(item.id, item.images));
    });
    return item;
  },
  async update(id: string, changes: Partial<PortfolioItem>) {
    const existing = await this.find(id);
    if (!existing) return null;
    const updated: PortfolioItem = { ...existing, ...changes, id, updatedAt: new Date().toISOString() };
    await getDatabase().transaction(async (tx) => {
      const values = itemValues(updated);
      const { id: _id, createdAt: _createdAt, ...mutable } = values;
      await tx.update(portfolioItems).set(mutable).where(eq(portfolioItems.id, id));
      if (changes.images) {
        await tx.delete(portfolioImages).where(eq(portfolioImages.portfolioItemId, id));
        if (updated.images.length) await tx.insert(portfolioImages).values(imageValues(id, updated.images));
      }
    });
    return updated;
  },
  async softDelete(id: string) {
    return this.update(id, { deletedAt: new Date().toISOString(), isPublished: false });
  },
  async reorder(ids: string[]) {
    await getDatabase().transaction(async (tx) => {
      for (const [sortOrder, id] of ids.entries()) await tx.update(portfolioItems).set({ sortOrder, updatedAt: new Date().toISOString() }).where(eq(portfolioItems.id, id));
    });
    return this.list({ includeHidden: true });
  },
};
