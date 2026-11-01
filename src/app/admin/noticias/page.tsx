import { redirect } from "next/navigation";
import { deletePost, upsertPost } from "@/app/admin/actions";
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
import { prisma } from "@/lib/prisma";

export default async function AdminNoticiasPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const posts = await prisma.post.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <div className="space-y-8">
      <form action={upsertPost} encType={adminFormEncType} className={`${adminCard} space-y-3`}>
        <h1 className="text-lg font-semibold">Nova notícia</h1>
        <input name="title" placeholder="Título" required className={adminInput} />
        <input name="slug" placeholder="slug-opcional" className={adminInput} />
        <input name="excerpt" placeholder="Resumo" required className={adminInput} />
        <AdminImageField
          label="Imagem de capa (opcional)"
          name="coverImage"
          fileFieldName="coverImageFile"
        />
        <textarea name="body" placeholder="Conteúdo (HTML)" rows={6} required className={adminTextarea} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" /> Publicar
        </label>
        <button type="submit" className={adminBtn}>
          Cadastrar notícia
        </button>
      </form>

      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.id} className={adminCard}>
            <form action={upsertPost} encType={adminFormEncType} className="space-y-2">
              <input type="hidden" name="id" value={post.id} />
              <input name="title" defaultValue={post.title} className={adminInput} />
              <input name="slug" defaultValue={post.slug} className={adminInput} />
              <input name="excerpt" defaultValue={post.excerpt} className={adminInput} />
              <AdminImageField
                label="Capa"
                name="coverImage"
                fileFieldName="coverImageFile"
                defaultValue={post.coverImage}
              />
              <textarea name="body" defaultValue={post.body} rows={4} className={adminTextarea} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="published" defaultChecked={post.published} /> Publicado
              </label>
              <button type="submit" className={adminBtn}>
                Salvar
              </button>
            </form>
            <form action={deletePost} className="mt-2">
              <input type="hidden" name="id" value={post.id} />
              <button type="submit" className={adminBtnDanger}>
                Excluir notícia
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
