/** Valor para `<input type="datetime-local">` no fuso do navegador/servidor. */
export function toDatetimeLocalValue(value: Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

/** Lê o valor enviado por `datetime-local` (horário local, sem fuso na string). */
export function parseDatetimeLocalField(value: string): Date | null {
  const v = value.trim();
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function noticeVisibleOnSite(notice: {
  published: boolean;
  expiresAt: Date | null;
}, now: Date = new Date()): boolean {
  if (!notice.published) return false;
  if (notice.expiresAt == null) return true;
  return notice.expiresAt.getTime() > now.getTime();
}

/** Ignora datas de expiração no passado (evita ocultar aviso por engano). */
export function normalizeNoticeExpiresAt(
  expiresAt: Date | null,
  now: Date = new Date(),
): Date | null {
  if (!expiresAt) return null;
  return expiresAt.getTime() > now.getTime() ? expiresAt : null;
}

/** Checkbox + hidden `off` no formulário (funciona com multipart). */
export function formCheckboxOn(formData: FormData, name: string): boolean {
  return formData.getAll(name).includes("on");
}
