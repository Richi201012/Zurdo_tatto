export interface StoredImage {
  originalUrl: string;
  optimizedUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
}

export interface ImageStorageProvider {
  save(file: File): Promise<StoredImage>;
}
