const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Separa e-mails por vírgula, ponto e vírgula ou quebra de linha. */
export function parseNotifyEmails(raw: string | null | undefined): string[] {
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const part of (raw ?? "").split(/[\s,;]+/)) {
    const email = part.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    emails.push(email);
  }
  return emails;
}

export function normalizeNotifyEmailList(raw: string): { ok: true; stored: string | null } | { ok: false; message: string } {
  const emails = parseNotifyEmails(raw);
  if (emails.length > 20) {
    return { ok: false, message: "Cadastre no máximo 20 e-mails para a lista da semana." };
  }
  for (const email of emails) {
    if (email.length > 180 || !EMAIL_RE.test(email)) {
      return { ok: false, message: "Um dos e-mails da lista não é válido." };
    }
  }
  return { ok: true, stored: emails.length ? emails.join("\n") : null };
}
