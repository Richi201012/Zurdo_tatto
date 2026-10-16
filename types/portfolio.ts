export const TATTOO_STYLES = [
  "Black & grey",
  "Realismo",
  "Lettering",
  "Color",
  "Minimalista",
  "Otros",
] as const;

export type TattooStyle = (typeof TATTOO_STYLES)[number];
export type ColorType = "color" | "black-and-grey";

export interface PortfolioImage {
  id: string;
  imageUrl: string;
  optimizedUrl?: string;
  thumbnailUrl?: string;
  alt: string;
  sortOrder: number;
  isCover: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  style: TattooStyle;
  artist: string;
  bodyPlacement: string;
  size: string;
  colorType: ColorType;
  performedAt: string | null;
  tags: string[];
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  images: PortfolioImage[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
