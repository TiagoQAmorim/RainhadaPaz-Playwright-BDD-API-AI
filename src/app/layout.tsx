import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TopBar } from "@/components/TopBar";
import { WhatsAppButton } from "@/components/WhatsAppButton";
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();

  return (
    <html lang="pt-BR" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="flex min-h-screen flex-col">
        <TopBar address={settings.address} phone={settings.phone} />
        <SiteHeader parishName={settings.parishName} logoUrl={settings.logoUrl} />
        <main className="flex-1">{children}</main>
        <SiteFooter
          parishName={settings.parishName}
          diocese={settings.diocese}
          address={settings.address}
          phone={settings.phone}
          facebookUrl={settings.facebookUrl}
          youtubeUrl={settings.youtubeChannelUrl ?? settings.youtubeUrl}
          instagramUrl={settings.instagramUrl}
          logoUrl={settings.logoUrl}
        />
        <WhatsAppButton phone={settings.phone} />
      </body>
    </html>
  );
}
