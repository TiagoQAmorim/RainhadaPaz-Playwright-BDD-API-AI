import { redirect } from "next/navigation";
import { deleteNotice, upsertNotice } from "@/app/admin/actions";
import { AdminImageField } from "@/components/admin/AdminImageField";
import {
  adminBtn,
  adminCard,
  adminInput,
  adminTextarea,
  adminBtnDanger,
  adminFormEncType,
} from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { noticeVisibleOnSite, toDatetimeLocalValue } from "@/lib/datetime-local";
import { prisma } from "@/lib/prisma";

export default async function AdminAvisosPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const notices = await prisma.notice.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <div className="space-y-8">
      <form action={upsertNotice} encType={adminFormEncType} className={`${adminCard} space-y-3`}>
        <h1 className="text-lg font-semibold">Novo aviso</h1>
        <p className="text-sm text-parish-600">
          Avisos curtos para a paróquia. Aparecem em /avisos.
        </p>
        <input name="title" placeholder="Título" required className={adminInput} />
        <AdminImageField
          label="Imagem de ilustração (opcional)"
          name="coverImage"
          fileFieldName="coverImageFile"
        />
        <textarea
          name="body"
          placeholder="Texto (pode usar HTML simples)"
          rows={4}
          required
          className={adminTextarea}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="published" value="off" />
          <input type="checkbox" name="published" value="on" defaultChecked /> Publicar no site
        </label>
        <p className="text-xs text-parish-500">
          Para agendar ocultação, cadastre o aviso e use o campo &quot;Ocultar após&quot; ao editar.
        </p>
        <button type="submit" className={adminBtn}>
          Cadastrar aviso
        </button>
      </form>

      <ul className="space-y-4">
        {notices.map((n) => {
          const onSite = noticeVisibleOnSite(n);
          return (
          <li key={n.id} className={adminCard}>
            <p className="mb-2 text-sm">
              {onSite ? (
                <span className="font-semibold text-green-700">Visível em /avisos e na home</span>
              ) : n.published && n.expiresAt ? (
                <span className="font-semibold text-amber-800">
                  Publicado, mas oculto — data de expiração já passou (
                  {n.expiresAt.toLocaleString("pt-BR")}). Limpe o campo abaixo e salve.
                </span>
              ) : (
                <span className="font-semibold text-parish-600">Rascunho (não publicado)</span>
              )}
            </p>
            <form action={upsertNotice} encType={adminFormEncType} className="space-y-2">
              <input type="hidden" name="id" value={n.id} />
              <input name="title" defaultValue={n.title} className={adminInput} />
              <AdminImageField
                label="Imagem"
                name="coverImage"
                fileFieldName="coverImageFile"
                defaultValue={n.coverImage}
              />
              <textarea name="body" defaultValue={n.body} rows={4} className={adminTextarea} />
              <label className="block text-sm">
                <span className="font-medium">Ocultar após (opcional)</span>
                <input
                  name="expiresAt"
                  type="datetime-local"
                  defaultValue={toDatetimeLocalValue(n.expiresAt)}
                  className={`${adminInput} mt-1`}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="hidden" name="published" value="off" />
                <input
                  type="checkbox"
                  name="published"
                  value="on"
                  defaultChecked={n.published}
                />{" "}
                Publicado
              </label>
              <button type="submit" className={adminBtn}>
                Salvar
              </button>
            </form>
            <form action={deleteNotice} className="mt-2">
              <input type="hidden" name="id" value={n.id} />
              <button type="submit" className={adminBtnDanger}>
                Excluir
              </button>
            </form>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
