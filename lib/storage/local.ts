import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { ImageStorageProvider, StoredImage } from "./types";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export class LocalImageStorage implements ImageStorageProvider {
  async save(file: File): Promise<StoredImage> {
    const maxBytes = Number(process.env.MAX_UPLOAD_MB ?? 12) * 1024 * 1024;
    if (!allowedTypes.has(file.type)) throw new Error("Formato no permitido. Usa JPG, PNG o WEBP.");
    if (file.size > maxBytes) throw new Error(`La imagen supera el límite de ${process.env.MAX_UPLOAD_MB ?? 12} MB.`);

    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) throw new Error("El archivo no contiene una imagen válida.");

    const id = randomUUID();
    const root = path.join(process.cwd(), "public", "uploads");
    const originalDirectory = path.join(root, "originals");
    const optimizedDirectory = path.join(root, "optimized");
    const thumbnailDirectory = path.join(root, "thumbnails");
    await Promise.all([originalDirectory, optimizedDirectory, thumbnailDirectory].map((directory) => mkdir(directory, { recursive: true })));

    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    await writeFile(path.join(originalDirectory, `${id}.${extension}`), buffer);
    await Promise.all([
      sharp(buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 84 }).toFile(path.join(optimizedDirectory, `${id}.webp`)),
      sharp(buffer).rotate().resize({ width: 480, height: 600, fit: "cover", withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(thumbnailDirectory, `${id}.webp`)),
    ]);

    return {
      originalUrl: `/uploads/originals/${id}.${extension}`,
      optimizedUrl: `/uploads/optimized/${id}.webp`,
      thumbnailUrl: `/uploads/thumbnails/${id}.webp`,
      width: metadata.width,
      height: metadata.height,
    };
  }
}
