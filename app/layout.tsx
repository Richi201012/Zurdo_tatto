import type { Metadata } from "next";
import { Archivo, Cormorant_Garamond } from "next/font/google";
import { studioConfig } from "@/config/studio";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: { default: `${studioConfig.name} | Estudio de tatuajes`, template: `%s | ${studioConfig.name}` },
  description: studioConfig.description,
  openGraph: {
    title: `${studioConfig.name} | Estudio de tatuajes`,
    description: studioConfig.description,
    type: "website",
    images: [{ url: "/portfolio/5073783663387938116.jpg", alt: "Trabajo real del estudio" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${archivo.variable} ${cormorant.variable}`}>
      <body>
        <a className="skip-link" href="#contenido">Saltar al contenido</a>
        {children}
      </body>
    </html>
  );
}
