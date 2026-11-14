import type { Metadata } from "next";
import { bodyFont, displayFont } from "@/lib/fonts";
import { PARISH_LOGO_PATH } from "@/lib/parish-brand";
import { getSiteSettings } from "@/lib/settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: {
      default: s.parishName,
      template: `%s | ${s.parishName}`,
    },
    description: s.heroSubtitle,
    icons: {
      icon: [{ url: PARISH_LOGO_PATH, type: "image/png" }],
      apple: [{ url: PARISH_LOGO_PATH, type: "image/png" }],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}