import { redirect } from "next/navigation";

export type AdminFlashKind = "created" | "updated" | "deleted" | "drawn";

const MESSAGES: Record<AdminFlashKind, string> = {
  created: "Cadastro realizado com sucesso.",
  updated: "Alterações salvas com sucesso.",
  deleted: "Exclusão realizada com sucesso.",
  drawn: "Sorteio realizado com sucesso. O nome do ganhador foi preenchido automaticamente.",
};

export function adminFlashMessage(kind: AdminFlashKind): string {
  return MESSAGES[kind];
}

export function isAdminFlashKind(value: string | null): value is AdminFlashKind {
  return value !== null && value in MESSAGES;
}

/** Redireciona com parâmetro `flash` na URL (compatível com RSC). */
export async function redirectWithAdminFlash(
  path: string,
  kind: AdminFlashKind,
): Promise<never> {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}flash=${kind}`);
}
