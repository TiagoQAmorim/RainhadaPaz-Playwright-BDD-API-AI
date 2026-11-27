import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createWorkComparison,
  createWorkMoment,
  createWorkPhoto,
  deleteWorkComparison,
  deleteWorkMoment,
  deleteWorkPhoto,
  updateWorkComparison,
  updateWorkMoment,
  updateWorkPhoto,
  updateWorkProject,
} from "@/app/admin/obra/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import {
  adminBtn,
  adminCard,
  adminFormEncType,
  adminInput,
  adminLink,
  adminTextarea,
} from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { WORK_STATUSES, getParishWork, workStatusLabel } from "@/lib/parish-work";

export const dynamic = "force-dynamic";

export default async function AdminObraPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const { erro } = await searchParams;
  const { project, comparisons, moments, photos } = await getParishWork();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/obra" className={adminLink} target="_blank">
          Ver página da obra
        </Link>
      </div>

      {erro ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{erro}</p>
      ) : null}

      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Obra da paróquia</h1>
        <p className="mt-1 text-sm text-parish-600">
          O botão <strong>A obra</strong> só entra no banner da home se você marcar a opção abaixo. O menu
          Doações continua no site. Aqui entram as fotos, o antes e depois e as etapas.
        </p>
        <form action={updateWorkProject} className="mt-5 space-y-3">
          <label className="block text-sm font-medium">
            Título
            <input name="title" defaultValue={project.title} required className={`${adminInput} mt-1`} />
          </label>
          <label className="block text-sm font-medium">
            Texto de abertura
            <textarea name="intro" rows={4} defaultValue={project.intro} className={`${adminTextarea} mt-1 font-sans`} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Evolução (%)
              <input
                name="progressPercent"
                type="number"
                min={0}
                max={100}
                defaultValue={project.progressPercent}
                className={`${adminInput} mt-1`}
              />
            </label>
            <label className="block text-sm font-medium">
              Nome da etapa atual
              <input
                name="progressLabel"
                defaultValue={project.progressLabel}
                placeholder="Ex.: Telhado"
                className={`${adminInput} mt-1`}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={project.published} />
            Página visível no site
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="showHeroCta" defaultChecked={project.showHeroCta} />
            Mostrar o botão A obra no banner da home
          </label>
          <button type="submit" className={adminBtn}>
            Salvar texto
          </button>
        </form>
      </section>

      <section className={adminCard}>
        <h2 className="text-lg font-semibold text-parish-900">Antes e depois</h2>
        <p className="mt-1 text-sm text-parish-600">
          Pode cadastrar vários. Cada par de fotos do mesmo lugar vira um comparativo na página, lado a lado.
        </p>
        <ul className="mt-4 divide-y divide-parish-100">
          {comparisons.map((item) => (
            <li key={item.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.beforeUrl} alt="" className="h-14 w-20 rounded-lg object-cover" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.afterUrl} alt="" className="h-14 w-20 rounded-lg object-cover" />
                  <div>
                    <p className="font-medium text-parish-900">{item.title}</p>
                    <p className="text-xs text-parish-500">Ordem {item.sortOrder}</p>
                  </div>
                </div>
                <AdminConfirmDeleteForm action={deleteWorkComparison} confirmMessage="Excluir este comparativo?">
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="text-sm font-medium text-red-600">
                    Excluir
                  </button>
                </AdminConfirmDeleteForm>
              </div>
              <details className="mt-2">
                <summary className="w-fit cursor-pointer text-sm font-semibold text-parish-700">Editar</summary>
                <form action={updateWorkComparison} encType={adminFormEncType} className="mt-3 grid gap-3 rounded-xl border border-parish-100 bg-parish-50/70 p-4">
                  <input type="hidden" name="id" value={item.id} />
                  <label className="text-sm font-medium">
                    Nome do lugar
                    <input name="title" required defaultValue={item.title} className={`${adminInput} mt-1`} />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-medium">
                      Trocar foto do antes
                      <input name="beforeFile" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm" />
                    </label>
                    <label className="text-sm font-medium">
                      Trocar foto do depois
                      <input name="afterFile" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm" />
                    </label>
                  </div>
                  <p className="text-xs text-parish-500">Sem arquivo novo, as fotos atuais permanecem.</p>
                  <label className="text-sm font-medium">
                    Legenda
                    <input name="caption" defaultValue={item.caption} className={`${adminInput} mt-1`} />
                  </label>
                  <label className="text-sm font-medium">
                    Ordem
                    <input name="sortOrder" type="number" defaultValue={item.sortOrder} className={`${adminInput} mt-1 max-w-[8rem]`} />
                  </label>
                  <button type="submit" className={adminBtn}>
                    Salvar comparativo
                  </button>
                </form>
              </details>
            </li>
          ))}
        </ul>
        <form action={createWorkComparison} encType={adminFormEncType} className="mt-4 grid gap-3 border-t border-parish-100 pt-4">
          <label className="text-sm font-medium">
            Nome do lugar
            <input name="title" required placeholder="Fachada" className={`${adminInput} mt-1`} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Foto do antes
              <input name="beforeFile" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-1 block w-full text-sm" />
            </label>
            <label className="text-sm font-medium">
              Foto do depois
              <input name="afterFile" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-1 block w-full text-sm" />
            </label>
          </div>
          <label className="text-sm font-medium">
            Legenda (opcional)
            <input name="caption" className={`${adminInput} mt-1`} />
          </label>
          <label className="text-sm font-medium">
            Ordem
            <input name="sortOrder" type="number" placeholder="Automática" className={`${adminInput} mt-1 max-w-[8rem]`} />
          </label>
          <button type="submit" className={adminBtn}>
            Publicar comparativo
          </button>
        </form>
      </section>

      <section className={adminCard}>
        <h2 className="text-lg font-semibold text-parish-900">Evolução</h2>
        <p className="mt-1 text-sm text-parish-600">Cada linha é uma etapa, na ordem em que aparece no site.</p>
        <ul className="mt-4 divide-y divide-parish-100">
          {moments.map((item) => (
            <li key={item.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-parish-900">{item.title}</p>
                  <p className="text-xs text-parish-500">
                    {[item.happenedOn, workStatusLabel(item.status), `ordem ${item.sortOrder}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <AdminConfirmDeleteForm action={deleteWorkMoment} confirmMessage="Excluir esta etapa?">
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="text-sm font-medium text-red-600">
                    Excluir
                  </button>
                </AdminConfirmDeleteForm>
              </div>
              <details className="mt-2">
                <summary className="w-fit cursor-pointer text-sm font-semibold text-parish-700">Editar</summary>
                <form action={updateWorkMoment} encType={adminFormEncType} className="mt-3 grid gap-3 rounded-xl border border-parish-100 bg-parish-50/70 p-4">
                  <input type="hidden" name="id" value={item.id} />
                  <label className="text-sm font-medium">
                    Etapa
                    <input name="title" required defaultValue={item.title} className={`${adminInput} mt-1`} />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-medium">
                      Quando
                      <input name="happenedOn" defaultValue={item.happenedOn} className={`${adminInput} mt-1`} />
                    </label>
                    <label className="text-sm font-medium">
                      Situação
                      <select name="status" defaultValue={item.status} className={`${adminInput} mt-1`}>
                        {WORK_STATUSES.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="text-sm font-medium">
                    Texto
                    <textarea name="body" rows={3} defaultValue={item.body} className={`${adminTextarea} mt-1 font-sans`} />
                  </label>
                  <label className="text-sm font-medium">
                    Trocar foto
                    <input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm" />
                  </label>
                  <p className="text-xs text-parish-500">Sem arquivo novo, a foto atual permanece.</p>
                  <label className="text-sm font-medium">
                    Ordem
                    <input name="sortOrder" type="number" defaultValue={item.sortOrder} className={`${adminInput} mt-1 max-w-[8rem]`} />
                  </label>
                  <button type="submit" className={adminBtn}>
                    Salvar etapa
                  </button>
                </form>
              </details>
            </li>
          ))}
        </ul>
        <form action={createWorkMoment} encType={adminFormEncType} className="mt-4 grid gap-3 border-t border-parish-100 pt-4">
          <label className="text-sm font-medium">
            Etapa
            <input name="title" required placeholder="Troca do telhado" className={`${adminInput} mt-1`} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Quando
              <input name="happenedOn" placeholder="Março de 2026" className={`${adminInput} mt-1`} />
            </label>
            <label className="text-sm font-medium">
              Situação
              <select name="status" defaultValue="doing" className={`${adminInput} mt-1`}>
                {WORK_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="text-sm font-medium">
            Texto
            <textarea name="body" rows={3} className={`${adminTextarea} mt-1 font-sans`} />
          </label>
          <label className="text-sm font-medium">
            Foto (opcional)
            <input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm" />
          </label>
          <label className="text-sm font-medium">
            Ordem
            <input name="sortOrder" type="number" placeholder="Automática" className={`${adminInput} mt-1 max-w-[8rem]`} />
          </label>
          <button type="submit" className={adminBtn}>
            Publicar etapa
          </button>
        </form>
      </section>

      <section className={adminCard}>
        <h2 className="text-lg font-semibold text-parish-900">Galeria</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {photos.map((photo) => (
            <li key={photo.id} className="rounded-xl border border-parish-100 p-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.imageUrl} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                  <p className="truncate text-sm text-parish-800">{photo.caption || "Sem legenda"}</p>
                </div>
                <AdminConfirmDeleteForm action={deleteWorkPhoto} confirmMessage="Excluir esta foto?">
                  <input type="hidden" name="id" value={photo.id} />
                  <button type="submit" className="text-sm font-medium text-red-600">
                    Excluir
                  </button>
                </AdminConfirmDeleteForm>
              </div>
              <details className="mt-2 px-1">
                <summary className="w-fit cursor-pointer text-sm font-semibold text-parish-700">Editar</summary>
                <form action={updateWorkPhoto} encType={adminFormEncType} className="mt-3 grid gap-3">
                  <input type="hidden" name="id" value={photo.id} />
                  <label className="text-sm font-medium">
                    Trocar foto
                    <input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm" />
                  </label>
                  <label className="text-sm font-medium">
                    Legenda
                    <input name="caption" defaultValue={photo.caption} className={`${adminInput} mt-1`} />
                  </label>
                  <label className="text-sm font-medium">
                    Ordem
                    <input name="sortOrder" type="number" defaultValue={photo.sortOrder} className={`${adminInput} mt-1 max-w-[8rem]`} />
                  </label>
                  <button type="submit" className={adminBtn}>
                    Salvar foto
                  </button>
                </form>
              </details>
            </li>
          ))}
        </ul>
        <form action={createWorkPhoto} encType={adminFormEncType} className="mt-4 grid gap-3 border-t border-parish-100 pt-4">
          <label className="text-sm font-medium">
            Foto
            <input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-1 block w-full text-sm" />
          </label>
          <label className="text-sm font-medium">
            Legenda
            <input name="caption" className={`${adminInput} mt-1`} />
          </label>
          <button type="submit" className={adminBtn}>
            Publicar foto
          </button>
        </form>
      </section>
    </div>
  );
}
