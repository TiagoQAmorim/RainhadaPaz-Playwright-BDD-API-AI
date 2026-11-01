import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "admin_flash";

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

export async function setAdminFlash(kind: AdminFlashKind) {
  const store = await cookies();
  store.set(COOKIE_NAME, kind, {
    httpOnly: true,
    path: "/admin",
    maxAge: 120,
    sameSite: "lax",
  });
}

/** Define o aviso e redireciona (use após `revalidatePath`). */
export async function redirectWithAdminFlash(
  path: string,
  kind: AdminFlashKind,
): Promise<never> {
  await setAdminFlash(kind);
  redirect(path);
}

/** Lê e remove o aviso (uma vez por requisição). */
export async function consumeAdminFlash(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw || !(raw in MESSAGES)) return null;
  store.delete(COOKIE_NAME);
  return adminFlashMessage(raw as AdminFlashKind);
}
