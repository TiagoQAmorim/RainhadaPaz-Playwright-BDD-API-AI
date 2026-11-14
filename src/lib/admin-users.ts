const MIN_PASSWORD_LENGTH = 8;

export function normalizeAdminEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateAdminEmail(email: string): string | null {
  const v = normalizeAdminEmail(email);
  if (!v) return "Informe o e-mail.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "E-mail inválido.";
  return null;
}

export function validateAdminName(name: string): string | null {
  const v = name.trim();
  if (v.length < 2) return "Informe o nome (mínimo 2 caracteres).";
  if (v.length > 120) return "Nome muito longo.";
  return null;
}

export function validateNewAdminPassword(
  password: string,
  confirm: string,
): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (password !== confirm) return "As senhas não coincidem.";
  return null;
}