import type { Metadata } from "next";
import { bodyFont, displayFont } from "@/lib/fonts";
import { publicSiteUrl } from "@/lib/site-url";
import { getSiteSettings, searchAppearance } from "@/lib/settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const search = searchAppearance(s);
  return {
    metadataBase: new URL(publicSiteUrl()),
    title: {
      default: search.title,
      template: `%s | ${s.parishName}`,
    },
    description: search.description,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: "/",
      siteName: s.parishName,
      title: search.title,
      description: search.description,
      images: [{ url: search.image, alt: s.parishName }],
    },
    twitter: {
      card: "summary_large_image",
      title: search.title,
      description: search.description,
      images: [search.image],
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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