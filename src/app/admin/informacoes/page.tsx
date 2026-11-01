import { redirect } from "next/navigation";
import {
  createPage,
  deletePage,
  updatePage,
  updateSiteSettings,
} from "@/app/admin/actions";
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
import { getSiteSettings } from "@/lib/settings";

export default async function AdminInformacoesPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const [s, pages] = await Promise.all([
    getSiteSettings(),
    prisma.page.findMany({ orderBy: { title: "asc" } }),
  ]);

  return (
    <div className="space-y-10">
      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Informações gerais do site</h1>
        <p className="mt-1 text-sm text-parish-600">
          Contato, textos da home, institucional e redes sociais.
        </p>
        <form action={updateSiteSettings} encType={adminFormEncType} className="mt-6 space-y-3">
          <Field label="Nome da paróquia" name="parishName" defaultValue={s.parishName} />
          <Field label="Diocese" name="diocese" defaultValue={s.diocese} />
          <Field label="Endereço principal" name="address" defaultValue={s.address} />
          <Field label="Telefone" name="phone" defaultValue={s.phone} />
          <Field label="E-mail geral de contato" name="email" defaultValue={s.email ?? ""} />
          <p className="text-xs text-parish-500">
            Para velas virtuais, o destino das orações pode ser definido em{" "}
            <a href="/admin/velas" className="font-semibold text-parish-700 underline">
              Admin → Velas
            </a>
            .
          </p>
          <p className="text-sm text-parish-600">
            No banner da home, o título principal é o <strong>nome da paróquia</strong> (campo acima).
          </p>
          <Field
            label="Frase do banner (texto menor)"
            name="heroTitle"
            defaultValue={s.heroTitle}
          />
          <TextArea
            label="Texto complementar do banner"
            name="heroSubtitle"
            defaultValue={s.heroSubtitle}
            rows={2}
          />
          <TextArea label="Sobre (HTML)" name="aboutHtml" defaultValue={s.aboutHtml} rows={5} />
          <Field label="Instagram" name="instagramUrl" defaultValue={s.instagramUrl ?? ""} />
          <Field label="Facebook" name="facebookUrl" defaultValue={s.facebookUrl ?? ""} />
          <Field label="YouTube" name="youtubeUrl" defaultValue={s.youtubeUrl ?? ""} />
          <AdminImageField
            label="Logo"
            name="logoUrl"
            fileFieldName="logoUrlFile"
            defaultValue={s.logoUrl}
          />
          <AdminImageField
            label="Imagem do banner (home)"
            name="heroImageUrl"
            fileFieldName="heroImageUrlFile"
            defaultValue={s.heroImageUrl}
          />
          <AdminImageField
            label="Foto da Matriz"
            name="matrizImageUrl"
            fileFieldName="matrizImageUrlFile"
            defaultValue={s.matrizImageUrl}
          />
          <AdminImageField
            label="Foto da Capela"
            name="capelaImageUrl"
            fileFieldName="capelaImageUrlFile"
            defaultValue={s.capelaImageUrl}
          />
          <input type="hidden" name="massScheduleHtml" value={s.massScheduleHtml} />
          <input type="hidden" name="youtubeChannelUrl" value={s.youtubeChannelUrl ?? ""} />
          <input type="hidden" name="tercoOnlineSchedule" value={s.tercoOnlineSchedule ?? ""} />
          <input type="hidden" name="tercoOnlineLink" value={s.tercoOnlineLink ?? ""} />
          <button type="submit" className={adminBtn}>
            Salvar informações
          </button>
        </form>
      </section>

      <section className={`${adminCard} border-l-4 border-gold-500`}>
        <p className="text-sm text-parish-700">
          <strong>Terço online:</strong> horário, link e edição da página em{" "}
          <a href="/admin/terco-online" className="font-semibold text-parish-900 underline">
            Admin → Terço online
          </a>
          .
        </p>
      </section>

      <section className={adminCard}>
        <h2 className="text-lg font-semibold">Páginas de conteúdo</h2>
        <p className="mt-1 text-sm text-parish-600">
          Institucional, sacramentos e outras páginas. Cada item tem botão{" "}
          <strong>Salvar</strong> ao final do formulário.
        </p>
        <form
          action={createPage}
          encType={adminFormEncType}
          className="mt-6 space-y-3 border-t border-parish-100 pt-6"
        >
          <h3 className="font-medium">Nova página</h3>
          <Field label="Título" name="title" required />
          <Field label="Slug (opcional)" name="slug" placeholder="ex: crisma" />
          <AdminImageField
            label="Imagem de destaque (opcional)"
            name="featuredImage"
            fileFieldName="featuredImageFile"
          />
          <TextArea label="Conteúdo (HTML)" name="body" rows={4} required />
          <button type="submit" className={adminBtn}>
            Cadastrar página
          </button>
        </form>

        <ul className="mt-8 space-y-6">
          {[...pages]
            .sort((a, b) => {
              if (a.slug === "terco-online") return -1;
              if (b.slug === "terco-online") return 1;
              return a.title.localeCompare(b.title, "pt-BR");
            })
            .map((page) => (
            <li
              key={page.id}
              className={`rounded-xl border p-4 ${
                page.slug === "terco-online"
                  ? "border-gold-400 bg-gold-50/40"
                  : "border-parish-100"
              }`}
            >
              {page.slug === "terco-online" ? (
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gold-700">
                  Também editável em Admin → Terço online
                </p>
              ) : null}
              <form action={updatePage} encType={adminFormEncType} className="space-y-2">
                <input type="hidden" name="id" value={page.id} />
                <Field label="Título" name="title" defaultValue={page.title} />
                <Field label="Slug" name="slug" defaultValue={page.slug} />
                <AdminImageField
                  label="Imagem de destaque"
                  name="featuredImage"
                  fileFieldName="featuredImageFile"
                  defaultValue={page.featuredImage}
                />
                <TextArea label="Conteúdo" name="body" defaultValue={page.body} rows={4} />
                <button type="submit" className={adminBtn}>
                  Salvar
                </button>
              </form>
              <form action={deletePage} className="mt-2">
                <input type="hidden" name="id" value={page.id} />
                <button type="submit" className={adminBtnDanger}>
                  Excluir página
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className={adminInput}
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        required={required}
        className={adminTextarea}
      />
    </div>
  );
}
