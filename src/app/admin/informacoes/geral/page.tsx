import Link from "next/link";
import { redirect } from "next/navigation";
import { updateSiteSettings } from "@/app/admin/actions";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { AdminRichTextField } from "@/components/admin/AdminRichTextField";
import {
  adminBtn,
  adminCard,
  adminFormEncType,
  adminInput,
  adminLink,
  adminTextarea,
} from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export default async function AdminInformacoesGeralPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const s = await getSiteSettings();

  return (
    <div className="space-y-6">
      <Link href="/admin/informacoes" className={adminLink}>
        ← Voltar às informações
      </Link>
      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Dados gerais</h1>
        <form action={updateSiteSettings} encType={adminFormEncType} className="mt-6 space-y-3">
          <Field label="Nome da paróquia" name="parishName" defaultValue={s.parishName} />
          <Field label="Diocese" name="diocese" defaultValue={s.diocese} />
          <Field label="Endereço principal" name="address" defaultValue={s.address} />
          <Field label="Telefone" name="phone" defaultValue={s.phone} />
          <Field label="E-mail geral" name="email" defaultValue={s.email ?? ""} />
          <Field label="Frase do banner" name="heroTitle" defaultValue={s.heroTitle} />
          <TextArea label="Texto complementar do banner" name="heroSubtitle" defaultValue={s.heroSubtitle} rows={2} />
          <AdminRichTextField label="Sobre a paróquia" name="aboutHtml" defaultValue={s.aboutHtml} />
          <AdminImageField
            label="Banner da página institucional"
            name="aboutBannerUrl"
            fileFieldName="aboutBannerUrlFile"
            defaultValue={s.aboutBannerUrl}
          />
          <p className="-mt-1 text-xs text-parish-500">
            Fica acima do texto, na largura da coluna, na proporção 960×350 e com cantos arredondados.
          </p>
          <input type="hidden" name="showMatrizMap" value="off" />
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-parish-200 bg-parish-50/60 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="showMatrizMap"
              value="on"
              defaultChecked={s.showMatrizMap}
              className="mt-1"
            />
            <span>
              <strong className="text-parish-900">Mostrar mapa da Matriz</strong>
              <span className="mt-1 block text-parish-600">
                R. Sócrates, 813 — Vila Sofia, São Paulo — SP, CEP 04671-072
              </span>
            </span>
          </label>
          <input type="hidden" name="showCapelaMap" value="off" />
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-parish-200 bg-parish-50/60 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="showCapelaMap"
              value="on"
              defaultChecked={s.showCapelaMap}
              className="mt-1"
            />
            <span>
              <strong className="text-parish-900">Mostrar mapa da Capela do Colégio Santa Maria</strong>
              <span className="mt-1 block text-parish-600">
                Av. Sargento Geraldo Sant&apos;Ana, 901 – Jardim Marajoara, São Paulo – SP, CEP 04674-225
              </span>
            </span>
          </label>
          <Field label="Instagram" name="instagramUrl" defaultValue={s.instagramUrl ?? ""} />
          <Field label="Facebook" name="facebookUrl" defaultValue={s.facebookUrl ?? ""} />
          <Field label="YouTube" name="youtubeUrl" defaultValue={s.youtubeUrl ?? ""} />
          <AdminImageField label="Logo" name="logoUrl" fileFieldName="logoUrlFile" defaultValue={s.logoUrl} />
          <AdminImageField label="Banner — foto 1" name="heroImageUrl" fileFieldName="heroImageUrlFile" defaultValue={s.heroImageUrl} />
          <AdminImageField label="Banner — foto 2" name="heroImageUrl2" fileFieldName="heroImageUrl2File" defaultValue={s.heroImageUrl2} />
          <AdminImageField label="Banner — foto 3" name="heroImageUrl3" fileFieldName="heroImageUrl3File" defaultValue={s.heroImageUrl3} />
          <AdminImageField label="Foto da Matriz" name="matrizImageUrl" fileFieldName="matrizImageUrlFile" defaultValue={s.matrizImageUrl} />
          <AdminImageField label="Foto da Capela" name="capelaImageUrl" fileFieldName="capelaImageUrlFile" defaultValue={s.capelaImageUrl} />
          <input type="hidden" name="massScheduleHtml" value={s.massScheduleHtml} />
          <input type="hidden" name="youtubeChannelUrl" value={s.youtubeChannelUrl ?? ""} />
          <input type="hidden" name="tercoOnlineSchedule" value={s.tercoOnlineSchedule ?? ""} />
          <input type="hidden" name="tercoOnlineLink" value={s.tercoOnlineLink ?? ""} />
          <button type="submit" className={adminBtn}>
            Salvar informações
          </button>
        </form>
      </section>
    </div>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input name={name} defaultValue={defaultValue} className={adminInput} />
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <textarea name={name} rows={rows ?? 3} defaultValue={defaultValue} className={adminTextarea} />
    </div>
  );
}