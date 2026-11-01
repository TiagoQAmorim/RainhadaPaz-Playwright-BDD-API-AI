import { prisma } from "@/lib/prisma";

export async function getPublishedMassLocations() {
  return prisma.massLocation.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
  });
}

export function scheduleTextToHtml(text: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return "";
  const items = lines.map((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return `<li>${escapeHtml(line)}</li>`;
    const label = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    return `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`;
  });
  return `<ul class="space-y-2">${items.join("")}</ul>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
