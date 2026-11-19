import Link from "next/link";
import { redirect } from "next/navigation";
import { updateSearchAppearance } from "@/app/admin/actions";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { adminBtn, adminCard, adminFormEncType, adminLink } from "@/components/admin/AdminFormStyles";
import { SearchResultFields } from "@/components/admin/SearchResultFields";
import { getSessionAdmin } from "@/lib/auth";
import { publicSiteUrl } from "@/lib/site-url";
import { getSiteSettings, searchAppearance } from "@/lib/settings";

export default async function AdminBuscaPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const settings = await getSiteSettings();
  const search = searchAppearance(settings);
  const host = publicSiteUrl().replace(/^https?:\/\//, "");

  return (
    <div className="space-y-6">
      <Link href="/admin/informacoes" className={adminLink}>
        ← Voltar às informações
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Resultado da busca</h1>
        <p className="mt-1 text-sm text-parish-600">
          Este título, este texto e esta foto são o que pedimos ao Google e ao WhatsApp. O ícone
          pequeno ao lado do nome continua sendo o selo da paróquia. Depois de salvar, a busca pode
          levar alguns dias para trocar.
        </p>
        <form action={updateSearchAppearance} encType={adminFormEncType} className="mt-6 space-y-4">
          <SearchResultFields
            defaultTitle={settings.searchTitle ?? ""}
            defaultDescription={settings.searchDescription ?? ""}
            fallbackTitle={settings.parishName}
            fallbackDescription={settings.heroSubtitle}
            imageUrl={search.image}
            siteHost={host}
          />
          <AdminImageField
            label="Foto do resultado"
            name="searchImageUrl"
            fileFieldName="searchImageUrlFile"
            defaultValue={settings.searchImageUrl}
          />
          <p className="text-xs text-parish-500">
            Uma foto larga, de preferência da igreja. Se ficar vazia, usamos a primeira foto do
            banner. O Google ainda pode escolher outra imagem da página por alguns dias.
          </p>
          <button type="submit" className={adminBtn}>
            Salvar resultado da busca
          </button>
        </form>
      </section>
    </div>
  );
}
