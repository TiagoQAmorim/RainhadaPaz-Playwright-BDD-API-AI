import { redirect } from "next/navigation";

export type AdminFlashKind =
  | "created"
  | "updated"
  | "deleted"
  | "drawn"
  | "restored"
  | "backed"
  | "hidden"
  | "shown"
  | "image";

const MESSAGES: Record<AdminFlashKind, string> = {
  created: "Cadastro realizado com sucesso.",
  updated: "Alterações salvas com sucesso.",
  deleted: "Exclusão realizada com sucesso.",
  drawn: "Sorteio gravado no histórico, com data e horário.",
  restored:
    "Banco restaurado a partir do último backup de produção (/data/backups) — o que estava cadastrado no servidor.",
  backed: "Backup de hoje gravado em /data/backups. O site em uso não foi alterado.",
  hidden: "Página oculta. Ela saiu do site e continua nesta lista.",
  shown: "Página visível de novo no site.",
  image: "A foto não foi salva. Envie JPEG, PNG ou WebP. Fotos HEIC do celular precisam ser convertidas para JPEG.",
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
