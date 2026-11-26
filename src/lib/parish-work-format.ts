export const WORK_STATUSES = [
  { value: "planned", label: "Planejado" },
  { value: "doing", label: "Em andamento" },
  { value: "done", label: "Concluído" },
] as const;

export const WORK_HELP_AMOUNTS_BRL = [30, 50, 100, 200, 500] as const;

export function workStatusLabel(status: string): string {
  return WORK_STATUSES.find((item) => item.value === status)?.label ?? "Em andamento";
}

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Valor livre da ajuda: R$ 1 a R$ 100.000. Aceita 50, 50,00 e 1.000,50. */
export function parseHelpAmountCents(raw: string | undefined | null): number | null {
  const text = String(raw ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/^R\$/i, "");
  if (!text) return null;
  let normalized = text;
  if (text.includes(",")) {
    normalized = text.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    normalized = text.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  if (!Number.isFinite(cents) || cents < 100 || cents > 10_000_000) return null;
  return cents;
}
