import { LocalImageStorage } from "./local";
import type { ImageStorageProvider } from "./types";

// Cambia esta factoría para conectar R2, S3, Cloudinary o Supabase Storage.
export function imageStorage(): ImageStorageProvider {
  return new LocalImageStorage();
}
