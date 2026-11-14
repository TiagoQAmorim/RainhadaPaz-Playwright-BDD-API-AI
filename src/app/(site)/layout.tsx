import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TopBar } from "@/components/TopBar";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { resolveMaintenance } from "@/lib/maintenance";
import { getSiteSettings } from "@/lib/settings";

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const maintenance = await resolveMaintenance();
  if (maintenance.active) {
    return (
      <MaintenanceScreen
        parishName={maintenance.parishName}
        logoUrl={maintenance.logoUrl}
        message={maintenance.message}
        endsAt={maintenance.endsAt}
      />
    );
  }

  const settings = await getSiteSettings();

  return (
    <>
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
    </>
  );
}