/** Endereço público do site, sem barra no final. Usado na prévia do Google. */
export function publicSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://paroquiarainhadapaz.com.br";
  return raw.replace(/\/$/, "");
}
