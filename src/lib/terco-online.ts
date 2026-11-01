import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";

export type TercoOnlineSlotView = {
  id: string;
  title: string;
  scheduleText: string;
  meetingUrl: string;
};

export async function getTercoOnlineSlots(): Promise<TercoOnlineSlotView[]> {
  const slots = await prisma.tercoOnlineSlot.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (slots.length > 0) {
    return slots.map(({ id, title, scheduleText, meetingUrl }) => ({
      id,
      title,
      scheduleText,
      meetingUrl,
    }));
  }

  const s = await getSiteSettings();
  const schedule = s.tercoOnlineSchedule?.trim();
  const meetingUrl = s.tercoOnlineLink?.trim();
  if (schedule || meetingUrl) {
    return [
      {
        id: "legacy",
        title: "Terço online",
        scheduleText: schedule || "Segunda a sexta, 19h30",
        meetingUrl: meetingUrl || "",
      },
    ].filter((slot) => slot.meetingUrl || slot.scheduleText);
  }

  return [];
}

/** Resumo curto para cards na home (ex.: "Seg, ter e qua · Qui e sex"). */
export function summarizeTercoSchedules(slots: TercoOnlineSlotView[]): string {
  if (slots.length === 0) return "Segunda a sexta, 19h30";
  if (slots.length === 1) return slots[0].scheduleText;
  return slots.map((s) => s.scheduleText).join(" · ");
}
