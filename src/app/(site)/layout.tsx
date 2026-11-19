import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import { connection } from "next/server";

/** Produção usa SQLite no volume — não servir home congelada do build. */
export const dynamic = "force-dynamic";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TopBar } from "@/components/TopBar";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { hasValidAdminSession } from "@/lib/auth";
import { resolveMaintenance } from "@/lib/maintenance";
import { unpublishedPublicHrefs } from "@/lib/public-pages";
import { ParishJsonLd } from "@/components/ParishJsonLd";
import { getSiteSettings } from "@/lib/settings";

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const [maintenance, adminLoggedIn] = await Promise.all([
    resolveMaintenance(),
    hasValidAdminSession(),
  ]);
  if (maintenance.active && !adminLoggedIn) {
    return (
      <MaintenanceScreen
        parishName={maintenance.parishName}
        logoUrl={maintenance.logoUrl}
        message={maintenance.message}
        endsAt={maintenance.endsAt}
      />
    );
  }

  const [settings, hiddenHrefs] = await Promise.all([
    getSiteSettings(),
    unpublishedPublicHrefs(),
  ]);

  return (
    <div className="portal-scale">
      <ParishJsonLd settings={settings} />
      <TopBar address={settings.address} phone={settings.phone} />
      <SiteHeader
        parishName={settings.parishName}
        logoUrl={settings.logoUrl}
        hiddenHrefs={hiddenHrefs}
      />
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
        hiddenHrefs={hiddenHrefs}
      />
      <WhatsAppButton phone={settings.phone} />
    </div>
  );
}