import { prisma } from "@/lib/prisma";

const DEFAULT_MESSAGE =
  "Estamos realizando uma manutenção para melhorar sua experiência. Voltaremos em breve. Deus abençoe.";

export type MaintenanceView = {
  active: boolean;
  parishName: string;
  logoUrl: string | null;
  message: string;
  endsAt: Date | null;
};

export function maintenanceMessageOrDefault(raw: string | null | undefined): string {
  const t = raw?.trim();
  return t || DEFAULT_MESSAGE;
}

/** Desliga automaticamente se a data de término já passou. */
export async function resolveMaintenance(): Promise<MaintenanceView> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    return {
      active: false,
      parishName: "Paróquia",
      logoUrl: null,
      message: DEFAULT_MESSAGE,
      endsAt: null,
    };
  }

  let enabled = settings.maintenanceEnabled;
  const endsAt = settings.maintenanceEndsAt;

  if (enabled && endsAt && endsAt.getTime() <= Date.now()) {
    enabled = false;
    await prisma.siteSettings.update({
      where: { id: 1 },
      data: { maintenanceEnabled: false },
    });
  }

  return {
    active: enabled,
    parishName: settings.parishName,
    logoUrl: settings.logoUrl,
    message: maintenanceMessageOrDefault(settings.maintenanceMessage),
    endsAt: enabled ? endsAt : null,
  };
}

export function formatMaintenanceReturnDate(endsAt: Date | null): string | null {
  if (!endsAt) return null;
  return endsAt.toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}